<template>
  <div class="time-records-container">
    <div class="page-header">
      <h1 class="page-title">工作記錄</h1>
      <div style="display:flex; gap:8px;">
        <el-button type="primary" @click="showAddAdditionalDialog" :icon="Plus">
          輸入計薪工時
        </el-button>
        <el-button
          v-if="authStore.isEvelyn"
          type="danger"
          :icon="DeleteIcon"
          @click="handleClearAll"
        >
          一鍵清除全部
        </el-button>
      </div>
    </div>

    <!-- 篩選條件 -->
    <el-card class="filter-card mb-20">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="8">
          <el-select v-model="filterWorker" placeholder="選擇工讀生" clearable>
            <el-option label="全部工讀生" value="" />
            <el-option
              v-for="worker in workers"
              :key="worker.id"
              :label="`${worker.number} - ${worker.name}`"
              :value="worker.id"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
            format="YYYY/MM/DD"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-button type="primary" @click="fetchRecords">查詢</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 工作記錄表格 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="records"
        stripe
        class="responsive-table"
      >
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>

        <el-table-column label="工讀生" min-width="120">
          <template #default="{ row }">
            <div>
              <div>{{ getWorkerName(row.workerId) }}</div>
              <small class="info-text">{{
                getWorkerNumber(row.workerId)
              }}</small>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="上班時間" width="100">
          <template #default="{ row }">
            <span v-if="row.clockIn">
              {{ formatTime(row.clockIn) }}
            </span>
            <span v-else class="info-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="下班時間" width="100">
          <template #default="{ row }">
            <span v-if="row.clockOut">
              {{ formatTime(row.clockOut) }}
            </span>
            <span v-else-if="row.clockIn" class="warning-text">未打卡</span>
            <span v-else class="info-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="打卡工時（參考）" width="120">
          <template #default="{ row }">
            <span style="color: #909399">
              {{ row.totalHours || 0 }} 小時
            </span>
          </template>
        </el-table-column>

        <el-table-column label="計薪工時" width="120">
          <template #default="{ row }">
            <span v-if="row.additionalHours > 0" class="success-text">
              +{{ row.additionalHours }} 小時
            </span>
            <span v-else-if="row.additionalHours < 0" class="danger-text">
              {{ row.additionalHours }} 小時
            </span>
            <span v-else class="info-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="薪資計算工時" width="120">
          <template #default="{ row }">
            <strong>
              {{ (row.additionalHours || 0).toFixed(1) }}
              小時
            </strong>
          </template>
        </el-table-column>

        <el-table-column label="操作者" width="120">
          <template #default="{ row }">
            <span v-if="row.adjustedBy" class="info-text">
              {{ row.adjustedBy }}
            </span>
            <span v-else class="info-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="操作時間" width="140">
          <template #default="{ row }">
            <span v-if="row.adjustedAt" class="info-text">
              {{ formatDateTime(row.adjustedAt) }}
            </span>
            <span v-else class="info-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="調整記錄" min-width="200">
          <template #default="{ row }">
            <div v-if="row.adjustments && row.adjustments.length > 0">
              <el-tag
                v-for="(adj, index) in row.adjustments"
                :key="index"
                :type="adj.hours > 0 ? 'success' : 'danger'"
                size="small"
                style="margin: 2px"
              >
                {{ adj.hours > 0 ? "+" : "" }}{{ adj.hours }}h: {{ adj.reason }}
                <small v-if="adj.operatorName" class="operator-info">
                  - by {{ adj.operatorName }}</small
                >
              </el-tag>
            </div>
            <span v-else class="info-text">-</span>
          </template>
        </el-table-column>

        <el-table-column v-if="authStore.isEvelyn" label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              :icon="DeleteIcon"
              circle
              @click="handleDeleteRecord(row)"
            />
          </template>
        </el-table-column>
      </el-table>

      <div v-if="records.length === 0 && !loading" class="empty-state">
        <el-icon size="48"><DocumentRemove /></el-icon>
        <p>暫無工作記錄</p>
      </div>
    </el-card>

    <!-- 新增計薪工時對話框 -->
    <el-dialog
      v-model="additionalDialogVisible"
      title="輸入計薪工時"
      :width="isMobile ? '95%' : '500px'"
    >
      <el-form
        ref="additionalFormRef"
        :model="additionalForm"
        :rules="additionalFormRules"
        label-width="80px"
      >
        <el-form-item label="工讀生" prop="workerId">
          <el-select
            v-model="additionalForm.workerId"
            placeholder="請選擇工讀生"
            style="width: 100%"
          >
            <el-option
              v-for="worker in workers"
              :key="worker.id"
              :label="`${worker.number} - ${worker.name}`"
              :value="worker.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="additionalForm.date"
            type="date"
            placeholder="選擇日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="調整類型" prop="adjustmentType">
          <el-radio-group v-model="additionalForm.adjustmentType">
            <el-radio-button label="add">輸入計薪工時</el-radio-button>
            <el-radio-button label="subtract">扣除計薪工時</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="時數" prop="hours">
          <el-input-number
            v-model="additionalForm.hours"
            :min="0.1"
            :max="24"
            :step="0.5"
            :precision="1"
            style="width: 100%"
          />
          <span style="font-size: 12px; color: #909399; margin-left: 8px">
            {{ additionalForm.adjustmentType === "add" ? "計入計薪工時" : "扣除計薪工時" }}
            {{ additionalForm.hours }} 小時
          </span>
        </el-form-item>

        <el-form-item label="備註" prop="reason">
          <el-input
            v-model="additionalForm.reason"
            type="textarea"
            :rows="3"
            :placeholder="
              additionalForm.adjustmentType === 'add'
                ? '請輸入工時說明（如：上午 9:00-12:00，共 3 小時）'
                : '請說明扣除計薪工時的原因'
            "
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="additionalDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleAddAdditional"
          :loading="submitting"
        >
          確認
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import moment from "moment";
import { Plus, DocumentRemove, Delete as DeleteIcon } from "@element-plus/icons-vue";
import { useWorkersStore } from "../stores/workers";
import { useAuthStore } from "../stores/auth";
import { getApiUrl } from "@/config/api";

const workersStore = useWorkersStore();
const authStore = useAuthStore();

const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value <= 768);

const workers = computed(() => workersStore.workers);

const records = ref([]);
const loading = ref(false);
const submitting = ref(false);

// 篩選條件
const filterWorker = ref("");
const dateRange = ref([
  moment().startOf("month").format("YYYY-MM-DD"),
  moment().endOf("month").format("YYYY-MM-DD"),
]);

// 額外工時對話框
const additionalDialogVisible = ref(false);
const additionalForm = ref({
  workerId: "",
  date: new Date(),
  hours: 1,
  reason: "",
  adjustmentType: "add", // 預設為新增工時
});

const additionalFormRules = {
  workerId: [{ required: true, message: "請選擇工讀生", trigger: "change" }],
  date: [{ required: true, message: "請選擇日期", trigger: "change" }],
  hours: [{ required: true, message: "請輸入額外工時", trigger: "blur" }],
  reason: [{ required: true, message: "請說明原因", trigger: "blur" }],
};

const additionalFormRef = ref();

// 工具函數
const formatDate = (date) => moment(date).format("MM/DD");
const formatTime = (time) => moment(time).format("HH:mm");
const formatDateTime = (datetime) => moment(datetime).format("MM/DD HH:mm");

const getWorkerName = (workerId) => {
  const worker = workers.value.find((w) => w.id === workerId);
  return worker ? worker.name : "未知";
};

const getWorkerNumber = (workerId) => {
  const worker = workers.value.find((w) => w.id === workerId);
  return worker ? worker.number : "";
};

// 獲取數據
const fetchRecords = async () => {
  try {
    loading.value = true;
    let url = getApiUrl("/api/time-records");
    const params = [];

    if (filterWorker.value) {
      params.push(`workerId=${filterWorker.value}`);
    }

    if (dateRange.value && dateRange.value[0]) {
      params.push(`startDate=${dateRange.value[0]}`);
      params.push(`endDate=${dateRange.value[1]}`);
    }

    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    const token = authStore.token;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "載入工作記錄失敗");
    }

    // 後端返回格式：{ success: true, data: [...], message: "..." }
    const rawRecords = result.data || [];

    // 按日期和創建時間降序排序，新記錄在上
    records.value = rawRecords.sort((a, b) => {
      // 首先按日期降序排序
      const dateComparison = new Date(b.date) - new Date(a.date);
      if (dateComparison !== 0) {
        return dateComparison;
      }

      // 如果日期相同，按創建時間降序排序
      const createdAtA = new Date(a.createdAt || a.date);
      const createdAtB = new Date(b.createdAt || b.date);
      return createdAtB - createdAtA;
    });
  } catch (error) {
    console.error("載入工作記錄失敗:", error);
    ElMessage.error(error.message || "載入工作記錄失敗");
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  filterWorker.value = "";
  dateRange.value = [
    moment().startOf("month").format("YYYY-MM-DD"),
    moment().endOf("month").format("YYYY-MM-DD"),
  ];
  fetchRecords();
};

const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    fetchRecords();
  }
};

const showAddAdditionalDialog = () => {
  additionalForm.value = {
    workerId: "",
    date: new Date(),
    hours: 1,
    reason: "",
    adjustmentType: "add", // 預設為新增工時
  };
  additionalDialogVisible.value = true;
};

const handleAddAdditional = async () => {
  try {
    if (!additionalFormRef.value) return;
    await additionalFormRef.value.validate();
    submitting.value = true;

    const token = authStore.token;
    const response = await fetch(getApiUrl("/api/time-records/additional-hours"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workerId: additionalForm.value.workerId,
        date: moment(additionalForm.value.date).format("YYYY-MM-DD"),
        hours: additionalForm.value.hours,
        reason: additionalForm.value.reason,
        adjustmentType: additionalForm.value.adjustmentType, // 添加調整類型
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "工時調整失敗");
    }

    const actionText =
      additionalForm.value.adjustmentType === "add" ? "輸入" : "扣除";
    ElMessage.success(`計薪工時${actionText}成功`);
    additionalDialogVisible.value = false;
    await fetchRecords();
  } catch (error) {
    console.error("額外工時新增失敗:", error);
    ElMessage.error(error.message || "額外工時新增失敗");
  } finally {
    submitting.value = false;
  }
};

const handleDeleteRecord = async (row) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除 ${getWorkerName(row.workerId)} 在 ${formatDate(row.date)} 的這筆記錄嗎？`,
      "確認刪除",
      { confirmButtonText: "刪除", cancelButtonText: "取消", type: "warning" }
    );
    const token = authStore.token;
    const res = await fetch(getApiUrl(`/api/time-records/${row.id}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "刪除失敗");
    ElMessage.success("已刪除");
    await fetchRecords();
  } catch (e) {
    if (e !== "cancel") ElMessage.error(e.message || "刪除失敗");
  }
};

const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm(
      "確定要清除「所有」工時記錄嗎？此操作無法復原！",
      "⚠️ 第一次確認",
      { confirmButtonText: "繼續", cancelButtonText: "取消", type: "warning" }
    );
    await ElMessageBox.confirm(
      "再次確認：將永久刪除全部工時記錄，確定嗎？",
      "⚠️ 第二次確認",
      { confirmButtonText: "確定清除", cancelButtonText: "取消", type: "error" }
    );
    const token = authStore.token;
    const res = await fetch(getApiUrl("/api/time-records/all/clear"), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "清除失敗");
    ElMessage.success(result.message);
    await fetchRecords();
  } catch (e) {
    if (e !== "cancel") ElMessage.error(e.message || "清除失敗");
  }
};

onMounted(() => {
  workersStore.fetchWorkers();
  fetchRecords();
});
</script>

<style scoped>
.time-records-container {
  padding: 20px;
  height: 100%;
  overflow: auto;
}

/* 自定義滾動條樣式 */
.time-records-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.time-records-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.time-records-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.time-records-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.filter-card .el-col {
  margin-bottom: 8px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.operator-info {
  color: #909399;
  font-size: 11px;
  margin-left: 4px;
}

@media (max-width: 768px) {
  .time-records-container {
    padding: 12px;
    height: 100%;
    overflow: auto;
  }

  .time-records-container::-webkit-scrollbar {
    width: 4px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .filter-card .el-col {
    margin-bottom: 12px;
  }
}
</style>
