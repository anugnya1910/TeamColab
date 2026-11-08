const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const User = require('../models/User');
const {
  USER_FIELDS, asyncHandler, accessibleProjectIds, memberFilter, withProjectStats,
  startOfDay, dayKey, lastNDays,
} = require('../utils/helpers');

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildTimeline(tasks, days, labelFmt) {
  const buckets = lastNDays(days).map((d) => ({
    date: dayKey(d),
    label: labelFmt(d),
    created: 0,
    completed: 0,
  }));
  const index = new Map(buckets.map((b, i) => [b.date, i]));
  tasks.forEach((t) => {
    const c = index.get(dayKey(t.createdAt));
    if (c !== undefined) buckets[c].created += 1;
    if (t.completedAt) {
      const k = index.get(dayKey(t.completedAt));
      if (k !== undefined) buckets[k].completed += 1;
    }
  });
  return buckets;
}

// GET /api/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const projectIds = await accessibleProjectIds(userId);
  const now = new Date();

  const tasks = await Task.find({ project: { $in: projectIds } })
    .select('status priority dueDate createdAt completedAt assignee')
    .lean();

  const completed = tasks.filter((t) => t.status === 'Done').length;
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const overdue = tasks.filter((t) => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < now).length;
  const myOpen = tasks.filter((t) => t.status !== 'Done' && String(t.assignee) === String(userId)).length;

  const [upcomingDeadlines, recentActivity, projects] = await Promise.all([
    Task.find({ project: { $in: projectIds }, status: { $ne: 'Done' }, dueDate: { $gte: startOfDay(now) } })
      .sort('dueDate').limit(6)
      .populate('assignee', USER_FIELDS).populate('project', 'name color'),
    Activity.find({ project: { $in: projectIds } }).sort('-createdAt').limit(8)
      .populate('user', USER_FIELDS).populate('project', 'name color'),
    Project.find(memberFilter(userId)).sort('deadline').populate('members', USER_FIELDS),
  ]);

  res.json({
    stats: {
      totalProjects: projectIds.length,
      totalTasks: tasks.length,
      completed,
      pending: tasks.length - completed,
      inProgress,
      todo: tasks.length - completed - inProgress,
      overdue,
      myOpen,
      completionRate: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    },
    productivity: buildTimeline(tasks, 7, (d) => WEEKDAY[d.getDay()]),
    upcomingDeadlines,
    recentActivity,
    projects: await withProjectStats(projects),
  });
});

// GET /api/analytics?days=30
exports.getAnalytics = asyncHandler(async (req, res) => {
  const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90);
  const userId = req.user._id;
  const projects = await Project.find(memberFilter(userId));
  const projectIds = projects.map((p) => p._id);
  const tasks = await Task.find({ project: { $in: projectIds } })
    .select('status priority dueDate createdAt completedAt assignee project')
    .lean();
  const now = new Date();
  const since = startOfDay(new Date(now.getTime() - (days - 1) * 864e5));

  const count = (fn) => tasks.filter(fn).length;
  const completedTasks = tasks.filter((t) => t.status === 'Done');
  const durations = completedTasks
    .filter((t) => t.completedAt)
    .map((t) => (new Date(t.completedAt) - new Date(t.createdAt)) / 864e5);

  // workload per member
  const byAssignee = new Map();
  tasks.forEach((t) => {
    if (!t.assignee) return;
    const k = String(t.assignee);
    const e = byAssignee.get(k) || { todo: 0, inProgress: 0, done: 0 };
    if (t.status === 'Done') e.done += 1;
    else if (t.status === 'In Progress') e.inProgress += 1;
    else e.todo += 1;
    byAssignee.set(k, e);
  });
  const users = await User.find({ _id: { $in: [...byAssignee.keys()] } }).select('name avatarColor');
  const workload = users
    .map((u) => ({ name: u.name.split(' ')[0], fullName: u.name, ...byAssignee.get(String(u._id)) }))
    .sort((a, b) => b.todo + b.inProgress + b.done - (a.todo + a.inProgress + a.done));

  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  res.json({
    range: days,
    summary: {
      totalTasks: tasks.length,
      completionRate: tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      completedInRange: count((t) => t.completedAt && new Date(t.completedAt) >= since),
      createdInRange: count((t) => new Date(t.createdAt) >= since),
      avgCompletionDays: durations.length ? +(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : 0,
      overdue: count((t) => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < now),
    },
    timeline: buildTimeline(tasks, days, fmt),
    statusDistribution: ['Todo', 'In Progress', 'Done'].map((s) => ({ name: s, value: count((t) => t.status === s) })),
    priorityDistribution: ['High', 'Medium', 'Low'].map((p) => ({
      name: p,
      total: count((t) => t.priority === p),
      open: count((t) => t.priority === p && t.status !== 'Done'),
      done: count((t) => t.priority === p && t.status === 'Done'),
    })),
    projectCompletion: (await withProjectStats(projects)).map((p) => ({
      id: p._id, name: p.name, color: p.color, progress: p.progress, total: p.taskCount, completed: p.completedCount,
    })),
    workload,
  });
});
