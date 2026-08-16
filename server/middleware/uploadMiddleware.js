// server/middleware/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const createUploader = (subfolder) => {
  // 1. Dynamic Destination
  const uploadDir = `uploads/${subfolder}`;
  
  // Ensure the specific folder exists (e.g., uploads/materials)
  if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const checkStorageLimit = () => {
    const maxStorageMB = parseInt(process.env.MAX_STORAGE_LIMIT_MB) || 5000;
    const maxStorageBytes = maxStorageMB * 1024 * 1024;
    const rootUploads = path.join(import.meta.dirname, '../uploads');
    
    let size = 0;
    const calculateSize = (dir) => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
          const fp = path.join(dir, file);
          try {
            const stat = fs.statSync(fp);
            if (stat.isFile()) size += stat.size;
            else if (stat.isDirectory()) calculateSize(fp);
          } catch (e) {
            // Ignore temporary locks
          }
        });
      }
    };
    calculateSize(rootUploads);
    return size >= maxStorageBytes;
  };

  // Anti-Abuse Guard 1: Per-User Total Quota (Max 100MB per user across all uploads)
  const checkUserQuota = (userId) => {
    if (!userId) return false;
    const maxUserQuotaMB = parseInt(process.env.MAX_USER_QUOTA_MB) || 100;
    const maxUserQuotaBytes = maxUserQuotaMB * 1024 * 1024;
    const rootUploads = path.join(import.meta.dirname, '../uploads');
    const userPrefix = `${userId}-`;

    let totalUserSize = 0;
    const scanUserFiles = (dir) => {
      if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(file => {
          const fp = path.join(dir, file);
          try {
            const stat = fs.statSync(fp);
            if (stat.isFile()) {
              if (file.startsWith(userPrefix)) {
                totalUserSize += stat.size;
              }
            } else if (stat.isDirectory()) {
              scanUserFiles(fp);
            }
          } catch (e) {
            // Ignore locks
          }
        });
      }
    };
    scanUserFiles(rootUploads);
    return totalUserSize >= maxUserQuotaBytes;
  };

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Check Global Storage Cap (5GB)
      if (checkStorageLimit()) {
        return cb(new Error('Kapasitas penyimpanan total sistem telah penuh (Global Quota Exceeded 5GB). Hubungi Administrator.'), null);
      }
      // Check Per-User Quota (100MB)
      if (req.user?.id && checkUserQuota(req.user.id)) {
        return cb(new Error('Batas kuota akun Anda (Max 100 MB) telah penuh. Hapus pengumpulan berkas lama untuk mengunggah berkas baru.'), null);
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Filename: userID-timestamp-sanitizedOriginalName.ext
      const nameWithoutExt = path.parse(file.originalname).name;
      const ext = path.extname(file.originalname);
      const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
      const uniquePrefix = `${req.user?.id || 'anon'}-${Date.now()}`;
      cb(null, `${uniquePrefix}-${cleanName}${ext}`);
    }
  });

  // Anti-Abuse Guard 2: Double Validation (Extension + MIME Type)
  const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.zip', '.rar'];
    const allowedMimeTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 
      'image/png',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/octet-stream'
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Format berkas (${ext}) tidak didukung. Hanya PDF, DOCX, PPTX, JPG, PNG, dan ZIP yang diperbolehkan.`), false);
    }
  };

  return multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB per individual file
    fileFilter: fileFilter
  });
};

export default createUploader;