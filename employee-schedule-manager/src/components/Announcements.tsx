import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, Timestamp, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';

export default function Announcements() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Array<{ id: string; content: string; timestamp?: Timestamp; expiration?: Timestamp }>>([]);
  const [content, setContent] = useState('');
  const [expiration, setExpiration] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch announcements, filter out expired
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const now = new Date();
      const querySnapshot = await getDocs(collection(db, 'announcements'));
      const anns = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data() as DocumentData;
        return {
          id: docSnap.id,
          content: data.content || '',
          timestamp: data.timestamp,
          expiration: data.expiration,
        };
      });
      // Filter out expired announcements
      const filtered = anns.filter(a => !a.expiration || (a.expiration instanceof Timestamp && a.expiration.toDate() > now));
      setAnnouncements(filtered.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    };
    fetchAnnouncements();
  }, []);

  // Cleanup expired announcements on load
  useEffect(() => {
    const cleanupExpired = async () => {
      const now = new Date();
      for (const a of announcements) {
        if (a.expiration && a.expiration instanceof Timestamp && a.expiration.toDate() <= now) {
          await deleteDoc(doc(db, 'announcements', a.id));
        }
      }
    };
    if (announcements.length > 0) cleanupExpired();
  }, [announcements]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ann: any = {
        content,
        timestamp: Timestamp.now(),
      };
      if (expiration) {
        ann.expiration = Timestamp.fromDate(new Date(expiration));
      }
      await addDoc(collection(db, 'announcements'), ann);
      setContent('');
      setExpiration('');
      // Refresh announcements
      const querySnapshot = await getDocs(collection(db, 'announcements'));
      const anns = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data() as DocumentData;
        return {
          id: docSnap.id,
          content: data.content || '',
          timestamp: data.timestamp,
          expiration: data.expiration,
        };
      });
      const filtered = anns.filter(a => !a.expiration || (a.expiration instanceof Timestamp && a.expiration.toDate() > new Date()));
      setAnnouncements(filtered.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)));
    } catch (err: any) {
      setError(err.message || 'Failed to post announcement.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'announcements', id));
    setAnnouncements(announcements.filter(a => a.id !== id));
  };

  return (
    <div className="p-6 md:pl-48">
      <h1 className="text-2xl font-bold mb-6">Announcements</h1>
      {user?.role === 'admin' && (
        <form onSubmit={handlePost} className="mb-6 space-y-4 bg-white p-4 rounded-lg border-2 border-bradley-medium-gray shadow-[0_6px_0_0_#939598FF] w-full dark:bg-bradley-dark-card dark:text-bradley-dark-card-text dark:border-bradley-light-gray dark:shadow-[0_6px_0_0_#E2E8F0FF]">
          <textarea
            className="w-full border border-bradley-dark-gray rounded p-2 dark:bg-bradley-dark-surface dark:text-bradley-light-gray dark:border-bradley-light-gray"
            rows={3}
            placeholder="Write an announcement..."
            value={content}
            onChange={e => setContent(e.target.value)}
            required
          />
          <div className="flex items-center gap-4">
            <label className="font-medium">Expiration Date (optional):</label>
            <input
              type="date"
              className="border border-bradley-dark-gray rounded px-2 py-1 bg-white text-bradley-dark-gray !bg-opacity-100 !opacity-100"
              value={expiration}
              onChange={e => setExpiration(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{ backgroundColor: '#fff', color: '#222', opacity: 1 }}
            />
          </div>
          {error && <div className="p-2 bg-red-100 text-red-800 border border-red-300 rounded text-center font-medium">{error}</div>}
          <button
            type="submit"
            className="px-4 py-2 bg-bradley-red text-white rounded-md shadow-[0_4px_0_0_#870F0F] active:shadow-[0_1px_1px_0_#870F0F]"
            disabled={loading}
          >
            {loading ? 'Posting...' : 'Post Announcement'}
          </button>
        </form>
      )}
      <h2 className="text-xl font-semibold mb-4 text-bradley-dark-gray dark:text-bradley-light-gray">Recent Announcements</h2>
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <p className="text-lg text-bradley-medium-gray">No announcements found.</p>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="bg-white text-bradley-dark-gray p-6 rounded-lg border-2 border-bradley-medium-gray shadow-[0_6px_0_0_#939598FF] mb-6 dark:bg-bradley-dark-card dark:text-bradley-dark-card-text dark:border-bradley-light-gray dark:shadow-[0_6px_0_0_#E2E8F0FF]">
              <div className="flex items-start justify-between w-full">
                <div className="flex-1">
                  <div className="text-base mb-1 text-bradley-dark-gray dark:text-bradley-light-gray">
                    {a.content}
                  </div>
                  {a.expiration && a.expiration instanceof Timestamp && typeof a.expiration.toDate === 'function' && (
                    <div className="mt-1 text-xs text-bradley-medium-gray whitespace-nowrap">
                      Exp {a.expiration.toDate().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                    </div>
                  )}
                </div>
                {user?.role === 'admin' && (
                  <button
                    className="ml-4 px-3 py-1 bg-bradley-red text-white rounded shadow-[0_4px_0_0_#870F0F] hover:bg-bradley-dark-gray transition self-start"
                    onClick={() => handleDelete(a.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}