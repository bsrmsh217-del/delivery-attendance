const { getAdmin, sendError } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  let createdUid = null;
  try {
    const { name, username, password, phone = '', employeeId = '', area = '' } = req.body || {};
    const normalized = String(username || '').trim().toLowerCase();
    if (!String(name || '').trim() || !/^[a-z0-9_]{3,32}$/.test(normalized) || String(password || '').length < 8) {
      return res.status(400).json({ ok: false, error: 'INVALID_REGISTRATION_DATA' });
    }
    const admin = getAdmin();
    const db = admin.firestore();
    const lockRef = db.collection('usernames').doc(normalized);
    const lock = await lockRef.get();
    if (lock.exists) return res.status(409).json({ ok: false, error: 'USERNAME_TAKEN' });

    const email = `${normalized}@deliveryattendance.app`;
    const authUser = await admin.auth().createUser({ email, password: String(password), displayName: String(name).trim(), disabled: false });
    createdUid = authUser.uid;
    const now = admin.firestore.Timestamp.now();
    await db.runTransaction(async tx => {
      const latestLock = await tx.get(lockRef);
      if (latestLock.exists) throw Object.assign(new Error('USERNAME_TAKEN'), { statusCode: 409 });
      tx.create(lockRef, { userId: authUser.uid, createdAt: now });
      tx.create(db.collection('users').doc(authUser.uid), {
        authUid: authUser.uid, email, username: normalized, name: String(name).trim(),
        phone: String(phone).trim(), employeeId: String(employeeId).trim(), area: String(area).trim(),
        role: 'agent', status: 'pending', deviceId: null, deviceInfo: null,
        activeSessionId: null, hasAlert: false, createdAt: now
      });
    });
    await db.collection('auditLogs').add({ action: 'register_request', actorId: authUser.uid, actorName: String(name).trim(), target: authUser.uid, details: normalized, createdAt: now });
    res.status(201).json({ ok: true, status: 'pending' });
  } catch (error) {
    if (createdUid) {
      try { await getAdmin().auth().deleteUser(createdUid); } catch (_) {}
    }
    sendError(res, error);
  }
};
