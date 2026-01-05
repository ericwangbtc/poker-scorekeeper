"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DisplayMode } from "@/lib/types";
import { History, QrCode, Settings, Share2 } from "lucide-react";

interface RoomHeaderProps {
  roomId: string;
  hintMessage: string | null;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
  onShare: () => void;
  onQrCode: () => void;
  onSettings: () => void;
  onHistory: () => void;
  onCreateRoom: () => void;
  disabled?: boolean;
}

export function RoomHeader({
  roomId,
  hintMessage,
  displayMode,
  onDisplayModeChange,
  onShare,
  onQrCode,
  onSettings,
  onHistory,
  onCreateRoom,
  disabled,
}: RoomHeaderProps) {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-border/50 bg-elevated/80 px-3 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-elevated/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="border-primary/30 bg-primary/10 px-2.5 py-0.5 font-mono font-bold text-primary"
          >
            {roomId}
          </Badge>
          <ToggleGroup
            type="single"
            value={displayMode}
            onValueChange={(v) => v && onDisplayModeChange(v as DisplayMode)}
            className="rounded-full bg-muted/50 p-0.5"
          >
            <ToggleGroupItem
              value="chip"
              disabled={disabled}
              className="rounded-full px-3 py-1 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              筹码
            </ToggleGroupItem>
            <ToggleGroupItem
              value="cash"
              disabled={disabled}
              className="rounded-full px-3 py-1 text-xs font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              金额
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onHistory}
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onShare}
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onQrCode}
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <QrCode className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            disabled={disabled}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {hintMessage ?? "实时同步中..."}
        </p>
        <Button
          size="sm"
          onClick={onCreateRoom}
          disabled={disabled}
          className="h-7 px-3 text-xs gold-gradient text-primary-foreground"
        >
          新建房间
        </Button>
      </div>
    </header>
  );
}
