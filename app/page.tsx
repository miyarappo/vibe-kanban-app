import { CreateBoardDialog } from "@/app/components/create-board-dialog";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Vibe Kanban</h1>
            <CreateBoardDialog />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">カンバンボードで効率的なプロジェクト管理</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            タスクの管理と進捗の可視化を簡単に。新しいボードを作成してプロジェクトを始めましょう。
          </p>
          <CreateBoardDialog />
        </div>
      </main>
    </div>
  );
}
