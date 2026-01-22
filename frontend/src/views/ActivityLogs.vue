<template>
  <div class="activity-logs-container">
    <div class="page-header">
      <h1 class="page-title">活動日誌</h1>
      <div class="page-actions">
        <el-button
          type="danger"
          @click="handleClearLogs"
          :icon="Delete"
          :disabled="logs.length === 0"
        >
          清空日誌
        </el-button>
        <el-button
          type="primary"
          @click="fetchLogs"
          :icon="Refresh"
          :loading="loading"
        >
          重新整理
        </el-button>
      </div>
    </div>

    <!-- 篩選器 -->
    <div class="filters">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-select
            v-model="filters.entityType"
            placeholder="選擇實體類型"
            clearable
            @change="fetchLogs"
          >
            <el-option label="工讀生" value="worker" />
            <el-option label="工時記錄" value="time-record" />
            <el-option label="活動日誌" value="activity-logs" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="filters.action"
            placeholder="選擇操作"
            clearable
            @change="fetchLogs"
          >
            <el-option label="新增" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="刪除" value="delete" />
            <el-option label="上班打卡" value="clock-in" />
            <el-option label="下班打卡" value="clock-out" />
            <el-option label="工時調整" value="time-adjust" />
            <el-option label="清空日誌" value="clear" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input
            v-model="searchText"
            placeholder="搜尋日誌內容"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="6">
          <div class="stats">總共 {{ totalLogs }} 條記錄</div>
        </el-col>
      </el-row>
    </div>

    <!-- 日誌列表 -->
    <div class="logs-content">
      <el-timeline v-if="filteredLogs.length > 0">
        <el-timeline-item
          v-for="log in filteredLogs"
          :key="log.id"
          :timestamp="formatTime(log.timestamp)"
          placement="top"
          :type="getTimelineType(log.action)"
          :icon="getActionIcon(log.action)"
        >
          <el-card class="log-card" shadow="hover">
            <div class="log-content">
              <div class="log-header">
                <div class="log-title">
                  <el-tag :type="getActionTagType(log.action)" size="small">
                    {{ getActionText(log.action) }}
                  </el-tag>
                  <span class="entity-name">{{ log.entityName }}</span>
                </div>
                <div class="entity-type">
                  <el-tag size="small" effect="plain">
                    {{ getEntityTypeText(log.entityType) }}
                  </el-tag>
                </div>
              </div>
              <div v-if="log.details" class="log-details">
                {{ log.details }}
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-else description="暫無活動日誌" />
    </div>

    <!-- 分頁 -->
    <div v-if="totalPages > 1" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalLogs"
        layout="prev, pager, next, sizes, total"
        :page-sizes="[20, 50, 100]"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Delete,
  Refresh,
  Search,
  Plus,
  Edit,
  Clock,
  DocumentCopy,
  User,
  Timer,
} from "@element-plus/icons-vue";
import { getApiUrl } from "../config/api";

// 響應式數據
const logs = ref([]);
const loading = ref(false);
const filters = ref({
  entityType: "",
  action: "",
});
const searchText = ref("");
const currentPage = ref(1);
const pageSize = ref(50);
const totalLogs = ref(0);
const totalPages = ref(0);

// 計算屬性
const filteredLogs = computed(() => {
  if (!searchText.value) return logs.value;

  return logs.value.filter(
    (log) =>
      log.entityName.includes(searchText.value) ||
      log.details.includes(searchText.value) ||
      getActionText(log.action).includes(searchText.value),
  );
});

// 獲取活動日誌列表
const fetchLogs = async () => {
  try {
    loading.value = true;
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
    };

    if (filters.value.entityType) {
      params.entityType = filters.value.entityType;
    }
    if (filters.value.action) {
      params.action = filters.value.action;
    }

    const token = localStorage.getItem("auth_token");
    const response = await fetch(
      getApiUrl("/api/activity-logs") + "?" + new URLSearchParams(params),
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      logs.value = data.data || [];
      totalLogs.value = data.total || 0;
      totalPages.value = data.totalPages || 1;
    } else {
      throw new Error(data.message || "獲取活動日誌失敗");
    }
  } catch (error) {
    ElMessage.error("獲取活動日誌失敗: " + (error.message || error));
    console.error("獲取活動日誌失敗:", error);
    logs.value = [];
    totalLogs.value = 0;
    totalPages.value = 1;
  } finally {
    loading.value = false;
  }
};

// 清空日誌
const handleClearLogs = async () => {
  try {
    await ElMessageBox.confirm(
      "確定要清空所有活動日誌嗎？此操作不可恢復。",
      "確認清空",
      {
        confirmButtonText: "確定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    await fetch(`${getApiUrl()}/activity-logs`, {
      method: "DELETE",
    });
    ElMessage.success("活動日誌已清空");
    await fetchLogs();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("清空活動日誌失敗");
    }
  }
};

// 搜尋功能
const handleSearch = () => {
  // 搜尋邏輯在計算屬性中處理
};

// 分頁處理
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchLogs();
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchLogs();
};

// 格式化時間
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// 獲取時間軸類型
const getTimelineType = (action) => {
  switch (action) {
    case "create":
      return "success";
    case "update":
      return "primary";
    case "delete":
      return "danger";
    case "time-adjust":
      return "warning";
    default:
      return "info";
  }
};

// 獲取操作圖標
const getActionIcon = (action) => {
  switch (action) {
    case "create":
      return Plus;
    case "update":
      return Edit;
    case "delete":
      return Delete;
    case "clock-in":
    case "clock-out":
      return Clock;
    case "time-adjust":
      return Timer;
    case "clear":
      return DocumentCopy;
    default:
      return User;
  }
};

// 獲取操作標籤類型
const getActionTagType = (action) => {
  switch (action) {
    case "create":
      return "success";
    case "update":
      return "primary";
    case "delete":
      return "danger";
    case "time-adjust":
      return "warning";
    default:
      return "info";
  }
};

// 獲取操作文字
const getActionText = (action) => {
  const actionMap = {
    create: "新增",
    update: "更新",
    delete: "刪除",
    "clock-in": "上班打卡",
    "clock-out": "下班打卡",
    "time-adjust": "工時調整",
    clear: "清空日誌",
  };
  return actionMap[action] || action;
};

// 獲取實體類型文字
const getEntityTypeText = (entityType) => {
  const typeMap = {
    worker: "工讀生",
    "time-record": "工時記錄",
    "activity-logs": "活動日誌",
  };
  return typeMap[entityType] || entityType;
};

// 初始化
onMounted(() => {
  fetchLogs();
});
</script>

<style scoped>
.activity-logs-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-actions {
  display: flex;
  gap: 12px;
}

.filters {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats {
  line-height: 32px;
  color: #606266;
  font-size: 14px;
  text-align: right;
}

.logs-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.log-card {
  margin: 0;
}

.log-content {
  padding: 8px 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.entity-name {
  font-weight: 600;
  color: #303133;
}

.log-details {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .activity-logs-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .page-actions {
    justify-content: space-between;
  }

  .filters .el-row .el-col {
    margin-bottom: 12px;
  }

  .log-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
