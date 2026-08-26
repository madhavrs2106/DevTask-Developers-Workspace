import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { parse } from "../utils/validate.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";

const createQuizSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  questions: z.array(z.object({
    text: z.string().min(1),
    type: z.enum(["MCQ", "NUMERICAL"]),
    options: z.array(z.string()).optional(),
    answer: z.string(),
  })).min(1).max(20),
});

const submitQuizSchema = z.object({
  answers: z.record(z.string()),
});

const gradeQuizSchema = z.object({
  submissionId: z.string(),
  score: z.number().int().min(0),
  feedback: z.string().optional(),
});

/** POST /api/rooms/:id/quizzes/upload — upload quiz image */
export const uploadQuizImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ensureMember(id, req.user.id);

  if (!req.file) throw new HttpError(400, "No file uploaded.");

  const { readFileSync } = await import("node:fs");
  const imageData = readFileSync(req.file.path);
  const base64 = imageData.toString("base64");
  const mimeType = req.file.mimetype || "image/png";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  res.json({ url: dataUrl });
});

async function ensureMember(roomId, userId) {
  const member = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
  if (!member) throw new HttpError(403, "You are not a member of this room");
  return member;
}

async function ensureAdmin(roomId, userId) {
  const member = await ensureMember(roomId, userId);
  if (member.role !== "ADMIN") throw new HttpError(403, "Only admins can perform this action");
  return member;
}

// ─── List quizzes for a room ─────────────────────────────────────

export const listQuizzes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const member = await ensureMember(id, req.user.id);

  const isAdmin = member.role === "ADMIN";

  const quizzes = await prisma.roomQuiz.findMany({
    where: isAdmin ? { roomId: id } : { roomId: id, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, name: true, username: true, avatarColor: true } },
      _count: { select: { questions: true, submissions: true } },
      submissions: {
        where: { userId: req.user.id },
        select: { id: true, score: true, status: true },
        take: 1,
      },
    },
  });

  // Flatten mySubmission for convenience
  const result = quizzes.map((q) => ({
    ...q,
    mySubmission: q.submissions[0] ?? null,
    submissions: undefined,
  }));

  res.json(result);
});

// ─── Get a single quiz with questions ────────────────────────────

export const getQuiz = asyncHandler(async (req, res) => {
  const { id, quizId } = req.params;
  const member = await ensureMember(id, req.user.id);

  const quiz = await prisma.roomQuiz.findUnique({
    where: { id: quizId },
    include: {
      creator: { select: { id: true, name: true, username: true, avatarColor: true } },
      questions: { orderBy: { order: "asc" } },
      submissions: {
        include: {
          user: { select: { id: true, name: true, username: true, avatarColor: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!quiz || quiz.roomId !== id) throw new HttpError(404, "Quiz not found");

  // Non-admins can only view PUBLISHED quizzes
  if (member.role !== "ADMIN" && quiz.status !== "PUBLISHED") {
    throw new HttpError(404, "Quiz not found");
  }

  const isAdmin = member.role === "ADMIN";
  const hasSubmitted = quiz.submissions.some((s) => s.userId === req.user.id);

  // Flatten mySubmission for convenience (before stripping other users' data)
  quiz.mySubmission = quiz.submissions.find((s) => s.userId === req.user.id) ?? null;

  // For non-admins: strip answers only if they haven't submitted yet (during quiz taking)
  // If they already submitted, keep answers so they can see correct answers in Result view
  if (!isAdmin && !hasSubmitted) {
    quiz.questions = quiz.questions.map((q) => ({
      ...q,
      answer: undefined,
    }));
  }

  // For non-admins, strip score/feedback from other users' submissions
  if (!isAdmin) {
    quiz.submissions = quiz.submissions.map((s) => ({
      ...s,
      answers: s.userId === req.user.id ? s.answers : undefined,
      score: s.userId === req.user.id ? s.score : undefined,
      feedback: s.userId === req.user.id ? s.feedback : undefined,
    }));
  }

  res.json(quiz);
});

// ─── Create a quiz (admin only) ──────────────────────────────────

export const createQuiz = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ensureAdmin(id, req.user.id);
  const data = parse(createQuizSchema, req.body);

  const quiz = await prisma.roomQuiz.create({
    data: {
      title: data.title,
      description: data.description,
      status: "DRAFT",
      roomId: id,
      creatorId: req.user.id,
      questions: {
        create: data.questions.map((q, i) => ({
          text: q.text,
          type: q.type,
          options: q.type === "MCQ" ? JSON.stringify(q.options) : null,
          answer: q.answer,
          order: i + 1,
        })),
      },
    },
    include: {
      creator: { select: { id: true, name: true, username: true, avatarColor: true } },
      questions: { orderBy: { order: "asc" } },
      _count: { select: { questions: true, submissions: true } },
    },
  });

  res.status(201).json(quiz);
});

// ─── Update a draft quiz (admin only) ────────────────────────────

export const updateQuiz = asyncHandler(async (req, res) => {
  const { id, quizId } = req.params;
  await ensureAdmin(id, req.user.id);

  const quiz = await prisma.roomQuiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.roomId !== id) throw new HttpError(404, "Quiz not found");

  const data = parse(createQuizSchema, req.body);

  // Delete old questions and recreate
  await prisma.roomQuizQuestion.deleteMany({ where: { quizId } });

  const updated = await prisma.roomQuiz.update({
    where: { id: quizId },
    data: {
      title: data.title,
      description: data.description,
      questions: {
        create: data.questions.map((q, i) => ({
          text: q.text,
          type: q.type,
          options: q.type === "MCQ" ? JSON.stringify(q.options) : null,
          answer: q.answer,
          order: i + 1,
        })),
      },
    },
    include: {
      creator: { select: { id: true, name: true, username: true, avatarColor: true } },
      questions: { orderBy: { order: "asc" } },
      _count: { select: { questions: true, submissions: true } },
    },
  });

  res.json(updated);
});

// ─── Publish a quiz (admin only) ─────────────────────────────────

export const publishQuiz = asyncHandler(async (req, res) => {
  const { id, quizId } = req.params;
  await ensureAdmin(id, req.user.id);

  const quiz = await prisma.roomQuiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.roomId !== id) throw new HttpError(404, "Quiz not found");

  const questionCount = await prisma.roomQuizQuestion.count({ where: { quizId } });
  if (questionCount === 0) throw new HttpError(400, "Quiz must have at least one question");

  const updated = await prisma.roomQuiz.update({
    where: { id: quizId },
    data: { status: "PUBLISHED" },
    include: {
      creator: { select: { id: true, name: true, username: true, avatarColor: true } },
      _count: { select: { questions: true, submissions: true } },
    },
  });

  res.json(updated);
});

// ─── Unpublish a quiz (admin only, back to draft) ────────────────

export const unpublishQuiz = asyncHandler(async (req, res) => {
  const { id, quizId } = req.params;
  await ensureAdmin(id, req.user.id);

  const quiz = await prisma.roomQuiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.roomId !== id) throw new HttpError(404, "Quiz not found");

  const hasSubmissions = await prisma.roomQuizSubmission.count({ where: { quizId } });
  if (hasSubmissions > 0) throw new HttpError(400, "Cannot unpublish a quiz that has submissions");

  const updated = await prisma.roomQuiz.update({
    where: { id: quizId },
    data: { status: "DRAFT" },
    include: {
      creator: { select: { id: true, name: true, username: true, avatarColor: true } },
      _count: { select: { questions: true, submissions: true } },
    },
  });

  res.json(updated);
});

// ─── Delete a quiz (admin only) ──────────────────────────────────

export const deleteQuiz = asyncHandler(async (req, res) => {
  const { id, quizId } = req.params;
  await ensureAdmin(id, req.user.id);

  const quiz = await prisma.roomQuiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.roomId !== id) throw new HttpError(404, "Quiz not found");

  await prisma.roomQuiz.delete({ where: { id: quizId } });
  res.json({ deleted: true });
});

// ─── Submit answers ──────────────────────────────────────────────

export const submitQuiz = asyncHandler(async (req, res) => {
  const { id, quizId } = req.params;
  await ensureMember(id, req.user.id);
  const data = parse(submitQuizSchema, req.body);

  const quiz = await prisma.roomQuiz.findUnique({
    where: { id: quizId },
    include: { questions: true },
  });
  if (!quiz || quiz.roomId !== id) throw new HttpError(404, "Quiz not found");

  // Can only submit to published quizzes
  if (quiz.status !== "PUBLISHED") throw new HttpError(400, "Quiz is not published yet");

  // Check if already submitted
  const existing = await prisma.roomQuizSubmission.findUnique({
    where: { quizId_userId: { quizId, userId: req.user.id } },
  });
  if (existing) throw new HttpError(409, "You have already submitted this quiz");

  // Validate all questions are answered
  for (const q of quiz.questions) {
    if (!data.answers[q.id]) {
      throw new HttpError(400, `Missing answer for question ${q.order}`);
    }
  }

  // Auto-grade: compare answers against correct answers
  let score = 0;
  for (const q of quiz.questions) {
    const userAnswer = (data.answers[q.id] || "").trim();
    const correctAnswer = q.answer.trim();
    if (userAnswer === correctAnswer) {
      score++;
    }
  }

  const submission = await prisma.roomQuizSubmission.create({
    data: {
      quizId,
      userId: req.user.id,
      answers: JSON.stringify(data.answers),
      score,
      status: "GRADED",
    },
    include: {
      user: { select: { id: true, name: true, username: true, avatarColor: true, avatarUrl: true } },
    },
  });

  res.status(201).json(submission);
});

// ─── Grade a submission (admin only) ─────────────────────────────

export const gradeSubmission = asyncHandler(async (req, res) => {
  const { id, quizId } = req.params;
  await ensureAdmin(id, req.user.id);
  const data = parse(gradeQuizSchema, req.body);

  const quiz = await prisma.roomQuiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.roomId !== id) throw new HttpError(404, "Quiz not found");

  const submission = await prisma.roomQuizSubmission.findUnique({
    where: { id: data.submissionId },
  });
  if (!submission || submission.quizId !== quizId) throw new HttpError(404, "Submission not found");

  const updated = await prisma.roomQuizSubmission.update({
    where: { id: data.submissionId },
    data: {
      score: data.score,
      feedback: data.feedback,
      status: "GRADED",
    },
    include: {
      user: { select: { id: true, name: true, username: true, avatarColor: true, avatarUrl: true } },
    },
  });

  res.json(updated);
});

// ─── Delete submission (admin can delete any, member can delete own) ──

export const deleteSubmission = asyncHandler(async (req, res) => {
  const { id, quizId, submissionId } = req.params;
  const member = await ensureMember(id, req.user.id);

  const submission = await prisma.roomQuizSubmission.findUnique({
    where: { id: submissionId },
  });
  if (!submission || submission.quizId !== quizId) throw new HttpError(404, "Submission not found");

  if (submission.userId !== req.user.id && member.role !== "ADMIN") {
    throw new HttpError(403, "Cannot delete this submission");
  }

  await prisma.roomQuizSubmission.delete({ where: { id: submissionId } });
  res.json({ deleted: true });
});
