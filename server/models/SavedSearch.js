const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    search: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    company: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    minSalary: {
      type: Number,
      required: false,
    },
    maxSalary: {
      type: Number,
      required: false,
    },
    lastCheckedAt: {
      type: Date,
      required: false,
      default: Date.now,
    },
  },
  { timestamps: true }
);

savedSearchSchema.index({ search: 1, location: 1 });

module.exports = mongoose.model('SavedSearch', savedSearchSchema);
