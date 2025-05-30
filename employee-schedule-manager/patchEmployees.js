// patchEmployees.js
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
  projectId: "schedule-manager-496e0" // <-- your actual project ID
});
const db = getFirestore();

const REQUIRED_FIELDS = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  username: '',
  position: '',
  color: '',
  role: 'employee',
};

async function patchEmployees() {
  const employeesRef = db.collection('employees');
  const snapshot = await employeesRef.get();
  let patched = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    let needsPatch = false;
    const update = {};
    for (const [key, def] of Object.entries(REQUIRED_FIELDS)) {
      if (!(key in data)) {
        update[key] = def;
        needsPatch = true;
      }
    }
    // Remove any extra fields not in REQUIRED_FIELDS
    const extraKeys = Object.keys(data).filter(k => !(k in REQUIRED_FIELDS));
    if (extraKeys.length > 0) {
      needsPatch = true;
      for (const k of extraKeys) update[k] = FieldValue.delete();
    }
    if (needsPatch) {
      await employeesRef.doc(doc.id).update(update);
      console.log(`Patched employee ${doc.id}:`, update);
      patched++;
    }
  }
  console.log(`Done. Patched ${patched} employee(s).`);
}

patchEmployees().catch(console.error);