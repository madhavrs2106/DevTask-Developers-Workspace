import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { parse } from "../utils/validate.js";
import { HttpError, asyncHandler } from "../utils/httpError.js";

function generateInviteCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  topic: z.string().min(1).max(100),
  description: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  password: z.string().min(4).max(100).optional(),
  maxMembers: z.number().int().min(2).max(50).optional(),
});

const updateRoomSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  topic: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).optional(),
  password: z.string().min(4).max(100).optional(),
  maxMembers: z.number().int().min(2).max(50).optional(),
});

const joinRoomSchema = z.object({
  password: z.string().optional(),
});

const addSyllabusSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  resourceUrl: z.string().url().optional(),
  order: z.number().int().optional(),
});

const addDiscussionSchema = z.object({
  content: z.string().min(1),
  itemId: z.string().optional(),
  parentId: z.string().optional(),
});

const startFocusSchema = z.object({
  task: z.string().min(1).max(200),
  duration: z.number().int().min(5).max(120).optional(),
});

const ROOM_SELECT = {
  id: true,
  name: true,
  topic: true,
  inviteCode: true,
  description: true,
  visibility: true,
  streakCount: true,
  lastStreakDate: true,
  maxMembers: true,
  createdAt: true,
  creator: { select: { id: true, name: true, username: true, avatarColor: true } },
  _count: { select: { members: true } },
};

const ROOM_INCLUDE_FULL = {
  creator: { select: { id: true, name: true, username: true, avatarColor: true } },
  members: {
    include: {
      user: { select: { id: true, name: true, username: true, avatarColor: true, avatarUrl: true } },
    },
  },
  syllabusItems: {
    orderBy: { order: "asc" },
    include: {
      completions: {
        include: { user: { select: { id: true, name: true, username: true } } },
      },
      _count: { select: { completions: true } },
    },
  },
  discussions: {
    where: { parentId: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, name: true, username: true, avatarColor: true, avatarUrl: true } },
      syllabusItem: { select: { id: true, title: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, username: true, avatarColor: true, avatarUrl: true } },
        },
      },
    },
  },
  focusSessions: {
    where: { status: { in: ["ACTIVE", "PAUSED"] } },
    include: {
      user: { select: { id: true, name: true, username: true, avatarColor: true, avatarUrl: true } },
    },
  },
  _count: { select: { members: true } },
};

async function ensureMember(roomId, userId) {
  const member = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
  if (!member) throw new HttpError(403, "You are not a member of this room");
  return member;
}

// ─── Room CRUD ──────────────────────────────────────────────────────

export const listMyRooms = asyncHandler(async (req, res) => {
  const memberships = await prisma.roomMember.findMany({
    where: { userId: req.user.id },
    include: {
      room: {
        select: ROOM_SELECT,
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  res.json(memberships.map((m) => ({
    ...m.room,
    role: m.role,
    memberCount: m.room._count.members,
  })));
});

export const getRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ensureMember(id, req.user.id);

  const room = await prisma.coLearningRoom.findUnique({
    where: { id },
    include: ROOM_INCLUDE_FULL,
  });
  if (!room) throw new HttpError(404, "Room not found");

  res.json({
    ...room,
    memberCount: room._count.members,
  });
});

export const createRoom = asyncHandler(async (req, res) => {
  const data = parse(createRoomSchema, req.body);

  const visibility = data.visibility ?? "PUBLIC";
  const passwordHash =
    visibility === "PRIVATE" && data.password
      ? await bcrypt.hash(data.password, 10)
      : null;

  const room = await prisma.coLearningRoom.create({
    data: {
      name: data.name,
      topic: data.topic,
      description: data.description,
      visibility,
      passwordHash,
      maxMembers: data.maxMembers,
      inviteCode: generateInviteCode(),
      creatorId: req.user.id,
      members: {
        create: { userId: req.user.id, role: "ADMIN" },
      },
    },
    select: ROOM_SELECT,
  });

  res.status(201).json(room);
});

export const joinRoom = asyncHandler(async (req, res) => {
  const { inviteCode } = req.params;
  const body = parse(joinRoomSchema, req.body || {});

  const room = await prisma.coLearningRoom.findUnique({
    where: { inviteCode },
    include: { _count: { select: { members: true } } },
  });
  if (!room) throw new HttpError(404, "Room not found");

  if (room._count.members >= room.maxMembers) {
    throw new HttpError(403,"Room is full");
  }

  // Password check for private rooms
  if (room.visibility === "PRIVATE" && room.passwordHash) {
    if (!body.password) throw new HttpError(403, "Password required for private room");
    const valid = await bcrypt.compare(body.password, room.passwordHash);
    if (!valid) throw new HttpError(403, "Incorrect password");
  }

  const existing = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId: req.user.id, roomId: room.id } },
  });
  if (existing) throw new HttpError(403,"Already a member");

  const membership = await prisma.roomMember.create({
    data: { userId: req.user.id, roomId: room.id },
  });

  res.json({ room, membership });
});

export const leaveRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const member = await ensureMember(id, req.user.id);

  if (member.role === "ADMIN") {
    const memberCount = await prisma.roomMember.count({ where: { roomId: id } });
    if (memberCount === 1) {
      await prisma.coLearningRoom.delete({ where: { id } });
      return res.json({ deleted: true });
    }
    throw new HttpError(403,"Admin cannot leave. Transfer ownership or delete the room.");
  }

  await prisma.roomMember.delete({
    where: { userId_roomId: { userId: req.user.id, roomId: id } },
  });

  res.json({ left: true });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const member = await ensureMember(id, req.user.id);
  if (member.role !== "ADMIN") throw new HttpError(403,"Only admins can delete rooms");

  await prisma.coLearningRoom.delete({ where: { id } });
  res.json({ deleted: true });
});

export const updateRoom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const member = await ensureMember(id, req.user.id);
  if (member.role !== "ADMIN") throw new HttpError(403, "Only admins can update rooms");

  const data = parse(updateRoomSchema, req.body);

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.topic !== undefined) updateData.topic = data.topic;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.maxMembers !== undefined) updateData.maxMembers = data.maxMembers;
  if (data.visibility !== undefined) {
    updateData.visibility = data.visibility;
    if (data.visibility === "PUBLIC") updateData.passwordHash = null;
  }
  if (data.password !== undefined) {
    updateData.passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;
  }

  const room = await prisma.coLearningRoom.update({
    where: { id },
    data: updateData,
    select: ROOM_SELECT,
  });

  res.json(room);
});

// ─── Syllabus ───────────────────────────────────────────────────────

export const addSyllabusItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const member = await ensureMember(id, req.user.id);
  if (member.role !== "ADMIN") throw new HttpError(403, "Only admins can add syllabus items");
  const data = parse(addSyllabusSchema, req.body);

  const maxOrder = await prisma.roomSyllabusItem.aggregate({
    where: { roomId: id },
    _max: { order: true },
  });

  const order = data.order ?? (maxOrder._max.order ?? 0) + 1;

  const item = await prisma.roomSyllabusItem.create({
    data: {
      ...data,
      roomId: id,
      order,
    },
  });

  // Auto-create a folder in Notes for this syllabus item
  await prisma.roomNote.create({
    data: {
      title: data.title,
      type: "FOLDER",
      roomId: id,
      authorId: req.user.id,
      order,
    },
  });

  res.status(201).json(item);
});

export const toggleSyllabusComplete = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;
  await ensureMember(id, req.user.id);

  const existing = await prisma.roomSyllabusCompletion.findUnique({
    where: { userId_itemId: { userId: req.user.id, itemId } },
  });

  if (existing) {
    await prisma.roomSyllabusCompletion.delete({ where: { id: existing.id } });
    return res.json({ completed: false });
  }

  await prisma.roomSyllabusCompletion.create({
    data: { userId: req.user.id, itemId },
  });

  res.json({ completed: true });
});

export const deleteSyllabusItem = asyncHandler(async (req, res) => {
  const { id, itemId } = req.params;
  const member = await ensureMember(id, req.user.id);
  if (member.role !== "ADMIN") throw new HttpError(403, "Only admins can delete syllabus items");

  // Get the syllabus item to find matching folder
  const item = await prisma.roomSyllabusItem.findUnique({ where: { id: itemId } });
  if (item) {
    // Delete the corresponding folder in Notes (and its children via cascade)
    const folder = await prisma.roomNote.findFirst({
      where: { roomId: id, title: item.title, type: "FOLDER", parentId: null },
    });
    if (folder) {
      await prisma.roomNote.delete({ where: { id: folder.id } });
    }
  }

  await prisma.roomSyllabusItem.delete({ where: { id: itemId } });
  res.json({ deleted: true });
});

// ─── Discussions ────────────────────────────────────────────────────

export const addDiscussion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ensureMember(id, req.user.id);
  const data = parse(addDiscussionSchema, req.body);

  const post = await prisma.roomDiscussion.create({
    data: {
      content: data.content,
      roomId: id,
      authorId: req.user.id,
      itemId: data.itemId || null,
      parentId: data.parentId || null,
    },
    include: {
      author: { select: { id: true, name: true, username: true, avatarColor: true } },
      syllabusItem: { select: { id: true, title: true } },
    },
  });

  res.status(201).json(post);
});

export const deleteDiscussion = asyncHandler(async (req, res) => {
  const { id, postId } = req.params;
  const member = await ensureMember(id, req.user.id);

  const post = await prisma.roomDiscussion.findUnique({ where: { id: postId } });
  if (!post) throw new HttpError(404,"Post not found");
  if (post.authorId !== req.user.id && member.role !== "ADMIN") {
    throw new HttpError(403,"Cannot delete this post");
  }

  await prisma.roomDiscussion.delete({ where: { id: postId } });
  res.json({ deleted: true });
});

// ─── Focus Sessions ─────────────────────────────────────────────────

export const startFocusSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ensureMember(id, req.user.id);
  const data = parse(startFocusSchema, req.body);

  const existingActive = await prisma.focusSession.findFirst({
    where: {
      roomId: id,
      userId: req.user.id,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
  });
  if (existingActive) throw new HttpError(403,"You already have an active focus session");

  const session = await prisma.focusSession.create({
    data: {
      task: data.task,
      duration: data.duration ?? 25,
      roomId: id,
      userId: req.user.id,
      endsAt: new Date(Date.now() + (data.duration ?? 25) * 60 * 1000),
    },
    include: {
      user: { select: { id: true, name: true, username: true, avatarColor: true } },
    },
  });

  res.status(201).json(session);
});

export const updateFocusStatus = asyncHandler(async (req, res) => {
  const { id, sessionId } = req.params;
  const { status } = req.body;

  const session = await prisma.focusSession.findUnique({ where: { id: sessionId } });
  if (!session || session.roomId !== id) throw new HttpError(404,"Session not found");
  if (session.userId !== req.user.id) throw new HttpError(403,"Not your session");

  const updated = await prisma.focusSession.update({
    where: { id: sessionId },
    data: { status },
    include: {
      user: { select: { id: true, name: true, username: true, avatarColor: true } },
    },
  });

  res.json(updated);
});

// ─── Members ────────────────────────────────────────────────────────

export const removeMember = asyncHandler(async (req, res) => {
  const { id, memberId } = req.params;
  const admin = await ensureMember(id, req.user.id);
  if (admin.role !== "ADMIN") throw new HttpError(403,"Only admins can remove members");

  await prisma.roomMember.delete({ where: { userId_roomId: { userId: memberId, roomId: id } } });
  res.json({ removed: true });
});

export const getRoomStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ensureMember(id, req.user.id);

  const [memberCount, syllabusCount, resourceCount, completedByUser] = await Promise.all([
    prisma.roomMember.count({ where: { roomId: id } }),
    prisma.roomSyllabusItem.count({ where: { roomId: id } }),
    prisma.roomResource.count({ where: { roomId: id } }),
    prisma.roomSyllabusCompletion.findMany({
      where: { item: { roomId: id } },
      select: { userId: true, itemId: true },
    }),
  ]);

  const completionsByUser = {};
  completedByUser.forEach((c) => {
    completionsByUser[c.userId] = (completionsByUser[c.userId] || 0) + 1;
  });

  res.json({
    memberCount,
    syllabusCount,
    resourceCount,
    completionsByUser,
  });
});
