window.__ModuleLoader__.load({ id: "dsh-subagent-setting", factory: (require) => {
var module = { exports: {} };
var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const React = require("react");

/* ============================================================
 * dsh-subagent-setting — client half
 *
 * Registers a "Subagent 模型" settings section. The form reads and writes
 * the `dsh-subagent-setting` namespace through the official connection API:
 *   connection.api.settings.describe({})   -> namespaces, incl. our section
 *   connection.api.settings.replace({ ns, section })
 *   connection.api.llm.models({})          -> provider/model/effort catalog
 * ============================================================ */

const NS = 'dsh-subagent-setting';

const zh = {
  nav: 'Subagent 模型',
  title: 'Subagent 默认模型',
  subtitle: '配置新创建 subagent 默认使用的提供商、模型与思考等级；新 subagent 立即生效。',
  enabled: '启用本插件',
  enabledDesc: '关闭后 subagent 继承父会话的模型，不做任何覆盖。',
  provider: '提供商',
  providerEmpty: '继承父会话',
  model: '模型',
  modelEmpty: '继承父会话',
  effort: '思考等级',
  effortEmpty: '继承父会话（Default）',
  applyToIdle: '改设置前已创建的 subagent 也跟随新设置',
  applyToIdleDesc: '开启后，设置变更会对所有空闲中的 subagent 在下一次请求生效；运行中的 subagent 从下一步开始生效。关闭则只影响之后新建的 subagent。',
  saving: '保存中…',
  saved: '已保存',
  saveFailed: '保存失败',
  loadFailed: '设置加载失败',
  catalogFailed: '模型目录加载失败',
  save: '保存设置',
  reset: '放弃更改',
  unsaved: '有未保存的更改',
};

const en = {
  nav: 'Subagent Model',
  title: 'Subagent default model',
  subtitle: 'Choose the default provider, model and reasoning effort for newly created subagents; new subagents pick the values up immediately.',
  enabled: 'Enable this plugin',
  enabledDesc: 'When off, subagents inherit the parent session model untouched.',
  provider: 'Provider',
  providerEmpty: 'Inherit parent',
  model: 'Model',
  modelEmpty: 'Inherit parent',
  effort: 'Reasoning effort',
  effortEmpty: 'Inherit parent (Default)',
  applyToIdle: 'Apply setting changes to subagents created earlier',
  applyToIdleDesc: 'When on, a settings change reaches every idle subagent on its next request; running subagents pick it up from the next step. When off, only subagents created afterwards are affected.',
  saving: 'Saving…',
  saved: 'Saved',
  saveFailed: 'Failed to save',
  loadFailed: 'Failed to load settings',
  catalogFailed: 'Failed to load model catalog',
  save: 'Save settings',
  reset: 'Discard changes',
  unsaved: 'You have unsaved changes',
};

const STYLE_ID = 'dsh-subagent-setting-styles';
const cssText = `
.dsh_sas_section{display:flex;flex-direction:column;gap:12px;min-width:0}
.dsh_sas_title{margin:0;color:var(--dsw-alias-label-primary);font-size:18px;line-height:26px;font-weight:600}
.dsh_sas_subtitle{margin:0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}
.dsh_sas_card{display:flex;align-items:flex-start;gap:12px;min-width:0;padding:14px 16px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);cursor:pointer}
.dsh_sas_checkbox{flex:none;width:18px;height:18px;margin:2px 0 0;accent-color:var(--dsw-alias-brand-primary);cursor:pointer}
.dsh_sas_cardText{display:flex;flex-direction:column;gap:2px;min-width:0}
.dsh_sas_cardTitle{color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px}
.dsh_sas_cardDesc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}
.dsh_sas_field{display:flex;flex-direction:column;gap:6px;min-width:0;padding:14px 16px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.dsh_sas_fieldLabel{color:var(--dsw-alias-label-primary);font-size:14px;line-height:22px;font-weight:600}
.dsh_sas_fieldDesc{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}
.dsh_sas_selectWrap{position:relative;min-width:0}
.dsh_sas_selectTrigger{box-sizing:border-box;width:100%;height:32px;padding:0 28px 0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.dsh_sas_selectTrigger:hover:not(:disabled){border-color:var(--dsw-alias-border-l3)}
.dsh_sas_selectTrigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}
.dsh_sas_selectTriggerOpen{border-color:var(--dsw-alias-brand-primary)}
.dsh_sas_selectChevron{position:absolute;top:0;right:8px;height:32px;display:flex;align-items:center;pointer-events:none;color:var(--dsw-alias-label-caption);font-size:10px}
.dsh_sas_selectMenu{box-sizing:border-box;position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:20;max-height:220px;overflow-y:auto;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-shadow-lv3);padding:4px}
.dsh_sas_selectOption{box-sizing:border-box;width:100%;border:none;border-radius:6px;background:none;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:13px;line-height:20px;text-align:left;padding:6px 8px;cursor:pointer;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}
.dsh_sas_selectOption:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsh_sas_selectOptionActive{background:var(--dsw-alias-interactive-bg-hover)}
.dsh_sas_status{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}
.dsh_sas_statusError{color:var(--dsw-alias-state-error-primary)}
.dsh_sas_actions{display:flex;align-items:center;gap:8px;min-width:0}
.dsh_sas_unsaved{color:var(--dsw-alias-state-warn-label);font-size:12px;line-height:18px;flex:none}
.dsh_sas_saveBtn{box-sizing:border-box;height:32px;font:inherit;cursor:pointer;border:none;border-radius:16px;justify-content:center;align-items:center;gap:4px;padding:0 16px;font-size:13px;line-height:20px;display:inline-flex;background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground)}
.dsh_sas_saveBtn:hover:not(:disabled){filter:brightness(1.06)}
.dsh_sas_saveBtn:disabled{opacity:.55;cursor:default}
.dsh_sas_saveBtnDirty{box-shadow:0 0 0 2px var(--dsw-alias-brand-primary)}
.dsh_sas_resetBtn{box-sizing:border-box;height:32px;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);border-radius:16px;justify-content:center;align-items:center;gap:4px;padding:0 14px;font-size:13px;line-height:20px;display:inline-flex;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary)}
.dsh_sas_resetBtn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dsh_sas_resetBtn:disabled{opacity:.55;cursor:default}
`;

function adoptStyles() {
  if (document.getElementById(STYLE_ID) !== null) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = cssText;
  document.head.appendChild(style);
}

/** Default settings shown before the first successful read. */
const DEFAULT_SETTINGS = {
  enabled: true,
  provider: '',
  model: '',
  reasoningEffort: '',
  applyToIdle: false,
};

/**
 * Fully controlled custom dropdown: a trigger button plus an absolutely
 * positioned option list. Avoids the native <select> popup, which misbehaves
 * inside the WebView2 (Tauri) shell (the popup can close immediately while
 * keyboard focus still works). The menu is plain DOM, so it behaves the same
 * in every webview.
 */
function SASSelect({ value, onChange, placeholder, options, disabled }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onMouseDown = (event) => {
      const root = rootRef.current;
      if (root !== null && !root.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown, true);
    };
  }, [open]);

  const selected = options.find((option) => option.value === value);
  const label = selected ? selected.label : placeholder;

  return React.createElement('div', { className: 'dsh_sas_selectWrap', ref: rootRef },
    React.createElement('button', {
      type: 'button',
      className: 'dsh_sas_selectTrigger' + (open ? ' dsh_sas_selectTriggerOpen' : ''),
      disabled: disabled,
      'aria-haspopup': 'listbox',
      'aria-expanded': open,
      onClick: () => setOpen((prev) => !prev),
    }, label),
    React.createElement('span', { className: 'dsh_sas_selectChevron' }, open ? '▲' : '▼'),
    open && React.createElement('div', { className: 'dsh_sas_selectMenu', role: 'listbox' },
      options.map((option) => React.createElement('button', {
        key: option.value,
        type: 'button',
        role: 'option',
        'aria-selected': option.value === value,
        className: 'dsh_sas_selectOption' + (option.value === value ? ' dsh_sas_selectOptionActive' : ''),
        onMouseDown: (event) => {
          // Prevent the document-level capture listener from closing before
          // this option's click is delivered.
          event.stopPropagation();
        },
        onClick: () => {
          onChange(option.value);
          setOpen(false);
        },
      }, option.label)),
    ),
  );
}

function SubagentSettingSection({ connection, t }) {
  // `saved` is the persisted value; `draft` is the in-form editing state.
  // Nothing is written until the user presses Save.
  const [saved, setSaved] = React.useState(DEFAULT_SETTINGS);
  const [draft, setDraft] = React.useState(DEFAULT_SETTINGS);
  const [groups, setGroups] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState(null);

  const load = React.useCallback(async () => {
    try {
      const [described, catalog] = await Promise.all([
        connection.api.settings.describe({}),
        connection.api.llm.models({}),
      ]);
      const describedResult = described.result;
      const catalogResult = catalog.result;
      if (!describedResult.ok || !catalogResult.ok) {
        setStatus({ kind: 'error', text: t('loadFailed') });
        return;
      }
      const ns = describedResult.value.namespaces.find((n) => n.ns === NS);
      const value = ns?.value ?? {};
      const next = {
        enabled: value.enabled !== false,
        provider: String(value.provider ?? ''),
        model: String(value.model ?? ''),
        reasoningEffort: String(value.reasoningEffort ?? ''),
        applyToIdle: value.applyToIdle === true,
      };
      setSaved(next);
      setDraft(next);
      setGroups(catalogResult.value.groups ?? []);
      setStatus(null);
    } catch (error) {
      setStatus({ kind: 'error', text: t('loadFailed') });
      console.error('[dsh-subagent-setting] load failed:', error);
    }
  }, [connection, t]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const commitSave = React.useCallback(async (next) => {
    setBusy(true);
    setStatus(null);
    try {
      const response = await connection.api.settings.replace({
        ns: NS,
        section: {
          enabled: next.enabled,
          provider: next.provider,
          model: next.model,
          reasoningEffort: next.reasoningEffort,
          applyToIdle: next.applyToIdle,
        },
      });
      if (!response.result.ok) {
        setStatus({ kind: 'error', text: t('saveFailed') + ': ' + (response.result.error?.message ?? '') });
        return;
      }
      setSaved(next);
      setStatus({ kind: 'ok', text: t('saved') });
    } catch (error) {
      setStatus({ kind: 'error', text: t('saveFailed') });
      console.error('[dsh-subagent-setting] save failed:', error);
    } finally {
      setBusy(false);
    }
  }, [connection, t]);

  const dirty = ['enabled', 'provider', 'model', 'reasoningEffort', 'applyToIdle']
    .some((key) => draft[key] !== saved[key]);

  const selectedProvider = draft.provider;
  const selectedModel = draft.model;
  const providerGroup = groups.find((group) => group.id === selectedProvider);
  const availableModels = providerGroup?.models ?? [];
  const selectedModelInfo = availableModels.find((model) => model.id === selectedModel);
  const availableEfforts = selectedModelInfo?.reasoning?.efforts?.map((e) => e.id) ?? [];

  // Editing only touches the draft; Save persists it.
  const edit = (patch) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    if (status?.kind === 'ok') setStatus(null);
  };

  // A stale effort (left over from a model that supported it) must never
  // survive a model switch to one that does not support it.
  const effectiveEffort = availableEfforts.includes(draft.reasoningEffort) ? draft.reasoningEffort : '';

  return React.createElement('section', { className: 'dsh_sas_section', 'aria-labelledby': 'dsh-subagent-setting-title' },
    React.createElement('h2', { id: 'dsh-subagent-setting-title', className: 'dsh_sas_title' }, t('title')),
    React.createElement('p', { className: 'dsh_sas_subtitle' }, t('subtitle')),

    React.createElement('label', { className: 'dsh_sas_card' },
      React.createElement('input', {
        type: 'checkbox',
        className: 'dsh_sas_checkbox',
        checked: draft.enabled,
        disabled: busy,
        onChange: (event) => edit({ enabled: event.target.checked }),
      }),
      React.createElement('span', { className: 'dsh_sas_cardText' },
        React.createElement('span', { className: 'dsh_sas_cardTitle' }, t('enabled')),
        React.createElement('span', { className: 'dsh_sas_cardDesc' }, t('enabledDesc')),
      ),
    ),

    React.createElement('div', { className: 'dsh_sas_field' },
      React.createElement('span', { className: 'dsh_sas_fieldLabel' }, t('provider')),
      React.createElement(SASSelect, {
        value: selectedProvider,
        onChange: (value) => edit({ provider: value, model: '', reasoningEffort: '' }),
        placeholder: t('providerEmpty'),
        disabled: busy || !draft.enabled,
        options: groups.map((group) => ({ value: group.id, label: group.name || group.id })),
      }),
    ),

    React.createElement('div', { className: 'dsh_sas_field' },
      React.createElement('span', { className: 'dsh_sas_fieldLabel' }, t('model')),
      React.createElement(SASSelect, {
        value: selectedModel,
        onChange: (value) => {
          // Switching models may drop the current reasoning effort when the
          // new model does not support it; clear it so a stale effort never
          // lingers and breaks later subagent requests.
          const nextModel = availableModels.find((model) => model.id === value);
          const nextEfforts = nextModel?.reasoning?.efforts?.map((e) => e.id) ?? [];
          const patch = { model: value };
          if (draft.reasoningEffort !== '' && !nextEfforts.includes(draft.reasoningEffort)) {
            patch.reasoningEffort = '';
          }
          edit(patch);
        },
        placeholder: t('modelEmpty'),
        disabled: busy || !draft.enabled || selectedProvider === '' || availableModels.length === 0,
        options: availableModels.map((model) => ({ value: model.id, label: model.name || model.id })),
      }),
    ),

    React.createElement('div', { className: 'dsh_sas_field' },
      React.createElement('span', { className: 'dsh_sas_fieldLabel' }, t('effort')),
      React.createElement(SASSelect, {
        // The empty "inherit (Default)" choice is always offered, so a model
        // without reasoning levels can still reset the effort to inherit.
        value: effectiveEffort,
        onChange: (value) => edit({ reasoningEffort: value }),
        placeholder: t('effortEmpty'),
        disabled: busy || !draft.enabled,
        options: [
          { value: '', label: t('effortEmpty') },
          ...availableEfforts.map((effort) => {
            const label = effort.charAt(0).toUpperCase() + effort.slice(1);
            return { value: effort, label };
          }),
        ],
      }),
    ),

    React.createElement('label', { className: 'dsh_sas_card' },
      React.createElement('input', {
        type: 'checkbox',
        className: 'dsh_sas_checkbox',
        checked: draft.applyToIdle,
        disabled: busy,
        onChange: (event) => edit({ applyToIdle: event.target.checked }),
      }),
      React.createElement('span', { className: 'dsh_sas_cardText' },
        React.createElement('span', { className: 'dsh_sas_cardTitle' }, t('applyToIdle')),
        React.createElement('span', { className: 'dsh_sas_cardDesc' }, t('applyToIdleDesc')),
      ),
    ),

    React.createElement('div', { className: 'dsh_sas_actions' },
      dirty && React.createElement('span', { className: 'dsh_sas_unsaved' }, t('unsaved')),
      React.createElement('button', {
        type: 'button',
        className: 'dsh_sas_resetBtn',
        disabled: busy || !dirty,
        onClick: () => {
          setDraft(saved);
          setStatus(null);
        },
      }, t('reset')),
      React.createElement('button', {
        type: 'button',
        className: 'dsh_sas_saveBtn' + (dirty ? ' dsh_sas_saveBtnDirty' : ''),
        disabled: busy || !dirty,
        onClick: () => void commitSave(draft),
      }, busy ? t('saving') : t('save')),
    ),

    status !== null && React.createElement('p', {
      className: 'dsh_sas_status' + (status.kind === 'error' ? ' dsh_sas_statusError' : ''),
    }, status.text),
  );
}

function apply(ctx) {
  adoptStyles();
  const slots = ctx.get('slots');
  const locale = ctx.get('locale');
  const connection = ctx.get('connection');
  if (slots === undefined || locale === undefined || connection === undefined) return;

  ctx.effect(() => locale.register(NS, { zh, en }), 'dsh-subagent-setting: dictionaries');
  const t = locale.bind(NS);

  slots.inject('settings.section', () => slots.register({
    name: 'settings.section',
    id: 'subagent-setting',
    order: 45,
    label: () => t('nav'),
    locale: NS,
    inject: () => ({ t }),
  }, () => {
    return React.createElement(SubagentSettingSection, { connection, t });
  }));
}

exports.apply = apply;
exports.inject = ['slots', 'locale', 'connection'];
exports.name = 'dsh-subagent-setting';
return module.exports;
} });
