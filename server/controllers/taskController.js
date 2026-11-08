const Task = require('../models/Task');
const Comment = require('../models/Comment');
const {
  USER_FIELDS, asyncHandler, httpError, escapeRegex, accessibleProjectIds,
  getProjectIfMember, isMember, logActivity, notify, idOf,
} = require('../utils/helpers');

const populateTask = (q) =>
  q.populate('assignee', USER_FIELDS).populate('createdBy', USER_FIELDS).populate('project', 'name color');

async function withCommentCounts(tasks) {
  const counts = await Comment.aggregate([
    { $match: { task: { $in: tasks.map((t) => t._id) } } },
    { $group: { _id: '$task', count: { $sum: 1 } } },
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  return tasks.map((t) => ({ ...t.toObject(), commentCount: map.get(String(t._id)) || 0 }));
}

async function sendTask(res, taskId, status = 200) {
  const task = await populateTask(Task.findById(taskId));
  const [withCount] = await withCommentCounts([task]);
  res.status(status).json(withCount);
}

const taskLink = (task) => `/tasks?task=${task._id}`;

function notifyStatusChange(task, actor) {
  const recipients = [...new Set([idOf(task.assignee), idOf(task.createdBy)].filter((x) => x && x !== 'null'))];
  recipients.forEach((user) =>
    notify({
      user, actor: actor._id, type: 'status_change',
      message: `${actor.name} moved "${task.title}" to ${task.status}`, link: taskLink(task),
    })
  );
}

async function loadTaskForUser(taskId, userId) {
  const task = await Task.findById(taskId);
  if (!task) throw httpError(404, 'Task not found');
  const project = await getProjectIfMember(task.project, userId);
  return { task, project };
}

// GET /api/tasks?project=&status=&priority=&assignee=me|unassigned|id&search=&overdue=true&sort=
exports.getTasks = asyncHandler(async (req, res) => {
  const { project, status, priority, assignee, search, overdue, sort } = req.query;
  const projectIds = await accessibleProjectIds(req.user._id);
  const filter = { project: { $in: projectIds } };

  if (project) {
    if (!projectIds.some((id) => String(id) === String(project))) throw httpError(403, 'You do not have access to this project');
    filter.project = project;
  }
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assignee === 'me') filter.assignee = req.user._id;
  else if (assignee === 'unassigned') filter.assignee = null;
  else if (assignee) filter.assignee = assignee;
  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }
  if (overdue === 'true') {
    filter.status = { $ne: 'Done' };
    filter.dueDate = { $lt: new Date() };
  }

  const SORTS = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    dueDate: { dueDate: 1 },
    board: { order: 1, createdAt: -1 },
  };
  const tasks = await populateTask(Task.find(filter).sort(SORTS[sort] || SORTS.board));
  res.json(await withCommentCounts(tasks));
});

// POST /api/tasks
exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, project: projectId, assignee, priority, status, dueDate } = req.body;
  const project = await getProjectIfMember(projectId, req.user._id);
  if (assignee && !isMember(project, assignee)) throw httpError(400, 'Assignee must be a member of this project');

  const st = status || 'Todo';
  const order = await Task.countDocuments({ project: project._id, status: st });
  const task = await Task.create({
    title, description, priority, status: st, order,
    project: project._id, assignee: assignee || null, dueDate: dueDate || null, createdBy: req.user._id,
  });

  logActivity({
    user: req.user._id, project: project._id, action: 'task_created', entityType: 'task',
    entityId: task._id, message: `created task "${task.title}"`,
  });
  if (task.assignee) {
    notify({
      user: task.assignee, actor: req.user._id, type: 'task_assigned',
      message: `${req.user.name} assigned you "${task.title}"`, link: taskLink(task),
    });
  }
  await sendTask(res, task._id, 201);
});

// GET /api/tasks/:id
exports.getTask = asyncHandler(async (req, res) => {
  await loadTaskForUser(req.params.id, req.user._id);
  await sendTask(res, req.params.id);
});

// PUT /api/tasks/:id
exports.updateTask = asyncHandler(async (req, res) => {
  const { task, project } = await loadTaskForUser(req.params.id, req.user._id);
  const prevStatus = task.status;
  const prevAssignee = task.assignee ? String(task.assignee) : null;

  ['title', 'description', 'priority', 'status'].forEach((f) => {
    if (req.body[f] !== undefined) task[f] = req.body[f];
  });
  ['assignee', 'dueDate'].forEach((f) => {
    if (req.body[f] !== undefined) task[f] = req.body[f] || null;
  });

  if (task.assignee && !isMember(project, task.assignee)) throw httpError(400, 'Assignee must be a member of this project');
  if (task.status !== prevStatus) task.order = await Task.countDocuments({ project: task.project, status: task.status });
  await task.save();

  const statusChanged = task.status !== prevStatus;
  logActivity({
    user: req.user._id, project: project._id, entityType: 'task', entityId: task._id,
    action: statusChanged ? 'status_changed' : 'task_updated',
    message: statusChanged ? `moved "${task.title}" to ${task.status}` : `updated task "${task.title}"`,
  });

  const newAssignee = task.assignee ? String(task.assignee) : null;
  if (newAssignee && newAssignee !== prevAssignee) {
    notify({
      user: newAssignee, actor: req.user._id, type: 'task_assigned',
      message: `${req.user.name} assigned you "${task.title}"`, link: taskLink(task),
    });
  }
  if (statusChanged) notifyStatusChange(task, req.user);
  await sendTask(res, task._id);
});

// PATCH /api/tasks/:id/status  { status }  — used by the Kanban board
exports.updateTaskStatus = asyncHandler(async (req, res) => {
  const { task, project } = await loadTaskForUser(req.params.id, req.user._id);
  const { status } = req.body;
  if (task.status === status) return sendTask(res, task._id);

  task.status = status;
  task.order = await Task.countDocuments({ project: task.project, status });
  await task.save();

  logActivity({
    user: req.user._id, project: project._id, action: 'status_changed', entityType: 'task',
    entityId: task._id, message: `moved "${task.title}" to ${status}`,
  });
  notifyStatusChange(task, req.user);
  await sendTask(res, task._id);
});

// DELETE /api/tasks/:id
exports.deleteTask = asyncHandler(async (req, res) => {
  const { task, project } = await loadTaskForUser(req.params.id, req.user._id);
  await Comment.deleteMany({ task: task._id });
  await task.deleteOne();
  logActivity({
    user: req.user._id, project: project._id, action: 'task_deleted', entityType: 'task',
    entityId: task._id, message: `deleted task "${task.title}"`,
  });
  res.json({ message: 'Task deleted', id: task._id });
});

// GET /api/tasks/:id/comments
exports.getComments = asyncHandler(async (req, res) => {
  await loadTaskForUser(req.params.id, req.user._id);
  const comments = await Comment.find({ task: req.params.id }).populate('author', USER_FIELDS).sort('createdAt');
  res.json(comments);
});

// POST /api/tasks/:id/comments
exports.addComment = asyncHandler(async (req, res) => {
  const { task, project } = await loadTaskForUser(req.params.id, req.user._id);
  const comment = await Comment.create({ task: task._id, author: req.user._id, text: req.body.text });

  logActivity({
    user: req.user._id, project: project._id, action: 'comment_added', entityType: 'comment',
    entityId: comment._id, message: `commented on "${task.title}"`,
  });
  const recipients = [...new Set([idOf(task.assignee), idOf(task.createdBy)].filter((x) => x && x !== 'null'))];
  recipients.forEach((user) =>
    notify({
      user, actor: req.user._id, type: 'comment',
      message: `${req.user.name} commented on "${task.title}"`, link: taskLink(task),
    })
  );

  await comment.populate('author', USER_FIELDS);
  res.status(201).json(comment);
});

// DELETE /api/tasks/:id/comments/:commentId  (author only)
exports.deleteComment = asyncHandler(async (req, res) => {
  await loadTaskForUser(req.params.id, req.user._id);
  const comment = await Comment.findOne({ _id: req.params.commentId, task: req.params.id });
  if (!comment) throw httpError(404, 'Comment not found');
  if (String(comment.author) !== String(req.user._id)) throw httpError(403, 'You can only delete your own comments');
  await comment.deleteOne();
  res.json({ message: 'Comment deleted', id: comment._id });
});
