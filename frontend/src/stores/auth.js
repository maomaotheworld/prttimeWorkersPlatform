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

          // 設置API?�設header
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // 驗�?token?�否?��?
          this.verifyToken();
        } catch (error) {
          console.error("?�復?�入?�?�失??", error);
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

          // 保�???store
          this.token = token;
          this.user = user;
          this.isLoggedIn = true;
          this.permissions = user.permissions || {};

          // 保�???localStorage
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", JSON.stringify(user));

          // 設置API?�設header
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          console.log("Auth store: ?�入?��?，�??�已?�新", {
            isLoggedIn: this.isLoggedIn,
            userRole: this.userRole,
            permissions: this.permissions,
          });

          return { success: true, message: "?�入?��?" };
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

    // 訪客?�入
    async guestLogin() {
      try {
        const response = await api.post("/auth/guest-login");

        if (response.data.success) {
          const { token, user } = response.data.data;

          // 保�???store
          this.token = token;
          this.user = user;
          this.isLoggedIn = true;
          this.permissions = user.permissions || {};

          // 保�???localStorage
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", JSON.stringify(user));

          // 設置API?�設header
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          return { success: true, message: "訪客?�入?��?" };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("訪客?�入?�誤:", error);
        return {
          success: false,
          message: error.response?.data?.message || "訪客?�入失�?",
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
        const response = await api.get("/auth/verify");

        if (!response.data.success) {
          throw new Error("Token驗證失敗");
        }

        // 更新用戶資訊
        this.user = response.data.data.user;
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
        return { success: false, message: "權�?不足" };
      }

      try {
        const response = await api.get("/auth/users");

        if (response.data.success) {
          this.users = response.data.data;
          return { success: true, data: this.users };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("?��??�戶?�表失�?:", error);
        return {
          success: false,
          message: error.response?.data?.message || "?��??�戶?�表失�?",
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
