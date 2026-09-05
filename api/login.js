const crypto = require('crypto');
const { getAdmin, sendError } = require('./_firebase');

const API_KEY = 'AIzaSyD-4qMzlL0BhvuXdZKX3uAU1Ip_zMCaQCg';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  const { username, password, deviceId, deviceInfo = '' } = req.body || {};
  const normalized = String(username || '').trim().toLowerCase();
  try {
    if (!/^[a-z0-9_]{3,32}$/.test(normalized) || !password || !deviceId) {
      return res.status(400).json({ ok: false, error: 'INVALID_LOGIN_DATA' });
    }
    const email = `${normalized}@deliveryattendance.app`;
    const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: String(password), returnSecureToken: true })
    });
    const authData = await authResponse.json();
    const admin = getAdmin();
    const db = admin.firestore();
    if (!authResponse.ok) {
      await db.collection('loginAttempts').add({ username: normalized, success: false, reason: 'invalid_credentials', deviceId, deviceInfo, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
    }
    const userRef = db.collection('users').doc(authData.localId);
    const snap = await userRef.get();
    if (!snap.exists) return res.status(403).json({ ok: false, error: 'PROFILE_NOT_FOUND' });
    const profile = { id: snap.id, ...snap.data() };
    if (profile.status !== 'active') return res.status(403).json({ ok: false, error: profile.status === 'pending' ? 'ACCOUNT_PENDING' : 'ACCOUNT_BLOCKED' });

    if (profile.role !== 'admin' && profile.deviceId && profile.deviceId !== deviceId) {
      const now = admin.firestore.Timestamp.now();
      await userRef.update({ hasAlert: true, lastBlockedDevice: deviceId, lastBlockedDeviceInfo: deviceInfo, lastBlockedAt: now });
      await db.collection('notifications').add({ type: 'alert', icon: '🚨', text: `تنبيه أمني: المندوب "${profile.name}" حاول فتح حسابه من جهاز آخر. الجهاز: ${deviceInfo}`, read: false, createdAt: now.toDate().toISOString() });
      await db.collection('loginAttempts').add({ username: normalized, success: false, reason: 'second_device', deviceId, deviceInfo, createdAt: now });
      return res.status(403).json({ ok: false, error: 'SECOND_DEVICE_BLOCKED' });
    }

    const sessionId = crypto.randomUUID();
    const updates = { activeSessionId: profile.role === 'admin' ? null : sessionId, lastLoginAt: admin.firestore.FieldValue.serverTimestamp() };
    if (profile.role !== 'admin' && !profile.deviceId) Object.assign(updates, { deviceId, deviceInfo });
    await userRef.update(updates);
    await db.collection('loginAttempts').add({ username: normalized, success: true, reason: '', deviceId, deviceInfo, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.status(200).json({ ok: true, idToken: authData.idToken, refreshToken: authData.refreshToken, expiresIn: Number(authData.expiresIn), sessionId, profile: { ...profile, ...updates } });
  } catch (error) {
    sendError(res, error);
  }
};
