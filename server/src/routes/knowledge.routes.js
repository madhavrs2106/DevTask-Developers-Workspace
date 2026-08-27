import { Router } from "express";
import { listKnowledge, createKnowledge, deleteKnowledge } from "../controllers/knowledge.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", listKnowledge);
router.post("/", requireAuth, createKnowledge);
router.delete("/:id", requireAuth, deleteKnowledge);

export default router;
