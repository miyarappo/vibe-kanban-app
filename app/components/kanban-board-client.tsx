"use client";

import { useState, useEffect } from "react";
import { Board, Column, Task } from "@prisma/client";
import { StaticKanbanBoard } from "./static-kanban-board";
import { KanbanBoard } from "./kanban-board";

interface KanbanBoardClientProps {
  board: Board & {
    columns: (Column & { tasks: Task[] })[];
  };
}

export function KanbanBoardClient({ board }: KanbanBoardClientProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <StaticKanbanBoard board={board} />;
  }

  return <KanbanBoard board={board} />;
}