const multer = require('multer');
const { ApiErrors } = require('../utils/ApiError');

const storage = multer.memoryStorage();

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiErrors.custom('ONLY_JPEG_PNG_WEBP_AND_GIF_IMAGES_ARE_ALLOWED', 400, 'INVALID_FILE_TYPE'),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

module.exports = upload;
