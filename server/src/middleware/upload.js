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
  "video/avi": "avi",
  "video/quicktime": "mov",
  "video/x-ms-wmv": "wmv",
  "video/mpeg": "mpeg",
  // Image
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/x-icon": "ico",
  // Documents
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/markdown": "md",
  "text/plain": "txt",
  "text/csv": "csv",
  "text/rtf": "rtf",
  "application/rtf": "rtf",
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
  "text/x-csharp": "cs",
  "text/x-go": "go",
  "text/x-rust": "rs",
  "text/x-shellscript": "sh",
  "text/x-ruby": "rb",
  "text/x-php": "php",
  "text/x-sql": "sql",
  "text/x-yaml": "yaml",
  "text/xml": "xml",
  "application/xml": "xml",
  "application/x-yaml": "yaml",
  "application/toml": "toml",
  "application/x-httpd-php": "php",
  "text/x-dart": "dart",
  "text/x-swift": "swift",
  "text/x-kotlin": "kt",
  "text/x-scala": "scala",
  "text/x-r": "r",
  "text/x-lua": "lua",
  "text/x-perl": "pl",
  // Archives
  "application/zip": "zip",
  "application/x-tar": "tar",
  "application/gzip": "gz",
  "application/x-7z-compressed": "7z",
  "application/x-rar-compressed": "rar",
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
