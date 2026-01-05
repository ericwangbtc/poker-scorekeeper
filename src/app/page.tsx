"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createRoom } from "@/lib/room-service";

export default function HomePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setIsCreating(true);
      setError(null);
      const roomId = await createRoom(displayName.trim() || undefined);
      router.push(`/room/${roomId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "创建房间失败，请稍后再试。";
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-4 py-12">
        <header className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/30">
            <span className="text-3xl">🎰</span>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">
            Texas Hold&apos;em
          </Badge>
          <h1 className="text-2xl font-bold text-foreground">
            德州扑克记分板
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            创建实时同步的房间，邀请好友一起记录筹码，支持移动端随时查看与编辑。
          </p>
        </header>

        <Card className="mt-8 border-t-2 border-t-primary/50 bg-card">
          <CardContent className="p-4 pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="displayName"
                  className="text-sm font-medium text-foreground"
                >
                  主持人昵称（可选）
                </label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="用于自动添加的首位玩家"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isCreating}
                className="h-12 w-full gold-gradient font-semibold text-primary-foreground"
              >
                {isCreating ? "创建中..." : "创建新局"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">
          房间将保留30天，无需注册，分享链接即可进入。
        </p>
      </div>
    </main>
  );
}
