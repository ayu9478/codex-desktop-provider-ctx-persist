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
    title: "Solution Principle",
    body: `
      <div class="frame">
        <div class="header">
          <div>
            <h1>Solution Principle</h1>
            <p class="subtitle">Recover Codex conversations by reopening native threads first, then falling back to compact context packets only when necessary.</p>
          </div>
          <div class="badge">deep-link first solution</div>
        </div>
        <div class="grid">
          <section class="panel wide">
            <h2>Primary Recovery Path</h2>
            <div class="diagram">
              <div class="node">Provider switch makes a thread look missing</div>
              <div class="node">Search local thread index</div>
              <div class="node accent">Open codex://threads/&lt;id&gt;</div>
              <div class="node accent">Continue natively in Codex Desktop</div>
            </div>
          </section>
          <section class="panel wide">
            <h2>Fallback Path</h2>
            <div class="flow">
              <div class="step">Native thread cannot continue</div><div class="arrow">-></div>
              <div class="step">Generate compact packet</div><div class="arrow">-></div>
              <div class="step">Load goal + decisions + recent messages</div><div class="arrow">-></div>
              <div class="step">Continue with current provider</div>
            </div>
          </section>
          <section class="panel">
            <h2>Default</h2>
            <p class="ok">Use deep links. Do not re-feed the full transcript.</p>
          </section>
          <section class="panel">
            <h2>Fallback</h2>
            <p class="warn">Export context only when native recovery fails.</p>
          </section>
        </div>
      </div>`,
  },
  {
    file: "01-deep-link-validation.html",
    title: "Deep-Link Recovery",
    body: `
      <div class="frame">
        <div class="header">
          <div>
            <h1>Deep-Link Recovery</h1>
            <p class="subtitle">A Codex Desktop thread can be reopened through a native URI without re-feeding the transcript.</p>
          </div>
          <div class="badge">codex://threads/&lt;thread-id&gt;</div>
        </div>
        <div class="grid">
          <section class="panel">
            <h2>Local Evidence</h2>
            <div class="kv"><div class="key">Session file</div><div class="ok">Found</div></div>
            <div class="kv"><div class="key">Global state</div><div class="ok">Thread listed</div></div>
            <div class="kv"><div class="key">Originator</div><div>Codex Desktop</div></div>
            <div class="kv"><div class="key">Provider</div><div>current provider</div></div>
          </section>
          <section class="panel">
            <h2>Recovery Action</h2>
            <div class="kv"><div class="key">Command</div><div><code>Start-Process "codex://threads/&lt;id&gt;"</code></div></div>
            <div class="kv"><div class="key">Codex process</div><div class="ok">Responding</div></div>
            <div class="kv"><div class="key">Result</div><div>Native thread open path is valid.</div></div>
          </section>
          <section class="panel wide">
            <h2>Why This Matters</h2>
            <div class="flow">
              <div class="step">Find local thread</div><div class="arrow">-></div>
              <div class="step">Open deep link</div><div class="arrow">-></div>
              <div class="step">Continue in Codex Desktop</div><div class="arrow">-></div>
              <div class="step">Use token-heavy export only if needed</div>
            </div>
          </section>
        </div>
      </div>`,
  },
  {
    file: "02-provider-filter-diagnosis.html",
    title: "Visibility Diagnosis",
    body: `
      <div class="frame">
        <div class="header">
          <div>
            <h1>Visibility Diagnosis</h1>
            <p class="subtitle">A missing sidebar entry can be an indexing mismatch, not actual conversation loss.</p>
          </div>
          <div class="badge">local-only inspection</div>
        </div>
        <div class="grid">
          <section class="panel">
            <h2>Observed Signals</h2>
            <div class="kv"><div class="key">Session logs</div><div class="ok">Present</div></div>
            <div class="kv"><div class="key">Prompt history</div><div class="ok">Present</div></div>
            <div class="kv"><div class="key">Sidebar ids</div><div class="warn">Partial</div></div>
            <div class="kv"><div class="key">Provider metadata</div><div class="warn">Mixed / synchronized</div></div>
          </section>
          <section class="panel">
            <h2>Interpretation</h2>
            <p>The local thread can exist while not appearing in the current sidebar list. A deep link can be used as a direct entry point.</p>
            <p>Metadata repair may help visibility, but it is higher risk than opening a native deep link.</p>
          </section>
          <section class="panel wide">
            <h2>Decision Rule</h2>
            <pre>Can codex://threads/&lt;id&gt; open the thread?
  yes -> continue natively
  no  -> generate compact provider-neutral context packet</pre>
          </section>
        </div>
      </div>`,
  },
  {
    file: "03-recovery-ui-workflow.html",
    title: "Recovery Workflow",
    body: `
      <div class="frame">
        <div class="header">
          <div>
            <h1>Recovery Workflow</h1>
            <p class="subtitle">A local helper can search threads, copy deep links, and export compact fallback packets.</p>
          </div>
          <div class="badge">deep-link first</div>
        </div>
        <div class="mock">
          <section class="mock-col">
            <div class="search">Search: provider, project, prompt, thread id</div>
            <div class="item active">
              <strong>Project planning thread</strong><br />
              <span class="pill">provider: current</span><span class="pill">long session</span>
              <p>Latest request: continue next development step...</p>
            </div>
            <div class="item">
              <strong>Printer driver thread</strong><br />
              <span class="pill">short session</span>
              <p>Latest request: official driver address...</p>
            </div>
          </section>
          <section class="mock-col">
            <h2>Preview</h2>
            <div class="msg"><strong>USER</strong><br />Summarize the project state and next plan.</div>
            <div class="msg assistant"><strong>ASSISTANT</strong><br />Current milestone, repository status, and next actions...</div>
            <div class="msg"><strong>USER</strong><br />Continue the next step.</div>
          </section>
          <section class="mock-col">
            <h2>Actions</h2>
            <div class="button">Open Deep Link</div>
            <div class="button" style="background:#2e5f91">Copy codex:// URI</div>
            <div class="button" style="background:#a65f00">Export Fallback Packet</div>
            <p style="color:var(--muted);line-height:1.5">Default path avoids prompt bloat. Export only when native recovery fails.</p>
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

console.log(`Wrote ${docs.length} screenshot pages to ${pages}`);
