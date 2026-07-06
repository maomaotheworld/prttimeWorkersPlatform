import { createRouter, createWebHistory } from "vue-router";

// 捕捉 chunk 載入失敗（Vercel 重新部署後舊 hash 消失），自動強制重整
function lazyLoad(importFn) {
  return importFn().catch((err) => {
    if (err?.message?.includes("Failed to fetch dynamically imported module") ||
        err?.message?.includes("error loading dynamically imported module") ||
        err?.name === "ChunkLoadError") {
      window.location.reload();
    }
    return Promise.reject(err);
  });
}

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => lazyLoad(() => import("../views/Login.vue")),
    meta: {
      title: "登入",
      requiresAuth: false,
      hideFromGuests: false,
    },
  },
  {
    path: "/",
    name: "Home",
    component: () => lazyLoad(() => import("../views/Home.vue")),
    meta: {
      title: "首頁",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/workers",
    name: "Workers",
    component: () => lazyLoad(() => import("../views/Workers.vue")),
    meta: {
      title: "工讀生管理",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/personnel-list",
    name: "PersonnelList",
    component: () => lazyLoad(() => import("../views/PersonnelList.vue")),
    meta: {
      title: "人員列表(閱覽模式)",
      requiresAuth: false,
    },
  },
  {
    path: "/groups",
    name: "Groups",
    component: () => lazyLoad(() => import("../views/Groups.vue")),
    meta: {
      title: "組別管理",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/attendance",
    name: "Attendance",
    component: () => lazyLoad(() => import("../views/Attendance.vue")),
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
    component: () => lazyLoad(() => import("../views/TimeRecords.vue")),
    meta: {
      title: "工時記錄",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/salary",
    name: "Salary",
    component: () => lazyLoad(() => import("../views/Salary.vue")),
    meta: {
      title: "薪資管理",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/activity-logs",
    name: "ActivityLogs",
    component: () => lazyLoad(() => import("../views/ActivityLogs.vue")),
    meta: {
      title: "活動日誌",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/user-management",
    name: "UserManagement",
    component: () => lazyLoad(() => import("../views/UserManagement.vue")),
    meta: {
      title: "用戶管理",
      requiresAuth: true,
      allowedRoles: ["admin"],
      requiredPermission: "canManageUsers",
    },
  },
  {
    path: "/permissions-matrix",
    name: "PermissionsMatrix",
    component: () => lazyLoad(() => import("../views/PermissionsMatrix.vue")),
    meta: {
      title: "權限矩陣",
      requiresAuth: true,
      allowedRoles: ["admin"],
      evelynOnly: true,
    },
  },
  {
    path: "/teams",
    name: "TeamManagement",
    component: () => lazyLoad(() => import("../views/TeamManagement.vue")),
    meta: {
      title: "所屬團隊管理",
      requiresAuth: true,
      allowedRoles: ["admin", "leader"],
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全局處理 NavigationDuplicated（點相同路由不報錯）
const originalPush = router.push.bind(router);
router.push = (location) => originalPush(location).catch((err) => {
  if (err?.name !== 'NavigationDuplicated' && !err?.message?.includes('Avoided redundant navigation')) {
    return Promise.reject(err);
  }
});
const originalReplace = router.replace.bind(router);
router.replace = (location) => originalReplace(location).catch((err) => {
  if (err?.name !== 'NavigationDuplicated' && !err?.message?.includes('Avoided redundant navigation')) {
    return Promise.reject(err);
  }
});

// 認證守衛 - 訪客權限控制
router.beforeEach((to, from, next) => {
  // 設定頁面標題
  document.title = to.meta.title ? `${to.meta.title} - 管理平台` : "管理平台";

  // 檢查認證狀態
  const token = localStorage.getItem("auth_token");
  const isAuthenticated = !!token;

  // 如果是登入頁面，直接進入
  if (to.path === "/login") {
    next();
    return;
  }

  // 如果是公開頁面（人員列表），總是允許
  if (to.meta?.requiresAuth === false) {
    next();
    return;
  }

  // 對於訪客（未認證用戶）
  if (!isAuthenticated) {
    // 訪客不能存取任何需要認證的頁面，包括首頁
    // 重定向到人員列表頁面
    next("/personnel-list");
    return;
  }

  // 已認證用戶可以正常存取
  next();
});

export default router;
