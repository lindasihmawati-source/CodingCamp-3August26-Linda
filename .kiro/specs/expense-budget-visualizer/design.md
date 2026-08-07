# Design Document: Expense & Budget Visualizer

## Overview

The Expense & Budget Visualizer is a fully client-side single-page web application. It allows users to record personal expenses, view a running total balance, and understand spending distribution through a pie chart. The app uses no backend, no build toolchain, and no frameworks — only HTML5, CSS3, and vanilla JavaScript running directly in the browser. Data is persisted to the browser's Local Storage between sessions.

### Key Design Decisions

- **No framework**: Keeps the project dependency-free and loadable by opening `index.html` directly. DOM manipulation is done manually via the standard DOM API.
- **Single JS file**: All logic lives in `js/app.js` with clearly separated concerns via named functions. This simplifies maintenance without the overhead of a module bundler.
- **Chart.js via CDN**: Avoids shipping a chart library in the repo. A CDN failure is detected and handled gracefully, so the rest of the app remains functional.
- **Local Storage only**: No network requests for data. This removes authentication concerns and makes the app work offline.

---

## Architecture

The app is a classic client-side MPA-lite with a single HTML page. There is no routing.

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
│                                                         │
│  ┌──────────┐    DOMContentLoaded    ┌───────────────┐  │
│  │index.html│ ──────────────────────▶│  js/app.js    │  │
│  └──────────┘                        │               │  │
│                                      │  init()       │  │
│  ┌──────────┐                        │   ├─ loadTransactions()  │
│  │css/style │                        │   ├─ renderBalance()     │
│  │   .css   │                        │   ├─ renderTransactionList() │
│  └──────────┘                        │   └─ renderChart()       │
│                                      │               │  │
│  ┌──────────┐                        │  Event Handlers:         │
│  │Chart.js  │ (CDN)                  │  • form submit           │
│  └──────────┘                        │  • delete (delegated)    │
│                                      │  • theme toggle          │
│  ┌──────────────────────┐            └───────┬───────┘  │
│  │   Local Storage      │◀───────────────────┘          │
│  │  expense_visualizer_ │  loadTransactions()            │
│  │  transactions (JSON) │  saveTransactions()            │
│  └──────────────────────┘                               │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action
    │
    ▼
Event Handler (form submit / delete click / theme toggle)
    │
    ├── Validate input (validateForm)
    │       └── if invalid → show inline errors → STOP
    │
    ├── Mutate in-memory state (transactions[])
    │
    ├── Persist to Storage (saveTransactions)
    │       └── if Storage fails → show error toast → rollback → STOP
    │
    └── Re-render UI
            ├── renderBalance()
            ├── renderTransactionList()
            └── renderChart()
```

---

## Components and Interfaces

### HTML Sections

| Section | Element | ID | Purpose |
|---|---|---|---|
| Header | `<header>` | `#app-header` | Contains balance card and theme toggle |
| Balance card | `<div>` | `#balance-display` | Shows formatted total balance |
| Theme toggle | `<button>` | `#theme-toggle` | 🌙/☀️ switch |
| Form section | `<section>` | `#form-section` | Contains the input form card |
| Input form | `<form>` | `#transaction-form` | Name, amount, category fields + submit |
| Chart section | `<section>` | `#chart-section` | Contains chart card |
| Chart canvas | `<canvas>` | `#spending-chart` | Chart.js render target |
| Chart placeholder | `<p>` | `#chart-placeholder` | Shown when no data or CDN fails |
| List section | `<section>` | `#list-section` | Contains transaction list card |
| Transaction list | `<ul>` | `#transaction-list` | Rendered `<li>` rows |
| Empty state | `<p>` | `#empty-state` | Shown when list is empty |

### Form Field IDs

| Field | Element | ID | Validation |
|---|---|---|---|
| Item name | `<input type="text">` | `#item-name` | 1–100 characters |
| Amount | `<input type="number">` | `#item-amount` | 0.01–999,999,999.99 |
| Category | `<select>` | `#item-category` | Must be Food / Transport / Fun |
| Error — name | `<span>` | `#error-name` | Inline error message |
| Error — amount | `<span>` | `#error-amount` | Inline error message |
| Error — category | `<span>` | `#error-category` | Inline error message |
| Submit button | `<button type="submit">` | `#add-btn` | — |

### JavaScript Public Interface (named functions in `app.js`)

```js
// Storage module
function loadTransactions(): Transaction[]
function saveTransactions(transactions: Transaction[]): void  // throws StorageError

// Validation module
function validateForm(name: string, amount: string, category: string): ValidationResult
// ValidationResult = { valid: boolean, errors: { name?: string, amount?: string, category?: string } }

// UI render functions
function renderBalance(): void
function renderTransactionList(): void
function renderChart(): void
function showError(message: string): void  // toast/inline global error

// Event handlers (attached in init)
function handleFormSubmit(event: SubmitEvent): void
function handleDeleteClick(event: MouseEvent): void  // event-delegated on #transaction-list
function handleThemeToggle(): void

// Entry point
function init(): void  // called on DOMContentLoaded
```

---

## Data Models

### Transaction Object

```js
/**
 * @typedef {Object} Transaction
 * @property {string}  id       - Unique identifier. Uses crypto.randomUUID() with
 *                                 Date.now().toString() as fallback for older browsers.
 * @property {string}  name     - Item name. 1–100 characters.
 * @property {number}  amount   - Monetary amount. 0.01–999,999,999.99.
 * @property {string}  category - One of 'Food' | 'Transport' | 'Fun'.
 */
const TRANSACTION_SCHEMA = { id: 'string', name: 'string', amount: 'number', category: 'string' };
```

### Storage Layout

```js
// Key used for localStorage
const STORAGE_KEY = 'expense_visualizer_transactions';

// Value: JSON.stringify(Transaction[])
// Example:
// '[{"id":"abc123","name":"Lunch","amount":12.50,"category":"Food"}]'
```

### Theme Preference

```js
const THEME_KEY = 'theme';  // value: 'dark' | 'light'
```

### In-Memory State

```js
// Module-level variables in app.js
let transactions = [];       // Transaction[] — single source of truth
let chartInstance = null;    // Chart | null — current Chart.js instance
```

### Validation Result

```js
/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {{ name?: string, amount?: string, category?: string }} errors
 */
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Validator Correctness

*For any* combination of name (string), amount (string), and category (string), `validateForm` SHALL return `valid: true` if and only if name has 1–100 non-empty characters, amount parses to a number in [0.01, 999,999,999.99], and category is one of 'Food', 'Transport', or 'Fun'. For any input that violates at least one of these constraints, `validateForm` SHALL return `valid: false` and SHALL populate the corresponding error field for each violated constraint.

**Validates: Requirements 1.3, 1.4**

---

### Property 2: Form Reset After Successful Submission

*For any* valid transaction input (name, amount, category all satisfying constraints), after `handleFormSubmit` completes successfully, the item name field SHALL be empty, the amount field SHALL be empty, and the category dropdown SHALL be set to 'Food'.

**Validates: Requirements 1.5**

---

### Property 3: Transaction Addition Storage Round-Trip

*For any* valid `Transaction` object added to the app, after the add operation completes, `JSON.parse(localStorage.getItem(STORAGE_KEY))` SHALL contain an object whose `id`, `name`, `amount`, and `category` fields equal those of the added transaction. The parsed value SHALL be a JSON array where each element has the fields `id: string`, `name: string`, `amount: number`, `category: string`.

**Validates: Requirements 1.2, 5.2, 5.4**

---

### Property 4: Transaction Row Rendering Format

*For any* `Transaction` object in the `transactions` array, the rendered `<li>` element for that transaction SHALL contain: the item name (or its truncated form with an ellipsis if it exceeds the display width), the amount formatted as a string matching the pattern `$N.NN` (currency symbol, two decimal places), and the category string verbatim.

**Validates: Requirements 2.1**

---

### Property 5: List Reverse-Insertion-Order Invariant

*For any* sequence of transactions added one after another, the order of `<li>` elements in `#transaction-list` SHALL be the reverse of the insertion order — the most recently added transaction SHALL appear as the first child, and the earliest added transaction SHALL appear as the last child.

**Validates: Requirements 2.3**

---

### Property 6: List-DOM Length Invariant

*For any* state of the `transactions` array (including empty), the number of `<li>` elements rendered inside `#transaction-list` SHALL equal `transactions.length`. Additionally, for any non-empty `transactions` array, every rendered `<li>` SHALL contain exactly one delete button.

**Validates: Requirements 2.4**

---

### Property 7: Delete Removal Invariant

*For any* transaction `T` present in the `transactions` array, after the delete operation for `T` completes, `T.id` SHALL NOT appear in the `transactions` array, SHALL NOT correspond to any `<li>` element in `#transaction-list`, and SHALL NOT appear in any transaction object stored in `localStorage` under `STORAGE_KEY`.

**Validates: Requirements 2.5, 5.3**

---

### Property 8: Balance Invariant

*For any* `transactions` array (including the empty array), the text content of `#balance-display` SHALL equal the string produced by formatting `transactions.reduce((sum, t) => sum + t.amount, 0)` as a currency value with two decimal places and a `$` prefix (e.g., `$0.00` when the array is empty).

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

---

### Property 9: Chart Data Invariant

*For any* `transactions` array, the data passed to `Chart.js` SHALL satisfy: (a) the `labels` array contains exactly the category names whose total amount is greater than zero; (b) the `data` array contains the corresponding totals in the same order; (c) no category with a total amount of zero or below is included in `labels` or `data`. When `transactions` is empty, the canvas SHALL be hidden and `#chart-placeholder` SHALL be visible.

**Validates: Requirements 4.1, 4.4, 4.5**

---

### Property 10: Storage Load Invariant

*For any* well-formed JSON array of `Transaction` objects stored in `localStorage` under `STORAGE_KEY` before `init()` is called, after `init()` completes the in-memory `transactions` array SHALL equal the parsed stored array, and the rendered `Transaction_List`, `Balance`, and `Chart` SHALL reflect that dataset exactly.

**Validates: Requirements 5.1**

---

### Property 11: Serialization Round-Trip

*For any* valid `Transaction` object `t`, the expression `JSON.parse(JSON.stringify(t))` SHALL produce an object that equals `t` in all fields (`id`, `name`, `amount`, `category`) with preserved types (`id: string`, `name: string`, `amount: number`, `category: string`).

**Validates: Requirements 5.4**

---

## Error Handling

### Storage Write Failure

```
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
} catch (e) {
  showError('Could not save data. Storage may be full or unavailable.');
  // rollback: do NOT update in-memory state when called from add
  // rollback: restore the removed item when called from delete
}
```

- The error message is displayed as an inline toast `<div id="error-toast">` positioned at the bottom of the viewport.
- The toast auto-dismisses after 4 seconds.
- The in-memory `transactions` array is left in its pre-operation state (no partial write).

### Storage Read / JSON Parse Failure

```
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter to keep only well-formed objects
    return parsed.filter(t =>
      typeof t.id === 'string' &&
      typeof t.name === 'string' &&
      typeof t.amount === 'number' &&
      ['Food', 'Transport', 'Fun'].includes(t.category)
    );
  } catch {
    return [];
  }
}
```

- Malformed or non-array data is silently discarded and replaced with `[]`.
- No unhandled error is thrown.

### Chart.js CDN Failure

```js
window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof Chart === 'undefined') {
      document.getElementById('spending-chart').style.display = 'none';
      document.getElementById('chart-placeholder').textContent =
        'Chart unavailable — library failed to load.';
      document.getElementById('chart-placeholder').style.display = 'block';
    }
  }, 5000);
});
```

- Detected 5 seconds after `window.load` fires.
- Chart canvas is hidden; a text message replaces it.
- Balance and Transaction_List continue to function normally.

### Validation Errors

- Errors are displayed inline adjacent to each invalid field using the `<span>` elements `#error-name`, `#error-amount`, `#error-category`.
- All errors are cleared on each new submission attempt before re-validation.
- The form is NOT submitted and no data is written on validation failure.

---

## Testing Strategy

### Property-Based Testing

This feature contains pure functions (validator, balance calculation, category grouping, serialization) that are well-suited to property-based testing. The recommended library is **fast-check** (JavaScript), which runs each property through a configurable number of randomized input iterations (minimum 100).

Each property test MUST include a comment tag in the format:
```
// Feature: expense-budget-visualizer, Property N: <property_text>
```

**Properties to implement as property-based tests:**

| Property | Test target | Generator inputs |
|---|---|---|
| P1 — Validator Correctness | `validateForm()` | Arbitrary strings for name/amount, arbitrary category values |
| P3 — Transaction Addition Round-Trip | `saveTransactions()` + localStorage | Arbitrary valid Transaction objects |
| P4 — Transaction Row Rendering Format | `renderTransactionList()` DOM output | Arbitrary Transaction objects |
| P5 — List Reverse-Insertion-Order | `renderTransactionList()` DOM output | Arbitrary ordered sequences of transactions |
| P6 — List-DOM Length Invariant | `renderTransactionList()` DOM output | Arbitrary arrays of 0–N transactions |
| P7 — Delete Removal Invariant | `handleDeleteClick()` → state + DOM + storage | Arbitrary non-empty transaction arrays, random pick to delete |
| P8 — Balance Invariant | `renderBalance()` DOM output | Arbitrary arrays of transactions with random amounts |
| P9 — Chart Data Invariant | chart config data passed to Chart.js | Arbitrary transaction arrays with varied category distribution |
| P10 — Storage Load Invariant | `init()` | Arbitrary well-formed JSON arrays placed in localStorage mock |
| P11 — Serialization Round-Trip | `JSON.parse(JSON.stringify(t))` | Arbitrary valid Transaction objects |

### Unit Tests (Example-Based)

Unit tests focus on specific scenarios and edge conditions:

| Test | Covers |
|---|---|
| Empty form submission shows errors for all fields | Req 1.4 |
| Name exactly 100 chars is valid; 101 chars is invalid | Req 1.3 edge |
| Amount 0.01 is valid; 0.009 is invalid; 999999999.99 is valid | Req 1.3 edge |
| Empty transaction list renders empty-state message | Req 2.6 |
| Empty transaction list shows $0.00 balance | Req 3.4 |
| Empty transaction list hides chart canvas, shows placeholder | Req 4.5 |
| Form resets after successful submission | Req 1.5 |
| Dark mode toggle adds/removes `.dark` class on `<body>` | Design |
| Theme preference persists in localStorage under key `'theme'` | Design |
| Malformed localStorage data initializes to empty state | Req 5.5 |
| Non-array localStorage data initializes to empty state | Req 5.5 |
| Storage write failure shows error and does not add transaction | Req 1.6 |
| Storage write failure on delete shows error and keeps transaction | Req 2.7 |
| Chart.js CDN unavailable after 5s shows fallback message | Req 4.7 |

### Integration / Smoke Tests

| Test | Covers |
|---|---|
| `index.html` loads without unhandled console errors | Req 7.5 |
| `css/style.css` exists and is linked in `index.html` | Req 7.1, 7.3 |
| `js/app.js` exists and is referenced in `index.html` | Req 7.2, 7.3 |
| Chart.js CDN script tag is present in `index.html` | Req 4.6 |
| App functions without a local server (file:// protocol) | Req 7.4 |

### Property Test Configuration

```js
// fast-check configuration
fc.assert(
  fc.property(/* arbitraries */, (inputs) => {
    // property assertion
  }),
  { numRuns: 100 }
);
```

Each property test runs a minimum of **100 iterations** with random inputs generated by fast-check's built-in arbitraries (strings, floats, arrays, etc.), providing broad input coverage without hand-writing individual test cases.
