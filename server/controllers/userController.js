const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const {
  USER_FIELDS, asyncHandler, httpError, escapeRegex, memberFilter, accessibleProjectIds,
} = require('../utils/helpers');

// GET /api/users?search=  — directory used when adding members
exports.getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const users = await User.find(filter).select(USER_FIELDS).sort('name').limit(50);
  res.json(users);
});

// GET /api/users/team — everyone who shares a project with me, with workload stats
exports.getTeam = asyncHandler(async (req, res) => {
  const projects = await Project.find(memberFilter(req.user._id))
    .populate('owner', `${USER_FIELDS} bio lastActive createdAt`)
    .populate('members', `${USER_FIELDS} bio lastActive createdAt`);

  const map = new Map();
  projects.forEach((p) => {
    [p.owner, ...p.members].forEach((m) => {
      if (!m) return;
      const k = String(m._id);
      if (!map.has(k)) map.set(k, { ...m.toObject(), projects: [] });
      const entry = map.get(k);
      if (!entry.projects.some((x) => String(x._id) === String(p._id))) {
        entry.projects.push({ _id: p._id, name: p.name, color: p.color });
      }
    });
  });

  const stats = await Task.aggregate([
    { $match: { project: { $in: projects.map((p) => p._id) }, assignee: { $ne: null } } },
    {
      $group: {
        _id: '$assignee',
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
      },
    },
  ]);
  const statMap = new Map(stats.map((s) => [String(s._id), s]));

  const me = String(req.user._id);
  const team = [...map.values()]
    .map((m) => {
      const s = statMap.get(String(m._id)) || { total: 0, done: 0, inProgress: 0 };
      return { ...m, stats: { total: s.total, done: s.done, inProgress: s.inProgress, open: s.total - s.done } };
    })
    .sort((a, b) => (String(a._id) === me ? -1 : String(b._id) === me ? 1 : a.name.localeCompare(b.name)));
  res.json(team);
});

// GET /api/users/:id — member detail with their tasks in projects I can see
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(`${USER_FIELDS} bio lastActive createdAt`);
  if (!user) throw httpError(404, 'User not found');

  const projectIds = await accessibleProjectIds(req.user._id);
  const [tasks, projects] = await Promise.all([
    Task.find({ project: { $in: projectIds }, assignee: user._id })
      .populate('project', 'name color').sort({ status: 1, dueDate: 1 }),
    Project.find({ _id: { $in: projectIds }, ...memberFilter(user._id) }).select('name color status'),
  ]);
  const done = tasks.filter((t) => t.status === 'Done').length;
  res.json({
    user,
    projects,
    tasks,
    stats: {
      total: tasks.length,
      done,
      inProgress: tasks.filter((t) => t.status === 'In Progress').length,
      open: tasks.length - done,
      completionRate: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    },
  });
});
