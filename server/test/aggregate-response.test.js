const test = require("node:test");
const assert = require("node:assert/strict");

const { buildAggregatePayload, getAggregateCacheKey, isAggregateFresh } = require("../utils/aggregate-response");

test("aggregate payload derives statuses without another status-store read", () => {
  const payload = buildAggregatePayload(
    [
      { source: "weibo", items: [{ rank: 1 }], dataState: "cached", updatedAt: "2026-07-15T10:00:00.000Z" },
      { source: "zhihu", items: [], dataState: "error", error: true, message: "failed", updatedAt: "2026-07-15T10:00:00.000Z" },
    ],
    600,
    { backend: "memory", shared: false },
  );

  assert.equal(payload.platforms.length, 2);
  assert.deepEqual(payload.statuses.map((item) => item.status), ["cached", "failed"]);
  assert.equal(payload.ttlSec, 600);
  assert.ok(payload.generatedAt);
});

test("aggregate cache key is versioned and independent from search text", () => {
  assert.equal(getAggregateCacheKey(), "hot:aggregate:v2");
});

test("aggregate freshness is separate from its longer stale fallback lifetime", () => {
  const now = Date.parse("2026-07-15T10:00:00.000Z");
  assert.equal(isAggregateFresh({ freshUntil: "2026-07-15T10:00:01.000Z" }, now), true);
  assert.equal(isAggregateFresh({ freshUntil: "2026-07-15T09:59:59.000Z" }, now), false);
});
