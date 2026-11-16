"use client";

import type { MouseEventHandler } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Settings, Share2 } from "lucide-react";

interface RoomHeaderProps {
  roomId: string;
  chipsPerHand: number;
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
  chipsPerHand,
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
    <header className="@container sticky top-0 z-20 w-full shrink-0 border-b border-border/50 bg-elevated/80 px-2 py-2.5 backdrop-blur-xl supports-[backdrop-filter]:bg-elevated/60 sm:px-3">
      <div className="flex min-w-0 flex-nowrap items-center gap-[clamp(2px,1cqw,8px)] whitespace-nowrap text-[clamp(10px,2.8cqw,12px)]">
        <Badge
          variant="outline"
          className="hidden shrink-0 border-primary/25 bg-primary/10 px-2 py-1 text-[1em] font-semibold tracking-wide text-primary @[40rem]:inline-flex"
        >
          {roomId}
        </Badge>
        <div className="flex min-w-0 items-center gap-[0.65em]">
          <p
            title={`每手 ${chipsPerHand} 筹码`}
            className="flex min-w-0 items-baseline gap-[0.35em]"
          >
            <span className="shrink-0 text-muted-foreground/75">每手</span>
            <span className="truncate text-[1.15em] font-semibold leading-none text-foreground tabular-nums">
              {chipsPerHand}
            </span>
          </p>
          <span aria-hidden="true" className="h-3 w-px shrink-0 bg-border" />
          <span
            title={isHost ? "房主" : "仅房主可调整手数"}
            className={`shrink-0 text-[0.9em] font-medium ${isHost ? "text-primary/85" : "text-muted-foreground"}`}
          >
            {isHost ? "房主" : "访客"}
          </span>
        </div>
        <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-[clamp(0px,0.6cqw,4px)]">
          <Button
            variant="ghost"
            size="icon"
            onClick={onInvite}
            aria-label="邀请玩家"
            title="邀请玩家"
            disabled={disabled}
            className="h-9 w-[clamp(28px,8cqw,36px)] gap-1 rounded-lg text-primary @[28rem]:w-auto @[28rem]:px-2"
          >
            <Share2 aria-hidden="true" className="size-4" />
            <span className="hidden text-[1em] @[28rem]:inline">邀请</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onHistory}
            aria-label="变更记录"
            title="变更记录"
            disabled={disabled}
            className="h-9 w-[clamp(28px,8cqw,36px)] rounded-lg text-muted-foreground hover:text-foreground"
          >
            <History aria-hidden="true" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            aria-label="房间设置"
            title="房间设置"
            disabled={disabled}
            className="h-9 w-[clamp(28px,8cqw,36px)] rounded-lg text-muted-foreground hover:text-foreground"
          >
            <Settings aria-hidden="true" className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={isHost ? onRevealHostPin : onClaimHost}
            aria-label={isHost ? "查看房主 PIN" : "通过 PIN 认领房主"}
            disabled={disabled}
            className="h-9 rounded-lg border-border/70 px-[0.65em] text-[1em]"
          >
            {isHost ? "PIN" : "认领"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCreateRoom}
            disabled={disabled}
            className="h-9 gap-0 rounded-lg border-primary/35 bg-primary/10 px-[0.75em] text-[1em] font-semibold text-primary hover:border-primary/60 hover:bg-primary/20 hover:text-primary active:bg-primary/30"
          >
            新建<span className="hidden @[28rem]:inline">房间</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
