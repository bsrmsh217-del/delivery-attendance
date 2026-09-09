const { getAdmin, requireAdmin, isOwner, isPrimaryAdmin, sendError, handleCors } = require('./_firebase');
const BRANCHES = ['المركز', 'الحسينية', 'طويريج', 'الحر'];
module.exports = async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  try {
    const { profile: actor } = await requireAdmin(req);
    const body = req.body || {}, action = body.action;
    const admin = getAdmin(), db = admin.firestore();
    if (action === 'bootstrapOwner') {
      if (actor.role !== 'admin') return res.status(403).json({ ok: false, error: 'ADMIN_REQUIRED' });
      const existing = await db.collection('users').where('role', '==', 'owner').limit(1).get();
      if (!existing.empty) return res.status(409).json({ ok: false, error: 'OWNER_EXISTS' });
      const au = await admin.auth().createUser({ email: 'owner123@deliveryattendance.app', password: '123123', displayName: 'Owner' });
      const now = admin.firestore.Timestamp.now();
      await db.runTransaction(async tx => { tx.create(db.collection('usernames').doc('owner123'), { userId: au.uid, createdAt: now }); tx.create(db.collection('users').doc(au.uid), { authUid: au.uid, email: 'owner123@deliveryattendance.app', username: 'owner123', name: 'Owner', phone: '', employeeId: '', area: '', branch: '', role: 'owner', status: 'active', deviceId: null, deviceInfo: null, activeSessionId: null, hasAlert: false, createdAt: now, createdBy: actor.id }); });
      await db.collection('auditLogs').add({ action: 'bootstrap_owner', actorId: actor.id, actorName: actor.name, actorUsername: actor.username, target: au.uid, details: 'owner123', createdAt: now });
      return res.status(201).json({ ok: true, username: 'owner123' });
    }
    if (action === 'createUser') {
      const { name, username, password, role = 'admin', branch = '', phone = '', employeeId = '', area = '' } = body;
      const requestedRole = role === 'primary_admin' ? 'admin' : role, adminLevel = role === 'primary_admin' ? 'primary' : 'secondary';
      if (requestedRole === 'agent' && !isOwner(actor)) return res.status(403).json({ ok: false, error: 'OWNER_REQUIRED' });
      if (requestedRole === 'admin' && !isOwner(actor) && !isPrimaryAdmin(actor)) return res.status(403).json({ ok: false, error: 'PRIMARY_ADMIN_REQUIRED' });
      if (!['admin', 'agent'].includes(requestedRole) || !String(name || '').trim() || !/^[a-z0-9_]{3,32}$/.test(String(username || '').toLowerCase()) || String(password || '').length < 8 || (requestedRole === 'admin' ? (adminLevel === 'primary' ? (branch === '' || BRANCHES.includes(branch)) : BRANCHES.includes(branch)) : BRANCHES.includes(branch))) return res.status(400).json({ ok: false, error: 'INVALID_USER_DATA' });
      const usernameNorm = String(username).toLowerCase(), lockRef = db.collection('usernames').doc(usernameNorm);
      if ((await lockRef.get()).exists) return res.status(409).json({ ok: false, error: 'USERNAME_TAKEN' });
      const email = `${usernameNorm}@deliveryattendance.app`, au = await admin.auth().createUser({ email, password: String(password), displayName: String(name).trim() });
      const now = admin.firestore.Timestamp.now();
      try { await db.runTransaction(async tx => { if ((await tx.get(lockRef)).exists) throw Object.assign(new Error('USERNAME_TAKEN'), { statusCode: 409 }); tx.create(lockRef, { userId: au.uid, createdAt: now }); tx.create(db.collection('users').doc(au.uid), { authUid: au.uid, email, username: usernameNorm, name: String(name).trim(), phone, employeeId, area, branch: requestedRole === 'agent' || adminLevel === 'secondary' ? branch : '', role: requestedRole, ...(requestedRole === 'admin' ? { adminLevel } : {}), status: 'active', deviceId: null, deviceInfo: null, activeSessionId: null, hasAlert: false, createdAt: now, createdBy: actor.id }); }); } catch (e) { await admin.auth().deleteUser(au.uid); throw e; }
      await db.collection('auditLogs').add({ action: `create_${role}`, actorId: actor.id, actorName: actor.name, actorUsername: actor.username, target: au.uid, details: usernameNorm, createdAt: now });
      return res.status(201).json({ ok: true, uid: au.uid });
    }
    if (!['resetPassword', 'changeUsername', 'approve', 'block', 'unblock', 'resetDevice', 'allowDevice', 'updateProfile', 'deleteUser', 'setBranch'].includes(action)) return res.status(400).json({ ok: false, error: 'INVALID_ACTION' });
    const { uid, password, username, reason = '', branch } = body;
    if (!uid) return res.status(400).json({ ok: false, error: 'INVALID_ACTION' });
    const ref = db.collection('users').doc(uid), snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ ok: false, error: 'USER_NOT_FOUND' });
    const user = snap.data();
    const branchAdmin = actor.role === 'admin' && !isPrimaryAdmin(actor);
    if (branchAdmin && (user.role !== 'agent' || user.branch !== actor.branch || !['resetPassword', 'changeUsername', 'allowDevice'].includes(action))) return res.status(403).json({ ok: false, error: 'BRANCH_ADMIN_LIMITED' });
    if (user.role === 'owner' && actor.id !== uid) return res.status(403).json({ ok: false, error: 'OWNER_PROTECTED' });
    if (!isOwner(actor) && !isPrimaryAdmin(actor) && actor.id !== uid) return res.status(403).json({ ok: false, error: 'PRIMARY_ADMIN_REQUIRED' });
    if (user.role === 'agent' && !isOwner(actor) && !isPrimaryAdmin(actor)) return res.status(403).json({ ok: false, error: 'PRIMARY_ADMIN_REQUIRED' });
    if (['admin', 'owner'].includes(user.role) && !isOwner(actor) && !isPrimaryAdmin(actor)) return res.status(403).json({ ok: false, error: 'PRIMARY_ADMIN_REQUIRED' });
    const updates = {};
    if (action === 'resetPassword') { if (String(password || '').length < 8) return res.status(400).json({ ok: false, error: 'WEAK_PASSWORD' }); await admin.auth().updateUser(uid, { password: String(password) }); }
    else if (action === 'changeUsername') { const normalized = String(username || '').trim().toLowerCase(); if (!/^[a-z0-9_]{3,32}$/.test(normalized)) return res.status(400).json({ ok: false, error: 'INVALID_USERNAME' }); const old = user.username; await db.runTransaction(async tx => { const nl = db.collection('usernames').doc(normalized), ex = await tx.get(nl); if (ex.exists && ex.data().userId !== uid) throw Object.assign(new Error('USERNAME_TAKEN'), { statusCode: 409 }); tx.set(nl, { userId: uid, updatedAt: admin.firestore.Timestamp.now() }, { merge: true }); tx.update(ref, { username: normalized, email: `${normalized}@deliveryattendance.app` }); if (old && old !== normalized) tx.delete(db.collection('usernames').doc(old)); }); await admin.auth().updateUser(uid, { email: `${normalized}@deliveryattendance.app` }); }
    else if (action === 'approve') updates.status = 'active';
    else if (action === 'block') { updates.status = 'blocked'; updates.activeSessionId = null; await admin.auth().updateUser(uid, { disabled: true }); }
    else if (action === 'unblock') { updates.status = 'active'; await admin.auth().updateUser(uid, { disabled: false }); }
    else if (action === 'resetDevice') { updates.deviceId = null; updates.deviceInfo = null; updates.activeSessionId = null; await admin.auth().revokeRefreshTokens(uid); }
    else if (action === 'allowDevice') { if (!user.lastBlockedDevice) return res.status(409).json({ ok: false, error: 'NO_BLOCKED_DEVICE' }); Object.assign(updates, { deviceId: user.lastBlockedDevice, deviceInfo: user.lastBlockedDeviceInfo || 'Android', lastBlockedDevice: null, lastBlockedDeviceInfo: null, hasAlert: false, activeSessionId: null }); await admin.auth().revokeRefreshTokens(uid); }
    else if (action === 'setBranch' || action === 'updateProfile') { if (branch !== undefined && ((user.role === 'agent' && !BRANCHES.includes(branch)) || (user.role === 'admin' && user.adminLevel !== 'primary' && !BRANCHES.includes(branch)) || (user.role === 'admin' && user.adminLevel === 'primary' && branch !== '' && !BRANCHES.includes(branch)))) return res.status(400).json({ ok: false, error: 'INVALID_BRANCH' }); Object.assign(updates, { ...(branch !== undefined ? { branch } : {}), ...(body.name ? { name: String(body.name).trim() } : {}), ...(body.phone !== undefined ? { phone: String(body.phone) } : {}), ...(body.employeeId !== undefined ? { employeeId: String(body.employeeId) } : {}), ...(body.area !== undefined ? { area: String(body.area) } : {}) }); }
    else if (action === 'deleteUser') { if (uid === actor.id) return res.status(400).json({ ok: false, error: 'CANNOT_DELETE_SELF' }); await admin.auth().deleteUser(uid); const batch = db.batch(); batch.delete(ref); if (user.username) batch.delete(db.collection('usernames').doc(user.username)); batch.delete(db.collection('openAttendance').doc(uid)); const related = await db.collection('attendance').where('agentId', '==', uid).get(); related.docs.forEach(d => batch.delete(d.ref)); const leaves = await db.collection('leaves').where('agentId', '==', uid).get(); leaves.docs.forEach(d => batch.delete(d.ref)); await batch.commit(); await db.collection('auditLogs').add({ action: 'delete_user_permanent', actorId: actor.id, actorName: actor.name, actorUsername: actor.username, target: uid, details: reason, createdAt: admin.firestore.FieldValue.serverTimestamp() }); return res.status(200).json({ ok: true, deleted: true }); }
    if (Object.keys(updates).length) { await ref.update(updates); if (updates.name && user.role === 'agent') { const ar = await db.collection('attendance').where('agentId', '==', uid).get(); const batch = db.batch(); ar.docs.forEach(d => batch.update(d.ref, { agentName: updates.name })); if (!ar.empty) await batch.commit(); } }
    await db.collection('auditLogs').add({ action: `admin_${action}`, actorId: actor.id, actorName: actor.name, actorUsername: actor.username, target: uid, details: reason, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.status(200).json({ ok: true });
  } catch (error) { sendError(res, error); }
};
