const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/projectController');

const STATUSES = ['Planning', 'Active', 'On Hold', 'Completed'];
const idParam = param('id').isMongoId().withMessage('Invalid project id');

const projectFields = (isCreate) => [
  isCreate
    ? body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 100 })
    : body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description is too long'),
  body('status').optional().isIn(STATUSES).withMessage('Invalid project status'),
  body('deadline').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid deadline'),
  body('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Invalid color'),
  body('members').optional().isArray().withMessage('Members must be an array'),
  body('members.*').optional().isMongoId().withMessage('Invalid member id'),
];

router.use(protect);

router.route('/')
  .get(c.getProjects)
  .post(projectFields(true), validate, c.createProject);

router.route('/:id')
  .get(idParam, validate, c.getProject)
  .put(idParam, projectFields(false), validate, c.updateProject)
  .delete(idParam, validate, c.deleteProject);

router.post(
  '/:id/members',
  [
    idParam,
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('name').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
  ],
  validate,
  c.addMember
);

router.delete(
  '/:id/members/:userId',
  [idParam, param('userId').isMongoId().withMessage('Invalid user id')],
  validate,
  c.removeMember
);

module.exports = router;
