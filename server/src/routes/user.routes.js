import { Router } from "express";
import { updateMe, replaceSkills, updateAvatar, searchUsers, getUserProfile } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/search", requireAuth, searchUsers);
router.get("/:username", requireAuth, getUserProfile);

router.use(requireAuth);
router.put("/me", updateMe);
router.put("/me/avatar", updateAvatar);
router.put("/me/skills", replaceSkills);

export default router;
