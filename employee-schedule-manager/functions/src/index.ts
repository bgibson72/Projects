/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

// Create Employee Cloud Function
exports.createEmployee = functions.https.onCall(async (data: any, context: any) => {
  // Only allow an admin to call this function
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admin can create employees.');
  }
  const { email, tempPassword, firstName, lastName, username, position, phone, color } = data;
  if (!email || !tempPassword || !firstName || !lastName || !username || !position) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
  }
  try {
    // 1. Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password: tempPassword,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false,
      disabled: false
    });
    // 2. Set custom claim for employee
    await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'employee' });
    // 3. Add employee to Firestore
    await admin.firestore().collection('employees').doc(userRecord.uid).set({
      email,
      firstName,
      lastName,
      username,
      position,
      phone: phone || '',
      color: color || '',
      uid: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      role: 'employee',
    });
    return { success: true, uid: userRecord.uid };
  } catch (err: any) {
    throw new functions.https.HttpsError('internal', err.message || 'Failed to create employee.');
  }
});

// Delete Employee Cloud Function
exports.deleteEmployee = functions.https.onCall(async (data: any, context: any) => {
  // Only allow an admin to call this function
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admin can delete employees.');
  }
  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'UID is required.');
  }
  try {
    // Delete from Firebase Auth
    await admin.auth().deleteUser(uid);
    // Delete from Firestore
    await admin.firestore().collection('employees').doc(uid).delete();
    return { success: true };
  } catch (err: any) {
    throw new functions.https.HttpsError('internal', err.message || 'Failed to delete employee.');
  }
});

// Update Employee Email Cloud Function
exports.updateEmployeeEmail = functions.https.onCall(async (data: any, context: any) => {
  // Only allow an admin to call this function
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admin can update employee emails.');
  }
  const { uid, newEmail } = data;
  if (!uid || !newEmail) {
    throw new functions.https.HttpsError('invalid-argument', 'UID and newEmail are required.');
  }
  try {
    // Update email in Firebase Auth
    await admin.auth().updateUser(uid, { email: newEmail });
    // Update email in Firestore
    await admin.firestore().collection('employees').doc(uid).update({ email: newEmail });
    return { success: true };
  } catch (err: any) {
    throw new functions.https.HttpsError('internal', err.message || 'Failed to update employee email.');
  }
});