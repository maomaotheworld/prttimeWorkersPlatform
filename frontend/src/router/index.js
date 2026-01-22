import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
    meta: {
      title: "登入",
      requiresAuth: false,
      hideFromGuests: false,
    },
  },
  {
    path: "/",
    name: "Home",
    component: () => import("../views/Home.vue"),
    meta: {
      title: "首頁",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/workers",
    name: "Workers",
    component: () => import("../views/Workers.vue"),
    meta: {
      title: "工讀生管理",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/groups",
    name: "Groups",
    component: () => import("../views/Groups.vue"),
    meta: {
      title: "組別管理",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/floors",
    name: "Floors",
    component: () => import("../views/Floors.vue"),
    meta: {
      title: "樓層管理",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/attendance",
    name: "Attendance",
    component: () => import("../views/Attendance.vue"),
    meta: {
      title: "打卡系統",
      requiresAuth: true,
      allowedRoles: ["admin", "leader"],
      requiredPermission: "canClockIn",
    },
  },
  {
    path: "/time-records",
    name: "TimeRecords",
    component: () => import("../views/TimeRecords.vue"),
    meta: {
      title: "工時記錄",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/salary",
    name: "Salary",
    component: () => import("../views/Salary.vue"),
    meta: {
      title: "薪資管理",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/activity-logs",
    name: "ActivityLogs",
    component: () => import("../views/ActivityLogs.vue"),
    meta: {
      title: "活動日誌",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/user-management",
    name: "UserManagement",
    component: () => import("../views/UserManagement.vue"),
    meta: {
      title: "用戶管理",
      requiresAuth: true,
      allowedRoles: ["admin"],
      requiredPermission: "canManageUsers",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 認�?守�? - 簡�??�本?��?循環依賴
router.beforeEach((to, from, next) => {
  // 設定頁面標題
  document.title = to.meta.title
    ? `${to.meta.title} - 工讀生管理平台`
    : "工讀生管理平台";

  // 如果是登入頁面直接進入（在進入組件內部處理登入邏輯）
  if (to.path === "/login") {
    next();
    return;
  }

  // 對於?�要�?證�??�面，暫?��??�許?�入，�?證檢?�在App.vue中�???
  next();
});

export default router;
