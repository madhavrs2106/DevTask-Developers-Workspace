import { Router } from "express";
import { followUser, unfollowUser, followStatus, getFollowers, getFollowing } from "../controllers/follow.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/:username/status", followStatus);
router.get("/:username/followers", getFollowers);
router.get("/:username/following", getFollowing);
router.post("/:username", followUser);
router.delete("/:username", unfollowUser);

export default router;
