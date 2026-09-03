import fs from 'node:fs';
import path from 'node:path';

// Helper function to safely calculate disk folder size if needed
const getFolderSize = (dirPath) => {
  let size = 0;
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        size += stat.size;
      } else if (stat.isDirectory()) {
        size += getFolderSize(filePath);
      }
    });
  }
  return size;
};

export {
  getFolderSize,
}