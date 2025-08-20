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