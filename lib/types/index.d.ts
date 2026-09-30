/**
 * dsh-subagent-setting — host entry types.
 *
 * The Host half owns one Config whose fields are all `volatile()`, which is what
 * makes the entry appear on the settings page, and pins every subagent created
 * from then on to the configured route by rewriting its LLM call config. The
 * runtime behavior lives in `lib/index.js`; this file describes its surface.
 */

/** Every reasoning effort the settings UI may offer, in escalation order. */
export declare const REASONING_LEVELS: readonly ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

/** The DSH plugin name (also the cordis patch entry id). */
export declare const name: 'dsh-subagent-setting';

/**
 * The settings document, projected to the settings page.
 * Empty provider / model / effort inherit the parent agent.
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
export declare function apply(ctx: unknown, config: unknown): void;

/** Cordis hard dependencies. */
export declare const inject: readonly ['agents'];
