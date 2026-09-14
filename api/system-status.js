const { getAdmin, requireAdmin, isOwner, sendError, handleCors } = require('./_firebase');
module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  try {
    const { profile } = await requireAdmin(req);
    if (!isOwner(profile)) return res.status(403).json({ ok: false, error: 'OWNER_REQUIRED' });
    const admin = getAdmin(), db = admin.firestore();
    const [users, open, version] = await Promise.all([
      db.collection('users').get(), db.collection('openAttendance').get(),
      fetch(`${process.env.PUBLIC_APP_URL || 'https://delivery-attendance.vercel.app'}/version.json?ts=${Date.now()}`).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);
    const rows = users.docs.map(d => d.data());
    res.status(200).json({ ok: true, checkedAt: new Date().toISOString(), firebase: true, api: true, users: rows.length, agents: rows.filter(x => x.role === 'agent' && x.status === 'active').length, admins: rows.filter(x => ['admin','owner'].includes(x.role)).length, openAttendance: open.size, publishedVersion: version?.version || null, publishedApk: version?.apkUrl || null });
  } catch (error) { sendError(res, error); }
};
