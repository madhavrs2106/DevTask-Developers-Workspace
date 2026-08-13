const prisma = require('../db');

exports.getCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { title, platform, status, progressPercent, totalHours } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const course = await prisma.course.create({
      data: {
        title,
        platform: platform || 'Self-Paced',
        status: status || 'NOT_STARTED',
        progressPercent: Number(progressPercent) || 0,
        totalHours: Number(totalHours) || 0.0,
        userId: req.user.id
      }
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, platform, status, progressPercent, totalHours } = req.body;

    const existingCourse = await prisma.course.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        title,
        platform,
        status,
        progressPercent: Number(progressPercent) || 0,
        totalHours: Number(totalHours) || 0.0
      }
    });

    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const existingCourse = await prisma.course.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingCourse) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await prisma.course.delete({ where: { id } });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
