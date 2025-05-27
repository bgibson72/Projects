import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Shift, ShiftCoverageRequest } from '../types/shiftCoverageTypes';

export default function ShiftCoverageRequest() {
  const { user } = useAuthStore();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [coverageRequests, setCoverageRequests] = useState<ShiftCoverageRequest[]>([]);
  const [showRequest, setShowRequest] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [coverageStart, setCoverageStart] = useState('');
  const [coverageEnd, setCoverageEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch user's shifts and all open coverage requests
  useEffect(() => {
    if (!user) return;
    const fetchShifts = async () => {
      const querySnapshot = await getDocs(collection(db, 'shifts'));
      const allShifts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Shift[];
      setShifts(allShifts.filter(s => s.employeeId === user.id));
    };
    const fetchCoverageRequests = async () => {
      const querySnapshot = await getDocs(collection(db, 'shiftCoverageRequests'));
      setCoverageRequests(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShiftCoverageRequest[]);
    };
    fetchShifts();
    fetchCoverageRequests();
  }, [user]);

  // Request coverage for a shift
  const handleRequestCoverage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError('User not found. Please log in again.'); return; }
    if (!selectedShift || !coverageStart || !coverageEnd) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const functions = getFunctions();
      const addCoverage = httpsCallable(functions, 'addShiftCoverageRequest');
      await addCoverage({
        shiftId: selectedShift.id,
        originalOwnerId: user.id,
        originalOwnerName: user.name,
        date: selectedShift.date,
        startTime: selectedShift.startTime,
        endTime: selectedShift.endTime,
        requestedCoverageStart: coverageStart,
        requestedCoverageEnd: coverageEnd,
      });
      setShowRequest(false);
      setCoverageStart('');
      setCoverageEnd('');
      setSelectedShift(null);
      setSuccess('Coverage request submitted!');
    } catch (err: any) {
      setError(err.message || 'Failed to request coverage.');
    } finally {
      setLoading(false);
    }
  };

  // Claim a coverage request
  const handleClaim = async (req: ShiftCoverageRequest) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const functions = getFunctions();
      const claim = httpsCallable(functions, 'claimShiftCoverageRequest');
      await claim({ requestId: req.id });
      setSuccess('Shift claimed!');
    } catch (err: any) {
      setError(err.message || 'Failed to claim shift.');
    } finally {
      setLoading(false);
    }
  };

  // Return a claimed shift
  const handleReturn = async (req: ShiftCoverageRequest) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const functions = getFunctions();
      const ret = httpsCallable(functions, 'returnShiftCoverageRequest');
      await ret({ requestId: req.id });
      setSuccess('Shift returned to open coverage.');
    } catch (err: any) {
      setError(err.message || 'Failed to return shift.');
    } finally {
      setLoading(false);
    }
  };

  // UI
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Shift Coverage Requests</h1>
      {error && <div className="mb-2 p-2 bg-red-100 text-red-800 rounded">{error}</div>}
      {success && <div className="mb-2 p-2 bg-green-100 text-green-800 rounded">{success}</div>}
      {/* Request Coverage Button */}
      <button
        className="mb-4 px-4 py-2 bg-bradley-red text-white rounded-md"
        onClick={() => setShowRequest(true)}
        disabled={loading}
      >
        Request Shift Coverage
      </button>
      {/* Request Coverage Modal */}
      {showRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Request Coverage</h2>
            <form onSubmit={handleRequestCoverage} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Select Shift</label>
                <select
                  className="border border-bradley-dark-gray px-2 py-1 rounded w-full"
                  value={selectedShift?.id || ''}
                  onChange={e => setSelectedShift(shifts.find(s => s.id === e.target.value) || null)}
                  required
                >
                  <option value="">-- Select --</option>
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {shift.date} {shift.startTime}-{shift.endTime}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block mb-1 font-medium">Coverage Start</label>
                  <input
                    type="time"
                    className="border border-bradley-dark-gray px-2 py-1 rounded w-full"
                    value={coverageStart}
                    onChange={e => setCoverageStart(e.target.value)}
                    required
                  />
                </div>
                <div className="w-1/2">
                  <label className="block mb-1 font-medium">Coverage End</label>
                  <input
                    type="time"
                    className="border border-bradley-dark-gray px-2 py-1 rounded w-full"
                    value={coverageEnd}
                    onChange={e => setCoverageEnd(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md"
                  onClick={() => setShowRequest(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-bradley-red text-white rounded-md"
                  disabled={loading}
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Open Coverage Requests Board */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Open Coverage Requests</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-bradley-medium-gray">
          <thead>
            <tr className="bg-bradley-light-gray">
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Owner</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coverageRequests.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4 text-bradley-medium-gray">No coverage requests found.</td></tr>
            ) : (
              coverageRequests.map(req => (
                <tr key={req.id} className="border-t border-bradley-medium-gray">
                  <td className="px-4 py-2">{req.date}</td>
                  <td className="px-4 py-2">{req.requestedCoverageStart} - {req.requestedCoverageEnd}</td>
                  <td className="px-4 py-2">{req.originalOwnerName}</td>
                  <td className="px-4 py-2">{req.status}</td>
                  <td className="px-4 py-2">
                    {req.status === 'Open' && req.originalOwnerId !== user?.id && (
                      <button className="px-3 py-1 bg-bradley-blue text-white rounded" onClick={() => handleClaim(req)} disabled={loading}>Claim</button>
                    )}
                    {req.status === 'Claimed' && req.claimedById === user?.id && (
                      <button className="px-3 py-1 bg-bradley-yellow text-black rounded" onClick={() => handleReturn(req)} disabled={loading}>Return</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Audit Trail for each request (expandable) */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Audit Trail</h2>
      <div className="space-y-4">
        {coverageRequests.map(req => (
          <div key={req.id} className="border rounded p-3 bg-bradley-light-gray">
            <div className="font-semibold mb-1">{req.date} {req.requestedCoverageStart}-{req.requestedCoverageEnd} ({req.status})</div>
            <ul className="text-sm">
              {req.auditTrail?.map((entry, idx) => (
                <li key={idx}>
                  <span className="font-bold">{entry.action}</span> by {entry.userName} at {new Date(entry.timestamp).toLocaleString()} {entry.details && <span>- {entry.details}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
