# React Migration Inventory

Date: 2026-08-03

## Current static prototype

- Entry point: `index.html`
- JavaScript: `js/app.js`, `js/components.js`, `js/data.js`, `js/storage.js`
- Styling: `css/styles.css`
- Asset: `assets/character-placeholder.svg`
- The static implementation remains in place and is not modified or moved by the React migration.

## Pages and routes

| Page | Current hash route |
| --- | --- |
| Dashboard | `#/dashboard` |
| Motivation | `#/motivation` |
| Calendar | `#/calendar` |
| Behaviour | `#/behaviour` |
| Java Theory | `#/java`, `#/java/spring` |
| DSA list/detail | `#/dsa`, `#/dsa/:id` |
| Functional Coding list/detail | `#/functional-coding`, `#/functional-coding/:id` |
| System Design/DDIA | `#/system-design`, `#/system-design/ddia/:chapterId` |
| Hello Interview | `#/system-design/hello-interview/:id` |

## Storage

- Legacy key: `lifeChanger.v1`
- Latest static key: `lifeChanger.v2`
- V2 state includes learning items and attempts, DSA problems/reviews, activities, daily logs, motivation entries, priorities, functional tasks, and system-design tasks.
- React will read, normalise, and copy compatible data to `lifeChanger.react.v1`; it will not overwrite either static key.

## Implemented static functionality

- Dashboard metrics, streak estimate, activity history, editable priorities.
- Motivation CRUD/reordering; calendar navigation, notes, and domain activity dots.
- Shared expandable Behaviour, Java Theory, and DDIA questions with review results.
- DSA filtering, solve/review workflow, urgency states, detail notes, and LeetCode links.
- Functional Coding and System Design task/detail/attempt flows.

## Known gaps or risks

- The static app is uncommitted in the current worktree; it must be preserved as-is.
- Browser availability was checked but no controllable browser is available in this environment, so prior browser-only acceptance checks could not be independently rerun.
- Static V2 stores `dismissedAutoPriorities` as an object; React will normalise this to typed dismissed-priority records.
- Earlier DSA reviews may use `result`/`completedAt` rather than `completed`; migration must retain their completion state and notes.
- Some static task forms are lightweight; the React migration will preserve stored fields while using typed, controlled forms.
