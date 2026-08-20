/**
 * dsh-subagent-setting — client bundle types.
 *
 * The client half registers a "Subagent Model" section in the settings panel
 * (Settings → Subagent 模型) using the official connection API. Runtime
 * behavior lives in `client/client.js` (a `window.__ModuleLoader__` bundle).
 */

/** Cordis client plugin entry. */
export declare function apply(ctx: unknown): void;

/** Cordis client hard dependencies. */
export declare const inject: readonly ['slots', 'locale', 'connection'];

/** The DSH plugin name (also the cordis patch entry name). */
export declare const name: 'dsh-subagent-setting';
