const fs = require('fs/promises');
const path = require('path');
const env = require('../config/env');
const cloudinary = require('../config/cloudinary');
const { IMAGE_DIR, VIDEO_DIR, PROFILE_DIR, IMAGE_MIMES } = require('../middleware/upload');
const ApiError = require('../utils/ApiError');

function publicUrl(folder, filename) {
  return `/uploads/${folder}/${filename}`;
}

async function persistLocal(file, folder, destDir) {
  const dest = path.join(destDir, path.basename(file.filename));
  await fs.rename(file.path, dest);
  return {
    url: publicUrl(folder, path.basename(file.filename)),
    publicId: null,
    type: IMAGE_MIMES.has(file.mimetype) ? 'IMAGE' : 'VIDEO',
    mimeType: file.mimetype,
    size: file.size,
  };
}

async function persistCloudinary(file, folder) {
  const resourceType = IMAGE_MIMES.has(file.mimetype) ? 'image' : 'video';
  const result = await cloudinary.uploader.upload(file.path, {
    folder: `${env.cloudinary.folder}/${folder}`,
    resource_type: resourceType,
  });
  await fs.unlink(file.path).catch(() => {});
  return {
    url: result.secure_url,
    publicId: result.public_id,
    type: resourceType === 'image' ? 'IMAGE' : 'VIDEO',
    mimeType: file.mimetype,
    size: file.size,
  };
}

async function saveUpload(file, kind) {
  if (!file) throw new ApiError(400, 'No file uploaded');
  const map = {
    images: IMAGE_DIR,
    videos: VIDEO_DIR,
    profiles: PROFILE_DIR,
  };
  const destDir = map[kind];
  if (!destDir) throw new ApiError(400, 'Invalid upload folder');

  if (env.cloudinaryEnabled) {
    return persistCloudinary(file, kind);
  }
  return persistLocal(file, kind, destDir);
}

async function saveUploads(files, kind) {
  const list = Array.isArray(files) ? files : [];
  const saved = [];
  for (const file of list) {
    saved.push(await saveUpload(file, kind));
  }
  return saved;
}

async function destroyMedia(publicId, type) {
  if (!publicId || !env.cloudinaryEnabled) return;
  await cloudinary.uploader.destroy(publicId, {
    resource_type: type === 'VIDEO' ? 'video' : 'image',
  }).catch(() => {});
}

async function removeLocalIfNeeded(url) {
  if (!url || url.startsWith('http')) return;
  const relative = url.replace(/^\//, '');
  if (!relative.startsWith('uploads/')) return;
  const abs = path.join(__dirname, '../../', relative);
  await fs.unlink(abs).catch(() => {});
}

module.exports = { saveUpload, saveUploads, destroyMedia, removeLocalIfNeeded };
