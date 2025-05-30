const admin = require('firebase-admin');

// Initialize with your service account key
admin.initializeApp({
  credential: admin.credential.cert(require('./schedule-manager-496e0-firebase-adminsdk-fbsvc-d48b52a132.json')),
});

const uid = 'u9RkIeB0mvTdoIdzC92YHnPLuvP2'; // Replace with your Firebase Auth UID

admin.auth().setCustomUserClaims(uid, { role: 'admin' })
  .then(() => {
    console.log('Admin claim set for user:', uid);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting admin claim:', error);
    process.exit(1);
  });