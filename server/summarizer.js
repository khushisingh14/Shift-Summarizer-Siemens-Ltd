const https = require("https");

const SYSTEM_PROMPT = `You are an AI assistant for Siemens Dahod Ltd., a locomotive manufacturing and maintenance plant in India.
Your job is to read raw shift handover notes written by floor operators and extract structured information.

Return ONLY a valid JSON object with exactly these 6 fields. No explanation, no text outside the JSON:
{
  "pending_tasks": ["array of incomplete tasks that the next shift must action"],
  "equipment_issues": ["array of machines or equipment with problems"],
  "safety_observations": ["array of safety incidents, near-misses, or hazards reported"],
  "material_shortages": ["array of parts or materials that are low or out of stock"],
  "priorities": ["top 2-3 most urgent things for the incoming shift to act on"],
  "loco_units_affected": ["array of locomotive unit numbers mentioned with issues e.g. WDG4-112, WAP7-045"]
}

Rules:
- Each item in an array must be one clear, concise sentence.
- If a field has nothing to report, return an empty array [].
- Extract only what is explicitly mentioned in the notes.
- Do not invent or assume information not present in the notes.`;

function summarizeNotes(noteText) {
  return new Promise((resolve, reject) => {
    if (!process.env.GROQ_API_KEY) {
      reject(new Error("GROQ_API_KEY is missing from server/.env"));
      return;
    }

    const requestBody = JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Summarize these shift notes:\n\n${noteText}` }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000
    });

    const options = {
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Length": Buffer.byteLength(requestBody)
      }
    };

    const request = https.request(options, (response) => {
      let responseBody = "";
      response.on("data", (chunk) => responseBody += chunk);
      response.on("end", () => {
        try {
          const parsed = JSON.parse(responseBody);
          if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error(parsed?.error?.message || `Groq API error: status ${response.statusCode}`);
          }
          const text = parsed.choices[0].message.content;
          resolve(JSON.parse(text));
        } catch (err) {
          reject(new Error(`Failed to parse Groq response: ${err.message}`));
        }
      });
    });

    request.on("error", reject);
    request.write(requestBody);
    request.end();
  });
}

module.exports = { summarizeNotes };
