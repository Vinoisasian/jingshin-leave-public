/**
 * Jingshin Public Leave System - Google Apps Script
 */

// --- CONFIGURATION ---
const SPREADSHEET_ID = "1Xw1iP-UUO8i2v8rEaOEpDQfc_0kI0n1VttgiWueTvVo";
const WORKER_SHEET_NAME = "Workers";
const APP_SHEET_NAME = "Applications";
const API_SECRET = "jingshin_secure_sync_2026"; // Simple password protection for sync

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
          dept: data[i][2]  // Column C
        });
      }
    }
    
    return createResponse({ success: false, error: "Worker not found" });
  } catch (err) {
    return createResponse({ success: false, error: err.toString() });
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
      if (data.secret !== API_SECRET) {
        return createResponse({ success: false, error: "Unauthorized" });
      }

      const sheet = ss.getSheetByName(WORKER_SHEET_NAME);
      if (!sheet) return createResponse({ success: false, error: "Workers sheet not found" });

      // Clear existing content (except header)
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 3).clearContent();
      }

      // Add new workers if any
      // Expecting data.workers to be [[id, name, dept], [id, name, dept]...]
      if (data.workers && data.workers.length > 0) {
        sheet.getRange(2, 1, data.workers.length, 3).setValues(data.workers);
      }

      return createResponse({ success: true, message: `Synced ${data.workers.length} workers` });
    }

    // --- ACTION 2: SUBMIT LEAVE (From Frontend) ---
    
    // Simple bot protection
    if (data.honeyPot && data.honeyPot.length > 0) {
      return createResponse({ success: true, note: "Bot detected" });
    }

    const sheet = ss.getSheetByName(APP_SHEET_NAME);
    if (!sheet) return createResponse({ success: false, error: "Applications sheet not found" });
    
    sheet.appendRow([
      new Date(),             // A: Timestamp
      data.workerId,          // B: ID
      data.workerName,        // C: Name
      data.leaveType,         // D: Type
      data.startDate,         // E: Start
      data.startTime || "",   // F: Start Time
      data.endDate,           // G: End
      data.endTime || "",     // H: End Time
      data.reason,            // I: Reason
      data.ipAddress,         // J: IP Metadata
      data.userAgent,         // K: Device Metadata
      "Pending",              // L: Status
      ""                      // M: Sync Flag
    ]);

    return createResponse({ success: true });

  } catch (err) {
    return createResponse({ success: false, error: err.toString() });
  }
}

function createResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
