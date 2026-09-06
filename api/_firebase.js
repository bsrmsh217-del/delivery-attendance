const admin = require('firebase-admin');

function handleCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}
function getApp() {
  if (admin.apps.length) return admin.app();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured');
  return admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
}
function getAdmin() { getApp(); return admin; }
async function requireUser(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) { const e = new Error('UNAUTHORIZED'); e.statusCode = 401; throw e; }
  const decoded = await getAdmin().auth().verifyIdToken(header.slice(7));
  const snap = await getAdmin().firestore().collection('users').doc(decoded.uid).get();
  if (!snap.exists) { const e = new Error('PROFILE_NOT_FOUND'); e.statusCode = 403; throw e; }
  const profile = { id: snap.id, ...snap.data() };
  if (profile.status !== 'active') { const e = new Error('ACCOUNT_NOT_ACTIVE'); e.statusCode = 403; throw e; }
  return { decoded, profile };
}
async function requireAdmin(req) {
  const user = await requireUser(req);
  if (!['admin', 'owner'].includes(user.profile.role)) { const e = new Error('ADMIN_REQUIRED'); e.statusCode = 403; throw e; }
  return user;
}
function isOwner(profile) { return profile?.role === 'owner'; }
function isPrimaryAdmin(profile) { return profile?.role === 'admin' && profile?.username === 'rasim1010'; }
function distanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = value => value * Math.PI / 180, radius = 6371000;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
function baghdadDate(date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baghdad', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
function sendError(res, error) { const status = error.statusCode || 500; res.status(status).json({ ok: false, error: status >= 500 ? 'SERVER_ERROR' : error.message }); }
module.exports = { getAdmin, requireUser, requireAdmin, isOwner, isPrimaryAdmin, distanceMeters, baghdadDate, sendError, handleCors };
