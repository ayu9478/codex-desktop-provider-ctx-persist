---
name: codex-thread-recovery
description: 恢复、搜索、打开或续接 Codex Desktop 旧会话；provider 或 model 切换后找回上下文；优先使用 codex://threads 深度链接，只有原生恢复失败时才导出精简上下文包。Use when the user asks in Chinese or English to 恢复旧会话、搜索历史、打开深度链接、复制会话链接、继续旧对话、找回上下文, or recover/resume old Codex conversations after provider switching.
---

# Codex 会话恢复

使用这个 skill 恢复 Codex Desktop 旧会话。默认走最低 token 成本路径：先打开原生深度链接，只有原生恢复失败时才导出精简上下文包。

## 核心原则

优先使用 Codex Desktop 原生线程链接：

```text
codex://threads/<thread-id>
```

如果原线程能打开并继续，就不要把完整历史对话重新喂给当前模型。长对话导出会消耗大量 token，也更容易把隐私内容带进 prompt。

## 自然语言触发

用户可以直接说：

```text
会话恢复：codex://threads/<thread-id>
```

也可以说：

- `帮我打开 codex://threads/<thread-id>`
- `先确认这个会话是否存在：codex://threads/<thread-id>`
- `搜索旧会话：关键词`
- `复制这个会话的深度链接：<thread-id>`
- `原生恢复失败了，帮我导出兜底上下文包：<thread-id>`

## 命令

在 skill 目录下运行：

```powershell
.\scripts\codex_thread_recovery.ps1 search -Query "关键词"
.\scripts\codex_thread_recovery.ps1 search -Provider my_codex -Limit 20
.\scripts\codex_thread_recovery.ps1 open -ThreadId <thread-id>
.\scripts\codex_thread_recovery.ps1 copy -ThreadId <thread-id>
.\scripts\codex_thread_recovery.ps1 packet -ThreadId <thread-id>
```

## 工作流

1. 用户要“找回旧会话”或“恢复上下文”时，先用 `search` 按关键词、项目名、provider 或 thread id 搜索。
2. 找到可能的线程后，优先给出深度链接：

   ```text
   codex://threads/<thread-id>
   ```

3. 用户要打开时，运行 `open -ThreadId <thread-id>`。
4. 用户要复制时，运行 `copy -ThreadId <thread-id>`。
5. 只有深度链接不能继续，或者用户明确要求兜底上下文时，才运行 `packet -ThreadId <thread-id>`。

## 安全规则

- 默认不要修改 `.codex` 数据库、session 文件或全局状态。
- 默认不要导出完整 transcript。
- 不要在输出里包含 API key、provider URL、认证文件或原始 SQLite 数据。
- 兜底上下文包只应包含目标、关键决策和最近消息；完整原始会话只留在本地。
- 元数据修复属于更高风险操作，必须先得到用户明确确认。

## 输出要求

汇报结果时尽量包含：

- thread id
- deep link
- provider
- 修改时间
- 最近请求片段
- 已执行动作：已打开、已复制、已导出或未找到
