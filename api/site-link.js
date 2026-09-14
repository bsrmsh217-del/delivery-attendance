const crypto = require('crypto');
const { getAdmin, requireUser, sendError, handleCors } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  try {
    const { decoded, profile } = await requireUser(req);
    const { action, deviceId, deviceInfo = '' } = req.body || {};
    if (action !== 'create' || !deviceId) return res.status(400).json({ ok: false, error: 'INVALID_LINK_REQUEST' });
    if (profile.role !== 'agent') return res.status(403).json({ ok: false, error: 'AGENT_REQUIRED' });
    const admin = getAdmin(), db = admin.firestore();
    const raw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');
    const now = admin.firestore.Timestamp.now();
    const expires = new admin.firestore.Timestamp(now.seconds + 300, now.nanoseconds);
    await db.collection('siteLinks').doc(tokenHash).set({ uid: decoded.uid, deviceId, deviceInfo, used: false, createdAt: now, expiresAt: expires });
    await db.collection('auditLogs').add({ action: 'create_site_link', actorId: decoded.uid, actorName: profile.name, target: decoded.uid, details: deviceInfo, createdAt: now });
    const origin = process.env.PUBLIC_APP_URL || 'https://delivery-attendance.vercel.app';
    res.status(200).json({ ok: true, url: `${origin}/?siteLink=${raw}` });
  } catch (error) { sendError(res, error); }
};
