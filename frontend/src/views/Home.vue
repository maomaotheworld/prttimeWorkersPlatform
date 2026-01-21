<template>
  <div class="home-container">
    <div class="welcome-section">
      <el-card class="welcome-card">
        <div class="welcome-content">
          <el-icon size="48" class="welcome-icon"><Management /></el-icon>
          <h1 class="welcome-title">Ê≠°Ë?‰ΩøÁî®Â∑•Ë??üÁÆ°?ÜÂπ≥??/h1>
          <p class="welcome-desc">È´òÊ?ÁÆ°Á?Â∑•Ë??üÂ∑•?Ç„ÄÅËñ™Ë≥áË?ÁµÑÂà•?ÑÂ?Ê•≠Âπ≥??/p>
        </div>
      </el-card>
    </div>

    <div class="stats-section">
      <h2 class="section-title">Á≥ªÁµ±Ê¶ÇÊ?</h2>
      <div class="stats-grid">
        <el-card class="stat-card">
          <el-statistic title="Á∏ΩÂ∑•ËÆÄ?üÊï∏" :value="stats.totalWorkers">
            <template #prefix>
              <el-icon style="vertical-align: middle"><User /></el-icon>
            </template>
          </el-statistic>
        </el-card>

        <el-card class="stat-card">
          <el-statistic title="Á∏ΩÁ??•Êï∏" :value="stats.totalGroups">
            <template #prefix>
              <el-icon style="vertical-align: middle"><UserFilled /></el-icon>
            </template>
          </el-statistic>
        </el-card>

        <el-card class="stat-card">
          <el-statistic title="‰ªäÊó•?ìÂç°" :value="stats.todayClockedIn">
            <template #prefix>
              <el-icon style="vertical-align: middle"><Clock /></el-icon>
            </template>
          </el-statistic>
        </el-card>

        <el-card class="stat-card">
          <el-statistic
            title="?¨Ê?Á∏ΩÂ∑•??
            :value="stats.monthlyHours"
            suffix="Â∞èÊ?"
          >
            <template #prefix>
              <el-icon style="vertical-align: middle"><Calendar /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </div>
    </div>

    <div class="quick-actions">
      <h2 class="section-title">Âø´ÈÄüÊ?‰Ω?/h2>
      <div class="actions-grid">
        <el-card
          v-for="action in quickActions"
          :key="action.name"
          class="action-card"
          @click="$router.push(action.path)"
          shadow="hover"
        >
          <div class="action-content">
            <el-icon size="32" :color="action.color">
              <component :is="action.icon" />
            </el-icon>
            <h3>{{ action.name }}</h3>
            <p>{{ action.desc }}</p>
          </div>
        </el-card>
      </div>
    </div>

    <div class="recent-section" v-if="!isMobile">
      <h2 class="section-title">?ÄËøëÂ???/h2>
      <el-card>
        <el-timeline>
          <el-timeline-item
            v-for="activity in recentActivities"
            :key="activity.id"
            :timestamp="activity.timestamp"
            :color="activity.color"
          >
            {{ activity.content }}
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  Management,
  User,
  UserFilled,
  Clock,
  Calendar,
  Money,
  Plus,
  Edit,
} from "@element-plus/icons-vue";
import { useStatsStore } from "../stores/stats";

const statsStore = useStatsStore();

const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value <= 768);
const stats = computed(() => statsStore.stats);

const quickActions = [
  {
    name: "Â∑•Ë??üÁÆ°??,
    desc: "?∞Â??ÅÁ∑®ËºØÂ∑•ËÆÄ?üË???,
    icon: "User",
    color: "#409EFF",
    path: "/workers",
  },
  {
    name: "?ìÂç°Á≥ªÁµ±",
    desc: "Â∑•Ë??üÊ??°Á∞Ω?∞Á∞Ω?Ä",
    icon: "Clock",
    color: "#67C23A",
    path: "/attendance",
  },
  {
    name: "Â∑•Ê?Ë®òÈ?",
    desc: "?•Á??åÁÆ°?ÜÂ∑•?ÇË???,
    icon: "Calendar",
    color: "#E6A23C",
    path: "/time-records",
  },
  {
    name: "?™Ë?ÁÆ°Á?",
    desc: "Ë®àÁ??åË™ø?¥Â∑•ËÆÄ?üËñ™Ë≥?,
    icon: "Money",
    color: "#F56C6C",
    path: "/salary",
  },
];

const recentActivities = ref([
  {
    id: 1,
    content: "Á≥ªÁµ±?ùÂ??ñÂ???,
    timestamp: new Date().toLocaleString(),
    color: "#409EFF",
  },
  {
    id: 2,
    content: "Ê≠°Ë?‰ΩøÁî®Â∑•Ë??üÁÆ°?ÜÂπ≥??,
    timestamp: new Date().toLocaleString(),
    color: "#67C23A",
  },
]);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
  statsStore.fetchStats();
});
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.welcome-section {
  margin-bottom: 32px;
}

.welcome-card {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.welcome-card :deep(.el-card__body) {
  padding: 40px 20px;
}

.welcome-content {
  color: white;
}

.welcome-icon {
  margin-bottom: 16px;
}

.welcome-title {
  font-size: 28px;
  margin-bottom: 8px;
  font-weight: 600;
}

.welcome-desc {
  font-size: 16px;
  opacity: 0.9;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #303133;
}

.stats-section {
  margin-bottom: 32px;
}

.stat-card {
  text-align: center;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.quick-actions {
  margin-bottom: 32px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.action-content h3 {
  margin: 12px 0 8px;
  font-size: 18px;
  color: #303133;
}

.action-content p {
  color: #606266;
  font-size: 14px;
  margin: 0;
}

.recent-section {
  margin-top: 32px;
}

/* ?ãÊ?Á´ØÈÅ©??*/
@media (max-width: 768px) {
  .home-container {
    padding: 12px;
  }

  .welcome-title {
    font-size: 24px;
  }

  .welcome-desc {
    font-size: 14px;
  }

  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .action-content h3 {
    font-size: 16px;
    margin: 8px 0 4px;
  }

  .action-content p {
    font-size: 12px;
  }

  .section-title {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
