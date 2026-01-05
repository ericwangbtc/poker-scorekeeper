"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { HistoryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: HistoryEntry[];
}

const formatTimestamp = (timestamp: number) => {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(timestamp));
  } catch {
    return new Date(timestamp).toLocaleTimeString();
  }
};

const parseMessage = (msg: string) => {
  const handMatch = msg.match(/^(.+?) (增加了|减少了) (\d+) 手/);
  if (handMatch) {
    const isAdd = handMatch[2] === "增加了";
    return {
      name: handMatch[1],
      action: isAdd ? "增加手数" : "减少手数",
      value: isAdd ? `+${handMatch[3]}` : `-${handMatch[3]}`,
      isPositive: isAdd,
      parsed: true,
    };
  }
  return { name: msg, action: "", value: "", isPositive: false, parsed: false };
};

export function HistorySheet({
  open,
  onOpenChange,
  entries,
}: HistorySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] rounded-t-2xl border-border/50 bg-elevated/95 backdrop-blur-xl"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>历史记录</SheetTitle>
        </SheetHeader>
        <div className="max-h-[70vh] overflow-y-auto pl-2 pr-1">
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              暂无历史记录。
            </p>
          ) : (
            <ul className="relative ml-2 space-y-0 border-l border-border/50 pb-8">
              {entries.map((entry) => {
                const info = parseMessage(entry.message);
                return (
                  <li key={entry.id} className="relative pb-6 pl-6 last:pb-0">
                    <span
                      className={cn(
                        "absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background ring-4 ring-background",
                        info.parsed
                          ? info.isPositive
                            ? "bg-profit"
                            : "bg-loss"
                          : "bg-muted-foreground"
                      )}
                    />
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          {info.parsed ? info.name : info.name}
                        </span>
                        {info.parsed && (
                          <span className="text-xs text-muted-foreground">
                            {info.action}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        {info.parsed && (
                          <span
                            className={cn(
                              "font-mono text-sm font-bold",
                              info.isPositive ? "text-profit" : "text-loss"
                            )}
                          >
                            {info.value}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
