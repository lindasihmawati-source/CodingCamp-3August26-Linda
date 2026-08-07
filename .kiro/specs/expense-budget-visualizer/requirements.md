# Requirements Document

## Introduction

The Expense & Budget Visualizer is a client-side web application that allows users to track personal expenses by entering transactions with a name, amount, and category. The app displays a running total balance, a scrollable list of all transactions, and a pie chart showing spending distribution by category. All data is persisted in the browser's Local Storage. The app is built with plain HTML, CSS, and vanilla JavaScript — no backend or framework required.

## Glossary

- **App**: The Expense & Budget Visualizer web application.
- **Transaction**: A single expense record consisting of an item name, a monetary amount, and a category.
- **Transaction_List**: The on-screen scrollable list that displays all recorded transactions.
- **Input_Form**: The HTML form used to enter a new transaction.
- **Category**: One of three predefined spending groups — Food, Transport, or Fun.
- **Balance**: The computed total of all transaction amounts currently stored.
- **Chart**: The pie chart that visualises spending distribution across categories.
- **Storage**: The browser's Local Storage API used to persist transaction data between sessions.
- **Validator**: The client-side logic responsible for checking that form inputs meet required constraints before a transaction is saved.
- **Dark/light mode toggle**: the website have mode dark/light.

---

## Requirements

### Requirement 1: Input Form

**User Story:** As a user, I want to fill in an item name, amount, and category and submit the form, so that a new transaction is recorded in the app.

#### Acceptance Criteria

1. THE Input_Form SHALL provide a text field for the item name (maximum 100 characters), a numeric field for the amount, and a dropdown selector containing exactly the options Food, Transport, and Fun.
2. WHEN the user submits the Input_Form with all fields filled and an amount between 0.01 and 999,999,999.99 inclusive, THE App SHALL add the transaction to the Transaction_List and persist it to Storage within 2 seconds.
3. WHEN the user submits the Input_Form, THE Validator SHALL check that the item name field is not empty and does not exceed 100 characters, the amount field contains a numeric value between 0.01 and 999,999,999.99 inclusive, and a category has been selected.
4. IF the Validator detects that any required field is empty, the item name exceeds 100 characters, or the amount is outside the range 0.01 to 999,999,999.99, THEN THE Input_Form SHALL display an inline error message adjacent to each invalid field and SHALL NOT save the transaction.
5. WHEN a transaction is successfully saved, THE Input_Form SHALL reset the item name field to empty, the amount field to empty, and the category dropdown to its first option (Food).
6. IF Storage is unavailable when the user submits the Input_Form, THEN THE App SHALL display an error message indicating the transaction could not be saved and SHALL NOT add the transaction to the Transaction_List.

---

### Requirement 2: Transaction List

**User Story:** As a user, I want to see a scrollable list of all my transactions, so that I can review and manage my spending history.

#### Acceptance Criteria

1. THE Transaction_List SHALL display each transaction as a row showing the item name (truncated with an ellipsis if it exceeds 100 characters on screen), the amount formatted to two decimal places with a currency symbol, and the assigned category.
2. WHEN the number of transactions exceeds the visible area of the Transaction_List container, THE Transaction_List SHALL become vertically scrollable without affecting the layout of elements outside the container.
3. THE Transaction_List SHALL render transactions in reverse insertion order, with the most recently added transaction appearing at the top of the list.
4. WHEN a transaction row is present, THE Transaction_List SHALL display a clearly labelled delete button for that row.
5. WHEN the user activates the delete button on a transaction row, THE App SHALL remove that transaction from the Transaction_List, delete it from Storage, and update the Balance and Chart within 100 milliseconds.
6. WHEN the Transaction_List contains no transactions, THE App SHALL display a visible empty-state message in place of the list indicating that no transactions have been recorded.
7. IF the Storage write operation fails when the user activates the delete button, THEN THE App SHALL display an error message and SHALL NOT remove the transaction from the Transaction_List.

---

### Requirement 3: Total Balance

**User Story:** As a user, I want to see my total balance displayed prominently at the top of the page, so that I know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL display the Balance at the top of the page, formatted to two decimal places with a currency symbol (e.g., $12.50).
2. WHEN a new transaction is successfully saved, THE App SHALL recalculate and update the Balance display within 1 second without requiring a page reload.
3. WHEN a transaction is deleted, THE App SHALL recalculate and update the Balance display within 1 second without requiring a page reload.
4. WHEN the Transaction_List is empty, THE App SHALL display a Balance of $0.00.
5. THE Balance SHALL equal the arithmetic sum of the amount fields of all transactions currently stored in Storage.

---

### Requirement 4: Visual Chart

**User Story:** As a user, I want to see a pie chart of my spending by category, so that I can understand how my money is distributed across categories.

#### Acceptance Criteria

1. THE Chart SHALL render as a pie chart that segments spending by category, where each segment represents the total amount spent in a category and is labelled with the category name and its percentage of total spending rounded to one decimal place.
2. WHEN a new transaction is successfully saved, THE App SHALL update the Chart to reflect the new category totals within 500 milliseconds without requiring a page reload.
3. WHEN a transaction is deleted, THE App SHALL update the Chart to reflect the revised category totals within 500 milliseconds without requiring a page reload.
4. THE Chart SHALL only render segments for categories whose total amount is greater than zero; categories with a total of zero SHALL be excluded from the chart entirely.
5. WHEN the Transaction_List is empty, THE Chart SHALL hide the canvas element and display a visible text placeholder stating that no spending data is available.
6. THE Chart SHALL render using Chart.js loaded via a CDN script tag in the HTML document.
7. IF the Chart.js CDN script fails to load within 5 seconds, THEN THE App SHALL display a visible error message in the chart area stating the chart is unavailable, while the Transaction_List and Balance SHALL continue to function normally.

---

### Requirement 5: Data Persistence

**User Story:** As a user, I want my transactions to be saved between browser sessions, so that I do not lose my data when I close or refresh the page.

#### Acceptance Criteria

1. WHEN the App initialises, THE App SHALL read all previously stored transactions from Storage synchronously before rendering any interactive UI elements, and populate the Transaction_List, Balance, and Chart accordingly.
2. WHEN a transaction is saved, THE App SHALL write the updated transaction dataset to Storage before the save operation is considered complete.
3. WHEN a transaction is deleted, THE App SHALL write the updated transaction dataset to Storage before the delete operation is considered complete.
4. THE Storage SHALL persist transaction data as a JSON-serialised array of transaction objects, where each object contains at minimum the fields: id (string), name (string), amount (number), and category (string).
5. IF Storage returns data that fails JSON parsing or does not conform to the expected array structure and required field types on initialisation, THEN THE App SHALL initialise with an empty transaction dataset and SHALL NOT throw an unhandled error.
6. IF a Storage write operation fails (for example, due to storage quota being exceeded), THEN THE App SHALL display a visible error message to the user and SHALL preserve the current in-memory transaction state without partial writes.

---

### Requirement 6: Performance and Responsiveness

**User Story:** As a user, I want the app to respond immediately to my actions, so that the experience feels fast and fluid.

#### Acceptance Criteria

1. WHEN the user submits the Input_Form, THE App SHALL update the Transaction_List, Balance, and Chart within 100 milliseconds on a device with a dual-core CPU running at 1.8 GHz or faster and at least 4 GB of RAM, using a browser released within the last 3 years.
2. WHEN the user activates a delete button, THE App SHALL update the Transaction_List, Balance, and Chart within 100 milliseconds on a device with a dual-core CPU running at 1.8 GHz or faster and at least 4 GB of RAM, using a browser released within the last 3 years.
3. THE App SHALL load and become interactive within 3 seconds on a connection with a minimum download speed of 10 Mbps, including the time to load the Chart.js library from CDN.
4. IF the Chart.js CDN script has not loaded within 5 seconds of the page load beginning, THEN THE App SHALL display a visible error message in the chart area and SHALL allow the Transaction_List and Balance to function without the Chart.

---

### Requirement 7: Code and Project Structure

**User Story:** As a developer, I want the codebase to follow a clear folder structure, so that the project is easy to navigate and maintain.

#### Acceptance Criteria

1. THE App SHALL contain exactly one CSS file located at `css/style.css`.
2. THE App SHALL contain exactly one JavaScript file located at `js/app.js`.
3. THE App SHALL contain an `index.html` entry point at the project root that references the CSS file via a `<link>` element and the JavaScript file via a `<script>` element.
4. THE App SHALL operate as a standalone web application that can be opened directly in a browser by loading `index.html` without requiring a local server, build step, or bundler.
5. WHEN `index.html` is opened directly in a browser, THE App SHALL apply all styles from `css/style.css` and execute all scripts from `js/app.js` without throwing any unhandled console errors on load.
