const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const XLSX = require("xlsx");
const { initDatabase, getAppState, saveAppState } = require("./database");
const { WorkersDAO, GroupsDAO, UsersDAO } = require("./dao");
const {
  getMissingGoogleSheetsEnvVars,
  isGoogleSheetsConfigured,
  readSheetValues,
  writeSheetValues,
  verifyGoogleSheetsConnection,
} = require("./googleSheets");

const app = express();
const PORT = process.env.PORT || 3005;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";
const EVELYN_USERNAMES = ["evelyn", "evelyn.pan"];
const BACKUP_EMAIL_TO =
  process.env.BACKUP_EMAIL_TO || "tina83pan@yahoo.com.tw";

// 中間件
app.use(
  cors({
    origin: [
      "https://prttime-workers-platform.vercel.app",
      "https://prttime-workers-platform-lkh13i3lp-eps-projects-6d54422e.vercel.app",
      "http://localhost:5175",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 資料檔案路徑
const dataDir = path.join(__dirname, "data");
const usersFilePath = path.join(dataDir, "users.json");
const workersFilePath = path.join(dataDir, "workers.json");
const groupsFilePath = path.join(dataDir, "groups.json");
const timeRecordsFilePath = path.join(dataDir, "timeRecords.json");
const salaryAdjustmentsFilePath = path.join(
  dataDir,
  "salaryAdjustments.json",
);

const DEFAULT_GROUPS = [
  { id: "group-1", name: "前台組", description: "負責前台接待工作" },
  { id: "group-2", name: "後台組", description: "負責後台作業" },
  { id: "group-3", name: "清潔組", description: "負責環境清潔維護" },
];
const GROUP_SHEET_NAME = "groups";
const GROUP_SHEET_HEADERS = ["id", "name", "description", "createdAt"];

// 確保資料目錄存在
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 讀取用戶資料
function loadUsers() {
  try {
    if (fs.existsSync(usersFilePath)) {
      const data = fs.readFileSync(usersFilePath, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("讀取用戶資料錯誤:", error);
  }
  return { users: [], lastUserId: 0 };
}

// 保存用戶資料
function saveUsers(userData) {
  try {
    fs.writeFileSync(usersFilePath, JSON.stringify(userData, null, 2));
  } catch (error) {
    console.error("保存用戶資料錯誤:", error);
  }
}

let usersData = loadUsers();

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function readJsonFile(filePath, fallbackValue) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return cloneData(fallbackValue);
  }
}

function normalizeWorkers(workerList = []) {
  return workerList.map((worker) => ({
    ...worker,
    job: worker.job || "",
  }));
}

async function loadPersistedCollection(
  stateKey,
  filePath,
  fallbackValue,
  normalize = (value) => value,
) {
  try {
    const dbState = await getAppState(stateKey);
    if (dbState !== null) {
      return normalize(dbState);
    }

    const fileState = normalize(readJsonFile(filePath, fallbackValue));
    await saveAppState(stateKey, fileState);
    return fileState;
  } catch (error) {
    console.error(`載入 ${stateKey} 持久化資料失敗:`, error);
    throw error;
  }
}

async function persistCollection(stateKey, filePath, data) {
  const snapshot = cloneData(data);
  await saveAppState(stateKey, snapshot);

  try {
    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
  } catch (err) {
    console.warn(`同步 ${stateKey} 到本機備份檔失敗:`, err.message);
  }
}

async function initializeAppData() {
  workers = await loadPersistedCollection(
    "workers",
    workersFilePath,
    [],
    normalizeWorkers,
  );
  groups = await loadPersistedCollection(
    "groups",
    groupsFilePath,
    DEFAULT_GROUPS,
  );
  groups = await loadGroupsFromPrimaryStore(groups);
  timeRecords = await loadPersistedCollection(
    "timeRecords",
    timeRecordsFilePath,
    [],
  );
  salaryAdjustments = await loadPersistedCollection(
    "salaryAdjustments",
    salaryAdjustmentsFilePath,
    [],
  );
}

async function saveWorkers() {
  await persistCollection("workers", workersFilePath, normalizeWorkers(workers));
}

async function saveGroups() {
  if (isGoogleSheetsConfigured()) {
    await syncGroupsToGoogleSheets(groups);
  }

  await persistCollection("groups", groupsFilePath, groups);
}

async function saveTimeRecords() {
  await persistCollection("timeRecords", timeRecordsFilePath, timeRecords);
}

async function saveSalaryAdjustments() {
  await persistCollection(
    "salaryAdjustments",
    salaryAdjustmentsFilePath,
    salaryAdjustments,
  );
}

let workers = [];
let groups = [];
let timeRecords = [];
let salaryAdjustments = [];
let activityLogs = [];
const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

function normalizeGroupRecord(group) {
  return {
    id: String(group.id || uuidv4()),
    name: String(group.name || "").trim(),
    description: String(group.description || "").trim(),
    createdAt: group.createdAt || new Date().toISOString(),
  };
}

function mapSheetRowsToObjects(rows, headers) {
  return rows.map((row) =>
    headers.reduce((record, header, index) => {
      record[header] = row[index] || "";
      return record;
    }, {}),
  );
}

async function loadGroupsFromGoogleSheets() {
  const rows = await readSheetValues(GROUP_SHEET_NAME);

  if (!rows.length) {
    return [];
  }

  const hasHeaderRow = GROUP_SHEET_HEADERS.every(
    (header, index) => (rows[0][index] || "").trim() === header,
  );
  const dataRows = hasHeaderRow ? rows.slice(1) : rows;

  return mapSheetRowsToObjects(dataRows, GROUP_SHEET_HEADERS)
    .map(normalizeGroupRecord)
    .filter((group) => group.name);
}

async function loadGroupsFromPrimaryStore(fallbackGroups) {
  if (!isGoogleSheetsConfigured()) {
    return fallbackGroups;
  }

  try {
    const sheetGroups = await loadGroupsFromGoogleSheets();

    if (sheetGroups.length > 0) {
      console.log(`📄 groups 已從 Google Sheets 載入 ${sheetGroups.length} 筆`);
      return sheetGroups;
    }

    if (fallbackGroups.length > 0) {
      await syncGroupsToGoogleSheets(fallbackGroups);
      console.log(
        `📄 groups 工作表為空，已自動同步既有 ${fallbackGroups.length} 筆資料到 Google Sheets`,
      );
    } else {
      console.log("ℹ️ groups 工作表目前為空，且系統尚無既有資料");
    }

    return fallbackGroups;
  } catch (error) {
    console.warn("⚠️ 載入 Google Sheets groups 失敗，改用既有資料:", error.message);
    return fallbackGroups;
  }
}

async function refreshGroupsFromPrimaryStore() {
  groups = await loadGroupsFromPrimaryStore(groups);
  return groups;
}

async function syncGroupsToGoogleSheets(groupList) {
  const rows = [
    GROUP_SHEET_HEADERS,
    ...groupList.map((group) => {
      const normalizedGroup = normalizeGroupRecord(group);
      return GROUP_SHEET_HEADERS.map((header) => normalizedGroup[header] || "");
    }),
  ];

  await writeSheetValues(GROUP_SHEET_NAME, rows);
}

// 日誌記錄輔助函數
const logActivity = (
  action,
  entityType,
  entityId,
  entityName,
  details = "",
  userId = "system",
) => {
  const log = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    action, // 動作：create, update, delete, time-adjust 等
    entityType, // 實體類型：worker, group, time-record 等
    entityId, // 實體ID
    entityName, // 實體名稱（便於顯示）
    details, // 詳細信息
    userId, // 操作者ID（未來用於權限管理）
    createdAt: new Date().toISOString(),
  };

  activityLogs.push(log);

  // 只保留最近 1000 條記錄，避免記憶體過載
  if (activityLogs.length > 1000) {
    activityLogs = activityLogs.slice(-1000);
  }

  return log;
};

// JWT 中間件 - 可選認證(開發環境下允許無token訪問)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // 如果沒有提供 token,在開發環境下允許通過
  if (!token) {
    if (process.env.NODE_ENV === "production") {
      return res.status(401).json({
        success: false,
        message: "未提供認證令牌",
      });
    }
    // 開發環境:允許無 token 訪問
    req.user = { id: "dev-user", role: "admin" };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "令牌無效",
      });
    }
    req.user = user;
    next();
  });
};

// 權限檢查中間件
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "未登入",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "權限不足",
      });
    }

    next();
  };
};

function isEvelynIdentifier(value = "") {
  return EVELYN_USERNAMES.includes(String(value).trim().toLowerCase());
}

function isEvelynUser(user) {
  return (
    isEvelynIdentifier(user?.username) || isEvelynIdentifier(user?.name)
  );
}

const requireEvelyn = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "未登入",
    });
  }

  if (!isEvelynUser(req.user)) {
    return res.status(403).json({
      success: false,
      message: "權限不足，只有 Evelyn 可以執行此操作",
    });
  }

  next();
};

function normalizeWorkbookValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value) || typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
}

function toWorksheetRows(records, fallbackLabel = "無資料") {
  if (!records.length) {
    return [{ message: fallbackLabel }];
  }

  return records.map((record) =>
    Object.fromEntries(
      Object.entries(record).map(([key, value]) => [
        key,
        normalizeWorkbookValue(value),
      ]),
    ),
  );
}

function appendWorkbookSheet(workbook, name, rows, fallbackLabel) {
  const worksheet = XLSX.utils.json_to_sheet(
    toWorksheetRows(rows, fallbackLabel),
  );
  XLSX.utils.book_append_sheet(workbook, worksheet, name);
}

function createBackupWorkbook(scope, requestedBy) {
  const workbook = XLSX.utils.book_new();

  appendWorkbookSheet(
    workbook,
    "summary",
    [
      {
        scope,
        generatedAt: new Date().toISOString(),
        requestedBy: requestedBy?.username || requestedBy?.name || "unknown",
        backupEmailTo: BACKUP_EMAIL_TO,
        workersCount: workers.length,
        groupsCount: groups.length,
        timeRecordsCount: timeRecords.length,
        salaryAdjustmentsCount: salaryAdjustments.length,
        usersCount: usersData.users.length,
        activityLogsCount: activityLogs.length,
      },
    ],
    "無摘要資料",
  );
  appendWorkbookSheet(workbook, "workers", workers, "無工讀生資料");
  appendWorkbookSheet(workbook, "groups", groups, "無組別資料");
  appendWorkbookSheet(
    workbook,
    "timeRecords",
    timeRecords,
    "無打卡與工時紀錄",
  );
  appendWorkbookSheet(
    workbook,
    "salaryAdjustments",
    salaryAdjustments,
    "無薪資調整紀錄",
  );
  appendWorkbookSheet(workbook, "users", usersData.users, "無使用者資料");
  appendWorkbookSheet(workbook, "activityLogs", activityLogs, "無操作紀錄");

  return {
    filename: `workers-platform-backup-${scope}-${moment().format(
      "YYYYMMDD-HHmmss",
    )}.xlsx`,
    buffer: XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }),
  };
}

function createMailTransporter() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    SMTP_SECURE,
  } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error(
      "尚未設定 SMTP 郵件環境變數，請先設定 SMTP_HOST、SMTP_PORT、SMTP_USER、SMTP_PASS、SMTP_FROM",
    );
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true" || Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function sendBackupEmail({ scope, requestedBy, backupFile }) {
  const transporter = createMailTransporter();
  const requestedByName =
    requestedBy?.name || requestedBy?.username || "未知使用者";

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: BACKUP_EMAIL_TO,
    subject: `工讀生系統資料備份 - ${scope} - ${moment().format(
      "YYYY-MM-DD HH:mm:ss",
    )}`,
    text: [
      "這封信是系統在清除資料前自動寄出的 Excel 備份。",
      `備份範圍：${scope}`,
      `操作人員：${requestedByName}`,
      `寄送時間：${new Date().toISOString()}`,
      "",
      "附件包含工讀生、組別、打卡紀錄、薪資調整、使用者與操作紀錄。",
    ].join("\n"),
    attachments: [
      {
        filename: backupFile.filename,
        content: backupFile.buffer,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });
}

// === 健康檢查和根路徑 ===
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "工讀生管理系統 API 運行中",
    version: "1.0.0",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// === 認證相關 API ===

// 登入
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "請輸入帳號和密碼",
      });
    }

    const user = usersData.users.find((u) => u.username === username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "帳號或密碼錯誤",
      });
    }

    // 檢查密碼（目前直接比對，實際應用中應使用bcrypt）
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: "帳號或密碼錯誤",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "帳號已被停用",
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
      },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    // 記錄登入活動
    logActivity(
      "login",
      "user",
      user.id,
      user.username,
      `${user.role} 用戶登入`,
      user.id,
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
        },
      },
      message: "登入成功",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "登入失敗",
      error: error.message,
    });
  }
});

// 訪客模式登入（reader權限）
app.post("/api/auth/guest-login", (req, res) => {
  try {
    const guestUser = {
      id: "guest",
      username: "guest",
      role: "reader",
      permissions: {
        canManageUsers: false,
        canEditWorkers: false,
        canImportData: false,
        canClockIn: false,
        canEditTime: false,
        canViewReports: true,
        canDeleteData: false,
      },
    };

    const token = jwt.sign(guestUser, JWT_SECRET, { expiresIn: "24h" });

    logActivity("guest-login", "user", "guest", "guest", "訪客模式登入");

    res.json({
      success: true,
      data: {
        token,
        user: guestUser,
      },
      message: "訪客登入成功",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "訪客登入失敗",
      error: error.message,
    });
  }
});

// 驗證token
app.get("/api/auth/verify", authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
    message: "Token 有效",
  });
});

// 登出（客戶端處理，清除token）
app.post("/api/auth/logout", authenticateToken, (req, res) => {
  logActivity(
    "logout",
    "user",
    req.user.id,
    req.user.username,
    `${req.user.role} 用戶登出`,
    req.user.id,
  );

  res.json({
    success: true,
    message: "登出成功",
  });
});

// 獲取用戶列表（僅admin）
app.get(
  "/api/auth/users",
  authenticateToken,
  requireRole(["admin"]),
  asyncHandler(async (req, res) => {
    const users = usersData.users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));

  res.json({
    success: true,
    data: users,
    message: "用戶列表獲取成功",
  });
  }),
);

// 新增leader用戶（僅admin）
app.post(
  "/api/auth/create-leader",
  authenticateToken,
  requireRole(["admin"]),
  asyncHandler(async (req, res) => {
    try {
      const { username, password, name, email } = req.body;

      if (!username || !password || !name) {
        return res.status(400).json({
          success: false,
          message: "請填寫完整資訊",
        });
      }

      // 檢查用戶名是否已存在
      if (usersData.users.find((u) => u.username === username)) {
        return res.status(400).json({
          success: false,
          message: "用戶名已存在",
        });
      }

      usersData.lastUserId++;
      const newUser = {
        id: `leader${String(usersData.lastUserId).padStart(3, "0")}`,
        username,
        password, // 實際應用中應加密
        role: "leader",
        name,
        email: email || "",
        createdAt: new Date().toISOString(),
        isActive: true,
        permissions: {
          canManageUsers: false,
          canEditWorkers: true,
          canImportData: true,
          canClockIn: true,
          canEditTime: true,
          canViewReports: true,
          canDeleteData: false,
        },
      };

      usersData.users.push(newUser);
      saveUsers(usersData);

      logActivity(
        "create",
        "user",
        newUser.id,
        newUser.username,
        `建立 leader 帳號: ${newUser.name}`,
        req.user.id,
      );

      res.json({
        success: true,
        data: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          email: newUser.email,
          isActive: newUser.isActive,
          createdAt: newUser.createdAt,
        },
        message: "Leader 帳號建立成功",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "建立帳號失敗",
        error: error.message,
      });
    }
  }),
);

// 新增admin用戶（僅evelyn用戶可用）
app.post("/api/auth/create-admin", authenticateToken, (req, res) => {
  try {
    // 只有特定用戶可以創建管理員
    if (!isEvelynUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: "權限不足，只有Evelyn可以創建管理員帳號",
      });
    }

    const { username, password, name, email } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "請填寫完整資訊",
      });
    }

    // 檢查用戶名是否已存在
    if (usersData.users.find((u) => u.username === username)) {
      return res.status(400).json({
        success: false,
        message: "用戶名已存在",
      });
    }

    usersData.lastUserId++;
    const newUser = {
      id: `user-${usersData.lastUserId}`,
      username,
      password, // 實際專案中應該使用bcrypt加密
      name,
      email: email || "",
      role: "admin",
      permissions: {
        canManageUsers: true,
        canEditWorkers: true,
        canImportData: true,
        canClockIn: true,
        canEditTime: true,
        canViewReports: true,
        canDeleteData: true,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    usersData.users.push(newUser);
    saveUsers(usersData);

    logActivity(
      "create",
      "user",
      newUser.id,
      newUser.username,
      `創建管理員帳號: ${newUser.name}`,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role,
        email: newUser.email,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      },
      message: "管理員帳號建立成功",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "建立管理員帳號失敗",
      error: error.message,
    });
  }
});

// 刪除用戶（僅admin，不可刪除自己）
app.delete(
  "/api/auth/users/:id",
  authenticateToken,
  requireRole(["admin"]),
  asyncHandler(async (req, res) => {
    try {
      const userId = req.params.id;

      if (userId === req.user.id) {
        return res.status(400).json({
          success: false,
          message: "不能刪除自己的帳號",
        });
      }

      const userIndex = usersData.users.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "用戶不存在",
        });
      }

      const deletedUser = usersData.users[userIndex];
      usersData.users.splice(userIndex, 1);
      saveUsers(usersData);

      logActivity(
        "delete",
        "user",
        deletedUser.id,
        deletedUser.username,
        `刪除用戶帳號: ${deletedUser.name}`,
        req.user.id,
      );

      res.json({
        success: true,
        message: "用戶刪除成功",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "刪除用戶失敗",
        error: error.message,
      });
    }
  }),
);

app.post(
  "/api/admin/cleanup/salary-records",
  authenticateToken,
  requireEvelyn,
  asyncHandler(async (req, res) => {
    const backupFile = createBackupWorkbook("salary-records", req.user);
    await sendBackupEmail({
      scope: "清空薪資紀錄前備份",
      requestedBy: req.user,
      backupFile,
    });

    const clearedSalaryAdjustments = salaryAdjustments.length;
    salaryAdjustments = [];
    await saveSalaryAdjustments();

    logActivity(
      "cleanup",
      "salary-records",
      "all",
      "薪資調整紀錄",
      `清空全部薪資調整紀錄，共 ${clearedSalaryAdjustments} 筆；已先寄送 Excel 備份到 ${BACKUP_EMAIL_TO}`,
      req.user.id,
    );

    res.json({
      success: true,
      data: {
        clearedSalaryAdjustments,
        backupSentTo: BACKUP_EMAIL_TO,
      },
      message: `已寄出備份郵件，並清空 ${clearedSalaryAdjustments} 筆薪資調整紀錄`,
    });
  }),
);

app.post(
  "/api/admin/cleanup/all-data",
  authenticateToken,
  requireEvelyn,
  asyncHandler(async (req, res) => {
    const backupFile = createBackupWorkbook("all-data", req.user);
    await sendBackupEmail({
      scope: "清空所有工讀生資料前備份",
      requestedBy: req.user,
      backupFile,
    });

    const clearedCounts = {
      workers: workers.length,
      timeRecords: timeRecords.length,
      salaryAdjustments: salaryAdjustments.length,
    };

    workers = [];
    timeRecords = [];
    salaryAdjustments = [];

    await Promise.all([saveWorkers(), saveTimeRecords(), saveSalaryAdjustments()]);

    logActivity(
      "cleanup",
      "all-worker-data",
      "all",
      "所有工讀生資料",
      `清空工讀生 ${clearedCounts.workers} 筆、打卡紀錄 ${clearedCounts.timeRecords} 筆、薪資調整 ${clearedCounts.salaryAdjustments} 筆；已先寄送 Excel 備份到 ${BACKUP_EMAIL_TO}`,
      req.user.id,
    );

    res.json({
      success: true,
      data: {
        ...clearedCounts,
        backupSentTo: BACKUP_EMAIL_TO,
      },
      message:
        "已寄出備份郵件，並清空所有工讀生、打卡紀錄與薪資調整資料",
    });
  }),
);

// API 路由

// === 工讀生管理 ===
const buildDailyAttendance = (
  records,
  targetDate = moment().format("YYYY-MM-DD"),
) => {
  if (!records.length) {
    return null;
  }

  const sessions = [...records]
    .sort((a, b) => {
      const aTime = a.clockIn || a.clockOut || a.createdAt || a.date;
      const bTime = b.clockIn || b.clockOut || b.createdAt || b.date;
      return new Date(aTime) - new Date(bTime);
    })
    .map((record) => ({
      id: record.id,
      date: moment(record.date).format("YYYY-MM-DD"),
      clockIn: record.clockIn || null,
      clockOut: record.clockOut || null,
      totalHours: record.totalHours || 0,
      additionalHours: record.additionalHours || 0,
      note: record.note || "",
    }));

  const firstClockInSession = sessions.find((session) => session.clockIn);
  const lastClockOutSession = [...sessions]
    .reverse()
    .find((session) => session.clockOut);
  const openSession = [...sessions]
    .reverse()
    .find((session) => session.clockIn && !session.clockOut);

  return {
    date: targetDate,
    clockIn: firstClockInSession?.clockIn || null,
    clockOut: openSession ? null : lastClockOutSession?.clockOut || null,
    sessions,
    sessionCount: sessions.filter((session) => session.clockIn).length,
    totalHours: parseFloat(
      sessions
        .reduce((sum, session) => sum + (session.totalHours || 0), 0)
        .toFixed(2),
    ),
    totalAdditionalHours: parseFloat(
      sessions
        .reduce((sum, session) => sum + (session.additionalHours || 0), 0)
        .toFixed(2),
    ),
    hasOpenSession: !!openSession,
    openSessionId: openSession?.id || null,
  };
};

const getWorkersWithTodayAttendance = (
  targetDate = moment().format("YYYY-MM-DD"),
) => {
  const attendanceByWorkerId = new Map();

  timeRecords.forEach((record) => {
    if (moment(record.date).format("YYYY-MM-DD") !== targetDate) {
      return;
    }

    const existingRecords = attendanceByWorkerId.get(record.workerId) || [];
    existingRecords.push(record);
    attendanceByWorkerId.set(record.workerId, existingRecords);
  });

  return workers.map((worker) => ({
    ...worker,
    todayAttendance:
      buildDailyAttendance(attendanceByWorkerId.get(worker.id) || [], targetDate) ||
      null,
  }));
};

// 獲取所有工讀生
app.get("/api/workers", (req, res) => {
  const includeTodayAttendance = req.query.includeTodayAttendance === "true";
  const targetDate = req.query.date
    ? moment(req.query.date).format("YYYY-MM-DD")
    : moment().format("YYYY-MM-DD");

  res.json({
    success: true,
    data: includeTodayAttendance
      ? getWorkersWithTodayAttendance(targetDate)
      : workers,
    message: "工讀生列表獲取成功",
  });
});

// 獲取單個工讀生
app.get("/api/workers/:id", (req, res) => {
  const worker = workers.find((w) => w.id === req.params.id);
  if (!worker) {
    return res.status(404).json({
      success: false,
      message: "工讀生不存在",
    });
  }
  res.json({
    success: true,
    data: worker,
    message: "工讀生資料獲取成功",
  });
});

// 新增工讀生
app.post(
  "/api/workers",
  asyncHandler(async (req, res) => {
  const {
    number,
    name,
    gender,
    level,
    groupId,
    floor,
    job, // 新增工作欄位
    baseHourlyWage,
    baseWorkingHours,
  } = req.body;

  // 驗證必要欄位（只檢查編號和姓名非空，其餘允許）
  if (!number || !name) {
    return res.status(400).json({
      success: false,
      message: "請填寫編號與姓名",
    });
  }

  // 檢查編號是否已存在
  if (workers.find((w) => w.number === number)) {
    return res.status(400).json({
      success: false,
      message: "工讀生編號已存在",
    });
  }

  // 驗證等級範圍
  if (level < 1 || level > 10) {
    return res.status(400).json({
      success: false,
      message: "等級必須在1-10之間",
    });
  }

  // 驗證基本時薪（如果提供）
  if (
    baseHourlyWage !== undefined &&
    (isNaN(baseHourlyWage) || baseHourlyWage < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "基本時薪必須是正數",
    });
  }

  // 驗證基本工時（如果提供）
  if (
    baseWorkingHours !== undefined &&
    (isNaN(baseWorkingHours) || baseWorkingHours < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "基本工時必須是正數",
    });
  }

  const newWorker = {
    id: uuidv4(),
    number,
    name,
    gender,
    level: parseInt(level),
    groupId: groupId || null,
    floor: floor || "",
    job: job || "", // 新增工作欄位，如果沒有提供則為空字串
    baseHourlyWage:
      baseHourlyWage !== undefined ? parseFloat(baseHourlyWage) : 0,
    baseWorkingHours:
      baseWorkingHours !== undefined ? parseFloat(baseWorkingHours) : 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  workers.push(newWorker);
    await saveWorkers();

  // 記錄活動日誌
  logActivity(
    "create",
    "worker",
    newWorker.id,
    newWorker.name,
    `新增工讀生：編號 ${newWorker.number}，樓層 ${newWorker.floor || "未設定"}`,
  );

    res.status(201).json({
      success: true,
      data: newWorker,
      message: "工讀生新增成功",
    });
  }),
);

// 更新工讀生
app.put(
  "/api/workers/:id",
  asyncHandler(async (req, res) => {
  const {
    number,
    name,
    gender,
    level,
    groupId,
    floor,
    job, // 新增工作欄位
    baseHourlyWage,
    baseWorkingHours,
  } = req.body;
  const workerIndex = workers.findIndex((w) => w.id === req.params.id);

  if (workerIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "工讀生不存在",
    });
  }

  // 檢查編號是否與其他工讀生重複
  const existingWorker = workers.find(
    (w) => w.number === number && w.id !== req.params.id,
  );
  if (existingWorker) {
    return res.status(400).json({
      success: false,
      message: "工讀生編號已存在",
    });
  }

  // 驗證基本時薪（如果提供）
  if (
    baseHourlyWage !== undefined &&
    (isNaN(baseHourlyWage) || baseHourlyWage < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "基本時薪必須是正數",
    });
  }

  // 驗證基本工時（如果提供）
  if (
    baseWorkingHours !== undefined &&
    (isNaN(baseWorkingHours) || baseWorkingHours < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "基本工時必須是正數",
    });
  }

  workers[workerIndex] = {
    ...workers[workerIndex],
    number: number || workers[workerIndex].number,
    name: name || workers[workerIndex].name,
    gender: gender || workers[workerIndex].gender,
    level: level ? parseInt(level) : workers[workerIndex].level,
    groupId: groupId !== undefined ? groupId : workers[workerIndex].groupId,
    floor: floor !== undefined ? floor : workers[workerIndex].floor || "",
    job: job !== undefined ? job : workers[workerIndex].job || "", // 新增工作欄位更新
    baseHourlyWage:
      baseHourlyWage !== undefined
        ? parseFloat(baseHourlyWage)
        : workers[workerIndex].baseHourlyWage || 0,
    baseWorkingHours:
      baseWorkingHours !== undefined
        ? parseFloat(baseWorkingHours)
        : workers[workerIndex].baseWorkingHours || 0,
    updatedAt: new Date().toISOString(),
  };

    await saveWorkers();

  // 記錄活動日誌
  logActivity(
    "update",
    "worker",
    workers[workerIndex].id,
    workers[workerIndex].name,
    `更新工讀生資料：編號 ${workers[workerIndex].number}`,
  );

    res.json({
      success: true,
      data: workers[workerIndex],
      message: "工讀生資料更新成功",
    });
  }),
);

// 刪除工讀生
app.delete(
  "/api/workers/:id",
  asyncHandler(async (req, res) => {
  const workerIndex = workers.findIndex((w) => w.id === req.params.id);

  if (workerIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "工讀生不存在",
    });
  }

  const deletedWorker = workers[workerIndex];
  workers.splice(workerIndex, 1);
    await saveWorkers();

  // 記錄活動日誌
  logActivity(
    "delete",
    "worker",
    deletedWorker.id,
    deletedWorker.name,
    `刪除工讀生：編號 ${deletedWorker.number}`,
  );

    res.json({
      success: true,
      message: "工讀生刪除成功",
    });
  }),
);

// 調整個別工讀生的累積工時
app.post("/api/workers/:id/additional-hours", authenticateToken, asyncHandler(async (req, res) => {
  const workerId = req.params.id;
  const { type, hours, reason } = req.body;

  // 檢查工讀生是否存在
  const worker = workers.find((w) => w.id === workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      message: "工讀生不存在",
    });
  }

  // 驗證輸入
  if (!type || !["add", "subtract"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "調整類型必須是 add 或 subtract",
    });
  }

  if (!hours || isNaN(hours) || hours <= 0) {
    return res.status(400).json({
      success: false,
      message: "調整時數必須是正數",
    });
  }

  if (!reason || reason.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "調整原因不能為空",
    });
  }

  const adjustHours = type === "add" ? parseFloat(hours) : -parseFloat(hours);
  const today = new Date().toISOString().split("T")[0];

  // 查找今日記錄
  let record = timeRecords.find(
    (r) => r.workerId === workerId && r.date.startsWith(today),
  );

  const operatorId = req.user?.userId || "system";
  const operatorName = req.user?.username || "系統";

  // 創建調整記錄
  const adjustmentRecord = {
    id: uuidv4(),
    hours: adjustHours,
    reason: reason,
    operatorId: operatorId,
    operatorName: operatorName,
    createdAt: new Date().toISOString(),
  };

  if (!record) {
    // 如果沒有今日記錄，創建一個新的記錄
    record = {
      id: uuidv4(),
      workerId,
      date: new Date().toISOString(),
      clockIn: null,
      clockOut: null,
      totalHours: 0,
      additionalHours: adjustHours,
      adjustments: [adjustmentRecord],
      adjustedBy: operatorName,
      adjustedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    timeRecords.push(record);
  } else {
    // 更新現有記錄
    const recordIndex = timeRecords.findIndex((r) => r.id === record.id);
    timeRecords[recordIndex].additionalHours += adjustHours;

    // 添加調整記錄
    if (!timeRecords[recordIndex].adjustments) {
      timeRecords[recordIndex].adjustments = [];
    }
    timeRecords[recordIndex].adjustments.push(adjustmentRecord);
    timeRecords[recordIndex].adjustedBy = operatorName;
    timeRecords[recordIndex].adjustedAt = new Date().toISOString();
  }

  await saveTimeRecords();

  // 記錄活動日誌
  const actionText = type === "add" ? "增加" : "減少";
  logActivity(
    "hours-adjust",
    "worker",
    workerId,
    worker.name,
    `${actionText}累積工時 ${Math.abs(adjustHours)} 小時，原因：${reason}`,
  );

  res.json({
    success: true,
    data: {
      workerId,
      adjustmentHours: adjustHours,
      newTotalAdditionalHours: record.additionalHours,
    },
    message: `成功${actionText} ${Math.abs(adjustHours)} 小時`,
  });
}));

// 批次更新工讀生薪資時數
app.put("/api/workers/batch-update-wage", asyncHandler(async (req, res) => {
  const { workerIds, baseHourlyWage, baseWorkingHours } = req.body;

  // 驗證必要參數
  if (!workerIds || !Array.isArray(workerIds) || workerIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: "請選擇要更新的工讀生",
    });
  }

  // 驗證基本時薪（如果提供）
  if (
    baseHourlyWage !== undefined &&
    (isNaN(baseHourlyWage) || baseHourlyWage < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "基本時薪必須是正數",
    });
  }

  // 驗證基本工時（如果提供）
  if (
    baseWorkingHours !== undefined &&
    (isNaN(baseWorkingHours) || baseWorkingHours < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "基本工時必須是正數",
    });
  }

  const updatedWorkers = [];
  const notFoundWorkers = [];

  workerIds.forEach((workerId) => {
    const workerIndex = workers.findIndex((w) => w.id === workerId);
    if (workerIndex !== -1) {
      // 只更新有提供的欄位
      if (baseHourlyWage !== undefined) {
        workers[workerIndex].baseHourlyWage = parseFloat(baseHourlyWage);
      }
      if (baseWorkingHours !== undefined) {
        workers[workerIndex].baseWorkingHours = parseFloat(baseWorkingHours);
      }
      workers[workerIndex].updatedAt = new Date().toISOString();
      updatedWorkers.push(workers[workerIndex]);
    } else {
      notFoundWorkers.push(workerId);
    }
  });

  await saveWorkers();

  let message = `成功更新 ${updatedWorkers.length} 名工讀生的薪資時數`;
  if (notFoundWorkers.length > 0) {
    message += `，${notFoundWorkers.length} 名工讀生不存在`;
  }

  res.json({
    success: true,
    data: {
      updated: updatedWorkers,
      notFound: notFoundWorkers,
      updatedCount: updatedWorkers.length,
    },
    message,
  });
}));

// === 組別管理 ===
// 獲取所有組別
app.get("/api/groups", asyncHandler(async (req, res) => {
  await refreshGroupsFromPrimaryStore();

  res.json({
    success: true,
    data: groups,
    message: "組別列表獲取成功",
  });
}));

// 新增組別
app.post("/api/groups", asyncHandler(async (req, res) => {
  await refreshGroupsFromPrimaryStore();
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "組別名稱不能為空",
    });
  }

  // 檢查組別名稱是否已存在
  if (groups.find((g) => g.name === name)) {
    return res.status(400).json({
      success: false,
      message: "組別名稱已存在",
    });
  }

  const previousGroups = cloneData(groups);
  const newGroup = {
    id: uuidv4(),
    name,
    description: description || "",
    createdAt: new Date().toISOString(),
  };

  try {
    groups.push(newGroup);
    await saveGroups();
  } catch (error) {
    groups = previousGroups;
    throw error;
  }

  res.status(201).json({
    success: true,
    data: newGroup,
    message: "組別新增成功",
  });
}));

// 更新組別
app.put("/api/groups/:id", asyncHandler(async (req, res) => {
  await refreshGroupsFromPrimaryStore();
  const { name, description } = req.body;
  const groupIndex = groups.findIndex((g) => g.id === req.params.id);

  if (groupIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "組別不存在",
    });
  }

  // 檢查組別名稱是否與其他組別重複
  const existingGroup = groups.find(
    (g) => g.name === name && g.id !== req.params.id,
  );
  if (existingGroup) {
    return res.status(400).json({
      success: false,
      message: "組別名稱已存在",
    });
  }

  const previousGroups = cloneData(groups);

  try {
    groups[groupIndex] = {
      ...groups[groupIndex],
      name: name || groups[groupIndex].name,
      description:
        description !== undefined ? description : groups[groupIndex].description,
    };

    await saveGroups();
  } catch (error) {
    groups = previousGroups;
    throw error;
  }

  res.json({
    success: true,
    data: groups[groupIndex],
    message: "組別更新成功",
  });
}));

// 刪除組別
app.delete("/api/groups/:id", asyncHandler(async (req, res) => {
  await refreshGroupsFromPrimaryStore();
  const groupIndex = groups.findIndex((g) => g.id === req.params.id);

  if (groupIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "組別不存在",
    });
  }

  // 檢查是否有工讀生屬於此組別
  const workersInGroup = workers.filter((w) => w.groupId === req.params.id);
  if (workersInGroup.length > 0) {
    return res.status(400).json({
      success: false,
      message: `無法刪除組別，目前有 ${workersInGroup.length} 名工讀生屬於此組別`,
    });
  }

  const previousGroups = cloneData(groups);

  try {
    groups.splice(groupIndex, 1);
    await saveGroups();
  } catch (error) {
    groups = previousGroups;
    throw error;
  }

  res.json({
    success: true,
    message: "組別刪除成功",
  });
}));

// === 工時記錄 ===
// 獲取工時記錄
app.get("/api/time-records", (req, res) => {
  const { workerId, date } = req.query;
  let filteredRecords = timeRecords;

  if (workerId) {
    filteredRecords = filteredRecords.filter((r) => r.workerId === workerId);
  }

  if (date) {
    const targetDate = moment(date).format("YYYY-MM-DD");
    filteredRecords = filteredRecords.filter(
      (r) => moment(r.date).format("YYYY-MM-DD") === targetDate,
    );
  }

  res.json({
    success: true,
    data: filteredRecords,
    message: "工時記錄獲取成功",
  });
});

// 上班打卡
app.post("/api/time-records/clock-in", asyncHandler(async (req, res) => {
  const { workerId } = req.body;

  if (!workerId) {
    return res.status(400).json({
      success: false,
      message: "工讀生ID不能為空",
    });
  }

  // 檢查工讀生是否存在
  const worker = workers.find((w) => w.id === workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      message: "工讀生不存在",
    });
  }

  const today = moment().format("YYYY-MM-DD");

  // 檢查今天是否仍有未完成的上班打卡
  const openRecord = timeRecords.find(
    (r) =>
      r.workerId === workerId &&
      moment(r.date).format("YYYY-MM-DD") === today &&
      r.clockIn &&
      !r.clockOut,
  );

  if (openRecord) {
    return res.status(400).json({
      success: false,
      message: "今日已經上班打卡，請先下班打卡",
    });
  }

  const newRecord = {
    id: uuidv4(),
    workerId,
    date: new Date().toISOString(),
    clockIn: new Date().toISOString(),
    clockOut: null,
    totalHours: 0,
    additionalHours: 0,
    additionalReason: "",
    createdAt: new Date().toISOString(),
  };

  timeRecords.push(newRecord);
  await saveTimeRecords(); // 持久化數據

  // 記錄活動日誌
  const clockInWorker = workers.find((w) => w.id === workerId);
  logActivity(
    "clock-in",
    "time-record",
    newRecord.id,
    clockInWorker ? clockInWorker.name : "未知工讀生",
    "上班打卡",
  );

  res.status(201).json({
    success: true,
    data: newRecord,
    message: "上班打卡成功",
  });
}));

// 下班打卡
app.post("/api/time-records/clock-out", asyncHandler(async (req, res) => {
  const { workerId } = req.body;

  if (!workerId) {
    return res.status(400).json({
      success: false,
      message: "工讀生ID不能為空",
    });
  }

  const today = moment().format("YYYY-MM-DD");

  // 找到今天的上班記錄
  let recordIndex = -1;
  for (let i = timeRecords.length - 1; i >= 0; i -= 1) {
    const record = timeRecords[i];
    if (
      record.workerId === workerId &&
      moment(record.date).format("YYYY-MM-DD") === today &&
      record.clockIn &&
      !record.clockOut
    ) {
      recordIndex = i;
      break;
    }
  }

  if (recordIndex === -1) {
    return res.status(400).json({
      success: false,
      message: "找不到今日上班記錄或已經下班打卡",
    });
  }

  const clockOutTime = new Date();
  const clockInTime = new Date(timeRecords[recordIndex].clockIn);
  const totalHours = (clockOutTime - clockInTime) / (1000 * 60 * 60); // 轉換為小時

  timeRecords[recordIndex].clockOut = clockOutTime.toISOString();
  timeRecords[recordIndex].totalHours = parseFloat(totalHours.toFixed(2));

  await saveTimeRecords(); // 持久化數據

  res.json({
    success: true,
    data: timeRecords[recordIndex],
    message: "下班打卡成功",
  });
}));

// 獲取所有工讀生的額外工時
app.get("/api/time-records/additional-hours", authenticateToken, (req, res) => {
  try {
    // 計算每個工讀生的總額外工時
    const additionalHoursMap = {};

    timeRecords.forEach((record) => {
      if (record.additionalHours && record.additionalHours !== 0) {
        if (!additionalHoursMap[record.workerId]) {
          additionalHoursMap[record.workerId] = 0;
        }
        additionalHoursMap[record.workerId] += record.additionalHours;
      }
    });

    // 轉換為陣列格式
    const result = Object.keys(additionalHoursMap).map((workerId) => ({
      workerId: workerId,
      totalHours: additionalHoursMap[workerId],
    }));

    res.json({
      success: true,
      data: result,
      message: "額外工時統計獲取成功",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "獲取額外工時統計失敗",
      error: error.message,
    });
  }
});

// 新增額外工時（支持疊加模式）
app.post(
  "/api/time-records/additional-hours",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { workerId, date, hours, reason, adjustmentType, adjustedBy } =
      req.body;

    if (
      !workerId ||
      !date ||
      hours === undefined ||
      hours === null ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message: "所有欄位都不能為空",
      });
    }

    // 驗證時數為數字
    const inputHours = parseFloat(hours);
    if (isNaN(inputHours) || inputHours === 0) {
      return res.status(400).json({
        success: false,
        message: "時數必須是非零數字，可使用小數點",
      });
    }

    // 根據調整類型決定實際時數（add: 正數, subtract: 負數）
    const actualHours =
      adjustmentType === "subtract"
        ? -Math.abs(inputHours)
        : Math.abs(inputHours);

    // 檢查工讀生是否存在
    const worker = workers.find((w) => w.id === workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "工讀生不存在",
      });
    }

    const targetDate = moment(date).format("YYYY-MM-DD");

    // 找到該日期的工時記錄
    let record = timeRecords.find(
      (r) =>
        r.workerId === workerId &&
        moment(r.date).format("YYYY-MM-DD") === targetDate,
    );

    // 獲取操作者資訊 - 優先使用前端傳來的信息
    const operatorId = req.user ? req.user.id : "system";
    const operatorName =
      adjustedBy || (req.user ? req.user.name || req.user.username : "系統");

    console.log("操作者信息:", {
      operatorId,
      operatorName,
      adjustedBy,
      userFromToken: req.user,
    });

    // 創建調整記錄
    const adjustmentRecord = {
      id: uuidv4(),
      hours: actualHours,
      reason: reason,
      operatorId: operatorId,
      operatorName: operatorName,
      createdAt: new Date().toISOString(),
    };

    if (!record) {
      // 如果沒有當日記錄，創建一個新的記錄
      record = {
        id: uuidv4(),
        workerId,
        date: new Date(date).toISOString(),
        clockIn: null,
        clockOut: null,
        totalHours: 0,
        additionalHours: actualHours,
        adjustments: [adjustmentRecord], // 儲存所有調整記錄
        adjustedBy: operatorName, // 最新的操作者
        adjustedAt: new Date().toISOString(), // 最新的操作時間
        createdAt: new Date().toISOString(),
      };
      timeRecords.push(record);
    } else {
      // 更新現有記錄 - 疊加時數
      const recordIndex = timeRecords.findIndex((r) => r.id === record.id);

      // 初始化 adjustments 陣列（如果不存在）
      if (!timeRecords[recordIndex].adjustments) {
        timeRecords[recordIndex].adjustments = [];
      }

      // 新增調整記錄
      timeRecords[recordIndex].adjustments.push(adjustmentRecord);

      // 疊加時數
      timeRecords[recordIndex].additionalHours =
        (timeRecords[recordIndex].additionalHours || 0) + actualHours;

      // 更新最新的操作者信息
      timeRecords[recordIndex].adjustedBy = operatorName;
      timeRecords[recordIndex].adjustedAt = new Date().toISOString();

      record = timeRecords[recordIndex];
    }

    await saveTimeRecords(); // 持久化數據

    // 記錄活動日誌（包含操作者資訊）
    const actionType = actualHours >= 0 ? "新增" : "扣除";
    logActivity(
      "time-adjust",
      "time-record",
      record.id,
      worker.name,
      `${operatorName} 對工讀生進行時數調整：${actionType} ${Math.abs(actualHours)} 小時，原因：${reason}`,
      operatorId,
    );

    res.status(201).json({
      success: true,
      data: record,
      message: `時數${actionType}成功`,
    });
  }),
);

// 編輯打卡時間
app.post("/api/time-records/edit-time", asyncHandler(async (req, res) => {
  const { workerId, clockIn, clockOut, note, date, sessions } = req.body;

  if (!workerId || !date) {
    return res.status(400).json({
      success: false,
      message: "工讀生ID和日期不能為空",
    });
  }

  // 檢查工讀生是否存在
  const worker = workers.find((w) => w.id === workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      message: "工讀生不存在",
    });
  }

  const targetDate = moment(date).format("YYYY-MM-DD");

  const now = new Date().toISOString();
  const existingRecords = timeRecords.filter(
    (r) =>
      r.workerId === workerId &&
      moment(r.date).format("YYYY-MM-DD") === targetDate,
  );

  const preservedAdditionalHours = existingRecords.reduce(
    (sum, record) => sum + (record.additionalHours || 0),
    0,
  );
  const preservedAdjustments = existingRecords.flatMap(
    (record) => record.adjustments || [],
  );
  const preservedCreatedAt = existingRecords[0]?.createdAt || now;

  timeRecords = timeRecords.filter(
    (r) =>
      !(
        r.workerId === workerId &&
        moment(r.date).format("YYYY-MM-DD") === targetDate
      ),
  );

  const normalizedSessions = Array.isArray(sessions)
    ? sessions
        .filter((session) => session?.clockIn || session?.clockOut)
        .map((session) => {
          const startTime = session.clockIn ? moment(session.clockIn) : null;
          const endTime = session.clockOut ? moment(session.clockOut) : null;
          const totalHours =
            startTime && endTime
              ? parseFloat(endTime.diff(startTime, "hours", true).toFixed(2))
              : 0;

          return {
            id: session.id || uuidv4(),
            workerId,
            date: session.clockIn
              ? new Date(session.clockIn).toISOString()
              : new Date(date).toISOString(),
            clockIn: session.clockIn || null,
            clockOut: session.clockOut || null,
            totalHours,
            additionalHours: 0,
            adjustments: [],
            note: note || session.note || "",
            createdAt: now,
            updatedAt: now,
          };
        })
        .sort((a, b) => {
          const aTime = a.clockIn || a.clockOut || a.date;
          const bTime = b.clockIn || b.clockOut || b.date;
          return new Date(aTime) - new Date(bTime);
        })
    : [];

  let recordsToSave = normalizedSessions;

  if (!Array.isArray(sessions)) {
    recordsToSave = [
      {
        id: existingRecords[0]?.id || uuidv4(),
        workerId,
        date: new Date(date).toISOString(),
        clockIn: clockIn || existingRecords[0]?.clockIn || null,
        clockOut: clockOut || existingRecords[0]?.clockOut || null,
        totalHours: 0,
        additionalHours: preservedAdditionalHours,
        adjustments: preservedAdjustments,
        note: note || existingRecords[0]?.note || "",
        createdAt: preservedCreatedAt,
        updatedAt: now,
      },
    ];
  }

  if (!recordsToSave.length && (preservedAdditionalHours !== 0 || preservedAdjustments.length > 0)) {
    recordsToSave = [
      {
        id: existingRecords[0]?.id || uuidv4(),
        workerId,
        date: new Date(date).toISOString(),
        clockIn: null,
        clockOut: null,
        totalHours: 0,
        additionalHours: preservedAdditionalHours,
        adjustments: preservedAdjustments,
        note: note || existingRecords[0]?.note || "",
        createdAt: preservedCreatedAt,
        updatedAt: now,
      },
    ];
  }

  recordsToSave = recordsToSave.map((record, index) => {
    const startTime = record.clockIn ? moment(record.clockIn) : null;
    const endTime = record.clockOut ? moment(record.clockOut) : null;

    return {
      ...record,
      totalHours:
        startTime && endTime
          ? parseFloat(endTime.diff(startTime, "hours", true).toFixed(2))
          : 0,
      additionalHours: index === 0 ? preservedAdditionalHours : 0,
      adjustments: index === 0 ? preservedAdjustments : [],
      note: note || record.note || "",
      createdAt: index === 0 ? preservedCreatedAt : record.createdAt || now,
      updatedAt: now,
    };
  });

  timeRecords.push(...recordsToSave);

  await saveTimeRecords(); // 持久化數據

  // 記錄活動日誌
  const details = [];
  if (Array.isArray(sessions)) {
    details.push(
      `時段數：${recordsToSave.filter((record) => record.clockIn).length}`,
    );
    recordsToSave.forEach((record, index) => {
      details.push(
        `第${index + 1}段：${record.clockIn ? moment(record.clockIn).format("MM/DD HH:mm") : "--"} ~ ${record.clockOut ? moment(record.clockOut).format("MM/DD HH:mm") : "--"}`,
      );
    });
  } else {
    if (clockIn)
      details.push(`上班時間：${moment(clockIn).format("YYYY-MM-DD HH:mm")}`);
    if (clockOut)
      details.push(`下班時間：${moment(clockOut).format("YYYY-MM-DD HH:mm")}`);
  }
  if (note) details.push(`備註：${note}`);

  logActivity(
    "time-edit",
    "time-record",
    recordsToSave[0]?.id || existingRecords[0]?.id || uuidv4(),
    worker.name,
    `打卡時間編輯 - ${details.join("，")}`,
  );

  res.json({
    success: true,
    data: buildDailyAttendance(recordsToSave, targetDate),
    message: "打卡時間編輯成功",
  });
}));

// === 薪資調整 ===
// 獲取薪資調整記錄
app.get("/api/salary-adjustments", (req, res) => {
  const { workerId } = req.query;
  let filteredAdjustments = salaryAdjustments;

  if (workerId) {
    filteredAdjustments = filteredAdjustments.filter(
      (a) => a.workerId === workerId,
    );
  }

  res.json({
    success: true,
    data: filteredAdjustments,
    message: "薪資調整記錄獲取成功",
  });
});

// 新增薪資調整
app.post("/api/salary-adjustments", asyncHandler(async (req, res) => {
  const { workerId, type, amount, reason } = req.body;

  if (!workerId || !type || !amount || !reason) {
    return res.status(400).json({
      success: false,
      message: "所有欄位都不能為空",
    });
  }

  // 檢查工讀生是否存在
  const worker = workers.find((w) => w.id === workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      message: "工讀生不存在",
    });
  }

  // 驗證調整類型
  if (!["increase", "decrease"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "調整類型必須是 increase 或 decrease",
    });
  }

  const newAdjustment = {
    id: uuidv4(),
    workerId,
    type,
    amount: parseFloat(amount),
    reason,
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  salaryAdjustments.push(newAdjustment);
  await saveSalaryAdjustments(); // 持久化數據

  // 記錄活動日誌
  const actionText = type === "increase" ? "加薪" : "減薪";
  logActivity(
    "salary-adjust",
    "salary-adjustment",
    newAdjustment.id,
    worker.name,
    `薪資調整：${actionText} ${amount} 元，理由：${reason}`,
  );

  res.status(201).json({
    success: true,
    data: newAdjustment,
    message: "薪資調整記錄新增成功",
  });
}));

// 調整總薪資（直接設定總薪資金額）
app.post("/api/salary-adjustments/total", asyncHandler(async (req, res) => {
  const { workerId, targetTotalSalary, reason } = req.body;

  if (!workerId || !targetTotalSalary || targetTotalSalary <= 0 || !reason) {
    return res.status(400).json({
      success: false,
      message: "所有欄位都不能為空",
    });
  }

  // 檢查工讀生是否存在
  const workerIndex = workers.findIndex((w) => w.id === workerId);
  if (workerIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "工讀生不存在",
    });
  }

  const worker = workers[workerIndex];

  try {
    // 計算當前薪資結構
    const currentDate = new Date();
    const start = moment().startOf("month");
    const end = moment().endOf("month");

    // 獲取本月工時記錄
    const periodRecords = timeRecords.filter((r) => {
      const recordDate = moment(r.date);
      return (
        r.workerId === workerId && recordDate.isBetween(start, end, "day", "[]")
      );
    });

    // 計算工時
    let totalRegularHours = 0;
    let totalAdditionalHours = 0;
    let workingDays = 0;

    periodRecords.forEach((record) => {
      totalRegularHours += record.totalHours;
      totalAdditionalHours += record.additionalHours;
      if (record.clockIn || record.additionalHours > 0) {
        workingDays++;
      }
    });

    // 計算基本薪資：基本工時 + 加班工時
    const baseWorkingHours = workingDays * (worker.baseWorkingHours || 0);
    const totalSalaryHours = baseWorkingHours + totalAdditionalHours;
    const currentBaseSalary = totalSalaryHours * (worker.baseHourlyWage || 0);

    // 計算需要的額外薪資調整
    const requiredExtraSalary = targetTotalSalary - currentBaseSalary;

    // 移除該工讀生本月的所有薪資調整記錄
    salaryAdjustments = salaryAdjustments.filter((adj) => {
      const adjDate = moment(adj.date);
      return !(
        adj.workerId === workerId && adjDate.isBetween(start, end, "day", "[]")
      );
    });

    // 如果需要額外薪資調整，新增一筆記錄
    if (Math.abs(requiredExtraSalary) >= 1) {
      const adjustment = {
        id: Date.now().toString(),
        workerId,
        type: requiredExtraSalary >= 0 ? "increase" : "decrease",
        amount: Math.abs(requiredExtraSalary),
        reason: `總薪資設定：${reason}`,
        date: new Date().toISOString(),
      };

      salaryAdjustments.push(adjustment);
    }

    await saveSalaryAdjustments();

    // 記錄活動日誌
    logActivity(
      "total-salary-set",
      "worker",
      workerId,
      worker.name,
      `總薪資設定為 ${targetTotalSalary} 元，原因：${reason}`,
    );

    res.json({
      success: true,
      data: {
        workerId,
        targetTotalSalary,
        currentBaseSalary: Math.round(currentBaseSalary),
        extraSalaryAdjustment: Math.round(requiredExtraSalary),
        totalSalaryHours: Math.round(totalSalaryHours * 100) / 100,
      },
      message: "總薪資設定成功",
    });
  } catch (error) {
    console.error("總薪資設定失敗:", error);
    res.status(500).json({
      success: false,
      message: "總薪資設定失敗: " + error.message,
    });
  }
}));

// === 統計資訊 ===
// 獲取總覽統計
app.get("/api/dashboard/stats", (req, res) => {
  const totalWorkers = workers.length;
  const totalGroups = groups.length;

  // 計算今日打卡人數
  const today = moment().format("YYYY-MM-DD");
  const todayClockedIn = timeRecords.filter(
    (r) => moment(r.date).format("YYYY-MM-DD") === today && r.clockIn,
  ).length;

  // 計算本月總工時
  const currentMonth = moment().format("YYYY-MM");
  const monthlyHours = timeRecords
    .filter((r) => moment(r.date).format("YYYY-MM") === currentMonth)
    .reduce(
      (total, record) => total + record.totalHours + record.additionalHours,
      0,
    );

  res.json({
    success: true,
    data: {
      totalWorkers,
      totalGroups,
      todayClockedIn,
      monthlyHours: parseFloat(monthlyHours.toFixed(2)),
    },
    message: "統計資訊獲取成功",
  });
});

// 計算工讀生薪資
app.get("/api/workers/:id/salary-calculation", (req, res) => {
  const { startDate, endDate } = req.query;
  const workerId = req.params.id;

  // 檢查工讀生是否存在
  const worker = workers.find((w) => w.id === workerId);
  if (!worker) {
    return res.status(404).json({
      success: false,
      message: "工讀生不存在",
    });
  }

  // 預設查詢範圍為本月
  const start = startDate ? moment(startDate) : moment().startOf("month");
  const end = endDate ? moment(endDate) : moment().endOf("month");

  // 獲取指定期間的工時記錄
  const periodRecords = timeRecords.filter((r) => {
    const recordDate = moment(r.date);
    return (
      r.workerId === workerId && recordDate.isBetween(start, end, "day", "[]")
    );
  });

  // 計算總工時
  let totalRegularHours = 0;
  let totalAdditionalHours = 0;
  let workingDays = 0;

  periodRecords.forEach((record) => {
    totalRegularHours += record.totalHours;
    totalAdditionalHours += record.additionalHours;
    if (record.clockIn || record.additionalHours > 0) {
      workingDays++;
    }
  });

  // 簡化薪資計算邏輯：
  // 只要有設定基本時數，就直接計算基本工時，不考慮月份和天數
  // 總工時 = 基本工時 + 加班工時
  const baseWorkingHours = worker.baseWorkingHours || 0; // 直接使用設定的基本工時
  const totalSalaryHours = baseWorkingHours + totalAdditionalHours; // 總工時 = 基本工時 + 加班工時
  const baseSalary = totalSalaryHours * (worker.baseHourlyWage || 0); // 薪資 = 總工時 × 時薪

  // 獲取薪資調整記錄（額外薪資）
  const salaryAdjustmentsInPeriod = salaryAdjustments.filter((adj) => {
    const adjDate = moment(adj.date);
    return (
      adj.workerId === workerId && adjDate.isBetween(start, end, "day", "[]")
    );
  });

  const totalAdjustments = salaryAdjustmentsInPeriod.reduce((total, adj) => {
    return total + (adj.type === "increase" ? adj.amount : -adj.amount);
  }, 0);

  // 計算總薪資：基本薪資 + 額外薪資調整
  const totalSalary = baseSalary + totalAdjustments;

  res.json({
    success: true,
    data: {
      worker: {
        id: worker.id,
        number: worker.number,
        name: worker.name,
        baseHourlyWage: worker.baseHourlyWage || 0,
        baseWorkingHours: worker.baseWorkingHours || 0,
      },
      period: {
        startDate: start.format("YYYY-MM-DD"),
        endDate: end.format("YYYY-MM-DD"),
      },
      workTime: {
        totalRegularHours: parseFloat(totalRegularHours.toFixed(2)),
        totalAdditionalHours: parseFloat(totalAdditionalHours.toFixed(2)),
        baseWorkingHours: parseFloat(baseWorkingHours.toFixed(2)),
        totalSalaryHours: parseFloat(totalSalaryHours.toFixed(2)),
        workingDays,
      },
      salary: {
        baseSalary: parseFloat(baseSalary.toFixed(2)),
        extraSalary: parseFloat(totalAdjustments.toFixed(2)),
        totalSalary: parseFloat(totalSalary.toFixed(2)),
      },
      records: periodRecords,
      adjustments: salaryAdjustmentsInPeriod,
    },
    message: "薪資計算完成",
  });
});

// 健康檢查
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "服務運行正常",
    timestamp: new Date().toISOString(),
  });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "伺服器內部錯誤",
  });
});

// 404 處理
// === 活動日誌管理 ===
// 獲取活動日誌
app.get("/api/activity-logs", (req, res) => {
  const { page = 1, limit = 50, entityType, action } = req.query;

  let filteredLogs = [...activityLogs];

  // 按實體類型篩選
  if (entityType) {
    filteredLogs = filteredLogs.filter((log) => log.entityType === entityType);
  }

  // 按動作篩選
  if (action) {
    filteredLogs = filteredLogs.filter((log) => log.action === action);
  }

  // 按時間倒序排列（最新的在前）
  filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // 分頁
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedLogs,
    total: filteredLogs.length,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(filteredLogs.length / parseInt(limit)),
    message: "活動日誌獲取成功",
  });
});

// 清空活動日誌（管理員功能）
app.delete("/api/activity-logs", (req, res) => {
  try {
    activityLogs = [];

    logActivity(
      "clear",
      "activity-logs",
      "all",
      "所有日誌",
      "管理員清空了所有活動日誌",
    );

    res.json({
      success: true,
      message: "活動日誌已清空",
    });
  } catch (error) {
    console.error("清空活動日誌錯誤:", error);
    res.status(500).json({
      success: false,
      message: "清空活動日誌失敗",
      error: error.message,
    });
  }
});

app.use((error, req, res, next) => {
  console.error("API 錯誤:", error);
  res.status(500).json({
    success: false,
    message: "伺服器處理請求時發生錯誤",
    error: error.message,
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API 端點不存在",
  });
});

// 啟動伺服器並初始化資料庫
async function startServer() {
  try {
    console.log("🚀 開始啟動伺服器...");
    console.log("環境:", process.env.NODE_ENV || "development");
    console.log("Port:", PORT);
    
    // 初始化資料庫
    console.log("📦 初始化資料庫...");
    await initDatabase();
    console.log("✅ 資料庫初始化成功");
    await initializeAppData();
    console.log("✅ 應用資料載入成功");

    if (isGoogleSheetsConfigured()) {
      console.log("📄 驗證 Google Sheets 連線...");
      try {
        const sheetsStatus = await verifyGoogleSheetsConnection("groups");
        console.log(
          `✅ Google Sheets 連線成功：已讀取 ${sheetsStatus.sheetName} 工作表，預覽 ${sheetsStatus.previewRowCount} 列`,
        );
      } catch (error) {
        console.warn("⚠️ Google Sheets 驗證失敗:", error.message);
      }
    } else {
      const missingEnvVars = getMissingGoogleSheetsEnvVars();
      console.log(
        `ℹ️ 略過 Google Sheets 驗證，缺少環境變數: ${missingEnvVars.join(", ")}`,
      );
    }

    // 啟動伺服器
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 伺服器運行在 http://0.0.0.0:${PORT}`);
      console.log(`📱 區域網路存取: http://[你的電腦IP]:${PORT}`);
      console.log(`💾 使用 PostgreSQL app_state 持久化儲存`);
      console.log(`📄 Google Sheets 已接入啟動驗證流程`);
      console.log(
        `💡 要獲取電腦IP,請執行: ipconfig (Windows) 或 ifconfig (Mac/Linux)`,
      );
      console.log(`✅ 伺服器啟動成功!`);
    });
  } catch (error) {
    console.error("❌ 伺服器啟動失敗:", error.message);
    console.error("錯誤堆棧:", error.stack);
    process.exit(1);
  }
}

// 啟動伺服器
startServer();
