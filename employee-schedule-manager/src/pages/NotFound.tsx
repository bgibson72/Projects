import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className='p-6 text-center'>
      <h1 className='text-3xl font-bold mb-4'>404 - Page Not Found</h1>
      <p className='text-lg'>The page you are looking for does not exist.</p>
      <p className='mt-4'>
        <Link to='/' className='text-bradley-blue hover:underline'>
          Go back to the homepage
        </Link>
      </p>
    </div>
  );
}
