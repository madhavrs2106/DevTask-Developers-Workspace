import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { parse } from "../utils/validate.js";
import { asyncHandler, HttpError } from "../utils/httpError.js";
import { unlink, readFile } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsRoot = join(__dirname, "../../uploads");

const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["FOLDER", "FILE"]).optional(),
  fileType: z.enum(["TEXT", "CODE", "IMAGE", "VIDEO", "DOC"]).optional(),
  content: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().int().optional(),
});

const updateNoteSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  parentId: z.string().nullable().optional(),
  order: z.number().int().optional(),
});

async function ensureMember(roomId, userId) {
  const member = await prisma.roomMember.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
  if (!member) throw new HttpError(403, "You are not a member of this room.");
  return member;
}

const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".py", ".ipynb", ".rb", ".go", ".rs",
  ".java", ".c", ".cpp", ".cs", ".h", ".hpp", ".sh", ".bash", ".zsh",
  ".php", ".dart", ".swift", ".kt", ".scala", ".r", ".lua", ".pl",
  ".sql", ".html", ".htm", ".css", ".scss", ".less", ".json", ".yaml",
  ".yml", ".toml", ".xml", ".md", ".txt", ".csv", ".graphql", ".vue",
  ".svelte", ".astro",
]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico", ".tiff"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".mkv", ".webm", ".avi", ".mov", ".wmv", ".mpeg"]);
const DOC_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".rtf"]);

function fileTypeFromName(filename) {
  const ext = extname(filename).toLowerCase();
  if (CODE_EXTENSIONS.has(ext)) return "CODE";
  if (IMAGE_EXTENSIONS.has(ext)) return "IMAGE";
  if (VIDEO_EXTENSIONS.has(ext)) return "VIDEO";
  if (DOC_EXTENSIONS.has(ext)) return "DOC";
  return "TEXT";
}

function isTextFileType(fileType) {
  return fileType === "CODE" || fileType === "TEXT";
}

function fileTypeFromMime(mimetype) {
  if (mimetype.startsWith("video/")) return "VIDEO";
  if (mimetype.startsWith("image/")) return "IMAGE";
  if (mimetype === "application/pdf") return "DOC";
  return "CODE";
}

/** POST /api/rooms/:id/notes — create folder or text/code note */
export const createNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ensureMember(id, req.user.id);
  const data = parse(createNoteSchema, req.body);

  const fileType = data.fileType || (data.type === "FOLDER" ? undefined : fileTypeFromName(data.title));

  const note = await prisma.roomNote.create({
    data: {
      title: data.title,
      type: data.type ?? "FILE",
      fileType,
      content: data.content ?? null,
      parentId: data.parentId ?? null,
      order: data.order ?? 0,
      roomId: id,
      authorId: req.user.id,
    },
    include: {
      author: { select: { id: true, name: true, username: true, avatarColor: true } },
      children: true,
    },
  });

  res.status(201).json(note);
});

/** POST /api/rooms/:id/notes/upload — upload file */
export const uploadNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ensureMember(id, req.user.id);

  if (!req.file) throw new HttpError(400, "No file uploaded.");

  const title = req.body.title || req.file.originalname;
  const parentId = req.body.parentId || null;
  const order = parseInt(req.body.order || "0", 10);
  const fileType = fileTypeFromName(req.file.originalname);
  const filePath = join(uploadsRoot, id, req.file.filename);

  let content;
  let fileUrl = null;

  if (isTextFileType(fileType)) {
    try {
      content = await readFile(filePath, "utf-8");
    } catch {
      content = null;
    }
  } else {
    fileUrl = `/uploads/rooms/${id}/${req.file.filename}`;
    content = fileUrl;
  }

  const note = await prisma.roomNote.create({
    data: {
      title,
      type: "FILE",
      fileType,
      content,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      parentId,
      order,
      roomId: id,
      authorId: req.user.id,
    },
    include: {
      author: { select: { id: true, name: true, username: true, avatarColor: true } },
    },
  });

  res.status(201).json(note);
});

/** GET /api/rooms/:id/notes — get full tree */
export const getNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await ensureMember(id, req.user.id);

  const notes = await prisma.roomNote.findMany({
    where: { roomId: id },
    include: {
      author: { select: { id: true, name: true, username: true, avatarColor: true } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  res.json({ notes });
});

/** PUT /api/rooms/:id/notes/:noteId — update note */
export const updateNote = asyncHandler(async (req, res) => {
  const { id, noteId } = req.params;
  await ensureMember(id, req.user.id);
  const data = parse(updateNoteSchema, req.body);

  const note = await prisma.roomNote.findUnique({ where: { id: noteId } });
  if (!note || note.roomId !== id) throw new HttpError(404, "Note not found.");

  const updated = await prisma.roomNote.update({
    where: { id: noteId },
    data,
    include: {
      author: { select: { id: true, name: true, username: true, avatarColor: true } },
    },
  });

  res.json(updated);
});

/** DELETE /api/rooms/:id/notes/:noteId — delete note + file */
export const deleteNote = asyncHandler(async (req, res) => {
  const { id, noteId } = req.params;
  await ensureMember(id, req.user.id);

  const note = await prisma.roomNote.findUnique({
    where: { id: noteId },
    include: { children: true },
  });
  if (!note || note.roomId !== id) throw new HttpError(404, "Note not found.");

  // Delete file from disk only if content is a URL (binary files)
  if (note.type === "FILE" && note.content && note.content.startsWith("/uploads/")) {
    try {
      const filePath = join(uploadsRoot, note.content.replace("/uploads/", ""));
      await unlink(filePath);
    } catch {
      // file may already be gone
    }
  }

  // Delete children recursively
  for (const child of note.children) {
    await prisma.roomNote.delete({ where: { id: child.id } });
  }

  await prisma.roomNote.delete({ where: { id: noteId } });
  res.json({ deleted: true });
});
