const { pool } = require('./database');

class WorkersDAO {
  // 獲取所有工讀生
  static async getAllWorkers() {
    try {
      const result = await pool.query(`
        SELECT w.*, g.name as group_name 
        FROM workers w 
        LEFT JOIN groups g ON w.group_id = g.id 
        ORDER BY w.number
      `);
      return result.rows;
    } catch (error) {
      console.error('獲取工讀生列表失敗:', error);
      throw error;
    }
  }

  // 根據ID獲取工讀生
  static async getWorkerById(id) {
    try {
      const result = await pool.query('SELECT * FROM workers WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('獲取工讀生失敗:', error);
      throw error;
    }
  }

  // 根據編號獲取工讀生
  static async getWorkerByNumber(number) {
    try {
      const result = await pool.query('SELECT * FROM workers WHERE number = $1', [number]);
      return result.rows[0];
    } catch (error) {
      console.error('獲取工讀生失敗:', error);
      throw error;
    }
  }

  // 創建工讀生
  static async createWorker(workerData) {
    try {
      const { number, name, group_id, floor, job, base_hourly_wage, base_working_hours } = workerData;
      const result = await pool.query(`
        INSERT INTO workers (number, name, group_id, floor, job, base_hourly_wage, base_working_hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [number, name, group_id, floor, job, base_hourly_wage, base_working_hours]);
      return result.rows[0];
    } catch (error) {
      console.error('創建工讀生失敗:', error);
      throw error;
    }
  }

  // 更新工讀生
  static async updateWorker(id, workerData) {
    try {
      const { number, name, group_id, floor, job, base_hourly_wage, base_working_hours, additional_hours } = workerData;
      const result = await pool.query(`
        UPDATE workers 
        SET number = $1, name = $2, group_id = $3, floor = $4, job = $5, 
            base_hourly_wage = $6, base_working_hours = $7, additional_hours = $8, updated_at = NOW()
        WHERE id = $9
        RETURNING *
      `, [number, name, group_id, floor, job, base_hourly_wage, base_working_hours, additional_hours, id]);
      return result.rows[0];
    } catch (error) {
      console.error('更新工讀生失敗:', error);
      throw error;
    }
  }

  // 刪除工讀生
  static async deleteWorker(id) {
    try {
      const result = await pool.query('DELETE FROM workers WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('刪除工讀生失敗:', error);
      throw error;
    }
  }

  // 批量創建工讀生
  static async createWorkersBatch(workersData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const createdWorkers = [];

      for (const workerData of workersData) {
        const { number, name, group_id, floor, job, base_hourly_wage, base_working_hours } = workerData;
        const result = await client.query(`
          INSERT INTO workers (number, name, group_id, floor, job, base_hourly_wage, base_working_hours)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [number, name, group_id, floor, job, base_hourly_wage, base_working_hours]);
        createdWorkers.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return createdWorkers;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('批量創建工讀生失敗:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

class GroupsDAO {
  // 獲取所有組別
  static async getAllGroups() {
    try {
      const result = await pool.query('SELECT * FROM groups ORDER BY name');
      return result.rows;
    } catch (error) {
      console.error('獲取組別列表失敗:', error);
      throw error;
    }
  }

  // 根據ID獲取組別
  static async getGroupById(id) {
    try {
      const result = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('獲取組別失敗:', error);
      throw error;
    }
  }

  // 創建組別
  static async createGroup(groupData) {
    try {
      const { name, description } = groupData;
      const result = await pool.query(`
        INSERT INTO groups (name, description)
        VALUES ($1, $2)
        RETURNING *
      `, [name, description]);
      return result.rows[0];
    } catch (error) {
      console.error('創建組別失敗:', error);
      throw error;
    }
  }

  // 更新組別
  static async updateGroup(id, groupData) {
    try {
      const { name, description } = groupData;
      const result = await pool.query(`
        UPDATE groups 
        SET name = $1, description = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [name, description, id]);
      return result.rows[0];
    } catch (error) {
      console.error('更新組別失敗:', error);
      throw error;
    }
  }

  // 刪除組別
  static async deleteGroup(id) {
    try {
      const result = await pool.query('DELETE FROM groups WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('刪除組別失敗:', error);
      throw error;
    }
  }
}

class UsersDAO {
  // 獲取所有使用者
  static async getAllUsers() {
    try {
      const result = await pool.query('SELECT id, username, role, permissions, created_at FROM users ORDER BY created_at');
      return result.rows;
    } catch (error) {
      console.error('獲取使用者列表失敗:', error);
      throw error;
    }
  }

  // 根據用戶名獲取使用者
  static async getUserByUsername(username) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      return result.rows[0];
    } catch (error) {
      console.error('獲取使用者失敗:', error);
      throw error;
    }
  }

  // 根據ID獲取使用者
  static async getUserById(id) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('獲取使用者失敗:', error);
      throw error;
    }
  }

  // 創建使用者
  static async createUser(userData) {
    try {
      const { id, username, password, role, permissions } = userData;
      const result = await pool.query(`
        INSERT INTO users (id, username, password, role, permissions)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, username, role, permissions, created_at
      `, [id, username, password, role, JSON.stringify(permissions)]);
      return result.rows[0];
    } catch (error) {
      console.error('創建使用者失敗:', error);
      throw error;
    }
  }

  // 更新使用者
  static async updateUser(id, userData) {
    try {
      const { username, password, role, permissions } = userData;
      let query = 'UPDATE users SET username = $1, role = $2, permissions = $3, updated_at = NOW() WHERE id = $4';
      let params = [username, role, JSON.stringify(permissions), id];

      if (password) {
        query = 'UPDATE users SET username = $1, password = $2, role = $3, permissions = $4, updated_at = NOW() WHERE id = $5';
        params = [username, password, role, JSON.stringify(permissions), id];
      }

      const result = await pool.query(query + ' RETURNING id, username, role, permissions, created_at', params);
      return result.rows[0];
    } catch (error) {
      console.error('更新使用者失敗:', error);
      throw error;
    }
  }

  // 刪除使用者
  static async deleteUser(id) {
    try {
      const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('刪除使用者失敗:', error);
      throw error;
    }
  }
}

module.exports = {
  WorkersDAO,
  GroupsDAO,
  UsersDAO
};