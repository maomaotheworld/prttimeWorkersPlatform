<template>
  <div class="attendance-container">
    <div class="page-header">
      <h1 class="page-title">打卡系統</h1>
      <div class="current-time">
        <el-icon><Clock /></el-icon>
        {{ currentTime }}
      </div>
    </div>

    <!-- 數據篩選區域 -->
    <el-card class="filter-card mb-20">
      <el-row :gutter="16" class="filter-row">
        <el-col :xs="24" :sm="8">
          <el-form-item label="分組顯示">
            <el-radio-group v-model="groupBy" @change="handleGroupChange">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="floor">樓層</el-radio-button>
              <el-radio-button label="group">組別</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="8" v-if="groupBy === 'floor'">
          <el-form-item label="選擇樓層">
            <el-select
              v-model="selectedFloor"
              @change="filterWorkers"
              clearable
              placeholder="選擇樓層"
            >
              <el-option
                v-for="floor in availableFloors"
                :key="floor"
                :label="`${floor}樓`"
                :value="floor"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="8" v-if="groupBy === 'group'">
          <el-form-item label="選擇組別">
            <el-select
              v-model="selectedGroup"
              @change="filterWorkers"
              clearable
              placeholder="選擇組別"
            >
              <el-option
                v-for="group in groups"
                :key="group.id"
                :label="group.name"
                :value="group.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>

    <!-- 工讀生考勤列表 -->
    <el-card class="attendance-list-card">
      <template #header>
        <div class="card-header">
          <span>工讀生考勤狀態 ({{ filteredWorkers.length }}人)</span>
          <div class="header-actions">
            <el-button
              type="primary"
              size="small"
              @click="refreshData"
              :loading="loading"
            >
              <el-icon><Refresh /></el-icon>
              重新整理
            </el-button>
          </div>
        </div>
      </template>

      <div class="table-container">
        <el-table
          v-loading="loading"
          :data="filteredWorkers"
          stripe
          class="attendance-table"
          :height="tableHeight"
        >
          <el-table-column prop="number" label="編號" width="80" sortable />

          <el-table-column prop="name" label="姓名" min-width="100" />

          <el-table-column prop="floor" label="樓層" width="70">
            <template #default="{ row }"> {{ row.floor || "-" }}樓</template>
          </el-table-column>

          <el-table-column prop="groupId" label="組別" min-width="90">
            <template #default="{ row }">
              <el-tag
                v-if="getGroupName(row.groupId)"
                size="small"
                :style="{
                  backgroundColor: getGroupColor(row.groupId),
                  border: 'none',
                  color: getTextColor(getGroupColor(row.groupId)),
                  fontWeight: '500',
                }"
              >
                {{ getGroupName(row.groupId) }}
              </el-tag>
              <span v-else class="info-text">未分組</span>
            </template>
          </el-table-column>

          <el-table-column label="打卡狀態" min-width="140">
            <template #default="{ row }">
              <div class="attendance-status">
                <div v-if="row.todayAttendance?.clockIn" class="status-item">
                  <el-tag type="success" size="small">
                    上班 {{ formatTime(row.todayAttendance.clockIn) }}
                  </el-tag>
                </div>
                <div v-if="row.todayAttendance?.clockOut" class="status-item">
                  <el-tag type="warning" size="small">
                    下班 {{ formatTime(row.todayAttendance.clockOut) }}
                  </el-tag>
                </div>
                <div v-if="!row.todayAttendance?.clockIn" class="status-item">
                  <el-tag type="info" size="small">未打卡</el-tag>
                </div>
                <div
                  v-else-if="
                    row.todayAttendance?.clockIn &&
                    !row.todayAttendance?.clockOut
                  "
                  class="status-item"
                >
                  <el-tag type="primary" size="small">工作中</el-tag>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            label="操作"
            :width="isMobile ? 80 : 200"
            fixed="right"
          >
            <template #default="{ row }">
              <div class="action-buttons">
                <!-- 上班打卡按鈕 -->
                <el-button
                  v-if="!row.todayAttendance?.clockIn"
                  type="success"
                  size="small"
                  @click="handleQuickClock(row, 'in')"
                  :loading="row.clocking"
                >
                  上班打卡
                </el-button>

                <!-- 下班打卡按鈕 -->
                <el-button
                  v-else-if="!row.todayAttendance?.clockOut"
                  type="warning"
                  size="small"
                  @click="handleQuickClock(row, 'out')"
                  :loading="row.clocking"
                >
                  下班打卡
                </el-button>

                <!-- 編輯時間按鈕 -->
                <el-button
                  type="primary"
                  size="small"
                  @click="showEditTimeDialog(row)"
                  plain
                >
                  編輯時間
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 編輯打卡時間對話框 -->
    <el-dialog
      v-model="editTimeDialogVisible"
      title="編輯打卡時間"
      :width="isMobile ? '95%' : '500px'"
      center
    >
      <el-form :model="timeEditForm" label-width="100px">
        <el-form-item label="工讀生">
          <el-input
            :value="`${timeEditForm.workerNumber} - ${timeEditForm.workerName}`"
            readonly
          />
        </el-form-item>

        <el-form-item label="上班時間">
          <el-date-picker
            v-model="timeEditForm.clockIn"
            type="datetime"
            placeholder="選擇上班時間"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="下班時間">
          <el-date-picker
            v-model="timeEditForm.clockOut"
            type="datetime"
            placeholder="選擇下班時間"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="備註">
          <el-input
            v-model="timeEditForm.note"
            type="textarea"
            :rows="3"
            placeholder="請輸入調整原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editTimeDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleTimeEdit"
            :loading="submitting"
          >
            確認修改
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import moment from "moment";
import { Clock, Refresh } from "@element-plus/icons-vue";
import { useWorkersStore } from "../stores/workers";
import { useGroupsStore } from "../stores/groups";
import { useAuthStore } from "../stores/auth";
import { getApiUrl } from "@/config/api";

const workersStore = useWorkersStore();
const groupsStore = useGroupsStore();
const authStore = useAuthStore();

// 響應式數據
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value <= 768);
const currentTime = ref(moment().format("YYYY/MM/DD HH:mm:ss"));

// 工讀生和組別數據
const workers = computed(() => workersStore.workers);
const groups = computed(() => groupsStore.groups);

// 篩選條件
const groupBy = ref("all");
const selectedFloor = ref("");
const selectedGroup = ref("");

// 篩選後的工讀生列表
const filteredWorkers = ref([]);

// 可用樓層清單
const availableFloors = computed(() => {
  const floors = [
    ...new Set(workers.value.map((w) => w.floor).filter((f) => f)),
  ];
  return floors.sort((a, b) => a - b);
});

// 載入狀態
const loading = ref(false);
const submitting = ref(false);

// 編輯時間對話框
const editTimeDialogVisible = ref(false);
const timeEditForm = ref({
  workerId: "",
  workerNumber: "",
  workerName: "",
  clockIn: "",
  clockOut: "",
  note: "",
});

// 表格高度
const tableHeight = computed(() => {
  return isMobile.value ? "calc(100vh - 350px)" : "calc(100vh - 300px)";
});

// 計時器定義
let timeInterval = null;

// 馬卡龍色彩配置（從Workers.vue複製）
const macaronColors = [
  "#FFB6C1",
  "#FFCCCB",
  "#FFE4E1",
  "#FFEFD5",
  "#FAFAD2",
  "#E6E6FA",
  "#F0E6FF",
  "#E0FFFF",
  "#F0FFFF",
  "#F5FFFA",
  "#FFF8DC",
  "#FFFACD",
  "#FFFAF0",
  "#FDF5E6",
  "#FAF0E6",
  "#FFE4B5",
  "#FFDAB9",
  "#FFE4B5",
  "#DDA0DD",
  "#D8BFD8",
  "#EE82EE",
  "#DA70D6",
  "#FF69B4",
  "#FFB6C1",
  "#FFA07A",
  "#F0E6FF",
  "#E6E6FA",
  "#D8BFD8",
  "#DDA0DD",
  "#EE82EE",
];

// 工具函數
const formatTime = (timeString) => {
  return moment(timeString).format("HH:mm");
};

const updateCurrentTime = () => {
  currentTime.value = moment().format("YYYY/MM/DD HH:mm:ss");
};

const getGroupName = (groupId) => {
  if (!groupId) return "";
  const group = groups.value.find((g) => g.id === groupId);
  return group ? group.name : "";
};

const getGroupColor = (groupId) => {
  if (!groupId) return macaronColors[0];
  const groupIndex = groups.value.findIndex((g) => g.id === groupId);
  return macaronColors[groupIndex % macaronColors.length];
};

const getTextColor = (backgroundColor) => {
  const color = backgroundColor.replace("#", "");
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#333333" : "#ffffff";
};

// 事件處理
const handleGroupChange = () => {
  selectedFloor.value = "";
  selectedGroup.value = "";
  filterWorkers();
};

const filterWorkers = () => {
  let filtered = [...workers.value];

  if (groupBy.value === "floor" && selectedFloor.value) {
    filtered = filtered.filter((w) => w.floor === selectedFloor.value);
  } else if (groupBy.value === "group" && selectedGroup.value) {
    filtered = filtered.filter((w) => w.groupId === selectedGroup.value);
  }

  // 為每位工讀生添加今日出勤狀態
  filteredWorkers.value = filtered.map((worker) => ({
    ...worker,
    todayAttendance: worker.todayAttendance || null,
    clocking: false,
  }));
};

// 快速打卡功能
const handleQuickClock = async (worker, type) => {
  try {
    // 設定該工讀生載入狀態
    worker.clocking = true;

    const endpoint =
      type === "in" ? "/time-records/clock-in" : "/time-records/clock-out";
    const action = type === "in" ? "上班" : "下班";

    const token = localStorage.getItem("auth_token");
    const response = await fetch(getApiUrl(`/api${endpoint}`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ workerId: worker.id }),
    });

    const data = await response.json();

    if (data.success) {
      ElMessage.success(`${worker.name} ${action}打卡成功`);
      // 重新載入數據
      await loadTodayAttendance();
    } else {
      throw new Error(data.message || "打卡失敗");
    }
  } catch (error) {
    console.error(`${worker.name} 打卡失敗:`, error);
    ElMessage.error(`${worker.name} 打卡失敗: ` + (error.message || error));
  } finally {
    worker.clocking = false;
  }
};

// 顯示編輯時間對話框
const showEditTimeDialog = (worker) => {
  timeEditForm.value = {
    workerId: worker.id,
    workerNumber: worker.number,
    workerName: worker.name,
    clockIn: worker.todayAttendance?.clockIn || "",
    clockOut: worker.todayAttendance?.clockOut || "",
    note: "",
  };
  editTimeDialogVisible.value = true;
};

// 處理時間編輯
const handleTimeEdit = async () => {
  try {
    submitting.value = true;

    const token = authStore.token;
    const response = await fetch(getApiUrl("/api/time-records/edit-time"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workerId: timeEditForm.value.workerId,
        clockIn: timeEditForm.value.clockIn,
        clockOut: timeEditForm.value.clockOut,
        note: timeEditForm.value.note,
        date: moment().format("YYYY-MM-DD"),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "時間編輯失敗");
    }

    ElMessage.success("打卡時間修改成功");
    editTimeDialogVisible.value = false;

    // 重新載入數據
    await loadTodayAttendance();
  } catch (error) {
    console.error("時間編輯失敗:", error);
    ElMessage.error(error.message || "時間編輯失敗");
  } finally {
    submitting.value = false;
  }
};

// 載入今日考勤記錄
const loadTodayAttendance = async () => {
  try {
    const today = moment().format("YYYY-MM-DD");
    const token = authStore.token;
    const response = await fetch(getApiUrl(`/api/time-records?date=${today}`), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "載入考勤記錄失敗");
    }

    // 後端返回格式：{ success: true, data: [...], message: "..." }
    const records = result.data || [];

    // 為每位工讀生設定今日出勤狀態
    workers.value.forEach((worker) => {
      const attendance = records.find(
        (record) => record.workerId === worker.id,
      );
      worker.todayAttendance = attendance || null;
    });

    // 重新篩選
    filterWorkers();
  } catch (error) {
    console.error("載入今日考勤記錄失敗:", error);
  }
};

// 重新整理數據
const refreshData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      workersStore.fetchWorkers(),
      groupsStore.fetchGroups(),
      loadTodayAttendance(),
    ]);
  } catch (error) {
    console.error("重新整理數據失敗:", error);
  } finally {
    loading.value = false;
  }
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener("resize", handleResize);

  // 啟動計時器定時更新
  timeInterval = setInterval(updateCurrentTime, 1000);

  // 載入初始數據
  refreshData();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
.attendance-container {
  padding: 20px;
  height: 100%;
  overflow: auto;
}

/* 自定義滾動條樣式 */
.attendance-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.attendance-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.attendance-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.attendance-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  margin: 0;
  color: #303133;
}

.current-time {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mb-20 {
  margin-bottom: 20px;
}

.filter-card .el-form-item {
  margin-bottom: 0;
}

.filter-row .el-col {
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.table-container {
  overflow-x: auto;
}

.attendance-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-item {
  display: flex;
  justify-content: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  margin: 0;
}

.info-text {
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* ?��?端適??*/
@media (max-width: 768px) {
  .attendance-container {
    padding: 12px;
    padding-bottom: 60px; /* ?��?機�??��??��??�空??*/
    height: 100%;
    overflow: auto;
  }

  .attendance-container::-webkit-scrollbar {
    width: 4px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .current-time {
    font-size: 16px;
    justify-content: center;
  }

  .filter-row .el-col {
    margin-bottom: 16px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }

  .action-buttons .el-button {
    font-size: 11px;
    padding: 2px 6px;
    height: 24px;
    min-height: 24px;
  }

  .attendance-table .el-table__cell {
    padding: 8px 4px;
  }

  .attendance-status {
    gap: 2px;
  }
}
</style>
