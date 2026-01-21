const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3005;
const JWT_SECRET = "your-secret-key-here"; // 實際專案中應使用環境變數

// 中間件
app.use(
  cors({
    origin: [
      "https://prttime-workers-platform.vercel.app",
      "https://prttime-workers-platform-lkh13i3lp-eps-projects-6d54422e.vercel.app",
      "http://localhost:5175",
    ],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 資料檔案路徑
const dataDir = path.join(__dirname, "data");
const usersFilePath = path.join(dataDir, "users.json");

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

// 載入工作人員數據
function loadWorkers() {
  try {
    const data = fs.readFileSync(
      path.join(__dirname, "data", "workers.json"),
      "utf8",
    );
    return JSON.parse(data);
  } catch (err) {
    console.log("無法載入工作人員數據，使用空陣列:", err.message);
    return [];
  }
}

// 儲存工作人員數據
function saveWorkers() {
  try {
    fs.writeFileSync(
      path.join(__dirname, "data", "workers.json"),
      JSON.stringify(workers, null, 2),
    );
  } catch (err) {
    console.error("儲存工作人員數據失敗:", err);
  }
}

// 載入組別數據
function loadGroups() {
  try {
    const data = fs.readFileSync(
      path.join(__dirname, "data", "groups.json"),
      "utf8",
    );
    return JSON.parse(data);
  } catch (err) {
    console.log("無法載入組別數據,使用預設組別:", err.message);
    return [
      { id: "group-1", name: "前台組", description: "負責前台接待工作" },
      { id: "group-2", name: "後台組", description: "負責後台作業" },
      { id: "group-3", name: "清潔組", description: "負責環境清潔維護" },
    ];
  }
}

// 儲存組別數據
function saveGroups() {
  try {
    fs.writeFileSync(
      path.join(__dirname, "data", "groups.json"),
      JSON.stringify(groups, null, 2),
    );
  } catch (err) {
    console.error("儲存組別數據失敗:", err);
  }
}

// 載入工時記錄數據
function loadTimeRecords() {
  try {
    const data = fs.readFileSync(
      path.join(__dirname, "data", "timeRecords.json"),
      "utf8",
    );
    return JSON.parse(data);
  } catch (err) {
    console.log("無法載入工時記錄數據,使用空陣列:", err.message);
    return [];
  }
}

// 儲存工時記錄數據
function saveTimeRecords() {
  try {
    fs.writeFileSync(
      path.join(__dirname, "data", "timeRecords.json"),
      JSON.stringify(timeRecords, null, 2),
    );
  } catch (err) {
    console.error("儲存工時記錄數據失敗:", err);
  }
}

// 載入薪資調整數據
function loadSalaryAdjustments() {
  try {
    const data = fs.readFileSync(
      path.join(__dirname, "data", "salaryAdjustments.json"),
      "utf8",
    );
    return JSON.parse(data);
  } catch (err) {
    console.log("無法載入薪資調整數據,使用空陣列:", err.message);
    return [];
  }
}

// 儲存薪資調整數據
function saveSalaryAdjustments() {
  try {
    fs.writeFileSync(
      path.join(__dirname, "data", "salaryAdjustments.json"),
      JSON.stringify(salaryAdjustments, null, 2),
    );
  } catch (err) {
    console.error("儲存薪資調整數據失敗:", err);
  }
}

// 模擬資料庫（實際專案中應使用真實資料庫）
let workers = loadWorkers();
let groups = loadGroups();
let timeRecords = loadTimeRecords();
let salaryAdjustments = loadSalaryAdjustments();
let activityLogs = [];

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
  (req, res) => {
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
  },
);

// 新增leader用戶（僅admin）
app.post(
  "/api/auth/create-leader",
  authenticateToken,
  requireRole(["admin"]),
  (req, res) => {
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
  },
);

// 刪除用戶（僅admin，不可刪除自己）
app.delete(
  "/api/auth/users/:id",
  authenticateToken,
  requireRole(["admin"]),
  (req, res) => {
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
  },
);

// API 路由

// === 工讀生管理 ===
// 獲取所有工讀生
app.get("/api/workers", (req, res) => {
  res.json({
    success: true,
    data: workers,
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
app.post("/api/workers", (req, res) => {
  const {
    number,
    name,
    gender,
    level,
    groupId,
    floor,
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
    baseHourlyWage:
      baseHourlyWage !== undefined ? parseFloat(baseHourlyWage) : 0,
    baseWorkingHours:
      baseWorkingHours !== undefined ? parseFloat(baseWorkingHours) : 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  workers.push(newWorker);
  saveWorkers();

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
});

// 更新工讀生
app.put("/api/workers/:id", (req, res) => {
  const {
    number,
    name,
    gender,
    level,
    groupId,
    floor,
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

  saveWorkers();

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
});

// 刪除工讀生
app.delete("/api/workers/:id", (req, res) => {
  const workerIndex = workers.findIndex((w) => w.id === req.params.id);

  if (workerIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "工讀生不存在",
    });
  }

  const deletedWorker = workers[workerIndex];
  workers.splice(workerIndex, 1);
  saveWorkers();

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
});

// 批次更新工讀生薪資時數
app.put("/api/workers/batch-update-wage", (req, res) => {
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

  saveWorkers();

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
});

// === 組別管理 ===
// 獲取所有組別
app.get("/api/groups", (req, res) => {
  res.json({
    success: true,
    data: groups,
    message: "組別列表獲取成功",
  });
});

// 新增組別
app.post("/api/groups", (req, res) => {
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

  const newGroup = {
    id: uuidv4(),
    name,
    description: description || "",
    createdAt: new Date().toISOString(),
  };

  groups.push(newGroup);
  saveGroups(); // 持久化數據

  res.status(201).json({
    success: true,
    data: newGroup,
    message: "組別新增成功",
  });
});

// 更新組別
app.put("/api/groups/:id", (req, res) => {
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

  groups[groupIndex] = {
    ...groups[groupIndex],
    name: name || groups[groupIndex].name,
    description:
      description !== undefined ? description : groups[groupIndex].description,
  };

  saveGroups(); // 持久化數據

  res.json({
    success: true,
    data: groups[groupIndex],
    message: "組別更新成功",
  });
});

// 刪除組別
app.delete("/api/groups/:id", (req, res) => {
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

  groups.splice(groupIndex, 1);
  saveGroups(); // 持久化數據

  res.json({
    success: true,
    message: "組別刪除成功",
  });
});

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
app.post("/api/time-records/clock-in", (req, res) => {
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

  // 檢查今天是否已經上班打卡
  const existingRecord = timeRecords.find(
    (r) =>
      r.workerId === workerId &&
      moment(r.date).format("YYYY-MM-DD") === today &&
      r.clockIn,
  );

  if (existingRecord && !existingRecord.clockOut) {
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
  saveTimeRecords(); // 持久化數據

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
});

// 下班打卡
app.post("/api/time-records/clock-out", (req, res) => {
  const { workerId } = req.body;

  if (!workerId) {
    return res.status(400).json({
      success: false,
      message: "工讀生ID不能為空",
    });
  }

  const today = moment().format("YYYY-MM-DD");

  // 找到今天的上班記錄
  const recordIndex = timeRecords.findIndex(
    (r) =>
      r.workerId === workerId &&
      moment(r.date).format("YYYY-MM-DD") === today &&
      r.clockIn &&
      !r.clockOut,
  );

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

  saveTimeRecords(); // 持久化數據

  res.json({
    success: true,
    data: timeRecords[recordIndex],
    message: "下班打卡成功",
  });
});

// 新增額外工時（支持疊加模式）
app.post("/api/time-records/additional-hours", authenticateToken, (req, res) => {
  const { workerId, date, hours, reason, adjustmentType } = req.body;

  if (!workerId || !date || hours === undefined || hours === null || !reason) {
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
  const actualHours = adjustmentType === "subtract" ? -Math.abs(inputHours) : Math.abs(inputHours);

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

  // 獲取操作者資訊
  const operatorId = req.user ? req.user.id : "system";
  const operatorName = req.user ? (req.user.name || req.user.username) : "系統";

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
    
    record = timeRecords[recordIndex];
  }

  saveTimeRecords(); // 持久化數據

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
});

// 編輯打卡時間
app.post("/api/time-records/edit-time", (req, res) => {
  const { workerId, clockIn, clockOut, note, date } = req.body;

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

  // 查找或創建當日工時記錄
  let record = timeRecords.find(
    (r) =>
      r.workerId === workerId &&
      moment(r.date).format("YYYY-MM-DD") === targetDate,
  );

  const now = new Date().toISOString();

  if (!record) {
    // 創建新記錄
    record = {
      id: uuidv4(),
      workerId,
      date: new Date(date).toISOString(),
      clockIn: clockIn || null,
      clockOut: clockOut || null,
      totalHours: 0,
      additionalHours: 0,
      note: note || "",
      createdAt: now,
      updatedAt: now,
    };
    timeRecords.push(record);
  } else {
    // 更新現有記錄
    const recordIndex = timeRecords.findIndex((r) => r.id === record.id);
    timeRecords[recordIndex] = {
      ...timeRecords[recordIndex],
      clockIn: clockIn || timeRecords[recordIndex].clockIn,
      clockOut: clockOut || timeRecords[recordIndex].clockOut,
      note: note || timeRecords[recordIndex].note,
      updatedAt: now,
    };
    record = timeRecords[recordIndex];
  }

  // 計算工作時間
  if (record.clockIn && record.clockOut) {
    const startTime = moment(record.clockIn);
    const endTime = moment(record.clockOut);
    record.totalHours = parseFloat(
      endTime.diff(startTime, "hours", true).toFixed(1),
    );
  }

  saveTimeRecords(); // 持久化數據

  // 記錄活動日誌
  const details = [];
  if (clockIn)
    details.push(`上班時間：${moment(clockIn).format("YYYY-MM-DD HH:mm")}`);
  if (clockOut)
    details.push(`下班時間：${moment(clockOut).format("YYYY-MM-DD HH:mm")}`);
  if (note) details.push(`備註：${note}`);

  logActivity(
    "time-edit",
    "time-record",
    record.id,
    worker.name,
    `打卡時間編輯 - ${details.join("，")}`,
  );

  res.json({
    success: true,
    data: record,
    message: "打卡時間編輯成功",
  });
});

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
app.post("/api/salary-adjustments", (req, res) => {
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
  saveSalaryAdjustments(); // 持久化數據

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
});

// 調整總薪資（根據目標總薪資計算新時薪）
app.post("/api/salary-adjustments/total", (req, res) => {
  const { workerId, newHourlyWage, targetTotalSalary, currentTotalHours, reason } = req.body;

  if (!workerId || newHourlyWage === undefined || newHourlyWage === null || !reason) {
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
  const oldWage = worker.baseHourlyWage || 0;
  const newWage = parseFloat(newHourlyWage);

  if (newWage < 0) {
    return res.status(400).json({
      success: false,
      message: "時薪不能為負數",
    });
  }

  // 更新工讀生時薪
  workers[workerIndex].baseHourlyWage = newWage;
  saveWorkers();

  // 記錄活動日誌
  const wageDiff = newWage - oldWage;
  const changeText = wageDiff >= 0 ? `調升 ${wageDiff}` : `調降 ${Math.abs(wageDiff)}`;
  const totalSalaryText = targetTotalSalary ? `，目標總薪資：${targetTotalSalary} 元` : '';
  const hoursText = currentTotalHours ? `，本期工時：${currentTotalHours} 小時` : '';
  
  logActivity(
    "total-salary-adjust",
    "worker",
    workerId,
    worker.name,
    `總薪資調整：時薪從 ${oldWage} 元調整為 ${newWage} 元（${changeText} 元）${totalSalaryText}${hoursText}，理由：${reason}`,
  );

  res.json({
    success: true,
    data: {
      workerId,
      oldWage,
      newWage,
      difference: wageDiff,
      targetTotalSalary,
      currentTotalHours,
    },
    message: "總薪資調整成功",
  });
});

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

  // 計算基本薪資和額外薪資
  const baseSalaryFromHours = totalRegularHours * (worker.baseHourlyWage || 0);
  const baseSalaryFromDays =
    workingDays * (worker.baseWorkingHours || 0) * (worker.baseHourlyWage || 0);
  const additionalSalary = totalAdditionalHours * (worker.baseHourlyWage || 0);

  // 獲取薪資調整記錄
  const salaryAdjustmentsInPeriod = salaryAdjustments.filter((adj) => {
    const adjDate = moment(adj.date);
    return (
      adj.workerId === workerId && adjDate.isBetween(start, end, "day", "[]")
    );
  });

  const totalAdjustments = salaryAdjustmentsInPeriod.reduce((total, adj) => {
    return total + (adj.type === "increase" ? adj.amount : -adj.amount);
  }, 0);

  // 計算總薪資（選擇較高的基本薪資計算方式）
  const baseSalary = Math.max(baseSalaryFromHours, baseSalaryFromDays);
  const totalSalary = baseSalary + additionalSalary + totalAdjustments;

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
        workingDays,
      },
      salary: {
        baseSalaryFromHours: parseFloat(baseSalaryFromHours.toFixed(2)),
        baseSalaryFromDays: parseFloat(baseSalaryFromDays.toFixed(2)),
        baseSalary: parseFloat(baseSalary.toFixed(2)),
        additionalSalary: parseFloat(additionalSalary.toFixed(2)),
        totalAdjustments: parseFloat(totalAdjustments.toFixed(2)),
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
});

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API 端點不存在",
  });
});

// 啟動伺服器，綁定到所有網路介面以支援區域網路存取
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 伺服器運行在 http://0.0.0.0:${PORT}`);
  console.log(`📱 區域網路存取: http://[你的電腦IP]:${PORT}`);
  console.log(
    `💡 要獲取電腦IP，請執行: ipconfig (Windows) 或 ifconfig (Mac/Linux)`,
  );
});
