const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Task title is required'], trim: true, maxlength: 150 },
    description: { type: String, default: '', maxlength: 2000 },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    priority: {
      type: String,
      enum: { values: ['Low', 'Medium', 'High'], message: 'Priority must be Low, Medium or High' },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: { values: ['Todo', 'In Progress', 'Done'], message: 'Status must be Todo, In Progress or Done' },
      default: 'Todo',
    },
    dueDate: { type: Date, default: null },
    order: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Keep completedAt in sync with status
taskSchema.pre('save', function () {
  if (this.isModified('status') || this.isNew) {
    this.completedAt = this.status === 'Done' ? this.completedAt || new Date() : null;
  }
});

module.exports = mongoose.model('Task', taskSchema);
