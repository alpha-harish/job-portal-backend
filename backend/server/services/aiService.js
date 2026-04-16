const pdf = require('pdf-parse');

const AI_UNAVAILABLE = {
  success: false,
  message: 'AI unavailable',
};

const extractPdfTextFromBuffer = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (err) {
    console.log("PDF PARSE ERROR:", err);
    return null;
  }
};

const analyzeResumeText = async ({ text, jobDescription }) => {
  try {
    if (!process.env.HF_API_TOKEN) {
      console.log("HF TOKEN missing");
      return AI_UNAVAILABLE;
    }

    const prompt = `
Analyze this resume and return JSON only:

{
score: number (0-100),
skills: string[],
suggestions: string[],
summary: string
}

Resume:
${text.slice(0, 3000)}

Job Description:
${jobDescription || "Not provided"}
`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 300,
          },
        }),
      }
    );

    console.log("HF Status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.log("HF ERROR:", errText);
      return AI_UNAVAILABLE;
    }

    const data = await response.json();

    console.log("HF RAW RESPONSE:", data);

    const output = data?.[0]?.generated_text;

    if (!output) {
      console.log("HF empty output");
      return AI_UNAVAILABLE;
    }

    // try parse JSON
    let parsed;

    try {
      parsed = JSON.parse(output);
    } catch {
      parsed = {
        score: 70,
        skills: [],
        suggestions: ["Improve resume formatting"],
        summary: output.slice(0, 200),
      };
    }

    return {
      success: true,
      analysis: parsed,
    };

  } catch (err) {
    console.log("HF CALL ERROR:", err);
    return AI_UNAVAILABLE;
  }
};

module.exports = {
  extractPdfTextFromBuffer,
  analyzeResumeText,
  AI_UNAVAILABLE,
};