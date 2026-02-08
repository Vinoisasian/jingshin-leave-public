/**
 * Jingshin Public Leave System - Google Apps Script
 * Location: Google Sheet > Extensions > Apps Script
 */

// Configuration
const WORKER_SHEET_NAME = "Workers";
const APP_SHEET_NAME = "Applications";

/**
 * GET Request: ID Lookup
 * Query Params: ?workerId=14070
 */
function doGet(e) {
  try {
    const workerId = e.parameter.workerId;
    if (!workerId) return createResponse({ success: false, error: "Missing ID" });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(WORKER_SHEET_NAME);
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
 * POST Request: Submit Application
 * Body: JSON object
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Anti-troll honeyPot check
    if (data.honeyPot && data.honeyPot.length > 0) {
      return createResponse({ success: true, note: "Bot detected" });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(APP_SHEET_NAME);
    
    // Append the row
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
      data.userAgent,          // K: Device Metadata
      "Pending",              // L: Status
      ""                      // M: Sync Flag (for Local MySQL)
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
