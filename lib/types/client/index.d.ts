/**
 * dsh-subagent-setting — client bundle types.
 *
 * The client half registers the "Subagent model" page in the settings panel
 * (Settings → Subagent 模型). It reads and writes the Host entry's Config
 * through the settings document (`ctx.configForms`) and reads the provider /
 * model / reasoning-effort catalogue through `ctx.remote.session.modelCatalog`.
 *
 * Runtime behavior lives in `client/client.js`, which is a
 * `window.__ModuleLoader__` bundle rather than a module this file describes.
 */

/** Cordis client plugin entry. */
export declare function apply(ctx: unknown): void;

/** Cordis client hard dependencies (cordis fiber inject). */
export declare const inject: readonly ['slots', 'locale', 'remote', 'remote.session', 'configForms'];

/** The settings entry id this page edits; also the DSH plugin name. */
export declare const NS: 'dsh-subagent-setting';
