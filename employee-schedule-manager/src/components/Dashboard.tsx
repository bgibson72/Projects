import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { format, parse, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
}

interface RequestType {
  id: string;
  employee: string;
  type: 'Time Off' | 'Shift Coverage';
  date: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

interface ShiftCoverageRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Pending' | 'Covered';
}

interface Announcement {
  id: string;
  content: string;
  timestamp: string;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [shiftCoverageRequests, setShiftCoverageRequests] = useState<ShiftCoverageRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string>('');

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/announcements');
      if (!response.ok) throw new Error('Failed to fetch announcements');
      const data = await response.json();
      setAnnouncements(data);
    } catch (err: unknown) {
      console.error('Dashboard: Failed to fetch announcements:', err);
      setError('Failed to load announcements. Please try again.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shiftsResponse = await fetch('http://localhost:3001/api/shifts');
        if (!shiftsResponse.ok) throw new Error('Failed to fetch shifts');
        const shiftsData = await shiftsResponse.json();
        setShifts(shiftsData);

        const requestsResponse = await fetch('http://localhost:3001/api/requests');
        if (!requestsResponse.ok) throw new Error('Failed to fetch requests');
        const requestsData = await requestsResponse.json();
        setRequests(requestsData);

        const coverageResponse = await fetch('http://localhost:3001/api/shiftCoverageRequests');
        if (!coverageResponse.ok) throw new Error('Failed to fetch shift coverage requests');
        const coverageData = await coverageResponse.json();
        setShiftCoverageRequests(coverageData);

        await fetchAnnouncements();
      } catch (err: unknown) {
        console.error('Dashboard: Failed to fetch data:', err);
        setError('Failed to load dashboard data. Please try again.');
      }
    };
    fetchData();

    const interval = setInterval(fetchAnnouncements, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePreviousWeek = () => {
    setCurrentWeekStart((prev) => startOfWeek(new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 }));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => startOfWeek(new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 1 }));
  };

  // Utility function to convert time to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Utility function to convert minutes back to time string
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${period}`;
  };

  const handleRequestAction = async (request: RequestType, action: 'Approved' | 'Denied') => {
    try {
      const updatedRequests = requests.map(req =>
        req.id === request.id ? { ...req, status: action } : req
      );
      const response = await fetch('http://localhost:3001/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRequests),
      });
      if (!response.ok) throw new Error('Failed to update request');

      setRequests(updatedRequests);

      if (action === 'Approved' && (request.time === 'All Day' || request.time === 'Partial Day')) {
        const requestDate = parse(request.date, 'yyyy-MM-dd', new Date());
        const overlappingShifts = shifts.filter(
          (shift) =>
            shift.employeeName === request.employee &&
            isSameDay(parse(shift.date, 'yyyy-MM-dd', new Date()), requestDate)
        );

        if (overlappingShifts.length > 0) {
          const newCoverageRequests: ShiftCoverageRequest[] = [];
          const updatedShifts = [...shifts];

          for (const shift of overlappingShifts) {
            const shiftStartMinutes = timeToMinutes(shift.startTime);
            const shiftEndMinutes = timeToMinutes(shift.endTime);

            if (request.time === 'All Day') {
              newCoverageRequests.push({
                id: `cr${Date.now() + Math.random()}`,
                employeeId: shift.employeeId,
                employeeName: request.employee,
                date: shift.date,
                startTime: shift.startTime,
                endTime: shift.endTime,
                status: 'Pending',
              });
              updatedShifts.splice(updatedShifts.indexOf(shift), 1);
            } else if (request.time === 'Partial Day' && request.startTime && request.endTime) {
              const timeOffStartMinutes = timeToMinutes(request.startTime);
              const timeOffEndMinutes = timeToMinutes(request.endTime);

              const hasOverlap =
                (shiftStartMinutes >= timeOffStartMinutes && shiftStartMinutes < timeOffEndMinutes) ||
                (shiftEndMinutes > timeOffStartMinutes && shiftEndMinutes <= timeOffEndMinutes) ||
                (shiftStartMinutes <= timeOffStartMinutes && shiftEndMinutes >= timeOffEndMinutes);

              if (hasOverlap) {
                const coverageStartMinutes = Math.max(shiftStartMinutes, timeOffStartMinutes);
                const coverageEndMinutes = Math.min(shiftEndMinutes, timeOffEndMinutes);
                newCoverageRequests.push({
                  id: `cr${Date.now() + Math.random()}`,
                  employeeId: shift.employeeId,
                  employeeName: request.employee,
                  date: shift.date,
                  startTime: minutesToTime(coverageStartMinutes),
                  endTime: minutesToTime(coverageEndMinutes),
                  status: 'Pending',
                });

                updatedShifts.splice(updatedShifts.indexOf(shift), 1);

                if (shiftStartMinutes < timeOffStartMinutes) {
                  updatedShifts.push({
                    ...shift,
                    id: `s${Date.now() + Math.random()}`,
                    startTime: shift.startTime,
                    endTime: request.startTime,
                  });
                }
                if (shiftEndMinutes > timeOffEndMinutes) {
                  updatedShifts.push({
                    ...shift,
                    id: `s${Date.now() + Math.random()}`,
                    startTime: request.endTime,
                    endTime: shift.endTime,
                  });
                }
              }
            }
          }

          if (newCoverageRequests.length > 0) {
            const updatedCoverageRequests = [...shiftCoverageRequests, ...newCoverageRequests];
            const coverageResponse = await fetch('http://localhost:3001/api/shiftCoverageRequests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedCoverageRequests),
            });
            if (!coverageResponse.ok) throw new Error('Failed to create shift coverage requests');

            setShiftCoverageRequests(updatedCoverageRequests);

            const shiftsResponse = await fetch('http://localhost:3001/api/shifts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedShifts),
            });
            if (!shiftsResponse.ok) throw new Error('Failed to update shifts');

            setShifts(updatedShifts);
          }
        }
      }
    } catch (err: unknown) {
      console.error('Dashboard: Failed to update request:', err);
      setError('Failed to update request. Please try again.');
    }
  };

  const handleCoverShift = async (coverageRequest: ShiftCoverageRequest) => {
    if (!user) return;
    try {
      const requestDate = parse(coverageRequest.date, 'yyyy-MM-dd', new Date());
      const newStartMinutes = timeToMinutes(coverageRequest.startTime);
      const newEndMinutes = timeToMinutes(coverageRequest.endTime);

      // Check for overlapping shifts for the employee picking up the shift
      const existingShift = shifts.find(
        (shift) =>
          shift.employeeId === user.id &&
          isSameDay(parse(shift.date, 'yyyy-MM-dd', new Date()), requestDate)
      );
      if (existingShift) {
        const existingStartMinutes = timeToMinutes(existingShift.startTime);
        const existingEndMinutes = timeToMinutes(existingShift.endTime);
        const hasShiftOverlap =
          (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes);
        if (hasShiftOverlap) {
          throw new Error(`You are already scheduled on ${coverageRequest.date} from ${existingShift.startTime} to ${existingShift.endTime}.`);
        }
      }

      // Check for approved time off requests for the employee picking up the shift
      const approvedTimeOff = requests.find(
        (req) =>
          req.employee === user.name &&
          req.type === 'Time Off' &&
          req.status === 'Approved' &&
          isSameDay(parse(req.date, 'yyyy-MM-dd', new Date()), requestDate)
      );
      if (approvedTimeOff) {
        if (approvedTimeOff.time === 'All Day') {
          throw new Error(`You have approved time off on ${coverageRequest.date}.`);
        } else if (approvedTimeOff.time === 'Partial Day' && approvedTimeOff.startTime && approvedTimeOff.endTime) {
          const timeOffStartMinutes = timeToMinutes(approvedTimeOff.startTime);
          const timeOffEndMinutes = timeToMinutes(approvedTimeOff.endTime);
          const hasTimeOffOverlap =
            (newStartMinutes >= timeOffStartMinutes && newStartMinutes < timeOffEndMinutes) ||
            (newEndMinutes > timeOffStartMinutes && newEndMinutes <= timeOffEndMinutes) ||
            (newStartMinutes <= timeOffStartMinutes && newEndMinutes >= timeOffEndMinutes);
          if (hasTimeOffOverlap) {
            throw new Error(`You have approved time off on ${coverageRequest.date} from ${approvedTimeOff.startTime} to ${approvedTimeOff.endTime}.`);
          }
        }
      }

      const updatedCoverageRequests = shiftCoverageRequests.map(req =>
        req.id === coverageRequest.id ? { ...req, status: 'Covered' as 'Covered' } : req
      );
      const response = await fetch('http://localhost:3001/api/shiftCoverageRequests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCoverageRequests),
      });
      if (!response.ok) throw new Error('Failed to update shift coverage request');

      const newShift: Shift = {
        id: `s${Date.now()}`,
        employeeId: user.id,
        employeeName: user.name,
        date: coverageRequest.date,
        startTime: coverageRequest.startTime,
        endTime: coverageRequest.endTime,
        color: user.color || '#000000',
      };
      const updatedShifts = [...shifts, newShift];
      const shiftsResponse = await fetch('http://localhost:3001/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedShifts),
      });
      if (!shiftsResponse.ok) throw new Error('Failed to add shift');

      setShiftCoverageRequests(updatedCoverageRequests);
      setShifts(updatedShifts);
    } catch (err: unknown) {
      console.error('Dashboard: Failed to cover shift:', err);
      setError(err instanceof Error ? err.message : 'Failed to cover shift. Please try again.');
    }
  };

  if (!user) {
    return <div className="p-6 text-center text-bradley-dark-gray">Access Denied</div>;
  }

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-bradley-dark-gray">Dashboard</h1>
      {error && <p className="text-bradley-red text-sm mb-4">{error}</p>}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-bradley-dark-gray">Weekly Overview</h2>
            <div className="flex space-x-2">
              <button
                onClick={handlePreviousWeek}
                className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
              >
                Previous
              </button>
              <button
                onClick={handleNextWeek}
                className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
              >
                Next
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayShifts = shifts.filter((shift) =>
                user.role === 'admin'
                  ? isSameDay(parse(shift.date, 'yyyy-MM-dd', new Date()), day)
                  : shift.employeeId === user.id && isSameDay(parse(shift.date, 'yyyy-MM-dd', new Date()), day)
              );
              const dayRequests = requests.filter(
                (req) =>
                  req.type === 'Time Off' &&
                  req.status === 'Approved' &&
                  (user.role === 'admin'
                    ? isSameDay(parse(req.date, 'yyyy-MM-dd', new Date()), day)
                    : req.employee === user.name && isSameDay(parse(req.date, 'yyyy-MM-dd', new Date()), day))
              );
              return (
                <div key={day.toString()} className="border border-bradley-medium-gray p-2 min-h-[100px]">
                  <div className="text-bradley-dark-gray">{format(day, 'EEE d')}</div>
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="mt-1 p-1 rounded text-sm text-white"
                      style={{ backgroundColor: shift.color }}
                    >
                      {shift.employeeName}: {shift.startTime} - {shift.endTime}
                    </div>
                  ))}
                  {dayRequests.map((req) => (
                    <div
                      key={req.id}
                      className="mt-1 p-1 rounded text-sm text-bradley-dark-gray bg-yellow-200"
                    >
                      {req.employee} - Off
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley">
            <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray">Announcements</h2>
            {announcements.length === 0 ? (
              <p className="text-lg text-bradley-medium-gray">No announcements.</p>
            ) : (
              <div className="space-y-2">
                {announcements
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, 3)
                  .map((ann) => (
                    <div key={ann.id} className="p-2 border-b border-bradley-medium-gray">
                      <p className="text-bradley-dark-gray">{ann.content}</p>
                      <p className="text-sm text-bradley-medium-gray">
                        {format(parse(ann.timestamp, "yyyy-MM-dd'T'HH:mm:ss.SSSX", new Date()), 'PPpp')}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
          {user.role === 'admin' ? (
            <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley">
              <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray">Pending Time Off Requests</h2>
              {requests.filter((req) => req.status === 'Pending').length === 0 ? (
                <p className="text-lg text-bradley-medium-gray">No pending requests.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-bradley-medium-gray">
                    <thead>
                      <tr className="bg-bradley-light-gray">
                        <th className="px-4 py-2 text-left text-bradley-dark-gray">Employee</th>
                        <th className="px-4 py-2 text-left text-bradley-dark-gray">Date</th>
                        <th className="px-4 py-2 text-left text-bradley-dark-gray">Times</th>
                        <th className="px-4 py-2 text-left text-bradley-dark-gray">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests
                        .filter((req) => req.status === 'Pending')
                        .map((req) => {
                          const isCovered = shiftCoverageRequests.some(
                            (cr) =>
                              cr.employeeName === req.employee &&
                              cr.date === req.date &&
                              cr.status === 'Covered'
                          );
                          return !isCovered ? (
                            <tr key={req.id} className="border-t border-bradley-medium-gray">
                              <td className="px-4 py-2 text-bradley-dark-gray">{req.employee}</td>
                              <td className="px-4 py-2 text-bradley-dark-gray">{req.date}</td>
                              <td className="px-4 py-2 text-bradley-dark-gray">
                                {req.time === 'Partial Day' ? `${req.startTime} - ${req.endTime}` : req.time || 'All Day'}
                              </td>
                              <td className="px-4 py-2 flex space-x-2">
                                <button
                                  onClick={() => handleRequestAction(req, 'Approved')}
                                  className="px-3 py-1 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRequestAction(req, 'Denied')}
                                  className="px-3 py-1 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                                >
                                  Deny
                                </button>
                              </td>
                            </tr>
                          ) : null;
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley">
              <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray">Shift Coverage Requests</h2>
              {shiftCoverageRequests.length === 0 ? (
                <p className="text-lg text-bradley-medium-gray">No shift coverage requests.</p>
              ) : (
                <div className="space-y-4">
                  {shiftCoverageRequests
                    .filter((req) => req.employeeId !== user.id && req.status === 'Pending')
                    .map((req) => (
                      <div key={req.id} className="p-4 border-b border-bradley-medium-gray">
                        <p className="text-bradley-dark-gray">
                          {req.employeeName} requests coverage for {req.date} from {req.startTime} to {req.endTime}
                        </p>
                        <button
                          className="mt-2 px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                          onClick={() => handleCoverShift(req)}
                        >
                          Pick Up Shift
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}