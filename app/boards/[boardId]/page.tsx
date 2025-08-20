import { PrismaClient } from "@prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/app/components/kanban-board";

const prisma = new PrismaClient();

interface BoardPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      columns: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
  });

  if (!board) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                ホームに戻る
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{board.title}</h1>
              {board.description && (
                <p className="text-muted-foreground text-sm">{board.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <KanbanBoard board={board} />

        {board.columns.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">カラムがありません</p>
          </div>
        )}
      </main>
    </div>
  );
}