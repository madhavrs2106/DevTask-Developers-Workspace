import { Router } from "express";
import { getSetting, updateSetting } from "../controllers/setting.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Public: client fetches the configured snippet to inject at runtime.
router.get("/:key", getSetting);

// Authenticated users may update settings (single-tenant instance).
router.put("/:key", requireAuth, updateSetting);

export default router;
