import { Router } from "express";
import {
  createNote,
  uploadNote,
  getNotes,
  updateNote,
  deleteNote,
} from "../controllers/notes.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadNoteFile } from "../middleware/upload.js";

const router = Router();

router.use(requireAuth);

router.get("/:id/notes", getNotes);
router.post("/:id/notes", createNote);
router.post("/:id/notes/upload", uploadNoteFile.single("file"), uploadNote);
router.put("/:id/notes/:noteId", updateNote);
router.delete("/:id/notes/:noteId", deleteNote);

export default router;
