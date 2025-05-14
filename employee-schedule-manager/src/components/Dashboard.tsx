import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Check, X } from 'lucide-react';

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
  title: string;
  message: string;
  date: string;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [shiftCoverageRequests, setShiftCoverageRequests] = useState<ShiftCoverageRequest[]>([]);
  const [currentDate] = useState(new Date());
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Mock announcements data (to be replaced with API call later)
  const announcements: Announcement[] = [
    {
      id: 'a1',
      title: 'Team Meeting',
      message: 'Team meeting scheduled for Wednesday at 10:00 AM in the conference room.',
      date: '2025-05-12',
    },
    {
      id: 'a2',
      title: 'System Maintenance',
      message: 'System maintenance will occur on Saturday from 1:00 AM to 3:00 AM. Expect downtime.',
      date: '2025-05-11',
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shiftsResponse, requestsResponse, coverageRequestsResponse] = await Promise.all([
          fetch('http://localhost:3001/api/shifts'),
          fetch('http://localhost:3001/api/requests'),
          fetch('http://localhost:3001/api/shiftCoverageRequests'),
        ]);
        if (!shiftsResponse.ok || !requestsResponse.ok || !coverageRequestsResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        const shiftsData = await shiftsResponse.json();
        const requestsData = await requestsResponse.json();
        const coverageRequestsData = await coverageRequestsResponse.json();
        setShifts(shiftsData);
        setRequests(requestsData);
        setShiftCoverageRequests(coverageRequestsData);
      } catch (err: unknown) {
        console.error('Dashboard: Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  const handleRequestAction = async (requestId: string, action: 'Approved' | 'Denied') => {
    try {
      const request = requests.find((req) => req.id === requestId);
      if (!request) return;
      const updatedRequest = { ...request, status: action };
      // Note: mockApiServer.cjs doesn't currently have an update endpoint; we'll simulate the update
      console.log(`Request ${requestId} ${action}`);
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? updatedRequest : req))
      );
    } catch (err: unknown) {
      console.error(`Dashboard: Failed to ${action.toLowerCase()} request:`, err);
    }
  };

  const getLowStaffingAlerts = () => {
    const alerts: { day: Date; shiftCount: number }[] = [];
    weekDays.forEach((day) => {
      const dayShifts = shifts.filter(
        (shift) => shift.date === format(day, 'yyyy-MM-dd')
      );
      if (dayShifts.length < 2) { // Threshold: less than 2 shifts is low staffing
        alerts.push({ day, shiftCount: dayShifts.length });
      }
    });
    return alerts;
  };

  const lowStaffingAlerts = getLowStaffingAlerts();

  // Weekly schedule data for the logged-in user (or all users for admin)
  const weeklySchedule = weekDays.map((day) => {
    const dayShifts = user?.role === 'admin'
      ? shifts.filter((shift) => shift.date === format(day, 'yyyy-MM-dd'))
      : shifts.filter(
          (shift) => shift.date === format(day, 'yyyy-MM-dd') && shift.employeeId === user?.id
        );
    const dayRequests = requests.filter(
      (req) => req.date === format(day, 'yyyy-MM-dd') && req.status === 'Approved'
    );
    return { day, shifts: dayShifts, requests: dayRequests };
  });

  // Filter shift coverage requests based on user role
  const visibleShiftCoverageRequests = user?.role === 'admin'
    ? shiftCoverageRequests
    : shiftCoverageRequests.filter((req) => req.employeeId === user?.id);

  if (!user) {
    return null;
  }

  return (
    <div className='bg-bradley-light-gray p-6'>
      <h1 className='text-3xl font-bold mb-6 text-bradley-dark-gray'>
        Welcome, {user.name}
      </h1>
      <div className='space-y-6'>
        {/* Weekly Schedule Card */}
        <div className='bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-[0_4px_0_0_#939598]'>
          <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>
            Here’s an overview for the week of {format(weekStart, 'MM/dd')} - {format(weekEnd, 'MM/dd')}
          </h2>
          <div className='grid grid-cols-7 gap-2'>
            {weeklySchedule.map((day) => (
              <div key={day.day.toISOString()} className='border border-bradley-medium-gray p-2 rounded-md'>
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
            ))}
          </div>
        </div>

        {/* Horizontal Cards */}
        <div className={`grid ${user.role === 'admin' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
          {/* Announcements Card */}
          <div className='bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-[0_4px_0_0_#939598]'>
            <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>Announcements</h2>
            {announcements.length === 0 ? (
              <p className='text-bradley-medium-gray'>No announcements at this time.</p>
            ) : (
              <div className='space-y-4'>
                {announcements.map((announcement) => (
                  <div key={announcement.id} className='border-b border-bradley-medium-gray pb-4'>
                    <h3 className='text-lg font-medium text-bradley-dark-gray'>{announcement.title}</h3>
                    <p className='text-sm text-bradley-medium-gray'>
                      Posted on {format(new Date(announcement.date), 'MM/dd/yyyy')}
                    </p>
                    <p className='mt-2 text-bradley-dark-gray'>{announcement.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Merged Requests Card (Admin) or Shift Coverage Requests Card (Employee) */}
          <div className='bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-[0_4px_0_0_#939598]'>
            <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>Requests</h2>
            {user.role === 'admin' ? (
              <>
                {/* Time Off Requests Section */}
                <div className='mb-6'>
                  <h3 className='text-lg font-medium text-bradley-dark-gray mb-2'>Time Off Requests</h3>
                  {requests.filter((req) => req.status === 'Pending').length === 0 ? (
                    <p className='text-bradley-medium-gray'>No pending time off requests.</p>
                  ) : (
                    <div className='space-y-4'>
                      {requests
                        .filter((req) => req.status === 'Pending')
                        .map((request) => (
                          <div key={request.id} className='flex justify-between items-center border-b border-bradley-medium-gray pb-2'>
                            <div>
                              <p className='text-bradley-dark-gray'>
                                {request.employee} - {request.type}
                              </p>
                              <p className='text-sm text-bradley-medium-gray'>
                                {format(new Date(request.date), 'MM/dd/yyyy')} {request.time || 'All Day'}
                              </p>
                            </div>
                            <div className='flex space-x-2'>
                              <button
                                className='p-2 bg-bradley-green text-white rounded-md shadow-[0_4px_0_0_#339933] active:shadow-[0_1px_1px_0_#339933]'
                                onClick={() => handleRequestAction(request.id, 'Approved')}
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className='p-2 bg-[#ff6666] text-white rounded-md shadow-[0_4px_0_0_#b71c1c] active:shadow-[0_1px_1px_0_#b71c1c]'
                                onClick={() => handleRequestAction(request.id, 'Denied')}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Shift Coverage Requests Section */}
                <div>
                  <h3 className='text-lg font-medium text-bradley-dark-gray mb-2'>Shift Coverage Requests</h3>
                  {visibleShiftCoverageRequests.length === 0 ? (
                    <p className='text-bradley-medium-gray'>No shift coverage requests at this time.</p>
                  ) : (
                    <div className='space-y-4'>
                      {visibleShiftCoverageRequests.map((request) => (
                        <div key={request.id} className='border-b border-bradley-medium-gray pb-2'>
                          <p className='text-bradley-dark-gray'>
                            Shift Coverage: {request.employeeName}
                          </p>
                          <p className='text-sm text-bradley-medium-gray'>
                            {request.date} {request.startTime} - {request.endTime}
                          </p>
                          <p className='text-sm text-bradley-medium-gray'>
                            Status: {request.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Employee View: Only Shift Coverage Requests
              <div>
                {visibleShiftCoverageRequests.length === 0 ? (
                  <p className='text-bradley-medium-gray'>No shift coverage requests at this time.</p>
                ) : (
                  <div className='space-y-4'>
                    {visibleShiftCoverageRequests.map((request) => (
                      <div key={request.id} className='border-b border-bradley-medium-gray pb-2'>
                        <p className='text-bradley-dark-gray'>
                          Shift Coverage: {request.employeeName}
                        </p>
                        <p className='text-sm text-bradley-medium-gray'>
                          {request.date} {request.startTime} - {request.endTime}
                        </p>
                        <p className='text-sm text-bradley-medium-gray'>
                          Status: {request.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Admin-Specific Section: Low Staffing Alerts */}
          {user.role === 'admin' && (
            <div className='bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-[0_4px_0_0_#939598]'>
              <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>Low Staffing Alerts</h2>
              {lowStaffingAlerts.length === 0 ? (
                <p className='text-bradley-medium-gray'>No low staffing alerts this week.</p>
              ) : (
                <div className='space-y-2'>
                  {lowStaffingAlerts.map((alert) => (
                    <div key={alert.day.toISOString()} className='text-bradley-red'>
                      {format(alert.day, 'MM/dd/yyyy')} - Only {alert.shiftCount} shift{alert.shiftCount !== 1 ? 's' : ''} scheduled
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Placeholder for non-admin users to maintain layout */}
          {user.role !== 'admin' && (
            <div className='bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-[0_4px_0_0_#939598] opacity-0 pointer-events-none'>
              <h2 className='text-xl font-semibold mb-4 text-bradley-dark-gray'>Placeholder</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}