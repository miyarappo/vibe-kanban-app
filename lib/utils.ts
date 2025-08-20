import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isTaskOverdue(dueDate: Date | null | undefined): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

export function getOverdueRelativeTime(dueDate: Date | null | undefined): string {
  if (!dueDate || !isTaskOverdue(dueDate)) return ""
  
  const now = new Date()
  const due = new Date(dueDate)
  const diffInMs = now.getTime() - due.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return "今日期限切れ"
  } else if (diffInDays === 1) {
    return "1日前に期限切れ"
  } else {
    return `${diffInDays}日前に期限切れ`
  }
}
