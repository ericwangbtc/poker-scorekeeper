const CLIENT_ID_KEY = "poker:clientId";
const HOST_PIN_LENGTH = 6;

const DEFAULT_RANDOM = () => Math.random();

export const generateClientId = (random = DEFAULT_RANDOM) =>
  `client_${random().toString(36).slice(2, 12)}`;

export const generateHostPin = (random = DEFAULT_RANDOM) => {
  const min = 10 ** (HOST_PIN_LENGTH - 1);
  const max = 10 ** HOST_PIN_LENGTH - 1;
  const value = Math.floor(random() * (max - min + 1)) + min;
  return value.toString();
};

export const normalizeHostPin = (value: string) => value.replace(/\D/g, "");

export const matchesHostPin = (input: string, hostPin: string) =>
  normalizeHostPin(input) === normalizeHostPin(hostPin);

export const isHostClient = ({
  currentClientId,
  hostClientId,
}: {
  currentClientId: string | null | undefined;
  hostClientId: string | null | undefined;
}) => Boolean(currentClientId && hostClientId && currentClientId === hostClientId);

export const getOrCreateClientId = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) {
    return existing;
  }
  const next = generateClientId();
  window.localStorage.setItem(CLIENT_ID_KEY, next);
  return next;
};
