# Privacy And Publishing Notes

This solution package is prepared for public upload. Before publishing, keep the following rules:

## Removed Or Masked

- Real Windows username.
- Full local project paths.
- API provider URLs and keys.
- Raw `.codex` session files.
- SQLite databases.
- Full prompt history.
- Complete thread ids in screenshots.

## Safe To Publish

- General workflow.
- Sanitized examples such as:

  ```text
  codex://threads/<thread-id>
  ```

- Screenshots generated from sanitized solution summaries.
- High-level observations about local files and app behavior.

## Do Not Upload

Do not upload these files or directories:

```text
~/.codex/auth.json
~/.codex/config.toml
~/.codex/sessions
~/.codex/state_*.sqlite
~/.codex/logs_*.sqlite
~/.codex/.codex-global-state.json
```

The package intentionally contains only sanitized derived notes and generated screenshots.
