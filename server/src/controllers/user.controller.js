import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { publicUserSelect, toPublicUser } from "../utils/user.js";
import { asyncHandler } from "../utils/httpError.js";
import { parse } from "../utils/validate.js";

const hexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Must be a hex color like #06B6D4");

const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores")
      .optional(),
    bio: z.string().trim().max(280).nullable().optional(),
    role: z.enum(["DEVELOPER", "LEARNER"]).optional(),
    avatarColor: hexColor.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" });

const skillsSchema = z.object({
  skills: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Skill name is required").max(30),
        level: z.number().int().min(0).max(100),
      })
    )
    .min(1, "Provide at least one skill")
    .max(24, "Too many skills"),
});

/** ~300 KB binary → ~400 KB base64. Client resizes before upload. */
const MAX_AVATAR_CHARS = 400_000;

const avatarSchema = z.object({
  avatarUrl: z.union([
    z.literal(null),
    z
      .string()
      .max(MAX_AVATAR_CHARS, "Image is too large — keep it under ~300 KB")
      .regex(
        /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/,
        "Avatar must be a PNG, JPEG or WebP image"
      ),
  ]),
});

/** PUT /api/users/me */
export const updateMe = asyncHandler(async (req, res) => {
  const data = parse(updateMeSchema, req.body);

  if (data.username) {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({ message: "This username is already taken." });
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
  });

  res.json({ user: toPublicUser(user) });
});

/** PUT /api/users/me/avatar — set (or clear with null) the profile picture. */
export const updateAvatar = asyncHandler(async (req, res) => {
  const { avatarUrl } = parse(avatarSchema, req.body);

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl },
  });

  res.json({ user: toPublicUser(user) });
});

/** PUT /api/users/me/skills — replaces the full skill-mastery list. */
export const replaceSkills = asyncHandler(async (req, res) => {
  const { skills } = parse(skillsSchema, req.body);

  const deduped = new Map(skills.map((s) => [s.name.toLowerCase(), s]));

  await prisma.$transaction([
    prisma.skillProgress.deleteMany({ where: { userId: req.user.id } }),
    prisma.skillProgress.createMany({
      data: [...deduped.values()].map((s) => ({
        userId: req.user.id,
        name: s.name,
        level: s.level,
      })),
    }),
  ]);

  const updated = await prisma.skillProgress.findMany({
    where: { userId: req.user.id },
    orderBy: [{ level: "desc" }, { name: "asc" }],
  });

  res.json({ skills: updated });
});

/** DELETE /api/users/me — delete the current user's account and all related data. */
export const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.$transaction([
    prisma.follow.deleteMany({ where: { followerId: userId } }),
    prisma.follow.deleteMany({ where: { followingId: userId } }),
    prisma.task.deleteMany({ where: { userId } }),
    prisma.project.deleteMany({ where: { userId } }),
    prisma.course.deleteMany({ where: { userId } }),
    prisma.skillProgress.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  res.json({ message: "Account deleted." });
});

/** GET /api/users/search?q= — search users by username or name. */
export const searchUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q ?? "").toString().trim();

  if (q.length < 2) {
    return res.json({ users: [] });
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: publicUserSelect,
    take: 20,
  });

  res.json({ users });
});

/** GET /api/users/:username — public profile with skills, courses, tasks, follows. */
export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      ...publicUserSelect,
      skills: { orderBy: [{ level: "desc" }, { name: "asc" }] },
      _count: { select: { tasks: true } },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const [tasksDone, totalTasks, courses, tasks, followersCount, followingCount, isFollowing, coLearningRooms] =
    await Promise.all([
      prisma.task.count({ where: { userId: user.id, status: "DONE" } }),
      prisma.task.count({ where: { userId: user.id } }),
      prisma.course.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
      prisma.task.findMany({
        where: { userId: user.id },
        select: {
          id: true, title: true, status: true, difficulty: true,
          tags: true, dueDate: true, actualHours: true, completedAt: true,
        },
      }),
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      req.user.id !== user.id
        ? prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: req.user.id, followingId: user.id } },
          }).then(Boolean)
        : false,
      prisma.coLearningRoom.findMany({
        where: { creatorId: user.id },
        select: {
          id: true, name: true, topic: true, visibility: true,
          inviteCode: true, streakCount: true, maxMembers: true, createdAt: true,
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const coLearningRoomsWithMembership = await Promise.all(
      coLearningRooms.map(async (room) => {
        const member = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
        });
        return { ...room, isMember: !!member };
      })
    );

  const hoursAgg = await prisma.task.aggregate({
    where: { userId: user.id },
    _sum: { actualHours: true },
  });
  const totalCodingHours = Math.round((hoursAgg._sum.actualHours ?? 0) * 10) / 10;

  res.json({
    user: {
      ...user,
      tasksDone,
      totalTasks,
      totalCodingHours,
      courses,
      tasks,
      followersCount,
      followingCount,
      isFollowing,
      coLearningRooms: coLearningRoomsWithMembership,
    },
  });
});
