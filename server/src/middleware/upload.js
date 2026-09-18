const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const ROOT_UPLOADS = isServerless
  ? path.join(os.tmpdir(), 'updaterw-uploads')
  : path.join(__dirname, '../../uploads');

const TMP_DIR = path.join(ROOT_UPLOADS, 'tmp');
const IMAGE_DIR = path.join(ROOT_UPLOADS, 'images');
const VIDEO_DIR = path.join(ROOT_UPLOADS, 'videos');
const PROFILE_DIR = path.join(ROOT_UPLOADS, 'profiles');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov']);

function makeStorage() {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      try {
        ensureDir(TMP_DIR);
        cb(null, TMP_DIR);
      } catch (error) {
        cb(error);
      }
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  });
}

function fileFilter(kind) {
  return (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (kind === 'image') {
      if (!IMAGE_MIMES.has(file.mimetype) || !IMAGE_EXTS.has(ext)) {
        return cb(new ApiError(400, 'Only JPG, PNG, and WEBP images are allowed'));
      }
    } else if (kind === 'video') {
      if (!VIDEO_MIMES.has(file.mimetype) || !VIDEO_EXTS.has(ext)) {
        return cb(new ApiError(400, 'Only MP4, WEBM, and MOV videos are allowed'));
      }
    } else if (kind === 'mixed') {
      const isImage = IMAGE_MIMES.has(file.mimetype) && IMAGE_EXTS.has(ext);
      const isVideo = VIDEO_MIMES.has(file.mimetype) && VIDEO_EXTS.has(ext);
      if (!isImage && !isVideo) {
        return cb(new ApiError(400, 'Unsupported file type'));
      }
    }
    cb(null, true);
  };
}

const imageUpload = multer({
  storage: makeStorage(),
  fileFilter: fileFilter('image'),
  limits: { fileSize: env.uploads.maxImageMb * 1024 * 1024, files: 8 },
});

const videoUpload = multer({
  storage: makeStorage(),
  fileFilter: fileFilter('video'),
  limits: { fileSize: env.uploads.maxVideoMb * 1024 * 1024, files: 1 },
});

const profileUpload = multer({
  storage: makeStorage(),
  fileFilter: fileFilter('image'),
  limits: { fileSize: env.uploads.maxProfileMb * 1024 * 1024, files: 1 },
});

const mixedUpload = multer({
  storage: makeStorage(),
  fileFilter: fileFilter('mixed'),
  limits: { fileSize: env.uploads.maxVideoMb * 1024 * 1024, files: 9 },
});

module.exports = {
  imageUpload,
  videoUpload,
  profileUpload,
  mixedUpload,
  IMAGE_DIR,
  VIDEO_DIR,
  PROFILE_DIR,
  TMP_DIR,
  IMAGE_MIMES,
  VIDEO_MIMES,
  ensureDir,
};
