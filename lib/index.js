/**
 * dsh-subagent-setting — host entry (DSH 0.2.x).
 *
 * Gives every subagent created from now on a user-chosen provider / model /
 * reasoning effort, without touching how the parent session runs. The values
 * live in this plugin's own Config, so the Host projects them into the Web
 * settings page (Settings → Subagent model) and the browser half writes them
 * back through the ordinary settings document.
 *
 * Behavior:
 * - A subagent created AFTER a settings change runs with the new values.
 * - A subagent created BEFORE the change keeps its creation-time values unless
 *   `applyToIdle` is on, in which case it follows the newest values from its
 *   next request. A running subagent can never be re-pointed mid-request.
 * - Empty provider / model / effort contributes nothing, so an unconfigured
 *   plugin is a true no-op and the child inherits the parent route.
 *
 * Why it hooks the request instead of the delegation tool: the tool's own
 * `agentOptions` row lives in the Agent preset, which this profile does not
 * own. Rewriting the child's call config keeps the choice in one place and
 * applies to every child regardless of which delegation tool created it.
 */
import z from '@deepseek-ai/schemastery';

const name = 'dsh-subagent-setting';

/** Every reasoning effort the UI may offer, in escalation order. */
const REASONING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

/**
 * The settings document. Every field is `volatile()`, which is what makes the
 * entry appear on the settings page at all: the Host projects only volatile
 * fields into a form, and a live write commits into this running fiber instead
 * of remounting the plugin. Empty provider / model / effort inherit the parent.
 */
const Config = z.object({
  enabled: z.boolean().default(true).volatile(),
  provider: z.string().default('').volatile(),
  model: z.string().default('').volatile(),
  reasoningEffort: z.string().default('').volatile(),
  applyToIdle: z.boolean().default(false).volatile(),
});

/** The agent registry is the only hard dependency; `llm` is read lazily. */
const inject = ['agents'];

/**
 * Read one Config field. A volatile field is a live reference with `.get()`;
 * an ordinary one is a plain value. Accepting both keeps this correct whatever
 * shape the loader hands a function plugin.
 * @param value - the raw field from the resolved config.
 * @returns the current plain value.
 */
function readField(value) {
  if (value === null || typeof value !== 'object') return value;
  return typeof value.get === 'function' ? value.get() : value;
}

/**
 * Narrow a configured effort to one this build knows, mapping the explicit
 * "inherit" spellings to the empty string.
 * @param value - the raw configured effort.
 * @returns a known effort id, or `''` for inherit.
 */
function normalizeEffort(value) {
  if (value === undefined || value === null) return '';
  const text = String(value).trim();
  if (text === '' || text === 'default' || text === 'inherit') return '';
  return REASONING_LEVELS.includes(text) ? text : '';
}

/**
 * Snapshot the live settings.
 * @param config - the plugin's resolved Config.
 * @returns the resolved settings the child route should use.
 */
function readSettings(config) {
  return {
    enabled: readField(config.enabled) !== false,
    provider: String(readField(config.provider) ?? ''),
    model: String(readField(config.model) ?? ''),
    reasoningEffort: normalizeEffort(readField(config.reasoningEffort)),
    applyToIdle: readField(config.applyToIdle) === true,
  };
}

/**
 * The route one child is pinned to. `current` is replaced when `applyToIdle`
 * decides an existing child should follow a newer settings snapshot; the
 * request listener reads it synchronously on every call.
 * @param settings - a resolved settings snapshot.
 * @returns a fresh route holder.
 */
function routeOf(settings) {
  return {
    provider: settings.provider,
    model: settings.model,
    reasoningEffort: settings.reasoningEffort,
  };
}

/**
 * Rewrite one resolved call config for one child route.
 *
 * An inherited reasoning effort belongs to the inherited route, so changing
 * the route without naming an effort drops it and lets the selected model
 * resolve its own default — the same rule the Host's own child-option
 * resolution applies.
 * @param resolved - the config the machine would have used.
 * @param current - the route this child is pinned to.
 * @param resolveEfforts - model capability lookup, or undefined when unknown.
 * @returns the config to use, or `resolved` untouched when nothing is configured.
 */
async function rewriteCallConfig(resolved, current, resolveEfforts) {
  const { provider, model, reasoningEffort } = current;
  if (provider === '' && model === '' && reasoningEffort === '') return resolved;

  const override = { ...resolved };
  const routeChanged =
    (provider !== '' && provider !== resolved.provider) ||
    (model !== '' && model !== resolved.model);

  if (provider !== '') override.provider = provider;
  if (model !== '') override.model = model;

  if (reasoningEffort !== '') {
    const efforts = await resolveEfforts(override.provider, override.model);
    // An unknown capability set means the lookup failed: keep the value and let
    // the LLM layer answer, rather than silently dropping a valid setting.
    if (efforts === undefined || efforts.has(reasoningEffort)) override.reasoningEffort = reasoningEffort;
    else delete override.reasoningEffort;
  } else if (routeChanged) {
    delete override.reasoningEffort;
  }

  return override;
}

/**
 * Cordis plugin body.
 * @param ctx - host plugin context.
 * @param config - the resolved volatile Config described above.
 */
function apply(ctx, config) {
  /** Model capability cache: `provider\u0000model` -> Set<effort> | undefined. */
  const effortCache = new Map();
  /** Live children this plugin pins: agent -> route holder. */
  const liveRoutes = new Map();

  /** Resolve the efforts one exact route supports, cached until a settings change. */
  const resolveEfforts = async (provider, model) => {
    const llm = ctx.get('llm');
    if (llm === undefined) return undefined;
    const key = `${provider}\u0000${model}`;
    if (effortCache.has(key)) return effortCache.get(key);
    let efforts;
    try {
      const info = await llm.resolveModelInfo(provider, model);
      efforts = info.reasoning === undefined
        ? new Set()
        : new Set(info.reasoning.efforts.map((effort) => effort.id));
    } catch {
      efforts = undefined;
    }
    effortCache.set(key, efforts);
    return efforts;
  };

  ctx.on('agent/created', ({ agent }) => {
    if (agent === undefined || agent === null) return;
    if (liveRoutes.has(agent)) return;
    // Only children are pinned; the parent session keeps whatever it was using.
    if (agent.session?.header?.origin !== 'subagent') return;

    const settings = readSettings(config);
    if (!settings.enabled) return;

    const route = { current: routeOf(settings) };
    liveRoutes.set(agent, route);

    const dispose = agent.ctx.on('agent/request', async (_payload, next) => {
      const resolved = await next();
      return await rewriteCallConfig(resolved, route.current, resolveEfforts);
    });

    agent.ctx.effect(() => () => {
      dispose();
      liveRoutes.delete(agent);
    }, 'dsh-subagent-setting: child route override');
  });

  // A volatile-only write commits into this same fiber, so `config` is already
  // current here; only the capability cache and, optionally, existing children
  // need to follow.
  ctx.on('loader/volatile-update', () => {
    effortCache.clear();
    const settings = readSettings(config);
    if (!settings.applyToIdle) return;
    const next = routeOf(settings);
    for (const route of liveRoutes.values()) route.current = next;
  });
}

export { Config, REASONING_LEVELS, apply, inject, name };
