# dsh-subagent-setting

在 DeepSeek Harness 网页版的设置页里，可视化配置 subagent 默认使用的**提供商、模型与思考等级**。新创建的 subagent 立即生效；还可以选择让改设置之前已创建的 subagent 也跟随新设置。

![image-20260821012945376](pics/README/image-20260821012945376.png)

## 功能

- **设置页**（设置 → Subagent 模型）：从实时模型目录里选提供商、模型、思考等级，不用手改 YAML。
- **新 subagent 立即使用新设置**——覆盖逻辑在子 agent 创建时按子 agent 安装。
- **可选：对旧 subagent 生效**（`改设置前已创建的 subagent 也跟随新设置`）：开启后，设置变更会同步到所有已存在的空闲 subagent，下一次请求就用新值（运行中的 subagent 从下一步开始生效）；关闭则只影响之后新建的 subagent。
- 提供商 / 模型 / 思考等级留空 = **继承父会话**——subagent 沿用父会话当前的模型配置。
- **WebView 友好的自定义下拉框**：设置表单使用完全受控的自定义下拉组件，而非原生 `<select>` 弹层，因此在浏览器和 Tauri（WebView2）壳里表现一致。

## 工作原理

- **Host**（`lib/index.js`）注册 `dsh-subagent-setting` 设置命名空间，并在 `agent/created` 时对每个 `origin === 'subagent'` 的 agent 安装一个 agent 作用域的 `agent/request` 瀑布监听器，把请求配置改写成配置的路由。
- 监听器读取子 agent 的实时路由 holder，因此 `applyToIdle` 只需要替换该 holder 就能让已存在的子 agent 在下一次请求时重新指向。
- **Client**（`client/client.js`）渲染设置页，通过官方 connection API（`settings.describe` / `settings.replace` / `llm.models`）读写。

## 安装

把包安装进你的 profile，然后加入 bundle 列表：

```sh
dsh plugin --profile web add github:marshfolx/dsh-subagent-setting
```

打开 **设置 → Subagent 模型** 即可配置默认值。

## License

MIT
