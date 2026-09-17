const SHEET_NAME = "Tasks";

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function ok_(data) {
  return json_(Object.assign({ ok: true }, data || {}));
}

function err_(message, extra) {
  return json_(Object.assign({ ok: false, error: String(message) }, extra || {}));
}

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || "health").trim();

    switch (action) {
      case "health":
        return ok_({ message: "Drive Cloner Pro API is online" });

      case "quota":
        return ok_({ quota: DriveApp.getStorageUsed(), limit: DriveApp.getStorageLimit() });

      case "list":
        return ok_({ tasks: listTasks_() });

      case "create_batch":
        return createBatch_(e.parameter.src, e.parameter.dst);

      default:
        return err_("Unknown action: " + action);
    }
  } catch (error) {
    console.error(error);
    return err_(error.message || error);
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = String(body.action || "").trim();

    if (action === "uploadFile") {
      return uploadFile_(body);
    }

    return err_("Unknown POST action: " + action);
  } catch (error) {
    console.error(error);
    return err_(error.message || error);
  }
}

function createBatch_(src, dst) {
  src = extractId_(src);
  dst = extractId_(dst);

  if (!src || !dst) return err_("src và dst là bắt buộc.");

  const source = DriveApp.getFileById(src);
  const targetFolder = DriveApp.getFolderById(dst);
  const taskId = Utilities.getUuid();

  addTask_({
    id: taskId,
    status: "running",
    name: source.getName(),
    message: "Đang clone",
    createdAt: new Date().toISOString()
  });

  try {
    cloneItem_(source, targetFolder);

    updateTask_(taskId, {
      status: "done",
      message: "Clone hoàn tất",
      updatedAt: new Date().toISOString()
    });

    return ok_({ taskId, message: "Clone hoàn tất.", id: taskId });
  } catch (error) {
    updateTask_(taskId, {
      status: "error",
      message: error.message || String(error),
      updatedAt: new Date().toISOString()
    });
    return err_(error.message || error, { taskId });
  }
}

function cloneItem_(file, targetFolder) {
  try {
    file.makeCopy(file.getName(), targetFolder);
  } catch (e) {
    // Apps Script không thể sao chép mọi loại/nguồn bị hạn chế quyền.
    throw new Error("Không thể copy file '" + file.getName() + "': " + e.message);
  }
}

function uploadFile_(body) {
  const base64 = String(body.base64Data || "");
  const filename = String(body.filename || "").trim();
  const mimeType = String(body.mimeType || "application/octet-stream");
  const folderId = extractId_(body.folderId || "");

  if (!base64 || !filename) return err_("Thiếu base64Data hoặc filename.");

  const bytes = Utilities.base64Decode(base64);
  const blob = Utilities.newBlob(bytes, mimeType, filename);

  let file;
  if (folderId) {
    file = DriveApp.getFolderById(folderId).createFile(blob);
  } else {
    file = DriveApp.createFile(blob);
  }

  return ok_({
    message: "Upload thành công.",
    file: {
      id: file.getId(),
      name: file.getName(),
      url: file.getUrl(),
      mimeType: file.getMimeType(),
      size: file.getSize()
    }
  });
}

function listTasks_() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1).reverse().map(row => ({
    id: row[0],
    status: row[1],
    name: row[2],
    message: row[3],
    createdAt: row[4],
    updatedAt: row[5]
  })).slice(0, 100);
}

function addTask_(task) {
  getSheet_().appendRow([
    task.id || "",
    task.status || "",
    task.name || "",
    task.message || "",
    task.createdAt || "",
    task.updatedAt || ""
  ]);
}

function updateTask_(id, patch) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.getRange(i + 1, 2, 1, 5).setValues([[
        patch.status ?? values[i][1],
        patch.name ?? values[i][2],
        patch.message ?? values[i][3],
        patch.createdAt ?? values[i][4],
        patch.updatedAt ?? values[i][5]
      ]]);
      return;
    }
  }
}

function getSheet_() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty("TASK_SPREADSHEET_ID");

  let ss;
  if (spreadsheetId) {
    ss = SpreadsheetApp.openById(spreadsheetId);
  } else {
    ss = SpreadsheetApp.create("Drive Cloner Pro Tasks");
    props.setProperty("TASK_SPREADSHEET_ID", ss.getId());
  }

  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["id","status","name","message","createdAt","updatedAt"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function extractId_(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  const match = s.match(/[-\w]{20,}/);
  return match ? match[0] : s;
}
