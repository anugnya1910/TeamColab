const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/authController');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }).withMessage('Name is too long'),
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().trim().isLength({ max: 60 }),
  ],
  validate,
  c.register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  c.login
);

router.get('/me', protect, c.getMe);

router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 60 }),
    body('role').optional().trim().isLength({ max: 60 }),
    body('bio').optional().trim().isLength({ max: 300 }).withMessage('Bio must be under 300 characters'),
    body('avatarColor').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Invalid color'),
  ],
  validate,
  c.updateProfile
);

router.put(
  '/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  c.changePassword
);

module.exports = router;
