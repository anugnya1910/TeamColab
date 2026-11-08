const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');

// Relative date helpers so the demo always looks "live"
const at = (offsetDays, hour = 18, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d;
};
const ago = (days, hour = 11, minute = 0) => at(-days, hour, minute);
const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);

// Overwrite timestamps directly in MongoDB (Mongoose would set them to "now")
async function setTimestamps(Model, rows) {
  if (!rows.length) return;
  await Model.collection.bulkWrite(
    rows.map(({ _id, createdAt }) => ({
      updateOne: { filter: { _id }, update: { $set: { createdAt, updatedAt: createdAt } } },
    }))
  );
}

async function seedDatabase() {
  await Promise.all([User, Project, Task, Comment, Notification, Activity].map((M) => M.deleteMany({})));

  // ---------- Users ----------
  const usersData = [
    { name: 'Murari Geddam', email: 'demo@teamsync.com', role: 'Project Lead', avatarColor: '#6366f1', bio: 'Full-stack developer leading TeamSync demo projects. Loves clean APIs and fast UIs.' },
    { name: 'Priya Reddy', email: 'priya@teamsync.com', role: 'UI/UX Designer', avatarColor: '#ec4899', bio: 'Designs interfaces people enjoy using.' },
    { name: 'Rahul Verma', email: 'rahul@teamsync.com', role: 'Backend Developer', avatarColor: '#f59e0b', bio: 'Node.js, MongoDB and system design.' },
    { name: 'Sneha Iyer', email: 'sneha@teamsync.com', role: 'Frontend Developer', avatarColor: '#10b981', bio: 'React enthusiast and accessibility advocate.' },
    { name: 'Karthik Nair', email: 'karthik@teamsync.com', role: 'QA Engineer', avatarColor: '#06b6d4', bio: 'Breaking things so users don\'t have to.' },
    { name: 'Ananya Gupta', email: 'ananya@teamsync.com', role: 'DevOps Engineer', avatarColor: '#8b5cf6', bio: 'CI/CD, Docker and cloud infrastructure.' },
  ];
  const users = [];
  for (const u of usersData) users.push(await User.create({ ...u, password: 'demo123' }));
  const [demo, priya, rahul, sneha, karthik, ananya] = users;

  // ---------- Projects ----------
  const projects = await Project.create([
    {
      name: 'E-Commerce Platform Revamp',
      description: 'Rebuild the storefront with a modern React frontend, faster product search and a secure checkout powered by Razorpay.',
      status: 'Active', color: '#6366f1', deadline: at(28), owner: demo._id,
      members: [demo._id, priya._id, rahul._id, sneha._id],
    },
    {
      name: 'Mobile Banking App',
      description: 'Secure mobile banking experience with OTP login, biometric authentication, transaction history and automated deployments.',
      status: 'Active', color: '#10b981', deadline: at(42), owner: demo._id,
      members: [demo._id, rahul._id, karthik._id, ananya._id],
    },
    {
      name: 'AI Study Assistant',
      description: 'An AI-powered assistant that turns lecture PDFs into summaries, flashcards and practice quizzes for students.',
      status: 'Planning', color: '#f59e0b', deadline: at(60), owner: demo._id,
      members: [demo._id, sneha._id, priya._id, karthik._id],
    },
  ]);
  const [ecom, bank, study] = projects;
  await setTimestamps(Project, [
    { _id: ecom._id, createdAt: ago(18, 10) },
    { _id: bank._id, createdAt: ago(16, 14) },
    { _id: study._id, createdAt: ago(12, 9) },
  ]);

  // ---------- Tasks ----------
  // due: days from today, created: days ago, completed: days ago (Done only)
  const T = (project, title, description, assignee, priority, status, due, created, completed) =>
    ({ project, title, description, assignee, priority, status, due, created, completed });

  const taskDefs = [
    T(ecom, 'Design new product listing page', 'High-fidelity Figma designs for the product grid, filters and quick-view modal. Include mobile breakpoints.', priya, 'High', 'Done', -6, 14, 8),
    T(ecom, 'Implement JWT authentication API', 'Register/login endpoints with bcrypt hashing, JWT issuing and a protect middleware for private routes.', rahul, 'High', 'Done', -4, 13, 5),
    T(ecom, 'Build shopping cart with React Context', 'Cart state with add/remove/update quantity, persisted to localStorage and synced on login.', sneha, 'Medium', 'In Progress', 3, 9),
    T(ecom, 'Integrate Razorpay payment gateway', 'Server-side order creation, client checkout widget and webhook signature verification.', rahul, 'High', 'In Progress', 5, 7),
    T(ecom, 'Optimize product image loading', 'Lazy-load images, serve WebP and add blur-up placeholders to improve Lighthouse score.', sneha, 'Low', 'Todo', 12, 4),
    T(ecom, 'Write API documentation with Swagger', 'Document every REST endpoint with request/response examples and auth requirements.', demo, 'Medium', 'Todo', -2, 10),
    T(ecom, 'Set up MongoDB indexes for search', 'Add text indexes on product name/description and compound indexes for category filters.', rahul, 'Medium', 'Done', -1, 6, 2),

    T(bank, 'Design secure login flow with OTP', 'Two-step login: password followed by a 6-digit OTP with resend timer and lockout after 5 attempts.', demo, 'High', 'Done', -8, 15, 10),
    T(bank, 'Build transaction history API', 'Paginated transactions endpoint with filters for date range, type and amount.', rahul, 'High', 'In Progress', 2, 8),
    T(bank, 'Set up CI/CD pipeline with GitHub Actions', 'Lint, test and build on every PR; auto-deploy main to staging.', ananya, 'Medium', 'Done', -2, 9, 3),
    T(bank, 'Write end-to-end test cases', 'Cover login, fund transfer and statement download flows.', karthik, 'Medium', 'Todo', 6, 5),
    T(bank, 'Implement biometric authentication', 'Fingerprint / Face ID unlock using the device keystore with a PIN fallback.', demo, 'High', 'Todo', 9, 3),
    T(bank, 'Fix balance refresh bug on Android', 'Balance does not refresh after a transfer until the app is restarted. Reproduce and fix.', karthik, 'High', 'In Progress', -1, 4),
    T(bank, 'Containerize services with Docker', 'Dockerfiles and docker-compose for API, database and Redis.', ananya, 'Low', 'Done', 1, 7, 1),

    T(study, 'Research LLM APIs and pricing', 'Compare providers on cost, context length and latency for summarisation workloads.', demo, 'Medium', 'Done', -5, 11, 6),
    T(study, 'Create onboarding wireframes', 'Three-step onboarding: choose subjects, upload first PDF, set study goals.', priya, 'Medium', 'In Progress', 4, 6),
    T(study, 'Build PDF upload and parsing module', 'Upload PDFs, extract text page by page and chunk it for the summariser.', sneha, 'High', 'Todo', 10, 2),
    T(study, 'Define quiz generation prompts', 'Prompt templates for MCQ, true/false and short-answer questions with answer keys.', demo, 'Low', 'Todo', 14, 1),
    T(study, 'Plan user testing sessions', 'Recruit 8 students, prepare tasks and a feedback questionnaire.', karthik, 'Low', 'Todo', 20, 1),
  ];

  const orderCounter = {};
  const tasks = [];
  for (const d of taskDefs) {
    const key = `${d.project._id}-${d.status}`;
    orderCounter[key] = (orderCounter[key] || 0) + 1;
    const task = await Task.create({
      title: d.title,
      description: d.description,
      project: d.project._id,
      assignee: d.assignee._id,
      createdBy: demo._id,
      priority: d.priority,
      status: d.status,
      dueDate: at(d.due),
      order: orderCounter[key],
      completedAt: d.status === 'Done' ? ago(d.completed, 16) : null,
    });
    tasks.push({ task, def: d });
  }
  await setTimestamps(Task, tasks.map(({ task, def }) => ({ _id: task._id, createdAt: ago(def.created, 10) })));
  const byTitle = (title) => tasks.find((t) => t.task.title === title).task;

  // ---------- Comments ----------
  const commentDefs = [
    ['Build shopping cart with React Context', sneha, 'Cart context is wired up. Working on persisting it to localStorage now.', 30],
    ['Build shopping cart with React Context', demo, 'Nice! Make sure the cart merges with the server cart after login.', 26],
    ['Integrate Razorpay payment gateway', rahul, 'Order creation endpoint is done. Webhook verification is next.', 20],
    ['Integrate Razorpay payment gateway', priya, 'I will share the checkout success/failure screens by tomorrow.', 18],
    ['Fix balance refresh bug on Android', karthik, 'Reproduced on Android 13 and 14. Looks like a stale cache in the balance query.', 9],
    ['Fix balance refresh bug on Android', rahul, 'I can add a cache-busting header on the balance endpoint if that helps.', 6],
    ['Create onboarding wireframes', priya, 'First draft uploaded to Figma — feedback welcome!', 22],
    ['Write API documentation with Swagger', rahul, 'Reminder: this is overdue. I can help document the auth routes.', 4],
    ['Build transaction history API', demo, 'Let\'s use cursor-based pagination so infinite scroll stays smooth.', 12],
  ];
  const comments = [];
  for (const [title, author, text, h] of commentDefs) {
    const c = await Comment.create({ task: byTitle(title)._id, author: author._id, text });
    comments.push({ _id: c._id, createdAt: hoursAgo(h), author, title });
  }
  await setTimestamps(Comment, comments);

  // ---------- Activity ----------
  const activityRows = [];
  projects.forEach((p, i) => activityRows.push({
    user: demo._id, project: p._id, action: 'project_created', entityType: 'project', entityId: p._id,
    message: `created project "${p.name}"`, createdAt: ago([18, 16, 12][i], 10),
  }));
  tasks.forEach(({ task, def }) => {
    activityRows.push({
      user: demo._id, project: def.project._id, action: 'task_created', entityType: 'task', entityId: task._id,
      message: `created task "${task.title}"`, createdAt: ago(def.created, 10, 15),
    });
    if (def.status === 'Done') {
      activityRows.push({
        user: def.assignee._id, project: def.project._id, action: 'status_changed', entityType: 'task', entityId: task._id,
        message: `moved "${task.title}" to Done`, createdAt: ago(def.completed, 16),
      });
    } else if (def.status === 'In Progress') {
      activityRows.push({
        user: def.assignee._id, project: def.project._id, action: 'status_changed', entityType: 'task', entityId: task._id,
        message: `moved "${task.title}" to In Progress`, createdAt: ago(Math.max(def.created - 2, 0), 12),
      });
    }
  });
  comments.forEach((c) => {
    const task = byTitle(c.title);
    activityRows.push({
      user: c.author._id, project: task.project, action: 'comment_added', entityType: 'comment', entityId: c._id,
      message: `commented on "${task.title}"`, createdAt: c.createdAt,
    });
  });
  const createdActivities = await Activity.insertMany(activityRows.map(({ createdAt, ...rest }) => rest));
  await setTimestamps(Activity, createdActivities.map((a, i) => ({ _id: a._id, createdAt: activityRows[i].createdAt })));

  // ---------- Notifications for the demo user ----------
  const notifRows = [
    { actor: rahul, type: 'comment', message: 'Rahul Verma commented on "Write API documentation with Swagger"', task: 'Write API documentation with Swagger', read: false, h: 4 },
    { actor: karthik, type: 'status_change', message: 'Karthik Nair moved "Fix balance refresh bug on Android" to In Progress', task: 'Fix balance refresh bug on Android', read: false, h: 10 },
    { actor: null, type: 'deadline', message: 'Deadline approaching: "Build transaction history API" is due in 2 days', task: 'Build transaction history API', read: false, h: 14 },
    { actor: ananya, type: 'status_change', message: 'Ananya Gupta moved "Containerize services with Docker" to Done', task: 'Containerize services with Docker', read: true, h: 26 },
    { actor: sneha, type: 'comment', message: 'Sneha Iyer commented on "Build shopping cart with React Context"', task: 'Build shopping cart with React Context', read: true, h: 30 },
    { actor: priya, type: 'info', message: 'Priya Reddy shared onboarding wireframes in "AI Study Assistant"', task: 'Create onboarding wireframes', read: true, h: 48 },
  ];
  const notifs = await Notification.insertMany(notifRows.map((n) => ({
    user: demo._id, actor: n.actor ? n.actor._id : null, type: n.type, message: n.message,
    link: `/tasks?task=${byTitle(n.task)._id}`, read: n.read,
  })));
  await setTimestamps(Notification, notifs.map((n, i) => ({ _id: n._id, createdAt: hoursAgo(notifRows[i].h) })));

  console.log(`🌱 Seeded ${users.length} users, ${projects.length} projects, ${tasks.length} tasks, ${comments.length} comments, ${activityRows.length} activities, ${notifs.length} notifications`);
}

module.exports = { seedDatabase };
