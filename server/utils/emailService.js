const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("Transporter error:", error);
  } else {
    console.log("Email server ready");
  }
});

const sendEmail = async ({ to, subject, text }) => {
  const { EMAIL_USER } = process.env;
  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
};

const sendNewApplicantEmail = async ({
  to,
  jobTitle,
  seekerName,
  seekerEmail,
  resumeUrl,
}) => {
  const mailOptions = {
    from: `"Job Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New Applicant — ${jobTitle}`,
    text: `
New applicant for ${jobTitle}

Candidate Name: ${seekerName}
Candidate Email: ${seekerEmail}

Resume Link:
${resumeUrl || ''}
`,
    ...(resumeUrl
      ? {
          attachments: [
            {
              filename: 'resume.pdf',
              path: resumeUrl,
            },
          ],
        }
      : {}),
  };

  await transporter.sendMail(mailOptions);
};

const sendStatusEmail = async ({
  to,
  status,
  jobTitle,
  companyName,
  recruiterName,
}) => {
  const isAccepted = status === 'accepted';

  const subject = isAccepted
    ? `Application Accepted — ${jobTitle}`
    : `Application Update — ${jobTitle}`;

  const safeCompanyName = companyName || '';
  const safeRecruiterName = recruiterName || '';

  const text = isAccepted
    ? `
Congratulations!

Your application for "${jobTitle}" at ${safeCompanyName} has been ACCEPTED.

Recruiter: ${safeRecruiterName}

The recruiter will contact you shortly for next steps.

Best of luck!
`
    : `
Application Update

Your application for "${jobTitle}" at ${safeCompanyName} has been REJECTED.

Recruiter: ${safeRecruiterName}

Don't worry — keep applying to other opportunities.

Best wishes for your job search.
`;

  const mailOptions = {
    from: `"Job Portal" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmail,
  sendNewApplicantEmail,
  sendStatusEmail,
};
