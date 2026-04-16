const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    resume: {
      url: {
        type: String,
        required: false,
      },
      public_id: {
        type: String,
        required: false,
      },
      aiAnalysis: {
        score: {
          type: Number,
          required: false,
        },
        skills: {
          type: [String],
          required: false,
        },
        suggestions: {
          type: [String],
          required: false,
        },
        summary: {
          type: String,
          required: false,
        },
        analyzedAt: {
          type: Date,
          required: false,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ user: 1, job: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
