const prisma = require('../db');

exports.getTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, difficulty, techStack, githubLink, codeSnippet, durationHours } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        difficulty: difficulty || 'BEGINNER',
        techStack: techStack || '',
        githubLink,
        codeSnippet,
        durationHours: Number(durationHours) || 0.0,
        userId: req.user.id
      }
    });

    // If durationHours is provided, add to analytics for today
    if (durationHours && Number(durationHours) > 0) {
      const today = new Date().toISOString().split('T')[0];
      await prisma.dailyAnalytics.upsert({
        where: {
          userId_date: {
            userId: req.user.id,
            date: today
          }
        },
        update: {
          codingHours: { increment: Number(durationHours) }
        },
        create: {
          userId: req.user.id,
          date: today,
          codingHours: Number(durationHours)
        }
      });
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, difficulty, techStack, githubLink, codeSnippet, durationHours } = req.body;

    const existingTask = await prisma.task.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const hoursDiff = (Number(durationHours) || 0.0) - existingTask.durationHours;

    const updateData = {
      title,
      description,
      status,
      difficulty,
      techStack,
      githubLink,
      codeSnippet
    };
    if (durationHours !== undefined) {
      updateData.durationHours = Number(durationHours) || 0.0;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData
    });

    // Only add hours, never subtract
    if (hoursDiff > 0) {
      const today = new Date().toISOString().split('T')[0];
      await prisma.dailyAnalytics.upsert({
        where: {
          userId_date: {
            userId: req.user.id,
            date: today
          }
        },
        update: {
          codingHours: { increment: hoursDiff }
        },
        create: {
          userId: req.user.id,
          date: today,
          codingHours: hoursDiff
        }
      });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const existingTask = await prisma.task.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
