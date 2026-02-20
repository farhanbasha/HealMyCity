import os
import base64
import google.generativeai as genai
from typing import Dict, Any
from PIL import Image
import io

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def analyze_issue_image(image_data: bytes) -> Dict[str, Any]:
    """
    Analyze an image using Google Gemini Vision API and extract issue details.
    
    Args:
        image_data: Image file bytes
        
    Returns:
        Dictionary with title, description, category, and severity_score
    """
    try:
        # Initialize Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Convert image bytes to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Create prompt for issue analysis
        prompt = """Analyze this image of a civic issue (like potholes, water leaks, trash, broken infrastructure, etc.) and provide a JSON response with the following structure:
{
    "title": "A concise, descriptive title (max 60 characters)",
    "description": "A detailed description of the issue (2-3 sentences)",
    "category": "One of: road, water, sanitation, infrastructure, safety, other",
    "severity_score": A number between 1-10 where 1 is minor and 10 is critical/urgent
}

Be specific and accurate. Consider factors like:
- Size and extent of the damage/problem
- Potential safety hazards
- Impact on public use
- Urgency for repair

Return ONLY valid JSON, no additional text."""

        # Generate content
        response = model.generate_content([prompt, image])
        
        # Extract JSON from response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse JSON response
        import json
        result = json.loads(response_text)
        
        # Validate and normalize response
        category = result.get("category", "other").lower()
        valid_categories = ["road", "water", "sanitation", "infrastructure", "safety", "other"]
        if category not in valid_categories:
            category = "other"
        
        severity_score = int(result.get("severity_score", 5))
        if severity_score < 1:
            severity_score = 1
        elif severity_score > 10:
            severity_score = 10
        
        return {
            "title": result.get("title", "Civic Issue Detected"),
            "description": result.get("description", "An issue has been detected in the image."),
            "category": category,
            "severity_score": severity_score
        }
        
    except Exception as e:
        # Fallback response on error
        print(f"Error analyzing image: {str(e)}")
        return {
            "title": "Civic Issue Detected",
            "description": "An issue has been detected. Please review the image for details.",
            "category": "other",
            "severity_score": 5
        }
