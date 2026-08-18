const prisma = require('../db');

const SYSTEM_PROMPT = `You are the DevTask AI Copilot, an analytical assistant for a developer productivity workspace. You receive live telemetry about a developer's tasks (kanban board) and study courses (roadmaps). Give concise, actionable advice about sprint performance, task prioritization, study sequence, and tech-stack mastery. Use the telemetry JSON provided. Be direct and specific, reference real task/course titles when relevant. Keep responses under 220 words.`;

function buildTelemetry(tasks, courses) {
  const byStatus = (s) => tasks.filter(t => t.status === s);
  const activeTasks = tasks.filter(t => t.status !== 'DONE');
  const completedTasks = byStatus('DONE');
  const techStackSet = new Set();
  tasks.forEach(t => {
    if (t.techStack) {
      t.techStack.split(',').map(s => s.trim()).filter(Boolean).forEach(tech => techStackSet.add(tech));
    }
  });
  const difficultyCount = {
    BEGINNER: byStatus('TODO').concat(byStatus('IN_PROGRESS'), byStatus('IN_REVIEW')).filter(t => t.difficulty === 'BEGINNER').length,
    INTERMEDIATE: activeTasks.filter(t => t.difficulty === 'INTERMEDIATE').length,
    ADVANCED: activeTasks.filter(t => t.difficulty === 'ADVANCED').length
  };
  const completedCourses = courses.filter(c => c.status === 'COMPLETED');
  const activeCourses = courses.filter(c => c.status === 'IN_PROGRESS');

  return {
    totals: { tasks: tasks.length, active: activeTasks.length, completed: completedTasks.length },
    velocityPercent: tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    activeTaskTitles: activeTasks.slice(0, 5).map(t => t.title),
    difficultyBreakdown: difficultyCount,
    techStack: Array.from(techStackSet),
    courses: {
      total: courses.length,
      completed: completedCourses.length,
      active: activeCourses.length,
      activeTitles: activeCourses.map(c => c.title)
    }
  };
}

function localFallback(userMsg, telemetry) {
  const lowerMsg = userMsg.toLowerCase();
  const { totals, velocityPercent, activeTaskTitles, difficultyBreakdown, techStack, courses } = telemetry;

  if (lowerMsg.includes('sprint') || lowerMsg.includes('velocity') || lowerMsg.includes('performance')) {
    const advanced = difficultyBreakdown.ADVANCED;
    return `Based on your profile, you have resolved ${totals.completed} tasks and have ${totals.active} active in the backlog. Your task resolution efficiency is at ${velocityPercent}%.

Recommendation: ${advanced > 0 ? `Prioritize the ${advanced} ADVANCED difficulty item(s) in your backlog to prevent roadmap fragmentation.` : 'Your difficulty distribution is balanced. Focus on shipping IN_PROGRESS items to raise velocity.'}`;
  }

  if (lowerMsg.includes('learn') || lowerMsg.includes('course') || lowerMsg.includes('roadmap')) {
    return `AI learning path mapping is active. You have completed ${courses.completed} tracks and currently have ${courses.active} active syllabus tracks.

Suggested Next Step: ${courses.activeTitles[0] ? `Complete "${courses.activeTitles[0]}" before initiating new roadmap blocks.` : 'Register new study tracks to activate roadmap optimization advice.'} Focus on consolidating hands-on projects.`;
  }

  if (lowerMsg.includes('tech') || lowerMsg.includes('stack') || lowerMsg.includes('code')) {
    return `Detected technologies in development stream: ${techStack.join(', ') || 'No tech stack defined yet'}.

Security & Quality advice: Configure automated CI/CD static code analysis pipelines on repository hooks to ensure syntax validation.`;
  }

  return `Acknowledged. I have parsed your active configuration comprising ${totals.tasks} tasks and ${courses.total} educational courses.

To improve, focus on completing: "${activeTaskTitles[0] || 'No active tasks'}" and logging the coding hours.`;
}

exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const tasks = await prisma.task.findMany({ where: { userId: req.user.id } });
    const courses = await prisma.course.findMany({ where: { userId: req.user.id } });
    const telemetry = buildTelemetry(tasks, courses);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      return res.json({ reply: localFallback(lastUserMsg ? lastUserMsg.text : '', telemetry) });
    }

    const payload = [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\nTelemetry:\n${JSON.stringify(telemetry)}` },
      ...messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }))
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: payload,
        temperature: 0.7,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('AI provider error:', detail);
      return res.status(502).json({ error: 'AI provider request failed' });
    }

    const data = await response.json();
    res.json({ reply: (data.choices?.[0]?.message?.content || '').trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
