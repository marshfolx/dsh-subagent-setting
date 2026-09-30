# dsh-subagent-setting

Configure the default **provider / model / reasoning effort** for subagents from the DeepSeek Harness Web settings page. Newly created subagents pick the values up immediately; an optional switch also lets later settings changes reach subagents that were created earlier.

Requires DSH **0.2.x**.

![image-20260821012945376](pics/README/image-20260821012945376.png)

## Features

- **Settings page** (Settings → Subagent Model): pick provider, model and reasoning effort from the live model catalog — no manual YAML editing.
- **A subagent can run a different model than its parent** — the reason this plugin exists. The parent session keeps its own model; children go where you point them here.
- **New subagents use the new settings immediately** — the route is snapshotted when the child is created and applies to that child alone.
- **Optional live propagation** (Apply setting changes to subagents created earlier): when enabled, a settings change also updates every existing idle subagent — the new values apply on its next request (a running subagent picks them up from the next step). When disabled, only subagents created after the change are affected.
- **Empty provider / model / effort means *inherit the parent***. With all three empty the plugin does not interfere at all.
- **WebView-friendly custom dropdowns**: the settings form uses fully controlled custom dropdowns instead of native `<select>` popups, so it behaves the same in the browser and inside a Tauri (WebView2) shell.

## How it works

- **Host** (`lib/index.js`) is a plugin whose Config *is* the settings document: all five fields are marked `volatile()`, and the 0.2 settings surface projects only volatile fields — so the entry shows up on its own, with no namespace to register.
- On `agent/created`, for every agent whose `session.header.origin === 'subagent'`, it installs an `agent/request` waterfall listener **on that agent's own scope** and rewrites the final `LlmCallConfig` to the configured route. Scope filtering is what keeps that listener to this one child.
- The listener reads the child's live route holder, so `applyToIdle` only needs to replace that holder to re-point an existing child on its next request. Config changes arrive through the loader's `loader/volatile-update` event.
- **The reasoning effort is validated against the route's real capability** with `llm.resolveModelInfo()` before it is injected. The settings dropdown reads the *same* call (`remote.session.modelCatalog` → `buildModelCatalog`), so the two can never disagree; when the model genuinely does not support the level, the field is dropped rather than sent and rejected.
- Changing the route without naming an effort drops the inherited effort so the new model resolves its own default — the same rule the Host's own child-option resolution applies.
- **Client** (`client/client.js`) reads and writes that entry through `ctx.configForms`, reads the catalogue through `ctx.remote.session.modelCatalog()`, and uses `ctx.configForms.whileServed()` so the page appears only while the Host actually serves the plugin.

## Install

```sh
dsh plugin --profile desktop add <spec>
```

You can also install a local directory from the sidebar **Plugins** page. The package declares `dsh.bundle.patch`, so it joins the profile's bundle list on install.

The Host half depends on `@deepseek-ai/schemastery` to declare its Config schema. A third-party plugin's module resolution cannot see the DSH-bundled `@deepseek-ai/*` packages, so it is declared as an ordinary **dependency** and installed into the profile from npm, pinned to the runtime's own version (3.18.4).

Open **Settings → Subagent Model** to configure it.

## Known limitations

- **The reasoning-effort dropdown is only populated when the model advertises reasoning.** A model hand-declared under `llm-pi-ai` without `reasoningEfforts` is treated by pi-ai as carrying no reasoning metadata, and only *inherit* is offered. Declare `reasoningEfforts` on that provider's model entry to expose levels for it.
- Editable from the Web settings page only; the auto-generated plugin configuration page does not list this entry (that surface projects volatile fields too, but only for bundle rows).

## License

MIT
