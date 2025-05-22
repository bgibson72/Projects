import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { format, parse, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';
import { Plus, Trash } from 'lucide-react';

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  username: string;
  phone: string;
  color: string;
  role: 'admin' | 'employee';
  addedByAdmin?: boolean;
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

export default function Schedule() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(() => {
    const query = new URLSearchParams(location.search);
    const dateParam = query.get('date');
    return dateParam ? parse(dateParam, 'yyyy-MM-dd', new Date()) : new Date();
  });
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [shiftCoverageRequests, setShiftCoverageRequests] = useState<ShiftCoverageRequest[]>([]);
  const [error, setError] = useState<string>('');
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [isEditShiftOpen, setIsEditShiftOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [editShiftForm, setEditShiftForm] = useState({
    employeeId: '',
    date: '',
    startTime: '',
    endTime: '',
  });
  const [addShiftForm, setAddShiftForm] = useState({
    employeeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00 AM',
    endTime: '05:00 PM',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shiftsResponse = await fetch('http://localhost:3001/api/shifts');
        if (!shiftsResponse.ok) throw new Error('Failed to fetch shifts');
        const shiftsData = await shiftsResponse.json();
        setShifts(shiftsData);

        const employeesResponse = await fetch('http://localhost:3001/api/employees');
        if (!employeesResponse.ok) throw new Error('Failed to fetch employees');
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData);

        const requestsResponse = await fetch('http://localhost:3001/api/requests');
        if (!requestsResponse.ok) throw new Error('Failed to fetch requests');
        const requestsData = await requestsResponse.json();
        setRequests(requestsData);

        const coverageResponse = await fetch('http://localhost:3001/api/shiftCoverageRequests');
        if (!coverageResponse.ok) throw new Error('Failed to fetch shift coverage requests');
        const coverageData = await coverageResponse.json();
        setShiftCoverageRequests(coverageData);
      } catch (err: unknown) {
        console.error('Schedule: Failed to fetch data:', err);
        setError('Failed to load schedule data. Please try again.');
      }
    };
    fetchData();
  }, []);

  // Utility function to convert time to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [timePart, period] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  // Calculate the day of the week for the first day of the month
  const firstDayOfMonth = getDay(startDate);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => (
    <div key={`empty-${i}`} className="border border-bradley-medium-gray p-2 min-h-[100px]"></div>
  ));

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    navigate('/schedule');
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    navigate('/schedule');
  };

  const handleAddShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedEmployee = employees.find(emp => emp.id === addShiftForm.employeeId);
      if (!selectedEmployee) throw new Error('Employee not found');

      const shiftDate = parse(addShiftForm.date, 'yyyy-MM-dd', new Date());
      const newStartMinutes = timeToMinutes(addShiftForm.startTime);
      const newEndMinutes = timeToMinutes(addShiftForm.endTime);

      // Check for existing shifts on the same date for the employee
      const existingShift = shifts.find(
        (shift) =>
          shift.employeeId === addShiftForm.employeeId &&
          isSameDay(parse(shift.date, 'yyyy-MM-dd', new Date()), shiftDate)
      );
      if (existingShift) {
        const existingStartMinutes = timeToMinutes(existingShift.startTime);
        const existingEndMinutes = timeToMinutes(existingShift.endTime);
        if (
          (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
        ) {
          throw new Error(`${selectedEmployee.firstName} ${selectedEmployee.lastName} is already scheduled on ${addShiftForm.date} from ${existingShift.startTime} to ${existingShift.endTime}.`);
        }
      }

      // Check for approved time off requests on the same date for the employee
      const approvedTimeOff = requests.find(
        (req) =>
          req.employee === `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim() &&
          req.type === 'Time Off' &&
          req.status === 'Approved' &&
          isSameDay(parse(req.date, 'yyyy-MM-dd', new Date()), shiftDate)
      );

      const newShifts: Shift[] = [];
      if (approvedTimeOff) {
        if (approvedTimeOff.time === 'All Day') {
          throw new Error(`${selectedEmployee.firstName} ${selectedEmployee.lastName} has approved time off on ${addShiftForm.date}.`);
        } else if (approvedTimeOff.time === 'Partial Day' && approvedTimeOff.startTime && approvedTimeOff.endTime) {
          const timeOffStartMinutes = timeToMinutes(approvedTimeOff.startTime);
          const timeOffEndMinutes = timeToMinutes(approvedTimeOff.endTime);

          const hasOverlap =
            (newStartMinutes >= timeOffStartMinutes && newStartMinutes < timeOffEndMinutes) ||
            (newEndMinutes > timeOffStartMinutes && newEndMinutes <= timeOffEndMinutes) ||
            (newStartMinutes <= timeOffStartMinutes && newEndMinutes >= timeOffEndMinutes);

          if (hasOverlap) {
            // Split the shift around the time off period
            if (newStartMinutes < timeOffStartMinutes) {
              // Add a shift before the time off
              const beforeShift: Shift = {
                id: `s${Date.now()}`,
                employeeId: addShiftForm.employeeId,
                employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim(),
                date: addShiftForm.date,
                startTime: addShiftForm.startTime,
                endTime: approvedTimeOff.startTime,
                color: selectedEmployee.color,
              };
              newShifts.push(beforeShift);
            }
            if (newEndMinutes > timeOffEndMinutes) {
              // Add a shift after the time off
              const afterShift: Shift = {
                id: `s${Date.now() + 1}`,
                employeeId: addShiftForm.employeeId,
                employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim(),
                date: addShiftForm.date,
                startTime: approvedTimeOff.endTime,
                endTime: addShiftForm.endTime,
                color: selectedEmployee.color,
              };
              newShifts.push(afterShift);
            }
          } else {
            // No overlap, add the shift as is
            const newShift: Shift = {
              id: `s${Date.now()}`,
              employeeId: addShiftForm.employeeId,
              employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim(),
              date: addShiftForm.date,
              startTime: addShiftForm.startTime,
              endTime: addShiftForm.endTime,
              color: selectedEmployee.color,
            };
            newShifts.push(newShift);
          }
        }
      } else {
        // No time off, add the shift as is
        const newShift: Shift = {
          id: `s${Date.now()}`,
          employeeId: addShiftForm.employeeId,
          employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim(),
          date: addShiftForm.date,
          startTime: addShiftForm.startTime,
          endTime: addShiftForm.endTime,
          color: selectedEmployee.color,
        };
        newShifts.push(newShift);
      }

      // Save all new shifts
      for (const shift of newShifts) {
        const response = await fetch('http://localhost:3001/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shift),
        });
        if (!response.ok) throw new Error('Failed to add shift');
      }

      setShifts((prev) => [...prev, ...newShifts]);
      setAddShiftForm({
        employeeId: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00 AM',
        endTime: '05:00 PM',
      });
      setIsAddShiftOpen(false);
    } catch (err: unknown) {
      console.error('Schedule: Failed to add shift:', err);
      setError(err instanceof Error ? err.message : 'Failed to add shift. Please try again.');
    }
  };

  const handleEditShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift) return;
    try {
      const selectedEmployee = employees.find(emp => emp.id === editShiftForm.employeeId);
      if (!selectedEmployee) throw new Error('Employee not found');

      const shiftDate = parse(editShiftForm.date, 'yyyy-MM-dd', new Date());
      const newStartMinutes = timeToMinutes(editShiftForm.startTime);
      const newEndMinutes = timeToMinutes(editShiftForm.endTime);

      // Check for overlapping shifts on the same date for the employee, excluding the current shift
      const existingShift = shifts.find(
        (shift) =>
          shift.id !== selectedShift.id &&
          shift.employeeId === editShiftForm.employeeId &&
          isSameDay(parse(shift.date, 'yyyy-MM-dd', new Date()), shiftDate)
      );
      if (existingShift) {
        const existingStartMinutes = timeToMinutes(existingShift.startTime);
        const existingEndMinutes = timeToMinutes(existingShift.endTime);
        if (
          (newStartMinutes >= existingStartMinutes && newStartMinutes < existingEndMinutes) ||
          (newEndMinutes > existingStartMinutes && newEndMinutes <= existingEndMinutes) ||
          (newStartMinutes <= existingStartMinutes && newEndMinutes >= existingEndMinutes)
        ) {
          throw new Error(`${selectedEmployee.firstName} ${selectedEmployee.lastName} is already scheduled on ${editShiftForm.date} from ${existingShift.startTime} to ${existingShift.endTime}.`);
        }
      }

      // Check for approved time off requests on the same date for the employee
      const approvedTimeOff = requests.find(
        (req) =>
          req.employee === `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim() &&
          req.type === 'Time Off' &&
          req.status === 'Approved' &&
          isSameDay(parse(req.date, 'yyyy-MM-dd', new Date()), shiftDate)
      );

      const newShifts: Shift[] = [];
      if (approvedTimeOff) {
        if (approvedTimeOff.time === 'All Day') {
          throw new Error(`${selectedEmployee.firstName} ${selectedEmployee.lastName} has approved time off on ${editShiftForm.date}.`);
        } else if (approvedTimeOff.time === 'Partial Day' && approvedTimeOff.startTime && approvedTimeOff.endTime) {
          const timeOffStartMinutes = timeToMinutes(approvedTimeOff.startTime);
          const timeOffEndMinutes = timeToMinutes(approvedTimeOff.endTime);

          const hasOverlap =
            (newStartMinutes >= timeOffStartMinutes && newStartMinutes < timeOffEndMinutes) ||
            (newEndMinutes > timeOffStartMinutes && newEndMinutes <= timeOffEndMinutes) ||
            (newStartMinutes <= timeOffStartMinutes && newEndMinutes >= timeOffEndMinutes);

          if (hasOverlap) {
            if (newStartMinutes < timeOffStartMinutes) {
              const beforeShift: Shift = {
                id: `s${Date.now()}`,
                employeeId: editShiftForm.employeeId,
                employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim(),
                date: editShiftForm.date,
                startTime: editShiftForm.startTime,
                endTime: approvedTimeOff.startTime,
                color: selectedEmployee.color,
              };
              newShifts.push(beforeShift);
            }
            if (newEndMinutes > timeOffEndMinutes) {
              const afterShift: Shift = {
                id: `s${Date.now() + 1}`,
                employeeId: editShiftForm.employeeId,
                employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim(),
                date: editShiftForm.date,
                startTime: approvedTimeOff.endTime,
                endTime: editShiftForm.endTime,
                color: selectedEmployee.color,
              };
              newShifts.push(afterShift);
            }
          } else {
            const updatedShift: Shift = {
              ...selectedShift,
              employeeId: editShiftForm.employeeId,
              employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim(),
              date: editShiftForm.date,
              startTime: editShiftForm.startTime,
              endTime: editShiftForm.endTime,
              color: selectedEmployee.color,
            };
            newShifts.push(updatedShift);
          }
        }
      } else {
        const updatedShift: Shift = {
          ...selectedShift,
          employeeId: editShiftForm.employeeId,
          employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`.trim(),
          date: editShiftForm.date,
          startTime: editShiftForm.startTime,
          endTime: editShiftForm.endTime,
          color: selectedEmployee.color,
        };
        newShifts.push(updatedShift);
      }

      // Remove the original shift
      const updatedShifts = shifts.filter(shift => shift.id !== selectedShift.id);

      // Save all new shifts
      for (const shift of newShifts) {
        updatedShifts.push(shift);
      }

      const response = await fetch('http://localhost:3001/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedShifts),
      });
      if (!response.ok) throw new Error('Failed to update shift');

      setShifts(updatedShifts);
      setIsEditShiftOpen(false);
      setSelectedShift(null);
    } catch (err: unknown) {
      console.error('Schedule: Failed to update shift:', err);
      setError(err instanceof Error ? err.message : 'Failed to update shift. Please try again.');
    }
  };

  const handleDeleteShift = async () => {
    if (!selectedShift) return;
    try {
      const updatedShifts = shifts.filter(shift => shift.id !== selectedShift.id);
      const response = await fetch('http://localhost:3001/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedShifts),
      });
      if (!response.ok) throw new Error('Failed to delete shift');

      setShifts(updatedShifts);
      setIsEditShiftOpen(false);
      setIsDeleteConfirmOpen(false);
      setSelectedShift(null);
    } catch (err: unknown) {
      console.error('Schedule: Failed to delete shift:', err);
      setError('Failed to delete shift. Please try again.');
    }
  };

  if (!user) {
    return <div className="p-6 text-center text-bradley-dark-gray">Access Denied</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-bradley-dark-gray">Schedule</h1>
        {user.role === 'admin' && (
          <button
            className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
            onClick={() => setIsAddShiftOpen(true)}
          >
            Add Shift
          </button>
        )}
      </div>
      {error && <p className="text-bradley-red text-sm mb-4">{error}</p>}
      <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley mb-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handlePreviousMonth}
            className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
          >
            Previous
          </button>
          <h2 className="text-xl font-semibold text-bradley-dark-gray">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={handleNextMonth}
            className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
          >
            Next
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-semibold text-bradley-dark-gray">
              {day}
            </div>
          ))}
          {emptyDays}
          {daysInMonth.map((day) => {
            const isToday = isSameDay(day, new Date());
            const dayShifts = shifts.filter((shift) => isSameDay(parse(shift.date, 'yyyy-MM-dd', new Date()), day));
            const dayRequests = requests.filter((req) => req.type === 'Time Off' && isSameDay(parse(req.date, 'yyyy-MM-dd', new Date()), day));
            return (
              <div
                key={day.toString()}
                className={`border border-bradley-medium-gray p-2 min-h-[100px] relative ${isToday ? 'bg-bradley-blue bg-opacity-20' : ''}`}
              >
                <div className="text-bradley-dark-gray">{format(day, 'd')}</div>
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={`mt-1 p-1 rounded text-sm text-white ${user.role === 'admin' ? 'cursor-pointer hover:opacity-80' : ''}`}
                    style={{ backgroundColor: shift.color }}
                    onClick={() => {
                      if (user.role === 'admin') {
                        setSelectedShift(shift);
                        setEditShiftForm({
                          employeeId: shift.employeeId,
                          date: shift.date,
                          startTime: shift.startTime,
                          endTime: shift.endTime,
                        });
                        setIsEditShiftOpen(true);
                      }
                    }}
                  >
                    {shift.employeeName}: {shift.startTime} - {shift.endTime}
                  </div>
                ))}
                {dayRequests.map((req) => (
                  <div
                    key={req.id}
                    className="mt-1 p-1 rounded text-sm text-bradley-dark-gray bg-yellow-200"
                  >
                    {req.employee} - {req.status === 'Approved' ? 'Off' : `Time Off (${req.time || 'All Day'}) - ${req.status}`}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {isAddShiftOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4 text-bradley-dark-gray">Add Shift</h3>
            <form onSubmit={handleAddShiftSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Employee</label>
                <select
                  value={addShiftForm.employeeId}
                  onChange={(e) => setAddShiftForm({ ...addShiftForm, employeeId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Date</label>
                <input
                  type="date"
                  value={addShiftForm.date}
                  min={format(new Date(), 'yyyy-MM-dd')} // Prevent past dates
                  onChange={(e) => setAddShiftForm({ ...addShiftForm, date: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Start Time</label>
                <input
                  type="time"
                  value={addShiftForm.startTime}
                  onChange={(e) => setAddShiftForm({ ...addShiftForm, startTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">End Time</label>
                <input
                  type="time"
                  value={addShiftForm.endTime}
                  onChange={(e) => setAddShiftForm({ ...addShiftForm, endTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
                  onClick={() => setIsAddShiftOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                >
                  Add Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditShiftOpen && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4 text-bradley-dark-gray">Edit Shift</h3>
            <form onSubmit={handleEditShiftSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Employee</label>
                <select
                  value={editShiftForm.employeeId}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, employeeId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Date</label>
                <input
                  type="date"
                  value={editShiftForm.date}
                  min={format(new Date(), 'yyyy-MM-dd')} // Prevent past dates
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, date: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">Start Time</label>
                <input
                  type="time"
                  value={editShiftForm.startTime}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, startTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-bradley-dark-gray">End Time</label>
                <input
                  type="time"
                  value={editShiftForm.endTime}
                  onChange={(e) => setEditShiftForm({ ...editShiftForm, endTime: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
                  required
                />
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="flex items-center px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                >
                  <Trash size={16} className="mr-2" /> Delete Shift
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
                    onClick={() => {
                      setIsEditShiftOpen(false);
                      setSelectedShift(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && selectedShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-bradley-dark-gray">Confirm Delete</h3>
            <p className="text-bradley-dark-gray mb-6">
              Are you sure you want to delete this shift for {selectedShift.employeeName} on {selectedShift.date} from {selectedShift.startTime} to {selectedShift.endTime}?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteShift}
                className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}