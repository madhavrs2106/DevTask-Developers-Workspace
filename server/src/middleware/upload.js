import multer from "multer";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsRoot = join(__dirname, "../../uploads");

const ALLOWED_MIME = {
  // Video
  "video/mp4": "mp4",
  "video/x-matroska": "mkv",
  "video/webm": "webm",
  // Image
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  // Documents
  "application/pdf": "pdf",
  "text/markdown": "md",
  "text/plain": "txt",
  // Code
  "text/javascript": "js",
  "text/typescript": "ts",
  "text/x-python": "py",
  "text/x-java-source": "java",
  "text/html": "html",
  "text/css": "css",
  "application/json": "json",
  "text/x-c": "c",
  "text/x-c++src": "cpp",
};

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

function getStorage() {
  return multer.diskStorage({
    destination: (req, _file, cb) => {
      const roomDir = join(uploadsRoot, req.params.id);
      if (!existsSync(roomDir)) mkdirSync(roomDir, { recursive: true });
      cb(null, roomDir);
    },
    filename: (_req, file, cb) => {
      const ext = ALLOWED_MIME[file.mimetype] || file.originalname.split(".").pop();
      const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      cb(null, `${unique}.${ext}`);
    },
  });
}

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
}

export const uploadNoteFile = multer({
  storage: getStorage(),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});
