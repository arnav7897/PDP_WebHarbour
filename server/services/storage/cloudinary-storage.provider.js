const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../../config/cloudinary');
const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = require('../../config/env');

const canUseCloudinary = () =>
  CLOUDINARY_CLOUD_NAME &&
  CLOUDINARY_API_KEY &&
  CLOUDINARY_API_SECRET &&
  cloudinary &&
  cloudinary.uploader;

const sanitizeSegment = (value, fallback = 'file') =>
  String(value || fallback)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;

const buildFolder = ({ category, appId }) => {
  const safeCategory = sanitizeSegment(category, 'files');
  const safeApp = sanitizeSegment(appId, '0');
  return `webharbour/${safeCategory}/app-${safeApp}`;
};

const inferFormat = (filename = '') => {
  const ext = path.extname(String(filename || '')).toLowerCase();
  return ext ? ext.slice(1) : null;
};

const putObject = async ({ tempPath, filename, category, appId, mimeType }) => {
  if (!canUseCloudinary()) {
    throw new Error('Cloudinary storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  const baseName = path.basename(filename || tempPath || 'file');
  const folder = buildFolder({ category, appId });
  const result = await cloudinary.uploader.upload(tempPath, {
    resource_type: 'raw',
    type: 'upload',
    access_mode: 'public',
    folder,
    use_filename: true,
    unique_filename: true,
    filename_override: baseName,
  });

  const stats = fs.statSync(tempPath);
  const format = result.format || inferFormat(baseName);

  return {
    provider: 'CLOUDINARY',
    bucket: CLOUDINARY_CLOUD_NAME || null,
    key: result.public_id || null,
    url: result.secure_url || result.url || null,
    byteSize: result.bytes || stats.size,
    mimeType: mimeType || 'application/octet-stream',
    publicId: result.public_id || null,
    format,
  };
};

const getSignedReadUrl = async ({ key, filename }) => {
  if (!key) throw new Error('Cloudinary storage key is required');
  if (!canUseCloudinary()) {
    throw new Error('Cloudinary storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }

  const format = inferFormat(filename);
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
  const options = {
    resource_type: 'raw',
    type: 'upload',
    attachment: filename ? String(filename) : true,
    expires_at: expiresAt,
  };

  return cloudinary.utils.private_download_url(key, format || undefined, options);
};

const deleteObject = async ({ key }) => {
  if (!key) return;
  if (!canUseCloudinary()) {
    throw new Error('Cloudinary storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }
  await cloudinary.uploader.destroy(key, { resource_type: 'raw', type: 'upload' });
};

const healthcheck = async () => {
  if (!canUseCloudinary()) {
    throw new Error('Cloudinary storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.');
  }
  return { ok: true, provider: 'CLOUDINARY', cloudName: CLOUDINARY_CLOUD_NAME || null };
};

module.exports = {
  putObject,
  getSignedReadUrl,
  deleteObject,
  healthcheck,
};
