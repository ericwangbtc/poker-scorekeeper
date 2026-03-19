export const buildRoomPath = (roomId: string, path = "") =>
  path ? `rooms/${roomId}/${path}` : `rooms/${roomId}`;

export const buildHistoryPath = (roomId: string, entryId: string) =>
  buildRoomPath(roomId, `history/${entryId}`);
