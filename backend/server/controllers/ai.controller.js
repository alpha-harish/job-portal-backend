const mongoose = require('mongoose');

const Application = require('../models/Application');
const Job = require('../models/Job');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
  extractPdfTextFromBuffer,
  analyzeResumeText,
  AI_UNAVAILABLE,
} = require('../services/aiService');

// if fetch not available in your node version
// npm install node-fetch
// then uncomment below line
// const fetch = require('node-fetch');

const analyzeResume = asyncHandler(async (req, res) => {
  const userId = req.user && req.user.id;
  const { resumeId } = req.params;
  const { jobId } = req.body || {};

  if (!resumeId || !mongoose.Types.ObjectId.isValid(resumeId)) {
    throw new AppError('Invalid ID', 400);
  }

  const application = await Application.findById(resumeId);
  if (!application) {
    throw new AppError('Resume not found', 404);
  }

  if (String(application.user) !== String(userId)) {
    throw new AppError('Access denied', 403);
  }

  const resumeUrl = application.resume && application.resume.url;
  if (!resumeUrl) {
    throw new AppError('Resume not found', 404);
  }

  let jobDescription;
  if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
    const job = await Job.findById(jobId).select('description').lean();
    jobDescription = job ? job.description : undefined;
  }

  try {
    console.log("========== AI ANALYSIS START ==========");
    console.log("Resume URL:", resumeUrl);

    const pdfResponse = await fetch(resumeUrl);

    console.log("PDF response status:", pdfResponse.status);

    if (!pdfResponse.ok) {
      console.log("PDF fetch failed");
      return res
        .status(503)
        .json({ success: false, message: AI_UNAVAILABLE.message });
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("PDF buffer size:", buffer.length);

    const text = await extractPdfTextFromBuffer(buffer);

    console.log("Extracted text length:", text ? text.length : 0);

    if (!text) {
      console.log("No text extracted from PDF");
      return res
        .status(503)
        .json({ success: false, message: AI_UNAVAILABLE.message });
    }

    const result = await analyzeResumeText({ text, jobDescription });

    console.log("AI result:", result);

    if (!result || !result.success) {
      console.log("AI returned failure");
      return res
        .status(503)
        .json({ success: false, message: AI_UNAVAILABLE.message });
    }

    application.resume.aiAnalysis = {
      score: result.analysis.score,
      skills: result.analysis.skills,
      suggestions: result.analysis.suggestions,
      summary: result.analysis.summary,
      analyzedAt: new Date(),
    };

    await application.save();

    console.log("AI analysis saved successfully");

    return res.status(200).json({
      success: true,
      analysis: application.resume.aiAnalysis,
    });

  } catch (err) {
    console.log("========== AI ERROR ==========");
    console.error(err);

    return res
      .status(503)
      .json({ success: false, message: AI_UNAVAILABLE.message });
  }
});

module.exports = {
  analyzeResume,
};