import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pages = path.join(root, "screenshot-pages");
fs.mkdirSync(pages, { recursive: true });

const baseCss = `
  :root {
    --bg: #f6f3ec;
    --panel: #fffdf8;
    --ink: #20272b;
    --muted: #667178;
    --line: #d8d2c7;
    --accent: #0b6f68;
    --blue: #2e5f91;
    --amber: #a65f00;
    font-family: "Segoe UI", "Microsoft YaHei UI", sans-serif;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 1280px;
    min-height: 760px;
    background:
      linear-gradient(135deg, rgba(11,111,104,.12), transparent 42%),
      repeating-linear-gradient(90deg, rgba(32,39,43,.045) 0 1px, transparent 1px 36px),
      var(--bg);
    color: var(--ink);
  }
  .frame { padding: 42px; }
  .header { display:flex; justify-content:space-between; gap:24px; align-items:flex-start; margin-bottom:26px; }
  h1 { margin:0; font-size:34px; letter-spacing:0; }
  .subtitle { margin:10px 0 0; color:var(--muted); font-size:17px; }
  .badge { border:1px solid var(--line); border-radius:999px; padding:8px 12px; background:var(--panel); color:var(--accent); font-weight:700; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap:18px; }
  .panel { background:rgba(255,253,248,.95); border:1px solid var(--line); border-radius:8px; padding:22px; box-shadow:0 18px 36px rgba(39,31,18,.12); }
  .wide { grid-column:1 / -1; }
  h2 { margin:0 0 14px; font-size:20px; }
  .kv { display:grid; grid-template-columns: 180px 1fr; gap:10px; font-size:16px; margin:9px 0; }
  .key { color:var(--muted); }
  code, pre { font-family:"Cascadia Mono","Consolas",monospace; }
  code { background:#eef5f4; color:#075b55; padding:2px 6px; border-radius:6px; }
  pre { margin:0; white-space:pre-wrap; line-height:1.5; font-size:15px; background:#162225; color:#e8f3ef; border-radius:8px; padding:18px; }
  .ok { color: var(--accent); font-weight: 800; }
  .warn { color: var(--amber); font-weight: 800; }
  .flow { display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-size:17px; }
  .step { background:#fff; border:1px solid var(--line); border-radius:8px; padding:11px 13px; }
  .arrow { color:var(--muted); }
  .mock { display:grid; grid-template-columns:330px 1fr 290px; gap:12px; height:470px; }
  .mock-col { background:#fff; border:1px solid var(--line); border-radius:8px; padding:14px; overflow:hidden; }
  .search { border:1px solid var(--line); border-radius:7px; padding:10px; color:var(--muted); margin-bottom:12px; }
  .item { border:1px solid var(--line); border-radius:8px; padding:10px; margin-bottom:9px; }
  .item.active { border-color:var(--accent); box-shadow: inset 4px 0 0 var(--accent); }
  .pill { display:inline-block; border-radius:999px; background:#edf5f3; color:var(--accent); padding:3px 8px; font-size:12px; margin:7px 4px 6px 0; }
  .msg { border:1px solid var(--line); border-radius:8px; padding:11px; margin-bottom:10px; background:#fff; }
  .msg.assistant { background:#f7fbff; border-color:#cbd9e8; }
  .button { background:var(--accent); color:white; text-align:center; border-radius:7px; padding:12px; font-weight:800; margin-top:12px; }
  .diagram { display:grid; grid-template-columns: repeat(4, 1fr); gap:12px; align-items:stretch; }
  .node { background:#fff; border:1px solid var(--line); border-radius:8px; padding:14px; min-height:92px; display:flex; align-items:center; justify-content:center; text-align:center; font-weight:750; }
  .node.accent { background:#eaf5f3; border-color:var(--accent); color:var(--accent); }
  .node.fallback { background:#fff4e2; border-color:#d49a3a; color:#8a5200; }
  .connector { display:flex; align-items:center; justify-content:center; color:var(--muted); font-weight:800; }
`;

const docs = [
  {
    file: "00-solution-principle.html",
    title: "方案原理",
    body: `
      <div class="frame">
        <div class="header">
          <div>
            <h1>方案原理</h1>
            <p class="subtitle">优先重新打开 Codex 原生线程；只有必要时才使用精简上下文包兜底。</p>
          </div>
          <div class="badge">深度链接优先</div>
        </div>
        <div class="grid">
          <section class="panel wide">
            <h2>主要恢复路径</h2>
            <div class="diagram">
              <div class="node">切换 provider 后，会话看起来消失</div>
              <div class="node">搜索本地线程索引</div>
              <div class="node accent">打开 codex://threads/&lt;id&gt;</div>
              <div class="node accent">在 Codex Desktop 原生续聊</div>
            </div>
          </section>
          <section class="panel wide">
            <h2>兜底路径</h2>
            <div class="flow">
              <div class="step">原生线程不能继续</div><div class="arrow">-></div>
              <div class="step">生成精简上下文包</div><div class="arrow">-></div>
              <div class="step">加载目标、决策和最近消息</div><div class="arrow">-></div>
              <div class="step">用当前 provider 继续</div>
            </div>
          </section>
          <section class="panel">
            <h2>默认做法</h2>
            <p class="ok">使用深度链接，不重新喂完整 transcript。</p>
          </section>
          <section class="panel">
            <h2>兜底做法</h2>
            <p class="warn">只有原生恢复失败时，才导出上下文。</p>
          </section>
        </div>
      </div>`,
  },
  {
    file: "01-deep-link-validation.html",
    title: "深度链接恢复",
    body: `
      <div class="frame">
        <div class="header">
          <div>
            <h1>深度链接恢复</h1>
            <p class="subtitle">Codex Desktop 线程可以通过原生 URI 重新打开，不需要重新喂完整 transcript。</p>
          </div>
          <div class="badge">codex://threads/&lt;thread-id&gt;</div>
        </div>
        <div class="grid">
          <section class="panel">
            <h2>本地证据</h2>
            <div class="kv"><div class="key">Session 文件</div><div class="ok">已找到</div></div>
            <div class="kv"><div class="key">全局状态</div><div class="ok">线程已记录</div></div>
            <div class="kv"><div class="key">创建来源</div><div>Codex Desktop</div></div>
            <div class="kv"><div class="key">Provider</div><div>当前 provider</div></div>
          </section>
          <section class="panel">
            <h2>恢复动作</h2>
            <div class="kv"><div class="key">命令</div><div><code>Start-Process "codex://threads/&lt;id&gt;"</code></div></div>
            <div class="kv"><div class="key">Codex 进程</div><div class="ok">有响应</div></div>
            <div class="kv"><div class="key">结果</div><div>原生线程打开路径有效。</div></div>
          </section>
          <section class="panel wide">
            <h2>为什么重要</h2>
            <div class="flow">
              <div class="step">找到本地线程</div><div class="arrow">-></div>
              <div class="step">打开深度链接</div><div class="arrow">-></div>
              <div class="step">在 Codex Desktop 继续</div><div class="arrow">-></div>
              <div class="step">必要时才导出上下文</div>
            </div>
          </section>
        </div>
      </div>`,
  },
  {
    file: "02-provider-filter-diagnosis.html",
    title: "可见性诊断",
    body: `
      <div class="frame">
        <div class="header">
          <div>
            <h1>可见性诊断</h1>
            <p class="subtitle">侧边栏不显示，可能是索引不一致，不一定代表会话真的丢失。</p>
          </div>
          <div class="badge">仅本地检查</div>
        </div>
        <div class="grid">
          <section class="panel">
            <h2>观察到的信号</h2>
            <div class="kv"><div class="key">Session 日志</div><div class="ok">存在</div></div>
            <div class="kv"><div class="key">Prompt 历史</div><div class="ok">存在</div></div>
            <div class="kv"><div class="key">侧边栏 id</div><div class="warn">不完整</div></div>
            <div class="kv"><div class="key">Provider 元数据</div><div class="warn">混合或已同步</div></div>
          </section>
          <section class="panel">
            <h2>解释</h2>
            <p>本地线程可能仍然存在，只是没有出现在当前侧边栏列表中。深度链接可以作为直接入口。</p>
            <p>修复元数据可能改善可见性，但风险高于直接打开原生深度链接。</p>
          </section>
          <section class="panel wide">
            <h2>判断规则</h2>
            <pre>codex://threads/&lt;id&gt; 能打开线程吗？
  能   -> 原生续聊
  不能 -> 生成 provider 无关的精简上下文包</pre>
          </section>
        </div>
      </div>`,
  },
  {
    file: "03-recovery-ui-workflow.html",
    title: "恢复工作流",
    body: `
      <div class="frame">
        <div class="header">
          <div>
            <h1>恢复工作流</h1>
            <p class="subtitle">本地工具可以搜索线程、复制深度链接，并在必要时导出精简兜底包。</p>
          </div>
          <div class="badge">深度链接优先</div>
        </div>
        <div class="mock">
          <section class="mock-col">
            <div class="search">搜索：provider、项目、提示词、thread id</div>
            <div class="item active">
              <strong>项目规划线程</strong><br />
              <span class="pill">provider：当前</span><span class="pill">长会话</span>
              <p>最近请求：继续下一步开发...</p>
            </div>
            <div class="item">
              <strong>驱动下载线程</strong><br />
              <span class="pill">短会话</span>
              <p>最近请求：官方驱动地址...</p>
            </div>
          </section>
          <section class="mock-col">
            <h2>预览</h2>
            <div class="msg"><strong>用户</strong><br />总结项目状态和下一步计划。</div>
            <div class="msg assistant"><strong>助手</strong><br />当前里程碑、仓库状态和下一步动作...</div>
            <div class="msg"><strong>用户</strong><br />继续下一步。</div>
          </section>
          <section class="mock-col">
            <h2>操作</h2>
            <div class="button">打开深度链接</div>
            <div class="button" style="background:#2e5f91">复制 codex:// URI</div>
            <div class="button" style="background:#a65f00">导出兜底包</div>
            <p style="color:var(--muted);line-height:1.5">默认路径避免 prompt 膨胀。只有原生恢复失败时才导出。</p>
          </section>
        </div>
      </div>`,
  },
];

for (const doc of docs) {
  fs.writeFileSync(
    path.join(pages, doc.file),
    `<!doctype html><html><head><meta charset="utf-8"><title>${doc.title}</title><style>${baseCss}</style></head><body>${doc.body}</body></html>`,
    "utf8",
  );
}

console.log(`已生成 ${docs.length} 个截图页面：${pages}`);
