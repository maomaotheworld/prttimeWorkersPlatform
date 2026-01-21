import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
    meta: {
      title: "?»å…¥",
      requiresAuth: false,
      hideFromGuests: false,
    },
  },
  {
    path: "/",
    name: "Home",
    component: () => import("../views/Home.vue"),
    meta: {
      title: "é¦–é?",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/workers",
    name: "Workers",
    component: () => import("../views/Workers.vue"),
    meta: {
      title: "å·¥è??Ÿç®¡??,
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/groups",
    name: "Groups",
    component: () => import("../views/Groups.vue"),
    meta: {
      title: "çµ„åˆ¥ç®¡ç?",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/attendance",
    name: "Attendance",
    component: () => import("../views/Attendance.vue"),
    meta: {
      title: "?“å¡ç³»çµ±",
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
      title: "å·¥æ?è¨˜é?",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/salary",
    name: "Salary",
    component: () => import("../views/Salary.vue"),
    meta: {
      title: "?ªè?ç®¡ç?",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/activity-logs",
    name: "ActivityLogs",
    component: () => import("../views/ActivityLogs.vue"),
    meta: {
      title: "æ´»å??¥è?",
      requiresAuth: true,
      allowedRoles: ["admin", "leader", "reader"],
    },
  },
  {
    path: "/user-management",
    name: "UserManagement",
    component: () => import("../views/UserManagement.vue"),
    meta: {
      title: "?¨æˆ¶ç®¡ç?",
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

// èªè?å®ˆè? - ç°¡å??ˆæœ¬?¿å?å¾ªç’°ä¾è³´
router.beforeEach((to, from, next) => {
  // è¨­å??é¢æ¨™é?
  document.title = to.meta.title
    ? `${to.meta.title} - å·¥è??Ÿç®¡?†å¹³?°`
    : "å·¥è??Ÿç®¡?†å¹³??;

  // å¦‚æ??¯ç™»?¥é??¢ï??´æ¥?²å…¥ï¼ˆåœ¨?»å…¥çµ„ä»¶?§éƒ¨?•ç??å??‘ï?
  if (to.path === "/login") {
    next();
    return;
  }

  // å°æ–¼?€è¦è?è­‰ç??é¢ï¼Œæš«?‚å??è¨±?²å…¥ï¼Œè?è­‰æª¢?¥åœ¨App.vueä¸­è???
  next();
});

export default router;
