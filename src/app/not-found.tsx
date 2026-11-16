import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🃏</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          房间不存在
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          该房间可能已过期或从未创建过。
        </p>
        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  );
}
