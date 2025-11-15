const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const generateRoomId = () => {
  let result = "";
  for (let i = 0; i < 6; i += 1) {
    const index = Math.floor(Math.random() * LETTERS.length);
    result += LETTERS[index];
  }
  return result;
};

export const generatePlayerId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `player_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
  }
  return `player_${Math.random().toString(36).slice(2, 10)}`;
};

export const generateHistoryId = (timestamp?: number) => {
  const timePortion = (timestamp ?? Date.now()).toString(36);
  const randomPortion = Math.random().toString(36).slice(2, 8);
  return `history_${timePortion}_${randomPortion}`;
};
