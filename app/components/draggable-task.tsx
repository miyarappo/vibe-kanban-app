"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@prisma/client";

interface DraggableTaskProps {
  task: Task;
}

export function DraggableTask({ task }: DraggableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-background p-3 rounded-md border shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 shadow-lg scale-105 rotate-2" : ""
      }`}
    >
      <h4 className="font-medium text-sm mb-1">{task.title}</h4>
      {task.description && (
        <p className="text-xs text-muted-foreground mb-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            task.priority === "URGENT"
              ? "bg-red-100 text-red-700"
              : task.priority === "HIGH"
              ? "bg-orange-100 text-orange-700"
              : task.priority === "MEDIUM"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {task.priority === "URGENT"
            ? "緊急"
            : task.priority === "HIGH"
            ? "高"
            : task.priority === "MEDIUM"
            ? "中"
            : "低"}
        </span>
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">
            {new Date(task.dueDate).toLocaleDateString("ja-JP")}
          </span>
        )}
      </div>
    </div>
  );
}