# 隐私与发布说明

这个方案包是为了公开上传准备的。发布前请遵守下面的规则。

## 已删除或已脱敏

- 真实 Windows 用户名。
- 完整本地项目路径。
- API provider 地址和 key。
- 原始 `.codex` session 文件。
- SQLite 数据库。
- 完整 prompt 历史。
- 截图中的完整 thread id。

## 可以公开发布

- 通用恢复流程。
- 已脱敏示例，例如：

  ```text
  codex://threads/<thread-id>
  ```

- 由脱敏方案摘要生成的截图。
- 关于本地文件和应用行为的高层观察结论。

## 不要上传

不要上传这些文件或目录：

```text
~/.codex/auth.json
~/.codex/config.toml
~/.codex/sessions
~/.codex/state_*.sqlite
~/.codex/logs_*.sqlite
~/.codex/.codex-global-state.json
```

这个仓库应该只包含脱敏后的说明、结论和生成截图。
