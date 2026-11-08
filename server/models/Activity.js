const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    action: { type: String, required: true }, // e.g. task_created, status_changed
    entityType: { type: String, enum: ['project', 'task', 'comment', 'member'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
