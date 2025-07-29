from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import json

router = APIRouter(prefix="/task-analysis", tags=["task-analysis"])


class TaskAnalysisRequest(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str
    due_date: Optional[str] = None
    tags: Optional[List[str]] = None


class TaskAnalysisResponse(BaseModel):
    estimated_hours: float
    complexity: int
    task_type: str
    confidence: float
    reasoning: str


@router.post("/analyze", response_model=TaskAnalysisResponse)
async def analyze_task(request: TaskAnalysisRequest):
    """
    Analyze a task using AI to determine estimated hours, complexity, and task type.
    """
    try:
        # Prepare the task data for analysis
        task_data = {
            "title": request.title,
            "description": request.description or "",
            "priority": request.priority,
            "due_date": request.due_date,
            "tags": request.tags or [],
        }

        # Create the prompt for GPT analysis
        prompt = f"""
        Analyze the following software development task and provide estimates for:
        1. Estimated hours (realistic development time)
        2. Complexity (1-5 scale, where 1=very easy, 5=very complex)
        3. Task type (bug_fix, feature, refactor, testing, documentation, or other)
        4. Confidence level (0.0-1.0)
        5. Brief reasoning for your estimates

        Task Information:
        - Title: {task_data['title']}
        - Description: {task_data['description']}
        - Priority: {task_data['priority']}
        - Due Date: {task_data['due_date'] or 'Not specified'}
        - Tags: {', '.join(task_data['tags']) if task_data['tags'] else 'None'}

        Please respond with a JSON object in this exact format:
        {{
            "estimated_hours": <number>,
            "complexity": <1-5>,
            "task_type": "<bug_fix|feature|refactor|testing|documentation|other>",
            "confidence": <0.0-1.0>,
            "reasoning": "<brief explanation of your estimates>"
        }}

        Guidelines:
        - Estimated hours should be realistic for a developer
        - Complexity should consider technical difficulty, scope, and dependencies
        - Task type should be based on the primary purpose of the work
        - Confidence should reflect how clear the task requirements are
        - Reasoning should be concise but informative
        """

        # Call your existing GPT implementation
        from ..services.o4_mini_service import OpenAIo4Service

        try:
            # Create GPT service instance and call it
            gpt_service = OpenAIo4Service()
            gpt_response = gpt_service.call_o4_api(
                system_prompt="You are an expert software development task analyzer. Analyze the given task and provide estimates in the exact JSON format requested.",
                data={"prompt": prompt},
            )

            # Parse the JSON response
            analysis_result = json.loads(gpt_response)

            # Validate the response structure
            required_fields = [
                "estimated_hours",
                "complexity",
                "task_type",
                "confidence",
                "reasoning",
            ]
            for field in required_fields:
                if field not in analysis_result:
                    raise ValueError(f"Missing required field: {field}")

            # Validate and sanitize the values
            estimated_hours = float(analysis_result["estimated_hours"])
            complexity = int(analysis_result["complexity"])
            task_type = str(analysis_result["task_type"])
            confidence = float(analysis_result["confidence"])
            reasoning = str(analysis_result["reasoning"])

            # Validate ranges
            if not (0 < estimated_hours <= 100):
                estimated_hours = 4.0  # Default fallback
            if not (1 <= complexity <= 5):
                complexity = 3  # Default fallback
            if task_type not in [
                "bug_fix",
                "feature",
                "refactor",
                "testing",
                "documentation",
                "other",
            ]:
                task_type = "other"  # Default fallback
            if not (0.0 <= confidence <= 1.0):
                confidence = 0.7  # Default fallback

            return TaskAnalysisResponse(
                estimated_hours=estimated_hours,
                complexity=complexity,
                task_type=task_type,
                confidence=confidence,
                reasoning=reasoning,
            )

        except json.JSONDecodeError:
            # If GPT response isn't valid JSON, use fallback heuristics
            return await _fallback_analysis(task_data)
        except Exception as e:
            # If GPT service fails, use fallback heuristics
            print(f"GPT analysis failed: {e}")
            return await _fallback_analysis(task_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Task analysis failed: {str(e)}")


async def _fallback_analysis(task_data: dict) -> TaskAnalysisResponse:
    """
    Fallback analysis using simple heuristics when GPT is unavailable.
    """
    title = task_data["title"].lower()
    description = (task_data["description"] or "").lower()
    priority = task_data["priority"]
    tags = [tag.lower() for tag in (task_data["tags"] or [])]

    full_text = f"{title} {description} {' '.join(tags)}"

    # Estimate hours based on priority and content
    estimated_hours = 4.0  # Default
    if priority == "high":
        estimated_hours = 8.0
    elif priority == "low":
        estimated_hours = 2.0

    # Adjust based on keywords
    if any(word in full_text for word in ["bug", "fix"]):
        estimated_hours = max(1.0, estimated_hours * 0.5)
    if any(word in full_text for word in ["feature", "implement"]):
        estimated_hours = estimated_hours * 1.5
    if any(word in full_text for word in ["refactor", "optimize"]):
        estimated_hours = estimated_hours * 1.2

    # Determine complexity
    complexity = 3  # Default medium
    if priority == "high":
        complexity = 4
    elif priority == "low":
        complexity = 2

    if len(description) > 200:
        complexity = min(5, complexity + 1)
    if any(word in full_text for word in ["simple", "basic"]):
        complexity = max(1, complexity - 1)
    if any(word in full_text for word in ["complex", "advanced"]):
        complexity = min(5, complexity + 1)

    # Determine task type
    task_type = "other"
    if any(word in full_text for word in ["bug", "fix", "issue"]):
        task_type = "bug_fix"
    elif any(word in full_text for word in ["feature", "implement", "add"]):
        task_type = "feature"
    elif any(word in full_text for word in ["refactor", "optimize", "improve"]):
        task_type = "refactor"
    elif any(word in full_text for word in ["test", "testing", "unit"]):
        task_type = "testing"
    elif any(word in full_text for word in ["doc", "readme", "comment"]):
        task_type = "documentation"

    # Calculate confidence
    confidence = 0.7  # Base confidence
    if task_type != "other":
        confidence += 0.2
    if len(description) > 50:
        confidence += 0.1

    return TaskAnalysisResponse(
        estimated_hours=round(estimated_hours, 1),
        complexity=complexity,
        task_type=task_type,
        confidence=min(1.0, confidence),
        reasoning="Analysis completed using fallback heuristics due to GPT service unavailability.",
    )
