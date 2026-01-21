<template>
  <div class="time-records-container">
    <div class="page-header">
      <h1 class="page-title">工時記錄</h1>
      <el-button type="primary" @click="showAddAdditionalDialog" :icon="Plus">
        新增額外工時
      </el-button>
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

    <!-- 工時記錄表格 -->
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
            <span v-else-if="row.clockIn" class="warning-text">進行中</span>
            <span v-else class="info-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="正常工時" width="100">
          <template #default="{ row }">
            {{ row.totalHours || 0 }} 小時
          </template>
        </el-table-column>

        <el-table-column label="額外工時" width="120">
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

        <el-table-column label="總工時" width="100">
          <template #default="{ row }">
            <strong>
              {{ ((row.totalHours || 0) + (row.additionalHours || 0)).toFixed(1) }} 小時
            </strong>
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
                style="margin: 2px;"
              >
                {{ adj.hours > 0 ? '+' : '' }}{{ adj.hours }}h: {{ adj.reason }}
              </el-tag>
            </div>
            <span v-else class="info-text">-</span>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="records.length === 0 && !loading" class="empty-state">
        <el-icon size="48"><DocumentRemove /></el-icon>
        <p>暫無工時記錄</p>
      </div>
    </el-card>

    <!-- 新增額外工時對話框 -->
    <el-dialog
      v-model="additionalDialogVisible"
      title="時數調整"
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
            <el-radio-button label="add">新增工時</el-radio-button>
            <el-radio-button label="subtract">扣除工時</el-radio-button>
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
          <span style="font-size: 12px; color: #909399; margin-left: 8px;">
            {{ additionalForm.adjustmentType === 'add' ? '將新增' : '將扣除' }} {{ additionalForm.hours }} 小時
          </span>
        </el-form-item>

        <el-form-item label="理由" prop="reason">
          <el-input
            v-model="additionalForm.reason"
            type="textarea"
            :rows="3"
            :placeholder="additionalForm.adjustmentType === 'add' ? '請說明加班或額外工時的理由' : '請說明扣除工時的理由'"
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
          新增
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import moment from "moment";
import { Plus, DocumentRemove } from "@element-plus/icons-vue";
import { useWorkersStore } from "../stores/workers";
import { useAuthStore } from "../stores/auth";

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
  reason: [{ required: true, message: "請說明理由", trigger: "blur" }],
};

const additionalFormRef = ref();

// 工具函數
const formatDate = (date) => moment(date).format("MM/DD");
const formatTime = (time) => moment(time).format("HH:mm");

const getWorkerName = (workerId) => {
  const worker = workers.value.find((w) => w.id === workerId);
  return worker ? worker.name : "未知";
};

const getWorkerNumber = (workerId) => {
  const worker = workers.value.find((w) => w.id === workerId);
  return worker ? worker.number : "";
};

// 數據操作
const fetchRecords = async () => {
  try {
    loading.value = true;
    let url = "http://localhost:3005/api/time-records";
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
      throw new Error(result.message || "載入工時記錄失敗");
    }

    // 後端返回格式為 { success: true, data: [...], message: "..." }
    records.value = result.data || [];
  } catch (error) {
    console.error("載入工時記錄失敗:", error);
    ElMessage.error(error.message || "載入工時記錄失敗");
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
    await additionalFormRef.value.validate();
    submitting.value = true;

    const token = authStore.token;
    const response = await fetch("http://localhost:3005/api/time-records/additional-hours", {
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
      throw new Error(result.message || "時數調整失敗");
    }

    const actionText = additionalForm.value.adjustmentType === "add" ? "新增" : "扣除";
    ElMessage.success(`時數${actionText}成功`);
    additionalDialogVisible.value = false;
    await fetchRecords();
  } catch (error) {
    console.error("額外工時新增失敗:", error);
    ElMessage.error(error.message || "額外工時新增失敗");
  } finally {
    submitting.value = false;
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
