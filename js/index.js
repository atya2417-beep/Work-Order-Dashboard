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

  // =================================================
  // IN PROCESS DRUMS
  // =================================================

  ARMOURING: {
    spreadsheetId: "1DiwDhMt5kTQsMUkruE2ibPtBqSIyQI4XgCaOnsqTd-8",
    sheetName: "Armouring",
    workOrderColumn: "C",
  },

  SCREENING: {
    spreadsheetId: "1u8NIxUPoG0OpPglXyiMoTILNfXLkjwXtEbkZpZG30Bk",
    sheetName: "Screening",
    workOrderColumn: "C",
  },

  TAPPING: {
    spreadsheetId: "1O99ubLJd5Msj6MsH6FiQWtbjcebbccNicWyVi7bkq0M",
    sheetName: "Tapping",
    workOrderColumn: "C",
  },

  ASSEMBLY: {
    spreadsheetId: "10LTgnqt7LPiN-4piO8iNB5giwI2pdcTxWTmjhbsyWOw",
    sheetName: "Assembly",
    workOrderColumn: "C",
  },

  INSPECTION: {
    spreadsheetId: "159YezUKfLUK6lepupNBN7yXPnCxUGO99693wFNDVy28",
    sheetName: "Inspection",
    workOrderColumn: "B",
  },
};

// =====================================================
// Elements
// =====================================================

const workOrderInput = document.getElementById("workOrder");

const showInProcessDrums = document.getElementById("showInProcessDrums");

const searchBtn = document.getElementById("searchBtn");

const exportBtn = document.getElementById("exportBtn");

const errorBox = document.getElementById("errorBox");

const loading = document.getElementById("loading");

const resultInfo = document.getElementById("resultInfo");

const summary = document.getElementById("summary");

const finishCount = document.getElementById("finishCount");

const holdCount = document.getElementById("holdCount");

const rewindCount = document.getElementById("rewindCount");

const armouringSummaryCard = document.getElementById("armouringSummaryCard");

const screeningSummaryCard = document.getElementById("screeningSummaryCard");

const tappingSummaryCard = document.getElementById("tappingSummaryCard");

const assemblySummaryCard = document.getElementById("assemblySummaryCard");

const inspectionSummaryCard = document.getElementById("inspectionSummaryCard");

const armouringCount = document.getElementById("armouringCount");

const screeningCount = document.getElementById("screeningCount");

const tappingCount = document.getElementById("tappingCount");

const assemblyCount = document.getElementById("assemblyCount");

const inspectionCount = document.getElementById("inspectionCount");

const totalCount = document.getElementById("totalCount");

const finishTable = document.getElementById("finishTable");

const holdTable = document.getElementById("holdTable");

const rewindTable = document.getElementById("rewindTable");


// =====================================================
// In Process Elements
// =====================================================

const inProcessSections = document.getElementById("inProcessSections");

const armouringTable = document.getElementById("armouringTable");

const screeningTable = document.getElementById("screeningTable");

const tappingTable = document.getElementById("tappingTable");

const assemblyTable = document.getElementById("assemblyTable");

const inspectionTable = document.getElementById("inspectionTable")

// =====================================================
// Search Results
// =====================================================

let searchResults = {
  FINISH: [],
  HOLD: [],
  REWIND: [],

  ARMOURING: [],
  SCREENING: [],
  TAPPING: [],
  ASSEMBLY: [],
  INSPECTION: [],
};

// =====================================================
// Search
// =====================================================

async function searchWO() {
  const workOrder = workOrderInput.value.trim().toLowerCase();

  clearMessages();

  // =================================================
  // Validation
  // =================================================

  if (!workOrder) {
    showError("Please enter a Work Order.");

    return;
  }

  // =================================================
  // Loading
  // =================================================

  setLoading(true);

  searchBtn.disabled = true;

  exportBtn.disabled = true;

  try {
    // =================================================
    // Always search these 3
    // =================================================

    const requests = [
      searchSheet(SHEETS.FINISH, workOrder),

      searchSheet(SHEETS.HOLD, workOrder),

      searchSheet(SHEETS.REWIND, workOrder),
    ];

    // =================================================
    // Search In Process only when checked
    // =================================================

    if (showInProcessDrums.checked) {
      requests.push(searchSheet(SHEETS.ARMOURING, workOrder));

      requests.push(searchSheet(SHEETS.SCREENING, workOrder));

      requests.push(searchSheet(SHEETS.TAPPING, workOrder));

      requests.push(searchSheet(SHEETS.ASSEMBLY, workOrder));

      requests.push(searchSheet(SHEETS.INSPECTION, workOrder));
    }

    // =================================================
    // Execute Requests
    // =================================================

    const results = await Promise.all(requests);

    // =================================================
    // Save Main Results
    // =================================================

    searchResults.FINISH = results[0];

    searchResults.HOLD = results[1];

    searchResults.REWIND = results[2];

    // =================================================
    // Save In Process Results
    // =================================================

    if (showInProcessDrums.checked) {
      searchResults.ARMOURING = results[3];

      searchResults.SCREENING = results[4];

      searchResults.TAPPING = results[5];

      searchResults.ASSEMBLY = results[6];

      searchResults.INSPECTION = results[7];
    } else {
      searchResults.ARMOURING = [];
      searchResults.SCREENING = [];
      searchResults.TAPPING = [];
      searchResults.ASSEMBLY = [];
    }

    // =================================================
    // Render Main Tables
    // =================================================

    renderTable(searchResults.FINISH, finishTable, "FINISH");

    renderTable(searchResults.HOLD, holdTable, "HOLD");

    renderTable(searchResults.REWIND, rewindTable, "REWIND");

    // =================================================
    // Render In Process Tables
    // =================================================

    if (showInProcessDrums.checked) {
      inProcessSections.style.display = "block";

      renderTable(searchResults.ARMOURING, armouringTable, "ARMOURING");

      renderTable(searchResults.SCREENING, screeningTable, "SCREENING");

      renderTable(searchResults.TAPPING, tappingTable, "TAPPING");

      renderTable(searchResults.ASSEMBLY, assemblyTable, "ASSEMBLY");

      renderTable(searchResults.INSPECTION, inspectionTable, "INSPECTION");
    } else {
      inProcessSections.style.display = "none";
    }

    // =================================================
    // Update Summary
    // =================================================

    updateSummary();

    // =================================================
    // Result Info
    // =================================================

    const mainTotal =
      searchResults.FINISH.length +
      searchResults.HOLD.length +
      searchResults.REWIND.length;

    let inProcessTotal = 0;

    if (showInProcessDrums.checked) {
      inProcessTotal =
        searchResults.ARMOURING.length +
        searchResults.SCREENING.length +
        searchResults.TAPPING.length +
        searchResults.ASSEMBLY.length +
        searchResults.INSPECTION.length;
    }

    const totalRows = mainTotal + inProcessTotal;

    resultInfo.innerHTML = `
            Work Order:
            <strong>
                ${escapeHtml(workOrderInput.value.trim())}
            </strong>

            |

            Found:
            <strong>
                ${totalRows}
            </strong>

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

  const columnIndex = columnLetterToIndex(config.workOrderColumn);

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
  // =================================================
  // No Results
  // =================================================

  if (rows.length === 0) {
    container.innerHTML = `
            <div class="empty">
                No ${type} records found
            </div>
        `;

    return;
  }

  // =================================================
  // Headers
  // =================================================

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

  // =================================================
  // Rows
  // =================================================

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
  // =================================================
  // Main
  // =================================================

  const finishTotal = searchResults.FINISH.length;

  const holdTotal = searchResults.HOLD.length;

  const rewindTotal = searchResults.REWIND.length;

  // =================================================
  // Update Main Cards
  // =================================================

  finishCount.textContent = finishTotal;

  holdCount.textContent = holdTotal;

  rewindCount.textContent = rewindTotal;

  // =================================================
  // Default: Hide In Process Cards
  // =================================================

  armouringSummaryCard.style.display = "none";

  screeningSummaryCard.style.display = "none";

  tappingSummaryCard.style.display = "none";

  assemblySummaryCard.style.display = "none";

  inspectionSummaryCard.style.display = "none";

  // =================================================
  // Total
  // =================================================

  let total = finishTotal + holdTotal + rewindTotal;

  // =================================================
  // Show In Process
  // =================================================

  if (showInProcessDrums.checked) {
    const armouringTotal = searchResults.ARMOURING.length;

    const screeningTotal = searchResults.SCREENING.length;

    const tappingTotal = searchResults.TAPPING.length;

    const assemblyTotal = searchResults.ASSEMBLY.length;

    const inspectionTotal = searchResults.INSPECTION.length;


    // ---------------------------------------------
    // Update Counts
    // ---------------------------------------------

    armouringCount.textContent = armouringTotal;

    screeningCount.textContent = screeningTotal;

    tappingCount.textContent = tappingTotal;

    assemblyCount.textContent = assemblyTotal;

    inspectionCount.textContent = inspectionTotal;

    // ---------------------------------------------
    // Show Cards
    // ---------------------------------------------

    armouringSummaryCard.style.display = "block";

    screeningSummaryCard.style.display = "block";

    tappingSummaryCard.style.display = "block";

    assemblySummaryCard.style.display = "block";

    inspectionSummaryCard.style.display = "block";

    // ---------------------------------------------
    // Add To Total
    // ---------------------------------------------

    total += armouringTotal + screeningTotal + tappingTotal + assemblyTotal;
  }

  // =================================================
  // Update Total
  // =================================================

  totalCount.textContent = total;

  // =================================================
  // Show Summary
  // =================================================

  summary.style.display = "grid";
}

// =====================================================
// Export Excel
// =====================================================

function exportExcel() {
  const workbook = XLSX.utils.book_new();

  // =================================================
  // Always Export Main 3
  // =================================================

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

  // =================================================
  // Export In Process when checked
  // =================================================

  if (showInProcessDrums.checked) {
    sheets.push(
      {
        name: "ARMOURING",
        data: searchResults.ARMOURING,
      },

      {
        name: "SCREENING",
        data: searchResults.SCREENING,
      },

      {
        name: "TAPPING",
        data: searchResults.TAPPING,
      },

      {
        name: "ASSEMBLY",
        data: searchResults.ASSEMBLY,
      },

      {
        name: "INSPECTION",
        data: searchResults.INSPECTION,
      },
    );
  }

  // =================================================
  // Create Sheets
  // =================================================

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.data);

    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });

  // =================================================
  // File Name
  // =================================================

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
