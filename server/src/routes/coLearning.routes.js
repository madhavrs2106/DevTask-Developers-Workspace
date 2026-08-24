import { Router } from "express";
import {
  listMyRooms,
  getRoom,
  createRoom,
  updateRoom,
  joinRoom,
  leaveRoom,
  deleteRoom,
  addSyllabusItem,
  toggleSyllabusComplete,
  deleteSyllabusItem,
  addDiscussion,
  deleteDiscussion,
  startFocusSession,
  updateFocusStatus,
  removeMember,
  getRoomStats,
} from "../controllers/coLearning.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", listMyRooms);
router.post("/", createRoom);
router.get("/:id", getRoom);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);
router.post("/join/:inviteCode", joinRoom);
router.post("/:id/leave", leaveRoom);

router.get("/:id/stats", getRoomStats);

router.post("/:id/syllabus", addSyllabusItem);
router.post("/:id/syllabus/:itemId/toggle", toggleSyllabusComplete);
router.delete("/:id/syllabus/:itemId", deleteSyllabusItem);

router.post("/:id/discussions", addDiscussion);
router.delete("/:id/discussions/:postId", deleteDiscussion);

router.post("/:id/focus", startFocusSession);
router.put("/:id/focus/:sessionId", updateFocusStatus);

router.delete("/:id/members/:memberId", removeMember);

export default router;
