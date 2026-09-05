const { getAdmin, requireUser, distanceMeters, baghdadDate, sendError } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  try {
    const { decoded, profile } = await requireUser(req);
    if (profile.role === 'admin') return res.status(403).json({ ok: false, error: 'AGENT_REQUIRED' });

    const { action, lat, lng, accuracy, deviceId, deviceInfo, mockLocation, developerOptions } = req.body || {};
    if (!['checkin', 'checkout'].includes(action)) return res.status(400).json({ ok: false, error: 'INVALID_ACTION' });
    if (![lat, lng, accuracy].every(Number.isFinite)) return res.status(400).json({ ok: false, error: 'INVALID_LOCATION' });
    if (!deviceId || profile.deviceId !== deviceId) return res.status(403).json({ ok: false, error: 'UNTRUSTED_DEVICE' });
    if (mockLocation || developerOptions) return res.status(403).json({ ok: false, error: 'MOCK_LOCATION_REJECTED' });

    const admin = getAdmin();
    const db = admin.firestore();
    const warehouseSnap = await db.collection('settings').doc('warehouse').get();
    if (!warehouseSnap.exists) return res.status(409).json({ ok: false, error: 'WAREHOUSE_NOT_CONFIGURED' });
    const warehouse = warehouseSnap.data();
    const radius = Number(warehouse.radius || 100);
    const distance = distanceMeters(Number(lat), Number(lng), Number(warehouse.lat), Number(warehouse.lng));
    const maximumAccuracy = Math.min(50, radius);
    if (distance > radius) return res.status(403).json({ ok: false, error: 'OUTSIDE_GEOFENCE', distance, radius });
    if (Number(accuracy) <= 0 || Number(accuracy) > maximumAccuracy) {
      return res.status(403).json({ ok: false, error: 'GPS_ACCURACY_TOO_LOW', accuracy, maximumAccuracy });
    }

    const pointerRef = db.collection('openAttendance').doc(decoded.uid);
    const userRef = db.collection('users').doc(decoded.uid);
    const result = await db.runTransaction(async tx => {
      const pointer = await tx.get(pointerRef);
      const now = admin.firestore.Timestamp.now();
      if (action === 'checkin') {
        if (pointer.exists) throw Object.assign(new Error('ALREADY_CHECKED_IN'), { statusCode: 409 });
        const attendanceRef = db.collection('attendance').doc();
        tx.create(attendanceRef, {
          agentId: decoded.uid,
          agentName: profile.name,
          username: profile.username,
          date: baghdadDate(now.toDate()),
          checkinTime: now,
          checkoutTime: null,
          checkinLat: Number(lat), checkinLng: Number(lng), checkinAccuracy: Number(accuracy),
          checkoutLat: null, checkoutLng: null, checkoutAccuracy: null,
          deviceId, deviceInfo: deviceInfo || '',
          createdAt: now
        });
        tx.create(pointerRef, { attendanceId: attendanceRef.id, agentId: decoded.uid, createdAt: now });
        tx.update(userRef, { activeSessionId: profile.activeSessionId || null, lastAttendanceAt: now });
        return { action, attendanceId: attendanceRef.id, serverTime: now.toDate().toISOString(), distance, radius };
      }
      if (!pointer.exists) throw Object.assign(new Error('NO_OPEN_ATTENDANCE'), { statusCode: 409 });
      const attendanceRef = db.collection('attendance').doc(pointer.data().attendanceId);
      const attendance = await tx.get(attendanceRef);
      if (!attendance.exists || attendance.data().checkoutTime) throw Object.assign(new Error('NO_OPEN_ATTENDANCE'), { statusCode: 409 });
      tx.update(attendanceRef, {
        checkoutTime: now,
        checkoutLat: Number(lat), checkoutLng: Number(lng), checkoutAccuracy: Number(accuracy),
        updatedAt: now
      });
      tx.delete(pointerRef);
      tx.update(userRef, { lastAttendanceAt: now });
      return { action, attendanceId: attendanceRef.id, serverTime: now.toDate().toISOString(), distance, radius };
    });

    await db.collection('auditLogs').add({
      action: `attendance_${action}`, actorId: decoded.uid, actorName: profile.name,
      target: result.attendanceId, details: `distance=${distance};accuracy=${accuracy}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    sendError(res, error);
  }
};
