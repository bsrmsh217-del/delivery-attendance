const crypto = require('crypto');
const { getAdmin, requireUser, sendError, handleCors } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  try {
    const { decoded, profile } = await requireUser(req);
    const { deviceId, deviceInfo = '' } = req.body || {};
    if (!deviceId) return res.status(400).json({ ok: false, error: 'DEVICE_REQUIRED' });
    const admin = getAdmin();
    const db = admin.firestore();
    const ref = db.collection('users').doc(decoded.uid);
    if (!['admin', 'owner'].includes(profile.role) && profile.deviceId && profile.deviceId !== deviceId) {
      const now = admin.firestore.Timestamp.now();
      await ref.update({ hasAlert: true, lastBlockedDevice: deviceId, lastBlockedDeviceInfo: deviceInfo, lastBlockedAt: now });
      await db.collection('notifications').add({ type: 'alert', icon: '🚨', branch: profile.branch || '', agentId: profile.id, text: `تنبيه أمني: المندوب "${profile.name}" — ${profile.branch || 'بدون فرع'} حاول فتح حسابه من جهاز آخر. الجهاز: ${deviceInfo}`, read: false, createdAt: now.toDate().toISOString() });
      return res.status(403).json({ ok: false, error: 'SECOND_DEVICE_BLOCKED' });
    }
    const sessionId = ['admin', 'owner'].includes(profile.role) ? null : crypto.randomUUID();
    const updates = { activeSessionId: sessionId, lastLoginAt: admin.firestore.FieldValue.serverTimestamp() };
    if (!['admin', 'owner'].includes(profile.role) && !profile.deviceId) Object.assign(updates, { deviceId, deviceInfo });
    await ref.update(updates);
    await db.collection('auditLogs').add({ action: 'login', actorId: decoded.uid, actorName: profile.name, target: decoded.uid, details: deviceInfo, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.status(200).json({ ok: true, sessionId, profile: { ...profile, ...updates } });
  } catch (error) {
    sendError(res, error);
  }
};
