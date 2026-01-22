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
                  ?�出
                </el-button>
              </div>
            </div>
          </div>
        </el-header>

        <el-container>
          <!-- ?��?導航 -->
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
                v-if="authStore.canEditWorkers || authStore.isAdmin"
                index="/floors"
              >
                <el-icon><OfficeBuilding /></el-icon>
                <span>樓層管理</span>
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
                <span>活動資料</span>
              </el-menu-item>
              <el-menu-item v-if="authStore.isAdmin" index="/user-management">
                <el-icon><Setting /></el-icon>
                <span>用戶管理</span>
              </el-menu-item>
            </el-menu>
          </el-aside>

          <!-- 主內容�???-->
          <el-main class="app-main">
            <router-view />
          </el-main>
        </el-container>

        <!-- ?��?端�???-->
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
              ?�出
            </el-button>
          </div>
        </el-header>

        <!-- ?��?端�??��???-->
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

    <!-- 統�?資�?彈�? -->
    <el-dialog
      v-model="dashboardVisible"
      title="統�?資�?"
      :width="isMobile ? '95%' : '500px'"
      center
    >
      <div class="dashboard-content">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-statistic title="總工讀?�數" :value="stats.totalWorkers" />
          </el-col>
          <el-col :span="12">
            <el-statistic title="總�??�數" :value="stats.totalGroups" />
          </el-col>
          <el-col :span="12">
            <el-statistic title="今日?�卡" :value="stats.todayClockedIn" />
          </el-col>
          <el-col :span="12">
            <el-statistic
              title="?��?工�?"
              :value="stats.monthlyHours"
              suffix="小�?"
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
  OfficeBuilding,
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

// 底部端點配置(需要權限過濾)
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
    name: "活動",
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
    // 如�??��??�管?�員?�選??檢查?�否?�管?�員
    if (nav.adminOnly) {
      return authStore.isAdmin;
    }
    // 如�??��??��?�?檢查權�?
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

onMounted(() => {
  window.addEventListener("resize", handleResize);

  // ?��??��?證�???
  authStore.initializeAuth();

  // 載入統�?資�?
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
