const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    salary: {
      type: Number,
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ title: 1 });
jobSchema.index({ company: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ salary: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ title: 1, location: 1 });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
