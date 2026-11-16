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

test("generateHostPin returns 4 digits at both range boundaries", () => {
  const pin = generateHostPin(() => 0);

  assert.equal(pin, "1000");
  assert.equal(pin.length, 4);
  assert.equal(generateHostPin(() => 1 - Number.EPSILON), "9999");
});

test("normalizeHostPin strips all non-digits", () => {
  assert.equal(normalizeHostPin(" 12-3 4a5 "), "12345");
});
