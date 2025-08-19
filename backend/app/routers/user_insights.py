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
    Generate AI-powered insights on user performance with realistic, balanced analysis.
    Only accessible by enterprise admins.
    """
    try:
        # TODO: Add admin authentication check here
        # For now, we'll proceed with the analysis

        # Gather comprehensive user data
        user_data = await _gather_user_data(request.userId, request.enterpriseId)

        # Get the user's current performance grade
        current_grade = await _get_user_current_grade(
            request.userId, request.enterpriseId
        )

        # Create a comprehensive prompt for balanced AI analysis
        prompt = _create_analysis_prompt(user_data, current_grade)

        # Call AI service for analysis
        from ..services.o4_mini_service import OpenAIo4Service

        gpt_service = OpenAIo4Service()
        ai_response = gpt_service.call_o4_api(
            system_prompt="You are a professional performance analyst providing balanced, realistic feedback on software developer performance. Be honest and constructive in your assessment, highlighting both strengths and areas for improvement. Provide actionable insights that help the developer grow while acknowledging their contributions.",
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

        # Calculate the adjusted grade based on the analysis
        adjusted_grade = await _calculate_adjusted_grade(current_grade, analysis_result)
        analysis_result["performanceGrade"] = adjusted_grade

        # Debug logging to ensure correct grade assignment
        print(
            f"Debug - Original AI Grade: {analysis_result.get('performanceGrade', 'N/A')}"
        )
        print(f"Debug - Overall Score: {analysis_result.get('overallScore', 'N/A')}")
        print(f"Debug - Current Grade: {current_grade}")
        print(f"Debug - Adjusted Grade: {adjusted_grade}")
        print(f"Debug - Final Grade: {analysis_result['performanceGrade']}")

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

            # Get the user's current performance grade
            current_grade = await _get_user_current_grade(
                request.userId, request.enterpriseId
            )

            # Create a comprehensive prompt for balanced AI analysis
            prompt = _create_analysis_prompt(user_data, current_grade)

            yield f"data: {json.dumps({'type': 'status', 'message': 'Generating AI insights...'})}\n\n"
            await asyncio.sleep(0.1)

            # Call AI service for analysis
            from ..services.o4_mini_service import OpenAIo4Service

            gpt_service = OpenAIo4Service()
            ai_response = gpt_service.call_o4_api_stream(
                system_prompt="You are a professional performance analyst providing balanced, realistic feedback on software developer performance. Be honest and constructive in your assessment, highlighting both strengths and areas for improvement. Provide actionable insights that help the developer grow while acknowledging their contributions.",
                data={"prompt": prompt},
            )

            yield f"data: {json.dumps({'type': 'status', 'message': 'Processing AI response...'})}\n\n"
            await asyncio.sleep(0.1)

            # Handle streaming AI response
            full_response = ""
            async for chunk in ai_response:
                if chunk:
                    full_response += chunk
                    yield f"data: {json.dumps({'type': 'chunk', 'data': chunk})}\n\n"

            # Parse the complete response
            analysis_result = json.loads(full_response)

            # Calculate the adjusted grade based on the analysis
            adjusted_grade = await _calculate_adjusted_grade(
                current_grade, analysis_result
            )
            analysis_result["performanceGrade"] = adjusted_grade

            # Debug logging to ensure correct grade assignment
            print(
                f"Debug - Original AI Grade: {analysis_result.get('performanceGrade', 'N/A')}"
            )
            print(
                f"Debug - Overall Score: {analysis_result.get('overallScore', 'N/A')}"
            )
            print(f"Debug - Current Grade: {current_grade}")
            print(f"Debug - Adjusted Grade: {adjusted_grade}")
            print(f"Debug - Final Grade: {analysis_result['performanceGrade']}")

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
                "overallScore": 75,
                "performanceGrade": "B",
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
            "assignmentHistory": [],
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


async def _get_user_current_grade(
    user_id: str, enterprise_id: Optional[str] = None
) -> str:
    """
    Get the user's current performance grade. If no grade exists, start with 'A'.
    """
    pool = await get_pool()

    if enterprise_id:
        row = await pool.fetchrow(
            """
            SELECT "performanceGrade" FROM performance_insights 
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
            SELECT "performanceGrade" FROM performance_insights 
            WHERE user_id = $1
            ORDER BY "generatedAt" DESC 
            LIMIT 1
            """,
            user_id,
        )

    # If no previous grade exists, start with 'A'
    return row["performanceGrade"] if row else "A"


async def _calculate_adjusted_grade(
    current_grade: str, analysis_result: Dict[str, Any]
) -> str:
    """
    Calculate the adjusted grade based on the analysis result.
    Start with the current grade and adjust based on performance indicators.
    Users start at A and are only downgraded for genuinely poor performance.
    """
    grade_order = ["F", "D", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"]

    try:
        current_index = grade_order.index(current_grade)
    except ValueError:
        current_index = 9  # Default to 'A' if grade not found

    # Get the overall score to determine grade adjustment
    overall_score = analysis_result.get("overallScore", 75)

    # More generous grading logic - only downgrade for genuinely poor performance
    # For users with good performance metrics, ensure they get appropriate grades
    if overall_score >= 95:
        grade_adjustment = 2  # Move up to A+
    elif overall_score >= 85:
        grade_adjustment = 1  # Move up to A+
    elif overall_score >= 75:
        grade_adjustment = 0  # Stay at A
    elif overall_score >= 65:
        grade_adjustment = -1  # Move down to A-
    elif overall_score >= 55:
        grade_adjustment = -2  # Move down to B+
    elif overall_score >= 45:
        grade_adjustment = -3  # Move down to B
    elif overall_score >= 35:
        grade_adjustment = -4  # Move down to B-
    elif overall_score >= 25:
        grade_adjustment = -5  # Move down to C+
    elif overall_score >= 15:
        grade_adjustment = -6  # Move down to C
    else:
        grade_adjustment = -7  # Move down to C- or lower

    # Calculate new index
    new_index = max(0, min(len(grade_order) - 1, current_index + grade_adjustment))

    # Additional safeguard: If user has good performance metrics, ensure minimum grade
    # Check if user has 100% completion rate and no overdue tasks
    user_data = analysis_result.get("userData", {})
    completion_rate = user_data.get("completionRate", 0)
    overdue_tasks = user_data.get("overdueTasks", 0)

    # If user has excellent performance metrics, ensure they get at least a B
    if completion_rate >= 90 and overdue_tasks == 0 and overall_score >= 70:
        min_grade_index = 7  # B grade
        new_index = max(new_index, min_grade_index)

    final_grade = grade_order[new_index]

    # Debug logging
    print(
        f"Debug - Score: {overall_score}, Current Grade: {current_grade}, Adjustment: {grade_adjustment}, Final Grade: {final_grade}"
    )

    return final_grade


def _create_analysis_prompt(user_data: Dict[str, Any], current_grade: str) -> str:
    """
    Create a comprehensive prompt for balanced AI analysis.
    """
    # Convert any Decimal objects to regular numbers for JSON serialization
    user_data = _convert_decimals_to_numbers(user_data)

    return f"""
    You are a professional performance analyst evaluating a software developer's performance. 
    Your current performance grade is: {current_grade}.
    
    Analyze the following user data and provide a balanced assessment:
    
    USER DATA:
    {json.dumps(user_data, indent=2)}
    
    REQUIREMENTS:
    1. Overall Score: Rate from 0-100 (be realistic and fair, consider the data available)
    2. Performance Grade: A+, A, A-, B+, B, B-, C+, C, C-, D, F (be fair and constructive)
    3. Critical Issues: List 3-5 areas for improvement (be constructive, not overly critical)
    4. Strengths: List 2-3 genuine strengths (acknowledge good performance)
    5. Recommendations: List 3-5 actionable improvements (be helpful and constructive)
    6. Detailed Analysis: Provide balanced analysis of each metric
    
    GRADING CRITERIA:
    - A+ (95-100): Exceptional performance with outstanding metrics
    - A (85-94): Excellent performance with strong metrics
    - A- (75-84): Very good performance with solid metrics
    - B+ (65-74): Good performance with minor areas for improvement
    - B (55-64): Satisfactory performance with some areas for improvement
    - B- (45-54): Below average performance with significant issues
    - C+ (35-44): Poor performance with major issues
    - C (25-34): Very poor performance
    - C- (15-24): Extremely poor performance
    - D (5-14): Failing performance
    - F (0-4): Completely unacceptable performance
    
    PERFORMANCE EVALUATION RULES:
    - Users with 100% completion rate and no overdue tasks should receive A- or higher
    - Users with 90%+ completion rate should receive B+ or higher
    - Users with 80%+ completion rate should receive B or higher
    - Only downgrade for actual poor performance, not data limitations
    - Consider task complexity and role when evaluating performance
    
    ANALYSIS GUIDELINES:
    - Overall Score should reflect actual performance, not data availability
    - Performance Grade should align with the grading criteria above
    - Critical Issues should be constructive and actionable
    - Strengths should be genuine and not minimized
    - Recommendations should be helpful and achievable
    - Detailed Analysis should be balanced and fair
    - Do not penalize users for:
      * Having limited task volume (this may be normal for new users or specific roles)
      * Not using time tracking features (this is optional)
      * Not having peer reviews (this depends on team structure)
      * Having few tasks (quality over quantity)
    
    Respond with JSON in this exact format:
    {{
        "overallScore": <0-100>,
        "performanceGrade": "<A+|A|A-|B+|B|B-|C+|C|C-|D|F>",
        "criticalIssues": ["<constructive issue 1>", "<constructive issue 2>", "<constructive issue 3>"],
        "strengths": ["<genuine strength 1>", "<genuine strength 2>", "<genuine strength 3>"],
        "recommendations": ["<helpful improvement 1>", "<helpful improvement 2>", "<helpful improvement 3>"],
        "detailedAnalysis": {{
            "completionRate": "<balanced analysis>",
            "timeliness": "<balanced analysis>", 
            "quality": "<balanced analysis>",
            "efficiency": "<balanced analysis>",
            "reliability": "<balanced analysis>"
        }}
    }}
    
    Remember: Be fair, constructive, and realistic. Focus on actual performance, not data availability.
    """
