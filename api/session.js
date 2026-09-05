const crypto = require('crypto');
const { getAdmin, requireUser, sendError } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  try {
    const { decoded, profile } = await requireUser(req);
    const { deviceId, deviceInfo = '' } = req.body || {};
    if (!deviceId) return res.status(400).json({ ok: false, error: 'DEVICE_REQUIRED' });
    const admin = getAdmin();
    const db = admin.firestore();
    const ref = db.collection('users').doc(decoded.uid);
    if (profile.role !== 'admin' && profile.deviceId && profile.deviceId !== deviceId) {
      const now = admin.firestore.Timestamp.now();
      await ref.update({ hasAlert: true, lastBlockedDevice: deviceId, lastBlockedDeviceInfo: deviceInfo, lastBlockedAt: now });
      await db.collection('notifications').add({ type: 'alert', icon: '🚨', text: `تنبيه أمني: المندوب "${profile.name}" حاول فتح حسابه من جهاز آخر. الجهاز: ${deviceInfo}`, read: false, createdAt: now.toDate().toISOString() });
      return res.status(403).json({ ok: false, error: 'SECOND_DEVICE_BLOCKED' });
    }
    const sessionId = profile.role === 'admin' ? null : crypto.randomUUID();
    const updates = { activeSessionId: sessionId, lastLoginAt: admin.firestore.FieldValue.serverTimestamp() };
    if (profile.role !== 'admin' && !profile.deviceId) Object.assign(updates, { deviceId, deviceInfo });
    await ref.update(updates);
    await db.collection('auditLogs').add({ action: 'login', actorId: decoded.uid, actorName: profile.name, target: decoded.uid, details: deviceInfo, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.status(200).json({ ok: true, sessionId, profile: { ...profile, ...updates } });
  } catch (error) {
    sendError(res, error);
  }
};
