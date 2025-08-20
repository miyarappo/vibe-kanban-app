"use server";

import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

const prisma = new PrismaClient();

const createBoardSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
});

const createColumnSchema = z.object({
  title: z.string().min(1, "カラム名は必須です"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "有効な色を選択してください"),
  boardId: z.string().min(1, "ボードIDが必要です"),
});

export async function getBoards() {
  try {
    const boards = await prisma.board.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return boards;
  } catch (error) {
    console.error("Failed to fetch boards:", error);
    return [];
  }
}

export async function createBoard(formData: FormData) {
  const validatedFields = createBoardSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, description } = validatedFields.data;

  try {
    const board = await prisma.board.create({
      data: {
        title,
        description,
        columns: {
          create: [
            {
              title: "To Do",
              position: 0,
              color: "#ef4444", // red-500
            },
            {
              title: "In Progress",
              position: 1,
              color: "#f59e0b", // amber-500
            },
            {
              title: "Done",
              position: 2,
              color: "#10b981", // emerald-500
            },
          ],
        },
      },
    });

    redirect(`/boards/${board.id}`);
  } catch {
    return {
      errors: {
        _form: ["ボードの作成に失敗しました"],
      },
    };
  }
}

export async function createColumn(formData: FormData) {
  const validatedFields = createColumnSchema.safeParse({
    title: formData.get("title"),
    color: formData.get("color"),
    boardId: formData.get("boardId"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, color, boardId } = validatedFields.data;

  try {
    const maxPositionResult = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const newPosition = (maxPositionResult?.position ?? -1) + 1;

    const column = await prisma.column.create({
      data: {
        title,
        color,
        position: newPosition,
        boardId,
      },
    });

    return {
      success: true,
      column,
    };
  } catch (error) {
    console.error("Failed to create column:", error);
    return {
      success: false,
      errors: {
        _form: ["カラムの作成に失敗しました"],
      },
    };
  }
}