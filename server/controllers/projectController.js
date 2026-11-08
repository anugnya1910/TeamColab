const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const User = require('../models/User');
const {
  USER_FIELDS, asyncHandler, httpError, memberFilter, getProjectIfMember,
  withProjectStats, logActivity, notify, idOf,
} = require('../utils/helpers');

const populateProject = (q) => q.populate('owner', USER_FIELDS).populate('members', USER_FIELDS);

async function sendProject(res, projectId, status = 200) {
  const project = await populateProject(Project.findById(projectId));
  const [withStats] = await withProjectStats([project]);
  res.status(status).json(withStats);
}

// GET /api/projects
exports.getProjects = asyncHandler(async (req, res) => {
  const projects = await populateProject(Project.find(memberFilter(req.user._id)).sort('-updatedAt'));
  res.json(await withProjectStats(projects));
});

// POST /api/projects
exports.createProject = asyncHandler(async (req, res) => {
  const { name, description, status, deadline, color, members = [] } = req.body;
  const validMembers = await User.find({ _id: { $in: members } }).select('_id');
  const memberIds = [...new Set([String(req.user._id), ...validMembers.map((u) => String(u._id))])];

  const project = await Project.create({
    name, description, status, color, deadline: deadline || null,
    owner: req.user._id, members: memberIds,
  });

  logActivity({
    user: req.user._id, project: project._id, action: 'project_created',
    entityType: 'project', entityId: project._id, message: `created project "${project.name}"`,
  });
  memberIds.forEach((m) =>
    notify({
      user: m, actor: req.user._id, type: 'project_invite',
      message: `${req.user.name} added you to "${project.name}"`, link: `/projects/${project._id}`,
    })
  );
  await sendProject(res, project._id, 201);
});

// GET /api/projects/:id
exports.getProject = asyncHandler(async (req, res) => {
  await getProjectIfMember(req.params.id, req.user._id);
  await sendProject(res, req.params.id);
});

// PUT /api/projects/:id
exports.updateProject = asyncHandler(async (req, res) => {
  const project = await getProjectIfMember(req.params.id, req.user._id);
  const prevStatus = project.status;
  ['name', 'description', 'status', 'color'].forEach((f) => {
    if (req.body[f] !== undefined) project[f] = req.body[f];
  });
  if (req.body.deadline !== undefined) project.deadline = req.body.deadline || null;
  await project.save();

  logActivity({
    user: req.user._id, project: project._id, action: 'project_updated', entityType: 'project',
    entityId: project._id,
    message: project.status !== prevStatus
      ? `changed "${project.name}" status to ${project.status}`
      : `updated project "${project.name}"`,
  });
  await sendProject(res, project._id);
});

// DELETE /api/projects/:id  (owner only) — cascades tasks, comments, activity
exports.deleteProject = asyncHandler(async (req, res) => {
  const project = await getProjectIfMember(req.params.id, req.user._id);
  if (idOf(project.owner) !== String(req.user._id)) throw httpError(403, 'Only the project owner can delete it');

  const taskIds = (await Task.find({ project: project._id }).select('_id')).map((t) => t._id);
  await Promise.all([
    Comment.deleteMany({ task: { $in: taskIds } }),
    Task.deleteMany({ project: project._id }),
    Activity.deleteMany({ project: project._id }),
  ]);
  await project.deleteOne();
  res.json({ message: 'Project deleted', id: project._id });
});

// POST /api/projects/:id/members  { email, name? }
// Adds an existing user by email, or invites a new one (creates account with temp password)
exports.addMember = asyncHandler(async (req, res) => {
  const project = await getProjectIfMember(req.params.id, req.user._id);
  const { email, name, role } = req.body;

  let user = await User.findOne({ email: email.toLowerCase() });
  let invited = false;
  if (!user) {
    if (!name) throw httpError(404, 'No user with that email yet — add their name to invite them');
    user = await User.create({ name, email, password: 'Welcome@123', role: role || 'Team Member' });
    invited = true;
  }
  if (project.members.some((m) => idOf(m) === String(user._id)) || idOf(project.owner) === String(user._id)) {
    throw httpError(409, `${user.name} is already a member of this project`);
  }

  project.members.push(user._id);
  await project.save();

  logActivity({
    user: req.user._id, project: project._id, action: 'member_added', entityType: 'member',
    entityId: user._id, message: `${invited ? 'invited' : 'added'} ${user.name} to "${project.name}"`,
  });
  notify({
    user: user._id, actor: req.user._id, type: 'project_invite',
    message: `${req.user.name} added you to "${project.name}"`, link: `/projects/${project._id}`,
  });
  await sendProject(res, project._id);
});

// DELETE /api/projects/:id/members/:userId  (owner only)
exports.removeMember = asyncHandler(async (req, res) => {
  const project = await getProjectIfMember(req.params.id, req.user._id);
  if (idOf(project.owner) !== String(req.user._id)) throw httpError(403, 'Only the project owner can remove members');
  if (idOf(project.owner) === req.params.userId) throw httpError(400, 'The project owner cannot be removed');

  const removed = await User.findById(req.params.userId);
  project.members = project.members.filter((m) => idOf(m) !== req.params.userId);
  await project.save();
  await Task.updateMany({ project: project._id, assignee: req.params.userId }, { assignee: null });

  logActivity({
    user: req.user._id, project: project._id, action: 'member_removed', entityType: 'member',
    entityId: req.params.userId, message: `removed ${removed ? removed.name : 'a member'} from "${project.name}"`,
  });
  await sendProject(res, project._id);
});
