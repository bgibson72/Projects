import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Shift, ShiftCoverageRequest as ShiftCoverageRequestType } from '../types/shiftCoverageTypes';

export default function ShiftCoverageRequest() {
  const { user } = useAuthStore();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [coverageRequests, setCoverageRequests] = useState<ShiftCoverageRequestType[]>([]);
  const [showRequest, setShowRequest] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [coverageStart, setCoverageStart] = useState('');
  const [coverageEnd, setCoverageEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [collisionWarning, setCollisionWarning] = useState('');
  const [pendingClaim, setPendingClaim] = useState<ShiftCoverageRequestType | null>(null);

  // Generate 30-min time options from 8:00 AM to 10:00 PM
  const timeOptions = [];
  for (let h = 8; h <= 22; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      const min = m === 0 ? '00' : '30';
      timeOptions.push(`${hour12}:${min} ${ampm}`);
    }
  }

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
      setCoverageRequests(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShiftCoverageRequestType[]);
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
      // Refresh
      const querySnapshot = await getDocs(collection(db, 'shiftCoverageRequests'));
      setCoverageRequests(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShiftCoverageRequestType[]);
    } catch (err: any) {
      setError(err.message || 'Failed to request coverage.');
    } finally {
      setLoading(false);
    }
  };

  // Claim a coverage request (with collision detection)
  const handleClaim = async (req: ShiftCoverageRequestType, force = false) => {
    setLoading(true);
    setError('');
    setSuccess('');
    setCollisionWarning('');
    setPendingClaim(null);
    try {
      const functions = getFunctions();
      const claim = httpsCallable(functions, 'claimShiftCoverageRequest');
      const result: any = await claim({ requestId: req.id, force });
      if (result.data && result.data.collision && !force) {
        setCollisionWarning(result.data.message);
        setPendingClaim(req);
        setLoading(false);
        return;
      }
      setSuccess('Shift claimed!');
      // Refresh
      const querySnapshot = await getDocs(collection(db, 'shiftCoverageRequests'));
      setCoverageRequests(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShiftCoverageRequestType[]);
    } catch (err: any) {
      setError(err.message || 'Failed to claim shift.');
    } finally {
      setLoading(false);
    }
  };

  // Return a claimed shift
  const handleReturn = async (req: ShiftCoverageRequestType) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const functions = getFunctions();
      const ret = httpsCallable(functions, 'returnShiftCoverageRequest');
      await ret({ requestId: req.id });
      setSuccess('Shift returned to open coverage.');
      // Refresh
      const querySnapshot = await getDocs(collection(db, 'shiftCoverageRequests'));
      setCoverageRequests(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShiftCoverageRequestType[]);
    } catch (err: any) {
      setError(err.message || 'Failed to return shift.');
    } finally {
      setLoading(false);
    }
  };

  // UI
  if (!user) return null;
  const isEmployee = user.role === 'employee';
  return (
    <div className="bg-white text-bradley-dark-gray p-6 rounded-lg border border-bradley-medium-gray shadow-bradley mb-6 dark:bg-bradley-dark-card dark:text-bradley-dark-card-text dark:border-bradley-dark-border">
      <h1 className="text-2xl font-bold mb-4">Shift Coverage Requests</h1>
      {error && <div className="mb-2 p-2 bg-red-100 text-red-800 rounded">{error}</div>}
      {success && <div className="mb-2 p-2 bg-green-100 text-green-800 rounded">{success}</div>}
      {/* Request Coverage Button (employees only) */}
      {isEmployee && (
        <button
          className="mb-4 px-4 py-2 bg-bradley-red text-white rounded-md"
          onClick={() => setShowRequest(true)}
          disabled={loading}
        >
          Request Shift Coverage
        </button>
      )}
      {/* Request Coverage Modal (employees only) */}
      {isEmployee && showRequest && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Request Coverage</h2>
            <form onSubmit={handleRequestCoverage} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Select Shift</label>
                <select
                  className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white text-bradley-dark-gray !bg-opacity-100 !opacity-100"
                  value={selectedShift?.id || ''}
                  onChange={e => setSelectedShift(shifts.find(s => s.id === e.target.value) || null)}
                  required
                  style={{ backgroundColor: '#fff', color: '#222', opacity: 1 }}
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
                  <select
                    className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white text-bradley-dark-gray !bg-opacity-100 !opacity-100"
                    value={coverageStart}
                    onChange={e => setCoverageStart(e.target.value)}
                    required
                    style={{ backgroundColor: '#fff', color: '#222', opacity: 1 }}
                  >
                    <option value="">-- Select --</option>
                    {timeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block mb-1 font-medium">Coverage End</label>
                  <select
                    className="border border-bradley-dark-gray px-2 py-1 rounded w-full bg-white text-bradley-dark-gray !bg-opacity-100 !opacity-100"
                    value={coverageEnd}
                    onChange={e => setCoverageEnd(e.target.value)}
                    required
                    style={{ backgroundColor: '#fff', color: '#222', opacity: 1 }}
                  >
                    <option value="">-- Select --</option>
                    {timeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
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
      {/* Collision Warning Modal */}
      {collisionWarning && pendingClaim && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Shift Conflict</h2>
            <p className="mb-4 text-bradley-dark-gray">{collisionWarning}</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-bradley-light-gray text-bradley-dark-gray rounded-md"
                onClick={() => { setCollisionWarning(''); setPendingClaim(null); }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-bradley-red text-white rounded-md"
                onClick={() => handleClaim(pendingClaim, true)}
                disabled={loading}
              >
                Yes, Claim Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Open Coverage Requests Board */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Open Coverage Requests</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full rounded-lg overflow-hidden table-fixed bg-white dark:bg-bradley-dark-card">
          <thead className="bg-bradley-light-gray dark:bg-bradley-dark-surface">
            <tr>
              <th className="px-4 py-2 text-left text-bradley-dark-gray dark:text-gray-200">Date</th>
              <th className="px-4 py-2 text-left text-bradley-dark-gray dark:text-gray-200">Time</th>
              <th className="px-4 py-2 text-left text-bradley-dark-gray dark:text-gray-200">Owner</th>
              <th className="px-4 py-2 text-left text-bradley-dark-gray dark:text-gray-200">Status</th>
              <th className="px-4 py-2 text-left text-bradley-dark-gray dark:text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coverageRequests.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4 text-bradley-medium-gray">No coverage requests found.</td></tr>
            ) : (
              coverageRequests.map(req => (
                <tr key={req.id} className="border-t border-bradley-medium-gray">
                  <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">{req.date}</td>
                  <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">{req.requestedCoverageStart} - {req.requestedCoverageEnd}</td>
                  <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">{req.originalOwnerName}</td>
                  <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">{req.status}</td>
                  <td className="px-4 py-2 bg-white dark:bg-bradley-dark-card text-bradley-dark-gray dark:text-bradley-dark-card-text">
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
    </div>
  );
}
