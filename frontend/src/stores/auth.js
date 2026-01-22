import { defineStore } from "pinia";
import { getApiUrl } from "../config/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    // 用戶資料
    user: null,
    token: null,
    isLoggedIn: false,

    // 權限控制
    permissions: {
      canManageUsers: false,
      canEditWorkers: false,
      canImportData: false,
      canClockIn: false,
      canEditTime: false,
      canViewReports: false,
      canDeleteData: false,
    },

    // ?�戶?�表（�?admin?��?�?
    users: [],
  }),

  getters: {
    // ?�戶角色
    userRole: (state) => state.user?.role || null,

    // ?�否?�管?�員
    isAdmin: (state) => state.user?.role === "admin",

    // ?�否?��?組長
    isLeader: (state) => state.user?.role === "leader",

    // ?�否?�訪�?
    isReader: (state) => state.user?.role === "reader",

    // ?�戶顯示?�稱
    displayName: (state) => state.user?.name || state.user?.username || "訪客",

    // 權�?檢查輔助?��?
    hasPermission: (state) => (permission) => {
      return state.permissions[permission] || false;
    },
  },

  actions: {
    // �?localStorage ?�復?�入?�??
    initializeAuth() {
      const token = localStorage.getItem("auth_token");
      const userData = localStorage.getItem("auth_user");

      if (token && userData) {
        try {
          this.token = token;
          this.user = JSON.parse(userData);
          this.isLoggedIn = true;
          this.permissions = this.user?.permissions || {};

          // 驗證token是否有效
          this.verifyToken();
        } catch (error) {
          console.error("恢復登入狀態失敗", error);
          this.logout();
        }
      }
    },

    // ?�入
    async login(username, password) {
      try {
        console.log("Auth store: ?��??�入請�?", { username });

        // 使用getApiUrl獲取正確的 API URL
        const directResponse = await fetch(getApiUrl("/api/auth/login"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const responseData = await directResponse.json();
        console.log("Auth store: ?�接請�??��?", responseData);

        if (responseData && responseData.success) {
          const { token, user } = responseData.data;

          console.log("Auth store: �???�戶?��?", {
            token: token ? "存在" : "缺失",
            user,
          });

          // 保存到store
          this.token = token;
          this.user = user;
          this.isLoggedIn = true;
          this.permissions = user.permissions || {};

          // 保存到localStorage
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", JSON.stringify(user));

          console.log("Auth store: 登入成功，狀態已更新", {
            isLoggedIn: this.isLoggedIn,
            userRole: this.userRole,
            permissions: this.permissions,
          });

          return { success: true, message: "登入成功" };
        }

        const errorMessage = responseData?.message || "?�入失�?";
        console.error("Auth store: ?�入失�?", errorMessage);
        return { success: false, message: errorMessage };
      } catch (error) {
        console.error("Auth store: ?�入?�誤", error);

        let errorMessage = "?�入失�?";
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        return {
          success: false,
          message: errorMessage,
        };
      }
    },

    // 訪客登入
    async guestLogin() {
      try {
        const response = await fetch(getApiUrl("/api/auth/guest-login"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const responseData = await response.json();

        if (responseData.success) {
          const { token, user } = responseData.data;

          // 保存到store
          this.token = token;
          this.user = user;
          this.isLoggedIn = true;
          this.permissions = user.permissions || {};

          // 保存到localStorage
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", JSON.stringify(user));

          return { success: true, message: "訪客登入成功" };
        }

        return { success: false, message: responseData.message };
      } catch (error) {
        console.error("訪客登入錯誤:", error);
        return {
          success: false,
          message: "訪客登入失敗",
        };
      }
    },

    // 登出
    async logout() {
      try {
        // 嘗試調用後端登出API
        if (this.token) {
          const response = await fetch(getApiUrl("/api/auth/logout"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${this.token}`
            }
          });
          
          if (!response.ok) {
            console.warn("登出API請求失敗，HTTP狀態:", response.status);
          }
        }
      } catch (error) {
        // API錯誤不影響前端登出流程
        console.warn("登出API請求失敗，但仍會清除前端狀態:", error.message);
      }
      
      // 無論API是否成功，都清除前端狀態
      this.token = null;
      this.user = null;
      this.isLoggedIn = false;
      this.permissions = {
        canManageUsers: false,
        canEditWorkers: false,
        canImportData: false,
        canClockIn: false,
        canEditTime: false,
        canViewReports: false,
        canDeleteData: false,
      };
      this.users = [];

      // 清除 localStorage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    },

    // 驗證token
    async verifyToken() {
      try {
        const response = await fetch(getApiUrl("/api/auth/verify"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.token}`
          },
        });

        const responseData = await response.json();

        if (!responseData.success) {
          throw new Error("Token驗證失敗");
        }

        // 更新用戶資訊
        this.user = responseData.data.user;
        this.permissions = this.user.permissions || {};

        return true;
      } catch (error) {
        console.error("Token驗證失敗:", error);
        this.logout();
        return false;
      }
    },

    // 獲取用戶列表（僅admin）
    async fetchUsers() {
      if (!this.isAdmin) {
        return { success: false, message: "權限不足" };
      }

      try {
        const response = await fetch(getApiUrl("/api/auth/users"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.token}`
          },
        });

        const responseData = await response.json();

        if (responseData.success) {
          this.users = responseData.data;
          return { success: true, data: this.users };
        }

        return { success: false, message: responseData.message };
      } catch (error) {
        console.error("獲取用戶列表失敗:", error);
        return {
          success: false,
          message: "獲取用戶列表失敗",
        };
      }
    },

    // ?�建小�??�帳?��??�admin�?
    async createLeader(userData) {
      if (!this.isAdmin) {
        return { success: false, message: "權�?不足" };
      }

      try {
        const response = await api.post("/auth/create-leader", userData);

        if (response.data.success) {
          // ?�新?�戶?�表
          await this.fetchUsers();
          return {
            success: true,
            message: "小�??�帳?�建立�???",
            data: response.data.data,
          };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("建立小組帳號失敗", error);
        return {
          success: false,
          message: error.response?.data?.message || "建立小組帳號失敗",
        };
      }
    },

    // 建立管理員帳號（僅特定用戶可用）
    async createAdmin(userData) {
      // 只有 evelyn 可以創建管理員
      const allowedUsers = ['evelyn', 'evelyn.pan'];
      if (!allowedUsers.includes(this.user?.username)) {
        return { success: false, message: "權限不足，只有Evelyn可以創建管理員帳號" };
      }

      try {
        const response = await api.post("/auth/create-admin", userData);

        if (response.data.success) {
          // ?�新?�戶?�表
          await this.fetchUsers();
          return {
            success: true,
            message: "管理員帳號建立成功",
            data: response.data.data,
          };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("建立管理員帳號失敗", error);
        return {
          success: false,
          message: error.response?.data?.message || "建立管理員帳號失敗",
        };
      }
    },

    // 刪除用戶（僅admin）
    async deleteUser(userId) {
      if (!this.isAdmin) {
        return { success: false, message: "權限不足" };
      }

      try {
        const response = await api.delete(`/auth/users/${userId}`);

        if (response.data.success) {
          // ?�新?�戶?�表
          await this.fetchUsers();
          return { success: true, message: "?�戶?�除?��?" };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("?�除?�戶失�?:", error);
        return {
          success: false,
          message: error.response?.data?.message || "?�除?�戶失�?",
        };
      }
    },

    // 權�?檢查?��?
    checkPermission(permission) {
      return this.permissions[permission] || false;
    },

    // 要�?權�?檢查
    requirePermission(permission, errorMessage = "權�?不足") {
      if (!this.checkPermission(permission)) {
        throw new Error(errorMessage);
      }
    },
  },
});
