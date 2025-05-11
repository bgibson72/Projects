import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { isSameDay } from 'date-fns';
import { addRequest } from '@/api/mockApi';

export default function TimeOffRequest() {
  const [form, setForm] = useState({
    startDate: new Date(),
    endDate: new Date(),
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    useTimes: false,
  });
  const [error, setError] = useState('');

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute} ${ampm}`;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addRequest({
        id: `r${Date.now()}`,
        employee: 'Current User', // Replace with actual user name from auth
        type: 'Time Off',
        date: form.startDate.toISOString().split('T')[0],
        time:
          form.useTimes && isSameDay(form.startDate, form.endDate)
            ? `${form.startTime} - ${form.endTime}`
            : undefined,
        status: 'Pending',
      });
      setError('');
      // Navigate or show success
    } catch {
      setError('Failed to submit request. Please try again.');
    }
  };

  return (
    <div className='bg-white p-6 rounded-lg shadow-lg'>
      <h1 className='text-3xl font-bold mb-6 text-bradley-dark-gray'>Time Off Request</h1>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-bradley-dark-gray'>Start Date</label>
          <DatePicker
            selected={form.startDate}
            onChange={(date: Date | null) => {
              if (date) {
                setForm({ ...form, startDate: date });
              }
            }}
            className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-bradley-dark-gray'>End Date</label>
          <DatePicker
            selected={form.endDate}
            onChange={(date: Date | null) => {
              if (date) {
                setForm({ ...form, endDate: date });
              }
            }}
            className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
          />
        </div>
        <div>
          <label className='flex items-center space-x-2'>
            <input
              type='checkbox'
              checked={form.useTimes}
              onChange={(e) => setForm({ ...form, useTimes: e.target.checked })}
              className='mr-1 text-bradley-dark-red focus:ring-bradley-dark-red'
            />
            <span className='text-sm font-medium text-bradley-dark-gray'>Specify Times</span>
          </label>
          {form.useTimes && (
            <>
              <div>
                <label className='block text-sm font-medium text-bradley-dark-gray'>
                  Start Time
                </label>
                <select
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
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
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className='mt-1 w-full px-3 py-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:ring-bradley-dark-red focus:border-bradley-dark-red'
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
        {error && (
          <div className='text-bradley-red'>
            {error}
            <button
              className='ml-2 px-2 py-1 bg-bradley-red text-white rounded-md hover:bg-bradley-dark-red'
              onClick={() => {
                console.log('Requesting anyway:', form);
                setError('');
              }}
            >
              Request Anyway
            </button>
          </div>
        )}
        <button
          type='submit'
          className='w-full bg-bradley-red text-white py-2 px-4 rounded-md hover:bg-bradley-dark-red'
        >
          Submit Request
        </button>
      </form>
    </div>
  );
}
