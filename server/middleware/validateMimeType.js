// server/middleware/validateMimeType.js
// 2.7: Post-upload magic bytes MIME validation.
// Multer's fileFilter only checks the client-supplied Content-Type header, which is trivially
// spoofable. This middleware reads the actual file bytes after upload and validates the
// real MIME type using the 'file-type' library (magic number detection).
//
// Usage: Place AFTER multer upload middleware in a route.
//   router.post('/upload', upload.single('file'), validateMimeType, controller)
//
import fs from 'fs';
import path from 'path';
import fileType from 'file-type';

// Map allowed extensions to their expected MIME type prefixes or exact types.
// This is the ground truth; we reject anything not in this map.
const ALLOWED_MIME_TYPES = new Set([
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
  // Some zip variants that file-type may detect for .docx/.pptx (they are zip archives)
  'application/x-zip',
]);

/**
 * Deletes a file from disk silently (best-effort cleanup).
 */
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
};

/**
 * Express middleware that validates uploaded file(s) magic bytes.
 * Works with both req.file (single) and req.files (array/fields).
 */
const validateMimeType = async (req, res, next) => {
  // Collect all uploaded files into a flat array
  let uploadedFiles = [];
  if (req.file) {
    uploadedFiles = [req.file];
  } else if (req.files) {
    if (Array.isArray(req.files)) {
      uploadedFiles = req.files;
    } else {
      // req.files is an object of field arrays
      uploadedFiles = Object.values(req.files).flat();
    }
  }

  if (uploadedFiles.length === 0) {
    return next(); // No files uploaded, skip validation
  }

  try {
    for (const file of uploadedFiles) {
      // Read only the first 4100 bytes — enough for magic byte detection
      const buffer = Buffer.alloc(4100);
      const fd = fs.openSync(file.path, 'r');
      fs.readSync(fd, buffer, 0, 4100, 0);
      fs.closeSync(fd);

      const detectedType = await fileType.fromBuffer(buffer);

      // If file-type can't detect the type at all, it might be a text file (e.g., .txt, .csv)
      // or a malicious file with no magic bytes. Reject it unless it's expected.
      if (!detectedType) {
        // For Office docs and zip files, file-type should always detect something.
        // If we get null, reject to be safe (could be a renamed .exe or similar).
        deleteFile(file.path);
        // Also clean up any other files already processed this request
        for (const f of uploadedFiles) {
          if (f.path !== file.path) deleteFile(f.path);
        }
        return res.status(400).json({
          message: `File "${file.originalname}" could not be validated. It may be corrupt or an unsupported type.`
        });
      }

      const detectedMime = detectedType.mime;

      // .docx and .pptx are ZIP-based — file-type detects them as application/zip.
      // We accept them if the client MIME is one of those office types AND
      // file-type confirms it's a zip container.
      const isOfficeDoc = [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ].includes(file.mimetype);

      const detectedIsZip = detectedMime === 'application/zip' || detectedMime === 'application/x-zip';

      const mimeIsValid = ALLOWED_MIME_TYPES.has(detectedMime) ||
                          (isOfficeDoc && detectedIsZip);

      if (!mimeIsValid) {
        // Clean up all uploaded files in this request
        for (const f of uploadedFiles) deleteFile(f.path);
        return res.status(400).json({
          message: `File "${file.originalname}" failed MIME validation. Detected type: ${detectedMime}. Only PDF, Word, PowerPoint, images, and archives are allowed.`
        });
      }
    }

    // All files passed validation
    next();

  } catch (error) {
    // Cleanup on unexpected error
    for (const f of uploadedFiles) deleteFile(f.path);
    next(error);
  }
};

export default validateMimeType;