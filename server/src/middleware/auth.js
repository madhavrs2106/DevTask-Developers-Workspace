const jwt = require('jsonwebtoken');
const prisma = require('../db');

module.exports = async function(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Invalid token format.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (ex) {
    return res.status(400).json({ error: 'Invalid token.' });
  }

  req.user = decoded;

  // Record today's activity (best-effort, never blocks the request)
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = await prisma.activityLog.findUnique({
      where: { userId_date: { userId: decoded.id, date: today } },
      select: { id: true }
    });
    if (!existing) {
      await prisma.activityLog.create({
        data: { userId: decoded.id, date: today }
      });
    }
  } catch (err) {
    // Best-effort: silently skip (e.g. user was deleted, or concurrent race)
  }

  next();
};
