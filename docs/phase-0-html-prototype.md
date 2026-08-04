# Phase 0 — HTML Prototype

## 1. Goal

Create a clickable browser-based prototype for **Life Changer**, a personal web application for managing preparation for a Senior Java Engineer role in the UK.

The purpose of this phase is to validate:

- screen structure
- navigation
- information hierarchy
- daily learning workflow
- review workflow
- CRUD interactions
- whether the application feels useful enough to open every day

This phase is **not** intended to produce the final production architecture.

---

## 2. Technology constraints

Use only:

- HTML5
- CSS3
- vanilla JavaScript
- browser `localStorage`

Do not use:

- React
- Vue
- Angular
- Spring Boot
- Node.js backend
- databases
- authentication
- OpenAI API
- external APIs
- build tools
- package managers

The prototype must run by opening `index.html` directly in a browser.

No installation or setup command should be required.

---

## 3. Deliverables

Create the following structure:

```text
life-changer/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── storage.js
│   ├── data.js
│   └── components.js
├── assets/
│   └── character-placeholder.svg
└── README.md
```

Responsibilities:

- `index.html`: application shell and semantic page containers
- `styles.css`: all layout, component, responsive, and state styles
- `app.js`: routing, page initialization, event handling
- `storage.js`: `localStorage` read/write/reset helpers
- `data.js`: initial sample data
- `components.js`: reusable rendering functions
- `README.md`: how to open and use the prototype

Do not put the entire application in one HTML file.

---

## 4. Product principles

### 4.1 The application is a career preparation tool

It should help the user answer:

- What should I work on today?
- What is overdue?
- What have I already practised?
- What am I repeatedly failing?
- Am I getting closer to interview readiness?

### 4.2 Avoid punishment-based design

Do not use language or imagery suggesting:

- failure means personal inadequacy
- the character dies
- the character falls from a cliff
- missed reviews permanently destroy progress

Overdue work should be visible, but the UI should communicate:

> Return, review, and repair the gap.

### 4.3 Reuse shared structures

Behaviour, Java Theory, and DDIA questions share similar behaviour:

- list of questions
- expandable answer
- personal notes
- result buttons
- last attempt
- next review date

Implement these using reusable JavaScript rendering functions rather than duplicating unrelated implementations.

---

## 5. Global layout

Create a responsive application layout with:

### Desktop

- fixed left sidebar
- main content area
- page title
- optional page actions
- responsive cards and tables

### Mobile

- collapsible or top navigation
- no horizontal page overflow
- tables may use a local horizontal scroll container
- buttons must remain easy to tap

### Sidebar navigation

Include:

1. Dashboard
2. Motivation
3. Calendar
4. Behaviour
5. Java Theory
6. DSA
7. Functional Coding
8. System Design

The selected page must have a visible active state.

Navigation should work without reloading the browser.

Use hash-based navigation such as:

```text
#/dashboard
#/motivation
#/calendar
#/behaviour
#/java
#/dsa
#/functional-coding
#/system-design
```

For detail screens, use:

```text
#/functional-coding/:id
#/system-design/ddia/:chapterId
#/system-design/hello-interview/:id
```

---

## 6. Dashboard

The Dashboard is the default page.

Display:

### Summary cards

- overall readiness
- reviews due today
- overdue reviews
- learning sessions this week
- 14-day retention rate

Use sample values derived from stored data where practical.

### Today's priorities

Show a maximum of five items:

- overdue reviews first
- reviews due today second
- unstarted high-priority items third

Each item should link to the relevant page or detail screen.

### Domain progress

Show progress for:

- Behaviour
- Java Theory
- DSA
- Functional Coding
- System Design

Use labelled progress bars.

Do not present the percentage as scientifically precise. Add a small note:

> Prototype readiness is based on completed and passed items.

### Recent activity

Show the latest five activities with:

- date
- domain
- item
- result
- duration if available

---

## 7. Motivation page

Create four editable sections:

1. Benefits of changing jobs
2. Costs of changing jobs
3. Benefits of staying
4. Costs of staying

Each entry must support:

- create
- edit
- delete
- reorder up
- reorder down

Use a modal or inline form.

Store changes in `localStorage`.

Add a short explanatory message:

> This page exists to remember why the plan matters, not to shame the user into working.

Provide realistic sample entries.

---

## 8. Calendar page

Create a month view.

Required behaviour:

- previous month
- next month
- return to current month
- click a day to select it
- display activities for the selected day
- add a manual daily note
- edit the daily note
- delete the daily note

Activities created elsewhere in the application must automatically appear on the relevant calendar date.

Examples:

- Java Theory: 3 questions
- DSA: Two Sum review passed
- Behaviour: Conflict story partial
- Functional Coding: Booking API attempted for 75 minutes

Each date cell should show compact activity indicators.

Below the calendar, show:

- automatic activity list
- free-text daily note
- save button

---

## 9. Behaviour page

Display Behaviour questions as table-like expandable rows.

Each row must show:

- English interview question
- competency/category
- latest result
- last practised date
- next review date
- edit action
- delete action

Clicking the main row should expand content below it.

Expanded content must show:

- model or prepared STAR answer
- personal notes
- follow-up questions
- linked STAR story name
- attempt history
- result controls

Use three result states:

```text
PASS
PARTIAL
FAIL
```

Button labels:

- Answered independently
- Partially answered
- Could not answer

When a result is recorded:

- add an activity
- add an attempt
- update the latest result
- update the last practised date
- calculate a next review date

Review calculation for the prototype:

- `FAIL`: tomorrow
- `PARTIAL`: four days later
- `PASS`: seventeen days later

Support full question CRUD.

Provide at least eight realistic sample Behaviour questions.

---

## 10. Java Theory page

Use the same expandable question component as Behaviour.

Provide tabs:

- Core Java
- Spring Boot

Each row must show:

- question
- topic
- latest result
- last practised date
- next review date
- edit
- delete

Expanded content must show:

- model answer
- personal answer
- notes
- follow-up questions
- attempt history
- PASS / PARTIAL / FAIL controls

Support full CRUD.

Provide at least ten sample questions for Core Java and ten for Spring Boot.

Core Java sample topics should include:

- Collections
- equals and hashCode
- Generics
- Exceptions
- Streams
- Concurrency
- JVM memory
- Garbage collection
- Immutability
- Testing

Spring Boot sample topics should include:

- dependency injection
- bean lifecycle
- configuration
- REST controllers
- validation
- exception handling
- Spring Data
- transactions
- security
- testing

---

## 11. DSA page

Create a NeetCode-style categorised problem list, but do not copy NeetCode branding, source code, layout, wording, or protected content.

Use sample problem metadata and a familiar grouped-practice-table structure.

Include categories such as:

- Arrays & Hashing
- Two Pointers
- Sliding Window
- Stack
- Binary Search
- Linked List
- Trees
- Heap
- Backtracking
- Graphs
- Dynamic Programming

Each problem row should show:

- checkbox or status control
- problem title
- difficulty
- first solved date
- D+1 review
- D+4 review
- D+17 review
- current review state
- edit action

When a problem is marked solved for the first time:

- set `firstSolvedAt`
- create D+1 date
- create D+4 date
- create D+17 date
- add a calendar activity
- visually change the completed row

Each review stage must be separately markable as:

- passed
- failed
- not attempted

When a review fails:

- create a retry due the next day
- do not erase the original history

Row states:

- not started
- solved
- review due soon
- due today
- overdue
- retained

Add filters:

- category
- difficulty
- due status
- completed/uncompleted

Add search by problem title.

### Character visual

Include a simple placeholder character and bridge/progress illustration.

Behaviour:

- no overdue reviews: bridge appears stable
- some reviews due: bridge shows a small gap
- overdue reviews: character waits before the gap
- completed reviews: progress moves forward

Do not show falling, injury, death, or punishment.

The visual may be simple SVG/CSS and does not need polished artwork.

Provide at least twenty sample problems. The full 150-item catalogue is not required in this phase.

---

## 12. Functional Coding page

Create an overview table.

Each row should show:

- title
- category
- tags
- latest attempt date
- latest result
- latest duration
- current status
- edit
- delete

Statuses:

```text
NOT_STARTED
LEARNING
RETRY_DUE
INTERVIEW_READY
```

Clicking a row navigates to a detail page.

### Functional Coding detail page

Display editable fields:

- title
- problem statement
- functional requirements
- non-functional requirements
- entities
- services
- repositories
- API design
- validation
- error handling
- test cases
- design notes
- GitHub or repository link
- next improvement

Provide an attempt history table with:

- date
- duration
- result
- notes

Allow:

- create attempt
- edit attempt
- delete attempt
- edit task
- delete task
- return to list

Provide at least five sample tasks:

- Booking API
- Payment Service
- Notification Service
- Inventory Reservation
- Rate Limiter

Do not implement a browser code editor or code execution.

---

## 13. System Design page

Provide two tabs:

- DDIA
- Hello Interview

### 13.1 DDIA tab

Display chapters 1 to 12 as rows.

Each row should show:

- chapter number
- title
- total questions
- passed questions
- latest activity
- status

Clicking a chapter navigates to a chapter detail page.

#### DDIA chapter detail

Display an editable table of questions.

Columns:

- question
- prepared answer
- personal notes
- latest result
- last practised
- next review
- actions

Support question CRUD.

Use PASS / PARTIAL / FAIL controls and the same review rules used by Behaviour and Java Theory.

Only a few sample questions per chapter are required.

### 13.2 Hello Interview tab

Display design exercises as rows.

Each row should show:

- title
- category
- attempt count
- latest score
- latest attempt
- status

Clicking a row navigates to a detail page.

#### Hello Interview detail

Provide editable sections:

- problem statement
- functional requirements
- non-functional requirements
- capacity estimates
- API design
- data model
- high-level design
- scaling
- consistency
- reliability
- observability
- security
- trade-offs
- bottlenecks
- notes

Provide attempt history:

- date
- score
- duration
- feedback
- result

Support task and attempt CRUD.

Provide at least five sample exercises:

- URL Shortener
- Ticket Booking System
- Notification System
- Chat System
- Job Scheduler

Do not copy proprietary Hello Interview lesson content. Use generic exercise titles and original placeholder notes.

---

## 14. Shared data model

Use JavaScript objects with stable IDs.

### Learning item

```javascript
{
  id: "java-core-001",
  domain: "JAVA_THEORY",
  track: "CORE_JAVA",
  title: "HashMap and ConcurrentHashMap",
  question: "What is the difference between HashMap and ConcurrentHashMap?",
  modelAnswer: "",
  personalAnswer: "",
  notes: "",
  category: "Collections",
  priority: "P0",
  latestResult: "PARTIAL",
  lastPractisedAt: "2026-08-03",
  nextReviewAt: "2026-08-07",
  createdAt: "2026-08-03T12:00:00Z",
  updatedAt: "2026-08-03T12:00:00Z"
}
```

### Attempt

```javascript
{
  id: "attempt-001",
  itemId: "java-core-001",
  domain: "JAVA_THEORY",
  attemptedAt: "2026-08-03T18:30:00Z",
  result: "PARTIAL",
  durationMinutes: 8,
  notes: "Need to explain null handling.",
  reviewStage: null
}
```

### Review schedule

```javascript
{
  id: "review-001",
  itemId: "dsa-001",
  stage: "D4",
  dueAt: "2026-08-07",
  completedAt: null,
  result: null
}
```

### Daily log

```javascript
{
  id: "daily-log-2026-08-03",
  date: "2026-08-03",
  note: "Java verbal practice was difficult but completed.",
  updatedAt: "2026-08-03T20:00:00Z"
}
```

### Activity

```javascript
{
  id: "activity-001",
  date: "2026-08-03",
  domain: "JAVA_THEORY",
  itemId: "java-core-001",
  label: "ConcurrentHashMap review",
  result: "PARTIAL",
  durationMinutes: 8
}
```

---

## 15. localStorage

Use one versioned storage key:

```text
lifeChanger.v1
```

Example structure:

```javascript
{
  version: 1,
  motivationEntries: [],
  learningItems: [],
  attempts: [],
  reviews: [],
  dailyLogs: [],
  activities: [],
  functionalTasks: [],
  systemDesignTasks: []
}
```

Requirements:

- initialize sample data only when no stored data exists
- save after every create, update, delete, result, or review action
- recover safely from invalid JSON by offering a reset
- add a visible “Reset prototype data” control in a Settings area or footer
- ask for confirmation before reset
- do not silently erase user data

---

## 16. CRUD interaction rules

All CRUD flows should have:

- clear Add button
- edit action
- delete action
- confirmation before delete
- required field validation
- cancel option
- successful UI refresh after save

Use accessible modal dialogs or inline editing.

Do not use browser `prompt()` for primary CRUD flows.

Error messages should appear near the relevant form.

---

## 17. Visual design

Use a calm, professional dashboard style.

Requirements:

- readable typography
- restrained colour usage
- clear active states
- visible focus styles
- consistent spacing
- rounded but not excessively decorative surfaces
- progress bars with labels
- status badges containing text, not colour alone
- no gradients required
- no gamified punishment imagery

Status colours may differ, but always include text:

- PASS
- PARTIAL
- FAIL
- DUE
- OVERDUE
- RETAINED

The application should be usable in a browser width from approximately 320px upward.

---

## 18. Accessibility

Implement:

- semantic headings
- buttons as `<button>`
- form labels
- keyboard-accessible navigation
- visible focus states
- `aria-expanded` for expandable rows
- `aria-controls` where appropriate
- accessible modal behaviour
- text labels in addition to colour
- descriptive SVG title or `aria-label`

---

## 19. Out of scope

Do not implement in this phase:

- user accounts
- cloud synchronisation
- backend APIs
- database migrations
- Spring Boot
- OpenAI integration
- automatic AI scoring
- voice interviews
- notifications
- email reminders
- calendar integration
- GitHub integration
- production security
- full NeetCode 150 content
- copyrighted lesson copying
- advanced charting libraries
- deployment

---

## 20. Acceptance criteria

The phase is complete only when all of the following work:

### Navigation

- every main page is reachable
- hash navigation works
- browser back and forward work
- detail pages can return to their lists

### Data

- sample data appears on first open
- edits survive browser refresh
- new records survive browser refresh
- deleted records stay deleted after refresh
- reset restores sample data

### Dashboard

- shows due and overdue items
- shows recent activity
- links to relevant work

### Motivation

- create, edit, delete, and reorder work

### Calendar

- month navigation works
- a date can be selected
- daily notes can be saved
- activities from other pages appear automatically

### Behaviour and Java Theory

- rows expand and collapse
- CRUD works
- PASS / PARTIAL / FAIL creates attempts
- next review dates update

### DSA

- rows can be marked solved
- D+1, D+4, and D+17 dates are generated
- review results can be recorded
- failed reviews create next-day retries
- filters and search work
- row state changes visually

### Functional Coding

- list and detail navigation work
- task CRUD works
- attempt CRUD works

### System Design

- DDIA and Hello Interview tabs work
- detail pages work
- question/task CRUD works
- attempts and review results work

### Quality

- no JavaScript errors during normal use
- no required installation
- responsive at mobile and desktop widths
- README explains how to run and reset the prototype

---

## 21. Implementation order

Implement in this order:

1. file structure and application shell
2. hash router
3. storage helpers and sample data
4. shared modal and form utilities
5. Dashboard
6. Motivation
7. Calendar
8. shared expandable question component
9. Behaviour
10. Java Theory
11. DSA review logic
12. Functional Coding list and detail
13. System Design tabs and detail
14. responsive styling
15. accessibility checks
16. README
17. manual acceptance test

Do not spend time polishing the character illustration until all required interactions work.

---

## 22. Final response required from the coding agent

After implementation, report:

1. files created or changed
2. major features implemented
3. how to open the prototype
4. how localStorage is structured
5. any incomplete acceptance criteria
6. any design decisions that differ from this specification

Do not claim a feature is complete unless it has been manually tested in the browser.
