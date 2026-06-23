<template>
  <div id="app">
    <!-- 如果是登入頁面就顯示登入頁面 -->
    <template v-if="$route.path === '/login'">
      <router-view />
    </template>

    <!-- 主應用區域 -->
    <template v-else>
      <el-container class="app-container">
        <!-- 頂部導航 -->
        <el-header
          v-if="!isMobile && showNavigation"
          height="60px"
          class="app-header"
        >
          <div class="header-content">
            <div class="logo">
              <el-icon size="24"><Management /></el-icon>
              <span>管理平台</span>
            </div>
            <div class="header-actions">
              <div v-if="authStore.isLoggedIn" class="user-info">
                <el-dropdown trigger="click" @command="handleUserMenuCommand">
                  <div class="user-avatar-wrapper" tabindex="0">
                    <el-avatar :size="32" class="user-avatar">
                      {{ authStore.displayName[0] }}
                    </el-avatar>
                    <span class="user-name">{{ authStore.displayName }}</span>
                    <el-tag :type="userRoleTagType" size="small" class="role-tag">
                      {{ userRoleText }}
                    </el-tag>
                  </div>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="changeCredentials">
                        <el-icon><Edit /></el-icon> 修改帳號／密碼
                      </el-dropdown-item>
                      <el-dropdown-item command="logout" divided style="color:#f56c6c">
                        <el-icon><SwitchButton /></el-icon> 登出
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <div class="action-buttons">
                <el-button
                  v-if="!authStore.isLoggedIn"
                  type="primary"
                  @click="$router.push('/login')"
                  plain
                >
                  <el-icon><User /></el-icon>
                  登入
                </el-button>
              </div>
            </div>
          </div>
        </el-header>

        <el-container>
          <!-- 側邊導航 -->
          <el-aside
            v-if="!isMobile && showNavigation"
            width="200px"
            class="app-aside"
          >
            <el-menu
              :default-active="$route.path"
              router
              class="app-menu"
              background-color="#545c64"
              text-color="#fff"
              active-text-color="#ffd04b"
            >
              <el-menu-item
                v-for="nav in visibleDesktopNavs"
                :key="nav.path"
                :index="nav.path"
              >
                <el-icon><component :is="nav.iconComponent" /></el-icon>
                <span>{{ nav.name }}</span>
              </el-menu-item>
            </el-menu>
          </el-aside>

          <!-- 主內容區域 -->
          <el-main class="app-main">
            <router-view />
          </el-main>
        </el-container>

        <!-- 移動端導航 -->
        <el-header
          v-if="isMobile && showNavigation"
          height="50px"
          class="mobile-header"
        >
          <div class="mobile-header-content">
            <div v-if="authStore.isLoggedIn" class="mobile-user-info">
              <el-dropdown trigger="click" @command="handleUserMenuCommand">
                <div style="display:flex;align-items:center;gap:6px;cursor:pointer;outline:none" tabindex="0">
                  <el-avatar :size="24">{{ authStore.displayName[0] }}</el-avatar>
                  <span class="mobile-user-name">{{ authStore.displayName }}</span>
                  <el-tag :type="userRoleTagType" size="small">{{ userRoleText }}</el-tag>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="changeCredentials">
                      <el-icon><Edit /></el-icon> 修改帳號／密碼
                    </el-dropdown-item>
                    <el-dropdown-item command="logout" divided style="color:#f56c6c">
                      <el-icon><SwitchButton /></el-icon> 登出
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div v-else class="mobile-user-info">
              <span class="mobile-user-name">訪客模式</span>
            </div>
            <el-button
              v-if="!authStore.isLoggedIn"
              type="primary"
              size="small"
              @click="$router.push('/login')"
              plain
              :icon="User"
            >
              登入
            </el-button>
          </div>
        </el-header>

        <!-- 移動端底部導航 -->
        <el-footer
          v-if="isMobile && showNavigation"
          height="45px"
          class="mobile-footer"
        >
          <div class="mobile-nav">
            <div
              v-for="nav in visibleMobileNavs"
              :key="nav.path"
              :class="['nav-item', { active: $route.path === nav.path }]"
              @click="$router.push(nav.path)"
            >
              <span>{{ nav.name }}</span>
            </div>
          </div>
        </el-footer>
      </el-container>
    </template>

    <!-- 修改帳號/密碼 Dialog -->
    <el-dialog
      v-model="showCredentialsDialog"
      title="修改帳號／密碼"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="credentialsFormRef"
        :model="credentialsForm"
        :rules="credentialsRules"
        label-width="110px"
      >
        <el-form-item label="目前密碼" prop="currentPassword">
          <el-input
            v-model="credentialsForm.currentPassword"
            type="password"
            show-password
            placeholder="請輸入目前密碼"
          />
        </el-form-item>
        <el-divider>以下欄位選填，至少填一項</el-divider>
        <el-form-item label="新帳號" prop="newUsername">
          <el-input
            v-model="credentialsForm.newUsername"
            placeholder="不修改請留空"
          />
        </el-form-item>
        <el-form-item label="新密碼" prop="newPassword">
          <el-input
            v-model="credentialsForm.newPassword"
            type="password"
            show-password
            placeholder="不修改請留空"
          />
        </el-form-item>
        <el-form-item label="確認新密碼" prop="confirmPassword">
          <el-input
            v-model="credentialsForm.confirmPassword"
            type="password"
            show-password
            placeholder="再次輸入新密碼"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCredentialsDialog = false">取消</el-button>
        <el-button type="primary" :loading="changingCredentials" @click="submitChangeCredentials">
          確認變更並重新登入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Management,
  HomeFilled,
  User,
  UserFilled,
  OfficeBuilding,
  Clock,
  Calendar,
  Money,
  Document,
  Setting,
  SwitchButton,
  Edit,
} from "@element-plus/icons-vue";
import { useAuthStore } from "./stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const windowWidth = ref(window.innerWidth);

const isMobile = computed(() => windowWidth.value <= 768);

// 是否顯示導航 - 除了登入頁面外都顯示導航
const showNavigation = computed(() => {
  const currentRoute = router.currentRoute.value;

  console.log("Navigation check:", {
    path: currentRoute.path,
    isLoginPage: currentRoute.path === "/login",
  });

  // 只有登入頁面不顯示導航，其他所有頁面都顯示
  return currentRoute.path !== "/login";
});

// 用戶角色顯示
const userRoleText = computed(() => {
  switch (authStore.userRole) {
    case "admin":
      return "管理員";
    case "leader":
      return "小組長";
    case "reader":
      return "訪客";
    default:
      return "未知";
  }
});

const userRoleTagType = computed(() => {
  switch (authStore.userRole) {
    case "admin":
      return "danger";
    case "leader":
      return "warning";
    case "reader":
      return "info";
    default:
      return "";
  }
});

// 桌面版導航配置
const desktopNavs = [
  { path: "/", name: "首頁", iconComponent: HomeFilled, requiresAuth: true, leaderVisible: true },
  {
    path: "/workers",
    name: "工讀生管理",
    iconComponent: User,
    permission: "canEditWorkers",
    leaderVisible: true,
  },
  {
    path: "/personnel-list",
    name: "人員列表",
    iconComponent: UserFilled,
    noAuth: true,
    leaderVisible: true,
  },
  {
    path: "/groups",
    name: "組別管理",
    iconComponent: UserFilled,
    permission: "canEditWorkers",
    leaderVisible: true,
  },
  {
    path: "/attendance",
    name: "打卡系統",
    iconComponent: Clock,
    permission: "canClockIn",
    leaderVisible: true,
  },
  {
    path: "/time-records",
    name: "工時記錄",
    iconComponent: Calendar,
    permission: "canEditTime",
  },
  { path: "/salary", name: "薪資管理", iconComponent: Money, permission: "canViewReports", leaderVisible: true },
  {
    path: "/activity-logs",
    name: "活動資料",
    iconComponent: Document,
    adminOnly: true,
  },
  {
    path: "/user-management",
    name: "用戶管理",
    iconComponent: Setting,
    permission: "canManageUsers",
  },
  {
    path: "/permissions-matrix",
    name: "權限矩陣",
    iconComponent: Setting,
    evelynOnly: true,
  },
];

const visibleDesktopNavs = computed(() => {
  const role = authStore.user?.role || '';
  const isLeader = role === 'leader';
  return desktopNavs.filter((nav) => {
    if (nav.noAuth) return true;
    if (!authStore.isLoggedIn && !localStorage.getItem("auth_token")) return false;
    if (nav.evelynOnly) return authStore.isEvelyn;
    if (nav.adminOnly) return authStore.isAdminOrEvelyn;
    if (nav.leaderVisible && isLeader) return true;
    if (nav.permission) {
      return authStore.hasPermission(nav.permission) || authStore.isAdminOrEvelyn;
    }
    return true;
  });
});

// 底部端點配置(需要權限過濾)
const mobileNavs = [
  { path: "/", name: "首頁", icon: "HomeFilled", requiresAuth: true, leaderVisible: true },
  {
    path: "/workers",
    name: "工讀生",
    icon: "User",
    permission: "canEditWorkers",
    leaderVisible: true,
  },
  { path: "/personnel-list", name: "人員", icon: "UserFilled", noAuth: true, leaderVisible: true },
  {
    path: "/attendance",
    name: "打卡",
    icon: "Clock",
    permission: "canClockIn",
    leaderVisible: true,
  },
  { path: "/time-records", name: "工時", icon: "Calendar", permission: "canEditTime" },
  { path: "/salary", name: "薪資", icon: "Money", permission: "canViewReports", leaderVisible: true },
  {
    path: "/activity-logs",
    name: "活動",
    icon: "Document",
    adminOnly: true,
  },
  {
    path: "/user-management",
    name: "用戶",
    icon: "Setting",
    permission: "canManageUsers",
  },
  {
    path: "/permissions-matrix",
    name: "權限",
    icon: "Setting",
    evelynOnly: true,
  },
  {
    path: "/groups",
    name: "組別",
    icon: "UserFilled",
    permission: "canEditWorkers",
    leaderVisible: true,
  },
];

const visibleMobileNavs = computed(() => {
  const role = authStore.user?.role || '';
  const isLeader = role === 'leader';
  return mobileNavs.filter((nav) => {
    if (nav.noAuth) return true;
    if (!authStore.isLoggedIn && !localStorage.getItem("auth_token")) return false;
    if (nav.evelynOnly) return authStore.isEvelyn;
    if (nav.adminOnly) return authStore.isAdminOrEvelyn;
    if (nav.leaderVisible && isLeader) return true;
    if (nav.permission) {
      return authStore.hasPermission(nav.permission) || authStore.isAdminOrEvelyn;
    }
    return true;
  });
});

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

// 登出操作
const handleLogout = async () => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      "確定要登出嗎?",
      "確認登出",
      {
        confirmButtonText: "確定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    if (confirmResult === "confirm") {
      try {
        await authStore.logout();
        ElMessage.success("已成功登出");
      } catch (error) {
        // 即使logout過程有錯誤，仍然跳轉到登入頁面
        console.warn("登出過程中發生錯誤:", error);
        ElMessage.success("已登出");
      }

      // 無論如何都跳轉到登入頁面
      await router.push("/login");
    }
  } catch (error) {
    // 用戶取消登出
    if (error === "cancel") {
      // 用戶主動取消，不顯示錯誤訊息
      return;
    }

    // 其他錯誤（例如確認對話框錯誤）
    console.error("登出確認過程錯誤:", error);
    ElMessage.error("登出確認失敗");
  }
};

// 頭像 dropdown
const handleUserMenuCommand = (command) => {
  if (command === 'logout') handleLogout();
  if (command === 'changeCredentials') openCredentialsDialog();
};

// 修改帳號/密碼
const showCredentialsDialog = ref(false);
const changingCredentials = ref(false);
const credentialsFormRef = ref();
const credentialsForm = ref({
  currentPassword: '',
  newUsername: '',
  newPassword: '',
  confirmPassword: '',
});

const credentialsRules = {
  currentPassword: [{ required: true, message: '請輸入目前密碼', trigger: 'blur' }],
  confirmPassword: [
    {
      validator: (rule, value, callback) => {
        if (credentialsForm.value.newPassword && value !== credentialsForm.value.newPassword) {
          callback(new Error('兩次輸入的新密碼不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

const openCredentialsDialog = () => {
  credentialsForm.value = { currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' };
  showCredentialsDialog.value = true;
};

const submitChangeCredentials = async () => {
  await credentialsFormRef.value?.validate(async (valid) => {
    if (!valid) return;
    const { newUsername, newPassword } = credentialsForm.value;
    if (!newUsername.trim() && !newPassword.trim()) {
      ElMessage.warning('請填寫新帳號或新密碼（至少一項）');
      return;
    }
    changingCredentials.value = true;
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005';
      const token = authStore.token || localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/auth/change-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: credentialsForm.value.currentPassword,
          newUsername: newUsername.trim() || undefined,
          newPassword: newPassword.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        ElMessage.success('已更新！即將登出，請以新帳密重新登入');
        showCredentialsDialog.value = false;
        setTimeout(async () => {
          try { await authStore.logout(); } catch {}
          await router.push('/login');
        }, 1500);
      } else {
        ElMessage.error(data.message || '變更失敗');
      }
    } catch (e) {
      ElMessage.error('網路錯誤，請稍後再試');
    } finally {
      changingCredentials.value = false;
    }
  });
};

onMounted(() => {
  window.addEventListener("resize", handleResize);

  // 初始化認證狀態
  authStore.initializeAuth();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.app-container {
  height: 100vh;
}

.app-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.logo .el-icon {
  margin-right: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  background-color: #409eff;
  color: white;
  font-weight: 600;
}

.user-avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-avatar-wrapper:hover {
  background: #f0f7ff;
}

.user-name {
  font-weight: 500;
  color: #2c3e50;
}

.role-tag {
  font-size: 11px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.app-aside {
  background-color: #545c64;
}

.app-menu {
  border: none;
}

.app-main {
  padding: 0;
  background-color: #f5f5f5;
  height: calc(100vh - 60px);
  overflow-y: auto;
  overflow-x: hidden;
}

.app-main::-webkit-scrollbar {
  width: 6px;
}

.app-main::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.app-main::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.app-main::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* ?��?端�???*/
.mobile-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0 15px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.mobile-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-user-name {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

.mobile-footer {
  background-color: #fff;
  border-top: 1px solid #e6e6e6;
  padding: 0;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.mobile-nav {
  display: flex;
  height: 100%;
}

.nav-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s;
  color: #909399;
  padding: 4px 0;
}

.nav-item.active {
  color: #409eff;
}

.nav-item span {
  font-size: 16px;
  text-align: center;
}

.dashboard-content {
  padding: 20px 0;
}

/* ?��?端樣式調??*/
@media (max-width: 768px) {
  .app-main {
    padding: 0;
    padding-top: 65px; /* ?�固定�??��??�部導航?�出空�? */
    padding-bottom: 60px; /* ?�固定�??��?底部導航?�出空�? */
    height: calc(100vh - 60px);
    overflow-y: auto;
    overflow-x: hidden;
  }

  .app-main::-webkit-scrollbar {
    width: 4px; /* ?��??�更細�?滾�?�?*/
  }

  .app-main::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
  }

  .app-main::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 2px;
  }

  .app-main::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  .header-actions {
    gap: 15px;
  }

  .user-info {
    gap: 8px;
  }

  .user-name {
    font-size: 14px;
  }
}

/* ?��?式調??*/
@media (max-width: 1200px) {
  .header-content {
    padding: 0 15px;
  }
}

@media (max-width: 992px) {
  .action-buttons {
    gap: 6px;
  }
}
</style>
