# Implementation Plan: Expense & Budget Visualizer

## Overview

Implement a pure HTML/CSS/vanilla JavaScript single-page expense tracker. The app has no build toolchain — all files are loaded directly in the browser. Tasks follow the data flow: scaffold HTML structure first, apply CSS, then layer in JavaScript logic (state, storage, validation, rendering), add Chart.js integration, wire up dark/light mode, and finish with error handling and edge-case hardening.

---

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` at the project root with `<!DOCTYPE html>`, `<html lang="en">`, `<head>`, and `<body>` elements
  - Add `<link rel="stylesheet" href="css/style.css">` inside `<head>`
  - Add Chart.js CDN `<script>` tag before the closing `</body>` tag (e.g., `https://cdn.jsdelivr.net/npm/chart.js`)
  - Add `<script src="js/app.js" defer></script>` after the Chart.js CDN tag
  - Create the empty file `css/style.css`
  - Create the empty file `js/app.js`
  - Build all semantic HTML sections with the exact IDs specified in the design: `#app-header`, `#balance-display`, `#theme-toggle`, `#transaction-form`, `#item-name`, `#item-amount`, `#item-category`, `#add-btn`, `#error-name`, `#error-amount`, `#error-category`, `#spending-chart`, `#chart-placeholder`, `#transaction-list`, `#empty-state`, `#error-toast`
  - The `<form>` dropdown (`#item-category`) must contain exactly the options Food, Transport, and Fun
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 1.1, 4.6_

- [x] 2. Implement CSS layout, design tokens, and component styles
  - [x] 2.1 Define CSS custom properties (design tokens) and base reset
    - Declare `:root` variables for colours, spacing, border-radius, font-size, and transition speed
    - Add a minimal box-sizing and margin reset
    - _Requirements: 7.1_

  - [x] 2.2 Style the header, balance card, and theme toggle button
    - Header sits at the top of the page; balance card is displayed prominently with large font
    - Theme toggle button uses a `🌙` / `☀️` icon and is positioned in the header
    - _Requirements: 3.1_

  - [x] 2.3 Style the input form card
    - Form fields stack vertically with visible labels
    - Each field is followed by its inline error `<span>` (default hidden); error text is red and appears below the field
    - Submit button (`#add-btn`) spans full width
    - _Requirements: 1.1, 1.4_

  - [x] 2.4 Style the transaction list card
    - List container has a fixed max-height and `overflow-y: auto` so it scrolls independently
    - Each `<li>` row shows name, amount, category, and delete button in a horizontal flex row
    - Long item names truncate with `text-overflow: ellipsis`
    - Empty-state message (`#empty-state`) is centered and visually distinct
    - _Requirements: 2.1, 2.2, 2.6_

  - [x] 2.5 Style the chart card
    - Chart canvas occupies the card area; `#chart-placeholder` text is centered and visible when canvas is hidden
    - _Requirements: 4.5_

  - [x] 2.6 Implement dark mode CSS and body-level class toggle
    - Add `.dark` class overrides on `body.dark` for all design-token colours (background, text, card surfaces, borders)
    - Ensure all components—header, cards, form, list rows, buttons—are themed correctly under `.dark`
    - _Requirements: (Dark/light mode toggle — Glossary & design)_

  - [x] 2.7 Implement responsive layout (single-column on small screens)
    - Use CSS Grid or Flexbox so sections reflow to a single column below 600 px
    - _Requirements: 6.1, 6.2_

- [x] 3. Implement JavaScript core — state, storage, and entry point
  - [x] 3.1 Declare module-level state variables and constants
    - Write `let transactions = [];` and `let chartInstance = null;`
    - Define `const STORAGE_KEY = 'expense_visualizer_transactions';` and `const THEME_KEY = 'theme';`
    - _Requirements: 5.4, 7.2_

  - [x] 3.2 Implement `loadTransactions()`
    - Read from `localStorage.getItem(STORAGE_KEY)`; return `[]` if absent
    - `JSON.parse` the value; return `[]` if parsing throws or result is not an array
    - Filter to keep only objects where `id` is string, `name` is string, `amount` is number, and `category` is one of `'Food' | 'Transport' | 'Fun'`
    - _Requirements: 5.1, 5.4, 5.5_

  - [ ]* 3.3 Write property test for `loadTransactions()` — Property 10
    - **Property 10: Storage Load Invariant** — for any well-formed JSON array of Transaction objects seeded into `localStorage`, after `init()` runs the in-memory `transactions` array SHALL equal the parsed stored array
    - **Validates: Requirements 5.1**

  - [x] 3.4 Implement `saveTransactions(transactions)`
    - Wrap `localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))` in try/catch
    - On catch, call `showError(...)` and re-throw (callers handle rollback)
    - _Requirements: 5.2, 5.3, 5.6_

  - [ ]* 3.5 Write property test for `saveTransactions()` — Property 3
    - **Property 3: Transaction Addition Storage Round-Trip** — for any valid Transaction object added to the app, `JSON.parse(localStorage.getItem(STORAGE_KEY))` SHALL contain an object whose fields equal those of the added transaction
    - **Validates: Requirements 1.2, 5.2, 5.4**

  - [ ]* 3.6 Write property test for serialization — Property 11
    - **Property 11: Serialization Round-Trip** — `JSON.parse(JSON.stringify(t))` SHALL produce an object equal to `t` in all fields with preserved types
    - **Validates: Requirements 5.4**

  - [x] 3.7 Implement `init()` entry point
    - Call `loadTransactions()` and assign result to `transactions`
    - Apply saved theme from `localStorage.getItem(THEME_KEY)` (add `.dark` to `<body>` if value is `'dark'`)
    - Attach all event listeners: form `submit`, list `click` (delegated), theme toggle `click`
    - Call `renderBalance()`, `renderTransactionList()`, `renderChart()`
    - Wire `DOMContentLoaded` → `init()`
    - Also add the `window.load` + 5 s timeout for CDN failure detection
    - _Requirements: 5.1, 7.5_

- [x] 4. Checkpoint — verify scaffolding and storage
  - Ensure `index.html` opens in a browser without console errors, all DOM IDs are present, and `localStorage` read/write works manually via DevTools. Ask the user if questions arise.

- [x] 5. Implement validation
  - [x] 5.1 Implement `validateForm(name, amount, category)`
    - Return `{ valid: true, errors: {} }` when name is 1–100 characters, amount parses to a float in [0.01, 999999999.99], and category is one of `'Food' | 'Transport' | 'Fun'`
    - Return `{ valid: false, errors: { name?, amount?, category? } }` with an error message string for each violated constraint
    - _Requirements: 1.3, 1.4_

  - [ ]* 5.2 Write property test for `validateForm()` — Property 1
    - **Property 1: Validator Correctness** — for any combination of name/amount/category, `validateForm` returns `valid: true` iff all constraints are satisfied; returns `valid: false` with the corresponding error keys for every violated constraint
    - **Validates: Requirements 1.3, 1.4**

  - [x] 5.3 Implement `showError(message)` — error toast
    - Set `#error-toast` text content to `message`, make it visible
    - Auto-dismiss after 4 seconds
    - _Requirements: 1.6, 2.7, 5.6_

- [x] 6. Implement UI render functions
  - [x] 6.1 Implement `renderBalance()`
    - Sum `transactions` amounts with `reduce`; format result as `$N.NN`; set `#balance-display` text content
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 6.2 Write property test for `renderBalance()` — Property 8
    - **Property 8: Balance Invariant** — for any `transactions` array, the text content of `#balance-display` SHALL equal `$` + sum formatted to two decimal places
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

  - [x] 6.3 Implement `renderTransactionList()`
    - Clear `#transaction-list` innerHTML
    - If `transactions` is empty, hide `#transaction-list` and show `#empty-state`; otherwise show list, hide empty-state
    - Render one `<li>` per transaction in **reverse** insertion order (index `length-1` first)
    - Each `<li>` contains: item name (ellipsis truncation via CSS class), amount formatted as `$N.NN`, category string, and a delete `<button>` with `data-id` set to `transaction.id`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [ ]* 6.4 Write property test for `renderTransactionList()` — Property 4
    - **Property 4: Transaction Row Rendering Format** — for any Transaction object in `transactions`, its `<li>` SHALL contain the name (or truncated form), amount as `$N.NN`, and the category string verbatim
    - **Validates: Requirements 2.1**

  - [ ]* 6.5 Write property test for reverse-insertion order — Property 5
    - **Property 5: List Reverse-Insertion-Order Invariant** — for any sequence of transactions added one after another, the first `<li>` child in `#transaction-list` SHALL be the most recently added
    - **Validates: Requirements 2.3**

  - [ ]* 6.6 Write property test for list-DOM length — Property 6
    - **Property 6: List-DOM Length Invariant** — the number of `<li>` elements in `#transaction-list` SHALL always equal `transactions.length`; every `<li>` in a non-empty list SHALL contain exactly one delete button
    - **Validates: Requirements 2.4**

- [x] 7. Implement event handlers — form submit and delete
  - [x] 7.1 Implement `handleFormSubmit(event)`
    - Call `event.preventDefault()`
    - Clear any existing inline errors on `#error-name`, `#error-amount`, `#error-category`
    - Read field values; call `validateForm()`; if invalid, display each error message in the corresponding `<span>` and return
    - Build a new `Transaction` object with `id = crypto.randomUUID() || Date.now().toString()`, trim name, parse amount as float, category value
    - Attempt `saveTransactions([...transactions, newTx])`; if save throws, call `showError(...)` and return (do NOT mutate `transactions`)
    - On success: append `newTx` to `transactions`, call `renderBalance()`, `renderTransactionList()`, `renderChart()`, then reset the form fields (`name = ''`, `amount = ''`, `category = 'Food'`)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 6.1_

  - [ ]* 7.2 Write property test for form reset — Property 2
    - **Property 2: Form Reset After Successful Submission** — for any valid input set, after `handleFormSubmit` completes the name field SHALL be empty, amount field SHALL be empty, and category dropdown SHALL be `'Food'`
    - **Validates: Requirements 1.5**

  - [x] 7.3 Implement `handleDeleteClick(event)` (event-delegated on `#transaction-list`)
    - Check `event.target` closest `[data-id]`; if none, return
    - Find the transaction index by id; if not found, return
    - Build the updated array without the deleted transaction
    - Attempt `saveTransactions(updatedArray)`; if save throws, call `showError(...)` and return (do NOT mutate `transactions`)
    - On success: set `transactions = updatedArray`, call `renderBalance()`, `renderTransactionList()`, `renderChart()`
    - _Requirements: 2.5, 2.7, 5.3, 6.2_

  - [ ]* 7.4 Write property test for delete removal — Property 7
    - **Property 7: Delete Removal Invariant** — for any non-empty `transactions` array and any randomly picked transaction T, after delete completes, T.id SHALL NOT appear in `transactions`, the DOM list, or `localStorage`
    - **Validates: Requirements 2.5, 5.3**

- [x] 8. Checkpoint — verify form and list behavior
  - Ensure add/delete flows work end-to-end, inline errors appear correctly, the list renders in reverse order, balance updates, and localStorage is written. Ask the user if questions arise.

- [x] 9. Implement Chart.js pie chart integration
  - [x] 9.1 Implement `renderChart()`
    - Compute per-category totals by reducing `transactions`; exclude categories with a total of 0
    - If no category has a positive total (or `transactions` is empty): destroy any existing `chartInstance`, set `chartInstance = null`, hide `#spending-chart`, show `#chart-placeholder` with "No spending data available."
    - Otherwise: show `#spending-chart`, hide `#chart-placeholder`
    - If `chartInstance` exists, call `chartInstance.destroy()` before creating a new one to avoid canvas re-use errors
    - Create a `new Chart(document.getElementById('spending-chart'), { type: 'pie', data: { labels, datasets: [{ data }] }, options: { plugins: { tooltip: ..., legend: ... } } })`
    - Each segment label: `'CategoryName'`; tooltip/legend shows percentage rounded to one decimal place
    - Assign the new instance to `chartInstance`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 9.2 Write property test for chart data invariant — Property 9
    - **Property 9: Chart Data Invariant** — for any `transactions` array, the `labels` and `data` arrays passed to Chart.js SHALL contain exactly the categories with a positive total (same order), with no zero-total category included; when `transactions` is empty the canvas SHALL be hidden
    - **Validates: Requirements 4.1, 4.4, 4.5**

  - [x] 9.3 Implement CDN failure detection
    - In `init()`, add `window.addEventListener('load', () => setTimeout(() => { if (typeof Chart === 'undefined') { /* hide canvas, show error placeholder */ } }, 5000))`
    - Error text: `'Chart unavailable — library failed to load.'`
    - _Requirements: 4.7, 6.4_

- [x] 10. Implement dark/light mode toggle
  - [x] 10.1 Implement `handleThemeToggle()`
    - Toggle the `.dark` class on `<body>`
    - Persist the new theme value (`'dark'` or `'light'`) to `localStorage` under `THEME_KEY`
    - Update the toggle button text/icon (`🌙` ↔ `☀️`)
    - _Requirements: (Dark/light mode — Glossary & design)_

  - [x] 10.2 Apply saved theme on `init()`
    - Read `localStorage.getItem(THEME_KEY)`; if `'dark'`, add `.dark` to `<body>` and set the button icon to `☀️`
    - This must happen before the first render to avoid a flash of unstyled theme
    - _Requirements: (Dark/light mode — Glossary & design), 5.1_

- [x] 11. Harden error handling and edge cases
  - [x] 11.1 Guard against missing `crypto.randomUUID`
    - In the transaction-creation code, use `typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).slice(2)`
    - _Requirements: 7.5 (no unhandled errors)_

  - [x] 11.2 Guard against corrupt or non-array localStorage data on load
    - Confirm `loadTransactions()` silently returns `[]` (and does not throw) when localStorage contains a non-array JSON value, an invalid JSON string, or is empty
    - _Requirements: 5.5_

  - [x] 11.3 Ensure `showError` toast does not stack
    - If a toast is already visible, clear its dismiss timer and restart with the new message to avoid overlapping toasts
    - _Requirements: 1.6, 2.7, 5.6_

- [x] 12. Final checkpoint — full integration and smoke verification
  - Open `index.html` via `file://` in a browser (no local server)
  - Verify: no unhandled console errors on load, CSS and JS files load, Chart.js renders a pie chart after adding transactions with multiple categories, delete updates balance and chart, dark mode toggles and persists on reload, empty-state and chart placeholder show when list is empty, balance shows `$0.00` when empty
  - Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP — they require **fast-check** loaded via CDN or npm for property-based testing
- The design document's Correctness Properties (P1–P11) are the authoritative source for all property test assertions
- Each implementation task references the specific requirement clauses it satisfies for full traceability
- Checkpoints (tasks 4, 8, 12) are manual verification gates — they do not produce code artifacts
- All DOM manipulation is via the native DOM API; no libraries other than Chart.js are used
- `crypto.randomUUID()` is supported in all modern browsers; the `Date.now()` fallback covers older environments per the design spec

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["3.1"] },
    { "id": 1, "tasks": ["3.2", "3.4"] },
    { "id": 2, "tasks": ["3.3", "3.5", "3.6", "5.1", "5.3"] },
    { "id": 3, "tasks": ["3.7", "5.2", "6.1", "6.3"] },
    { "id": 4, "tasks": ["6.2", "6.4", "6.5", "6.6", "7.1", "7.3"] },
    { "id": 5, "tasks": ["7.2", "7.4", "9.1", "10.1", "10.2"] },
    { "id": 6, "tasks": ["9.2", "9.3", "11.1", "11.2", "11.3"] }
  ]
}
```
