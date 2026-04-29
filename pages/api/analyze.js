import mammoth from "mammoth";
import { OpenAI } from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    // DOCX → TEXT
    const { value } = await mammoth.extractRawText({ buffer });

    // अगर text empty है
    if (!value || value.trim() === "") {
      return res.status(400).json({
        result: "❌ File read नहीं हो पाई। कृपया सही .docx file upload करें।",
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
You are a professional survey designer and behavioral researcher.

Analyze the survey below:

${value}

For each question:
- Improve clarity
- Detect bias or confusion
- Improve answer options (non-overlapping)
- Suggest best format (MCQ, Likert, etc.)

Also:
- Identify survey goal
- Suggest best survey template
- Improve tone (simple Hindi + English mix)

Return in clear structured format.
`;

    // ✅ NEW OpenAI API (working)
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const output = response.output_text;

    res.status(200).json({
      result: output || "⚠️ No response from AI",
    });

  } catch (error) {
    console.error("ERROR:", error);

    res.status(500).json({
      result: "❌ Error आया: " + error.message,
    });
  }
}
