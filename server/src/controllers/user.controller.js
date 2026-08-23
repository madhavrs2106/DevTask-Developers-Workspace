import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toPublicUser } from "../utils/user.js";
import { asyncHandler } from "../utils/httpError.js";
import { parse } from "../utils/validate.js";

const hexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Must be a hex color like #06B6D4");

const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
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
