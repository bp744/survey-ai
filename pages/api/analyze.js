import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    // raw request → buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // DOCX → TEXT
    const { value } = await mammoth.extractRawText({ buffer });

    if (!value || value.trim() === "") {
      return res.status(400).json({
        result: "❌ File read नहीं हो पाई। Proper .docx upload करें",
      });
    }

    // Gemini setup
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
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
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({
      result: text || "⚠️ No response",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      result: "❌ Error: " + err.message,
    });
  }
}
