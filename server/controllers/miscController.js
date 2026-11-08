// Notifications, activity feed and global search
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const {
  USER_FIELDS, asyncHandler, httpError, escapeRegex, accessibleProjectIds, memberFilter,
} = require('../utils/helpers');

// ---------- Notifications ----------
exports.getNotifications = asyncHandler(async (req, res) => {
  const [items, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').limit(30).populate('actor', USER_FIELDS),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ items, unreadCount });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id }, { read: true }, { new: true }
  );
  if (!n) throw httpError(404, 'Notification not found');
  res.json(n);
});

exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read' });
});

exports.clearNotifications = asyncHandler(async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  res.json({ message: 'Notifications cleared' });
});

// ---------- Activity feed ----------
exports.getActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const projectIds = await accessibleProjectIds(req.user._id);
  const filter = { project: { $in: projectIds } };
  if (req.query.project) {
    if (!projectIds.some((id) => String(id) === req.query.project)) throw httpError(403, 'No access to this project');
    filter.project = req.query.project;
  }
  const items = await Activity.find(filter).sort('-createdAt').limit(limit)
    .populate('user', USER_FIELDS).populate('project', 'name color');
  res.json(items);
});

// ---------- Global search ----------
exports.search = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json({ projects: [], tasks: [], members: [] });
  const rx = new RegExp(escapeRegex(q), 'i');
  const projectIds = await accessibleProjectIds(req.user._id);

  const [projects, tasks, myProjects] = await Promise.all([
    Project.find({ _id: { $in: projectIds }, name: rx }).select('name color status').limit(5),
    Task.find({ project: { $in: projectIds }, title: rx }).select('title status priority project')
      .populate('project', 'name color').limit(6),
    Project.find(memberFilter(req.user._id)).select('owner members'),
  ]);
  const teamIds = new Set();
  myProjects.forEach((p) => [p.owner, ...p.members].forEach((m) => teamIds.add(String(m))));
  const members = await User.find({ _id: { $in: [...teamIds] }, $or: [{ name: rx }, { email: rx }] })
    .select(USER_FIELDS).limit(5);

  res.json({ projects, tasks, members });
});
