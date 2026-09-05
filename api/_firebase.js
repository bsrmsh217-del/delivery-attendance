const admin = require('firebase-admin');

function getApp() {
  if (admin.apps.length) return admin.app();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured');
  const serviceAccount = JSON.parse(raw);
  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

function getAdmin() {
  getApp();
  return admin;
}

async function requireUser(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    const error = new Error('UNAUTHORIZED');
    error.statusCode = 401;
    throw error;
  }
  const decoded = await getAdmin().auth().verifyIdToken(header.slice(7));
  const snap = await getAdmin().firestore().collection('users').doc(decoded.uid).get();
  if (!snap.exists) {
    const error = new Error('PROFILE_NOT_FOUND');
    error.statusCode = 403;
    throw error;
  }
  const profile = { id: snap.id, ...snap.data() };
  if (profile.status !== 'active') {
    const error = new Error('ACCOUNT_NOT_ACTIVE');
    error.statusCode = 403;
    throw error;
  }
  return { decoded, profile };
}

async function requireAdmin(req) {
  const user = await requireUser(req);
  if (user.profile.role !== 'admin') {
    const error = new Error('ADMIN_REQUIRED');
    error.statusCode = 403;
    throw error;
  }
  return user;
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = value => value * Math.PI / 180;
  const radius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function baghdadDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Baghdad', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(date);
}

function sendError(res, error) {
  const status = error.statusCode || 500;
  const safe = status >= 500 ? 'SERVER_ERROR' : error.message;
  res.status(status).json({ ok: false, error: safe });
}

module.exports = { getAdmin, requireUser, requireAdmin, distanceMeters, baghdadDate, sendError };
