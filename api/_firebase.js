const admin = require('firebase-admin');

const rateBuckets = new Map();
function rateLimit(req, key, limit = 60, windowMs = 60000) {
  const now = Date.now();
  const ip = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim();
  const bucketKey = `${key}:${ip}`;
  const bucket = rateBuckets.get(bucketKey);
  if (!bucket || now - bucket.startedAt >= windowMs) { rateBuckets.set(bucketKey, { startedAt: now, count: 1 }); return; }
  bucket.count += 1;
  if (bucket.count > limit) { const error = new Error('RATE_LIMITED'); error.statusCode = 429; throw error; }
}
function cleanText(value, max = 160) {
  return String(value ?? '').replace(/[<>]/g, '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, max);
}
async function safeAudit(db, entry) {
  try { await db.collection('auditLogs').add(entry); } catch (error) { console.error('audit write failed', error); }
}

function handleCors(req, res) {
  const configured = String(process.env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim().replace(/\/$/, '')).filter(Boolean);
  const allowed = configured.length ? configured : [
    process.env.PUBLIC_APP_URL || 'https://delivery-attendance.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost',
    'https://localhost',
    'capacitor://localhost',
    'ionic://localhost'
  ].map(value => value.replace(/\/$/, ''));
  const origin = String(req.headers.origin || '').replace(/\/$/, '');
  if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}
function getApp() {
  if (admin.apps.length) return admin.app();
  const raw = String(process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured');
  let serviceAccount;
  try { serviceAccount = JSON.parse(raw); } catch (_) { throw new Error('FIREBASE_SERVICE_ACCOUNT is invalid JSON'); }
  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) throw new Error('FIREBASE_SERVICE_ACCOUNT is incomplete');
  serviceAccount.private_key = String(serviceAccount.private_key).replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
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
function isPrimaryAdmin(profile) { return profile?.role === 'admin' && (profile?.username === 'rasim1010' || profile?.adminLevel === 'primary'); }
function distanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = value => value * Math.PI / 180, radius = 6371000;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
function baghdadDate(date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baghdad', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
function sendError(res, error) { console.error('API error', error); const known = new Set(['UNAUTHORIZED','PROFILE_NOT_FOUND','ACCOUNT_NOT_ACTIVE','ACCOUNT_BLOCKED','ADMIN_REQUIRED','AGENT_REQUIRED','OWNER_REQUIRED','PRIMARY_ADMIN_REQUIRED','SECOND_DEVICE_BLOCKED','OUTSIDE_GEOFENCE','BRANCH_LOCATION_NOT_CONFIGURED','WAREHOUSE_NOT_CONFIGURED','GPS_ACCURACY_TOO_LOW','MOCK_LOCATION_REJECTED','NO_OPEN_ATTENDANCE','ALREADY_CHECKED_IN','RATE_LIMITED']); const status = error.statusCode || (known.has(error.message) ? 403 : 500); const code = String(error?.code || error?.name || '').replace(/[^a-zA-Z0-9_/-]/g, '').slice(0, 80); if (code) res.setHeader('X-Error-Code', code); res.status(status).json({ ok: false, error: status >= 500 ? 'SERVER_ERROR' : error.message }); }
module.exports = { getAdmin, requireUser, requireAdmin, isOwner, isPrimaryAdmin, distanceMeters, baghdadDate, cleanText, rateLimit, safeAudit, sendError, handleCors };
