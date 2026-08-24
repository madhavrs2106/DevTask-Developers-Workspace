import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../utils/httpError.js";
import { publicUserSelect } from "../utils/user.js";

/** POST /api/follows/:username — follow a user. */
export const followUser = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const followerId = req.user.id;

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!target) {
    return res.status(404).json({ message: "User not found." });
  }

  if (target.id === followerId) {
    return res.status(400).json({ message: "You cannot follow yourself." });
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: target.id } },
  });

  if (existing) {
    return res.status(409).json({ message: "Already following." });
  }

  await prisma.follow.create({
    data: { followerId, followingId: target.id },
  });

  res.json({ following: true });
});

/** DELETE /api/follows/:username — unfollow a user. */
export const unfollowUser = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const followerId = req.user.id;

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!target) {
    return res.status(404).json({ message: "User not found." });
  }

  await prisma.follow.deleteMany({
    where: { followerId, followingId: target.id },
  });

  res.json({ following: false });
});

/** GET /api/follows/:username/status — check if I follow this user. */
export const followStatus = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const followerId = req.user.id;

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!target) {
    return res.status(404).json({ message: "User not found." });
  }

  const exists = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: target.id } },
  });

  res.json({ following: Boolean(exists) });
});

/** GET /api/follows/:username/followers — list all followers of a user. */
export const getFollowers = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!target) {
    return res.status(404).json({ message: "User not found." });
  }

  const follows = await prisma.follow.findMany({
    where: { followingId: target.id },
    include: {
      follower: { select: publicUserSelect },
    },
    orderBy: { createdAt: "desc" },
  });

  const followerIds = follows.map((f) => f.follower.id);

  const myFollowing = await prisma.follow.findMany({
    where: { followerId: req.user.id, followingId: { in: followerIds } },
    select: { followingId: true },
  });
  const myFollowingSet = new Set(myFollowing.map((f) => f.followingId));

  const followers = follows.map((f) => ({
    ...f.follower,
    isFollowing: myFollowingSet.has(f.follower.id),
  }));

  res.json({ users: followers });
});

/** GET /api/follows/:username/following — list all users a user follows. */
export const getFollowing = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!target) {
    return res.status(404).json({ message: "User not found." });
  }

  const follows = await prisma.follow.findMany({
    where: { followerId: target.id },
    include: {
      following: { select: publicUserSelect },
    },
    orderBy: { createdAt: "desc" },
  });

  const followingIds = follows.map((f) => f.following.id);

  const myFollowing = await prisma.follow.findMany({
    where: { followerId: req.user.id, followingId: { in: followingIds } },
    select: { followingId: true },
  });
  const myFollowingSet = new Set(myFollowing.map((f) => f.followingId));

  const following = follows.map((f) => ({
    ...f.following,
    isFollowing: myFollowingSet.has(f.following.id),
  }));

  res.json({ users: following });
});
