const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const USER_FIELDS = 'name email avatarColor role';

// Wraps async route handlers so errors reach the error middleware
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const httpError = (statusCode, message) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---- Access control ----
const memberFilter = (userId) => ({ $or: [{ owner: userId }, { members: userId }] });

async function accessibleProjectIds(userId) {
  const projects = await Project.find(memberFilter(userId)).select('_id');
  return projects.map((p) => p._id);
}

const idOf = (v) => String(v && v._id ? v._id : v);

function isMember(project, userId) {
  const uid = idOf(userId);
  return idOf(project.owner) === uid || project.members.some((m) => idOf(m) === uid);
}

async function getProjectIfMember(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) throw httpError(404, 'Project not found');
  if (!isMember(project, userId)) throw httpError(403, 'You do not have access to this project');
  return project;
}

// ---- Project progress stats ----
async function withProjectStats(projects) {
  const ids = projects.map((p) => p._id);
  const stats = await Task.aggregate([
    { $match: { project: { $in: ids } } },
    {
      $group: {
        _id: '$project',
        total: { $sum: 1 },
        done: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
      },
    },
  ]);
  const map = new Map(stats.map((s) => [String(s._id), s]));
  return projects.map((p) => {
    const obj = typeof p.toObject === 'function' ? p.toObject() : p;
    const s = map.get(String(p._id)) || { total: 0, done: 0, inProgress: 0 };
    return {
      ...obj,
      taskCount: s.total,
      completedCount: s.done,
      inProgressCount: s.inProgress,
      progress: s.total ? Math.round((s.done / s.total) * 100) : obj.status === 'Completed' ? 100 : 0,
    };
  });
}

// ---- Activity + notifications (fire-and-forget, never break a request) ----
function logActivity(data) {
  return Activity.create(data).catch((e) => console.error('Activity log failed:', e.message));
}

async function notify({ user, actor, type = 'info', message, link = '' }) {
  if (!user || (actor && idOf(user) === idOf(actor))) return;
  try {
    await Notification.create({ user, actor, type, message, link });
  } catch (e) {
    console.error('Notification failed:', e.message);
  }
}

// ---- Date helpers (server runs locally, so local time = user time) ----
const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const lastNDays = (n) => {
  const today = startOfDay();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
};

module.exports = {
  USER_FIELDS,
  asyncHandler,
  httpError,
  escapeRegex,
  memberFilter,
  accessibleProjectIds,
  isMember,
  getProjectIfMember,
  withProjectStats,
  logActivity,
  notify,
  startOfDay,
  dayKey,
  lastNDays,
  idOf,
};
