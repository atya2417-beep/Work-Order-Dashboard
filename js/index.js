/*******************************************************
 * WORK ORDER DASHBOARD
 *******************************************************/

const SHEETS = {
  FINISH: {
    spreadsheetId: "1xT1Ev5ooOdCP15u8yVJn38GK25Wz83f1b7x4istByHw",
    sheetName: "FG Report",
    workOrderColumn: "F",
  },

  HOLD: {
    spreadsheetId: "13LUmmztXh3kH2vGhdGGHojs4lMqhOzMDNcwu_9VOrWo",
    sheetName: "HOLD REPORT",
    workOrderColumn: "D",
  },

  REWIND: {
    spreadsheetId: "12EWEfe5jOsp4UNh1lXtsgGvdpQ5WQMUMXEM7z6rqpWI",
    sheetName: "REWIND REPORT",
    workOrderColumn: "E",
  },
};

// =====================================================
// Elements
// =====================================================

const workOrderInput = document.getElementById("workOrder");

const searchBtn = document.getElementById("searchBtn");
const exportBtn = document.getElementById("exportBtn");

const errorBox = document.getElementById("errorBox");
const loading = document.getElementById("loading");
const resultInfo = document.getElementById("resultInfo");

const summary = document.getElementById("summary");

const finishCount = document.getElementById("finishCount");
const holdCount = document.getElementById("holdCount");
const rewindCount = document.getElementById("rewindCount");
const totalCount = document.getElementById("totalCount");

const finishTable = document.getElementById("finishTable");
const holdTable = document.getElementById("holdTable");
const rewindTable = document.getElementById("rewindTable");

// =====================================================
// Store last search result
// =====================================================

let searchResults = {
  FINISH: [],
  HOLD: [],
  REWIND: [],
};

// =====================================================
// Search
// =====================================================

async function searchWO() {
  const workOrder = workOrderInput.value.trim().toLowerCase();

  clearMessages();

  // -----------------------------------------------
  // Validate
  // -----------------------------------------------

  if (!workOrder) {
    showError("Please enter a Work Order.");

    return;
  }

  // -----------------------------------------------
  // Loading
  // -----------------------------------------------

  setLoading(true);

  // -----------------------------------------------
  // Disable buttons
  // -----------------------------------------------

  searchBtn.disabled = true;

  exportBtn.disabled = true;

  try {
    // =================================================
    // Search in the 3 Sheets simultaneously
    // =================================================

    const [finishRows, holdRows, rewindRows] = await Promise.all([
      searchSheet(SHEETS.FINISH, workOrder),
      searchSheet(SHEETS.HOLD, workOrder),
      searchSheet(SHEETS.REWIND, workOrder),
    ]);

    // =================================================
    // Save results
    // =================================================

    searchResults = {
      FINISH: finishRows,
      HOLD: holdRows,
      REWIND: rewindRows,
    };

    // =================================================
    // Render tables
    // =================================================

    renderTable(finishRows, finishTable, "FINISH");

    renderTable(holdRows, holdTable, "HOLD");

    renderTable(rewindRows, rewindTable, "REWIND");

    // =================================================
    // Update summary
    // =================================================

    updateSummary();

    // =================================================
    // Result info
    // =================================================

    const totalRows = finishRows.length + holdRows.length + rewindRows.length;

    resultInfo.innerHTML = `
      Work Order:
      <strong>${escapeHtml(workOrderInput.value.trim())}</strong>
      |
      Found:
      <strong>${totalRows}</strong>
      row(s)
    `;

    // =================================================
    // Export
    // =================================================

    exportBtn.disabled = totalRows === 0;
  } catch (error) {
    console.error(error);

    showError("An error occurred while loading the data.");
  } finally {
    setLoading(false);

    searchBtn.disabled = false;
  }
}

// =====================================================
// Search Sheet
// =====================================================

async function searchSheet(config, workOrder) {
  const url =
    `https://opensheet.elk.sh/` +
    `${config.spreadsheetId}/` +
    `${encodeURIComponent(config.sheetName)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${config.sheetName}`);
  }

  const data = await response.json();

  // -----------------------------------------------
  // Convert Excel column letter to index
  //
  // A = 0
  // B = 1
  // C = 2
  // ...
  // -----------------------------------------------

  const columnIndex = columnLetterToIndex(config.workOrderColumn);

  // -----------------------------------------------
  // Filter rows
  // -----------------------------------------------

  return data.filter((row) => {
    const values = Object.values(row);

    const sheetWorkOrder = values[columnIndex];

    const currentWorkOrder = String(sheetWorkOrder ?? "")
      .trim()
      .toLowerCase();

    return currentWorkOrder === workOrder;
  });
}

// =====================================================
// Column Letter → Index
// =====================================================

function columnLetterToIndex(column) {
  let index = 0;

  for (let i = 0; i < column.length; i++) {
    index = index * 26 + column.charCodeAt(i) - 64;
  }

  return index - 1;
}

// =====================================================
// Render Table
// =====================================================

function renderTable(rows, container, type) {
  // -----------------------------------------------
  // No results
  // -----------------------------------------------

  if (rows.length === 0) {
    container.innerHTML = `
      <div class="empty">
        No ${type} records found
      </div>
    `;

    return;
  }

  // -----------------------------------------------
  // Headers
  // -----------------------------------------------

  const headers = Object.keys(rows[0]);

  let html = `

    <div class="tableWrapper">

      <table>

        <thead>

          <tr>
  `;

  headers.forEach((header) => {
    html += `
      <th>
        ${escapeHtml(header)}
      </th>
    `;
  });

  html += `
          </tr>

        </thead>

        <tbody>
  `;

  // -----------------------------------------------
  // Rows
  // -----------------------------------------------

  rows.forEach((row) => {
    html += `<tr>`;

    headers.forEach((header) => {
      const value = row[header] ?? "";

      html += `
        <td>
          ${escapeHtml(value)}
        </td>
      `;
    });

    html += `</tr>`;
  });

  html += `

        </tbody>

      </table>

    </div>

  `;

  container.innerHTML = html;
}

// =====================================================
// Update Summary
// =====================================================

function updateSummary() {
  const finishTotal = searchResults.FINISH.length;

  const holdTotal = searchResults.HOLD.length;

  const rewindTotal = searchResults.REWIND.length;

  const total = finishTotal + holdTotal + rewindTotal;

  finishCount.textContent = finishTotal;

  holdCount.textContent = holdTotal;

  rewindCount.textContent = rewindTotal;

  totalCount.textContent = total;

  summary.style.display = "grid";
}

// =====================================================
// Export Excel
// =====================================================

function exportExcel() {
  const workbook = XLSX.utils.book_new();

  const sheets = [
    {
      name: "FINISH",
      data: searchResults.FINISH,
    },
    {
      name: "HOLD",
      data: searchResults.HOLD,
    },
    {
      name: "REWIND",
      data: searchResults.REWIND,
    },
  ];

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data);

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  const workOrder = workOrderInput.value.trim().replace(/[\\/:*?"<>|]/g, "_");

  XLSX.writeFile(workbook, `WORK_ORDER_${workOrder}.xlsx`);
}

// =====================================================
// Enter Key
// =====================================================

function handleEnter(event) {
  if (event.key === "Enter") {
    event.preventDefault();

    searchWO();
  }
}

// =====================================================
// Loading
// =====================================================

function setLoading(isLoading) {
  loading.style.display = isLoading ? "block" : "none";
}

// =====================================================
// Error
// =====================================================

function showError(message) {
  errorBox.textContent = message;

  errorBox.style.display = "block";
}

// =====================================================
// Clear Messages
// =====================================================

function clearMessages() {
  errorBox.textContent = "";

  errorBox.style.display = "none";

  resultInfo.innerHTML = "";
}

// =====================================================
// Escape HTML
// =====================================================

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");
}
