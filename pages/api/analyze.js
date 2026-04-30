import mammoth from "mammoth";

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

    // 🔥 Gemini REST API call
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are a professional survey designer.

Analyze the survey below:

${value}

Improve questions, detect issues, suggest better options and survey type.
`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

let text = "⚠️ No response";

if (data.candidates && data.candidates.length > 0) {
  const parts = data.candidates[0]?.content?.parts;

  if (parts && parts.length > 0) {
    text = parts.map(p => p.text).join("\n");
  }
}

    res.status(200).json({
      result: text,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      result: "❌ Error: " + err.message,
    });
  }
}
