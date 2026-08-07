// js/app.js — Expense & Budget Visualizer

// ─── Constants ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'expense_visualizer_transactions';
const THEME_KEY = 'theme';

// ─── State ────────────────────────────────────────────────────────────────────
let transactions = [];
let chartInstance = null;

// ─── Storage ──────────────────────────────────────────────────────────────────

/**
 * Reads and validates transactions from localStorage.
 * Returns [] if storage is empty, unparseable, or contains malformed data.
 * @returns {Array}
 */
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
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

/**
 * Persists the transactions array to localStorage.
 * Calls showError and re-throws on write failure so callers can rollback.
 * @param {Array} transactions
 */
function saveTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    showError('Could not save data. Storage may be full or unavailable.');
    throw e;
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['Food', 'Transport', 'Fun'];
const AMOUNT_MIN = 0.01;
const AMOUNT_MAX = 999999999.99;
const NAME_MAX_LENGTH = 100;

/**
 * Validates the transaction form inputs.
 * @param {string} name
 * @param {string} amount
 * @param {string} category
 * @returns {{ valid: boolean, errors: { name?: string, amount?: string, category?: string } }}
 */
function validateForm(name, amount, category) {
  const errors = {};

  // Validate name: must be 1–100 characters
  if (!name || name.trim().length === 0) {
    errors.name = 'Item name is required.';
  } else if (name.trim().length > NAME_MAX_LENGTH) {
    errors.name = `Item name must not exceed ${NAME_MAX_LENGTH} characters.`;
  }

  // Validate amount: must parse to a float in [0.01, 999999999.99]
  const parsedAmount = parseFloat(amount);
  if (amount === '' || amount === null || amount === undefined || isNaN(parsedAmount)) {
    errors.amount = 'Amount is required and must be a number.';
  } else if (parsedAmount < AMOUNT_MIN || parsedAmount > AMOUNT_MAX) {
    errors.amount = `Amount must be between ${AMOUNT_MIN} and ${AMOUNT_MAX.toLocaleString()}.`;
  }

  // Validate category: must be one of the allowed values
  if (!VALID_CATEGORIES.includes(category)) {
    errors.category = 'Please select a valid category (Food, Transport, or Fun).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ─── Toast state ──────────────────────────────────────────────────────────────

/** @type {number|null} Timer ID for the active error toast dismiss */
let _errorToastTimer = null;

// ─── Stubs (implemented in later tasks) ──────────────────────────────────────

/**
 * Displays a toast error message to the user at #error-toast.
 * Auto-dismisses after 4 seconds. If a toast is already visible,
 * clears the existing timer and restarts with the new message.
 * @param {string} message
 */
function showError(message) {
  const toast = document.getElementById('error-toast');
  if (!toast) return;

  // Clear any existing dismiss timer so toasts don't stack
  if (_errorToastTimer !== null) {
    clearTimeout(_errorToastTimer);
    _errorToastTimer = null;
  }

  toast.textContent = message;
  toast.classList.add('visible');

  _errorToastTimer = setTimeout(() => {
    toast.classList.remove('visible');
    _errorToastTimer = null;
  }, 4000);
}

/**
 * Recalculates and renders the total balance display.
 * Sums all transaction amounts and displays as $N.NN in #balance-display.
 */
function renderBalance() {
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);
  const formatted = '$' + total.toFixed(2);
  const display = document.getElementById('balance-display');
  if (display) {
    display.textContent = formatted;
  }
}

/**
 * Renders the full transaction list into #transaction-list.
 * Shows #empty-state when there are no transactions; hides it otherwise.
 * Transactions are rendered in reverse insertion order (newest first).
 */
function renderTransactionList() {
  const list = document.getElementById('transaction-list');
  const emptyState = document.getElementById('empty-state');
  if (!list || !emptyState) return;

  // Clear existing rows
  list.innerHTML = '';

  if (transactions.length === 0) {
    list.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }

  // Show list, hide empty state
  list.style.display = '';
  emptyState.style.display = 'none';

  // Render in reverse insertion order (newest first)
  for (let i = transactions.length - 1; i >= 0; i--) {
    const t = transactions[i];

    const li = document.createElement('li');

    // Item name — CSS class handles ellipsis truncation
    const nameSpan = document.createElement('span');
    nameSpan.className = 'tx-name';
    nameSpan.textContent = t.name;

    // Amount formatted as $N.NN
    const amountSpan = document.createElement('span');
    amountSpan.className = 'tx-amount';
    amountSpan.textContent = '$' + t.amount.toFixed(2);

    // Category
    const categorySpan = document.createElement('span');
    categorySpan.className = 'tx-category';
    categorySpan.textContent = t.category;

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.dataset.id = t.id;

    li.appendChild(nameSpan);
    li.appendChild(amountSpan);
    li.appendChild(categorySpan);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  }
}

/**
 * Renders or updates the Chart.js pie chart.
 * Computes per-category totals, then either shows the pie chart or
 * shows a placeholder if there is no spending data.
 */
function renderChart() {
  const canvas      = document.getElementById('spending-chart');
  const placeholder = document.getElementById('chart-placeholder');
  if (!canvas || !placeholder) return;

  // If Chart.js didn't load, do nothing — CDN failure handler covers this
  if (typeof Chart === 'undefined') return;

  // Compute per-category totals from the transactions array
  const totals = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});

  // Only include categories with a positive total
  const labels = Object.keys(totals).filter(cat => totals[cat] > 0);
  const data   = labels.map(cat => totals[cat]);

  // No spending data — hide canvas, show placeholder
  if (labels.length === 0) {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    canvas.style.display      = 'none';
    placeholder.textContent   = 'No spending data available.';
    placeholder.style.display = 'block';
    return;
  }

  // Show canvas, hide placeholder
  canvas.style.display      = '';
  placeholder.style.display = 'none';

  // Destroy the previous chart instance before creating a new one
  if (chartInstance) {
    chartInstance.destroy();
  }

  const total = data.reduce((sum, v) => sum + v, 0);

  chartInstance = new Chart(canvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
      }],
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const value      = context.parsed;
              const percentage = ((value / total) * 100).toFixed(1);
              return `${context.label}: ${percentage}%`;
            },
          },
        },
        legend: {
          labels: {
            generateLabels: (chart) => {
              const datasets = chart.data.datasets;
              return chart.data.labels.map((label, i) => {
                const value      = datasets[0].data[i];
                const pct        = ((value / total) * 100).toFixed(1);
                const meta       = chart.getDatasetMeta(0);
                const style      = meta.controller.getStyle(i, false);
                return {
                  text:             `${label}: ${pct}%`,
                  fillStyle:        style.backgroundColor,
                  strokeStyle:      style.borderColor,
                  lineWidth:        style.borderWidth,
                  hidden:           !chart.getDataVisibility(i),
                  index:            i,
                };
              });
            },
          },
        },
      },
    },
  });
}

/**
 * Handles the transaction form submit event.
 * @param {SubmitEvent} event
 */
function handleFormSubmit(event) {
  event.preventDefault();

  // Clear existing inline errors
  const errorName     = document.getElementById('error-name');
  const errorAmount   = document.getElementById('error-amount');
  const errorCategory = document.getElementById('error-category');

  [errorName, errorAmount, errorCategory].forEach(el => {
    if (el) {
      el.textContent = '';
      el.style.display = 'none';
    }
  });

  // Read field values
  const nameField     = document.getElementById('item-name');
  const amountField   = document.getElementById('item-amount');
  const categoryField = document.getElementById('item-category');

  const name     = nameField     ? nameField.value     : '';
  const amount   = amountField   ? amountField.value   : '';
  const category = categoryField ? categoryField.value : '';

  // Validate
  const { valid, errors } = validateForm(name, amount, category);

  if (!valid) {
    if (errors.name && errorName) {
      errorName.textContent = errors.name;
      errorName.style.display = '';
    }
    if (errors.amount && errorAmount) {
      errorAmount.textContent = errors.amount;
      errorAmount.style.display = '';
    }
    if (errors.category && errorCategory) {
      errorCategory.textContent = errors.category;
      errorCategory.style.display = '';
    }
    return;
  }

  // Build new transaction object
  const newTx = {
    id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : Date.now().toString() + Math.random().toString(36).slice(2),
    name:     name.trim(),
    amount:   parseFloat(amount),
    category: category,
  };

  // Attempt to persist — do NOT mutate state if save throws
  try {
    saveTransactions([...transactions, newTx]);
  } catch (e) {
    // showError is already called inside saveTransactions; just bail out
    return;
  }

  // Persist succeeded — update in-memory state and re-render
  transactions.push(newTx);
  renderBalance();
  renderTransactionList();
  renderChart();

  // Reset form fields
  if (nameField)     nameField.value     = '';
  if (amountField)   amountField.value   = '';
  if (categoryField) categoryField.value = 'Food';
}

/**
 * Handles delegated click events on #transaction-list for delete buttons.
 * @param {MouseEvent} event
 */
function handleDeleteClick(event) {
  // Find the clicked element that carries a data-id attribute
  const target = event.target.closest('[data-id]');
  if (!target) return;

  const id = target.dataset.id;

  // Guard: transaction must exist in current state
  const exists = transactions.find(t => t.id === id);
  if (!exists) return;

  // Build the updated array without the deleted transaction
  const updatedArray = transactions.filter(t => t.id !== id);

  // Attempt to persist — do NOT mutate state if save throws
  try {
    saveTransactions(updatedArray);
  } catch (e) {
    // showError is already called inside saveTransactions; just bail out
    return;
  }

  // Persist succeeded — update in-memory state and re-render
  transactions = updatedArray;
  renderBalance();
  renderTransactionList();
  renderChart();
}

/**
 * Handles the theme toggle button click — switches between dark and light mode.
 * Toggles the `.dark` class on <body>, persists the choice to localStorage,
 * and updates the toggle button icon (🌙 = light mode, ☀️ = dark mode).
 */
function handleThemeToggle() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  }
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

/**
 * Initialises the application:
 *  1. Loads persisted transactions from localStorage.
 *  2. Applies the saved theme preference.
 *  3. Attaches all event listeners.
 *  4. Renders the initial UI.
 */
function init() {
  // 1. Load persisted data
  transactions = loadTransactions();

  // 2. Apply saved theme
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.textContent = '☀️';
    }
  }

  // 3. Attach event listeners
  const form = document.getElementById('transaction-form');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  const list = document.getElementById('transaction-list');
  if (list) {
    list.addEventListener('click', handleDeleteClick);
  }

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', handleThemeToggle);
  }

  // 4. Render initial UI
  renderBalance();
  renderTransactionList();
  renderChart();

  // 5. Detect Chart.js CDN failure — check 5 seconds after full page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (typeof Chart === 'undefined') {
        const canvas      = document.getElementById('spending-chart');
        const placeholder = document.getElementById('chart-placeholder');
        if (canvas)      canvas.style.display      = 'none';
        if (placeholder) {
          placeholder.textContent   = 'Chart unavailable — library failed to load.';
          placeholder.style.display = 'block';
        }
      }
    }, 5000);
  });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
