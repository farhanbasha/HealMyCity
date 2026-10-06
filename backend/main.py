"""
HealMyCity — FastAPI Backend
============================
Main application entry point.

Provides the /api/analyze-issue/ endpoint that accepts an uploaded image,
sends it to Google Gemini for analysis, and returns a structured
JSON response describing any civic issue detected in the image.

Run with:
    uvicorn main:app --reload --port 8000
"""

import json
import traceback
from typing import Optional

from dotenv import load_dotenv
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from google import genai
from google.genai import types

# ──────────────────────────────────────────────
# 1. LOAD ENVIRONMENT VARIABLES & CONFIGURE GEMINI
# ──────────────────────────────────────────────

load_dotenv()  # reads .env in the current directory

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not set. "
        "Create a .env file with your key — see .env for the template."
    )

# Initialize official google-genai client
client = genai.Client(api_key=GEMINI_API_KEY)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

# ──────────────────────────────────────────────
# 3. FASTAPI APP + CORS
# ──────────────────────────────────────────────

app = FastAPI(
    title="HealMyCity API",
    description="Backend API for the crowdsourced civic issue reporting platform.",
    version="1.0.0",
)

# Allow the Next.js frontend (localhost:3000) to call this API.
# In production, replace with your actual domain(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# 4. PYDANTIC MODELS
# ──────────────────────────────────────────────


class IssueAnalysisResult(BaseModel):
    """
    Structured response from the Gemini AI describing the civic issue
    detected in the uploaded image.
    """

    is_civic_issue: bool = Field(
        ...,
        description=(
            "True if the image shows a valid civic problem "
            "(pothole, water leak, garbage, broken street light, etc.), "
            "False otherwise."
        ),
    )
    category: str = Field(
        ...,
        description=(
            'Category of the issue, e.g. "Roads", "Water & Sanitation", '
            '"Electricity", "Waste Management", "Public Safety", "Other".'
        ),
    )
    severity_score: int = Field(
        ...,
        ge=1,
        le=10,
        description="Severity on a 1-10 scale (1 = minor, 10 = critical).",
    )
    title: str = Field(
        ...,
        description=(
            'A short, punchy title, e.g. "Severe Pothole on Main Road".'
        ),
    )
    description: str = Field(
        ...,
        description=(
            "A detailed 1-2 sentence description of the visible problem."
        ),
    )


# ──────────────────────────────────────────────
# 5. SYSTEM INSTRUCTION FOR GEMINI
# ──────────────────────────────────────────────

SYSTEM_INSTRUCTION = """
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
food, a random object, a landscape with no problem), set `is_civic_issue`
to `false`, category to "Not Applicable", severity_score to 1, and provide
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
"""

# ──────────────────────────────────────────────
# 6. ENDPOINTS
# ──────────────────────────────────────────────


@app.get("/")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "service": "HealMyCity API"}


@app.post("/api/analyze-issue/", response_model=IssueAnalysisResult)
async def analyze_issue(file: UploadFile = File(...)):
    """
    Accept an uploaded image, send it to Gemini 1.5 Flash for analysis,
    and return a structured JSON response describing any civic issue.

    - **file**: An image file (JPEG, PNG, WebP, etc.)

    Returns an `IssueAnalysisResult` JSON object.
    """

    # ── Validate file type ──────────────────────────────────────────
    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type: {file.content_type}. "
                f"Allowed types: {', '.join(allowed_types)}"
            ),
        )

    # ── Read image bytes ────────────────────────────────────────────
    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Cap file size at 10 MB
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum allowed size is 10 MB.",
        )

    # ── Build the Gemini request ────────────────────────────────────
    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type=file.content_type,
    )

    try:
        # Call Gemini with the system instruction + the image
        response = await client.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=[SYSTEM_INSTRUCTION, image_part],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,  # Low temperature for consistent output
            ),
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Gemini API call failed: {str(e)}",
        )

    # ── Parse the AI response ───────────────────────────────────────
    try:
        raw_text = response.text.strip()

        # Gemini may wrap the JSON in markdown code fences — strip them
        if raw_text.startswith("```"):
            # Remove the opening ``` (possibly with "json" label)
            raw_text = raw_text.split("\n", 1)[1] if "\n" in raw_text else raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3].strip()

        parsed = json.loads(raw_text)
        result = IssueAnalysisResult(**parsed)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to parse Gemini response as JSON. "
                f"Raw response: {response.text[:500]}"
            ),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to validate Gemini response: {str(e)}",
        )

    return result
