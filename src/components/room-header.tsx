"use client";

import type { MouseEventHandler } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Settings, Share2 } from "lucide-react";

interface RoomHeaderProps {
  roomId: string;
  hintMessage: string | null;
  onInvite: MouseEventHandler<HTMLButtonElement>;
  onSettings: MouseEventHandler<HTMLButtonElement>;
  onHistory: MouseEventHandler<HTMLButtonElement>;
  onCreateRoom: MouseEventHandler<HTMLButtonElement>;
  isHost: boolean;
  onRevealHostPin: MouseEventHandler<HTMLButtonElement>;
  onClaimHost: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

export function RoomHeader({
  roomId,
  hintMessage,
  onInvite,
  onSettings,
  onHistory,
  onCreateRoom,
  isHost,
  onRevealHostPin,
  onClaimHost,
  disabled,
}: RoomHeaderProps) {
  return (
    <header className="@container sticky top-0 z-20 w-full shrink-0 border-b border-border/50 bg-elevated/80 px-3 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-elevated/60">
      <div className="flex items-center justify-between gap-2 whitespace-nowrap">
        <Badge
          variant="outline"
          className="border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary"
        >
          房间号 {roomId}
        </Badge>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onInvite}
            disabled={disabled}
            className="h-8 gap-1 px-2 text-primary"
          >
            <Share2 aria-hidden="true" />
            邀请
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onHistory}
            aria-label="变更记录"
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            aria-label="房间设置"
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-2 flex flex-nowrap items-center justify-start gap-1 whitespace-nowrap text-[clamp(8px,2.5cqw,12px)]">
        <p className="shrink-0 whitespace-nowrap text-muted-foreground">
          {hintMessage ?? "实时同步中..."}
        </p>
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1">
          <Badge
            variant="outline"
            className="shrink-0 whitespace-nowrap border-border bg-muted/40 px-[0.5em] py-0.5 text-[1em]"
          >
            {isHost ? "房主" : "访客"}
          </Badge>
          {!isHost && <span className="shrink-0 whitespace-nowrap text-muted-foreground">仅房主可调整手数</span>}
          <Button
            size="sm"
            variant={isHost ? "outline" : "default"}
            onClick={isHost ? onRevealHostPin : onClaimHost}
            disabled={disabled}
            className={
              isHost
                ? "ml-auto h-7 shrink-0 px-[1.25em] text-[1em]"
                : "ml-auto h-7 shrink-0 px-[1.25em] text-[1em] gold-gradient text-primary-foreground"
            }
          >
            {isHost ? "查看 PIN" : "PIN 认领"}
          </Button>
          <Button
            size="sm"
            onClick={onCreateRoom}
            disabled={disabled}
            className="h-7 shrink-0 px-[1.25em] text-[1em] gold-gradient text-primary-foreground"
          >
            新建房间
          </Button>
        </div>
      </div>
    </header>
  );
}
