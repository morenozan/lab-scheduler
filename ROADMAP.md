# Roadmap — 1to1 Scheduler

## Planned Tools

The multi-tool site will expand beyond the current 1-1 Meetings tool to include additional lab management utilities. All tools share the member list and dark theme.

### 1. Lab Duties (`duties/`)

Assign and rotate lab duties among lab members.

**Features:**
- Drag-and-drop assignment of duties to members
- Rotation schedule (weekly/monthly)
- Visual duty grid showing current assignments

**Implementation:**
- Subdirectory: `duties/` with `index.html`, `settings.html`, `app.js`
- Reuse: `shared.js` — `getPeople()`, `savePeople()`, shared styling
- Storage: LocalStorage `duties_assignments` — list of `{dutyName, memberId, startDate}`

### 2. Lab Meeting Presenter (`presenter/`)

Schedule and rotate presenters for the weekly lab group meeting (separate from 1-1s).

**Features:**
- Assign presenter for upcoming meetings
- Rotation queue showing next presenters
- History of past presenters

**Implementation:**
- Subdirectory: `presenter/` with `index.html`, `settings.html`, `app.js`
- Reuse: `shared.js` — `getPeople()`, `getActivePeople()`, shared styling
- Storage: LocalStorage `presenter_schedule` — list of `{memberId, meetingDate}`

---

## Hub Updates

When each tool is ready, add a card to `index.html` following the `.tool-card` grid pattern.

---

**Note:** Both tools follow the existing `1to1/` structure and integrate with the shared member list (`lab_people` in LocalStorage).
