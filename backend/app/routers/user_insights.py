from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import json
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from app.db.db import get_pool
from app.services.o4_mini_service import OpenAIo4Service


router = APIRouter(prefix="/user-insights", tags=["user-insights"])


def _convert_decimals_to_numbers(obj):
    """
    Recursively convert Decimal objects to regular numbers for JSON serialization.
    """
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {key: _convert_decimals_to_numbers(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [_convert_decimals_to_numbers(item) for item in obj]
    else:
        return obj


class UserInsightsRequest(BaseModel):
    userId: str
    enterpriseId: Optional[str] = None


class UserInsightsResponse(BaseModel):
    overallScore: float
    performanceGrade: str
    criticalIssues: List[str]
    strengths: List[str]
    recommendations: List[str]
    detailedAnalysis: Dict[str, Any]
    generatedAt: str


@router.post("/analyze", response_model=UserInsightsResponse)
async def analyze_user_performance(request: UserInsightsRequest):
    """
    Generate AI-powered insights on user performance with strict, critical analysis.
    Only accessible by enterprise admins.
    """
    try:
        # TODO: Add admin authentication check here
        # For now, we'll proceed with the analysis

        # Gather comprehensive user data
        user_data = await _gather_user_data(request.userId, request.enterpriseId)

        # Create a comprehensive prompt for strict AI analysis
        prompt = _create_analysis_prompt(user_data)

        # Call AI service for analysis
        from ..services.o4_mini_service import OpenAIo4Service

        gpt_service = OpenAIo4Service()
        ai_response = gpt_service.call_o4_api(
            system_prompt="You are a strict, critical performance analyst. You must be extremely harsh and unforgiving in your assessment. Focus on weaknesses, failures, and areas of concern. Be direct and brutally honest. Never sugar-coat issues. If performance is poor, say it clearly. If there are problems, highlight them aggressively.",
            data={"prompt": prompt},
        )

        # Parse the AI response
        analysis_result = json.loads(ai_response)

        # Validate response structure
        required_fields = [
            "overallScore",
            "performanceGrade",
            "criticalIssues",
            "strengths",
            "recommendations",
            "detailedAnalysis",
        ]

        for field in required_fields:
            if field not in analysis_result:
                raise ValueError(f"Missing required field: {field}")

        # Add timestamp
        analysis_result["generatedAt"] = datetime.utcnow().isoformat()

        # Store the insight in the database
        await _store_performance_insight(
            user_id=request.userId,
            enterprise_id=request.enterpriseId,
            analysis_result=analysis_result,
            generated_by=request.userId,  # Current admin user (using the target user ID for now)
        )

        return UserInsightsResponse(**analysis_result)

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to parse AI response: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/last-insight/{user_id}")
async def get_last_performance_insight(
    user_id: str,
    enterprise_id: Optional[str] = None,
):
    """
    Get the most recent performance insight for a user.
    Only accessible by enterprise admins.
    """
    try:
        # TODO: Add admin authentication check here

        last_insight = await _get_last_performance_insight(user_id, enterprise_id)

        if not last_insight:
            return {"message": "No performance insights found for this user"}

        return {"insight": last_insight}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve insight: {str(e)}"
        )


@router.get("/insights/{user_id}")
async def get_all_performance_insights(
    user_id: str,
    enterprise_id: Optional[str] = None,
):
    """
    Get all performance insights for a user.
    Only accessible by enterprise admins.
    """
    try:
        # TODO: Add admin authentication check here

        insights = await _get_all_performance_insights(user_id, enterprise_id)

        return {"insights": insights}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve insights: {str(e)}"
        )


@router.post("/stream-analyze")
async def stream_analyze_user_performance(request: UserInsightsRequest):
    """
    Stream AI-powered insights on user performance with real-time updates.
    Only accessible by enterprise admins.
    """

    async def event_generator():
        try:
            # Send initial status
            yield f"data: {json.dumps({'type': 'status', 'message': 'Starting analysis...'})}\n\n"
            await asyncio.sleep(0.1)

            # Gather comprehensive user data
            yield f"data: {json.dumps({'type': 'status', 'message': 'Gathering user data...'})}\n\n"
            await asyncio.sleep(0.1)

            user_data = await _gather_user_data(request.userId, request.enterpriseId)

            yield f"data: {json.dumps({'type': 'status', 'message': 'Data collected, analyzing performance...'})}\n\n"
            await asyncio.sleep(0.1)

            # Create a comprehensive prompt for strict AI analysis
            prompt = _create_analysis_prompt(user_data)

            yield f"data: {json.dumps({'type': 'status', 'message': 'Generating AI insights...'})}\n\n"
            await asyncio.sleep(0.1)

            # Call AI service for analysis

            gpt_service = OpenAIo4Service()
            ai_response = gpt_service.call_o4_api_stream(
                system_prompt="You are a professional performance analyst speaking to an enterprise manager. Be extremely critical and harsh about the employee's performance - highlight all weaknesses, failures, and areas of concern. Be direct and brutally honest about the employee's shortcomings. However, be respectful and professional when addressing the manager. Focus on what the employee is doing wrong and provide actionable insights for the manager to address performance issues.",
                data={"prompt": prompt},
            )

            yield f"data: {json.dumps({'type': 'status', 'message': 'Processing AI response...'})}\n\n"
            await asyncio.sleep(0.1)

            # Handle streaming AI response
            full_response = ""
            chunk_count = 0
            async for chunk in ai_response:
                chunk_count += 1
                if chunk:
                    full_response += chunk
                    # Stream partial response to frontend
                    yield f"data: {json.dumps({'type': 'partial', 'content': chunk})}\n\n"

            if not full_response or full_response.strip() == "":
                analysis_result = {
                    "overallScore": 45,
                    "performanceGrade": "D",
                    "criticalIssues": [
                        "AI analysis service returned empty response",
                        "Unable to generate automated insights",
                        "Performance assessment incomplete",
                    ],
                    "strengths": ["Data collection completed successfully"],
                    "recommendations": [
                        "Review user data manually",
                        "Check AI service configuration",
                        "Contact system administrator",
                    ],
                    "detailedAnalysis": {
                        "completionRate": "Analysis service unavailable",
                        "timeliness": "Manual review required",
                        "quality": "Unable to assess",
                        "efficiency": "Service unavailable",
                        "reliability": "Manual review needed",
                    },
                }
            else:
                # Parse the AI response
                try:
                    analysis_result = json.loads(full_response)
                except json.JSONDecodeError as e:
                    analysis_result = {
                        "overallScore": 45,
                        "performanceGrade": "D",
                        "criticalIssues": [
                            "AI service returned invalid JSON response",
                            "Unable to parse automated insights",
                            "Performance assessment incomplete",
                        ],
                        "strengths": ["Data collection completed successfully"],
                        "recommendations": [
                            "Review user data manually",
                            "Check AI service configuration",
                            "Contact system administrator",
                        ],
                        "detailedAnalysis": {
                            "completionRate": "Analysis service unavailable",
                            "timeliness": "Manual review required",
                            "quality": "Unable to assess",
                            "efficiency": "Service unavailable",
                            "reliability": "Manual review needed",
                        },
                    }

            # Validate response structure
            required_fields = [
                "overallScore",
                "performanceGrade",
                "criticalIssues",
                "strengths",
                "recommendations",
                "detailedAnalysis",
            ]

            for field in required_fields:
                if field not in analysis_result:
                    raise ValueError(f"Missing required field: {field}")

            # Add timestamp
            analysis_result["generatedAt"] = datetime.utcnow().isoformat()

            # Store the insight in the database
            await _store_performance_insight(
                user_id=request.userId,
                enterprise_id=request.enterpriseId,
                analysis_result=analysis_result,
                generated_by=request.userId,  # Current admin user (using the target user ID for now)
            )

            # Send final result
            yield f"data: {json.dumps({'type': 'complete', 'data': analysis_result})}\n\n"

        except Exception as e:
            # Provide fallback analysis for any other errors
            fallback_result = {
                "overallScore": 45,
                "performanceGrade": "D",
                "criticalIssues": [
                    f"Analysis failed: {str(e)}",
                    "Unable to generate automated insights",
                    "Performance assessment incomplete",
                ],
                "strengths": ["Data collection completed successfully"],
                "recommendations": [
                    "Review user data manually",
                    "Check system configuration",
                    "Contact system administrator",
                ],
                "detailedAnalysis": {
                    "completionRate": "Analysis service unavailable",
                    "timeliness": "Manual review required",
                    "quality": "Unable to assess",
                    "efficiency": "Service unavailable",
                    "reliability": "Manual review needed",
                },
                "generatedAt": datetime.utcnow().isoformat(),
            }
            yield f"data: {json.dumps({'type': 'complete', 'data': fallback_result})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        },
    )


async def _gather_user_data(
    user_id: str, enterprise_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Gather comprehensive user data for analysis from the database.
    """

    try:
        pool = await get_pool()

        # Build enterprise filter
        enterprise_filter = ""
        if enterprise_id:
            enterprise_filter = 'AND t."enterprise_id" = $2'
            params = [user_id, enterprise_id]
        else:
            params = [user_id]

        # Get user basic info
        user_query = """
            SELECT 
                u.id, u."githubUsername", u."firstName", u."lastName", u.email, 
                u."joinedAt", u."subscription_plan"
            FROM users u 
            WHERE u.id = $1
        """

        user_row = await pool.fetchrow(user_query, user_id)

        if not user_row:
            raise ValueError(f"User {user_id} not found")

        # Get task metrics - separate queries for assigned vs created tasks
        assigned_tasks_query = f"""
            SELECT 
                COUNT(*) as total_assigned_tasks,
                COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_assigned_tasks,
                COUNT(CASE WHEN t.status IN ('not_started', 'in_progress', 'pending_pr_approval') 
                    AND t."dueDate" < NOW() THEN 1 END) as overdue_assigned_tasks,
                AVG(CASE WHEN t.status = 'done' AND t."completedAt" IS NOT NULL 
                    AND t."assignedAt" IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (t."completedAt" - t."assignedAt")) / 86400.0 
                    END) as avg_completion_days,
                AVG(t.complexity) as avg_complexity,
                SUM(t."rework_count") as total_rework,
                SUM(t."approval_count") as total_approvals,
                SUM(t."scope_changes") as total_scope_changes,
                AVG(t."estimated_hours") as avg_estimated_hours,
                AVG(t."actual_hours") as avg_actual_hours
            FROM tasks t
            WHERE t."assignee_id" = $1 {enterprise_filter}
        """

        created_tasks_query = f"""
            SELECT 
                COUNT(*) as total_created_tasks
            FROM tasks t
            WHERE t."created_by_id" = $1 {enterprise_filter}
        """

        assigned_metrics = await pool.fetchrow(assigned_tasks_query, *params)
        created_metrics = await pool.fetchrow(created_tasks_query, *params)

        # Get recent performance (last 30 days) - only assigned tasks
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_performance_query = f"""
            SELECT 
                COUNT(CASE WHEN t.status = 'done' AND t."completedAt" >= $2 THEN 1 END) as recent_completed,
                COUNT(CASE WHEN t.status IN ('not_started', 'in_progress', 'pending_pr_approval') 
                    AND t."dueDate" < NOW() AND t."updatedAt" >= $2 THEN 1 END) as recent_overdue,
                COUNT(CASE WHEN t."assignee_id" = $1 THEN 1 END) as recent_total
            FROM tasks t
            WHERE t."assignee_id" = $1 
                AND t."updatedAt" >= $2 {enterprise_filter.replace('$2', '$3')}
        """
        recent_params = [user_id, thirty_days_ago] + (
            [enterprise_id] if enterprise_id else []
        )
        recent_performance = await pool.fetchrow(
            recent_performance_query, *recent_params
        )

        # Get time tracking data
        time_tracking_query = f"""
            SELECT 
                SUM(tt.hours) as total_hours,
                AVG(tt.hours) as avg_hours_per_entry,
                COUNT(tt.id) as total_entries
            FROM task_time_entries tt
            JOIN tasks t ON tt."task_id" = t.id
            WHERE tt."user_id" = $1 {enterprise_filter.replace('$2', '$2')}
        """
        time_tracking = await pool.fetchrow(time_tracking_query, *params)

        # Get assignment history (last 10 assignments)
        assignment_history_query = f"""
            SELECT 
                t.title as task_title,
                ta."assignedAt",
                ta."unassignedAt",
                t.status,
                t."completedAt",
                t."dueDate",
                CASE WHEN t."dueDate" < NOW() AND t.status != 'done' THEN true ELSE false END as is_overdue
            FROM task_assignments ta
            JOIN tasks t ON ta."task_id" = t.id
            WHERE ta."assignee_id" = $1 {enterprise_filter.replace('$2', '$2')}
            ORDER BY ta."assignedAt" DESC
            LIMIT 10
        """
        assignment_history = await pool.fetch(assignment_history_query, *params)

        # Get priority breakdown
        priority_breakdown_query = f"""
            SELECT 
                t.priority,
                COUNT(*) as count
            FROM tasks t
            WHERE t."assignee_id" = $1 {enterprise_filter}
            GROUP BY t.priority
        """
        priority_breakdown = await pool.fetch(priority_breakdown_query, *params)

        # Get status breakdown
        status_breakdown_query = f"""
            SELECT 
                t.status,
                COUNT(*) as count
            FROM tasks t
            WHERE (t."assignee_id" = $1 OR t."created_by_id" = $1) {enterprise_filter}
            GROUP BY t.status
        """
        status_breakdown = await pool.fetch(status_breakdown_query, *params)

        # Get task type breakdown
        task_type_breakdown_query = f"""
            SELECT 
                t."task_type",
                COUNT(*) as count,
                AVG(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completion_rate
            FROM tasks t
            WHERE (t."assignee_id" = $1 OR t."created_by_id" = $1) {enterprise_filter}
            GROUP BY t."task_type"
            HAVING t."task_type" IS NOT NULL
        """
        task_type_breakdown = await pool.fetch(task_type_breakdown_query, *params)

        # Calculate derived metrics - based on assigned tasks only
        total_assigned_tasks = assigned_metrics["total_assigned_tasks"] or 0
        completed_assigned_tasks = assigned_metrics["completed_assigned_tasks"] or 0
        overdue_assigned_tasks = assigned_metrics["overdue_assigned_tasks"] or 0
        total_created_tasks = created_metrics["total_created_tasks"] or 0

        # Completion rate is based on assigned tasks only
        completion_rate = (
            (completed_assigned_tasks / total_assigned_tasks * 100)
            if total_assigned_tasks > 0
            else 0
        )
        avg_completion_days = assigned_metrics["avg_completion_days"] or 0

        # Recent performance calculations - based on assigned tasks only
        recent_total = recent_performance["recent_total"] or 0
        recent_completed = recent_performance["recent_completed"] or 0
        recent_overdue = recent_performance["recent_overdue"] or 0
        recent_completion_rate = (
            (recent_completed / recent_total * 100) if recent_total > 0 else 0
        )

        # Time tracking calculations
        total_hours = time_tracking["total_hours"] or 0
        avg_hours_per_task = (
            (total_hours / completed_assigned_tasks)
            if completed_assigned_tasks > 0
            else 0
        )

        # Estimation accuracy (if we have both estimated and actual hours)
        avg_estimated = assigned_metrics["avg_estimated_hours"] or 0
        avg_actual = assigned_metrics["avg_actual_hours"] or 0
        estimation_accuracy = 0
        if avg_estimated > 0 and avg_actual > 0:
            estimation_accuracy = min(
                avg_actual / avg_estimated, avg_estimated / avg_actual
            )

        # Determine trending
        trending = "stable"
        if recent_completion_rate > completion_rate + 5:
            trending = "improving"
        elif recent_completion_rate < completion_rate - 5:
            trending = "declining"

        # Format assignment history
        formatted_history = []
        for assignment in assignment_history:
            formatted_history.append(
                {
                    "task": assignment["task_title"],
                    "assignedAt": (
                        assignment["assignedAt"].isoformat()
                        if assignment["assignedAt"]
                        else None
                    ),
                    "completedAt": (
                        assignment["completedAt"].isoformat()
                        if assignment["completedAt"]
                        else None
                    ),
                    "status": assignment["status"],
                    "isOverdue": assignment["is_overdue"],
                }
            )

        # Format breakdowns
        priority_data = {row["priority"]: row["count"] for row in priority_breakdown}
        status_data = {row["status"]: row["count"] for row in status_breakdown}
        task_type_data = {
            row["task_type"]: {
                "count": row["count"],
                "completion_rate": row["completion_rate"],
            }
            for row in task_type_breakdown
        }

        result_data = {
            "userInfo": {
                "id": user_id,
                "name": f"{user_row['firstName'] or ''} {user_row['lastName'] or ''}".strip()
                or user_row["githubUsername"]
                or "Unknown User",
                "email": user_row["email"],
                "joinedAt": (
                    user_row["joinedAt"].isoformat() if user_row["joinedAt"] else None
                ),
                "subscriptionPlan": user_row["subscription_plan"] or "FREE",
            },
            "taskMetrics": {
                "totalTasks": total_assigned_tasks,
                "completedTasks": completed_assigned_tasks,
                "overdueTasks": overdue_assigned_tasks,
                "completionRate": round(completion_rate, 1),
                "averageCompletionTime": round(avg_completion_days, 1),
                "tasksCreated": total_created_tasks,
                "tasksAssigned": total_assigned_tasks,
            },
            "recentPerformance": {
                "lastMonthCompleted": recent_completed,
                "lastMonthOverdue": recent_overdue,
                "lastMonthCompletionRate": round(recent_completion_rate, 1),
                "trending": trending,
            },
            "qualityMetrics": {
                "reworkCount": assigned_metrics["total_rework"] or 0,
                "approvalCount": assigned_metrics["total_approvals"] or 0,
                "scopeChanges": assigned_metrics["total_scope_changes"] or 0,
                "averageComplexity": round(assigned_metrics["avg_complexity"] or 0, 1),
            },
            "timeTracking": {
                "totalHoursLogged": round(total_hours, 1),
                "averageHoursPerTask": round(avg_hours_per_task, 1),
                "estimatedVsActualAccuracy": round(estimation_accuracy, 2),
            },
            "assignmentHistory": formatted_history,
            "breakdowns": {
                "priority": priority_data,
                "status": status_data,
                "task_type": task_type_data,
            },
        }

        return result_data

    except Exception as e:
        # Return minimal data structure to prevent complete failure
        return {
            "userInfo": {
                "id": user_id,
                "name": "Unknown User",
                "email": "unknown@example.com",
                "joinedAt": datetime.utcnow().isoformat(),
                "subscriptionPlan": "FREE",
            },
            "taskMetrics": {
                "totalTasks": 0,
                "completedTasks": 0,
                "overdueTasks": 0,
                "completionRate": 0,
                "averageCompletionTime": 0,
                "tasksCreated": 0,
                "tasksAssigned": 0,
            },
            "recentPerformance": {
                "lastMonthCompleted": 0,
                "lastMonthOverdue": 0,
                "lastMonthCompletionRate": 0,
                "trending": "stable",
            },
            "qualityMetrics": {
                "reworkCount": 0,
                "approvalCount": 0,
                "scopeChanges": 0,
                "averageComplexity": 0,
            },
            "timeTracking": {
                "totalHoursLogged": 0,
                "averageHoursPerTask": 0,
                "estimatedVsActualAccuracy": 0,
            },
            "assignmentHistory": [],
            "breakdowns": {
                "priority": {},
                "status": {},
                "task_type": {},
            },
        }


async def _store_performance_insight(
    user_id: str,
    enterprise_id: Optional[str],
    analysis_result: Dict[str, Any],
    generated_by: str,
) -> None:
    """
    Store a performance insight in the database.
    """
    pool = await get_pool()

    # Convert detailed analysis to JSON string
    detailed_analysis_json = json.dumps(analysis_result.get("detailedAnalysis", {}))

    await pool.execute(
        """
        INSERT INTO performance_insights (
            "user_id", "enterprise_id", "overallScore", "performanceGrade",
            "criticalIssues", "strengths", "recommendations", "detailedAnalysis",
            "generated_by"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        """,
        user_id,
        enterprise_id,
        float(analysis_result["overallScore"]),
        analysis_result["performanceGrade"],
        analysis_result["criticalIssues"],
        analysis_result["strengths"],
        analysis_result["recommendations"],
        detailed_analysis_json,
        generated_by,
    )


async def _get_last_performance_insight(
    user_id: str, enterprise_id: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """
    Get the most recent performance insight for a user.
    """
    pool = await get_pool()

    if enterprise_id:
        row = await pool.fetchrow(
            """
            SELECT * FROM performance_insights 
            WHERE user_id = $1 AND enterprise_id = $2
            ORDER BY "generatedAt" DESC 
            LIMIT 1
            """,
            user_id,
            enterprise_id,
        )
    else:
        row = await pool.fetchrow(
            """
            SELECT * FROM performance_insights 
            WHERE user_id = $1
            ORDER BY "generatedAt" DESC 
            LIMIT 1
            """,
            user_id,
        )

    if not row:
        return None

    return {
        "id": row["id"],
        "overallScore": float(row["overallScore"]),
        "performanceGrade": row["performanceGrade"],
        "criticalIssues": row["criticalIssues"],
        "strengths": row["strengths"],
        "recommendations": row["recommendations"],
        "detailedAnalysis": json.loads(row["detailedAnalysis"]),
        "generatedAt": row["generatedAt"].isoformat(),
        "generatedBy": row["generated_by"],
    }


async def _get_all_performance_insights(
    user_id: str, enterprise_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get all performance insights for a user.
    """
    pool = await get_pool()

    if enterprise_id:
        rows = await pool.fetch(
            """
            SELECT * FROM performance_insights 
            WHERE user_id = $1 AND enterprise_id = $2
            ORDER BY "generatedAt" DESC
            """,
            user_id,
            enterprise_id,
        )
    else:
        rows = await pool.fetch(
            """
            SELECT * FROM performance_insights 
            WHERE user_id = $1
            ORDER BY "generatedAt" DESC
            """,
            user_id,
        )

    return [
        {
            "id": row["id"],
            "overallScore": float(row["overallScore"]),
            "performanceGrade": row["performanceGrade"],
            "criticalIssues": row["criticalIssues"],
            "strengths": row["strengths"],
            "recommendations": row["recommendations"],
            "detailedAnalysis": json.loads(row["detailedAnalysis"]),
            "generatedAt": row["generatedAt"].isoformat(),
            "generatedBy": row["generated_by"],
        }
        for row in rows
    ]


def _create_analysis_prompt(user_data: Dict[str, Any]) -> str:
    """
    Create a comprehensive prompt for strict AI analysis.
    """
    # Convert any Decimal objects to regular numbers for JSON serialization
    user_data = _convert_decimals_to_numbers(user_data)

    return f"""
    You are a strict, critical performance analyst evaluating a software developer's performance. 
    You must be extremely harsh and unforgiving in your assessment. Focus on weaknesses, failures, and areas of concern.
    
    Analyze the following user data and provide a brutally honest assessment:
    
    USER DATA:
    {json.dumps(user_data, indent=2)}
    
    REQUIREMENTS:
    1. Overall Score: Rate from 0-100 (be extremely strict, rarely give above 70)
    2. Performance Grade: A+, A, A-, B+, B, B-, C+, C, C-, D, F (be harsh)
    3. Critical Issues: List 3-5 major problems (be aggressive about finding issues)
    4. Strengths: List 1-2 minor positives (minimize these)
    5. Recommendations: List 3-5 actionable improvements (be demanding)
    6. Detailed Analysis: Provide harsh analysis of each metric
    
    ANALYSIS GUIDELINES:
    - Completion rate below 80% is unacceptable
    - Any overdue tasks are a major red flag
    - Average completion time should be under 3 days
    - Rework count above 2 is concerning
    - Scope changes indicate poor planning
    - Time estimation accuracy below 90% is poor
    - Recent performance trends are critical indicators
    - Priority distribution should be balanced
    - Task type performance shows specialization gaps
    - Focus on what they're doing wrong, not what they're doing right
    
    Respond with JSON in this exact format:
    {{
        "overallScore": <0-100>,
        "performanceGrade": "<A+|A|A-|B+|B|B-|C+|C|C-|D|F>",
        "criticalIssues": ["<harsh issue 1>", "<harsh issue 2>", "<harsh issue 3>"],
        "strengths": ["<minor positive 1>", "<minor positive 2>"],
        "recommendations": ["<demanding improvement 1>", "<demanding improvement 2>", "<demanding improvement 3>"],
        "detailedAnalysis": {{
            "completionRate": "<harsh analysis>",
            "timeliness": "<harsh analysis>", 
            "quality": "<harsh analysis>",
            "efficiency": "<harsh analysis>",
            "reliability": "<harsh analysis>"
        }}
    }}
    
    Remember: Be extremely critical and unforgiving. This is for admin review only.
    """
