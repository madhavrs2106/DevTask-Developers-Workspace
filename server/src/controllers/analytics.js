const prisma = require('../db');

exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch all tasks to compute metrics
    const tasks = await prisma.task.findMany({
      where: { userId }
    });

    const activeTasks = tasks.filter(t => t.status !== 'DONE').length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;

    // 2. Fetch all courses
    const courses = await prisma.course.findMany({
      where: { userId }
    });
    const completedCourses = courses.filter(c => c.status === 'COMPLETED').length;

    // 3. Weekly coding hours (last 7 days)
    const dailyData = await prisma.dailyAnalytics.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 7
    });

    // Make sure we have a proper 7 day list
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const match = dailyData.find(item => item.date === dateString);
      last7Days.push({
        date: dateString,
        hours: match ? match.codingHours : 0.0
      });
    }

    // Total coding hours across all time
    const totalCodingHoursData = await prisma.dailyAnalytics.aggregate({
      where: { userId },
      _sum: {
        codingHours: true
      }
    });
    const totalCodingHours = totalCodingHoursData._sum.codingHours || 0.0;

    // 4. Task difficulty distribution
    const difficultyDistribution = {
      BEGINNER: tasks.filter(t => t.difficulty === 'BEGINNER').length,
      INTERMEDIATE: tasks.filter(t => t.difficulty === 'INTERMEDIATE').length,
      ADVANCED: tasks.filter(t => t.difficulty === 'ADVANCED').length
    };

    // 5. Tech stack mastery progress
    // Count occurrences of tech tags in tasks
    const skillMap = {};
    tasks.forEach(t => {
      if (t.techStack) {
        t.techStack.split(',').forEach(tech => {
          const cleanTech = tech.trim();
          if (cleanTech) {
            skillMap[cleanTech] = (skillMap[cleanTech] || 0) + 1;
          }
        });
      }
    });

    const skillMastery = Object.keys(skillMap).map(tech => ({
      name: tech,
      value: skillMap[tech] * 10 // scale value for chart representation
    })).slice(0, 5); // limit to top 5

    res.json({
      summary: {
        totalCodingHours,
        activeTasks,
        completedTasks,
        completedCourses,
        sprintVelocity: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
      },
      weeklyCoding: last7Days,
      taskStatusDistribution: [
        { name: 'To Do', value: tasks.filter(t => t.status === 'TODO').length },
        { name: 'In Progress', value: tasks.filter(t => t.status === 'IN_PROGRESS').length },
        { name: 'In Review', value: tasks.filter(t => t.status === 'IN_REVIEW').length },
        { name: 'Done', value: completedTasks }
      ],
      difficultyDistribution,
      skillMastery
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
