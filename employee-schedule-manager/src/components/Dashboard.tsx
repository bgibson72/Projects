import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ShiftCoverageRequest } from '../types/shiftCoverageTypes';
import { AlertTriangle } from 'lucide-react';
import ShiftCoverageRequestComponent from './ShiftCoverageRequest';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [shiftCoverageRequests, setShiftCoverageRequests] = useState<ShiftCoverageRequest[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  // Fetch all data
  useEffect(() => {
    const fetchShifts = async () => {
      const querySnapshot = await getDocs(collection(db, 'shifts'));
      setShifts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    const fetchEmployees = async () => {
      const querySnapshot = await getDocs(collection(db, 'employees'));
      setEmployees(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    const fetchCoverageRequests = async () => {
      const querySnapshot = await getDocs(collection(db, 'shiftCoverageRequests'));
      setShiftCoverageRequests(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShiftCoverageRequest[]);
    };
    const fetchAnnouncements = async () => {
      const querySnapshot = await getDocs(collection(db, 'announcements'));
      setAnnouncements(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchShifts();
    fetchEmployees();
    fetchCoverageRequests();
    fetchAnnouncements();
  }, []);

  // Claim a coverage request
  const handleClaim = async (req: ShiftCoverageRequest) => {
    try {
      const functions = getFunctions();
      const claim = httpsCallable(functions, 'claimShiftCoverageRequest');
      await claim({ requestId: req.id });
      setNotification('You have claimed this shift.');
    } catch (err: any) {
      setError(err.message || 'Failed to claim shift.');
    }
  };

  // Return a claimed shift
  const handleReturn = async (req: ShiftCoverageRequest) => {
    try {
      const functions = getFunctions();
      const ret = httpsCallable(functions, 'returnShiftCoverageRequest');
      await ret({ requestId: req.id });
      setNotification('You have returned this shift to open coverage.');
    } catch (err: any) {
      setError(err.message || 'Failed to return shift.');
    }
  };

  // Weekly Overview logic
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: endOfWeek(currentWeekStart, { weekStartsOn: 0 }) });
  const getEmployeeName = (emp: any) => emp ? `${emp.firstName} ${emp.lastName}` : '';
  const shortTime = (time: string) => {
    const [h, m, period] = time.split(/:| /);
    let hour = parseInt(h, 10);
    let ampm = period ? period.toLowerCase() : '';
    if (hour === 0) hour = 12;
    if (hour > 12) hour -= 12;
    return `${hour}${ampm}`;
  };
  // Find if a shift is up for coverage
  const isShiftUpForCoverage = (shift: any) =>
    shiftCoverageRequests.some(req => req.shiftId === shift.id && req.status === 'Open');

  // Weekly Overview Card
  const WeeklyOverview = (
    <div className="bg-white text-bradley-dark-gray p-6 rounded-lg border-2 border-bradley-medium-gray shadow-[0_6px_0_0_#939598FF] mb-6 dark:bg-bradley-dark-card dark:text-bradley-dark-card-text dark:border-bradley-light-gray dark:shadow-[0_6px_0_0_#E2E8F0FF]">
      <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray dark:text-gray-200">Weekly Overview</h2>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 flex justify-center">
          <span className="text-lg font-bold text-bradley-dark-gray dark:text-gray-200">
            {format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 0 }), 'MMM d')}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full overflow-hidden table-fixed bg-white dark:bg-bradley-dark-card border border-bradley-medium-gray dark:border-bradley-light-gray">
          <colgroup>
            {Array.from({ length: 7 }).map((_, i) => (
              <col key={i} style={{ width: '120px' }} />
            ))}
          </colgroup>
          <thead className="bg-bradley-light-gray dark:bg-bradley-dark-surface">
            <tr>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                <th
                  key={d}
                  className="px-2 py-2 text-center border-r last:border-r-0 border-bradley-medium-gray font-medium text-bradley-dark-gray dark:text-bradley-light-gray"
                  style={{ width: '120px' }}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {weekDays.map((day, j) => (
                <td
                  key={j}
                  className="h-24 align-top px-2 py-1 border-t border-bradley-medium-gray border-r last:border-r-0 bg-bradley-med-gray"
                  style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}
                >
                  <div className="text-xs font-semibold mb-1 text-right pr-1">
                    {isSameDay(day, new Date()) ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-bradley-red text-white">{format(day, 'd')}</span>
                    ) : (
                      <span className="text-bradley-dark-gray dark:text-bradley-light-gray">{format(day, 'd')}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {shifts.filter(s => s.date === format(day, 'yyyy-MM-dd')).map(shift => (
                      <div
                        key={shift.id}
                        className="rounded text-xs flex items-center gap-1"
                        style={{ background: (employees.find(e => e.id === shift.employeeId)?.color || shift.color), color: '#fff', padding: '2px 6px' }}
                      >
                        <span className="font-semibold leading-tight">{getEmployeeName(employees.find(e => e.id === shift.employeeId))}</span>
                        <span className="leading-tight text-[11px]">{shortTime(shift.startTime)}-{shortTime(shift.endTime)}</span>
                        {isShiftUpForCoverage(shift) && <AlertTriangle className="inline ml-1 text-yellow-400" size={16} />}
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // Announcements Card
  const AnnouncementsCard = (
    <div className="bg-white text-bradley-dark-gray p-6 rounded-lg border-2 border-bradley-medium-gray shadow-[0_6px_0_0_#939598FF] mb-6 dark:bg-bradley-dark-card dark:text-bradley-dark-card-text dark:border-bradley-light-gray dark:shadow-[0_6px_0_0_#E2E8F0FF]">
      <h2 className="text-xl font-semibold mb-2 text-bradley-dark-gray dark:text-gray-200">Announcements</h2>
      {announcements.length === 0 ? (
        <p className="text-bradley-medium-gray">No announcements.</p>
      ) : (
        <ul className="space-y-2">
          {announcements.map(a => (
            <li className="flex items-center justify-between bg-bradley-light-gray text-bradley-dark-gray p-4 rounded-lg border border-bradley-dark-border">
              <span className="text-bradley-dark-gray text-base">
                {a.content}
              </span>
              {a.expiration && a.expiration instanceof Timestamp && typeof a.expiration.toDate === 'function' && (
                <span className="ml-4 text-xs text-bradley-dark-gray bg-bradley-light-gray px-2 py-1 rounded whitespace-nowrap">
                  Exp {a.expiration.toDate().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  // Shift Coverage Requests Card
  const CoverageRequestsCard = (
    <div className="bg-white text-bradley-dark-gray p-6 rounded-lg border-2 border-bradley-medium-gray shadow-[0_6px_0_0_#939598FF] w-full mb-6 h-full flex-1 flex flex-col dark:bg-bradley-dark-card dark:text-bradley-dark-card-text dark:border-bradley-light-gray dark:shadow-[0_6px_0_0_#E2E8F0FF]">
      <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray dark:text-gray-200">Shift Coverage Requests</h2>
      <div className="overflow-x-auto flex-1 pb-6">
        <table className="min-w-full overflow-hidden table-fixed bg-white dark:bg-bradley-dark-card border border-bradley-medium-gray dark:border-bradley-light-gray">
          <colgroup>
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead className="bg-bradley-light-gray dark:bg-bradley-dark-gray">
            <tr>
              <th className="px-4 py-2 text-left text-bradley-dark-gray dark:text-bradley-light-gray">Date</th>
              <th className="px-4 py-2 text-left text-bradley-dark-gray dark:text-bradley-light-gray">Time</th>
              <th className="px-4 py-2 text-left text-bradley-dark-gray dark:text-bradley-light-gray">Owner</th>
              <th className="px-4 py-2 text-left text-bradley-dark-gray dark:text-bradley-light-gray">Status</th>
              <th className="px-4 py-2 text-left text-bradley-dark-gray dark:text-bradley-light-gray">Action</th>
            </tr>
          </thead>
          <tbody>
            {shiftCoverageRequests.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-bradley-medium-gray bg-white dark:bg-bradley-dark-card">No coverage requests found.</td>
              </tr>
            ) : (
              shiftCoverageRequests.map(req => (
                <tr key={req.id} className="border-t border-bradley-medium-gray dark:border-bradley-dark-border">
                  <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">{req.date}</td>
                  <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">{req.requestedCoverageStart} - {req.requestedCoverageEnd}</td>
                  <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">{req.originalOwnerName}</td>
                  <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">{req.status}</td>
                  <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">
                    {req.status === 'Open' && req.originalOwnerId !== user?.id && (
                      <button className="px-3 py-1 bg-bradley-blue text-white rounded" onClick={() => handleClaim(req)}>Claim</button>
                    )}
                    {req.status === 'Claimed' && req.claimedById === user?.id && (
                      <button className="px-3 py-1 bg-bradley-yellow text-black rounded" onClick={() => handleReturn(req)}>Return</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Merged Coverage Requests Card for Employees
  const mergedRequests = [
    ...shiftCoverageRequests.filter(req => req.status === 'Open' || req.originalOwnerId === user?.id)
  ];
  // Remove duplicates (if any)
  const uniqueRequests = Array.from(new Map(mergedRequests.map(req => [req.id, req])).values());
  // Sort chronologically by date and requestedCoverageStart
  uniqueRequests.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.requestedCoverageStart || '').localeCompare(b.requestedCoverageStart || '');
  });

  const MergedCoverageCard = user?.role === 'employee' && (
    <div className="bg-white text-bradley-dark-gray p-6 rounded-lg border-2 border-bradley-medium-gray shadow-[0_6px_0_0_#939598FF] w-full mb-6 flex flex-col dark:bg-bradley-dark-card dark:text-bradley-dark-card-text dark:border-bradley-light-gray dark:shadow-[0_6px_0_0_#E2E8F0FF]">
      <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray dark:text-gray-200">Shift Coverage Requests</h2>
      <div className="overflow-x-auto flex-1 pb-6">
        <table className="min-w-full overflow-hidden table-fixed bg-white dark:bg-bradley-dark-card border border-bradley-medium-gray dark:border-bradley-light-gray">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr
              style={{
                background: document.documentElement.classList.contains('dark') ? '#23262f' : '#e2e8f0'
              }}
            >
              <th className={`px-4 py-2 text-left ${document.documentElement.classList.contains('dark') ? 'text-bradley-light-gray' : 'text-bradley-dark-gray'}`}>Date</th>
              <th className={`px-4 py-2 text-left ${document.documentElement.classList.contains('dark') ? 'text-bradley-light-gray' : 'text-bradley-dark-gray'}`}>Time</th>
              <th className={`px-4 py-2 text-left ${document.documentElement.classList.contains('dark') ? 'text-bradley-light-gray' : 'text-bradley-dark-gray'}`}>Owner</th>
              <th className={`px-4 py-2 text-left ${document.documentElement.classList.contains('dark') ? 'text-bradley-light-gray' : 'text-bradley-dark-gray'}`}>Status</th>
              <th className={`px-4 py-2 text-left ${document.documentElement.classList.contains('dark') ? 'text-bradley-light-gray' : 'text-bradley-dark-gray'}`}>Yours</th>
              <th className={`px-4 py-2 text-left ${document.documentElement.classList.contains('dark') ? 'text-bradley-light-gray' : 'text-bradley-dark-gray'}`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {uniqueRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-bradley-medium-gray bg-white dark:bg-bradley-dark-card">No coverage requests found.</td>
              </tr>
            ) : (
              uniqueRequests.map(req => {
                const isYours = req.originalOwnerId === user?.id;
                return (
                  <tr
                    key={req.id}
                    className={`border-t border-bradley-medium-gray dark:border-bradley-dark-border ${isYours ? 'bg-yellow-50 dark:bg-yellow-900/30' : ''}`}
                  >
                    <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">{req.date}</td>
                    <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">{req.requestedCoverageStart} - {req.requestedCoverageEnd}</td>
                    <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">{req.originalOwnerName}</td>
                    <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">{req.status}</td>
                    <td className="px-4 py-2 text-center font-semibold">{isYours ? '✔' : ''}</td>
                    <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">
                      {req.status === 'Open' && req.originalOwnerId !== user?.id && (
                        <button className="px-3 py-1 bg-bradley-blue text-white rounded" onClick={() => handleClaim(req)}>Claim</button>
                      )}
                      {req.status === 'Claimed' && req.claimedById === user?.id && (
                        <button className="px-3 py-1 bg-bradley-yellow text-black rounded" onClick={() => handleReturn(req)}>Return</button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Greeter helper
  function getGreetingName() {
    if (user?.firstName) return user.firstName;
    if (user?.name && user.name.split(' ')[0]) return user.name.split(' ')[0];
    if (user?.username) return user.username;
    if (user?.email) return user.email;
    return '';
  }
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  }

  // Layout
  return (
    <div className="p-6 md:pl-60">
      <h1 className="text-2xl font-bold mb-6">
        {getGreeting()} {getGreetingName()}!
      </h1>
      {notification && <div className="mb-2 p-2 bg-green-100 text-green-800 rounded">{notification}</div>}
      {error && <div className="mb-2 p-2 bg-red-100 text-red-800 rounded">{error}</div>}
      {WeeklyOverview}
      {AnnouncementsCard}
      {user?.role === 'employee' ? (
        <div className="mt-6">{MergedCoverageCard}</div>
      ) : (
        <div className="flex flex-row gap-4">
          {CoverageRequestsCard}
        </div>
      )}
    </div>
  );
}