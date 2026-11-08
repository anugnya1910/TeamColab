const router = require('express').Router();
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/userController');

router.use(protect);
router.get('/', c.getUsers);
router.get('/team', c.getTeam);
router.get('/:id', param('id').isMongoId().withMessage('Invalid user id'), validate, c.getUser);

module.exports = router;
