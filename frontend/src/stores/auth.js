import { defineStore } from "pinia";
import api from "../utils/api";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    // ?¨æˆ¶è³‡è?
    user: null,
    token: null,
    isLoggedIn: false,

    // æ¬Šé??§åˆ¶
    permissions: {
      canManageUsers: false,
      canEditWorkers: false,
      canImportData: false,
      canClockIn: false,
      canEditTime: false,
      canViewReports: false,
      canDeleteData: false,
    },

    // ?¨æˆ¶?—è¡¨ï¼ˆå?admin?¯è?ï¼?
    users: [],
  }),

  getters: {
    // ?¨æˆ¶è§’è‰²
    userRole: (state) => state.user?.role || null,

    // ?¯å¦?ºç®¡?†å“¡
    isAdmin: (state) => state.user?.role === "admin",

    // ?¯å¦?ºå?çµ„é•·
    isLeader: (state) => state.user?.role === "leader",

    // ?¯å¦?ºè¨ªå®?
    isReader: (state) => state.user?.role === "reader",

    // ?¨æˆ¶é¡¯ç¤º?ç¨±
    displayName: (state) => state.user?.name || state.user?.username || "è¨ªå®¢",

    // æ¬Šé?æª¢æŸ¥è¼”åŠ©?¹æ?
    hasPermission: (state) => (permission) => {
      return state.permissions[permission] || false;
    },
  },

  actions: {
    // å¾?localStorage ?¢å¾©?»å…¥?€??
    initializeAuth() {
      const token = localStorage.getItem("auth_token");
      const userData = localStorage.getItem("auth_user");

      if (token && userData) {
        try {
          this.token = token;
          this.user = JSON.parse(userData);
          this.isLoggedIn = true;
          this.permissions = this.user?.permissions || {};

          // è¨­ç½®API?è¨­header
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // é©—è?token?¯å¦?‰æ?
          this.verifyToken();
        } catch (error) {
          console.error("?¢å¾©?»å…¥?€?‹å¤±??", error);
          this.logout();
        }
      }
    },

    // ?»å…¥
    async login(username, password) {
      try {
        console.log("Auth store: ?‹å??»å…¥è«‹æ?", { username });

        // ä½¿ç”¨?°å?è®Šæ•¸ä¸­ç? API URL
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';
        const directResponse = await fetch(
          `${API_URL}/api/auth/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
          },
        );

        const responseData = await directResponse.json();
        console.log("Auth store: ?´æ¥è«‹æ??æ?", responseData);

        if (responseData && responseData.success) {
          const { token, user } = responseData.data;

          console.log("Auth store: è§???¨æˆ¶?¸æ?", {
            token: token ? "å­˜åœ¨" : "ç¼ºå¤±",
            user,
          });

          // ä¿å???store
          this.token = token;
          this.user = user;
          this.isLoggedIn = true;
          this.permissions = user.permissions || {};

          // ä¿å???localStorage
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", JSON.stringify(user));

          // è¨­ç½®API?è¨­header
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          console.log("Auth store: ?»å…¥?å?ï¼Œç??‹å·²?´æ–°", {
            isLoggedIn: this.isLoggedIn,
            userRole: this.userRole,
            permissions: this.permissions,
          });

          return { success: true, message: "?»å…¥?å?" };
        }

        const errorMessage = responseData?.message || "?»å…¥å¤±æ?";
        console.error("Auth store: ?»å…¥å¤±æ?", errorMessage);
        return { success: false, message: errorMessage };
      } catch (error) {
        console.error("Auth store: ?»å…¥?¯èª¤", error);

        let errorMessage = "?»å…¥å¤±æ?";
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

    // è¨ªå®¢?»å…¥
    async guestLogin() {
      try {
        const response = await api.post("/auth/guest-login");

        if (response.data.success) {
          const { token, user } = response.data.data;

          // ä¿å???store
          this.token = token;
          this.user = user;
          this.isLoggedIn = true;
          this.permissions = user.permissions || {};

          // ä¿å???localStorage
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", JSON.stringify(user));

          // è¨­ç½®API?è¨­header
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          return { success: true, message: "è¨ªå®¢?»å…¥?å?" };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("è¨ªå®¢?»å…¥?¯èª¤:", error);
        return {
          success: false,
          message: error.response?.data?.message || "è¨ªå®¢?»å…¥å¤±æ?",
        };
      }
    },

    // ?»å‡º
    async logout() {
      try {
        if (this.token) {
          await api.post("/auth/logout");
        }
      } catch (error) {
        console.error("?»å‡ºè«‹æ?å¤±æ?:", error);
      } finally {
        // æ¸…é™¤?€??
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

        // æ¸…é™¤ localStorage
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");

        // æ¸…é™¤API header
        delete api.defaults.headers.common["Authorization"];
      }
    },

    // é©—è?token
    async verifyToken() {
      try {
        const response = await api.get("/auth/verify");

        if (!response.data.success) {
          throw new Error("Tokené©—è?å¤±æ?");
        }

        // ?´æ–°?¨æˆ¶è³‡è?
        this.user = response.data.data.user;
        this.permissions = this.user.permissions || {};

        return true;
      } catch (error) {
        console.error("Tokené©—è?å¤±æ?:", error);
        this.logout();
        return false;
      }
    },

    // ?²å??¨æˆ¶?—è¡¨ï¼ˆå?adminï¼?
    async fetchUsers() {
      if (!this.isAdmin) {
        return { success: false, message: "æ¬Šé?ä¸è¶³" };
      }

      try {
        const response = await api.get("/auth/users");

        if (response.data.success) {
          this.users = response.data.data;
          return { success: true, data: this.users };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("?²å??¨æˆ¶?—è¡¨å¤±æ?:", error);
        return {
          success: false,
          message: error.response?.data?.message || "?²å??¨æˆ¶?—è¡¨å¤±æ?",
        };
      }
    },

    // ?µå»ºå°ç??·å¸³?Ÿï??…adminï¼?
    async createLeader(userData) {
      if (!this.isAdmin) {
        return { success: false, message: "æ¬Šé?ä¸è¶³" };
      }

      try {
        const response = await api.post("/auth/create-leader", userData);

        if (response.data.success) {
          // ?´æ–°?¨æˆ¶?—è¡¨
          await this.fetchUsers();
          return {
            success: true,
            message: "å°ç??·å¸³?Ÿå»ºç«‹æ???,
            data: response.data.data,
          };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("å»ºç?å°ç??·å¸³?Ÿå¤±??", error);
        return {
          success: false,
          message: error.response?.data?.message || "å»ºç?å°ç??·å¸³?Ÿå¤±??,
        };
      }
    },

    // ?ªé™¤?¨æˆ¶ï¼ˆå?adminï¼?
    async deleteUser(userId) {
      if (!this.isAdmin) {
        return { success: false, message: "æ¬Šé?ä¸è¶³" };
      }

      try {
        const response = await api.delete(`/auth/users/${userId}`);

        if (response.data.success) {
          // ?´æ–°?¨æˆ¶?—è¡¨
          await this.fetchUsers();
          return { success: true, message: "?¨æˆ¶?ªé™¤?å?" };
        }

        return { success: false, message: response.data.message };
      } catch (error) {
        console.error("?ªé™¤?¨æˆ¶å¤±æ?:", error);
        return {
          success: false,
          message: error.response?.data?.message || "?ªé™¤?¨æˆ¶å¤±æ?",
        };
      }
    },

    // æ¬Šé?æª¢æŸ¥?¹æ?
    checkPermission(permission) {
      return this.permissions[permission] || false;
    },

    // è¦æ?æ¬Šé?æª¢æŸ¥
    requirePermission(permission, errorMessage = "æ¬Šé?ä¸è¶³") {
      if (!this.checkPermission(permission)) {
        throw new Error(errorMessage);
      }
    },
  },
});
