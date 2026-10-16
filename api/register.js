const { getAdmin, sendError, handleCors, rateLimit, cleanText } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  let createdUid = null, stage = 'start';
  try {
    rateLimit(req, 'register', 5, 600000);
    const { name, username, password, phone = '', employeeId = '', area = '', branch = '' } = req.body || {};
    const safeName = cleanText(name, 100), normalized = String(username || '').trim().toLowerCase();
    const branches = ['المركز', 'الحسينية', 'طويريج', 'الحر'];
    if (!safeName || !/^[a-z0-9_]{3,32}$/.test(normalized) || String(password || '').length < 8 || !branches.includes(String(branch).trim())) {
      return res.status(400).json({ ok: false, error: 'INVALID_REGISTRATION_DATA' });
    }
    stage = 'firebase-init';
    const admin = getAdmin();
    const db = admin.firestore();
    const lockRef = db.collection('usernames').doc(normalized);
    stage = 'username-read';
    const lock = await lockRef.get();
    if (lock.exists) return res.status(409).json({ ok: false, error: 'USERNAME_TAKEN' });

    const email = `${normalized}@deliveryattendance.app`;
    stage = 'auth-create';
    const authUser = await admin.auth().createUser({ email, password: String(password), displayName: safeName, disabled: false });
    createdUid = authUser.uid;
    const now = admin.firestore.Timestamp.now();
    stage = 'firestore-transaction';
    await db.runTransaction(async tx => {
      const latestLock = await tx.get(lockRef);
      if (latestLock.exists) throw Object.assign(new Error('USERNAME_TAKEN'), { statusCode: 409 });
      tx.create(lockRef, { userId: authUser.uid, createdAt: now });
      tx.create(db.collection('users').doc(authUser.uid), {
        authUid: authUser.uid, email, username: normalized, name: safeName,
        phone: cleanText(phone, 30), employeeId: cleanText(employeeId, 40), area: cleanText(area, 80), branch: String(branch).trim(),
        role: 'agent', status: 'pending', deviceId: null, deviceInfo: null,
        activeSessionId: null, hasAlert: false, createdAt: now
      });
    });
    stage = 'audit-write';
    try {
      await db.collection('auditLogs').add({ action: 'register_request', actorId: authUser.uid, actorName: cleanText(name, 100), target: authUser.uid, details: normalized, createdAt: now });
    } catch (auditError) {
      console.error('registration audit write failed', auditError);
    }
    res.status(201).json({ ok: true, status: 'pending' });
  } catch (error) {
    if (createdUid) {
      try { await getAdmin().auth().deleteUser(createdUid); } catch (_) {}
    }
    res.setHeader('X-Error-Stage', stage);
    sendError(res, error);
  }
};
