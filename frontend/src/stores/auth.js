import { defineStore } from "pinia";
import api from "../utils/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    // 用戶資訊
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

    // 用戶列表（僅admin可見）
    users: [],
  }),

  getters: {
    // 用戶角色
    userRole: (state) => state.user?.role || null,

    // 是否為管理員
    isAdmin: (state) => state.user?.role === "admin",

    // 是否為小組長
    isLeader: (state) => state.user?.role === "leader",

    // 是否為訪客
    isReader: (state) => state.user?.role === "reader",

    // 用戶顯示名稱
    displayName: (state) => state.user?.name || state.user?.username || "訪客",

    // 權限檢查輔助方法
    hasPermission: (state) => (permission) => {
      return state.permissions[permission] || false;
    },
  },

  actions: {
    // 從 localStorage 恢復登入狀態
    initializeAuth() {
      const token = localStorage.getItem("auth_token");
      const userData = localStorage.getItem("auth_user");

      if (token && userData) {
        try {
          this.token = token;
          this.user = JSON.parse(userData);
          this.isLoggedIn = true;
          this.permissions = this.user?.permissions || {};

          // 設置API預設header
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // 驗證token是否有效
          this.verifyToken();
        } catch (error) {
          console.error("恢復登入狀態失敗:", error);
          this.logout();
        }
      }
    },

    // 登入
    async login(username, password) {
      try {
        console.log("Auth store: 開始登入請求", { username });

        // 嘗試直接調用後端（跳過Vite代理）
        const directResponse = await fetch(
          "http://localhost:3005/api/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
          },
        );

        const responseData = await directResponse.json();
        console.log("Auth store: 直接請求回應", responseData);

        if (responseData && responseData.success) {
          const { token, user } = responseData.data;

          console.log("Auth store: 解析用戶數據", {
            token: token ? "存在" : "缺失",
            user,
          });

          // 保存到 store
          this.token = token;
          this.user = user;
          this.isLoggedIn = true;
          this.permissions = user.permissions || {};

          // 保存到 localStorage
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", JSON.stringify(user));

          // 設置API預設header
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          console.log("Auth store: 登入成功，狀態已更新", {
            isLoggedIn: this.isLoggedIn,
            userRole: this.userRole,
            permissions: this.permissions,
          });

          return { success: true, message: "登入成功" };
        }

        const errorMessage = responseData?.message || "登入失敗";
        console.error("Auth store: 登入失敗", errorMessage);
        return { success: false, message: errorMessage };
      } catch (error) {
        console.error("Auth store: 登入錯誤", error);

        let errorMessage = "登入失敗";
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
        const response = await api.post("/auth/guest-login");

        if (response.data.success) {
          const { token, user } = response.data.data;

          // 保存到 store
          this.token = token;
          this.user = user;
          this.isLoggedIn = true;
          this.permissions = user.permissions || {};

          // 保存到 localStorage
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", JSON.stringify(user));

          // 設置API預設header
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          return { success: true, message: "訪客登入成功" };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("訪客登入錯誤:", error);
        return {
          success: false,
          message: error.response?.data?.message || "訪客登入失敗",
        };
      }
    },

    // 登出
    async logout() {
      try {
        if (this.token) {
          await api.post("/auth/logout");
        }
      } catch (error) {
        console.error("登出請求失敗:", error);
      } finally {
        // 清除狀態
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

        // 清除API header
        delete api.defaults.headers.common["Authorization"];
      }
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
        return { success: false, message: "權限不足" };
      }

      try {
        const response = await api.get("/auth/users");

        if (response.data.success) {
          this.users = response.data.data;
          return { success: true, data: this.users };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("獲取用戶列表失敗:", error);
        return {
          success: false,
          message: error.response?.data?.message || "獲取用戶列表失敗",
        };
      }
    },

    // 創建小組長帳號（僅admin）
    async createLeader(userData) {
      if (!this.isAdmin) {
        return { success: false, message: "權限不足" };
      }

      try {
        const response = await api.post("/auth/create-leader", userData);

        if (response.data.success) {
          // 更新用戶列表
          await this.fetchUsers();
          return {
            success: true,
            message: "小組長帳號建立成功",
            data: response.data.data,
          };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("建立小組長帳號失敗:", error);
        return {
          success: false,
          message: error.response?.data?.message || "建立小組長帳號失敗",
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
          // 更新用戶列表
          await this.fetchUsers();
          return { success: true, message: "用戶刪除成功" };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("刪除用戶失敗:", error);
        return {
          success: false,
          message: error.response?.data?.message || "刪除用戶失敗",
        };
      }
    },

    // 權限檢查方法
    checkPermission(permission) {
      return this.permissions[permission] || false;
    },

    // 要求權限檢查
    requirePermission(permission, errorMessage = "權限不足") {
      if (!this.checkPermission(permission)) {
        throw new Error(errorMessage);
      }
    },
  },
});
