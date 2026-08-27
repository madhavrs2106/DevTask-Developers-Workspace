import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { parse } from "../utils/validate.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";
import { judgeSubmission } from "../lib/codeRunner.js";

async function getMembership(roomId, userId) {
  const member = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
  if (!member) throw new HttpError(403, "You are not a member of this room");
  return member;
}

// Strip expected/actual from hidden test cases before sending to clients
function publicTestCase(tc, isAdmin) {
  if (tc.hidden && !isAdmin) {
    return { hidden: true, input: null, expected: null };
  }
  return { hidden: !!tc.hidden, input: tc.input, expected: tc.expected };
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("EASY"),
  languages: z.array(z.enum(["javascript", "python", "c", "cpp", "java", "go", "ruby"])).min(1),
  starterCode: z.record(z.string()).optional().default({}),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expected: z.string(),
        hidden: z.boolean().optional().default(false),
      })
    )
    .min(1),
});

export const createProblem = asyncHandler(async (req, res) => {
  const member = await getMembership(req.params.id, req.user.id);
  if (member.role !== "ADMIN") throw new HttpError(403, "Only room admins can create problems");

  const body = parse(createSchema, req.body);

  const problem = await prisma.roomProblem.create({
    data: {
      roomId: req.params.id,
      createdById: req.user.id,
      title: body.title,
      description: body.description,
      difficulty: body.difficulty,
      languages: JSON.stringify(body.languages),
      starterCode: JSON.stringify(body.starterCode),
      testCases: JSON.stringify(body.testCases),
    },
  });

  res.status(201).json(problem);
});

export const listProblems = asyncHandler(async (req, res) => {
  await getMembership(req.params.id, req.user.id);

  const problems = await prisma.roomProblem.findMany({
    where: { roomId: req.params.id },
    orderBy: { createdAt: "desc" },
    include: {
      creator: { select: { id: true, name: true, username: true } },
      _count: { select: { submissions: true } },
    },
  });

  // Determine which problems the current user has solved
  const solved = await prisma.roomProblemSubmission.findMany({
    where: { userId: req.user.id, status: "ACCEPTED" },
    select: { problemId: true },
  });
  const solvedSet = new Set(solved.map((s) => s.problemId));

  const data = problems.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty,
    languages: JSON.parse(p.languages),
    starterCode: JSON.parse(p.starterCode),
    testCases: JSON.parse(p.testCases).map((tc) => publicTestCase(tc, false)),
    createdById: p.createdById,
    creator: p.creator,
    submissionsCount: p._count.submissions,
    solved: solvedSet.has(p.id),
  }));

  res.json(data);
});

export const getProblem = asyncHandler(async (req, res) => {
  const member = await getMembership(req.params.id, req.user.id);
  const isAdmin = member.role === "ADMIN";

  const problem = await prisma.roomProblem.findUnique({
    where: { id: req.params.problemId },
    include: { creator: { select: { id: true, name: true, username: true } } },
  });
  if (!problem || problem.roomId !== req.params.id) {
    throw new HttpError(404, "Problem not found");
  }

  const testCases = JSON.parse(problem.testCases);
  res.json({
    id: problem.id,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    languages: JSON.parse(problem.languages),
    starterCode: JSON.parse(problem.starterCode),
    testCases: testCases.map((tc) => publicTestCase(tc, isAdmin)),
    createdById: problem.createdById,
    creator: problem.creator,
    solved: await prisma.roomProblemSubmission
      .findFirst({ where: { problemId: problem.id, userId: req.user.id, status: "ACCEPTED" } })
      .then((s) => !!s),
  });
});

export const deleteProblem = asyncHandler(async (req, res) => {
  const member = await getMembership(req.params.id, req.user.id);
  if (member.role !== "ADMIN") throw new HttpError(403, "Only room admins can delete problems");

  const problem = await prisma.roomProblem.findUnique({ where: { id: req.params.problemId } });
  if (!problem || problem.roomId !== req.params.id) throw new HttpError(404, "Problem not found");

  await prisma.roomProblem.delete({ where: { id: problem.id } });
  res.json({ success: true });
});

const submitSchema = z.object({
  code: z.string().min(1),
  language: z.enum(["javascript", "python", "c", "cpp", "java", "go", "ruby"]),
  runMode: z.enum(["run", "submit"]).optional().default("submit"),
});

export const submitSolution = asyncHandler(async (req, res) => {
  const member = await getMembership(req.params.id, req.user.id);

  const problem = await prisma.roomProblem.findUnique({ where: { id: req.params.problemId } });
  if (!problem || problem.roomId !== req.params.id) throw new HttpError(404, "Problem not found");

  const body = parse(submitSchema, req.body);

  const allowedLangs = JSON.parse(problem.languages);
  if (!allowedLangs.includes(body.language)) {
    throw new HttpError(400, `This problem does not accept ${body.language}`);
  }

  const testCases = JSON.parse(problem.testCases);
  const runSamplesOnly = body.runMode === "run";
  const judgedCases = runSamplesOnly ? testCases.filter((t) => !t.hidden) : testCases;
  const result = await judgeSubmission({
    code: body.code,
    language: body.language,
    testCases: judgedCases,
  });

  const mapResults = (rs) =>
    rs.map((r) =>
      r.hidden
        ? { hidden: true, passed: r.passed, error: r.error || null }
        : { hidden: false, input: r.input, expected: r.expected, actual: r.actual, passed: r.passed, error: r.error || null }
    );

  // "Run" only executes the visible sample cases and does NOT persist a submission.
  if (runSamplesOnly) {
    res.json({
      run: true,
      passed: result.passed,
      total: result.total,
      status: result.status,
      results: mapResults(result.results),
    });
    return;
  }

  const submission = await prisma.roomProblemSubmission.create({
    data: {
      problemId: problem.id,
      userId: req.user.id,
      code: body.code,
      language: body.language,
      passed: result.passed,
      total: result.total,
      status: result.status,
      results: JSON.stringify(result.results),
    },
  });

  const isAdmin = member.role === "ADMIN";
  res.json({
    id: submission.id,
    passed: result.passed,
    total: result.total,
    status: result.status,
    results: mapResults(result.results),
    createdAt: submission.createdAt,
  });
});

export const listSubmissions = asyncHandler(async (req, res) => {
  const member = await getMembership(req.params.id, req.user.id);
  const isAdmin = member.role === "ADMIN";

  const problem = await prisma.roomProblem.findUnique({ where: { id: req.params.problemId } });
  if (!problem || problem.roomId !== req.params.id) throw new HttpError(404, "Problem not found");

  const where = isAdmin
    ? { problemId: problem.id }
    : { problemId: problem.id, userId: req.user.id };

  const submissions = await prisma.roomProblemSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: isAdmin ? { user: { select: { id: true, name: true, username: true } } } : false,
    take: 200,
  });

  res.json(
    submissions.map((s) => ({
      id: s.id,
      userId: s.userId,
      user: s.user || undefined,
      language: s.language,
      passed: s.passed,
      total: s.total,
      status: s.status,
      createdAt: s.createdAt,
    }))
  );
});
