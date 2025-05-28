import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Utility: Check for time overlap
function isOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  // Assumes time format 'HH:mm' (24hr)
  const [hA, mA] = startA.split(':').map(Number);
  const [hB, mB] = endA.split(':').map(Number);
  const [hC, mC] = startB.split(':').map(Number);
  const [hD, mD] = endB.split(':').map(Number);
  const start1 = hA * 60 + mA;
  const end1 = hB * 60 + mB;
  const start2 = hC * 60 + mC;
  const end2 = hD * 60 + mD;
  return start1 < end2 && start2 < end1;
}

// Add a new shift coverage request
export const addShiftCoverageRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  const { shiftId, date, startTime, endTime } = data;
  if (!shiftId || !date || !startTime || !endTime) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
  }
  const shiftSnap = await admin.firestore().collection('shifts').doc(shiftId).get();
  if (!shiftSnap.exists) throw new functions.https.HttpsError('not-found', 'Shift not found.');
  const shift = shiftSnap.data();
  if (!shift) throw new functions.https.HttpsError('not-found', 'Shift not found.');
  if (shift.employeeId !== context.auth.uid) {
    throw new functions.https.HttpsError('permission-denied', 'You can only put your own shift up for coverage.');
  }
  const auditEntry = {
    action: 'Requested',
    userId: context.auth.uid,
    userName: context.auth.token.name || '',
    timestamp: new Date().toISOString(),
    details: '',
  };
  const docRef = await admin.firestore().collection('shiftCoverageRequests').add({
    shiftId,
    originalOwnerId: context.auth.uid,
    originalOwnerName: context.auth.token.name || '',
    date,
    startTime,
    endTime,
    status: 'Open',
    auditTrail: [auditEntry],
    requestedCoverageStart: startTime,
    requestedCoverageEnd: endTime,
  });
  return { id: docRef.id };
});

// Claim a shift coverage request (with collision detection)
export const claimShiftCoverageRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  const { requestId, force } = data;
  if (!requestId) throw new functions.https.HttpsError('invalid-argument', 'Missing requestId.');
  const reqRef = admin.firestore().collection('shiftCoverageRequests').doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) throw new functions.https.HttpsError('not-found', 'Request not found.');
  const reqData = reqSnap.data();
  if (!reqData) throw new functions.https.HttpsError('not-found', 'Request data not found.');
  if (reqData.status !== 'Open') throw new functions.https.HttpsError('failed-precondition', 'Request is not open.');
  // Collision detection
  const shiftsSnap = await admin.firestore().collection('shifts')
    .where('employeeId', '==', context.auth.uid)
    .where('date', '==', reqData.date)
    .get();
  let collision = false;
  shiftsSnap.forEach(doc => {
    const s = doc.data();
    if (isOverlap(s.startTime, s.endTime, reqData.requestedCoverageStart, reqData.requestedCoverageEnd)) {
      collision = true;
    }
  });
  if (collision && !force) {
    // If collision and not forced, return warning
    return { collision: true, message: 'This shift overlaps with one of your existing shifts. Do you still want to cover this shift?' };
  }
  // Claim the shift
  const auditEntry = {
    action: 'Claimed',
    userId: context.auth.uid,
    userName: context.auth.token.name || '',
    timestamp: new Date().toISOString(),
    details: '',
  };
  await reqRef.update({
    status: 'Claimed',
    claimedById: context.auth.uid,
    claimedByName: context.auth.token.name || '',
    auditTrail: admin.firestore.FieldValue.arrayUnion(auditEntry),
  });
  return { success: true };
});

// Return a claimed shift coverage request
export const returnShiftCoverageRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  const { requestId } = data;
  if (!requestId) throw new functions.https.HttpsError('invalid-argument', 'Missing requestId.');
  const reqRef = admin.firestore().collection('shiftCoverageRequests').doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) throw new functions.https.HttpsError('not-found', 'Request not found.');
  const reqData = reqSnap.data();
  if (!reqData) throw new functions.https.HttpsError('not-found', 'Request data not found.');
  if (reqData.status !== 'Claimed' || reqData.claimedById !== context.auth.uid) {
    throw new functions.https.HttpsError('failed-precondition', 'You cannot return this request.');
  }
  const auditEntry = {
    action: 'Returned',
    userId: context.auth.uid,
    userName: context.auth.token.name || '',
    timestamp: new Date().toISOString(),
    details: '',
  };
  await reqRef.update({
    status: 'Open',
    claimedById: admin.firestore.FieldValue.delete(),
    claimedByName: admin.firestore.FieldValue.delete(),
    auditTrail: admin.firestore.FieldValue.arrayUnion(auditEntry),
  });
  return { success: true };
});

// Complete a shift coverage request (admin or original owner)
export const completeShiftCoverageRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
  const { requestId } = data;
  if (!requestId) throw new functions.https.HttpsError('invalid-argument', 'Missing requestId.');
  const reqRef = admin.firestore().collection('shiftCoverageRequests').doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) throw new functions.https.HttpsError('not-found', 'Request not found.');
  const reqData = reqSnap.data();
  if (!reqData) throw new functions.https.HttpsError('not-found', 'Request data not found.');
  if (context.auth.token.role !== 'admin' && context.auth.uid !== reqData.originalOwnerId) {
    throw new functions.https.HttpsError('permission-denied', 'Not authorized.');
  }
  if (reqData.status !== 'Claimed') throw new functions.https.HttpsError('failed-precondition', 'Request is not claimed.');
  const auditEntry = {
    action: 'Completed',
    userId: context.auth.uid,
    userName: context.auth.token.name || '',
    timestamp: new Date().toISOString(),
    details: '',
  };
  await reqRef.update({
    status: 'Completed',
    auditTrail: admin.firestore.FieldValue.arrayUnion(auditEntry),
  });
  // Optionally, update the shift document to reflect the new owner for this instance only
  return { success: true };
});