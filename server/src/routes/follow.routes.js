import { Router } from "express";
import { followUser, unfollowUser, followStatus } from "../controllers/follow.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/:username/status", followStatus);
router.post("/:username", followUser);
router.delete("/:username", unfollowUser);

export default router;
