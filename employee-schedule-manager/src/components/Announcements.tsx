import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { format, parse } from 'date-fns';

interface Announcement {
  id: string;
  content: string;
  timestamp: string;
}

export default function Announcements() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/announcements');
        if (!response.ok) throw new Error('Failed to fetch announcements');
        const data = await response.json();
        setAnnouncements(data);
      } catch (err: unknown) {
        console.error('Announcements: Failed to fetch announcements:', err);
        setError('Failed to load announcements. Please try again.');
      }
    };
    fetchAnnouncements();
  }, []);

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    try {
      const announcement: Announcement = {
        id: `a${Date.now()}`,
        content: newAnnouncement,
        timestamp: new Date().toISOString(),
      };
      const response = await fetch('http://localhost:3001/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement),
      });
      if (!response.ok) throw new Error('Failed to add announcement');

      setAnnouncements((prev) => [...prev, announcement]);
      setNewAnnouncement('');
    } catch (err: unknown) {
      console.error('Announcements: Failed to add announcement:', err);
      setError('Failed to add announcement. Please try again.');
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="p-6 text-center text-bradley-dark-gray">Access Denied</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-bradley-dark-gray">Announcements</h1>
      {error && <p className="text-bradley-red text-sm mb-4">{error}</p>}
      <div className="bg-white p-6 rounded-lg border border-bradley-medium-gray shadow-bradley">
        <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray">Post a New Announcement</h2>
        <form onSubmit={handleAddAnnouncement} className="mb-6">
          <textarea
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
            className="w-full p-2 border border-bradley-medium-gray rounded-md text-bradley-dark-gray focus:outline-none focus:ring-2 focus:ring-bradley-blue"
            placeholder="Add a new announcement..."
            rows={3}
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
          >
            Post Announcement
          </button>
        </form>
        <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray">Recent Announcements</h2>
        {announcements.length === 0 ? (
          <p className="text-lg text-bradley-medium-gray">No announcements.</p>
        ) : (
          <div className="space-y-2">
            {announcements
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((ann) => (
                <div key={ann.id} className="p-2 border-b border-bradley-medium-gray">
                  <p className="text-bradley-dark-gray">{ann.content}</p>
                  <p className="text-sm text-bradley-medium-gray">
                    {format(parse(ann.timestamp, "yyyy-MM-dd'T'HH:mm:ss.SSSX", new Date()), 'PPpp')}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}