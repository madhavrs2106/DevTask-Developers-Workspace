import { Router } from "express";
import { updateMe, replaceSkills } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.put("/me", updateMe);
router.put("/me/skills", replaceSkills);

export default router;
