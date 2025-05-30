// recreateAdmin.js
const admin = require('firebase-admin');
const serviceAccount = require('./schedule-manager-496e0-firebase-adminsdk-fbsvc-d48b52a132.json'); // Path to your service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = 'u9RkIeB0mvTdoIdzC92YHnPLuvP2'; // Your original UID
const email = 'bjgibson2@fsmail.bradley.edu'; // Replace with your email
const tempPassword = 'BindiLou@4498'; // Replace with a strong temporary password
const firstName = 'Bryan';         // Replace with your first name
const lastName = 'Gibson';          // Replace with your last name
const username = 'bjgibson2@fsmail.bradley.edu';        // Replace with your username
const position = 'admin'; // Or your specific position title
const phone = '309-648-8805';       // Replace with your phone number
const color = '#E57373'; // A default color, or your preferred one

async function recreateAdminUser() {
  try {
    // 1. Create Firebase Auth user with the specific UID
    console.log(`Attempting to create Auth user with UID: ${uid}...`);
    await admin.auth().createUser({
      uid: uid,
      email: email,
      password: tempPassword,
      displayName: `${firstName} ${lastName}`,
      emailVerified: true, // Optional: set email as verified
    });
    console.log(`Successfully created Auth user: ${uid}`);

    // 2. Create Firestore employee document
    console.log(`Attempting to create Firestore document for employee: ${uid}...`);
    const employeeDocRef = admin.firestore().collection('employees').doc(uid);
    await employeeDocRef.set({
      firstName: firstName,
      lastName: lastName,
      username: username,
      email: email,
      position: position,
      phone: phone,
      color: color,
      // Add any other fields your application expects for an employee
      // Ensure these fields match what your 'createEmployee' cloud function normally sets
    });
    console.log(`Successfully created Firestore employee document for: ${uid}`);

    // 3. Set custom admin claim
    console.log(`Attempting to set admin claim for user: ${uid}...`);
    await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
    console.log(`Admin claim successfully set for user: ${uid}`);

    console.log('\\nAdmin user recreation process completed successfully!');
    console.log('You should now be able to log in with your email and the temporary password.');
    process.exit(0);

  } catch (error) {
    console.error('Error during admin user recreation:', error);
    if (error.code === 'auth/uid-already-exists') {
      console.error(`\\nAn Auth user with UID ${uid} already exists. This script assumes the Auth user was deleted.`);
      console.error('If the Auth user exists but the Firestore document or claims are missing, you might need a different script.');
      console.error('You can try running setAdminClaim.js if only the claim is missing and the auth user + firestore doc exist.');
    } else if (error.code === 'auth/email-already-exists') {
        console.error(`\nAn Auth user with email ${email} already exists (possibly with a different UID).`);
        console.error('Please ensure the email is unique or resolve the conflict in Firebase Authentication console.');
    }
    process.exit(1);
  }
}

recreateAdminUser();