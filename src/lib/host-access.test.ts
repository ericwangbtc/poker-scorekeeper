import test from "node:test";
import assert from "node:assert/strict";
import {
  generateClientId,
  generateHostPin,
  normalizeHostPin,
} from "./host-access.ts";

test("generateClientId prefixes with client_", () => {
  const clientId = generateClientId();

  assert.match(clientId, /^client_[a-f0-9]{32}$/);
});

test("generateHostPin always returns 6 digits", () => {
  const pin = generateHostPin(() => 0);

  assert.equal(pin, "100000");
  assert.equal(pin.length, 6);
});

test("normalizeHostPin strips all non-digits", () => {
  assert.equal(normalizeHostPin(" 12-3 4a5 "), "12345");
});
