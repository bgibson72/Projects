import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { collection, getDocs } from 'firebase/firestore';
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
    <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-bradley-dark-gray">Weekly Overview</h2>
        <div className="flex gap-2">
          <button className="px-2 py-1 bg-bradley-light-gray rounded" onClick={() => setCurrentWeekStart(startOfWeek(new Date(currentWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 }))}>Previous</button>
          <span className="font-bold text-bradley-dark-gray">{format(currentWeekStart, 'MMM d')} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 0 }), 'MMM d')}</span>
          <button className="px-2 py-1 bg-bradley-light-gray rounded" onClick={() => setCurrentWeekStart(startOfWeek(new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 }))}>Next</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-bradley-medium-gray rounded-lg overflow-hidden table-fixed">
          <colgroup>
            {Array.from({ length: 7 }).map((_, i) => (
              <col key={i} style={{ width: '120px' }} />
            ))}
          </colgroup>
          <thead className="border-b border-bradley-medium-gray">
            <tr className="bg-bradley-light-gray">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                <th key={d} className="px-2 py-2 text-center text-bradley-dark-gray border-r last:border-r-0 border-bradley-medium-gray font-medium" style={{ width: '120px' }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {weekDays.map((day, j) => (
                <td key={j} className="h-24 align-top px-2 py-1 border-t border-bradley-medium-gray border-r last:border-r-0 bg-white" style={{ width: '120px', minWidth: '120px', maxWidth: '120px' }}>
                  <div className="text-xs font-semibold mb-1 text-right pr-1">
                    {isSameDay(day, new Date()) ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-bradley-red text-white">{format(day, 'd')}</span>
                    ) : (
                      <span className="text-bradley-dark-gray">{format(day, 'd')}</span>
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
    <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley mb-6">
      <h2 className="text-xl font-semibold mb-2 text-bradley-dark-gray">Announcements</h2>
      {announcements.length === 0 ? (
        <p className="text-bradley-medium-gray">No announcements.</p>
      ) : (
        <ul className="space-y-2">
          {announcements.map(a => (
            <li key={a.id} className="bg-bradley-light-gray p-2 rounded">{a.content}</li>
          ))}
        </ul>
      )}
    </div>
  );

  // Shift Coverage Requests Card
  const CoverageRequestsCard = (
    <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley flex-1 mr-2">
      <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray">Shift Coverage Requests</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-bradley-medium-gray">
          <thead>
            <tr className="bg-bradley-light-gray">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shiftCoverageRequests.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4 text-bradley-medium-gray">No coverage requests found.</td></tr>
            ) : (
              shiftCoverageRequests.map(req => (
                <tr key={req.id} className="border-t border-bradley-medium-gray">
                  <td className="px-4 py-2">{req.date}</td>
                  <td className="px-4 py-2">{req.requestedCoverageStart} - {req.requestedCoverageEnd}</td>
                  <td className="px-4 py-2">{req.originalOwnerName}</td>
                  <td className="px-4 py-2">{req.status}</td>
                  <td className="px-4 py-2">
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

  // Employee: add "Your Coverage Requests" card
  const YourCoverageRequestsCard = user?.role === 'employee' && (
    <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley flex-1 ml-2">
      <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray">Your Coverage Requests</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-bradley-medium-gray">
          <thead>
            <tr className="bg-bradley-light-gray">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {shiftCoverageRequests.filter(req => req.originalOwnerId === user?.id || req.claimedById === user?.id).length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4 text-bradley-medium-gray">No coverage requests found.</td></tr>
            ) : (
              shiftCoverageRequests.filter(req => req.originalOwnerId === user?.id || req.claimedById === user?.id).map(req => (
                <tr key={req.id} className="border-t border-bradley-medium-gray">
                  <td className="px-4 py-2">{req.date}</td>
                  <td className="px-4 py-2">{req.requestedCoverageStart} - {req.requestedCoverageEnd}</td>
                  <td className="px-4 py-2">{req.originalOwnerName}</td>
                  <td className="px-4 py-2">{req.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
  }
  function getFirstName(name: string) {
    if (!name) return '';
    return name.split(' ')[0];
  }

  // Layout
  return (
    <div className="p-6 md:pl-60">
      <h1 className="text-2xl font-bold mb-6">{getGreeting()} {getFirstName(user?.name || '')}!</h1>
      {notification && <div className="mb-2 p-2 bg-green-100 text-green-800 rounded">{notification}</div>}
      {error && <div className="mb-2 p-2 bg-red-100 text-red-800 rounded">{error}</div>}
      {WeeklyOverview}
      {AnnouncementsCard}
      {user?.role === 'employee' && <ShiftCoverageRequestComponent />}
      <div className="flex flex-row gap-4">
        {CoverageRequestsCard}
        {user?.role === 'admin' ? null : YourCoverageRequestsCard}
      </div>
    </div>
  );
}