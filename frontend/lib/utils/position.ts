/**
 * Position utility functions for task reordering
 * Implements Notion-style positional value system
 */

export interface PositionedTask {
  id: string;
  position: number;
  status: string;
}

/**
 * Calculate the position for a new task at the end of a list
 */
export function calculateEndPosition(tasks: PositionedTask[]): number {
  if (tasks.length === 0) return 1000; // Start with 1000 for new lists
  return Math.max(...tasks.map((t) => t.position)) + 1000;
}

/**
 * Calculate the position for a new task at the beginning of a list
 */
export function calculateStartPosition(tasks: PositionedTask[]): number {
  if (tasks.length === 0) return 1000; // Start with 1000 for new lists
  return Math.min(...tasks.map((t) => t.position)) - 1000;
}

/**
 * Calculate the position between two tasks
 */
export function calculateBetweenPosition(
  prevTask: PositionedTask,
  nextTask: PositionedTask
): number {
  return (prevTask.position + nextTask.position) / 2;
}

/**
 * Calculate the position for inserting a task at a specific index
 */
export function calculateInsertPosition(
  tasks: PositionedTask[],
  insertIndex: number
): number {
  if (tasks.length === 0) return 1000;

  if (insertIndex === 0) {
    // Insert at the beginning
    return calculateStartPosition(tasks);
  }

  if (insertIndex >= tasks.length) {
    // Insert at the end
    return calculateEndPosition(tasks);
  }

  // Insert between two tasks
  const prevTask = tasks[insertIndex - 1];
  const nextTask = tasks[insertIndex];
  return calculateBetweenPosition(prevTask, nextTask);
}

/**
 * Normalize positions to sequential integers (1, 2, 3, ...)
 * This should be called periodically to prevent floating-point drift
 */
export function normalizePositions(tasks: PositionedTask[]): PositionedTask[] {
  return tasks
    .sort((a, b) => a.position - b.position)
    .map((task, index) => ({
      ...task,
      position: (index + 1) * 1000, // Use 1000, 2000, 3000, etc. for spacing
    }));
}

/**
 * Check if positions need normalization (if any position is too close to another)
 */
export function needsNormalization(tasks: PositionedTask[]): boolean {
  if (tasks.length < 2) return false;

  const sortedTasks = tasks.sort((a, b) => a.position - b.position);

  for (let i = 1; i < sortedTasks.length; i++) {
    const diff = sortedTasks[i].position - sortedTasks[i - 1].position;
    if (diff < 0.1) {
      // If positions are too close, normalize
      return true;
    }
  }

  return false;
}

/**
 * Calculate the new position for a dragged task
 */
export function calculateDragPosition(
  tasks: PositionedTask[],
  draggedTaskId: string,
  targetIndex: number
): number {
  const tasksWithoutDragged = tasks.filter((t) => t.id !== draggedTaskId);

  if (targetIndex === 0) {
    // Dropping at the beginning
    return calculateStartPosition(tasksWithoutDragged);
  }

  if (targetIndex >= tasksWithoutDragged.length) {
    // Dropping at the end
    return calculateEndPosition(tasksWithoutDragged);
  }

  // Dropping between two tasks
  const prevTask = tasksWithoutDragged[targetIndex - 1];
  const nextTask = tasksWithoutDragged[targetIndex];
  return calculateBetweenPosition(prevTask, nextTask);
}
