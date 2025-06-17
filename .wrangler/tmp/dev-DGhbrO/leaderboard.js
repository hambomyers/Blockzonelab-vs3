var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-DjsU6F/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-DjsU6F/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// worker/leaderboard.js
var leaderboard_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    try {
      if (url.pathname === "/api/scores" && request.method === "POST") {
        return handleSubmitScore(request, env, headers);
      }
      if (url.pathname === "/api/leaderboard" && request.method === "GET") {
        return handleGetLeaderboard(request, env, headers);
      }
      if (url.pathname === "/api/leaderboard/large" && request.method === "GET") {
        return handleGetLargeLeaderboard(request, env, headers);
      }
      if (url.pathname.startsWith("/api/players/") && url.pathname.endsWith("/stats")) {
        return handleGetPlayerStats(request, env, headers);
      }
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers
      });
    }
  }
};
async function handleSubmitScore(request, env, headers) {
  const data = await request.json();
  const { score, replay_hash, metrics, player_id, timestamp } = data;
  const validation = validateScore(score, metrics);
  if (!validation.valid) {
    return new Response(JSON.stringify({
      verified: false,
      reason: validation.reason
    }), { status: 400, headers });
  }
  const existing = await env.SCORES.get(`replay:${replay_hash}`);
  if (existing) {
    return new Response(JSON.stringify({
      verified: false,
      reason: "Duplicate submission"
    }), { status: 400, headers });
  }
  const scoreId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const scoreData = {
    id: scoreId,
    player_id,
    score,
    replay_hash,
    metrics,
    timestamp: timestamp || Date.now(),
    verified: true
  };
  await Promise.all([
    env.SCORES.put(`replay:${replay_hash}`, JSON.stringify(scoreData)),
    env.SCORES.put(`score:${scoreId}`, JSON.stringify(scoreData)),
    updatePlayerHighScore(env, player_id, score),
    updateLeaderboard(env, "daily", player_id, score),
    updateLeaderboard(env, "weekly", player_id, score),
    updateLeaderboard(env, "all", player_id, score)
  ]);
  const rank = await calculateRank(env, score, "daily");
  return new Response(JSON.stringify({
    verified: true,
    score_id: scoreId,
    rank,
    is_high_score: await isNewHighScore(env, player_id, score)
  }), { headers });
}
__name(handleSubmitScore, "handleSubmitScore");
async function handleGetLeaderboard(request, env, headers) {
  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "daily";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "100"), 100);
  const game = url.searchParams.get("game") || "neon_drop";
  const leaderboardKey = `leaderboard:${game}:${period}`;
  const data = await env.SCORES.get(leaderboardKey, "json") || { scores: [] };
  const scores = data.scores.sort((a, b) => b.score - a.score).slice(0, limit).map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
  return new Response(JSON.stringify({
    period,
    game,
    scores,
    total_players: data.scores.length,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }), { headers });
}
__name(handleGetLeaderboard, "handleGetLeaderboard");
async function handleGetLargeLeaderboard(request, env, headers) {
  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "daily";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "1000"), 1e3);
  const game = url.searchParams.get("game") || "neon_drop";
  const leaderboardKey = `leaderboard:${game}:${period}`;
  const data = await env.SCORES.get(leaderboardKey, "json") || { scores: [] };
  const scores = data.scores.sort((a, b) => b.score - a.score).slice(0, limit).map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
  return new Response(JSON.stringify({
    period,
    game,
    scores,
    total_players: data.scores.length,
    page_size: limit,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }), { headers });
}
__name(handleGetLargeLeaderboard, "handleGetLargeLeaderboard");
async function handleGetPlayerStats(request, env, headers) {
  const url = new URL(request.url);
  const playerId = url.pathname.split("/")[3];
  const playerData = await env.SCORES.get(`player:${playerId}`, "json") || {
    high_score: 0,
    games_played: 0,
    total_score: 0
  };
  const rank = await calculateRank(env, playerData.high_score, "daily");
  return new Response(JSON.stringify({
    ...playerData,
    avg_score: playerData.games_played > 0 ? Math.floor(playerData.total_score / playerData.games_played) : 0,
    current_rank: rank
  }), { headers });
}
__name(handleGetPlayerStats, "handleGetPlayerStats");
function validateScore(score, metrics) {
  if (metrics.apm > 300) {
    return { valid: false, reason: "APM too high" };
  }
  if (metrics.pps > 3.5) {
    return { valid: false, reason: "PPS too high" };
  }
  const maxScorePerSecond = 150;
  const maxPossibleScore = metrics.gameTime / 1e3 * maxScorePerSecond;
  if (score > maxPossibleScore) {
    return { valid: false, reason: "Score impossible for duration" };
  }
  return { valid: true };
}
__name(validateScore, "validateScore");
async function updatePlayerHighScore(env, playerId, score) {
  const key = `player:${playerId}`;
  const existing = await env.SCORES.get(key, "json") || {
    high_score: 0,
    games_played: 0,
    total_score: 0,
    display_name: `Player ${playerId.slice(0, 6)}`
  };
  existing.games_played++;
  existing.total_score += score;
  if (score > existing.high_score) {
    existing.high_score = score;
  }
  await env.SCORES.put(key, JSON.stringify(existing));
}
__name(updatePlayerHighScore, "updatePlayerHighScore");
async function updateLeaderboard(env, period, playerId, score, game = "neon_drop") {
  const key = `leaderboard:${game}:${period}`;
  const leaderboard = await env.SCORES.get(key, "json") || { scores: [] };
  leaderboard.scores = leaderboard.scores.filter((s) => s.player_id !== playerId);
  const playerData = await env.SCORES.get(`player:${playerId}`, "json");
  leaderboard.scores.push({
    player_id: playerId,
    display_name: playerData?.display_name || `Player ${playerId.slice(0, 6)}`,
    score,
    timestamp: Date.now()
  });
  leaderboard.scores.sort((a, b) => b.score - a.score);
  leaderboard.scores = leaderboard.scores.slice(0, 1e3);
  await env.SCORES.put(key, JSON.stringify(leaderboard));
}
__name(updateLeaderboard, "updateLeaderboard");
async function calculateRank(env, score, period, game = "neon_drop") {
  const leaderboard = await env.SCORES.get(`leaderboard:${game}:${period}`, "json") || { scores: [] };
  return leaderboard.scores.filter((s) => s.score > score).length + 1;
}
__name(calculateRank, "calculateRank");
async function isNewHighScore(env, playerId, score) {
  const playerData = await env.SCORES.get(`player:${playerId}`, "json");
  return !playerData || score > (playerData.high_score || 0);
}
__name(isNewHighScore, "isNewHighScore");
async function cleanupWeeklyLeaderboards(env) {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1e3;
  const weeklyData = await env.SCORES.get("leaderboard:neon_drop:weekly", "json");
  if (weeklyData) {
    weeklyData.scores = weeklyData.scores.filter((score) => score.timestamp > oneWeekAgo);
    await env.SCORES.put("leaderboard:neon_drop:weekly", JSON.stringify(weeklyData));
  }
}
__name(cleanupWeeklyLeaderboards, "cleanupWeeklyLeaderboards");
async function cleanupDailyLeaderboards(env) {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1e3;
  const dailyData = await env.SCORES.get("leaderboard:neon_drop:daily", "json");
  if (dailyData) {
    dailyData.scores = dailyData.scores.filter((score) => score.timestamp > oneDayAgo);
    await env.SCORES.put("leaderboard:neon_drop:daily", JSON.stringify(dailyData));
  }
}
__name(cleanupDailyLeaderboards, "cleanupDailyLeaderboards");

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-DjsU6F/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = leaderboard_default;

// ../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-DjsU6F/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  cleanupDailyLeaderboards,
  cleanupWeeklyLeaderboards,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=leaderboard.js.map
