import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { format, parse, isBefore, startOfDay, isSameDay } from 'date-fns';

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

export default function TimeOffRequest() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    timeOption: 'All Day' as 'All Day' | 'Partial Day',
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    type: 'Time Off' as 'Time Off' | 'Shift Coverage',
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/requests');
        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }
        const data = await response.json();
        setRequests(data);
      } catch (err: unknown) {
        console.error('TimeOffRequest: Failed to fetch requests:', err);
        setError('Failed to load requests. Please try again.');
      }
    };
    fetchRequests();
  }, []);

  // Utility function to convert time to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const requestDate = parse(formData.date, 'yyyy-MM-dd', new Date());
      const today = startOfDay(new Date());
      if (isBefore(requestDate, today)) {
        throw new Error('Cannot request time off for a past date.');
      }

      // Check for overlapping time off requests
      const newStartMinutes = formData.timeOption === 'Partial Day' ? timeToMinutes(formData.startTime) : 0;
      const newEndMinutes = formData.timeOption === 'Partial Day' ? timeToMinutes(formData.endTime) : 1440; // End of day in minutes

      const existingRequest = requests.find(
        (req) =>
          req.employee === user.name &&
          isSameDay(parse(req.date, 'yyyy-MM-dd', new Date()), requestDate)
      );

      if (existingRequest) {
        if (existingRequest.time === 'All Day') {
          throw new Error(`You already have a time off request for ${formData.date}.`);
        } else if (existingRequest.time === 'Partial Day' && existingRequest.startTime && existingRequest.endTime) {
          const existingStartMinutes = timeToMinutes(existingRequest.startTime);
          const existingEndMinutes = timeToMinutes(existingRequest.endTime);

          const hasOverlap =
            (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
            (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
            (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes);

          if (hasOverlap) {
            throw new Error(`You already have a time off request on ${formData.date} from ${existingRequest.startTime} to ${existingRequest.endTime}.`);
          }
        }
      }

      const newRequest: RequestType = {
        id: `r${Date.now()}`,
        employee: user.name,
        type: formData.type,
        date: formData.date,
        time: formData.timeOption,
        startTime: formData.timeOption === 'Partial Day' ? formData.startTime : undefined,
        endTime: formData.timeOption === 'Partial Day' ? formData.endTime : undefined,
        status: 'Pending',
      };

      const response = await fetch('http://localhost:3001/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      });
      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setRequests((prev) => [...prev, newRequest]);
      setSuccessMessage('Time off request submitted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        timeOption: 'All Day',
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        type: 'Time Off',
      });

      if (newRequest.time === 'All Day') {
        const shiftsResponse = await fetch('http://localhost:3001/api/shifts');
        if (!shiftsResponse.ok) {
          throw new Error('Failed to fetch shifts');
        }
        const shifts = await shiftsResponse.json();
        const overlappingShifts = shifts.filter(
          (shift: { employeeId: string; date: string }) =>
            shift.employeeId === user.id && shift.date === newRequest.date
        );

        if (overlappingShifts.length > 0) {
          const coverageRequestsResponse = await fetch('http://localhost:3001/api/shiftCoverageRequests');
          if (!coverageRequestsResponse.ok) {
            throw new Error('Failed to fetch shift coverage requests');
          }
          const coverageRequests = await coverageRequestsResponse.json();

          const newCoverageRequests = overlappingShifts.map((shift: any) => ({
            id: `cr${Date.now() + Math.random()}`,
            employeeId: user.id,
            employeeName: user.name,
            date: shift.date,
            startTime: shift.startTime,
            endTime: shift.endTime,
            status: 'Pending',
          }));

          const updatedCoverageRequests = [...coverageRequests, ...newCoverageRequests];
          const postCoverageResponse = await fetch('http://localhost:3001/api/shiftCoverageRequests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCoverageRequests),
          });
          if (!postCoverageResponse.ok) {
            throw new Error('Failed to create shift coverage requests');
          }
        }
      }
    } catch (err: unknown) {
      console.error('TimeOffRequest: Failed to submit request:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.');
    }
  };

  if (!user) {
    return <div className="p-6 text-center text-bradley-dark-gray">Access Denied</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-bradley-dark-gray">Time Off Request</h1>
      {error && <p className="text-bradley-red text-sm mb-4">{error}</p>}
      {successMessage && (
        <p className="text-bradley-blue text-sm mb-4 bg-bradley-light-gray p-2 rounded">{successMessage}</p>
      )}
      <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley mb-6">
        <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray">Submit a Time Off Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bradley-dark-gray">Date</label>
            <input
              type="date"
              value={formData.date}
              min={format(new Date(), 'yyyy-MM-dd')} // Prevent past dates
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bradley-dark-gray">Time</label>
            <select
              value={formData.timeOption}
              onChange={(e) => setFormData({ ...formData, timeOption: e.target.value as 'All Day' | 'Partial Day' })}
              className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
            >
              <option value="All Day">All Day</option>
              <option value="Partial Day">Partial Day</option>
            </select>
          </div>
          {formData.timeOption === 'Partial Day' && (
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
            </div>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
          >
            Submit Request
          </button>
        </form>
      </div>
      <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley">
        <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray">Your Requests</h2>
        {requests.length === 0 ? (
          <p className="text-lg text-bradley-medium-gray">No requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-bradley-medium-gray">
              <thead>
                <tr className="bg-bradley-light-gray">
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Date</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Time</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Type</th>
                  <th className="px-4 py-2 text-left text-bradley-dark-gray">Status</th>
                </tr>
              </thead>
              <tbody>
                {requests
                  .filter((req) => req.employee === user.name)
                  .map((req) => (
                    <tr key={req.id} className="border-t border-bradley-medium-gray">
                      <td className="px-4 py-2 text-bradley-dark-gray">{req.date}</td>
                      <td className="px-4 py-2 text-bradley-dark-gray">
                        {req.time === 'Partial Day' ? `${req.startTime} - ${req.endTime}` : req.time || 'All Day'}
                      </td>
                      <td className="px-4 py-2 text-bradley-dark-gray">{req.type}</td>
                      <td className="px-4 py-2 text-bradley-dark-gray">{req.status}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}