const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Project name is required'], trim: true, maxlength: 100 },
    description: { type: String, default: '', maxlength: 1000 },
    status: {
      type: String,
      enum: { values: ['Planning', 'Active', 'On Hold', 'Completed'], message: 'Invalid project status' },
      default: 'Planning',
    },
    deadline: { type: Date, default: null },
    color: { type: String, default: '#6366f1' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ members: 1 });

module.exports = mongoose.model('Project', projectSchema);
