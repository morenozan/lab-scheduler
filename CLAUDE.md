# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lab Scheduler is a client-side web application for generating and sharing 1-1 meeting schedules. It allows lab members to be added, assigned custom slot durations, included/excluded from a given session, and automatically scheduled within a time window.

## Running the Application

Since this is a static HTML/CSS/JavaScript app with no build process:

1. **Local server**: Run `python3 -m http.server 8000` (or `npx http-server` if available), then open `http://localhost:8000`
2. **Direct**: Open `index.html` directly in a browser, though some browsers may block the clipboard API over `file://` URLs

## Architecture

**Two-page structure:**
- `index.html` — Display page showing the current schedule. Reads from localStorage or URL hash (for shared schedules).
- `settings.html` — Management page where users add/remove lab members, set per-person durations, include/exclude people, configure time window + date, and generate schedules.

**Core logic in `app.js`:**
- `getPeople()` / `savePeople()` — LocalStorage-backed people list
- `getActivePeople()` — Pure data filter returning people with `included !== false`
- `generateSchedule(startTime, endTime, activePeople, dateStr)` — Builds slot array; `dateStr` is YYYY-MM-DD
- `formatDate(d)` — Formats a Date as `Wed 14/05/26`
- `encodeSchedule()` / `decodeScheduleFromHash()` — URL-based sharing via base64 encoding
- Per-person `duration` field (defaults to 20 min, configurable 5–120 min)

**Styling in `style.css`:**
- Catppuccin Mocha dark theme throughout, using CSS variables defined in `:root`
- Single stylesheet shared by both pages; `settings.html` has an additional inline `<style>` block for page-specific rules
- `color-scheme: dark` on `body` and date/time inputs so browser-native controls use dark UI

**External dependency:**
- Sortable.js (CDN) for drag-and-drop; loaded only in `settings.html`

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

LocalStorage keys (see `app.js`):
- `lsched_people` — Array of `{id, name, duration, included}`
- `lsched_slot_duration` — Legacy key (unused)
- `lsched_last_schedule` — Last generated schedule JSON
- `lsched_presenter` — Optional presenter name for warning

Person object shape: `{ id: "abc123", name: "Alice", duration: 20, included: true }`. Missing `included` treated as `true`.

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

## Key Implementation Details

- Date format everywhere is `Wed 14/05/26` (via `formatDate()` in `app.js`)
- `formatScheduleAsText` outputs `1-1 Meetings — <date>` with no time range line
- Default time window: 09:00–12:00
- `syncFromDOM` must use `> .person-row` not `[data-id]` — see above
- Presenter warning checks `included !== false` (data), not DOM checkboxes
