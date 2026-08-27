import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["FAQ", "DOCUMENT"]).default("FAQ"),
  question: z.string().optional(),
  answer: z.string().min(1),
  title: z.string().optional(),
});

export const listKnowledge = asyncHandler(async (_req, res) => {
  const items = await prisma.knowledgeItem.findMany({ orderBy: { createdAt: "desc" } });
  res.json(items);
});

export const createKnowledge = asyncHandler(async (req, res) => {
  const body = createSchema.parse(req.body);
  if (body.type === "FAQ" && !body.question) throw new HttpError(400, "FAQs require a question");
  const item = await prisma.knowledgeItem.create({ data: body });
  res.json(item);
});

export const deleteKnowledge = asyncHandler(async (req, res) => {
  await prisma.knowledgeItem.delete({ where: { id: req.params.id } }).catch(() => {
    throw new HttpError(404, "Knowledge item not found");
  });
  res.json({ success: true });
});
