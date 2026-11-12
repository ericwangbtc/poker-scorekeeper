import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import { subscribeToRoom } from "./room-service.ts";

class Socket {
  static instances: Socket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  closed = false;
  sent: string[] = [];
  constructor() { Socket.instances.push(this); }
  send(message: string) { this.sent.push(message); }
  close() { this.closed = true; this.onclose?.(); }
  snapshot(value: unknown) { this.onmessage?.({ data: JSON.stringify(value) }); }
}

function setup(t: TestContext) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  Socket.instances = [];
  const originalSocket = globalThis.WebSocket;
  Object.defineProperty(globalThis, "WebSocket", { configurable: true, writable: true, value: Socket });
  Object.defineProperty(globalThis, "window", {
    configurable: true, value: { location: { origin: "https://poker.test" } },
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true, value: { getItem: () => `client_${"a".repeat(32)}` },
  });
  t.after(() => {
    globalThis.WebSocket = originalSocket;
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "localStorage");
  });
}

test("a brief initial failure retries without displaying an error", (t) => {
  setup(t);
  const errors: Error[] = [];
  const snapshots: unknown[] = [];
  const stop = subscribeToRoom("ABCDEF", (room) => snapshots.push(room), (error) => errors.push(error));
  Socket.instances[0].close();
  t.mock.timers.tick(250);
  const socket = Socket.instances[1];
  socket.onopen?.();
  assert.equal(socket.sent.length, 1);
  socket.snapshot({ id: "ABCDEF" });
  t.mock.timers.tick(3_000);
  assert.equal(errors.length, 0);
  assert.equal(snapshots.length, 1);
  stop();
});

test("persistent failures report an error and a later snapshot recovers", (t) => {
  setup(t);
  const errors: Error[] = [];
  const snapshots: unknown[] = [];
  const stop = subscribeToRoom("ABCDEF", (room) => snapshots.push(room), (error) => errors.push(error));
  Socket.instances[0].close();
  t.mock.timers.tick(250);
  t.mock.timers.tick(2_750);
  assert.equal(errors.length, 1);
  Socket.instances[1].snapshot({ id: "ABCDEF" });
  assert.equal(snapshots.length, 1);
  stop();
});

test("a connection without a snapshot times out and retries", (t) => {
  setup(t);
  const stop = subscribeToRoom("ABCDEF", () => {}, () => {});
  t.mock.timers.tick(8_000);
  assert.equal(Socket.instances[0].closed, true);
  t.mock.timers.tick(250);
  assert.equal(Socket.instances.length, 2);
  stop();
});

test("cleanup cancels retries and late events", (t) => {
  setup(t);
  const errors: Error[] = [];
  const stop = subscribeToRoom("ABCDEF", () => assert.fail("late snapshot"), (error) => errors.push(error));
  Socket.instances[0].close();
  stop();
  t.mock.timers.tick(30_000);
  assert.equal(Socket.instances.length, 1);
  assert.equal(errors.length, 0);
});

test("a missing room is terminal and does not reconnect", (t) => {
  setup(t);
  const snapshots: unknown[] = [];
  const stop = subscribeToRoom("ABCDEF", (room) => snapshots.push(room), () => assert.fail("unexpected error"));
  Socket.instances[0].snapshot(null);
  Socket.instances[0].close();
  t.mock.timers.tick(30_000);
  assert.deepEqual(snapshots, [null]);
  assert.equal(Socket.instances.length, 1);
  stop();
});
