const { Pool } = require("pg");

// 使用您的資料庫連接字串
const DATABASE_URL = "postgresql://workers_admin:uY6WCAtvUF0sftmAeVgA0IoV6AdIjnAB@dpg-d6t3h8khg0os73fibld0-a/workers_db_2laa";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
});

async function testConnection() {
  console.log("🔍 正在測試資料庫連接...");
  console.log("連接字串:", DATABASE_URL.replace(/:[^:@]+@/, ":****@"));
  
  try {
    // 嘗試連接
    const client = await pool.connect();
    console.log("✅ 資料庫連接成功!");
    
    // 測試查詢
    const result = await client.query("SELECT NOW() as current_time, version() as pg_version");
    console.log("✅ 查詢測試成功!");
    console.log("當前時間:", result.rows[0].current_time);
    console.log("PostgreSQL 版本:", result.rows[0].pg_version);
    
    // 檢查現有的表
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log("\n📊 資料庫中的表:");
    if (tables.rows.length === 0) {
      console.log("  (尚無表,需要初始化)");
    } else {
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }
    
    client.release();
    console.log("\n✅ 所有測試通過!");
    process.exit(0);
    
  } catch (error) {
    console.error("\n❌ 資料庫連接失敗!");
    console.error("錯誤類型:", error.code);
    console.error("錯誤訊息:", error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error("\n原因: 找不到資料庫主機");
      console.error("請檢查:");
      console.error("1. 網絡連接是否正常");
      console.error("2. 資料庫主機名稱是否正確");
    } else if (error.code === 'ECONNREFUSED') {
      console.error("\n原因: 連接被拒絕");
      console.error("請檢查:");
      console.error("1. 資料庫服務是否正在運行");
      console.error("2. 防火牆設置");
    } else if (error.code === '28P01') {
      console.error("\n原因: 認證失敗");
      console.error("請檢查:");
      console.error("1. 用戶名和密碼是否正確");
      console.error("2. DATABASE_URL 是否正確");
    }
    
    console.error("\n完整錯誤:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection();
