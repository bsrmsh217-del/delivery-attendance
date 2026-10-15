const crypto = require('crypto');
const { getAdmin, requireUser, sendError, handleCors, rateLimit, cleanText } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  try {
    rateLimit(req, 'session', 60);
    const { decoded, profile } = await requireUser(req);
    const { deviceId, deviceInfo = '', clientType = 'native' } = req.body || {};
    const safeDeviceInfo = cleanText(deviceInfo, 160);
    if (!deviceId) return res.status(400).json({ ok: false, error: 'DEVICE_REQUIRED' });
    const admin = getAdmin();
    const db = admin.firestore();
    const ref = db.collection('users').doc(decoded.uid);
    if (!['admin', 'owner'].includes(profile.role) && clientType !== 'web' && profile.deviceId && profile.deviceId !== deviceId) {
      const now = admin.firestore.Timestamp.now();
      await ref.update({ hasAlert: true, lastBlockedDevice: deviceId, lastBlockedDeviceInfo: safeDeviceInfo, lastBlockedAt: now });
      try {
        await db.collection('notifications').add({ type: 'alert', icon: 'تنبيه', branch: profile.branch || '', agentId: profile.id, text: `تنبيه أمني: المندوب "${cleanText(profile.name, 100)}" حاول فتح حسابه من جهاز آخر. الجهاز: ${safeDeviceInfo}`, read: false, createdAt: now.toDate().toISOString() });
      } catch (notificationError) {
        console.error('notification write failed during device block', notificationError);
      }
      return res.status(403).json({ ok: false, error: 'SECOND_DEVICE_BLOCKED' });
    }
    const sessionId = ['admin', 'owner'].includes(profile.role) ? null : crypto.randomUUID();
    const updates = { activeSessionId: sessionId, lastLoginAt: admin.firestore.FieldValue.serverTimestamp() };
    if (!['admin', 'owner'].includes(profile.role) && !profile.deviceId) Object.assign(updates, { deviceId, deviceInfo: safeDeviceInfo });
    await ref.update(updates);
    try {
      await db.collection('auditLogs').add({ action: 'login', actorId: decoded.uid, actorName: cleanText(profile.name, 100), target: decoded.uid, details: safeDeviceInfo, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    } catch (auditError) {
      console.error('login audit write failed', auditError);
    }
    res.status(200).json({ ok: true, sessionId, profile: { ...profile, ...updates } });
  } catch (error) {
    sendError(res, error);
  }
};
