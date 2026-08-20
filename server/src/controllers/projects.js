const prisma = require('../db');

exports.getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { title, description, status, difficulty, techStack, githubLink, codeSnippet, durationHours } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const project = await prisma.project.create({
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

    if (durationHours && Number(durationHours) > 0) {
      const today = new Date().toISOString().split('T')[0];
      await prisma.dailyAnalytics.upsert({
        where: { userId_date: { userId: req.user.id, date: today } },
        update: { codingHours: { increment: Number(durationHours) } },
        create: { userId: req.user.id, date: today, codingHours: Number(durationHours) }
      });
    }

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, difficulty, techStack, githubLink, codeSnippet, durationHours } = req.body;

    const existingProject = await prisma.project.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const hoursDiff = (Number(durationHours) || 0.0) - existingProject.durationHours;

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

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData
    });

    if (hoursDiff > 0) {
      const today = new Date().toISOString().split('T')[0];
      await prisma.dailyAnalytics.upsert({
        where: { userId_date: { userId: req.user.id, date: today } },
        update: { codingHours: { increment: hoursDiff } },
        create: { userId: req.user.id, date: today, codingHours: hoursDiff }
      });
    }

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const existingProject = await prisma.project.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
