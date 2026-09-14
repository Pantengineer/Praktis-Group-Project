// server/middleware/errorHandler.js
import multer from 'multer';

const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err.message || err);

  // Handle Multer-specific errors (File size limit, unsupported format, etc.)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ukuran berkas terlalu besar. Maksimal 10 MB per berkas.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Gagal mengunggah berkas: ${err.message}`
    });
  }

  // Handle Disk Full (ENOSPC) Error
  if (err.code === 'ENOSPC' || err.message?.includes('ENOSPC')) {
    return res.status(507).json({
      success: false,
      message: 'Kapasitas penyimpanan server fisik telah penuh (ENOSPC). Harap hubungi Administrator.'
    });
  }

  // Handle Custom Storage & User Quota Errors
  if (err.message && (err.message.includes('Quota Exceeded') || err.message.includes('kuota'))) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

export default errorHandler;