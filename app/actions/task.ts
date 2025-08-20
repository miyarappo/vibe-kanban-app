"use server";

import { PrismaClient, Priority } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const prisma = new PrismaClient();

const createTaskSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  columnId: z.string().min(1, "カラムIDは必須です"),
});

export async function createTask(formData: FormData) {
  const validatedFields = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || "MEDIUM",
    dueDate: formData.get("dueDate") || undefined,
    columnId: formData.get("columnId"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, description, priority, dueDate, columnId } = validatedFields.data;

  try {
    // Get the last position in the column
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: "desc" },
    });

    const position = (lastTask?.position ?? -1) + 1;

    // Create the task
    await prisma.task.create({
      data: {
        title,
        description,
        priority: priority as Priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        columnId,
        position,
      },
    });

    // Get the board ID for revalidation
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      select: { boardId: true },
    });

    if (column) {
      revalidatePath(`/boards/${column.boardId}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to create task:", error);
    return {
      errors: {
        _form: ["タスクの作成に失敗しました"],
      },
    };
  }
}

const moveTaskSchema = z.object({
  taskId: z.string().min(1, "タスクIDは必須です"),
  destinationColumnId: z.string().min(1, "移動先カラムIDは必須です"),
  destinationIndex: z.number().min(0, "移動先インデックスは0以上である必要があります"),
});

export async function moveTask(
  taskId: string,
  destinationColumnId: string,
  destinationIndex: number
) {
  const validatedFields = moveTaskSchema.safeParse({
    taskId,
    destinationColumnId,
    destinationIndex,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // Get the task being moved and all related tasks
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { column: { include: { board: true } } },
    });

    if (!task) {
      return {
        errors: {
          _form: ["タスクが見つかりません"],
        },
      };
    }

    const sourceColumnId = task.columnId;

    await prisma.$transaction(async (tx) => {
      if (sourceColumnId === destinationColumnId) {
        // Moving within the same column - reorder all tasks in that column
        const allTasks = await tx.task.findMany({
          where: { columnId: sourceColumnId },
          orderBy: { position: "asc" },
        });

        // First, set all tasks in this column to negative positions to avoid conflicts
        for (let i = 0; i < allTasks.length; i++) {
          await tx.task.update({
            where: { id: allTasks[i].id },
            data: { position: -(i + 1000) },
          });
        }

        // Remove the moving task from the array
        const tasksWithoutMoving = allTasks.filter((t) => t.id !== taskId);
        
        // Insert the moving task at the new position
        tasksWithoutMoving.splice(destinationIndex, 0, task);

        // Update all positions to final values
        for (let i = 0; i < tasksWithoutMoving.length; i++) {
          await tx.task.update({
            where: { id: tasksWithoutMoving[i].id },
            data: { position: i },
          });
        }
      } else {
        // Moving to a different column
        
        // Get all tasks in both columns
        const sourceTasks = await tx.task.findMany({
          where: { columnId: sourceColumnId },
          orderBy: { position: "asc" },
        });
        
        const destTasks = await tx.task.findMany({
          where: { columnId: destinationColumnId },
          orderBy: { position: "asc" },
        });

        // Set all affected tasks to negative positions first
        for (let i = 0; i < sourceTasks.length; i++) {
          await tx.task.update({
            where: { id: sourceTasks[i].id },
            data: { position: -(i + 1000) },
          });
        }
        
        for (let i = 0; i < destTasks.length; i++) {
          await tx.task.update({
            where: { id: destTasks[i].id },
            data: { position: -(i + 2000) },
          });
        }

        // Reorder source column (without the moving task)
        const sourceTasksWithoutMoving = sourceTasks.filter((t) => t.id !== taskId);
        for (let i = 0; i < sourceTasksWithoutMoving.length; i++) {
          await tx.task.update({
            where: { id: sourceTasksWithoutMoving[i].id },
            data: { position: i },
          });
        }

        // Insert the moving task at the destination position
        destTasks.splice(destinationIndex, 0, { ...task, columnId: destinationColumnId });

        // Update all tasks in destination column
        for (let i = 0; i < destTasks.length; i++) {
          if (destTasks[i].id === taskId) {
            // Update the moving task with new column and position
            await tx.task.update({
              where: { id: taskId },
              data: {
                columnId: destinationColumnId,
                position: i,
              },
            });
          } else {
            // Update existing tasks in destination column
            await tx.task.update({
              where: { id: destTasks[i].id },
              data: { position: i },
            });
          }
        }
      }
    });

    // Revalidate the board page
    revalidatePath(`/boards/${task.column.board.id}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to move task:", error);
    return {
      errors: {
        _form: ["タスクの移動に失敗しました"],
      },
    };
  }
}