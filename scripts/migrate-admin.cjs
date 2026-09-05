const fs = require('fs');
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', '.secrets', 'firebase-admin.json'), 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function main() {
  const authUser = await admin.auth().getUserByEmail('rasim1010@deliveryattendance.app');
  const db = admin.firestore();
  const old = await db.collection('users').where('username', '==', 'rasim1010').get();
  const base = old.empty ? {} : old.docs[0].data();
  delete base.password;
  await db.collection('users').doc(authUser.uid).set({
    ...base,
    authUid: authUser.uid,
    email: authUser.email,
    username: 'rasim1010',
    name: base.name || 'الأدمن',
    role: 'admin',
    status: 'active',
    deviceId: null,
    activeSessionId: null,
    migratedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  await db.collection('usernames').doc('rasim1010').set({ userId: authUser.uid, migratedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  await admin.auth().setCustomUserClaims(authUser.uid, { role: 'admin' });
  console.log(`admin migrated uid=${authUser.uid}`);
}

main().then(() => process.exit(0)).catch(error => { console.error(error.message); process.exit(1); });
