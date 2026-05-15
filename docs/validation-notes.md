# Validation Notes

These notes summarize the local validation that supports the proposed solution. They are intentionally sanitized and do not include raw Codex logs, database contents, credentials, or full local paths.

## Validation 1: Native Deep Link Can Open A Thread

Validated URI shape:

```text
codex://threads/<thread-id>
```

Observed result:

- The matching local session file existed.
- The thread id appeared in local Codex state.
- The session metadata showed it was created by Codex Desktop.
- Opening the URI caused Codex Desktop to respond.

Conclusion:

Native deep links can serve as a direct thread recovery entry point.

Screenshot:

![Deep-link validation](../screenshots/01-deep-link-validation.png)

## Validation 2: Missing Sidebar Entry Does Not Necessarily Mean Data Loss

Local state showed that a thread can exist in session logs and prompt history even when the current sidebar list does not show every historical thread.

Observed state:

```text
Local session logs: present
Prompt history: present
Sidebar thread list: partial
Provider metadata: may differ or may have been synchronized
```

Conclusion:

The problem is often visibility or indexing mismatch rather than confirmed conversation loss.

Screenshot:

![Provider diagnosis](../screenshots/02-provider-filter-diagnosis.png)

## Validation 3: Older Long Thread Can Be Targeted By Deep Link

An older long project thread was selected from local history and opened through its native deep link.

Observed result:

- The target session file existed.
- The file size indicated a long conversation.
- The thread id was present in local prompt history.
- Codex Desktop responded when the deep link was opened.

Conclusion:

Deep links can recover historical local threads without requiring the model to re-read the entire transcript.

## Validation 4: Context Packet Works As Fallback

A local fallback flow generated Markdown/JSON continuation packets from session logs.

Observed result:

- The packet can include goal, decisions, recent messages, and a full local archive.
- It works when a native thread cannot continue.
- It is less token-efficient than deep-link recovery for long conversations.

Conclusion:

Context packets should be a fallback, not the default recovery path.

Screenshot:

![Recovery UI workflow](../screenshots/03-recovery-ui-workflow.png)

## Final Conclusion

Recommended flow:

```text
Search local threads
  -> open codex://threads/<thread-id>
  -> continue natively if possible
  -> export compact context packet only if native continuation fails
```
