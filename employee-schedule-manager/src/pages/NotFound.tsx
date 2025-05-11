import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className='p-6 text-center'>
      <h1 className='text-3xl font-bold mb-4'>404 - Page Not Found</h1>
      <p className='text-lg'>
        Oops! The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you back on
        track—head to the{' '}
        <Link to='/dashboard' className='text-blue-500 hover:underline'>
          Dashboard
        </Link>{' '}
        or{' '}
        <Link to='/schedule' className='text-blue-500 hover:underline'>
          Schedule
        </Link>{' '}
        to continue managing your team&apos;s shifts.
      </p>
    </div>
  );
}
