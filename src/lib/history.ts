import type { HistoryEntry } from "./types";

type RelativeTimeOptions = {
  now?: number;
  locale?: string;
  timeZone?: string;
};

type GroupHistoryOptions = RelativeTimeOptions;

export type HistoryTone = "positive" | "negative" | "neutral";

export interface HistoryDescription {
  title: string;
  subtitle: string;
  value: string;
  tone: HistoryTone;
}

export interface GroupedHistoryItem {
  entry: HistoryEntry;
  description: HistoryDescription;
  timeLabel: string;
  relativeLabel: string;
}

export interface GroupedHistorySection {
  key: string;
  label: string;
  items: GroupedHistoryItem[];
}

type CreateHistoryInput = Omit<HistoryEntry, "id" | "timestamp"> & {
  timestamp?: number;
};

const generateHistoryId = (timestamp?: number) => {
  const timePortion = (timestamp ?? Date.now()).toString(36);
  const randomPortion = Math.random().toString(36).slice(2, 8);
  return `history_${timePortion}_${randomPortion}`;
};

export const createHistoryEntry = (input: CreateHistoryInput): HistoryEntry => {
  const timestamp = input.timestamp ?? Date.now();
  return {
    ...input,
    id: generateHistoryId(timestamp),
    timestamp,
  };
};

export const describeHistoryEntry = (entry: HistoryEntry): HistoryDescription => {
  if (entry.type === "player_joined") {
    return {
      title: entry.actorName,
      subtitle: "加入了房间",
      value: "",
      tone: "positive",
    };
  }

  if (entry.type === "player_left") {
    return {
      title: entry.actorName,
      subtitle: "离开了房间",
      value: "",
      tone: "negative",
    };
  }

  const delta = entry.handsDelta ?? 0;
  const absDelta = Math.abs(delta);
  const isAdd = delta > 0;
  const totalSuffix =
    typeof entry.handsTotal === "number" ? `（当前 ${entry.handsTotal} 手）` : "";

  return {
    title: entry.actorName,
    subtitle: `${isAdd ? "增加" : "减少"}手数${totalSuffix}`,
    value: absDelta > 0 ? `${isAdd ? "+" : "-"}${absDelta}` : "",
    tone: isAdd ? "positive" : "negative",
  };
};

const toDateParts = (timestamp: number, locale: string, timeZone?: string) => {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return { year, month, day, key: `${year}-${month}-${day}` };
};

const dayDistance = (
  sourceTimestamp: number,
  nowTimestamp: number,
  locale: string,
  timeZone?: string
) => {
  const nowParts = toDateParts(nowTimestamp, locale, timeZone);
  const sourceParts = toDateParts(sourceTimestamp, locale, timeZone);
  const nowDate = Date.UTC(
    Number(nowParts.year),
    Number(nowParts.month) - 1,
    Number(nowParts.day)
  );
  const sourceDate = Date.UTC(
    Number(sourceParts.year),
    Number(sourceParts.month) - 1,
    Number(sourceParts.day)
  );
  const distance = Math.floor((nowDate - sourceDate) / (24 * 60 * 60 * 1000));
  return distance;
};

export const formatRelativeTime = (
  timestamp: number,
  options: RelativeTimeOptions = {}
) => {
  const nowValue = options.now ?? Date.now();
  const locale = options.locale ?? "zh-CN";
  const diffMs = nowValue - timestamp;

  if (diffMs < 10_000) {
    return "刚刚";
  }

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) {
    return `${Math.floor(diffMs / 1_000)} 秒前`;
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }

  const days = dayDistance(timestamp, nowValue, locale, options.timeZone);
  if (days === 1) {
    return "昨天";
  }
  if (days < 7) {
    return `${days} 天前`;
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: options.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(timestamp));
};

export const formatHistoryTime = (
  timestamp: number,
  options: Pick<RelativeTimeOptions, "locale" | "timeZone"> = {}
) => {
  const locale = options.locale ?? "zh-CN";
  return new Intl.DateTimeFormat(locale, {
    timeZone: options.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(timestamp));
};

const formatDayLabel = (
  timestamp: number,
  options: Required<Pick<RelativeTimeOptions, "locale">> &
    Pick<RelativeTimeOptions, "timeZone" | "now">
) => {
  const locale = options.locale;
  const nowValue = options.now ?? Date.now();
  const distance = dayDistance(timestamp, nowValue, locale, options.timeZone);

  if (distance === 0) {
    return "今天";
  }
  if (distance === 1) {
    return "昨天";
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: options.timeZone,
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(timestamp));
};

export const groupHistoryEntries = (
  entries: HistoryEntry[],
  options: GroupHistoryOptions = {}
): GroupedHistorySection[] => {
  const locale = options.locale ?? "zh-CN";
  const nowValue = options.now ?? Date.now();

  const sortedEntries = [...entries].sort(
    (a, b) => b.timestamp - a.timestamp || b.id.localeCompare(a.id)
  );

  const sectionByKey = new Map<string, GroupedHistorySection>();

  sortedEntries.forEach((entry) => {
    const day = toDateParts(entry.timestamp, locale, options.timeZone);
    const existing = sectionByKey.get(day.key);
    const item: GroupedHistoryItem = {
      entry,
      description: describeHistoryEntry(entry),
      timeLabel: formatHistoryTime(entry.timestamp, {
        locale,
        timeZone: options.timeZone,
      }),
      relativeLabel: formatRelativeTime(entry.timestamp, {
        now: nowValue,
        locale,
        timeZone: options.timeZone,
      }),
    };

    if (existing) {
      existing.items.push(item);
      return;
    }

    sectionByKey.set(day.key, {
      key: day.key,
      label: formatDayLabel(entry.timestamp, {
        locale,
        timeZone: options.timeZone,
        now: nowValue,
      }),
      items: [item],
    });
  });

  return Array.from(sectionByKey.values());
};
