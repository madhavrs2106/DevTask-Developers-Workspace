const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const prisma = require('../db');

const DEVTASK_EMAIL_DOMAIN = '@devtask.io';
const isValidDevtaskEmail = (email) => typeof email === 'string' && email.trim().toLowerCase().endsWith(DEVTASK_EMAIL_DOMAIN);

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  title: user.title,
  avatarColor: user.avatarColor,
  avatarUrl: user.avatarUrl || null,
  socials: user.socials || []
});

const computeStreak = async (userId) => {
  // A day counts toward the streak only if study hours were logged that day (codingHours > 0)
  const logs = await prisma.dailyAnalytics.findMany({
    where: { userId, codingHours: { gt: 0 } },
    select: { date: true },
    orderBy: { date: 'desc' }
  });
  if (logs.length === 0) return 0;

  const dates = new Set(logs.map(l => l.date));
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!dates.has(today) && !dates.has(yesterday)) return 0;

  let streak = 0;
  let cursor = dates.has(today) ? today : yesterday;
  while (dates.has(cursor)) {
    streak++;
    const d = new Date(cursor + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    cursor = d.toISOString().split('T')[0];
  }
  return streak;
};

const toResponse = async (user) => ({
  ...serializeUser(user),
  streak: await computeStreak(user.id)
});

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);

exports.register = async (req, res) => {
  try {
    const { email, password, name, title } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Please provide email, password and name' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    if (!isValidDevtaskEmail(email)) {
      return res.status(400).json({ error: 'Only @devtask.io email addresses are allowed' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name,
        title: title || 'Full Stack Developer',
        avatarColor: ['cyan', 'teal', 'violet', 'emerald', 'amber'][Math.floor(Math.random() * 5)]
      },
      include: { socials: true }
    });

    res.status(201).json({
      token: signToken(user),
      user: await toResponse(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }
    if (!isValidDevtaskEmail(email)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { socials: true }
    });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    res.json({
      token: signToken(user),
      user: await toResponse(user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { socials: true }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(await toResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, title, avatarColor } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, title, avatarColor },
      include: { socials: true }
    });

    res.json(await toResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide current and new password' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadAvatar = [
  avatarUpload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
      }

      const current = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (current && current.avatarUrl) {
        const oldPath = path.join(uploadDir, path.basename(current.avatarUrl));
        fs.unlink(oldPath, () => {});
      }

      const avatarUrl = `/uploads/${req.file.filename}`;
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { avatarUrl },
        include: { socials: true }
      });

      res.json(await toResponse(user));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
];

exports.removeAvatar = async (req, res) => {
  try {
    const current = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (current && current.avatarUrl) {
      const oldPath = path.join(uploadDir, path.basename(current.avatarUrl));
      fs.unlink(oldPath, () => {});
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl: null },
      include: { socials: true }
    });

    res.json(await toResponse(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const current = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (current && current.avatarUrl) {
      const oldPath = path.join(uploadDir, path.basename(current.avatarUrl));
      fs.unlink(oldPath, () => {});
    }

    // Prisma cascade (onDelete: Cascade) handles Tasks, Courses, DailyAnalytics
    await prisma.user.delete({
      where: { id: req.user.id }
    });

    res.json({ message: 'Account and all workspace data permanently deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
