const { google } = require("googleapis");

const GOOGLE_SHEETS_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

function getGoogleSheetsConfig() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  return {
    clientEmail,
    privateKey,
    projectId,
    spreadsheetId,
  };
}

function getMissingGoogleSheetsEnvVars() {
  const config = getGoogleSheetsConfig();
  const requiredEntries = [
    ["GOOGLE_SHEETS_CLIENT_EMAIL", config.clientEmail],
    ["GOOGLE_SHEETS_PRIVATE_KEY", config.privateKey],
    ["GOOGLE_PROJECT_ID", config.projectId],
    ["GOOGLE_SHEET_ID", config.spreadsheetId],
  ];

  return requiredEntries
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

function isGoogleSheetsConfigured() {
  return getMissingGoogleSheetsEnvVars().length === 0;
}

async function createGoogleSheetsClient() {
  const missingEnvVars = getMissingGoogleSheetsEnvVars();

  if (missingEnvVars.length > 0) {
    throw new Error(
      `缺少 Google Sheets 環境變數: ${missingEnvVars.join(", ")}`,
    );
  }

  const { clientEmail, privateKey, projectId } = getGoogleSheetsConfig();
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    projectId,
    scopes: GOOGLE_SHEETS_SCOPES,
  });

  await auth.authorize();

  return google.sheets({
    version: "v4",
    auth,
  });
}

async function readSheetValues(sheetName, range = "A:Z") {
  const { spreadsheetId } = getGoogleSheetsConfig();
  const sheets = await createGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!${range}`,
    majorDimension: "ROWS",
  });

  return response.data.values || [];
}

async function verifyGoogleSheetsConnection(sheetName = "groups") {
  const rows = await readSheetValues(sheetName, "A1:Z5");
  const { spreadsheetId } = getGoogleSheetsConfig();

  return {
    spreadsheetId,
    sheetName,
    previewRowCount: rows.length,
    previewRows: rows,
  };
}

module.exports = {
  getMissingGoogleSheetsEnvVars,
  isGoogleSheetsConfigured,
  readSheetValues,
  verifyGoogleSheetsConnection,
};
