import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";

interface Board {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
}

interface BoardListProps {
  boards: Board[];
}

export function BoardList({ boards }: BoardListProps) {
  if (boards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">ボードがありません</p>
        <p className="text-muted-foreground text-sm mt-2">
          新しいボードを作成してプロジェクトを始めましょう
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {boards.map((board) => (
        <Link key={board.id} href={`/boards/${board.id}`}>
          <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
            <CardHeader>
              <CardTitle className="truncate">{board.title}</CardTitle>
              {board.description && (
                <CardDescription className="line-clamp-2">
                  {board.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <CalendarIcon className="mr-2 h-4 w-4" />
                <time dateTime={board.createdAt.toISOString()}>
                  {new Intl.DateTimeFormat("ja-JP", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(board.createdAt))}
                </time>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}