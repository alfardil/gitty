import { db } from "../db";
import { tasks } from "../db/schema";
import { eq } from "drizzle-orm";

export interface TaskAnalysisResult {
  estimatedHours: number;
  complexity: number;
  taskType: string;
  confidence: number;
}

export interface TaskAnalysisRequest {
  taskId: string;
  title: string;
  description?: string;
  priority: string;
  dueDate?: string;
  tags?: string[];
}

// AI analysis function using Python backend with GPT enhancement
async function analyzeTaskWithAI(
  taskData: TaskAnalysisRequest
): Promise<TaskAnalysisResult> {
  try {
    // Call the Python backend API with GPT enhancement
    const response = await fetch(
      `${process.env.NODE_ENV === "production" ? process.env.NEXT_PUBLIC_API_DEV_URL : "http://localhost:8000"}/task-analysis/analyze`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          due_date: taskData.dueDate,
          tags: taskData.tags,
          use_gpt: true, // Enable GPT for better analysis
          enhance_existing: true, // Fill missing fields intelligently
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const result = await response.json();

    return {
      estimatedHours: result.estimated_hours,
      complexity: result.complexity,
      taskType: result.task_type,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error("Error calling Python backend for task analysis:", error);

    // Fallback to heuristics if backend fails
    return await fallbackAnalysis(taskData);
  }
}

// Fallback analysis using heuristics
async function fallbackAnalysis(
  taskData: TaskAnalysisRequest
): Promise<TaskAnalysisResult> {
  const { title, description, priority, tags } = taskData;
  const fullText =
    `${title} ${description || ""} ${tags?.join(" ") || ""}`.toLowerCase();

  // Estimate hours based on priority and content
  let estimatedHours = 4; // Default
  if (priority === "high") estimatedHours = 8;
  if (priority === "low") estimatedHours = 2;

  // Adjust based on keywords
  if (fullText.includes("bug") || fullText.includes("fix")) {
    estimatedHours = Math.max(1, estimatedHours * 0.5);
  }
  if (fullText.includes("feature") || fullText.includes("implement")) {
    estimatedHours = estimatedHours * 1.5;
  }
  if (fullText.includes("refactor") || fullText.includes("optimize")) {
    estimatedHours = estimatedHours * 1.2;
  }

  // Determine complexity (1-5 scale)
  let complexity = 3; // Default medium
  if (priority === "high") complexity = 4;
  if (priority === "low") complexity = 2;

  // Adjust based on content length and keywords
  if (description && description.length > 200)
    complexity = Math.min(5, complexity + 1);
  if (fullText.includes("simple") || fullText.includes("basic"))
    complexity = Math.max(1, complexity - 1);
  if (fullText.includes("complex") || fullText.includes("advanced"))
    complexity = Math.min(5, complexity + 1);

  // Determine task type
  let taskType = "other";
  if (
    fullText.includes("bug") ||
    fullText.includes("fix") ||
    fullText.includes("issue")
  ) {
    taskType = "bug_fix";
  } else if (
    fullText.includes("feature") ||
    fullText.includes("implement") ||
    fullText.includes("add")
  ) {
    taskType = "feature";
  } else if (
    fullText.includes("refactor") ||
    fullText.includes("optimize") ||
    fullText.includes("improve")
  ) {
    taskType = "refactor";
  } else if (
    fullText.includes("test") ||
    fullText.includes("testing") ||
    fullText.includes("unit")
  ) {
    taskType = "testing";
  } else if (
    fullText.includes("doc") ||
    fullText.includes("readme") ||
    fullText.includes("comment")
  ) {
    taskType = "documentation";
  }

  // Calculate confidence based on how clear the signals are
  let confidence = 0.7; // Base confidence
  if (taskType !== "other") confidence += 0.2;
  if (description && description.length > 50) confidence += 0.1;

  return {
    estimatedHours: Math.round(estimatedHours * 10) / 10, // Round to 1 decimal
    complexity,
    taskType,
    confidence: Math.min(1, confidence),
  };
}

export async function analyzeTaskInBackground(taskId: string): Promise<void> {
  try {
    // Get the task data
    const taskData = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        tags: tasks.tags,
        estimatedHours: tasks.estimatedHours,
        complexity: tasks.complexity,
        taskType: tasks.taskType,
      })
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (taskData.length === 0) {
      console.error(`Task ${taskId} not found for analysis`);
      return;
    }

    const task = taskData[0];

    // Skip if already fully analyzed (all required fields present)
    if (task.estimatedHours && task.complexity && task.taskType) {
      console.log(
        `Task ${taskId} already has complete analysis data, skipping`
      );
      return;
    }

    // Check which fields are missing and need to be filled
    const missingFields = [];
    if (!task.estimatedHours) missingFields.push("estimatedHours");
    if (!task.complexity) missingFields.push("complexity");
    if (!task.taskType) missingFields.push("taskType");

    console.log(`Task ${taskId} missing fields: ${missingFields.join(", ")}`);

    // Analyze the task
    const analysis = await analyzeTaskWithAI({
      taskId: task.id,
      title: task.title,
      description: task.description || undefined,
      priority: task.priority,
      dueDate: task.dueDate || undefined,
      tags: task.tags || undefined,
    });

    // Update only the missing fields with analysis results
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (!task.estimatedHours) {
      updateData.estimatedHours = analysis.estimatedHours.toString();
    }
    if (!task.complexity) {
      updateData.complexity = analysis.complexity;
    }
    if (!task.taskType) {
      updateData.taskType = analysis.taskType;
    }

    await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));

    console.log(`Task ${taskId} analyzed successfully:`, analysis);
  } catch (error) {
    console.error(`Error analyzing task ${taskId}:`, error);
  }
}

// Batch analysis for multiple tasks
export async function analyzeTasksInBackground(
  taskIds: string[]
): Promise<void> {
  console.log(`Starting batch analysis for ${taskIds.length} tasks`);

  // Process tasks in parallel with a concurrency limit
  const concurrencyLimit = 5;
  const chunks = [];

  for (let i = 0; i < taskIds.length; i += concurrencyLimit) {
    chunks.push(taskIds.slice(i, i + concurrencyLimit));
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map((taskId) => analyzeTaskInBackground(taskId)));
    // Small delay between chunks to avoid overwhelming the system
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`Batch analysis completed for ${taskIds.length} tasks`);
}
