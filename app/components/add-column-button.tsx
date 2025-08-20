"use client";

import { useState, useTransition } from "react";
import { createColumn } from "@/app/actions/board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Check, X } from "lucide-react";

interface AddColumnButtonProps {
  boardId: string;
  onColumnAdded?: () => void;
}

const colorOptions = [
  { label: "赤", value: "#ef4444" },
  { label: "オレンジ", value: "#f59e0b" },
  { label: "黄色", value: "#eab308" },
  { label: "緑", value: "#10b981" },
  { label: "青", value: "#3b82f6" },
  { label: "紫", value: "#8b5cf6" },
  { label: "ピンク", value: "#ec4899" },
  { label: "グレー", value: "#6b7280" },
];

export function AddColumnButton({ boardId, onColumnAdded }: AddColumnButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!title.trim()) return;

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("color", selectedColor);
    formData.append("boardId", boardId);

    startTransition(async () => {
      const result = await createColumn(formData);
      if (result.success) {
        setTitle("");
        setSelectedColor(colorOptions[0].value);
        setIsAdding(false);
        onColumnAdded?.();
      } else {
        console.error("Failed to create column:", result.errors);
      }
    });
  };

  const handleCancel = () => {
    setTitle("");
    setSelectedColor(colorOptions[0].value);
    setIsAdding(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isAdding) {
    return (
      <div className="min-w-80 bg-muted/50 rounded-lg p-4 space-y-3">
        <Input
          type="text"
          placeholder="カラム名を入力..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          className="w-full"
          autoFocus
          disabled={isPending}
        />
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">カラーを選択:</p>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setSelectedColor(color.value)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  selectedColor === color.value
                    ? "border-foreground scale-110"
                    : "border-border hover:border-foreground/50"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.label}
                disabled={isPending}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-1" />
            {isPending ? "追加中..." : "追加"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      className="min-w-80 h-auto p-4 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50 transition-all"
      onClick={() => setIsAdding(true)}
    >
      <Plus className="h-5 w-5 mr-2" />
      新しいカラムを追加
    </Button>
  );
}