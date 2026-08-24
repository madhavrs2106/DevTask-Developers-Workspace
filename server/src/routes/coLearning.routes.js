import { Router } from "express";
import {
  listMyRooms,
  getRoom,
  createRoom,
  joinRoom,
  leaveRoom,
  deleteRoom,
  addSyllabusItem,
  toggleSyllabusComplete,
  deleteSyllabusItem,
  addResource,
  deleteResource,
  addDiscussion,
  deleteDiscussion,
  startFocusSession,
  updateFocusStatus,
  removeMember,
  getRoomStats,
} from "../controllers/coLearning.controller.js";

const router = Router();

router.get("/", listMyRooms);
router.post("/", createRoom);
router.get("/:id", getRoom);
router.delete("/:id", deleteRoom);
router.post("/join/:inviteCode", joinRoom);
router.post("/:id/leave", leaveRoom);

router.get("/:id/stats", getRoomStats);

router.post("/:id/syllabus", addSyllabusItem);
router.post("/:id/syllabus/:itemId/toggle", toggleSyllabusComplete);
router.delete("/:id/syllabus/:itemId", deleteSyllabusItem);

router.post("/:id/resources", addResource);
router.delete("/:id/resources/:resourceId", deleteResource);

router.post("/:id/discussions", addDiscussion);
router.delete("/:id/discussions/:postId", deleteDiscussion);

router.post("/:id/focus", startFocusSession);
router.put("/:id/focus/:sessionId", updateFocusStatus);

router.delete("/:id/members/:memberId", removeMember);

export default router;
