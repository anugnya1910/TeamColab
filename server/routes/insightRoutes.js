// Dashboard, analytics, notifications, activity and search
const router = require('express').Router();
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const dash = require('../controllers/dashboardController');
const misc = require('../controllers/miscController');

// protect is applied per-route so unknown /api paths still return 404
router.get('/dashboard', protect, dash.getDashboard);
router.get('/analytics', protect, dash.getAnalytics);

router.get('/notifications', protect, misc.getNotifications);
router.patch('/notifications/read-all', protect, misc.markAllNotificationsRead);
router.patch('/notifications/:id/read', protect, param('id').isMongoId(), validate, misc.markNotificationRead);
router.delete('/notifications', protect, misc.clearNotifications);

router.get('/activity', protect, misc.getActivity);
router.get('/search', protect, misc.search);

module.exports = router;
