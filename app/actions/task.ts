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
    // Get the task being moved
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { column: true },
    });

    if (!task) {
      return {
        errors: {
          _form: ["タスクが見つかりません"],
        },
      };
    }

    const sourceColumnId = task.columnId;
    const sourceIndex = task.position;

    // If moving within the same column
    if (sourceColumnId === destinationColumnId) {
      if (sourceIndex === destinationIndex) {
        return { success: true }; // No change needed
      }

      // Update positions for tasks in the same column
      if (sourceIndex < destinationIndex) {
        // Moving down: decrease position of tasks between source and destination
        await prisma.task.updateMany({
          where: {
            columnId: sourceColumnId,
            position: {
              gt: sourceIndex,
              lte: destinationIndex,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });
      } else {
        // Moving up: increase position of tasks between destination and source
        await prisma.task.updateMany({
          where: {
            columnId: sourceColumnId,
            position: {
              gte: destinationIndex,
              lt: sourceIndex,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
      }

      // Update the moved task's position
      await prisma.task.update({
        where: { id: taskId },
        data: { position: destinationIndex },
      });
    } else {
      // Moving to a different column
      await prisma.$transaction(async (tx) => {
        // Decrease position of tasks after the source position in source column
        await tx.task.updateMany({
          where: {
            columnId: sourceColumnId,
            position: { gt: sourceIndex },
          },
          data: {
            position: { decrement: 1 },
          },
        });

        // Increase position of tasks at or after destination position in destination column
        await tx.task.updateMany({
          where: {
            columnId: destinationColumnId,
            position: { gte: destinationIndex },
          },
          data: {
            position: { increment: 1 },
          },
        });

        // Move the task to the new column and position
        await tx.task.update({
          where: { id: taskId },
          data: {
            columnId: destinationColumnId,
            position: destinationIndex,
          },
        });
      });
    }

    // Revalidate the board page
    revalidatePath(`/boards/${task.column.boardId}`);

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