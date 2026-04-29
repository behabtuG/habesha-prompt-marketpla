// src/common/config/multer.config.ts
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const multerConfig = {
  storage: diskStorage({
    destination: './uploads/receipts',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + uuidv4();
      const ext = extname(file.originalname);
      callback(null, `${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error('Invalid file type. Only images and PDFs are allowed.'),
      );
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
