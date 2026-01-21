<template>
  <div class="activity-logs-container">
    <div class="page-header">
      <h1 class="page-title">Ê¥ªÂ??•Ë?</h1>
      <div class="page-actions">
        <el-button
          type="danger"
          @click="handleClearLogs"
          :icon="Delete"
          :disabled="logs.length === 0"
        >
          Ê∏ÖÁ©∫?•Ë?
        </el-button>
        <el-button
          type="primary"
          @click="fetchLogs"
          :icon="Refresh"
          :loading="loading"
        >
          ?çÊñ∞?¥Á?
        </el-button>
      </div>
    </div>

    <!-- ÁØ©ÈÅ∏??-->
    <div class="filters">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-select
            v-model="filters.entityType"
            placeholder="?∏Ê?ÂØ¶È?È°ûÂ?"
            clearable
            @change="fetchLogs"
          >
            <el-option label="Â∑•Ë??? value="worker" />
            <el-option label="?ÇÈ?Ë®òÈ?" value="time-record" />
            <el-option label="Ê¥ªÂ??•Ë?" value="activity-logs" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select
            v-model="filters.action"
            placeholder="?∏Ê??ï‰?"
            clearable
            @change="fetchLogs"
          >
            <el-option label="?∞Â?" value="create" />
            <el-option label="?¥Êñ∞" value="update" />
            <el-option label="?™Èô§" value="delete" />
            <el-option label="‰∏äÁè≠?ìÂç°" value="clock-in" />
            <el-option label="‰∏ãÁè≠?ìÂç°" value="clock-out" />
            <el-option label="?ÇÊï∏Ë™øÊï¥" value="time-adjust" />
            <el-option label="Ê∏ÖÁ©∫?•Ë?" value="clear" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-input
            v-model="searchText"
            placeholder="?úÂ??•Ë??ßÂÆπ"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="6">
          <div class="stats">Á∏ΩÂÖ± {{ totalLogs }} Ê¢ùË???/div>
        </el-col>
      </el-row>
    </div>

    <!-- ?•Ë??óË°® -->
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

      <el-empty v-else description="?´ÁÑ°Ê¥ªÂ??•Ë?" />
    </div>

    <!-- ?ÜÈ? -->
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
import api from "../utils/api";

// ?øÊ?ÂºèÊï∏??
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

// Ë®àÁ?Â±¨ÊÄ?
const filteredLogs = computed(() => {
  if (!searchText.value) return logs.value;

  return logs.value.filter(
    (log) =>
      log.entityName.includes(searchText.value) ||
      log.details.includes(searchText.value) ||
      getActionText(log.action).includes(searchText.value),
  );
});

// ?≤Â??•Ë??óË°®
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

    const response = await api.get("/activity-logs", { params });
    logs.value = response.data.data;
    totalLogs.value = response.data.total;
    totalPages.value = response.data.totalPages;
  } catch (error) {
    ElMessage.error("?≤Â?Ê¥ªÂ??•Ë?Â§±Ê?");
    console.error("?≤Â?Ê¥ªÂ??•Ë?Â§±Ê?:", error);
  } finally {
    loading.value = false;
  }
};

// Ê∏ÖÁ©∫?•Ë?
const handleClearLogs = async () => {
  try {
    await ElMessageBox.confirm(
      "Á¢∫Â?Ë¶ÅÊ?Á©∫Ê??âÊ¥ª?ïÊó•Ë™åÂ?ÔºüÊ≠§?ç‰??°Ê?Âæ©Â???,
      "Á¢∫Ë?Ê∏ÖÁ©∫",
      {
        confirmButtonText: "Á¢∫Â?",
        cancelButtonText: "?ñÊ?",
        type: "warning",
      },
    );

    await api.delete("/activity-logs");
    ElMessage.success("Ê¥ªÂ??•Ë?Â∑≤Ê?Á©?);
    await fetchLogs();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("Ê∏ÖÁ©∫Ê¥ªÂ??•Ë?Â§±Ê?");
    }
  }
};

// ?úÂ??ïÁ?
const handleSearch = () => {
  // ?úÂ??èËºØ?®Ë?ÁÆóÂ±¨?ß‰∏≠?ïÁ?
};

// ?ÜÈ??ïÁ?
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchLogs();
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchLogs();
};

// ?ºÂ??ñÊ???
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

// ?≤Â??ÇÈ?Ëª∏È???
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

// ?≤Â??ï‰??ñÊ?
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

// ?≤Â??ï‰?Ê®ôÁ±§È°ûÂ?
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

// ?≤Â??ï‰??áÂ?
const getActionText = (action) => {
  const actionMap = {
    create: "?∞Â?",
    update: "?¥Êñ∞",
    delete: "?™Èô§",
    "clock-in": "‰∏äÁè≠?ìÂç°",
    "clock-out": "‰∏ãÁè≠?ìÂç°",
    "time-adjust": "?ÇÊï∏Ë™øÊï¥",
    clear: "Ê∏ÖÁ©∫?•Ë?",
  };
  return actionMap[action] || action;
};

// ?≤Â?ÂØ¶È?È°ûÂ??áÂ?
const getEntityTypeText = (entityType) => {
  const typeMap = {
    worker: "Â∑•Ë???,
    "time-record": "?ÇÈ?Ë®òÈ?",
    "activity-logs": "Ê¥ªÂ??•Ë?",
  };
  return typeMap[entityType] || entityType;
};

// ?ùÂ???
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

/* ?øÊ?ÂºèË®≠Ë®?*/
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
