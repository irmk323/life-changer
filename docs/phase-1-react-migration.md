# Phase 1 — Migrate the Existing Prototype to React

## 1. Purpose

Migrate the existing **Life Changer** HTML/CSS/Vanilla JavaScript prototype to a modern React frontend without losing existing behaviour or stored user data.

The current Vanilla prototype has already been implemented and may contain user-visible design decisions and working interactions. Treat it as the reference implementation.

The goals of this phase are:

- preserve the existing prototype while migration is in progress
- rebuild the UI with React and TypeScript
- make repeated UI structures reusable
- improve maintainability
- keep the application local and prototype-only
- preserve compatible `localStorage` data
- create a clean foundation for a future Spring Boot API

This phase is a frontend migration, not a backend phase.

---

## 2. Required technology

Use:

- React
- TypeScript
- Vite
- React Router in declarative mode
- Tailwind CSS using the official Vite plugin
- Lucide React for interface icons
- browser `localStorage`
- React Context and `useReducer` for shared application state

Do not introduce:

- Next.js
- Redux
- Zustand
- MobX
- Spring Boot
- Node.js backend
- PostgreSQL
- authentication
- OpenAI API
- remote APIs
- a large component framework
- copied commercial templates

Do not use both Tailwind and a second full CSS framework.

Use Tailwind for layout and component styling. A small global CSS file may be used for:

- design tokens
- CSS variables
- reduced-motion handling
- highly reusable custom states
- calendar urgency classes

---

## 3. Verify the current repository first

Before changing files:

1. inspect the current repository
2. identify the existing static prototype entry point
3. identify existing storage keys
4. identify all existing routes
5. identify which acceptance criteria from the previous Markdown files are currently implemented
6. run the existing prototype in a browser
7. record any existing JavaScript errors
8. do not delete or overwrite the existing implementation

Create a short migration inventory at:

```text
docs/react-migration-inventory.md
```

It must contain:

- current files
- current pages
- current routes
- existing storage keys and state shape
- implemented features
- missing or broken features
- screenshots are optional
- migration risks

Do not begin deleting old files during this phase.

---

## 4. Safe directory strategy

Create the React application in:

```text
frontend/
```

Keep the existing Vanilla implementation intact during migration.

Recommended repository shape:

```text
life-changer/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── docs/
│   ├── react-migration-inventory.md
│   └── react-migration-report.md
├── existing-static-files-remain-here
└── README.md
```

Do not move the Vanilla implementation into `legacy/` until the React version passes the acceptance criteria and the user explicitly approves the switch.

---

## 5. Project creation

From the repository root, create a Vite React TypeScript application under `frontend/`.

Use the current official React TypeScript template supported by Vite.

Expected commands:

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install react-router lucide-react
npm install tailwindcss @tailwindcss/vite
```

Configure the Tailwind Vite plugin in `vite.config.ts`.

Use the current Tailwind Vite setup and import Tailwind from the main stylesheet.

Do not add dependencies that are not required by this specification.

If the existing repository already has a React/Vite application, do not create a nested duplicate. Inspect first and adapt the existing structure.

---

## 6. Routing strategy

Use `HashRouter` so the prototype can work on simple static hosting without server rewrite configuration.

Routes:

```text
/
#/dashboard
#/motivation
#/calendar
#/behaviour
#/java
#/dsa
#/dsa/:id
#/functional-coding
#/functional-coding/:id
#/system-design
#/system-design/ddia/:chapterId
#/system-design/hello-interview/:id
```

Requirements:

- `/` redirects to `/dashboard`
- browser back and forward work
- active sidebar state follows the route
- direct hash URLs open the correct page
- detail pages have an explicit Back action
- clicking form controls inside a row must not accidentally navigate

Use route components rather than manual `window.location.hash` rendering.

---

## 7. Proposed source structure

Use a feature-oriented structure.

```text
frontend/src/
├── app/
│   ├── App.tsx
│   ├── AppRouter.tsx
│   ├── AppStateProvider.tsx
│   └── routes.ts
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MobileNavigation.tsx
│   │   └── PageHeader.tsx
│   ├── common/
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   ├── IconButton.tsx
│   │   ├── Modal.tsx
│   │   ├── ProgressBar.tsx
│   │   └── SectionCard.tsx
│   ├── learning/
│   │   ├── DomainProgress.tsx
│   │   ├── ExpandableQuestionRow.tsx
│   │   ├── FollowUpQuestions.tsx
│   │   └── ResultControls.tsx
│   └── calendar/
│       ├── ActivityDot.tsx
│       ├── CalendarGrid.tsx
│       └── CalendarLegend.tsx
├── features/
│   ├── dashboard/
│   ├── motivation/
│   ├── calendar/
│   ├── behaviour/
│   ├── java-theory/
│   ├── dsa/
│   ├── functional-coding/
│   └── system-design/
├── hooks/
│   ├── useAppState.ts
│   ├── useLocalStorageMigration.ts
│   └── useReducedMotion.ts
├── services/
│   ├── storage/
│   │   ├── localStorageRepository.ts
│   │   ├── migrations.ts
│   │   └── storageKeys.ts
│   └── readiness/
│       ├── progressCalculations.ts
│       ├── reviewCalculations.ts
│       └── streakCalculations.ts
├── types/
│   ├── activity.ts
│   ├── appState.ts
│   ├── learning.ts
│   ├── priority.ts
│   └── review.ts
├── data/
│   └── sampleData.ts
├── styles/
│   └── index.css
├── main.tsx
└── vite-env.d.ts
```

Minor deviations are allowed if they simplify the code, but do not place the whole application in `App.tsx`.

---

## 8. TypeScript data model

Create explicit types.

### Core enums or union types

```typescript
export type Domain =
  | "BEHAVIOUR"
  | "JAVA_THEORY"
  | "DSA"
  | "FUNCTIONAL_CODING"
  | "SYSTEM_DESIGN";

export type LearningResult = "PASS" | "PARTIAL" | "FAIL";

export type PriorityLevel = "HIGH" | "MEDIUM" | "LOW";

export type ReviewStage = "D1" | "D4" | "D17";

export type TaskStatus =
  | "NOT_STARTED"
  | "LEARNING"
  | "RETRY_DUE"
  | "INTERVIEW_READY";
```

### App state

```typescript
export interface AppState {
  version: number;
  motivationEntries: MotivationEntry[];
  learningItems: LearningItem[];
  attempts: Attempt[];
  reviews: Review[];
  dailyLogs: DailyLog[];
  activities: Activity[];
  priorities: PriorityItem[];
  functionalTasks: FunctionalTask[];
  systemDesignTasks: SystemDesignTask[];
  dismissedAutomaticPriorities: DismissedPriority[];
}
```

Do not use `any` for stored domain data.

Do not use one giant optional interface for every possible learning item. Use discriminated unions or feature-specific types where the fields differ materially.

---

## 9. State management

Use:

- React Context
- `useReducer`
- typed actions
- a storage repository abstraction

Example action categories:

```text
MOTIVATION_ADD
MOTIVATION_UPDATE
MOTIVATION_DELETE
MOTIVATION_REORDER

LEARNING_ITEM_ADD
LEARNING_ITEM_UPDATE
LEARNING_ITEM_DELETE
LEARNING_RESULT_RECORDED

PRIORITY_ADD
PRIORITY_UPDATE
PRIORITY_TOGGLE
PRIORITY_DELETE
PRIORITY_REORDER
PRIORITY_DISMISS_AUTO

DAILY_LOG_SAVE
DAILY_LOG_DELETE

DSA_SOLVED
DSA_REVIEW_TOGGLE
DSA_REVIEW_NOTE_UPDATE

FUNCTIONAL_TASK_ADD
FUNCTIONAL_TASK_UPDATE
FUNCTIONAL_TASK_DELETE
FUNCTIONAL_ATTEMPT_ADD

SYSTEM_DESIGN_TASK_ADD
SYSTEM_DESIGN_TASK_UPDATE
SYSTEM_DESIGN_ATTEMPT_ADD

PROTOTYPE_RESET
```

Persist state after reducer updates.

Do not call `localStorage` directly from many page components.

All persistence must go through:

```text
services/storage/localStorageRepository.ts
```

This makes it possible to replace local storage with a future Spring Boot API.

---

## 10. Storage compatibility and migration

Inspect the actual existing Vanilla prototype before implementing migration.

Potential keys include:

```text
lifeChanger.v1
lifeChanger.v2
```

The React application must:

1. look for the newest existing compatible key
2. parse and validate the stored shape
3. migrate missing fields
4. preserve user-created notes, attempts, activities, priorities, and review completion
5. write the migrated state to a new key

Use:

```text
lifeChanger.react.v1
```

Do not overwrite the old Vanilla storage key.

This allows the user to return to the old prototype during migration.

Migration rules:

- missing arrays become empty arrays
- missing `priorities` become `[]`
- missing DSA `leetcodeUrl` remains nullable and editable
- old PASS/FAIL DSA review data should be converted to completed state when possible
- unknown fields should not crash the app
- malformed storage must show a recoverable error
- do not silently reset malformed user data

Provide:

- Retry migration
- Start with sample data
- Copy raw old storage JSON for recovery

Do not automatically delete the old storage key.

---

## 11. Design direction

Create a clean, modern, calm interface.

Use:

- Tailwind CSS
- Lucide icons
- restrained cards
- clear information hierarchy
- consistent spacing
- responsive layout
- subtle hover and transition states
- readable tables
- accessible form controls
- CSS variables for domain colours and semantic states

Do not create:

- excessive gradients
- glassmorphism everywhere
- animated backgrounds
- decorative dashboards that reduce readability
- punishment imagery
- dense walls of cards
- unnecessary charts
- tiny text
- icon-only actions without labels

### Visual language

Recommended:

- neutral application background
- white or theme-aware content surfaces
- one accent colour for primary actions
- domain-specific colours only where useful
- softly rounded corners
- thin borders
- modest shadows
- Lucide icons for edit, delete, external link, chevron, calendar, and check

The application must look polished, but visual polish must not override usability.

---

## 12. Responsive application shell

### Desktop

- persistent sidebar
- main content area
- max readable content width where appropriate
- tables may use local horizontal scrolling

### Mobile

- compact header
- menu button or bottom/top navigation
- no full-page horizontal overflow
- cards stack vertically
- Todo and table row actions remain accessible
- touch targets are comfortably sized

Use one shared `AppShell`.

Do not duplicate desktop and mobile page implementations.

---

## 13. Feature parity requirements

The React application must reproduce all working features from the current Vanilla prototype, including the review-update requirements.

### Dashboard

Include:

- overall readiness
- reviews due today
- overdue reviews
- weekly sessions
- retention
- current study streak
- longest study streak
- editable Today's Priorities Todo list
- domain progress
- recent activity

Today's Priorities supports:

- create
- edit
- complete/incomplete
- delete
- reorder
- due date
- priority
- link to a learning item
- dismissal of automatic recommendations

### Domain progress

At the top of:

- Behaviour
- Java Theory
- DSA
- Functional Coding
- System Design

Show:

- count
- total
- percentage
- labelled progress bar

### Calendar

Include:

- previous month
- next month
- current month
- selected date
- daily note CRUD
- automatic activity history
- coloured domain dots
- accessible legend

Domain colours:

- DSA: blue
- System Design: red
- Behaviour: purple
- Java Theory: green
- Functional Coding: orange

Do not communicate domain only with colour.

### Behaviour

Include:

- expandable rows
- question CRUD
- STAR answer
- notes
- follow-up questions
- attempt history
- PASS / PARTIAL / FAIL
- review date calculation

### Java Theory

Include:

- Core Java tab
- Spring Boot tab
- expandable rows
- edit pencil on each row
- Prepared Answer section
- Personal Answer & Notes section
- inline section editing
- Follow-up Questions collapsed by default
- CRUD
- PASS / PARTIAL / FAIL
- attempt history
- review date calculation

### DSA

Include:

- grouped problem list
- search
- filters
- first-solved state
- D+1 checkbox
- D+4 checkbox
- D+17 checkbox
- due-date urgency states
- completed date
- row styling
- internal detail page
- LeetCode external link
- initial solve notes
- stage-specific review notes
- general notes
- editable metadata
- character/bridge status visual

Urgency states:

```text
COMPLETED
SAFE
UPCOMING
SOON
TOMORROW
TODAY
OVERDUE
```

The UI must also display text such as:

- 8 days left
- Due tomorrow
- Due today
- 3 days overdue
- Completed

### Functional Coding

Include:

- overview list
- task CRUD
- detail route
- requirements
- entities
- services
- repositories
- API design
- tests
- notes
- repository link
- attempt CRUD

### System Design

Include:

- DDIA tab
- Hello Interview tab
- DDIA chapter detail
- question CRUD
- result controls
- review schedule
- design exercise detail
- editable design sections
- attempt CRUD

---

## 14. Shared React components

At minimum, create reusable components for:

- `AppShell`
- `PageHeader`
- `DomainProgress`
- `ProgressBar`
- `Badge`
- `Modal`
- `ConfirmDialog`
- `IconButton`
- `ExpandableQuestionRow`
- `ResultControls`
- `FollowUpQuestions`
- `ActivityDot`
- `EmptyState`

Behaviour, Java Theory, and DDIA must not contain three independently copied accordion implementations.

Use composition and props.

Avoid components with dozens of unrelated boolean props. Split them when responsibilities differ.

---

## 15. Forms

Use controlled React forms.

Requirements:

- visible labels
- required-field validation
- inline error messages
- Save and Cancel
- confirmation before destructive delete
- keyboard operation
- focus moves into an opened modal
- focus returns to the opening control after close where practical

Do not use browser `prompt()`.

Prefer semantic elements.

A native `<dialog>` is acceptable if implemented accessibly and consistently. A React modal component is also acceptable.

---

## 16. Dates

Centralize date logic.

Create utilities for:

- local date string
- add days
- date comparison
- days until due
- overdue count
- current streak
- longest streak
- D+1, D+4, D+17 calculations
- calendar month generation

Do not scatter manual date arithmetic across components.

Use native date functionality unless the code becomes error-prone. Do not add a date library without demonstrating a need.

Be careful with timezone conversions. Daily learning dates should use the user's local calendar date rather than UTC date truncation.

---

## 17. Readiness calculations

Place calculations in pure functions.

Examples:

```text
calculateDomainProgress
calculateOverallReadiness
calculateCurrentStreak
calculateLongestStreak
calculateRetentionRate
getDueReviews
getOverdueReviews
getSuggestedPriorities
```

Components should render calculated results, not implement business rules inline.

Add comments explaining that readiness is a prototype estimate, not a validated prediction of interview success.

---

## 18. Sample data

Port existing sample data from the Vanilla prototype.

Do not replace realistic user-created prototype content with generic lorem ipsum.

If existing stored data is available, migration takes precedence over sample data.

Only initialize sample data when:

- React storage does not exist
- no compatible Vanilla storage exists
- the user chooses sample data

For DSA:

- keep valid LeetCode URLs
- do not scrape LeetCode
- do not copy paid descriptions or solutions
- store original notes and metadata only

---

## 19. Testing

Add a modest frontend test setup using:

- Vitest
- React Testing Library
- `@testing-library/jest-dom`
- jsdom

Install only the required development dependencies.

Write tests for the highest-risk logic:

### Unit tests

- D+1 / D+4 / D+17 calculation
- due-state calculation
- current streak calculation
- longest streak calculation
- domain progress calculation
- storage migration
- automatic priority generation

### Component tests

- Follow-up Questions hidden by default
- Follow-up Questions toggle updates `aria-expanded`
- DSA checkbox does not trigger row navigation
- editable Todo can be completed
- Java Theory pencil opens editing
- calendar domain dot has an accessible label

Do not delay the migration indefinitely to produce exhaustive test coverage.

---

## 20. Migration sequence

Implement in this order.

### Stage 1 — Foundation

1. inspect existing prototype
2. create migration inventory
3. scaffold `frontend/`
4. configure Tailwind
5. configure React Router
6. add global types
7. add storage repository
8. add storage migration
9. add App State provider
10. add application shell

### Stage 2 — Shared UI

1. Button
2. IconButton
3. Badge
4. Modal
5. ConfirmDialog
6. PageHeader
7. ProgressBar
8. DomainProgress
9. ExpandableQuestionRow
10. ResultControls

### Stage 3 — Pages

Migrate one page at a time:

1. Dashboard
2. Motivation
3. Calendar
4. Behaviour
5. Java Theory
6. DSA list
7. DSA detail
8. Functional Coding
9. Functional Coding detail
10. System Design
11. DDIA detail
12. Hello Interview detail

After each page:

- compare it with the Vanilla implementation
- verify existing functionality
- check the browser console
- test refresh persistence
- test mobile width

### Stage 4 — Regression and polish

1. verify all routes
2. verify migration
3. verify CRUD
4. verify storage persistence
5. verify keyboard use
6. verify responsive behaviour
7. run tests
8. run TypeScript checking
9. run linting
10. run production build

---

## 21. Commands that must pass

From `frontend/`:

```bash
npm run dev
npm run lint
npm run build
npm run test -- --run
```

If the generated project uses a different test script, document it clearly.

Do not claim completion while the production build fails.

---

## 22. Legacy prototype policy

During this phase:

- do not delete the Vanilla prototype
- do not move it without documenting the change
- do not overwrite its storage key
- do not make the root README imply that migration is complete before it is complete

After React reaches feature parity, add a section to the root README:

```text
React prototype
cd frontend
npm install
npm run dev
```

Also document how to open the old static prototype for comparison.

Deletion or archival of the Vanilla version is a separate later task.

---

## 23. Out of scope

Do not implement:

- Spring Boot API
- database
- login
- cloud sync
- AI interview scoring
- voice input
- email reminders
- calendar integration
- GitHub API
- deployment pipeline
- production authentication
- multi-user support
- drag-and-drop library
- charting library unless an existing chart cannot be represented with semantic HTML/CSS
- full NeetCode 150 import

---

## 24. Acceptance criteria

The React migration is complete only when:

### Foundation

- React app exists under `frontend/`
- TypeScript is enabled
- Vite development server starts
- Tailwind styles render
- Lucide icons render
- routes work
- production build succeeds
- no normal-use console errors occur

### Safety

- Vanilla prototype still exists
- old storage is not overwritten
- migration preserves compatible data
- malformed data produces a recoverable message
- prototype reset requires confirmation

### Feature parity

- all main pages exist
- all detail routes exist
- Dashboard functionality works
- priorities remain editable
- study streak works
- domain progress appears on all required pages
- Calendar dots and legend work
- Behaviour CRUD and results work
- Java Theory editing and Follow-up toggle work
- DSA checkbox reviews and urgency states work
- DSA detail notes work
- LeetCode links work
- Functional Coding CRUD works
- System Design CRUD works

### Persistence

After browser refresh:

- edits remain
- notes remain
- priorities remain
- completed reviews remain
- daily logs remain
- attempts remain

### Quality

- responsive at approximately 320px width
- keyboard navigation works for primary actions
- focus is visible
- colour is not the only status indicator
- tests pass
- lint passes
- build passes

---

## 25. Required final report

Create:

```text
docs/react-migration-report.md
```

Report:

1. files created
2. dependencies added
3. architecture used
4. storage key used
5. migration behaviour
6. pages migrated
7. reusable components created
8. tests added
9. commands executed
10. lint result
11. test result
12. build result
13. manually tested acceptance criteria
14. incomplete items
15. deviations from this specification
16. whether the Vanilla prototype remains usable

Do not claim a feature was manually tested unless it was opened and exercised in a browser.

---

## 26. Instruction to the coding agent

Implement this migration in the current repository.

First inspect the existing Vanilla prototype and create the migration inventory. Do not discard or rewrite working behaviour blindly.

Build the React version under `frontend/`, migrate page by page, preserve compatible local data, and verify feature parity.

Prioritize:

1. correctness
2. preservation of existing behaviour
3. maintainable component structure
4. accessibility
5. visual polish

Do not add a backend or AI integration in this phase.
