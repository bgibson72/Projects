import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, addDays, addMonths, subMonths, differenceInDays } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
}

interface Request {
  id: string;
  employee: string;
  type: 'Time Off' | 'Shift Coverage';
  date: string;
  time?: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  phone: string;
  idNumber: string;
  color: string;
}

interface DailySchedule {
  day: Date;
  shifts: Shift[];
  requests: Request[];
}

export default function Schedule() {
  const { user } = useAuthStore();
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('monthly'); // Default to monthly view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState({
    employeeId: '',
    startDate: new Date(),
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    days: [] as string[],
    repeat: 'no-repeat',
    endDate: null as Date | null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shiftsResponse, requestsResponse, employeesResponse] = await Promise.all([
          fetch('http://localhost:3001/api/shifts'),
          fetch('http://localhost:3001/api/requests'),
          user?.role === 'admin' ? fetch('http://localhost:3001/api/employees') : Promise.resolve({ json: () => Promise.resolve([]) }),
        ]);
        if (!shiftsResponse.ok || !requestsResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        const shiftsData = await shiftsResponse.json();
        const requestsData = await requestsResponse.json();
        const employeesData = await employeesResponse.json();
        setShifts(shiftsData);
        setRequests(requestsData);
        setEmployees(employeesData);
      } catch (err: unknown) {
        console.error('Schedule: Failed to fetch data:', err);
      }
    };
    fetchData();
  }, [user]);

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newShift = {
        id: `s${Date.now()}`,
        employeeId: shiftForm.employeeId,
        employeeName:
          employees.find((emp: Employee) => emp.id === shiftForm.employeeId)?.firstName +
          ' ' +
          (employees.find((emp: Employee) => emp.id === shiftForm.employeeId)?.lastName || ''),
        date: format(shiftForm.startDate, 'yyyy-MM-dd'),
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        color: employees.find((emp: Employee) => emp.id === shiftForm.employeeId)?.color || '#939598',
      };
      const response = await fetch('http://localhost:3001/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newShift),
      });
      if (!response.ok) throw new Error('Failed to add shift');

      if (shiftForm.repeat !== 'no-repeat') {
        const daysToAdd = shiftForm.days.map((day) => {
          const dayMap: { [key: string]: number } = {
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6,
            Sun: 0,
          };
          return dayMap[day];
        });
        const additionalShifts: Shift[] = [];

        if (shiftForm.repeat === 'this-week') {
          // Add shifts for the selected days within the current week
          const weekStart = startOfWeek(shiftForm.startDate, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(shiftForm.startDate, { weekStartsOn: 1 });
          const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
          daysToAdd.forEach((dayIndex) => {
            const newDate = weekDays.find((d) => d.getDay() === dayIndex);
            if (newDate && newDate >= shiftForm.startDate) {
              additionalShifts.push({
                ...newShift,
                id: `s${Date.now() + dayIndex}`,
                date: format(newDate, 'yyyy-MM-dd'),
              });
            }
          });
        } else if (shiftForm.repeat === 'every-week' && shiftForm.endDate) {
          // Add shifts for the selected days every week until the end date
          const weeks = Math.ceil(differenceInDays(shiftForm.endDate, shiftForm.startDate) / 7);
          for (let i = 0; i <= weeks; i++) {
            daysToAdd.forEach((dayIndex) => {
              const newDate = addDays(shiftForm.startDate, i * 7 + (dayIndex - new Date(shiftForm.startDate).getDay()));
              if (newDate <= shiftForm.endDate && newDate >= shiftForm.startDate) {
                additionalShifts.push({
                  ...newShift,
                  id: `s${Date.now() + i + dayIndex}`,
                  date: format(newDate, 'yyyy-MM-dd'),
                });
              }
            });
          }
        }

        for (const shift of additionalShifts) {
          await fetch('http://localhost:3001/api/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shift),
          });
        }
      }

      const shiftsResponse = await fetch('http://localhost:3001/api/shifts');
      if (!shiftsResponse.ok) throw new Error('Failed to fetch shifts');
      const shiftsData = await shiftsResponse.json();
      setShifts(shiftsData);
      setShiftForm({
        employeeId: '',
        startDate: new Date(),
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        days: [],
        repeat: 'no-repeat',
        endDate: null,
      });
      setIsAddShiftOpen(false);
    } catch (err: unknown) {
      console.error('Schedule: Failed to add shift:', err);
    }
  };

  const handleShiftFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShiftForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDayToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const days = checked
      ? [...shiftForm.days, value]
      : shiftForm.days.filter((d) => d !== value);
    setShiftForm((prev) => ({ ...prev, days }));
  };

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Helper function to parse time (e.g., "09:00 AM") to minutes for comparison
  const parseTimeToMinutes = (time: string): number => {
    const [timePart, period] = time.split(' ');
    const [hours, minutes] = timePart.split(':').map(Number);
    let adjustedHours = hours;
    if (period === 'PM' && hours !== 12) adjustedHours += 12;
    if (period === 'AM' && hours === 12) adjustedHours = 0;
    return adjustedHours * 60 + minutes;
  };

  // Filter shifts based on approved time off requests
  const filterShiftsByTimeOff = (shifts: Shift[], requests: Request[]): Shift[] => {
    return shifts.filter((shift) => {
      const shiftDate = shift.date;
      const relevantRequests = requests.filter(
        (req) =>
          req.date === shiftDate &&
          req.employee === shift.employeeName &&
          req.status === 'Approved'
      );

      for (const request of relevantRequests) {
        if (request.time === 'All Day') {
          return false; // Shift is fully covered by an approved Full Day request
        } else if (request.time) {
          const [requestStartTime, requestEndTime] = request.time.split('-');
          const requestStartMinutes = parseTimeToMinutes(requestStartTime.trim());
          const requestEndMinutes = parseTimeToMinutes(requestEndTime.trim());
          const shiftStartMinutes = parseTimeToMinutes(shift.startTime);
          const shiftEndMinutes = parseTimeToMinutes(shift.endTime);

          // Check if the request fully covers the shift
          if (requestStartMinutes <= shiftStartMinutes && requestEndMinutes >= shiftEndMinutes) {
            return false; // Shift is fully covered by the Partial Day request
          }
        }
      }
      return true; // Shift is not fully covered by any approved time off request
    });
  };

  // Apply the filter to daily, weekly, and monthly shifts
  const filteredDailyShifts = user?.role === 'admin'
    ? filterShiftsByTimeOff(
        shifts.filter((shift) => shift.date === format(currentDate, 'yyyy-MM-dd')),
        requests
      )
    : filterShiftsByTimeOff(
        shifts.filter(
          (shift) => shift.date === format(currentDate, 'yyyy-MM-dd') && shift.employeeId === user?.id
        ),
        requests
      );

  const filteredWeeklySchedule: DailySchedule[] = weekDays.map((day: Date) => {
    const dayShifts = user?.role === 'admin'
      ? shifts.filter((shift) => shift.date === format(day, 'yyyy-MM-dd'))
      : shifts.filter(
          (shift) => shift.date === format(day, 'yyyy-MM-dd') && shift.employeeId === user?.id
        );
    const filteredDayShifts = filterShiftsByTimeOff(dayShifts, requests);
    const dayRequests = requests.filter(
      (req) => req.date === format(day, 'yyyy-MM-dd') && req.status === 'Approved'
    );
    return { day, shifts: filteredDayShifts, requests: dayRequests };
  });

  const filteredMonthlySchedule: DailySchedule[] = monthDays.map((day: Date) => {
    const dayShifts = user?.role === 'admin'
      ? shifts.filter((shift) => shift.date === format(day, 'yyyy-MM-dd'))
      : shifts.filter(
          (shift) => shift.date === format(day, 'yyyy-MM-dd') && shift.employeeId === user?.id
        );
    const filteredDayShifts = filterShiftsByTimeOff(dayShifts, requests);
    const dayRequests = requests.filter(
      (req) => req.date === format(day, 'yyyy-MM-dd') && req.status === 'Approved'
    );
    return { day, shifts: filteredDayShifts, requests: dayRequests };
  });

  if (!user) {
    return null;
  }

  return (
    <div className='bg-white p-6 rounded-lg shadow-lg'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold text-bradley-dark-gray'>Schedule</h1>
        <div className='flex space-x-2'>
          <button
            className={`px-4 py-2 rounded-md ${view === 'daily' ? 'bg-[#f7695f] text-white shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]' : 'bg-bradley-light-gray text-bradley-dark-gray shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'}`}
            onClick={() => setView('daily')}
          >
            Daily
          </button>
          <button
            className={`px-4 py-2 rounded-md ${view === 'weekly' ? 'bg-[#f7695f] text-white shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]' : 'bg-bradley-light-gray text-bradley-dark-gray shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'}`}
            onClick={() => setView('weekly')}
          >
            Weekly
          </button>
          <button
            className={`px-4 py-2 rounded-md ${view === 'monthly' ? 'bg-[#f7695f] text-white shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]' : 'bg-bradley-light-gray text-bradley-dark-gray shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'}`}
            onClick={() => setView('monthly')}
          >
            Monthly
          </button>
        </div>
      </div>

      {view === 'daily' && (
        <div>
          <div className='flex justify-between items-center mb-4'>
            <div className='flex items-center space-x-2'>
              <h2 className='text-xl font-semibold text-bradley-dark-gray'>
                Daily Schedule - {format(currentDate, 'MM/dd/yyyy')}
              </h2>
            </div>
            <div className='flex space-x-2'>
              <DatePicker
                selected={currentDate}
                onChange={(date: Date) => date && setCurrentDate(date)}
                dateFormat='MM/dd/yyyy'
                className='px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
              />
              {user.role === 'admin' && (
                <button
                  className='px-4 py-2 bg-[#f7695f] text-white rounded-md shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]'
                  onClick={() => setIsAddShiftOpen(true)}
                >
                  Add Shift
                </button>
              )}
            </div>
          </div>
          {filteredDailyShifts.length === 0 ? (
            <p className='text-lg text-bradley-medium-gray'>No shifts scheduled for today.</p>
          ) : (
            <div className='space-y-2'>
              {filteredDailyShifts.map((shift) => (
                <div
                  key={shift.id}
                  className='p-2 rounded'
                  style={{ backgroundColor: `${shift.color}33`, color: shift.color }}
                >
                  {shift.startTime} - {shift.endTime}
                  {user.role === 'admin' && ` (${shift.employeeName})`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'weekly' && (
        <div>
          <div className='flex justify-between items-center mb-4'>
            <div className='flex items-center space-x-2'>
              <button
                className='px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                Previous
              </button>
              <button
                className='px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                Next
              </button>
              <h2 className='text-xl font-semibold text-bradley-dark-gray'>
                Weekly Schedule - {format(weekStart, 'MM/dd/yyyy')} to {format(weekEnd, 'MM/dd/yyyy')}
              </h2>
            </div>
            {user.role === 'admin' && (
              <button
                className='px-4 py-2 bg-[#f7695f] text-white rounded-md shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]'
                onClick={() => setIsAddShiftOpen(true)}
              >
                Add Shift
              </button>
            )}
          </div>
          <div className='grid grid-cols-7 gap-2'>
            {filteredWeeklySchedule.map((day) => {
              const dayStr = format(day.day, 'yyyy-MM-dd');
              return (
                <div key={dayStr} className='border border-bradley-medium-gray p-2 rounded-md'>
                  <div className='text-center font-medium text-bradley-dark-gray'>
                    {format(day.day, 'EEE')}
                  </div>
                  <div className='text-center text-sm text-bradley-medium-gray'>
                    {format(day.day, 'MM/dd')}
                  </div>
                  <div className='mt-2 space-y-1'>
                    {day.shifts.map((shift) => (
                      <div
                        key={shift.id}
                        className='text-xs p-1 rounded'
                        style={{ backgroundColor: `${shift.color}33`, color: shift.color }}
                      >
                        {shift.startTime} - {shift.endTime}
                        {user.role === 'admin' && ` (${shift.employeeName})`}
                      </div>
                    ))}
                    {day.requests.map((request) => (
                      <div
                        key={request.id}
                        className='text-xs p-1 rounded bg-gray-200 text-bradley-dark-gray'
                      >
                        Time Off: {request.employee} {request.time || 'All Day'}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'monthly' && (
        <div>
          <div className='flex justify-between items-center mb-4'>
            <div className='flex items-center space-x-2'>
              <button
                className='px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                Previous
              </button>
              <button
                className='px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                Next
              </button>
              <h2 className='text-xl font-semibold text-bradley-dark-gray'>
                {format(currentDate, 'MMMM yyyy')}
              </h2>
            </div>
            {user.role === 'admin' && (
              <button
                className='px-4 py-2 bg-[#f7695f] text-white rounded-md shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]'
                onClick={() => setIsAddShiftOpen(true)}
              >
                Add Shift
              </button>
            )}
          </div>
          <div className='grid grid-cols-7 gap-2'>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className='text-center font-medium text-bradley-dark-gray'>
                {day}
              </div>
            ))}
            {monthDays.map((day: Date) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              return (
                <div
                  key={dayStr}
                  className={`border border-bradley-medium-gray p-2 rounded-md min-h-[100px] ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-100'
                  }`}
                >
                  <div className='text-right font-medium text-bradley-dark-gray'>
                    {format(day, 'd')}
                  </div>
                  <div className='mt-1 space-y-1'>
                    {filteredMonthlySchedule
                      .find((d: DailySchedule) => format(d.day, 'yyyy-MM-dd') === dayStr)
                      ?.shifts.map((shift: Shift) => (
                        <div
                          key={shift.id}
                          className='text-xs p-1 rounded'
                          style={{ backgroundColor: `${shift.color}33`, color: shift.color }}
                        >
                          {shift.startTime} - {shift.endTime}
                          {user.role === 'admin' && ` (${shift.employeeName})`}
                        </div>
                      ))}
                    {filteredMonthlySchedule
                      .find((d: DailySchedule) => format(d.day, 'yyyy-MM-dd') === dayStr)
                      ?.requests.map((request: Request) => (
                        <div
                          key={request.id}
                          className='text-xs p-1 rounded bg-gray-200 text-bradley-dark-gray'
                        >
                          Time Off: {request.employee} {request.time || 'All Day'}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {user.role === 'admin' && isAddShiftOpen && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-full max-w-lg'>
            <h3 className='text-lg font-semibold mb-4 text-bradley-dark-gray'>Add Shift</h3>
            <form onSubmit={handleShiftSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Date</label>
                <DatePicker
                  selected={shiftForm.startDate}
                  onChange={(date: Date) => date && setShiftForm((prev) => ({ ...prev, startDate: date }))}
                  dateFormat='MM/dd/yyyy'
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Start Time</label>
                <input
                  type='text'
                  name='startTime'
                  value={shiftForm.startTime}
                  onChange={handleShiftFormChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>End Time</label>
                <input
                  type='text'
                  name='endTime'
                  value={shiftForm.endTime}
                  onChange={handleShiftFormChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Repeat</label>
                <div className='mt-1 flex flex-wrap space-x-4'>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                    <label key={day} className='flex items-center'>
                      <input
                        type='checkbox'
                        value={day}
                        checked={shiftForm.days.includes(day)}
                        onChange={handleDayToggle}
                        className='mr-1'
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Repeat Option</label>
                <select
                  name='repeat'
                  value={shiftForm.repeat}
                  onChange={(e) => {
                    handleShiftFormChange(e);
                    if (e.target.value !== 'every-week') {
                      setShiftForm((prev) => ({ ...prev, endDate: null }));
                    }
                  }}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-white bg-opacity-100'
                >
                  <option value='no-repeat'>No Repeat</option>
                  <option value='this-week'>This Week</option>
                  <option value='every-week'>Every Week</option>
                </select>
              </div>
              {shiftForm.repeat === 'every-week' && (
                <div>
                  <label className='block text-sm font-medium text-bradley-dark-gray'>End Date</label>
                  <DatePicker
                    selected={shiftForm.endDate}
                    onChange={(date: Date) => date && setShiftForm((prev) => ({ ...prev, endDate: date }))}
                    dateFormat='MM/dd/yyyy'
                    className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                    minDate={shiftForm.startDate}
                  />
                </div>
              )}
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Employee</label>
                <select
                  name='employeeId'
                  value={shiftForm.employeeId}
                  onChange={handleShiftFormChange}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-white bg-opacity-100'
                  required
                >
                  <option value=''>Select Employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className='flex justify-end space-x-2'>
                <button
                  type='button'
                  className='px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md shadow-[0_4px_0_0_#939598] active:shadow-[0_1px_1px_0_#939598]'
                  onClick={() => {
                    setShiftForm({
                      employeeId: '',
                      startDate: new Date(),
                      startTime: '09:00 AM',
                      endTime: '05:00 PM',
                      days: [],
                      repeat: 'no-repeat',
                      endDate: null,
                    });
                    setIsAddShiftOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 bg-[#f7695f] text-white rounded-md shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]'
                >
                  Add Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}