const { getAdmin, requireAdmin, sendError } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  try {
    const { profile: actor } = await requireAdmin(req);
    const { action, uid, password, username, reason = '' } = req.body || {};
    if (!uid || !['resetPassword', 'changeUsername', 'approve', 'block', 'unblock', 'resetDevice', 'allowDevice'].includes(action)) {
      return res.status(400).json({ ok: false, error: 'INVALID_ACTION' });
    }
    const admin = getAdmin();
    const db = admin.firestore();
    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
    const user = snap.data();
    const updates = {};

    if (action === 'resetPassword') {
      if (String(password || '').length < 8) return res.status(400).json({ ok: false, error: 'WEAK_PASSWORD' });
      await admin.auth().updateUser(uid, { password: String(password) });
    } else if (action === 'changeUsername') {
      const normalized = String(username || '').trim().toLowerCase();
      if (!/^[a-z0-9_]{3,32}$/.test(normalized)) return res.status(400).json({ ok: false, error: 'INVALID_USERNAME' });
      const oldUsername = user.username;
      await db.runTransaction(async tx => {
        const newLock = db.collection('usernames').doc(normalized);
        const exists = await tx.get(newLock);
        if (exists.exists && exists.data().userId !== uid) throw Object.assign(new Error('USERNAME_TAKEN'), { statusCode: 409 });
        tx.set(newLock, { userId: uid, updatedAt: admin.firestore.Timestamp.now() }, { merge: true });
        tx.update(ref, { username: normalized, email: `${normalized}@deliveryattendance.app` });
        if (oldUsername && oldUsername !== normalized) tx.delete(db.collection('usernames').doc(oldUsername));
      });
      await admin.auth().updateUser(uid, { email: `${normalized}@deliveryattendance.app` });
    } else if (action === 'approve') {
      updates.status = 'active';
    } else if (action === 'block') {
      updates.status = 'blocked'; updates.activeSessionId = null;
      await admin.auth().revokeRefreshTokens(uid);
    } else if (action === 'unblock') {
      updates.status = 'active';
    } else if (action === 'resetDevice') {
      updates.deviceId = null; updates.deviceInfo = null; updates.activeSessionId = null;
      await admin.auth().revokeRefreshTokens(uid);
    } else if (action === 'allowDevice') {
      if (!user.lastBlockedDevice) return res.status(409).json({ ok: false, error: 'NO_BLOCKED_DEVICE' });
      updates.deviceId = user.lastBlockedDevice;
      updates.deviceInfo = user.lastBlockedDeviceInfo || 'Android';
      updates.lastBlockedDevice = null; updates.lastBlockedDeviceInfo = null;
      updates.hasAlert = false; updates.activeSessionId = null;
      await admin.auth().revokeRefreshTokens(uid);
    }
    if (Object.keys(updates).length) await ref.update(updates);
    await db.collection('auditLogs').add({ action: `admin_${action}`, actorId: actor.id, actorName: actor.name, target: uid, details: reason, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.status(200).json({ ok: true });
  } catch (error) {
    sendError(res, error);
  }
};
