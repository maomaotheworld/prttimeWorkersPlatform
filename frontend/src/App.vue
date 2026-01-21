<template>
  <div id="app">
    <!-- 如果在登入頁面，只顯示登入組件 -->
    <template v-if="$route.path === '/login'">
      <router-view />
    </template>

    <!-- 主應用界面 -->
    <template v-else>
      <el-container class="app-container">
        <!-- 頂部導航 -->
        <el-header v-if="!isMobile" height="60px" class="app-header">
          <div class="header-content">
            <div class="logo">
              <el-icon size="24"><Management /></el-icon>
              <span>工讀生管理平台</span>
            </div>
            <div class="header-actions">
              <div class="user-info">
                <el-avatar :size="32" class="user-avatar">
                  {{ authStore.displayName[0] }}
                </el-avatar>
                <span class="user-name">{{ authStore.displayName }}</span>
                <el-tag :type="userRoleTagType" size="small" class="role-tag">
                  {{ userRoleText }}
                </el-tag>
              </div>
              <div class="action-buttons">
                <el-button type="primary" @click="showDashboard">
                  <el-icon><DataAnalysis /></el-icon>
                  統計資訊
                </el-button>
                <el-button type="danger" @click="handleLogout" plain>
                  <el-icon><SwitchButton /></el-icon>
                  登出
                </el-button>
              </div>
            </div>
          </div>
        </el-header>

        <el-container>
          <!-- 側邊導航 -->
          <el-aside v-if="!isMobile" width="200px" class="app-aside">
            <el-menu
              :default-active="$route.path"
              router
              class="app-menu"
              background-color="#545c64"
              text-color="#fff"
              active-text-color="#ffd04b"
            >
              <el-menu-item index="/">
                <el-icon><HomeFilled /></el-icon>
                <span>首頁</span>
              </el-menu-item>
              <el-menu-item index="/workers">
                <el-icon><User /></el-icon>
                <span>工讀生管理</span>
              </el-menu-item>
              <el-menu-item
                v-if="authStore.canEditWorkers || authStore.isAdmin"
                index="/groups"
              >
                <el-icon><UserFilled /></el-icon>
                <span>組別管理</span>
              </el-menu-item>
              <el-menu-item
                v-if="authStore.hasPermission('canClockIn')"
                index="/attendance"
              >
                <el-icon><Clock /></el-icon>
                <span>打卡系統</span>
              </el-menu-item>
              <el-menu-item index="/time-records">
                <el-icon><Calendar /></el-icon>
                <span>工時記錄</span>
              </el-menu-item>
              <el-menu-item index="/salary">
                <el-icon><Money /></el-icon>
                <span>薪資管理</span>
              </el-menu-item>
              <el-menu-item
                v-if="authStore.canViewReports || authStore.isAdmin"
                index="/activity-logs"
              >
                <el-icon><Document /></el-icon>
                <span>活動日誌</span>
              </el-menu-item>
              <el-menu-item v-if="authStore.isAdmin" index="/user-management">
                <el-icon><Setting /></el-icon>
                <span>用戶管理</span>
              </el-menu-item>
            </el-menu>
          </el-aside>

          <!-- 主內容區域 -->
          <el-main class="app-main">
            <router-view />
          </el-main>
        </el-container>

        <!-- 手機端頂部 -->
        <el-header v-if="isMobile" height="50px" class="mobile-header">
          <div class="mobile-header-content">
            <div class="mobile-user-info">
              <el-avatar :size="24">{{ authStore.displayName[0] }}</el-avatar>
              <span class="mobile-user-name">{{ authStore.displayName }}</span>
              <el-tag :type="userRoleTagType" size="small">{{
                userRoleText
              }}</el-tag>
            </div>
            <el-button
              type="danger"
              size="small"
              @click="handleLogout"
              plain
              :icon="SwitchButton"
            >
              登出
            </el-button>
          </div>
        </el-header>

        <!-- 手機端底部導航 -->
        <el-footer v-if="isMobile" height="45px" class="mobile-footer">
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

    <!-- 統計資訊彈窗 -->
    <el-dialog
      v-model="dashboardVisible"
      title="統計資訊"
      :width="isMobile ? '95%' : '500px'"
      center
    >
      <div class="dashboard-content">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-statistic title="總工讀生數" :value="stats.totalWorkers" />
          </el-col>
          <el-col :span="12">
            <el-statistic title="總組別數" :value="stats.totalGroups" />
          </el-col>
          <el-col :span="12">
            <el-statistic title="今日打卡" :value="stats.todayClockedIn" />
          </el-col>
          <el-col :span="12">
            <el-statistic
              title="本月工時"
              :value="stats.monthlyHours"
              suffix="小時"
            />
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Management,
  DataAnalysis,
  HomeFilled,
  User,
  UserFilled,
  Clock,
  Calendar,
  Money,
  Document,
  Setting,
  SwitchButton,
} from "@element-plus/icons-vue";
import { useStatsStore } from "./stores/stats";
import { useAuthStore } from "./stores/auth";

const router = useRouter();
const statsStore = useStatsStore();
const authStore = useAuthStore();

const windowWidth = ref(window.innerWidth);
const dashboardVisible = ref(false);

const isMobile = computed(() => windowWidth.value <= 768);

const stats = computed(() => statsStore.stats);

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

// 手機端導航(根據權限動態過濾)
const mobileNavs = [
  { path: "/", name: "首頁", icon: "HomeFilled" },
  { path: "/workers", name: "工讀生", icon: "User" },
  {
    path: "/attendance",
    name: "打卡",
    icon: "Clock",
    permission: "canClockIn",
  },
  { path: "/time-records", name: "工時", icon: "Calendar" },
  { path: "/salary", name: "薪資", icon: "Money" },
  {
    path: "/activity-logs",
    name: "日誌",
    icon: "Document",
    permission: "canViewReports",
  },
  {
    path: "/user-management",
    name: "用戶",
    icon: "Setting",
    adminOnly: true,
  },
  {
    path: "/groups",
    name: "組別",
    icon: "UserFilled",
    permission: "canEditWorkers",
  },
];

const visibleMobileNavs = computed(() => {
  return mobileNavs.filter((nav) => {
    // 如果是僅限管理員的選項,檢查是否為管理員
    if (nav.adminOnly) {
      return authStore.isAdmin;
    }
    // 如果有權限要求,檢查權限
    if (nav.permission) {
      return authStore.hasPermission(nav.permission) || authStore.isAdmin;
    }
    return true;
  });
});

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

const showDashboard = async () => {
  await statsStore.fetchStats();
  dashboardVisible.value = true;
};

// 登出處理
const handleLogout = async () => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      "確定要登出嗎？",
      "確認登出",
      {
        confirmButtonText: "確定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    if (confirmResult === "confirm") {
      await authStore.logout();
      ElMessage.success("已成功登出");
      router.push("/login");
    }
  } catch (error) {
    // 用戶取消登出
    if (error !== "cancel") {
      ElMessage.error("登出失敗");
    }
  }
};

onMounted(() => {
  window.addEventListener("resize", handleResize);

  // 初始化認證狀態
  authStore.initializeAuth();

  // 載入統計資料
  if (authStore.isLoggedIn) {
    statsStore.fetchStats();
  }
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

/* 手機端頂部 */
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

/* 手機端樣式調整 */
@media (max-width: 768px) {
  .app-main {
    padding: 0;
    padding-top: 65px; /* 為固定的手機頂部導航留出空間 */
    padding-bottom: 60px; /* 為固定的手機底部導航留出空間 */
    height: calc(100vh - 60px);
    overflow-y: auto;
    overflow-x: hidden;
  }

  .app-main::-webkit-scrollbar {
    width: 4px; /* 手機版更細的滾動條 */
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

/* 響應式調整 */
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
