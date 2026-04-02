import test from "node:test";
import assert from "node:assert/strict";
import {
  generateClientId,
  generateHostPin,
  isHostClient,
  normalizeHostPin,
  matchesHostPin,
} from "./host-access.ts";

test("generateClientId prefixes with client_", () => {
  const clientId = generateClientId(() => 0.123456789);

  assert.equal(clientId.startsWith("client_"), true);
});

test("generateHostPin always returns 6 digits", () => {
  const pin = generateHostPin(() => 0);

  assert.equal(pin, "100000");
  assert.equal(pin.length, 6);
});

test("normalizeHostPin strips all non-digits", () => {
  assert.equal(normalizeHostPin(" 12-3 4a5 "), "12345");
});

test("matchesHostPin compares normalized inputs", () => {
  assert.equal(matchesHostPin(" 123-456 ", "123456"), true);
  assert.equal(matchesHostPin("123450", "123456"), false);
});

test("isHostClient checks exact client identity", () => {
  assert.equal(
    isHostClient({ currentClientId: "client_a", hostClientId: "client_a" }),
    true
  );
  assert.equal(
    isHostClient({ currentClientId: "client_a", hostClientId: "client_b" }),
    false
  );
});
