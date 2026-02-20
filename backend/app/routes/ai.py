from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.gemini import analyze_issue_image
from typing import Dict, Any

router = APIRouter(prefix="/api", tags=["AI"])

@router.post("/analyze-issue")
async def analyze_issue(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Analyze an uploaded image using Gemini Vision API.
    
    Accepts an image file and returns AI-generated details:
    - title: Short descriptive title
    - description: Detailed description
    - category: Issue category (road, water, sanitation, etc.)
    - severity_score: Severity rating from 1-10
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Validate file size (max 10MB)
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size must be less than 10MB")
    
    try:
        # Analyze image with Gemini
        result = analyze_issue_image(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")
