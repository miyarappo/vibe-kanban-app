"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Column, Task } from "@prisma/client";
import { DraggableTask } from "./draggable-task";
import { AddTaskDialog } from "./add-task-dialog";

interface DroppableColumnProps {
  column: Column & { tasks: Task[] };
  isOver?: boolean;
}

export function DroppableColumn({ column, isOver }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[300px] bg-card rounded-lg border p-4 transition-all duration-200 ${
        isOver ? "bg-accent/50 border-accent border-2 shadow-lg scale-[1.02]" : ""
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="font-semibold">{column.title}</h3>
        <span className="text-sm text-muted-foreground">
          ({column.tasks.length})
        </span>
      </div>

      <div className="space-y-3 min-h-[100px]">
        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <DraggableTask key={task.id} task={task} />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            タスクがありません
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t">
        <AddTaskDialog columnId={column.id} />
      </div>
    </div>
  );
}