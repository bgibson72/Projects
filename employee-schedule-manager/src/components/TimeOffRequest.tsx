import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'employee' | 'admin';
}

interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
}

export default function TimeOffRequest() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [requestType, setRequestType] = useState<'Full Day' | 'Partial Day'>('Full Day');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shiftsResponse, employeesResponse, usersResponse] = await Promise.all([
          fetch('http://localhost:3001/api/shifts'),
          user?.role === 'admin' ? fetch('http://localhost:3001/api/employees') : Promise.resolve({ json: () => Promise.resolve([]) }),
          user?.role === 'admin' ? fetch('http://localhost:3001/api/users') : Promise.resolve({ json: () => Promise.resolve([]) }),
        ]);
        if (!shiftsResponse.ok) throw new Error('Failed to fetch shifts');
        const shiftsData = await shiftsResponse.json();
        setShifts(shiftsData);

        if (user?.role === 'admin') {
          if (!(employeesResponse instanceof Response && employeesResponse.ok) || !(usersResponse instanceof Response && usersResponse.ok)) {
            throw new Error('Failed to fetch admin data');
          }
          const employeesData = await employeesResponse.json();
          const usersData = await usersResponse.json();
          setEmployees(employeesData);
          setUsers(usersData);
          const nonAdminEmployees = employeesData.filter((emp: Employee) => {
            const user = usersData.find((u: User) => u.id === emp.id);
            return user && user.role !== 'admin';
          });
          if (nonAdminEmployees.length > 0) setSelectedEmployeeId(nonAdminEmployees[0].id);
        }
      } catch (err: unknown) {
        setError('Failed to load data. Please try again.');
        console.error('TimeOffRequest: Failed to fetch data:', err);
      }
    };
    fetchData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !startDate || !endDate) return;
    if (user.role === 'admin' && !selectedEmployeeId) return;

    try {
      const selectedEmployee = user.role === 'admin'
        ? employees.find((emp) => emp.id === selectedEmployeeId)
        : null;
      const request = {
        id: `r${Date.now()}`,
        employee: user.role === 'admin' ? `${selectedEmployee?.firstName} ${selectedEmployee?.lastName}` : user.name,
        type: 'Time Off',
        date: format(startDate, 'yyyy-MM-dd'),
        time: requestType === 'Full Day' ? 'All Day' : `${startTime}-${endTime}`,
        status: user.role === 'admin' ? 'Approved' : 'Pending',
      };
      const response = await fetch('http://localhost:3001/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('Failed to submit time off request');
      navigate('/dashboard');
    } catch (err: unknown) {
      setError('Failed to submit time off request. Please try again.');
      console.error('TimeOffRequest: Failed to submit:', err);
    }
  };

  const format = (date: Date, formatStr: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: formatStr.includes('yyyy') ? 'numeric' : undefined,
      month: formatStr.includes('MM') ? 'numeric' : undefined,
      day: formatStr.includes('dd') ? '2-digit' : undefined,
    })
      .format(date)
      .replace(/\//g, '-');
  };

  // Helper function to parse time (e.g., "09:00 AM") to minutes for comparison
  const parseTimeToMinutes = (time: string): number => {
    const [timePart, period] = time.split(' ');
    const [hours, minutes] = timePart.split(':').map(Number);
    let adjustedHours = hours;
    if (period === 'PM' && hours !== 12) adjustedHours += 12;
    if (period === 'AM' && hours === 12) adjustedHours = 0;
    return adjustedHours * 60 + minutes;
  };

  // Filter and sort shifts within the selected date range for the current employee
  const conflictingShifts = startDate && endDate
    ? shifts
        .filter((shift) => {
          if (user?.role !== 'employee') return false; // Only show for employees
          if (shift.employeeId !== user?.id) return false; // Only show employee's own shifts
          const shiftDate = new Date(shift.date);
          return shiftDate >= startDate && shiftDate <= endDate;
        })
        .sort((a, b) => {
          // Sort by start time first
          const startTimeA = parseTimeToMinutes(a.startTime);
          const startTimeB = parseTimeToMinutes(b.startTime);
          if (startTimeA !== startTimeB) {
            return startTimeA - startTimeB;
          }
          // If start times are equal, sort by date
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        })
    : [];

  if (!user) {
    return null;
  }

  return (
    <div className='bg-white p-6 rounded-lg shadow-lg'>
      <h1 className='text-3xl font-bold mb-6 text-bradley-dark-gray'>
        {user.role === 'admin' ? 'Create Time Off for Employee' : 'Time Off Request'}
      </h1>
      {error && <p className='text-bradley-red mb-4'>{error}</p>}
      <div className='grid md:grid-cols-2 gap-6'>
        {/* Form Section */}
        <div>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Employee Dropdown (Admin Only) */}
            {user.role === 'admin' && (
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Employee</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray bg-white bg-opacity-100'
                  required
                >
                  <option value='' disabled>Select Employee</option>
                  {employees
                    .filter((emp) => {
                      const employeeUser = users.find((u) => u.id === emp.id);
                      return employeeUser && employeeUser.role !== 'admin';
                    })
                    .map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Request Type Radio Buttons */}
            <div>
              <label className='block text-sm font-medium text-bradley-dark-gray'>Request Type</label>
              <div className='mt-1 flex space-x-4'>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='requestType'
                    value='Full Day'
                    checked={requestType === 'Full Day'}
                    onChange={() => setRequestType('Full Day')}
                    className='mr-2'
                  />
                  Full Day
                </label>
                <label className='flex items-center'>
                  <input
                    type='radio'
                    name='requestType'
                    value='Partial Day'
                    checked={requestType === 'Partial Day'}
                    onChange={() => setRequestType('Partial Day')}
                    className='mr-2'
                  />
                  Partial Day
                </label>
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className='block text-sm font-medium text-bradley-dark-gray'>Start Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date) => date && setStartDate(date)}
                dateFormat='MM/dd/yyyy'
                className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                required
              />
            </div>

            {/* End Date */}
            <div>
              <label className='block text-sm font-medium text-bradley-dark-gray'>End Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date) => date && setEndDate(date)}
                dateFormat='MM/dd/yyyy'
                className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                minDate={startDate || new Date()}
                required
              />
            </div>

            {/* Start Time and End Time (Partial Day Only) */}
            {requestType === 'Partial Day' && (
              <>
                <div>
                  <label className='block text-sm font-medium text-bradley-dark-gray'>Start Time</label>
                  <input
                    type='text'
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-bradley-dark-gray'>End Time</label>
                  <input
                    type='text'
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray'
                    required
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className='flex justify-start'>
              <button
                type='submit'
                className='px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]'
              >
                Submit
              </button>
            </div>
          </form>
        </div>

        {/* Conflicting Shifts Section (Employee Only) */}
        {user.role === 'employee' && (
          <div className='bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-[0_4px_0_0_#939598]'>
            <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>Existing Shifts</h2>
            {conflictingShifts.length === 0 ? (
              <p className='text-bradley-medium-gray'>No shifts scheduled in the selected date range.</p>
            ) : (
              <div className='space-y-2'>
                {conflictingShifts.map((shift) => (
                  <div key={shift.id} className='text-sm text-bradley-dark-gray'>
                    {shift.startTime} - {shift.endTime} on {format(new Date(shift.date), 'MM-dd-yyyy')}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}