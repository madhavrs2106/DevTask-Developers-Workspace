import { prisma } from "../lib/prisma.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { z } from "zod";

// Public read — the client injects the configured embed at runtime.
export const getSetting = asyncHandler(async (req, res) => {
  const setting = await prisma.appSetting.findUnique({ where: { key: req.params.key } });
  res.json({ key: req.params.key, value: setting?.value || "" });
});

const updateSchema = z.object({
  value: z.string(),
});

// Any authenticated user may update app settings (single-tenant instance).
export const updateSetting = asyncHandler(async (req, res) => {
  const body = updateSchema.parse(req.body);
  const setting = await prisma.appSetting.upsert({
    where: { key: req.params.key },
    update: { value: body.value },
    create: { key: req.params.key, value: body.value },
  });
  res.json({ key: setting.key, value: setting.value });
});
