# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

1to1 Scheduler is a multi-tool client-side web application for lab management. Tools share the same lab member list and Catppuccin Mocha theme. Currently includes:
- **1-1 Meetings** (`1to1/`) — schedule individual check-ins within a time window

## Running the Application

Since this is a static HTML/CSS/JavaScript app with no build process:

1. **Local server**: Run `python3 -m http.server 8000` (or `npx http-server` if available), then open `http://localhost:8000`
2. **Direct**: Open `index.html` directly in a browser, though some browsers may block the clipboard API over `file://` URLs

## File Structure

```
index.html          — Hub/landing page; links to all tools
shared.js           — Shared logic: people CRUD, date utils, clipboard
style.css           — Shared Catppuccin Mocha stylesheet
1to1/
  index.html        — 1-1 schedule display page
  settings.html     — 1-1 settings: people, time blocks, generate
  app.js            — 1-1-specific logic: scheduling, URL encoding
```

Each new tool gets its own subdirectory with `index.html`, `settings.html`, and `app.js`. Tool pages load `../shared.js` then their own `app.js` — in that order — before any inline `<script>` block.

## Shared Logic (`shared.js`)

- `getPeople()` / `savePeople()` — LocalStorage-backed lab member list
- `getActivePeople()` — Pure data filter returning people with `included !== false`
- `addPerson(name)` / `removePerson(id)` / `reorderPeople(newOrder)`
- `setPersonDuration(id, minutes)` / `resetAllDurations()`
- `getPresenter()` / `setPresenter(name)` — presenter reminder (1to1-specific storage key but shared utility)
- `formatDate(d)` — Formats a Date as `Wed 14/05/26`
- `minToTime(totalMin)` — Converts minutes since midnight to `HH:MM`
- `copyToClipboard(text)` — Async clipboard write

## 1-1 Tool Logic (`1to1/app.js`)

- `generateSchedule(timeBlocks, activePeople, dateStr)` — Builds slot array across one or more time blocks; `timeBlocks` is `[{start, end}, ...]`, `dateStr` is YYYY-MM-DD
- `encodeSchedule()` / `decodeScheduleFromHash()` — URL-based sharing via base64 encoding
- `formatScheduleAsText(schedule)` — Plain-text format for copying

**Styling in `style.css`:**
- Catppuccin Mocha dark theme throughout, using CSS variables defined in `:root`
- Single stylesheet shared by all pages; each page's `settings.html` has an additional inline `<style>` block for page-specific rules
- `color-scheme: dark` on `body` and date/time inputs so browser-native controls use dark UI

**External dependency:**
- Sortable.js (CDN) for drag-and-drop; loaded only in settings pages

## Catppuccin Mocha CSS Variables

Defined in `:root` in `style.css`. Key tokens used:
- `--base` `#1e1e2e` — page background
- `--mantle` `#181825` — card background
- `--surface0` `#313244` — input/row background
- `--surface1` `#45475a` — borders
- `--overlay0` `#6c7086` — muted text (drag handles, labels)
- `--text` `#cdd6f4` — primary text
- `--mauve` `#cba6f7` — primary accent (buttons, focus rings, schedule times, day prefix)
- `--blue` `#89b4fa` — links
- `--red` `#f38ba8` — errors, delete hover
- `--green` `#a6e3a1` — success
- `--yellow` `#f9e2af` — warnings

## Storage

LocalStorage keys (see `shared.js` and `1to1/app.js`):
- `lab_people` — Array of `{id, name, duration, included}` — shared across all tools
- `1to1_last_schedule` — Last generated 1-1 schedule JSON
- `1to1_presenter` — Optional presenter name for 1-1 warning

Person object shape: `{ id: "abc123", name: "Alice", duration: 20, included: true }`. Missing `included` treated as `true`.

**Migration:** On first load after the restructure, `initStorage()` in `shared.js` automatically migrates any existing `1to1_people` data to `lab_people` and removes the old key.

## Lab Members — Bulk Add / Copy Names

In `1to1/settings.html`, a collapsible "Bulk add / copy names" section sits below the single-person add row:
- **Copy names**: populates a textarea with current people names (one per line) and copies to clipboard — share via Slack/email
- **Add all**: reads the textarea and adds each non-empty, non-duplicate line via `addPerson()`

Names never go to the git repo — they live only in localStorage.

## Settings Page — Date Picker

The date field is a custom composite input (not `<input type="date">`):
- A `<span class="date-picker-wrapper">` wraps a mauve day-prefix span (`#dateDayLabel`) and a plain text input (`#scheduleDate`)
- Styled as one fused input box; focus ring applied via `:focus-within` on the wrapper
- Input format: `dd/mm/yy` — parsed by `parseDdMmYy()` in settings.html
- Day prefix (e.g. "Wed") updates live on `input` event
- Defaults to next Wednesday on page load
- On generate, parsed to YYYY-MM-DD and passed to `generateSchedule`

## Settings Page — Two-Column People Layout

People are managed via a two-column drag-and-drop interface:
- **Left (`#excludedList`)** — excluded from schedule
- **Right (`#includedList`)** — included in schedule

Both are Sortable.js instances sharing `group: 'people'`. `syncFromDOM()` is the `onEnd` handler — uses `> .person-row` direct-child selector (critical: nested duration `<input>` also has `data-id` and would duplicate entries with a descendant selector). `renderPeopleRows()` destroys Sortable instances before clearing DOM and deduplicates by `id` on render.

## Settings Page — Time Blocks

The time window is a dynamic list of `{start, end}` block rows managed in `1to1/settings.html`:
- `renderTimeBlocks(blocks)` — renders block rows; the × remove button is hidden when only one row exists
- `addTimeBlock()` — appends a new block defaulting to `last.end → last.end + 1h`
- `removeTimeBlock(index)` — removes a block by index (no-op if only one remains)
- `getTimeBlocks()` — reads current DOM state and returns `[{start, end}, ...]`
- Default on load: one block `09:00 → 12:00`

`generateSchedule()` distributes people across blocks in order, overflowing to the next block when the current one is full. Each slot carries `blockIndex` so `1to1/index.html` can render `— break —` separators between blocks. Old schedules without `blockIndex` render without separators (backward compatible).

Schedule object shape:
```json
{ "date": "Thu 14/05/26", "blocks": [{"start":"09:00","end":"10:30"}], "slots": [{"personId":"...","name":"Alice","start":"09:00","end":"09:20","blockIndex":0}] }
```

## Key Implementation Details

- Date format everywhere is `Wed 14/05/26` (via `formatDate()` in `shared.js`)
- `formatScheduleAsText` outputs `1-1 Meetings — <date>`; inserts a blank line between blocks when `blockIndex` changes
- Default time window: one block 09:00–12:00
- `syncFromDOM` must use `> .person-row` not `[data-id]` — see above
- Presenter warning checks `included !== false` (data), not DOM checkboxes
- Hub `index.html` redirects old `#data=…` share links to `1to1/index.html` automatically
