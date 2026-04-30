import mammoth from "mammoth";
import { OpenAI } from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    // 🔹 raw request → buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // 🔹 DOCX → TEXT
    const { value } = await mammoth.extractRawText({ buffer });

    if (!value || value.trim() === "") {
      return res.status(400).json({
        result: "❌ File read नहीं हो पाई। Proper .docx upload करें",
      });
    }

    // 🔹 OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are a professional survey designer.

Analyze the survey below:

${value}

For each question:
- Improve clarity
- Detect bias
- Improve answer options
- Suggest better structure

Also:
- Suggest survey type
- Improve tone

Return clean structured output.
`,
    });

    res.status(200).json({
      result: response.output_text || "⚠️ No response",
    });

  } catch (err) {
    console.error("ERROR:", err);

    res.status(500).json({
      result: "❌ Error: " + err.message,
    });
  }
}
