<template>
  <div id="app">
    <!-- Â¶ÇÊ??®Áôª?•È??¢Ô??™È°ØÁ§∫Áôª?•Á?‰ª?-->
    <template v-if="$route.path === '/login'">
      <router-view />
    </template>

    <!-- ‰∏ªÊ??®Á???-->
    <template v-else>
      <el-container class="app-container">
        <!-- ?ÇÈÉ®Â∞éËà™ -->
        <el-header v-if="!isMobile" height="60px" class="app-header">
          <div class="header-content">
            <div class="logo">
              <el-icon size="24"><Management /></el-icon>
              <span>Â∑•Ë??üÁÆ°?ÜÂπ≥??/span>
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
                  Áµ±Ë?Ë≥áË?
                </el-button>
                <el-button type="danger" @click="handleLogout" plain>
                  <el-icon><SwitchButton /></el-icon>
                  ?ªÂá∫
                </el-button>
              </div>
            </div>
          </div>
        </el-header>

        <el-container>
          <!-- ?¥È?Â∞éËà™ -->
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
                <span>È¶ñÈ?</span>
              </el-menu-item>
              <el-menu-item index="/workers">
                <el-icon><User /></el-icon>
                <span>Â∑•Ë??üÁÆ°??/span>
              </el-menu-item>
              <el-menu-item
                v-if="authStore.canEditWorkers || authStore.isAdmin"
                index="/groups"
              >
                <el-icon><UserFilled /></el-icon>
                <span>ÁµÑÂà•ÁÆ°Á?</span>
              </el-menu-item>
              <el-menu-item
                v-if="authStore.hasPermission('canClockIn')"
                index="/attendance"
              >
                <el-icon><Clock /></el-icon>
                <span>?ìÂç°Á≥ªÁµ±</span>
              </el-menu-item>
              <el-menu-item index="/time-records">
                <el-icon><Calendar /></el-icon>
                <span>Â∑•Ê?Ë®òÈ?</span>
              </el-menu-item>
              <el-menu-item index="/salary">
                <el-icon><Money /></el-icon>
                <span>?™Ë?ÁÆ°Á?</span>
              </el-menu-item>
              <el-menu-item
                v-if="authStore.canViewReports || authStore.isAdmin"
                index="/activity-logs"
              >
                <el-icon><Document /></el-icon>
                <span>Ê¥ªÂ??•Ë?</span>
              </el-menu-item>
              <el-menu-item v-if="authStore.isAdmin" index="/user-management">
                <el-icon><Setting /></el-icon>
                <span>?®Êà∂ÁÆ°Á?</span>
              </el-menu-item>
            </el-menu>
          </el-aside>

          <!-- ‰∏ªÂÖßÂÆπÂ???-->
          <el-main class="app-main">
            <router-view />
          </el-main>
        </el-container>

        <!-- ?ãÊ?Á´ØÈ???-->
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
              ?ªÂá∫
            </el-button>
          </div>
        </el-header>

        <!-- ?ãÊ?Á´ØÂ??®Â???-->
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

    <!-- Áµ±Ë?Ë≥áË?ÂΩàÁ? -->
    <el-dialog
      v-model="dashboardVisible"
      title="Áµ±Ë?Ë≥áË?"
      :width="isMobile ? '95%' : '500px'"
      center
    >
      <div class="dashboard-content">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-statistic title="Á∏ΩÂ∑•ËÆÄ?üÊï∏" :value="stats.totalWorkers" />
          </el-col>
          <el-col :span="12">
            <el-statistic title="Á∏ΩÁ??•Êï∏" :value="stats.totalGroups" />
          </el-col>
          <el-col :span="12">
            <el-statistic title="‰ªäÊó•?ìÂç°" :value="stats.todayClockedIn" />
          </el-col>
          <el-col :span="12">
            <el-statistic
              title="?¨Ê?Â∑•Ê?"
              :value="stats.monthlyHours"
              suffix="Â∞èÊ?"
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

// ?®Êà∂ËßíËâ≤È°ØÁ§∫
const userRoleText = computed(() => {
  switch (authStore.userRole) {
    case "admin":
      return "ÁÆ°Á???;
    case "leader":
      return "Â∞èÁ???;
    case "reader":
      return "Ë®™ÂÆ¢";
    default:
      return "?™Áü•";
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

// ?ãÊ?Á´ØÂ????πÊ?Ê¨äÈ??ïÊ??éÊøæ)
const mobileNavs = [
  { path: "/", name: "È¶ñÈ?", icon: "HomeFilled" },
  { path: "/workers", name: "Â∑•Ë???, icon: "User" },
  {
    path: "/attendance",
    name: "?ìÂç°",
    icon: "Clock",
    permission: "canClockIn",
  },
  { path: "/time-records", name: "Â∑•Ê?", icon: "Calendar" },
  { path: "/salary", name: "?™Ë?", icon: "Money" },
  {
    path: "/activity-logs",
    name: "?•Ë?",
    icon: "Document",
    permission: "canViewReports",
  },
  {
    path: "/user-management",
    name: "?®Êà∂",
    icon: "Setting",
    adminOnly: true,
  },
  {
    path: "/groups",
    name: "ÁµÑÂà•",
    icon: "UserFilled",
    permission: "canEditWorkers",
  },
];

const visibleMobileNavs = computed(() => {
  return mobileNavs.filter((nav) => {
    // Â¶ÇÊ??ØÂ??êÁÆ°?ÜÂì°?ÑÈÅ∏??Ê™¢Êü•?ØÂê¶?∫ÁÆ°?ÜÂì°
    if (nav.adminOnly) {
      return authStore.isAdmin;
    }
    // Â¶ÇÊ??âÊ??êË?Ê±?Ê™¢Êü•Ê¨äÈ?
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

// ?ªÂá∫?ïÁ?
const handleLogout = async () => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      "Á¢∫Â?Ë¶ÅÁôª?∫Â?Ôº?,
      "Á¢∫Ë??ªÂá∫",
      {
        confirmButtonText: "Á¢∫Â?",
        cancelButtonText: "?ñÊ?",
        type: "warning",
      },
    );

    if (confirmResult === "confirm") {
      await authStore.logout();
      ElMessage.success("Â∑≤Ê??üÁôª??);
      router.push("/login");
    }
  } catch (error) {
    // ?®Êà∂?ñÊ??ªÂá∫
    if (error !== "cancel") {
      ElMessage.error("?ªÂá∫Â§±Ê?");
    }
  }
};

onMounted(() => {
  window.addEventListener("resize", handleResize);

  // ?ùÂ??ñË?Ë≠âÁ???
  authStore.initializeAuth();

  // ËºâÂÖ•Áµ±Ë?Ë≥áÊ?
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

/* ?ãÊ?Á´ØÈ???*/
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

/* ?ãÊ?Á´ØÊ®£ÂºèË™ø??*/
@media (max-width: 768px) {
  .app-main {
    padding: 0;
    padding-top: 65px; /* ?∫Âõ∫ÂÆöÁ??ãÊ??ÇÈÉ®Â∞éËà™?ôÂá∫Á©∫È? */
    padding-bottom: 60px; /* ?∫Âõ∫ÂÆöÁ??ãÊ?Â∫ïÈÉ®Â∞éËà™?ôÂá∫Á©∫È? */
    height: calc(100vh - 60px);
    overflow-y: auto;
    overflow-x: hidden;
  }

  .app-main::-webkit-scrollbar {
    width: 4px; /* ?ãÊ??àÊõ¥Á¥∞Á?ÊªæÂ?Ê¢?*/
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

/* ?øÊ?ÂºèË™ø??*/
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
