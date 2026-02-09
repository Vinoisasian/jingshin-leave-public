/**
 * Jingshin Public Leave System - Google Apps Script
 */

// --- CONFIGURATION ---
const SPREADSHEET_ID = "1Xw1iP-UUO8i2v8rEaOEpDQfc_0kI0n1VttgiWueTvVo";
const WORKER_SHEET_NAME = "Workers";
const APP_SHEET_NAME = "Applications";
const ATTACHMENT_FOLDER_ID = "1MtFZN42y6SZsDSC_Yrye5A-Fzkt__vAD";
const API_SECRET = "jingshin_secure_sync_2026";

/**
 * Helper: Log errors to a dedicated sheet
 */
function logError(error, context) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let logSheet = ss.getSheetByName("Logs");
    if (!logSheet) {
      logSheet = ss.insertSheet("Logs");
      logSheet.appendRow(["Timestamp", "Context", "Error"]);
    }
    logSheet.appendRow([new Date(), context, error]);
  } catch (e) {}
}

/**
 * Run this function once manually in the editor to authorize Drive access!
 */
function triggerAuthorization() {
  const folder = DriveApp.getFolderById(ATTACHMENT_FOLDER_ID);
  console.log("Drive Access Authorized. Folder Name: " + folder.getName());
}

/**
 * GET Request: ID Lookup
 */
function doGet(e) {
  try {
    const workerId = e.parameter.workerId;
    if (!workerId) return createResponse({ success: false, error: "Missing ID" });

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(WORKER_SHEET_NAME);
    if (!sheet) return createResponse({ success: false, error: "Workers sheet not found" });
    
    const data = sheet.getDataRange().getValues();
    
    // Search for ID in column A (index 0)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === workerId.toString()) {
        return createResponse({
          success: true,
          name: data[i][1], // Column B
          dept: data[i][2], // Column C
          role: data[i][3], // Column D
          balance: data[i][4], // Column E
          gender: data[i][5] // Column F (New: Gender)
        });
      }
    }
    
    return createResponse({ success: false, error: "Worker not found" });
  } catch (err) {
    return createResponse({ success: false, error: err.toString() });
  }
}

/**
 * Helper: Ensure headers exist
 */
function initHeaders(sheet) {
  const headers = ["Timestamp", "ID", "Name", "Type", "Start", "StartTime", "End", "EndTime", "Reason", "IP", "Device", "Status", "Sync", "Translated Reason", "Attachment ID"];
  const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  if (currentHeaders.length < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

/**
 * POST Request: Submit Application OR Sync Workers
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // --- ACTION 1: SYNC WORKERS (From Local Server) ---
    if (data.action === 'sync_workers') {
      if (data.secret !== API_SECRET) return createResponse({ success: false, error: "Unauthorized" });

      const sheet = ss.getSheetByName(WORKER_SHEET_NAME);
      if (!sheet) return createResponse({ success: false, error: "Workers sheet not found" });

      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn() || 6; // Increased to 6
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
      }

      if (data.workers && data.workers.length > 0) {
        const numRows = data.workers.length;
        const numCols = data.workers[0].length;
        sheet.getRange(2, 1, numRows, numCols).setValues(data.workers);
      }

      return createResponse({ success: true, message: `Synced ${data.workers.length} workers` });
    }

    // --- ACTION 3: GET PENDING LEAVES (From Local Server) ---
    if (data.action === 'get_pending_leaves') {
      if (data.secret !== API_SECRET) return createResponse({ success: false, error: "Unauthorized" });

      const sheet = ss.getSheetByName(APP_SHEET_NAME);
      if (!sheet) return createResponse({ success: false, error: "Apps sheet not found" });

      initHeaders(sheet); // Make sure column O exists

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return createResponse({ success: true, data: [] });

      const lastCol = Math.max(sheet.getLastColumn(), 15);
      const range = sheet.getRange(2, 1, lastRow - 1, lastCol);
      const values = range.getValues();
      const pending = [];

      for (let i = 0; i < values.length; i++) {
        // Col M (Index 12) is Synced status. If empty, it's pending.
        if (values[i][12] === "") {
          pending.push({
            rowIndex: i + 2,
            timestamp: values[i][0],
            workerId: values[i][1],
            leaveType: values[i][3],
            startDate: values[i][4],
            startTime: values[i][5],
            endDate: values[i][6],
            endTime: values[i][7],
            reason: values[i][8],
            translatedReason: values[i][13], 
            attachmentId: values[i][14] || ""
          });
        }
      }

      return createResponse({ success: true, data: pending });
    }

    // --- ACTION 4: MARK SYNCED (From Local Server) ---
    if (data.action === 'mark_synced') {
      if (data.secret !== API_SECRET) return createResponse({ success: false, error: "Unauthorized" });

      const sheet = ss.getSheetByName(APP_SHEET_NAME);
      const rowIndices = data.rowIndices;

      if (rowIndices && rowIndices.length > 0) {
        rowIndices.forEach(idx => {
          sheet.getRange(idx, 13).setValue("YES");
        });
      }

      return createResponse({ success: true, count: rowIndices.length });
    }

    // --- ACTION 2: SUBMIT LEAVE (From Frontend) ---
    if (data.honeyPot && data.honeyPot.length > 0) {
      return createResponse({ success: true, note: "Bot detected" });
    }

    const workerSheet = ss.getSheetByName(WORKER_SHEET_NAME);
    if (!workerSheet) return createResponse({ success: false, error: "System Error: Workers sheet missing" });

    // Validate Worker ID exists
    const workerData = workerSheet.getDataRange().getValues();
    let isValidWorker = false;
    for (let i = 1; i < workerData.length; i++) {
      if (workerData[i][0].toString() === data.workerId.toString()) {
        isValidWorker = true;
        break;
      }
    }

    if (!isValidWorker) {
      return createResponse({ success: false, error: "Invalid Worker ID / 工號錯誤" });
    }

    const sheet = ss.getSheetByName(APP_SHEET_NAME);
    if (!sheet) return createResponse({ success: false, error: "Applications sheet not found" });
    
    // Auto-Translate Reason
    let translatedReason = "";
    if (data.reason) {
      try {
        translatedReason = LanguageApp.translate(data.reason, "", "zh-TW");
      } catch (e) {
        translatedReason = "[Translation Failed]";
      }
    }

    // --- HANDLE ATTACHMENT ---
    let fileId = "";
    if (data.attachment && data.attachment.toString().indexOf("base64,") !== -1) {
      try {
        const folder = DriveApp.getFolderById(ATTACHMENT_FOLDER_ID);
        const parts = data.attachment.split(",");
        const mimeType = parts[0].split(":")[1].split(";")[0];
        const bytes = Utilities.base64Decode(parts[1]);
        const blob = Utilities.newBlob(bytes, mimeType, data.attachmentName || "attachment");
        const file = folder.createFile(blob);
        fileId = file.getId();
      } catch (e) {
        logError(e.toString(), "Attachment Creation: " + data.workerId);
      }
    }
    
    sheet.appendRow([
      new Date(),             // A
      data.workerId,          // B
      data.workerName,        // C
      data.leaveType,         // D
      data.startDate,         // E
      data.startTime || "",   // F
      data.endDate,           // G
      data.endTime || "",     // H
      data.reason,            // I
      data.ipAddress,         // J
      data.userAgent,         // K
      "Pending",              // L
      "",                     // M
      translatedReason,       // N
      fileId                  // O
    ]);

    return createResponse({ success: true });

  } catch (err) {
    logError(err.toString(), "Main doPost Error");
    return createResponse({ success: false, error: err.toString() });
  }
}

function createResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
