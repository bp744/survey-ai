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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `
You are a professional survey designer.

Analyze the survey:

${value}

For each question:
- Improve clarity
- Detect bias
- Improve answer options
- Suggest better structure

Also:
- Suggest survey type
- Improve tone

Return structured output.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.5",
      messages: [{ role: "user", content: prompt }],
    });

    res.status(200).json({
      result: response.choices[0].message.content,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}