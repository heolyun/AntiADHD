import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the AntiADHD portfolio", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="ko">/i);
  assert.match(html, /<title>AntiADHD — AI 집중력 관리 플랫폼<\/title>/i);
  assert.match(html, /AI Worker/);
  assert.match(html, /K3S CLUSTER/);
  assert.match(html, /INCIDENT CASE STUDY/);
  assert.match(html, /Private beta/i);
  assert.doesNotMatch(html, /Your site is taking shape/);
});

test("includes project-bound social preview asset", async () => {
  await access(new URL("../public/og-cover.png", import.meta.url));
});
