# Phase 0 Prototype — Review Update 1

## 1. Purpose

Update the existing **Life Changer HTML/JavaScript prototype** based on the first UI review.

This is still a prototype phase.

Continue using only:

- HTML5
- CSS3
- vanilla JavaScript
- browser `localStorage`

Do not introduce:

- React
- Vue
- Angular
- Spring Boot
- Node.js backend
- databases
- authentication
- OpenAI API
- external APIs
- package managers
- build tools

The application must continue to run by opening `index.html` directly in a browser.

This document is a **change request** for the existing Phase 0 prototype. Keep all previously implemented functions unless this document explicitly changes them.

---

# 2. Global changes

## 2.1 Domain progress bar

Add the same progress summary shown on the Dashboard to the top of each of these domain pages:

- Behaviour
- Java Theory
- DSA
- Functional Coding
- System Design

The progress bar should appear below the page title and above the main page content.

Each page should show:

- domain name
- completed or interview-ready item count
- total item count
- progress percentage
- labelled progress bar

Example:

```text
Java Theory Progress
42 / 150 interview-ready
28%
[██████░░░░░░░░░░░░]
```

The percentage must be calculated from stored prototype data rather than hardcoded when practical.

Use the existing readiness calculation rules consistently.

Do not display colour alone. Always display the numeric value and text label.

---

# 3. Dashboard changes

## 3.1 Add study streak metric

Add a new metric card to the first Dashboard metric section.

Label:

```text
Study streak
```

Display:

- current number of consecutive study days
- longest streak if available

Example:

```text
Study streak
6 days
Longest: 11 days
```

### Streak calculation

A day counts as a study day when at least one learning activity exists on that date.

Learning activity domains:

- BEHAVIOUR
- JAVA_THEORY
- DSA
- FUNCTIONAL_CODING
- SYSTEM_DESIGN

Do not count:

- editing Motivation entries
- editing a daily note without learning activity
- navigation-only actions

Calculate the current streak backwards from today.

If there is no activity today but there was activity yesterday, the current streak may continue from yesterday.

Store activities in the existing `activities` collection.

---

## 3.2 Make Today's Priorities editable

Change **Today's Priorities** from a read-only recommendation list into a lightweight editable Todo list.

The list should still include automatically suggested items, but users must be able to manage the list.

Each priority item must support:

- create
- edit
- mark complete
- mark incomplete
- delete
- reorder up
- reorder down
- optionally link to a learning item or page
- due date
- priority level

Priority levels:

```text
HIGH
MEDIUM
LOW
```

Suggested fields:

```javascript
{
  id: "priority-001",
  title: "Review ConcurrentHashMap",
  source: "AUTO",
  linkedDomain: "JAVA_THEORY",
  linkedItemId: "java-core-001",
  dueDate: "2026-08-04",
  priority: "HIGH",
  completed: false,
  order: 1,
  createdAt: "2026-08-03T20:00:00Z",
  updatedAt: "2026-08-03T20:00:00Z"
}
```

`source` values:

```text
AUTO
MANUAL
```

### Automatic priorities

Automatically suggested priorities may include:

1. overdue reviews
2. reviews due today
3. unstarted P0 learning items

The user must be able to:

- dismiss an automatic item
- convert it into a manually managed Todo
- mark it complete

Do not recreate a dismissed automatic item immediately during the same day.

Persist Todo changes in `localStorage`.

Add a new collection:

```javascript
priorities: []
```

---

# 4. Calendar changes

## 4.1 Add coloured activity dots

Inside each calendar date cell, show small coloured dots representing which domains were practised on that date.

A date can display multiple dots.

Use the following domain mapping:

- DSA: blue
- System Design: red
- Behaviour: purple
- Java Theory: green
- Functional Coding: orange

Add a visible legend above or below the calendar.

Example:

```text
● DSA   ● System Design   ● Behaviour   ● Java Theory   ● Functional Coding
```

The dots must include accessible labels.

Recommended implementation:

```html
<span
  class="activity-dot activity-dot--dsa"
  aria-label="DSA activity"
  title="DSA">
</span>
```

### Calendar cell behaviour

For each date:

- show one dot per domain with activity
- do not duplicate dots when multiple activities exist in the same domain
- keep existing compact activity summaries if already implemented
- clicking the date should continue to show the full activity list below the calendar

Do not rely only on colour. Include the legend and `title` or `aria-label`.

---

# 5. Java Theory changes

## 5.1 Add edit icon to every question row

Add a pencil edit icon to every Java Theory question row.

The edit action must be clearly visible on both:

- Core Java tab
- Spring Boot tab

The pencil icon should open the existing edit form or modal.

The edit form must allow editing:

- question
- topic
- prepared answer
- personal answer
- notes
- follow-up questions
- priority
- tab or track

Use an accessible button:

```html
<button aria-label="Edit question">
  <!-- pencil icon -->
</button>
```

Do not use a decorative icon without a button.

---

## 5.2 Prepared Answer and Personal Answer sections

For each expanded Java Theory row, clearly separate:

### Prepared Answer

This is the concise reference answer prepared for interview practice.

Example placeholder:

```text
A concise prepared answer for “What makes an object immutable?”.
Start with the principle, explain the trade-off, then give a production example.
```

### Personal Answer & Notes

This is the user's own answer and learning notes.

Default placeholder:

```text
No notes yet.
```

Both sections must have a visible pencil edit action.

The user should be able to edit each section without editing the entire question if possible.

Suggested behaviour:

- click pencil
- switch section into editable textarea
- show Save and Cancel
- save to `localStorage`
- return to read-only display

---

## 5.3 Follow-up Questions should be collapsed by default

Do not show Follow-up Questions immediately when the main question row is expanded.

Instead, show a separate control:

```text
Show follow-up questions
```

When clicked:

- reveal the Follow-up Questions section below
- animate or smoothly expand it
- change the label to `Hide follow-up questions`
- update `aria-expanded`
- preserve keyboard accessibility

Example:

```html
<button
  class="follow-up-toggle"
  aria-expanded="false"
  aria-controls="follow-up-java-core-001">
  Show follow-up questions
</button>
```

The Follow-up Questions panel must:

- be hidden by default
- expand downward
- support multiple questions
- remain editable through the question edit flow

Use CSS transition carefully. Do not prevent content from being read when reduced-motion settings are enabled.

---

# 6. DSA changes

## 6.1 Replace Pass/Fail review controls with checkboxes

For review stages:

- D+1
- D+4
- D+17

Do not use Pass / Fail buttons in the list.

Use checkboxes.

Each review stage must show:

- due date
- completion checkbox
- completed date when checked
- due-state colour
- link or action to add notes

Example:

```text
D+1
[✓] 4 Aug
Completed 4 Aug
```

A checked review means the review was completed.

For this prototype, do not require Pass/Fail scoring at the list level.

The detailed page may include a free-text note about how the review went.

Suggested data model:

```javascript
{
  id: "review-001",
  itemId: "dsa-001",
  stage: "D1",
  dueAt: "2026-08-04",
  completed: true,
  completedAt: "2026-08-04",
  note: "Solved without hints but forgot one edge case."
}
```

When the checkbox is unchecked again:

- ask for confirmation if a completion note exists
- clear `completedAt`
- preserve or explicitly confirm deletion of the note

---

## 6.2 Due-date colour gradient

Apply a visual urgency scale to each D+1, D+4, and D+17 review cell.

The colour should move from green toward red as the due date approaches.

Use the following states:

### Completed

- checked
- calm completed style
- green or neutral completed background
- no overdue warning

### More than 7 days remaining

- green

### 4 to 7 days remaining

- yellow-green

### 2 to 3 days remaining

- yellow or amber

### 1 day remaining

- orange

### Due today

- red

### Overdue

- dark red

The overdue state must be visually stronger than the due-today state.

Always include text such as:

- `8 days left`
- `Due tomorrow`
- `Due today`
- `3 days overdue`
- `Completed`

Do not communicate urgency through colour alone.

Use CSS classes rather than inline styles where possible:

```text
review-state--safe
review-state--upcoming
review-state--soon
review-state--tomorrow
review-state--today
review-state--overdue
review-state--completed
```

---

## 6.3 Each DSA problem must have a detail page

Clicking the problem title or row should navigate to:

```text
#/dsa/:id
```

Do not trigger navigation when clicking:

- review checkbox
- edit button
- external LeetCode link

The browser back button must return to the DSA list.

---

## 6.4 DSA detail page

Create a DSA problem detail page.

Display:

- problem title
- category
- difficulty
- LeetCode link
- first solved date
- D+1 due date and completion state
- D+4 due date and completion state
- D+17 due date and completion state
- initial solve notes
- D+1 review notes
- D+4 review notes
- D+17 review notes
- general notes
- edit problem
- delete problem
- return to DSA list

### Initial solve notes

Allow the user to record:

- approach used
- complexity
- what was difficult
- hints used
- mistakes
- edge cases
- implementation notes

A single textarea is acceptable for the prototype.

### Review notes

Each review stage must have its own editable note.

Example:

```text
D+4 Review Note
I remembered the sliding-window structure, but forgot when to move the left pointer.
```

Each review stage should support:

- mark completed
- edit note
- save note
- clear completion with confirmation

All changes must persist in `localStorage`.

---

## 6.5 Add LeetCode links

Each DSA problem must have a `leetcodeUrl` field.

Example:

```javascript
{
  id: "dsa-001",
  title: "Two Sum",
  leetcodeUrl: "https://leetcode.com/problems/two-sum/"
}
```

Display an external link labelled:

```text
Open in LeetCode
```

Requirements:

- open in a new tab
- use `target="_blank"`
- use `rel="noopener noreferrer"`
- do not make the external link the only way to open the internal detail page

Example:

```html
<a
  href="https://leetcode.com/problems/two-sum/"
  target="_blank"
  rel="noopener noreferrer">
  Open in LeetCode
</a>
```

For sample problems, use valid LeetCode problem URLs.

Do not scrape LeetCode.

Do not copy paid problem descriptions or solution content.

Store only:

- problem title
- metadata
- URL
- user-created notes

---

# 7. Data model updates

Update the stored prototype state.

Example:

```javascript
{
  version: 2,
  motivationEntries: [],
  learningItems: [],
  attempts: [],
  reviews: [],
  dailyLogs: [],
  activities: [],
  priorities: [],
  functionalTasks: [],
  systemDesignTasks: []
}
```

## 7.1 Migration

Existing prototype data may use:

```text
lifeChanger.v1
```

Support a basic migration to:

```text
lifeChanger.v2
```

Migration requirements:

- preserve existing learning data
- preserve notes and attempts
- initialize `priorities` as an empty array
- add missing `leetcodeUrl` fields without deleting problems
- convert old DSA review results into checkbox-compatible completion state when possible
- do not silently discard stored data

If migration fails:

- show a clear error
- offer export or reset if export is already available
- do not automatically erase the old storage

---

# 8. Interaction and accessibility requirements

All new controls must support keyboard use.

Required:

- Todo edit controls use real buttons
- pencil icons have accessible labels
- expandable Follow-up Questions use `aria-expanded`
- activity dots have `title` or `aria-label`
- review colours also include readable text
- checkboxes have visible labels
- external LeetCode links are distinguishable from internal detail links
- focus states remain visible
- reduced-motion users should not be forced to use animation

---

# 9. Updated routes

Add:

```text
#/dsa/:id
```

Existing routes must continue working:

```text
#/dashboard
#/motivation
#/calendar
#/behaviour
#/java
#/dsa
#/functional-coding
#/functional-coding/:id
#/system-design
#/system-design/ddia/:chapterId
#/system-design/hello-interview/:id
```

---

# 10. Acceptance criteria

The update is complete only when all of the following are manually tested.

## Dashboard

- Study streak card is visible
- Current streak is calculated from activities
- Longest streak is displayed
- Today's Priorities supports create
- Today's Priorities supports edit
- Today's Priorities supports complete/incomplete
- Today's Priorities supports delete
- Today's Priorities supports reorder
- Priority changes persist after refresh

## Domain pages

- Behaviour shows its progress bar at the top
- Java Theory shows its progress bar at the top
- DSA shows its progress bar at the top
- Functional Coding shows its progress bar at the top
- System Design shows its progress bar at the top

## Calendar

- Activity dots appear in calendar cells
- Multiple domain dots can appear on one date
- DSA is blue
- System Design is red
- Behaviour is purple
- Java Theory is green
- Functional Coding is orange
- A visible legend exists
- The selected day's full activities still appear below

## Java Theory

- Every row has an edit pencil button
- Prepared Answer can be edited
- Personal Answer & Notes can be edited
- Changes persist after refresh
- Follow-up Questions are hidden by default
- Follow-up Questions expand downward when clicked
- The toggle updates `aria-expanded`
- Core Java and Spring Boot both support the behaviour

## DSA list

- D+1 uses a checkbox
- D+4 uses a checkbox
- D+17 uses a checkbox
- Checking a review stores the completion date
- Review state uses green-to-red urgency styling
- Due today is red
- Overdue is dark red
- Every state also includes text
- Problem title navigates to an internal detail page
- LeetCode link opens the correct external page
- Checkbox clicks do not accidentally navigate

## DSA detail

- The internal detail page opens
- Initial solve notes can be saved
- D+1 notes can be saved
- D+4 notes can be saved
- D+17 notes can be saved
- General notes can be saved
- Review checkboxes can be changed
- Data persists after refresh
- Browser back returns to the DSA list

## Quality

- No JavaScript errors occur during normal use
- Existing prototype features still work
- No backend or framework was introduced
- `index.html` still runs directly in the browser
- README is updated with the new functionality and storage version

---

# 11. Implementation order

Implement in this order:

1. storage version migration
2. shared domain progress component
3. Dashboard streak calculation
4. editable Today's Priorities
5. Calendar activity dots and legend
6. Java Theory row edit controls
7. Prepared Answer and Personal Answer inline editing
8. Follow-up Questions expandable panel
9. DSA review checkbox data model
10. DSA due-state calculation and styles
11. DSA internal detail route
12. DSA detail notes and review controls
13. LeetCode links
14. responsive checks
15. accessibility checks
16. README update
17. full manual regression test

Do not redesign unrelated screens during this update.

Do not add AI, a backend, or a framework.

---

# 12. Required final report from Codex

After implementation, report:

1. files changed
2. storage migration implemented
3. new routes added
4. Dashboard changes
5. Calendar changes
6. Java Theory changes
7. DSA changes
8. acceptance criteria manually tested
9. any incomplete items
10. any deviations from this specification

Do not report an item as complete unless it was tested in the browser.
