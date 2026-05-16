param(
    [Parameter(Position = 0)]
    [ValidateSet("search", "open", "copy", "packet")]
    [string] $Command = "search",

    [string] $Query = "",
    [string] $Provider = "",
    [string] $ThreadId = "",
    [int] $Limit = 20,
    [int] $MaxMessages = 60,
    [string] $OutputDir = ""
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8

function Get-CodexHome {
    if ($env:CODEX_HOME) { return $env:CODEX_HOME }
    return (Join-Path $HOME ".codex")
}

function Mask-LocalPath {
    param([AllowNull()][string] $Path)
    if (!$Path) { return "" }
    $homePattern = [Regex]::Escape($HOME)
    return ($Path -replace "^$homePattern", "~")
}

function Repair-Mojibake {
    param([AllowNull()][string] $Text)
    if ($null -eq $Text -or $Text -eq "") { return $Text }

    $markers = @(0x6D63, 0x72B2, 0x93B4, 0x951B, 0x5A34, 0x9366, 0x9353, 0x6F86, 0x6D7C)
    $looksMojibake = $false
    foreach ($char in $Text.ToCharArray()) {
        $code = [int][char]$char
        if ($markers -contains $code -or ($code -ge 0xE000 -and $code -le 0xF8FF)) {
            $looksMojibake = $true
            break
        }
    }
    if (!$looksMojibake) { return $Text }

    try {
        $gbk = [Text.Encoding]::GetEncoding(936)
        $utf8 = [Text.Encoding]::UTF8
        $candidate = $utf8.GetString($gbk.GetBytes($Text))
        $replacement = [char]0xFFFD
        if ($candidate -and $candidate.IndexOf($replacement) -lt 0) { return $candidate }
    }
    catch {
        return $Text
    }
    return $Text
}

function Read-Jsonl {
    param([string] $Path)
    $events = New-Object System.Collections.Generic.List[object]
    foreach ($line in Get-Content -LiteralPath $Path -Encoding UTF8) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        try { $events.Add(($line | ConvertFrom-Json)) }
        catch { }
    }
    return $events
}

function Text-FromContent {
    param($Content)
    if ($null -eq $Content) { return "" }
    if ($Content -is [string]) { return (Repair-Mojibake $Content) }

    $parts = New-Object System.Collections.Generic.List[string]
    foreach ($item in @($Content)) {
        if ($null -eq $item) { continue }
        $names = $item.PSObject.Properties.Name
        if (($names -contains "text") -and $item.text) {
            $parts.Add((Repair-Mojibake $item.text))
        }
        elseif (($names -contains "input_text") -and $item.input_text) {
            $parts.Add((Repair-Mojibake $item.input_text))
        }
        elseif (($names -contains "output_text") -and $item.output_text) {
            $parts.Add((Repair-Mojibake $item.output_text))
        }
    }
    return ($parts -join "`n")
}

function Get-RawMeta {
    param([string] $Path)
    $line = Get-Content -LiteralPath $Path -TotalCount 1 -Encoding UTF8
    $id = $null
    $provider = $null
    $timestamp = $null
    $cwd = $null

    try {
        $json = $line | ConvertFrom-Json
        $id = $json.payload.id
        $provider = $json.payload.model_provider
        $timestamp = $json.payload.timestamp
        $cwd = Repair-Mojibake $json.payload.cwd
    }
    catch {
        if ($line -match '"id":"([^"]+)"') { $id = $Matches[1] }
        if ($line -match '"model_provider":"([^"]+)"') { $provider = $Matches[1] }
        if ($line -match '"timestamp":"([^"]+)"') { $timestamp = $Matches[1] }
        if ($line -match '"cwd":"(.*?)","originator"') { $cwd = Repair-Mojibake $Matches[1] }
    }

    return [pscustomobject]@{
        id = $id
        provider = $provider
        timestamp = $timestamp
        cwd = $cwd
    }
}

function Is-UsefulMessage {
    param([AllowNull()][string] $Text)
    if (!$Text) { return $false }
    $trimmed = $Text.Trim()
    if ($trimmed.StartsWith("<environment_context>")) { return $false }
    if ($trimmed.StartsWith("<permissions instructions>")) { return $false }
    return $true
}

function Extract-Messages {
    param([string] $Path)
    $messages = New-Object System.Collections.Generic.List[object]
    $seen = New-Object "System.Collections.Generic.HashSet[string]"

    foreach ($event in Read-Jsonl $Path) {
        $payload = $event.payload
        $role = $null
        $content = ""

        if ($event.type -eq "response_item" -and $payload.type -eq "message") {
            $role = $payload.role
            $content = Text-FromContent $payload.content
        }
        elseif ($event.type -eq "event_msg" -and $payload.type -eq "user_message") {
            $role = "user"
            $content = Repair-Mojibake $payload.message
        }
        elseif ($event.type -eq "event_msg" -and $payload.type -eq "agent_message") {
            $role = "assistant"
            $content = Repair-Mojibake $payload.message
        }

        if (!$role -or !$content) { continue }
        if (@("user", "assistant") -notcontains $role) { continue }
        if (!(Is-UsefulMessage $content)) { continue }

        $key = "$role`0$content"
        if ($seen.Contains($key)) { continue }
        [void]$seen.Add($key)
        $messages.Add([pscustomobject]@{
            role = $role
            content = $content
            timestamp = $event.timestamp
        })
    }
    return $messages.ToArray()
}

function Short-Text {
    param([AllowNull()][string] $Text, [int] $Limit = 180)
    if (!$Text) { return "" }
    $collapsed = (($Text -replace "\s+", " ").Trim())
    if ($collapsed.Length -le $Limit) { return $collapsed }
    return ($collapsed.Substring(0, $Limit - 1) + "...")
}

function Get-SessionFiles {
    $roots = @(
        (Join-Path (Get-CodexHome) "sessions"),
        (Join-Path (Get-CodexHome) "archived_sessions")
    )
    $files = New-Object System.Collections.Generic.List[object]
    foreach ($root in $roots) {
        if (!(Test-Path -LiteralPath $root)) { continue }
        Get-ChildItem -LiteralPath $root -Recurse -File -Filter "*.jsonl" |
            ForEach-Object { $files.Add($_) }
    }
    return @($files | Sort-Object LastWriteTime -Descending)
}

function Get-ThreadRows {
    $rows = New-Object System.Collections.Generic.List[object]
    foreach ($file in Get-SessionFiles) {
        $meta = Get-RawMeta $file.FullName
        if (!$meta.id) { continue }
        $messages = @(Extract-Messages $file.FullName)
        $users = @($messages | Where-Object role -eq "user")
        $firstUser = @($users | Select-Object -First 1)
        $lastUser = @($users | Select-Object -Last 1)
        $lastAssistant = @($messages | Where-Object role -eq "assistant" | Select-Object -Last 1)
        $title = if ($firstUser.Count -gt 0) { Short-Text $firstUser[0].content 90 } else { $meta.id }
        $searchText = @(
            $meta.id,
            $meta.provider,
            $meta.cwd,
            $file.FullName,
            $title,
            $(if ($lastUser.Count -gt 0) { $lastUser[0].content } else { "" }),
            $(if ($lastAssistant.Count -gt 0) { $lastAssistant[0].content } else { "" })
        ) -join "`n"

        $rows.Add([pscustomobject]@{
            threadId = $meta.id
            deepLink = "codex://threads/$($meta.id)"
            title = $title
            provider = $meta.provider
            cwd = Mask-LocalPath $meta.cwd
            modified = $file.LastWriteTime.ToString("o")
            sourcePath = $file.FullName
            sourceHint = Mask-LocalPath $file.FullName
            messageCount = $messages.Count
            lastUser = if ($lastUser.Count -gt 0) { Short-Text $lastUser[0].content 220 } else { "" }
            searchText = $searchText
        })
    }
    return $rows.ToArray()
}

function Find-Thread {
    param([string] $Id)
    $rows = @(Get-ThreadRows)
    $found = @($rows | Where-Object { $_.threadId -eq $Id -or $_.threadId -like "*$Id*" } | Select-Object -First 1)
    if ($found.Count -eq 0) { throw "Thread not found: $Id" }
    return $found[0]
}

function Search-Threads {
    $rows = @(Get-ThreadRows)
    if ($Provider) {
        $rows = @($rows | Where-Object { $_.provider -eq $Provider })
    }
    if ($Query) {
        $q = $Query.ToLowerInvariant()
        $rows = @($rows | Where-Object { ($_.searchText.ToLowerInvariant()).Contains($q) })
    }
    $rows |
        Select-Object -First $Limit threadId, provider, modified, messageCount, title, lastUser, deepLink |
        ConvertTo-Json -Depth 8
}

function Open-Thread {
    param([string] $Id)
    $row = Find-Thread $Id
    Start-Process $row.deepLink
    [pscustomobject]@{
        action = "opened"
        threadId = $row.threadId
        deepLink = $row.deepLink
        title = $row.title
    } | ConvertTo-Json -Depth 4
}

function Copy-ThreadLink {
    param([string] $Id)
    $row = Find-Thread $Id
    Set-Clipboard -Value $row.deepLink
    [pscustomobject]@{
        action = "copied"
        threadId = $row.threadId
        deepLink = $row.deepLink
        title = $row.title
    } | ConvertTo-Json -Depth 4
}

function Get-PublicThread {
    param($Row)
    return [pscustomobject]@{
        threadId = $Row.threadId
        deepLink = $Row.deepLink
        title = $Row.title
        provider = $Row.provider
        cwd = $Row.cwd
        modified = $Row.modified
        sourceHint = $Row.sourceHint
        messageCount = $Row.messageCount
        lastUser = $Row.lastUser
    }
}

function New-ContextPacket {
    param([string] $Id)
    $row = Find-Thread $Id
    $messages = @(Extract-Messages $row.sourcePath)
    $selected = if ($MaxMessages -gt 0 -and $messages.Count -gt $MaxMessages) {
        @($messages | Select-Object -Last $MaxMessages)
    } else {
        @($messages)
    }

    $outDir = if ($OutputDir) {
        [IO.Path]::GetFullPath($OutputDir)
    } else {
        Join-Path (Get-Location) "codex-thread-recovery-exports"
    }
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
    $safeId = $row.threadId -replace '[^\w-]', '-'
    $mdPath = Join-Path $outDir "$safeId-context.md"
    $jsonPath = Join-Path $outDir "$safeId-context.json"

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add("# Codex Thread Recovery Fallback Packet")
    $lines.Add("")
    $lines.Add("Use this compact packet only when native deep-link recovery cannot continue the original thread.")
    $lines.Add("")
    $lines.Add("## Native Deep Link")
    $lines.Add("")
    $lines.Add('```text')
    $lines.Add($row.deepLink)
    $lines.Add('```')
    $lines.Add("")
    $lines.Add("## Metadata")
    $lines.Add("")
    $lines.Add(("- Thread ID: ``{0}``" -f $row.threadId))
    $lines.Add(("- Provider: ``{0}``" -f $row.provider))
    $lines.Add(("- Modified: ``{0}``" -f $row.modified))
    $lines.Add(("- Source hint: ``{0}``" -f $row.sourceHint))
    $lines.Add(("- Messages included: ``{0}`` of ``{1}``" -f $selected.Count, $messages.Count))
    $lines.Add("")
    $lines.Add("## Recent Messages")
    $lines.Add("")

    $i = 1
    foreach ($message in $selected) {
        $lines.Add("### $i. $($message.role.ToUpperInvariant())")
        $lines.Add("")
        if ($message.timestamp) {
            $lines.Add(("``{0}``" -f $message.timestamp))
            $lines.Add("")
        }
        $lines.Add($message.content.TrimEnd())
        $lines.Add("")
        $i++
    }

    ($lines -join "`n") | Set-Content -LiteralPath $mdPath -Encoding UTF8
    [pscustomobject]@{
        schema = "codex-thread-recovery/v1"
        generatedAt = (Get-Date -Format o)
        thread = Get-PublicThread $row
        messages = $selected
    } | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath $jsonPath -Encoding UTF8

    [pscustomobject]@{
        action = "packet"
        threadId = $row.threadId
        deepLink = $row.deepLink
        markdownPath = $mdPath
        jsonPath = $jsonPath
        messagesIncluded = $selected.Count
    } | ConvertTo-Json -Depth 6
}

if ($Command -eq "search") {
    Search-Threads
}
elseif ($Command -eq "open") {
    if (!$ThreadId) { throw "-ThreadId is required." }
    Open-Thread $ThreadId
}
elseif ($Command -eq "copy") {
    if (!$ThreadId) { throw "-ThreadId is required." }
    Copy-ThreadLink $ThreadId
}
elseif ($Command -eq "packet") {
    if (!$ThreadId) { throw "-ThreadId is required." }
    New-ContextPacket $ThreadId
}
