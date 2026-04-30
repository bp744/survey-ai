import formidable from "formidable";
import fs from "fs";
import mammoth from "mammoth";
import { OpenAI } from "openai";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    const form = formidable({ multiples: false });

    const data = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const fileKey = Object.keys(data.files)[0];
    const file = data.files[fileKey];

    if (!file) {
      return res.status(400).json({ result: "❌ File नहीं मिली" });
    }

    const buffer = fs.readFileSync(file.filepath);

    // DOCX → TEXT
    const { value } = await mammoth.extractRawText({ buffer });

    if (!value || value.trim() === "") {
      return res.status(400).json({
        result: "❌ File empty है या read नहीं हो रही",
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are a survey expert.

Analyze this survey:

${value}

Improve questions, detect issues, suggest better options and survey type.
`,
    });

    res.status(200).json({
      result: response.output_text || "⚠️ No response",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      result: "❌ Error: " + err.message,
    });
  }
}
