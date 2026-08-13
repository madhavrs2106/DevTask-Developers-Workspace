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
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'midnight-neon-glow-secret-key-12345');
  } catch (ex) {
    return res.status(400).json({ error: 'Invalid token.' });
  }

  req.user = decoded;

  // Record today's activity (best-effort, never blocks the request)
  try {
    const today = new Date().toISOString().split('T')[0];
    await prisma.activityLog.upsert({
      where: {
        userId_date: {
          userId: decoded.id,
          date: today
        }
      },
      update: {},
      create: {
        userId: decoded.id,
        date: today
      }
    });
  } catch (err) {
    console.error('Failed to log activity', err.message);
  }

  next();
};
