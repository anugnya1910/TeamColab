const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      enum: ['task_assigned', 'comment', 'status_change', 'project_invite', 'deadline', 'info'],
      default: 'info',
    },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
