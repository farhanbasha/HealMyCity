import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Allow up to 60s for AI image analysis on Vercel

const SYSTEM_INSTRUCTION = `
You are a senior city infrastructure inspector AI.

Your job is to analyze the uploaded image and determine whether it shows
a civic or infrastructure issue that needs to be reported to the local
municipal authority.

**Valid civic issues include** (but are not limited to):
- Potholes, cracked roads, damaged sidewalks
- Water leaks, broken pipes, sewage overflow
- Overflowing garbage bins, illegal dumping
- Broken or non-functional street lights
- Damaged public property (benches, signs, railings)
- Fallen trees blocking roads

**If the image does NOT show a civic issue** (e.g., a selfie, a pet photo,
food, a random object, a landscape with no problem), set \`is_civic_issue\`
to \`false\`, category to "Not Applicable", severity_score to 1, and provide
a brief explanation in the title and description.

You MUST respond with ONLY a valid JSON object matching this exact schema
(no markdown, no explanation, no extra text):

{
  "is_civic_issue": true or false,
  "category": "string",
  "severity_score": integer (1-10),
  "title": "string",
  "description": "string"
}
`;

// Candidate models with automatic fallback in case of high demand / spikes
const CANDIDATE_MODELS = [
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
];

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { detail: "No file provided in request" },
                { status: 400 }
            );
        }

        const buffer = await file.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString("base64");
        const mimeType = file.type || "image/jpeg";

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    detail: "GEMINI_API_KEY environment variable is not configured on the server. Please add GEMINI_API_KEY to your environment variables.",
                },
                { status: 500 }
            );
        }

        let lastError = "";

        for (const model of CANDIDATE_MODELS) {
            try {
                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            systemInstruction: {
                                parts: [{ text: SYSTEM_INSTRUCTION }],
                            },
                            contents: [
                                {
                                    parts: [
                                        {
                                            inlineData: {
                                                mimeType,
                                                data: base64Data,
                                            },
                                        },
                                        {
                                            text: "Analyze this image and identify any civic infrastructure problem according to your system instructions. Respond with strict JSON matching the schema.",
                                        },
                                    ],
                                },
                            ],
                            generationConfig: {
                                responseMimeType: "application/json",
                                temperature: 0.2,
                            },
                        }),
                    }
                );

                if (!res.ok) {
                    const errBody = await res.text();
                    lastError = `${model} returned HTTP ${res.status}: ${errBody}`;
                    console.warn(`[Gemini Route] ${model} unavailable, trying fallback:`, lastError);
                    continue;
                }

                const data = await res.json();
                const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!rawText) {
                    lastError = `Model ${model} returned empty content`;
                    continue;
                }

                let clean = rawText.trim();
                if (clean.startsWith("```")) {
                    clean = clean.split("\n").slice(1).join("\n");
                }
                if (clean.endsWith("```")) {
                    clean = clean.slice(0, -3).trim();
                }

                const parsed = JSON.parse(clean);
                return NextResponse.json(parsed);
            } catch (err: unknown) {
                lastError = err instanceof Error ? err.message : String(err);
                console.warn(`[Gemini Route] Error calling ${model}:`, lastError);
            }
        }

        return NextResponse.json(
            { detail: `All Gemini model candidates failed: ${lastError}` },
            { status: 500 }
        );
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Internal server error";
        return NextResponse.json({ detail: message }, { status: 500 });
    }
}
