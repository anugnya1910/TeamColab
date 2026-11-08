const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/taskController');

const STATUSES = ['Todo', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const idParam = param('id').isMongoId().withMessage('Invalid task id');

const taskFields = (isCreate) => [
  isCreate
    ? body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 150 }).withMessage('Title is too long')
    : body('title').optional().trim().notEmpty().withMessage('Task title cannot be empty').isLength({ max: 150 }),
  ...(isCreate ? [body('project').isMongoId().withMessage('Please select a project')] : []),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description is too long'),
  body('priority').optional().isIn(PRIORITIES).withMessage('Priority must be Low, Medium or High'),
  body('status').optional().isIn(STATUSES).withMessage('Invalid status'),
  body('assignee').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid assignee'),
  body('dueDate').optional({ values: 'falsy' }).isISO8601().withMessage('Invalid due date'),
];

router.use(protect);

router.route('/')
  .get(c.getTasks)
  .post(taskFields(true), validate, c.createTask);

router.route('/:id')
  .get(idParam, validate, c.getTask)
  .put(idParam, taskFields(false), validate, c.updateTask)
  .delete(idParam, validate, c.deleteTask);

router.patch(
  '/:id/status',
  [idParam, body('status').isIn(STATUSES).withMessage('Invalid status')],
  validate,
  c.updateTaskStatus
);

router.route('/:id/comments')
  .get(idParam, validate, c.getComments)
  .post(
    [idParam, body('text').trim().notEmpty().withMessage('Comment cannot be empty').isLength({ max: 1000 })],
    validate,
    c.addComment
  );

router.delete(
  '/:id/comments/:commentId',
  [idParam, param('commentId').isMongoId().withMessage('Invalid comment id')],
  validate,
  c.deleteComment
);

module.exports = router;
