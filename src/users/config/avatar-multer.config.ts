import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const avatarMulterOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_AVATAR_SIZE_BYTES },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
      return callback(
        new BadRequestException(`File type ${file.mimetype} is not allowed`),
        false,
      );
    }
    callback(null, true);
  },
};
