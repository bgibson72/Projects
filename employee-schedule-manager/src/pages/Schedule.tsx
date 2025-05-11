import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getShifts, addShift, getEmployees } from '@/api/mockApi';

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
  color: string;
}

export default function Schedule() {
  const { user } = useAuthStore();
  const [view, setView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 4, 5)); // May 5, 2025
  const [isAddShiftOpen, setIsAddShiftOpen] = useState<boolean>(false);
  const [schedules, setSchedules] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shiftForm, setShiftForm] = useState({
    startDate: new Date(),
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    days: [] as string[],
    repeat: 'No' as 'No' | 'This Week Only' | 'Every Week',
    endDate: new Date(),
    employeeId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const shiftsData = await getShifts();
        const employeesData = await getEmployees();
        console.log('Schedule: Fetched shifts:', shiftsData);
        console.log('Schedule: Fetched employees:', employeesData);
        setSchedules(shiftsData);
        setEmployees(employeesData);
        setError(null);
      } catch (err) {
        console.error('Schedule: Failed to fetch data:', err);
        setError('Failed to load schedule data. Please try again.');
      }
    };
    fetchData();
  }, []);

  const filteredSchedules =
    user?.role === 'employee'
      ? schedules.filter((shift) => shift.employeeId === user?.id)
      : schedules;

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addShift({
        id: `s${Date.now()}`,
        employeeId: shiftForm.employeeId,
        employeeName:
          employees.find((emp) => emp.id === shiftForm.employeeId)?.firstName +
            ' ' +
            employees.find((emp) => emp.id === shiftForm.employeeId)?.lastName || '',
        date: format(shiftForm.startDate, 'yyyy-MM-dd'),
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        color:
          employees.find((emp) => emp.id === shiftForm.employeeId)?.color ||
          'bg-bradley-medium-gray',
      });
      const shiftsData = await getShifts();
      console.log('Schedule: Added shift, new shifts:', shiftsData);
      setSchedules(shiftsData);
      setError(null);
      setIsAddShiftOpen(false);
    } catch (err) {
      console.error('Schedule: Failed to add shift:', err);
      setError('Failed to add shift. Please try again.');
    }
  };

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute} ${ampm}`;
  });

  if (error) {
    return (
      <div className='bg-white p-6 rounded-lg shadow-lg'>
        <h1 className='text-3xl font-bold mb-6 text-bradley-dark-gray'>Schedule</h1>
        <p className='text-bradley-red'>{error}</p>
      </div>
    );
  }

  const renderDailyView = () => {
    const today = format(currentDate, 'yyyy-MM-dd');
    const todayShifts = filteredSchedules.filter((shift) => shift.date === today);

    return (
      <div className='bg-white p-4 rounded-lg shadow-md'>
        <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>
          Daily Schedule - {format(currentDate, 'MMMM d, yyyy')}
        </h2>
        {todayShifts.length === 0 ? (
          <p className='text-lg text-bradley-medium-gray'>No shifts scheduled for today.</p>
        ) : (
          <ul className='space-y-2'>
            {todayShifts.map((shift) => (
              <li
                key={shift.id}
                className={`p-3 rounded ${shift.color} flex justify-between items-center`}
              >
                <span className='text-lg'>
                  <span style={{ color: shift.color }}>{shift.employeeName}</span>:{' '}
                  {shift.startTime} - {shift.endTime}
                </span>
                {user?.role === 'admin' && (
                  <button className='text-bradley-sky-blue hover:underline text-sm'>Edit</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const renderWeeklyView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return (
      <div className='bg-white p-4 rounded-lg shadow-md'>
        <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>
          Weekly Schedule - {format(weekStart, 'MMMM d')} to {format(weekEnd, 'MMMM d, yyyy')}
        </h2>
        <div className='grid grid-cols-7 gap-2'>
          {days.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayShifts = filteredSchedules.filter((shift) => shift.date === dayStr);
            return (
              <div key={dayStr} className='border p-2'>
                <h3 className='text-sm font-medium text-bradley-dark-gray'>
                  {format(day, 'EEE, MMM d')}
                </h3>
                {dayShifts.length === 0 ? (
                  <p className='text-xs text-bradley-medium-gray'>No shifts</p>
                ) : (
                  <ul className='space-y-1'>
                    {dayShifts.map((shift) => (
                      <li
                        key={shift.id}
                        className={`p-1 text-xs ${shift.color} rounded text-bradley-dark-gray`}
                      >
                        <span style={{ color: shift.color }}>{shift.employeeName}</span>:{' '}
                        {shift.startTime} - {shift.endTime}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthlyView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const firstDayOfMonth = startOfWeek(monthStart, { weekStartsOn: 1 });
    const lastDayOfMonth = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

    return (
      <div className='bg-white p-6 rounded-lg shadow-md'>
        <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>
          Monthly Schedule - {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className='grid grid-cols-7 gap-1 text-center'>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className='font-medium text-sm text-bradley-dark-gray'>
              {day}
            </div>
          ))}
          {allDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayShifts = filteredSchedules.filter((shift) => shift.date === dayStr);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            return (
              <div
                key={dayStr}
                className={`border p-1 min-h-[100px] text-xs ${isCurrentMonth ? '' : 'bg-bradley-light-gray'}`}
              >
                <div className='text-right text-bradley-dark-gray'>{format(day, 'd')}</div>
                {dayShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={`p-1 mt-1 ${shift.color} rounded text-xs text-bradley-dark-gray`}
                  >
                    <span style={{ color: shift.color }}>{shift.employeeName}</span>:{' '}
                    {shift.startTime}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className='bg-white p-6 rounded-lg shadow-lg'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-3xl font-bold text-bradley-dark-gray'>Schedule</h1>
        {user?.role === 'admin' && (
          <button
            className='bg-bradley-red text-white px-4 py-2 rounded-md hover:bg-bradley-dark-red'
            onClick={() => setIsAddShiftOpen(true)}
          >
            Add Shift
          </button>
        )}
      </div>
      <div className='flex items-center space-x-4 mb-6'>
        <button
          className={`px-4 py-2 rounded-md ${
            view === 'daily'
              ? 'bg-bradley-sky-blue text-white'
              : 'bg-bradley-light-gray text-bradley-dark-gray'
          } hover:bg-bradley-dark-red hover:text-white transition-colors`}
          onClick={() => setView('daily')}
        >
          Daily
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            view === 'weekly'
              ? 'bg-bradley-sky-blue text-white'
              : 'bg-bradley-light-gray text-bradley-dark-gray'
          } hover:bg-bradley-dark-red hover:text-white transition-colors`}
          onClick={() => setView('weekly')}
        >
          Weekly
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            view === 'monthly'
              ? 'bg-bradley-sky-blue text-white'
              : 'bg-bradley-light-gray text-bradley-dark-gray'
          } hover:bg-bradley-dark-red hover:text-white transition-colors`}
          onClick={() => setView('monthly')}
        >
          Monthly
        </button>
        <div className='flex items-center space-x-2'>
          <button
            className='px-2 py-1 bg-bradley-light-gray rounded-md hover:bg-bradley-medium-gray text-bradley-dark-gray'
            onClick={() => {
              if (view === 'daily') setCurrentDate(subDays(currentDate, 1));
              else if (view === 'weekly') setCurrentDate(subWeeks(currentDate, 1));
              else setCurrentDate(subMonths(currentDate, 1));
            }}
          >
            ←
          </button>
          <DatePicker
            selected={currentDate}
            onChange={(date: Date | null) => {
              if (date) {
                setCurrentDate(date);
              }
            }}
            className='px-2 py-1 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
          />
          <button
            className='px-2 py-1 bg-bradley-light-gray rounded-md hover:bg-bradley-medium-gray text-bradley-dark-gray'
            onClick={() => {
              if (view === 'daily') setCurrentDate(addDays(currentDate, 1));
              else if (view === 'weekly') setCurrentDate(addWeeks(currentDate, 1));
              else setCurrentDate(addMonths(currentDate, 1));
            }}
          >
            →
          </button>
        </div>
      </div>
      {view === 'daily' && renderDailyView()}
      {view === 'weekly' && renderWeeklyView()}
      {view === 'monthly' && renderMonthlyView()}
      {isAddShiftOpen && user?.role === 'admin' && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-full max-w-md'>
            <h2 className='text-xl font-bold mb-4 text-bradley-dark-gray'>Add Shift</h2>
            <form onSubmit={handleShiftSubmit} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  Start Date
                </label>
                <DatePicker
                  selected={shiftForm.startDate}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setShiftForm({ ...shiftForm, startDate: date });
                    }
                  }}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  Start Time
                </label>
                <select
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>End Time</label>
                <select
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Days</label>
                <div className='flex space-x-2'>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <label key={day} className='flex items-center'>
                      <input
                        type='checkbox'
                        checked={shiftForm.days.includes(day)}
                        onChange={(e) => {
                          const days = e.target.checked
                            ? [...shiftForm.days, day]
                            : shiftForm.days.filter((d) => d !== day);
                          setShiftForm({ ...shiftForm, days });
                        }}
                        className='mr-1 text-bradley-dark-red focus:ring-bradley-dark-red'
                      />
                      <span className='text-bradley-dark-gray'>{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>Repeat</label>
                <select
                  value={shiftForm.repeat}
                  onChange={(e) =>
                    setShiftForm({
                      ...shiftForm,
                      repeat: e.target.value as 'No' | 'This Week Only' | 'Every Week',
                    })
                  }
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                >
                  <option value='No'>No</option>
                  <option value='This Week Only'>This Week Only</option>
                  <option value='Every Week'>Every Week</option>
                </select>
              </div>
              {shiftForm.repeat === 'Every Week' && (
                <div>
                  <label className='block text-sm font-medium text-bradley-dark-gray'>
                    End Date
                  </label>
                  <DatePicker
                    selected={shiftForm.endDate}
                    onChange={(date: Date | null) => {
                      if (date) {
                        setShiftForm({ ...shiftForm, endDate: date });
                      }
                    }}
                    className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                  />
                </div>
              )}
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  Assign to
                </label>
                <select
                  value={shiftForm.employeeId}
                  onChange={(e) => setShiftForm({ ...shiftForm, employeeId: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                >
                  <option value=''>Select Employee</option>
                  {employees.map((emp) => (
                    <option
                      key={emp.id}
                      value={emp.id}
                    >{`${emp.firstName} ${emp.lastName}`}</option>
                  ))}
                </select>
              </div>
              <div className='flex justify-end space-x-2'>
                <button
                  type='button'
                  className='px-4 py-2 bg-bradley-light-gray rounded-md hover:bg-bradley-medium-gray text-bradley-dark-gray'
                  onClick={() => setIsAddShiftOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 bg-bradley-red text-white rounded-md hover:bg-bradley-dark-red'
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
