/**
 * dsh-subagent-setting — host entry types.
 *
 * The host registers a `dsh-subagent-setting` settings namespace and installs
 * an agent-scoped `agent/request` override on every live subagent. This file
 * only describes the public surface; the runtime behavior lives in
 * `lib/index.js`.
 */

/** Every reasoning effort the settings UI may offer, in escalation order. */
export declare const REASONING_LEVELS: readonly ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

/** The DSH plugin name (also the cordis patch entry name). */
export declare const name: 'dsh-subagent-setting';

/**
 * The settings namespace value.
 * Empty provider / model / effort inherit the parent agent's route.
 */
export interface SubagentSettingSettings {
  /** Master switch; when off, subagents inherit the parent untouched. */
  enabled: boolean;
  /** Provider route id; empty inherits the parent. */
  provider: string;
  /** Model id within {@link SubagentSettingSettings.provider}; empty inherits. */
  model: string;
  /** Reasoning effort; empty inherits (provider default). */
  reasoningEffort: string;
  /** When true, a settings change also re-points already-created live subagents. */
  applyToIdle: boolean;
}

/** Cordis plugin entry. */
export declare function apply(ctx: unknown): void;

/** Cordis hard dependencies. */
export declare const inject: readonly ['settings', 'agents'];
