"use server";

import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

const prisma = new PrismaClient();

const createBoardSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
});

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
  } catch (error) {
    return {
      errors: {
        _form: ["ボードの作成に失敗しました"],
      },
    };
  }
}