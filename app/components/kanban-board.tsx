"use client";

import { useState, useTransition, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Board, Column, Task } from "@prisma/client";
import { DroppableColumn } from "./droppable-column";
import { AddColumnButton } from "./add-column-button";
import { moveTask } from "../actions/task";
import { useRouter } from "next/navigation";

interface KanbanBoardProps {
  board: Board & {
    columns: (Column & { tasks: Task[] })[];
  };
}

export function KanbanBoard({ board }: KanbanBoardProps) {
  const [columns, setColumns] = useState(board.columns);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Sync state with props when board data changes
  useEffect(() => {
    setColumns(board.columns);
  }, [board.columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = findTaskById(active.id as string);
    setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? (over.id as string) : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setOverId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = findTaskById(activeId);
    if (!activeTask) return;

    const activeColumn = findColumnByTaskId(activeId);
    const overColumn = findColumnById(overId) || findColumnByTaskId(overId);

    if (!activeColumn || !overColumn) return;

    const activeIndex = activeColumn.tasks.findIndex((t) => t.id === activeId);
    let overIndex: number;

    if (overColumn.id === overId) {
      // Dropped on column
      overIndex = overColumn.tasks.length;
    } else {
      // Dropped on task
      overIndex = overColumn.tasks.findIndex((t) => t.id === overId);
    }

    // Save current state for potential rollback
    const previousColumns = columns;

    // Optimistic update
    if (activeColumn.id === overColumn.id) {
      // Same column reorder
      const newTasks = arrayMove(activeColumn.tasks, activeIndex, overIndex);
      setColumns((prev) =>
        prev.map((col) =>
          col.id === activeColumn.id ? { ...col, tasks: newTasks } : col
        )
      );
    } else {
      // Move between columns
      const newActiveTasks = activeColumn.tasks.filter((t) => t.id !== activeId);
      const newOverTasks = [...overColumn.tasks];
      newOverTasks.splice(overIndex, 0, {
        ...activeTask,
        columnId: overColumn.id,
      });

      setColumns((prev) =>
        prev.map((col) => {
          if (col.id === activeColumn.id) {
            return { ...col, tasks: newActiveTasks };
          }
          if (col.id === overColumn.id) {
            return { ...col, tasks: newOverTasks };
          }
          return col;
        })
      );
    }

    // Server update
    startTransition(async () => {
      const result = await moveTask(activeId, overColumn.id, overIndex);
      if (!result.success) {
        // Revert optimistic update on error
        setColumns(previousColumns);
        console.error("Failed to move task:", result.errors);
      }
    });
  };

  const findTaskById = (id: string): Task | null => {
    for (const column of columns) {
      const task = column.tasks.find((t) => t.id === id);
      if (task) return task;
    }
    return null;
  };

  const findColumnById = (id: string): (Column & { tasks: Task[] }) | null => {
    return columns.find((col) => col.id === id) || null;
  };

  const findColumnByTaskId = (taskId: string): (Column & { tasks: Task[] }) | null => {
    return columns.find((col) => col.tasks.some((t) => t.id === taskId)) || null;
  };

  const handleColumnAdded = () => {
    router.refresh();
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6">
        {columns.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            isOver={overId === column.id}
          />
        ))}
        <AddColumnButton boardId={board.id} onColumnAdded={handleColumnAdded} />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="bg-background p-3 rounded-md border shadow-2xl rotate-3 scale-110 opacity-95 ring-2 ring-blue-200">
            <h4 className="font-medium text-sm mb-1">{activeTask.title}</h4>
            {activeTask.description && (
              <p className="text-xs text-muted-foreground mb-2">
                {activeTask.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  activeTask.priority === "URGENT"
                    ? "bg-red-100 text-red-700"
                    : activeTask.priority === "HIGH"
                    ? "bg-orange-100 text-orange-700"
                    : activeTask.priority === "MEDIUM"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {activeTask.priority === "URGENT"
                  ? "緊急"
                  : activeTask.priority === "HIGH"
                  ? "高"
                  : activeTask.priority === "MEDIUM"
                  ? "中"
                  : "低"}
              </span>
              {activeTask.dueDate && (
                <span className="text-xs text-muted-foreground">
                  {new Date(activeTask.dueDate).toLocaleDateString("ja-JP")}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </DragOverlay>

      {isPending && (
        <div className="fixed top-4 right-4 bg-blue-100 text-blue-800 px-3 py-2 rounded-md text-sm">
          保存中...
        </div>
      )}
    </DndContext>
  );
}