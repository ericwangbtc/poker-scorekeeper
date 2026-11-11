const CLIENT_ID_KEY = "poker:roomClientId";

export const generateClientId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `client_${id}`;
};

export const generateHostPin = (
  random = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
) => Math.floor(random() * 900_000 + 100_000).toString();

export const normalizeHostPin = (value: string) => value.replace(/\D/g, "");

export const getOrCreateClientId = () => {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing && /^client_[a-f0-9]{32}$/.test(existing)) return existing;
  const clientId = generateClientId();
  localStorage.setItem(CLIENT_ID_KEY, clientId);
  return clientId;
};
