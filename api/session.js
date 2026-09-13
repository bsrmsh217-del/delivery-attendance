const crypto = require('crypto');
const { getAdmin, requireUser, sendError, handleCors } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  try {
    const { decoded, profile } = await requireUser(req);
    const { deviceId, deviceInfo = '', clientType = 'native', siteLink = '' } = req.body || {};
    if (!deviceId) return res.status(400).json({ ok: false, error: 'DEVICE_REQUIRED' });
    const admin = getAdmin();
    const db = admin.firestore();
    const ref = db.collection('users').doc(decoded.uid);
    let validSiteLink = false;
    if (clientType === 'web') {
      if (profile.role === 'agent' && !siteLink && !profile.webDeviceId) return res.status(403).json({ ok: false, error: 'SITE_LINK_REQUIRED' });
      if (siteLink) {
        const hash = crypto.createHash('sha256').update(String(siteLink)).digest('hex');
        const linkRef = db.collection('siteLinks').doc(hash), linkSnap = await linkRef.get(), link = linkSnap.exists ? linkSnap.data() : null;
        const now = admin.firestore.Timestamp.now();
        if (!link || link.used || !link.expiresAt || link.expiresAt.toMillis() < now.toMillis() || link.uid !== decoded.uid) return res.status(403).json({ ok: false, error: 'INVALID_SITE_LINK' });
        await linkRef.update({ used: true, usedAt: now, usedDeviceId: deviceId });
        validSiteLink = true;
      }
      if (!validSiteLink && profile.webDeviceId && profile.webDeviceId !== deviceId) {
        const now = admin.firestore.Timestamp.now();
        await db.collection('notifications').add({ type: 'alert', icon: '🚨', branch: profile.branch || '', agentId: profile.id, text: `تنبيه أمني: المندوب "${profile.name}" حاول فتح الموقع من جهاز أو متصفح آخر. الجهاز: ${deviceInfo}`, read: false, createdAt: now.toDate().toISOString() });
        return res.status(403).json({ ok: false, error: 'SECOND_SITE_DEVICE' });
      }
    }
    if (!['admin', 'owner'].includes(profile.role) && clientType !== 'web' && profile.deviceId && profile.deviceId !== deviceId) {
      const now = admin.firestore.Timestamp.now();
      await ref.update({ hasAlert: true, lastBlockedDevice: deviceId, lastBlockedDeviceInfo: deviceInfo, lastBlockedAt: now });
      await db.collection('notifications').add({ type: 'alert', icon: '🚨', branch: profile.branch || '', agentId: profile.id, text: `تنبيه أمني: المندوب "${profile.name}" — ${profile.branch || 'بدون فرع'} حاول فتح حسابه من جهاز آخر. الجهاز: ${deviceInfo}`, read: false, createdAt: now.toDate().toISOString() });
      return res.status(403).json({ ok: false, error: 'SECOND_DEVICE_BLOCKED' });
    }
    const sessionId = ['admin', 'owner'].includes(profile.role) ? null : crypto.randomUUID();
    const updates = { activeSessionId: sessionId, lastLoginAt: admin.firestore.FieldValue.serverTimestamp() };
    if (!['admin', 'owner'].includes(profile.role) && !profile.deviceId) Object.assign(updates, { deviceId, deviceInfo });
    if (clientType === 'web' && (validSiteLink || !profile.webDeviceId)) Object.assign(updates, { webDeviceId: deviceId, webDeviceInfo: deviceInfo, webLinkedAt: admin.firestore.FieldValue.serverTimestamp() });
    await ref.update(updates);
    await db.collection('auditLogs').add({ action: 'login', actorId: decoded.uid, actorName: profile.name, target: decoded.uid, details: deviceInfo, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.status(200).json({ ok: true, sessionId, profile: { ...profile, ...updates } });
  } catch (error) {
    sendError(res, error);
  }
};
