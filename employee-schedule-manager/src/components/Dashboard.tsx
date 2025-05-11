import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getRequests } from '@/api/mockApi';

interface Request {
  id: string;
  employee: string;
  type: 'Time Off' | 'Shift Coverage';
  date: string;
  time?: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<Request[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await getRequests();
        console.log('Dashboard: Fetched requests:', data);
        setRequests(data);
        setError(null);
      } catch (err) {
        console.error('Dashboard: Failed to fetch requests:', err);
        setError('Failed to load requests. Please try again.');
      }
    };
    fetchRequests();
  }, []);

  const filteredRequests =
    user?.role === 'employee' ? requests.filter((req) => req.employee === user?.name) : requests;

  if (error) {
    return (
      <div className='bg-white p-6 rounded-lg shadow-lg'>
        <h1 className='text-3xl font-bold mb-6 text-bradley-dark-gray'>Dashboard</h1>
        <p className='text-bradley-red'>{error}</p>
      </div>
    );
  }

  return (
    <div className='bg-white p-6 rounded-lg shadow-lg'>
      <h1 className='text-3xl font-bold mb-6 text-bradley-dark-gray'>Dashboard</h1>
      <div className='mb-6'>
        <h2 className='text-2xl font-semibold mb-4 text-bradley-dark-gray'>
          Welcome, {user?.name}
        </h2>
        <p className='text-bradley-medium-gray'>
          Here are your {user?.role === 'employee' ? 'requests' : 'team’s requests'}.
        </p>
      </div>
      {filteredRequests.length === 0 ? (
        <p className='text-lg text-bradley-medium-gray'>No requests found.</p>
      ) : (
        <div className='space-y-4'>
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className='p-4 border border-bradley-medium-gray rounded-md flex justify-between items-center'
            >
              <div>
                <h3 className='text-lg font-medium text-bradley-dark-gray'>{request.employee}</h3>
                <p className='text-bradley-medium-gray'>
                  {request.type} - {request.date} {request.time}
                </p>
                <p
                  className={`text-sm ${request.status === 'Pending' ? 'text-bradley-red' : request.status === 'Approved' ? 'text-green-600' : 'text-bradley-red'}`}
                >
                  Status: {request.status}
                </p>
              </div>
              {user?.role === 'admin' && (
                <div className='space-x-2'>
                  <button className='px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700'>
                    Approve
                  </button>
                  <button className='px-3 py-1 bg-bradley-red text-white rounded-md hover:bg-bradley-dark-red'>
                    Deny
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
