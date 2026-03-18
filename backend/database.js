const { Pool } = require("pg");

// 資料庫連接池配置
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost:5432/workers_db",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// 資料庫初始化
async function initDatabase() {
  try {
    console.log("正在初始化資料庫...");

    // 創建 users 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        permissions JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 創建 workers 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id SERIAL PRIMARY KEY,
        number VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        group_id INTEGER,
        floor VARCHAR(10),
        job VARCHAR(100),
        base_hourly_wage DECIMAL(10,2) DEFAULT 0,
        base_working_hours INTEGER DEFAULT 0,
        additional_hours DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 創建 groups 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 創建 time_records 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_records (
        id SERIAL PRIMARY KEY,
        worker_id INTEGER REFERENCES workers(id),
        date DATE NOT NULL,
        clock_in_time TIMESTAMP,
        clock_out_time TIMESTAMP,
        hours DECIMAL(10,2) DEFAULT 0,
        type VARCHAR(20) DEFAULT 'regular',
        description TEXT,
        adjusted_by VARCHAR(100),
        adjusted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 創建 activity_logs 表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 檢查是否需要創建預設管理員帳戶
    const adminExists = await pool.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1",
    );

    if (adminExists.rows.length === 0) {
      console.log("創建預設管理員帳戶...");
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("evelyn123", 10);

      await pool.query(
        `
        INSERT INTO users (id, username, password, role, permissions)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          "admin001",
          "evelyn",
          hashedPassword,
          "admin",
          JSON.stringify({
            canManageUsers: true,
            canEditWorkers: true,
            canImportData: true,
            canClockIn: true,
            canEditTime: true,
            canViewReports: true,
            canDeleteData: true,
          }),
        ],
      );
      console.log("預設管理員帳戶已創建: 用戶名 evelyn, 密碼 evelyn123");
    }

    // 檢查是否需要創建預設組別
    const groupsExists = await pool.query("SELECT id FROM groups LIMIT 1");
    if (groupsExists.rows.length === 0) {
      console.log("創建預設組別...");
      const defaultGroups = [
        "數學組",
        "英文組",
        "理化組",
        "國文組",
        "社會組",
        "生物組",
        "地科組",
      ];

      for (const groupName of defaultGroups) {
        await pool.query(
          "INSERT INTO groups (name, description) VALUES ($1, $2)",
          [groupName, `${groupName}的工讀生`],
        );
      }
      console.log("預設組別已創建");
    }

    console.log("資料庫初始化完成！");
  } catch (error) {
    console.error("資料庫初始化失敗:", error);
    throw error;
  }
}

// 導出資料庫連接池和初始化函數
module.exports = {
  pool,
  initDatabase,
};
