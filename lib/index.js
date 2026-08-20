/**
 * dsh-subagent-setting — host entry.
 *
 * Registers a `dsh-subagent-setting` settings namespace and, for every live
 * subagent, installs an agent-scoped `agent/request` listener that overrides
 * the child's provider / model / reasoning effort with the configured values.
 *
 * Behavior:
 * - A subagent created AFTER a settings change always runs with the new values.
 * - A subagent created BEFORE the change keeps its creation-time values unless
 *   `applyToIdle` is enabled, in which case every live subagent (idle included)
 *   follows the newest values on its next request. Running subagents can never
 *   be re-pointed mid-request; the override applies from the next step/turn.
 *
 * The settings UI (client/client.js) reads and writes the same namespace
 * through the official connection API (`settings.describe` / `settings.replace`
 * and `llm.models` for the catalog), so no custom RPC is needed here.
 */
import z from '@deepseek-ai/schemastery';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';

export const name = 'dsh-subagent-setting';

/** Every reasoning effort the UI may offer, in escalation order. */
export const REASONING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

const NAMESPACE = settingsNamespace('dsh-subagent-setting');

/** Settings schema: empty provider/model/effort inherit the parent agent. */
const SubagentSettingSchema = z.object({
  enabled: z.boolean().default(true),
  provider: z.string().default(''),
  model: z.string().default(''),
  reasoningEffort: z.string().default(''),
  applyToIdle: z.boolean().default(false),
});

function normalizeEffort(value) {
  if (value === undefined || value === null) return '';
  const v = String(value).trim();
  if (v === '' || v === 'default' || v === 'inherit') return '';
  return REASONING_LEVELS.includes(v) ? v : '';
}

function readResolved(scope) {
  const value = scope.get();
  return {
    enabled: value.enabled !== false,
    provider: String(value.provider ?? ''),
    model: String(value.model ?? ''),
    reasoningEffort: normalizeEffort(value.reasoningEffort),
    applyToIdle: value.applyToIdle === true,
  };
}

/**
 * A live subagent's effective route. `current` is replaced when the plugin
 * decides the child should follow a newer settings snapshot; the request
 * listener reads it synchronously on every call.
 */
function createChildRoute(settings) {
  return {
    current: {
      provider: settings.provider,
      model: settings.model,
      reasoningEffort: settings.reasoningEffort,
    },
  };
}

/**
 * Build the agent-scoped request override for one child. The listener runs
 * inside the child's own scope (registered on `agent.ctx`), so it receives
 * only this agent's requests. `route.current` holds the values that apply.
 */
function installChildOverride(agent, route) {
  return agent.ctx.on('agent/request', async (_payload, next) => {
    const resolved = await next();
    const { provider, model, reasoningEffort } = route.current;
    const override = { ...resolved };
    if (provider !== '') override.provider = provider;
    if (model !== '') override.model = model;
    if (reasoningEffort !== '') override.reasoningEffort = reasoningEffort;
    else delete override.reasoningEffort;
    return override;
  });
}

export function apply(ctx) {
  const settingsService = ctx.get('settings');
  const agents = ctx.get('agents');
  if (settingsService === undefined || agents === undefined) return;

  const scope = settingsService.register(NAMESPACE, SubagentSettingSchema, { applies: 'live' });

  /** Live children this plugin overrides: agent -> route holder. */
  const liveRoutes = new Map();

  // When `applyToIdle` is enabled, an existing child's route follows the
  // newest settings; otherwise only children created after the change get
  // the new values (handled in agent/created).
  ctx.on('settings/updated', (ns) => {
    if (ns !== NAMESPACE) return;
    const settings = readResolved(scope);
    if (!settings.applyToIdle) return;
    for (const route of liveRoutes.values()) {
      route.current = {
        provider: settings.provider,
        model: settings.model,
        reasoningEffort: settings.reasoningEffort,
      };
    }
  });

  ctx.on('agent/created', ({ agent }) => {
    const header = agent.session?.header;
    if (header === undefined || header.origin !== 'subagent') return;
    if (liveRoutes.has(agent)) return;
    const settings = readResolved(scope);
    if (!settings.enabled) return;
    const route = createChildRoute(settings);
    liveRoutes.set(agent, route);
    const dispose = installChildOverride(agent, route);
    agent.ctx.effect(() => {
      return () => {
        dispose();
        liveRoutes.delete(agent);
      };
    }, 'dsh-subagent-setting: child override');
  });
}

export const inject = ['settings', 'agents'];
