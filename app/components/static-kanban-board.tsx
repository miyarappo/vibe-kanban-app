import { Board, Column, Task } from "@prisma/client";
import { AddTaskDialog } from "./add-task-dialog";

interface StaticKanbanBoardProps {
  board: Board & {
    columns: (Column & { tasks: Task[] })[];
  };
}

export function StaticKanbanBoard({ board }: StaticKanbanBoardProps) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-6">
      {board.columns.map((column) => (
        <div
          key={column.id}
          className="min-w-[300px] bg-card rounded-lg border p-4"
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
            {column.tasks.map((task) => (
              <div
                key={task.id}
                className="bg-background p-3 rounded-md border shadow-sm hover:shadow-md transition-shadow"
              >
                <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                {task.description && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {task.description}
                  </p>
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
            ))}

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
      ))}
    </div>
  );
}