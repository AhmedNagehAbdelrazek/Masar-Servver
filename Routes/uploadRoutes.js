const router = require('express').Router();
const c = require('../Controllers/uploadController');
const protect = require('../middlewares/protect');
const roleGuard = require('../middlewares/roleGuard');
const { permissionGuard } = require('../middlewares/roleGuard');
const upload = require('../middlewares/uploadMiddleware');
const { ROLES } = require('../config/constants');

router.post('/', protect, roleGuard([ROLES.ADMIN, ROLES.SUPER_ADMIN]), permissionGuard('products', 'create'), upload.single('file'), c.upload);

module.exports = router;
