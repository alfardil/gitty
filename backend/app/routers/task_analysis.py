from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import json
import asyncio

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

        CRITICAL: You must respond with ONLY a valid JSON object in this exact format, with no additional text or explanation:
        {{
            "estimated_hours": <number>,
            "complexity": <1-5>,
            "task_type": "<bug_fix|feature|refactor|testing|documentation|other>",
            "confidence": <0.0-1.0>,
            "reasoning": "<brief explanation of your estimates>"
        }}

        Guidelines:
        - Estimated hours should be realistic for a developer (0.5 to 100 hours)
        - Complexity must be an integer between 1 and 5 (1=very easy, 5=very complex)
        - Task type must be one of: bug_fix, feature, refactor, testing, documentation, other
        - Confidence must be a decimal between 0.0 and 1.0
        - Reasoning should be concise but informative
        - Do not include any text before or after the JSON object
        """

        # Call your existing GPT implementation
        from ..services.o4_mini_service import OpenAIo4Service

        try:
            # Create GPT service instance and call it
            gpt_service = OpenAIo4Service()
            gpt_response = gpt_service.call_o4_api(
                system_prompt="You are an expert software development task analyzer. You must respond with ONLY a valid JSON object in the exact format requested. Do not include any explanatory text, markdown formatting, or additional content outside the JSON object.",
                data={"prompt": prompt},
            )

            # Debug: Log the raw response
            print(f"DEBUG: Raw GPT response: {gpt_response}")

            # Clean the response - remove any markdown formatting or extra text
            cleaned_response = gpt_response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()

            print(f"DEBUG: Cleaned response: {cleaned_response}")

            # Parse the JSON response
            analysis_result = json.loads(cleaned_response)

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

            # Debug: Log the parsed values
            print(f"DEBUG: Parsed complexity: {complexity}")
            print(f"DEBUG: Parsed estimated_hours: {estimated_hours}")
            print(f"DEBUG: Parsed task_type: {task_type}")
            print(f"DEBUG: Parsed confidence: {confidence}")

            # Validate ranges
            if not (0 < estimated_hours <= 100):
                print(
                    f"DEBUG: Invalid estimated_hours {estimated_hours}, using fallback 4.0"
                )
                estimated_hours = 4.0  # Default fallback
            if not (1 <= complexity <= 5):
                print(f"DEBUG: Invalid complexity {complexity}, using fallback 3")
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

        except json.JSONDecodeError as e:
            # If GPT response isn't valid JSON, use fallback heuristics
            print(f"DEBUG: JSON decode error: {e}")
            print(f"DEBUG: Failed to parse response: {gpt_response}")
            print(f"DEBUG: Cleaned response that failed: {cleaned_response}")
            return await _fallback_analysis(task_data)
        except Exception as e:
            # If GPT service fails, use fallback heuristics
            print(f"DEBUG: GPT analysis failed: {e}")
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
    print(f"DEBUG: Fallback analysis - priority: {priority}")
    if priority == "high":
        complexity = 4
        print(f"DEBUG: High priority detected, setting complexity to 4")
    elif priority == "low":
        complexity = 2
        print(f"DEBUG: Low priority detected, setting complexity to 2")
    else:
        print(f"DEBUG: Medium priority, keeping complexity at 3")

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


@router.post("/stream-analyze")
async def stream_analyze_task(request: TaskAnalysisRequest):
    """
    Stream task analysis in real-time using Server-Sent Events.
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

        async def event_generator():
            try:
                # Send initial status
                yield f"data: {json.dumps({'type': 'status', 'status': 'starting', 'message': 'Starting task analysis...'})}\n\n"

                # Send analysis step
                yield f"data: {json.dumps({'type': 'status', 'status': 'analyzing', 'message': 'Analyzing task complexity and requirements...'})}\n\n"

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

                CRITICAL: You must respond with ONLY a valid JSON object in this exact format, with no additional text or explanation:
                {{
                    "estimated_hours": <number>,
                    "complexity": <1-5>,
                    "task_type": "<bug_fix|feature|refactor|testing|documentation|other>",
                    "confidence": <0.0-1.0>,
                    "reasoning": "<brief explanation of your estimates>"
                }}

                Guidelines:
                - Estimated hours should be realistic for a developer (0.5 to 100 hours)
                - Complexity must be an integer between 1 and 5 (1=very easy, 5=very complex)
                - Task type must be one of: bug_fix, feature, refactor, testing, documentation, other
                - Confidence must be a decimal between 0.0 and 1.0
                - Reasoning should be concise but informative
                - Do not include any text before or after the JSON object
                """

                # Send GPT processing step
                yield f"data: {json.dumps({'type': 'status', 'status': 'gpt_processing', 'message': 'Processing with AI model...'})}\n\n"

                # Call GPT service
                from ..services.o4_mini_service import OpenAIo4Service

                try:
                    gpt_service = OpenAIo4Service()
                    gpt_response = gpt_service.call_o4_api(
                        system_prompt="You are an expert software development task analyzer. You must respond with ONLY a valid JSON object in the exact format requested. Do not include any explanatory text, markdown formatting, or additional content outside the JSON object.",
                        data={"prompt": prompt},
                    )

                    # Send processing complete
                    yield f"data: {json.dumps({'type': 'status', 'status': 'processing_complete', 'message': 'AI analysis complete, validating results...'})}\n\n"

                    # Clean the response - remove any markdown formatting or extra text
                    cleaned_response = gpt_response.strip()
                    if cleaned_response.startswith("```json"):
                        cleaned_response = cleaned_response[7:]
                    if cleaned_response.endswith("```"):
                        cleaned_response = cleaned_response[:-3]
                    cleaned_response = cleaned_response.strip()

                    # Parse and validate the response
                    analysis_result = json.loads(cleaned_response)

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
                        estimated_hours = 4.0
                    if not (1 <= complexity <= 5):
                        complexity = 3
                    if task_type not in [
                        "bug_fix",
                        "feature",
                        "refactor",
                        "testing",
                        "documentation",
                        "other",
                    ]:
                        task_type = "other"
                    if not (0.0 <= confidence <= 1.0):
                        confidence = 0.7

                    # Send final results
                    yield f"data: {json.dumps({'type': 'complete', 'result': {
                        'estimated_hours': estimated_hours,
                        'complexity': complexity,
                        'task_type': task_type,
                        'confidence': confidence,
                        'reasoning': reasoning,
                    }})}\n\n"

                except json.JSONDecodeError as e:
                    # Fallback to heuristics
                    print(f"DEBUG: JSON decode error in streaming: {e}")
                    print(f"DEBUG: Failed to parse response: {gpt_response}")
                    print(f"DEBUG: Cleaned response that failed: {cleaned_response}")
                    yield f"data: {json.dumps({'type': 'status', 'status': 'fallback', 'message': 'Using fallback analysis...'})}\n\n"

                    fallback_result = await _fallback_analysis(task_data)
                    yield f"data: {json.dumps({'type': 'complete', 'result': {
                        'estimated_hours': fallback_result.estimated_hours,
                        'complexity': fallback_result.complexity,
                        'task_type': fallback_result.task_type,
                        'confidence': fallback_result.confidence,
                        'reasoning': fallback_result.reasoning,
                    }})}\n\n"

                except Exception as e:
                    # Fallback to heuristics
                    yield f"data: {json.dumps({'type': 'status', 'status': 'fallback', 'message': f'AI analysis failed, using fallback: {str(e)}'})}\n\n"

                    fallback_result = await _fallback_analysis(task_data)
                    yield f"data: {json.dumps({'type': 'complete', 'result': {
                        'estimated_hours': fallback_result.estimated_hours,
                        'complexity': fallback_result.complexity,
                        'task_type': fallback_result.task_type,
                        'confidence': fallback_result.confidence,
                        'reasoning': fallback_result.reasoning,
                    }})}\n\n"

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stream analysis failed: {str(e)}")
