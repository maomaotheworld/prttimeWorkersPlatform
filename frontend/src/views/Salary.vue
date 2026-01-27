<template>
  <div class="salary-container">
    <div class="page-header">
      <h1 class="page-title">薪資管理</h1>
    </div>

    <!-- 薪資計算區域 -->
    <el-card class="calculation-card mb-20">
      <template #header>
        <div class="card-header">
          <span>薪資計算</span>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="8">
          <el-form-item label="選擇工讀生">
            <el-select
              v-model="selectedWorker"
              placeholder="請選擇工讀生"
              style="width: 100%"
              @change="handleWorkerChange"
            >
              <el-option
                v-for="worker in workers"
                :key="worker.id"
                :label="`${worker.number} - ${worker.name}`"
                :value="worker.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="計算期間">
            <el-date-picker
              v-model="dateRange"
              type="monthrange"
              range-separator="至"
              start-placeholder="開始月份"
              end-placeholder="結束月份"
              format="YYYY/MM"
              value-format="YYYY-MM"
              @change="handleDateChange"
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-button
            type="primary"
            @click="calculateSalary"
            :loading="calculating"
            :disabled="!selectedWorker"
          >
            計算薪資
          </el-button>
          <el-button
            @click="refreshData"
            :loading="calculating"
            style="margin-left: 10px"
          >
            重新載入
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 薪資詳細資訊 -->
    <el-card v-if="salaryData" class="salary-detail-card mb-20">
      <template #header>
        <div class="card-header">
          <span
            >薪資詳情 - {{ salaryData.worker.name }} ({{
              salaryData.period.startDate
            }}
            至{{ salaryData.period.endDate }})</span
          >
        </div>
      </template>

      <el-row :gutter="16" class="salary-overview">
        <el-col :xs="24" :sm="6">
          <div class="salary-item">
            <div class="salary-label">基本時薪</div>
            <div class="salary-value">
              {{ salaryData.worker.baseHourlyWage }} 元
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6">
          <div class="salary-item">
            <div class="salary-label">工作天數</div>
            <div class="salary-value">
              {{ salaryData.workTime.workingDays }} 天
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6">
          <div class="salary-item">
            <div class="salary-label">總工時</div>
            <div class="salary-value">
              {{ salaryData.workTime.totalSalaryHours }}
              小時
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6">
          <div class="salary-item total">
            <div class="salary-label">總薪資</div>
            <div class="salary-value">
              {{ salaryData.salary.totalSalary }} 元
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <h3>工時明細</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="基本工時">
              <strong style="color: #67c23a"
                >{{ salaryData.workTime.baseWorkingHours }} 小時</strong
              >
              <el-text type="success" size="small">
                ({{ salaryData.workTime.workingDays }} 天 ×
                {{ salaryData.worker.baseWorkingHours }} 小時/天)
              </el-text>
            </el-descriptions-item>
            <el-descriptions-item label="加班工時">
              <strong style="color: #e6a23c"
                >{{ salaryData.workTime.totalAdditionalHours }} 小時</strong
              >
            </el-descriptions-item>
            <el-descriptions-item label="薪資計算工時">
              <strong style="color: #409eff"
                >{{ salaryData.workTime.totalSalaryHours }} 小時</strong
              >
              <el-text type="primary" size="small">
                ({{ salaryData.workTime.baseWorkingHours }} +
                {{ salaryData.workTime.totalAdditionalHours }})
              </el-text>
            </el-descriptions-item>
          </el-descriptions>
        </el-col>

        <el-col :xs="24" :sm="12">
          <h3>薪資計算</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="基本薪資">
              <div>
                <strong style="font-size: 16px; color: #67c23a"
                  >{{ salaryData.salary.baseSalary }} 元</strong
                >
              </div>
              <div style="font-size: 14px; color: #409eff; margin-top: 4px">
                {{ salaryData.worker.baseHourlyWage }} 元/時 ×
                {{ salaryData.workTime.totalSalaryHours }} 小時 =
                {{ salaryData.salary.baseSalary }} 元
              </div>
            </el-descriptions-item>
            <el-descriptions-item
              label="額外薪資"
              v-if="salaryData.salary.extraSalary !== 0"
            >
              <span
                :class="
                  salaryData.salary.extraSalary >= 0
                    ? 'success-text'
                    : 'error-text'
                "
              >
                {{ salaryData.salary.extraSalary >= 0 ? "+" : ""
                }}{{ salaryData.salary.extraSalary }} 元
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="總薪資">
              <strong style="font-size: 18px; color: #f56c6c">
                {{ salaryData.salary.totalSalary }} 元
              </strong>
              <div style="font-size: 12px; color: #666; margin-top: 4px">
                基本薪資 {{ salaryData.salary.baseSalary }} 元{{
                  salaryData.salary.extraSalary !== 0
                    ? ` + 額外薪資 ${salaryData.salary.extraSalary} 元`
                    : ""
                }}
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
    </el-card>

    <!-- 薪資調整 -->
    <el-card class="adjustment-card mb-20">
      <template #header>
        <div class="card-header">
          <span>薪資調整</span>
          <div>
            <el-button
              type="success"
              size="small"
              @click="showTotalSalaryDialog"
              :disabled="!selectedWorker"
              style="margin-right: 8px"
            >
              調整總薪資
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="showAdjustmentDialog"
              :disabled="!selectedWorker"
            >
              新增調整
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loadingAdjustments" :data="adjustments" stripe>
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>

        <el-table-column label="工讀生" min-width="120">
          <template #default="{ row }">
            {{ getWorkerName(row.workerId) }}
          </template>
        </el-table-column>

        <el-table-column prop="type" label="類型" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.type === 'increase' ? 'success' : 'danger'"
              size="small"
            >
              {{ row.type === "increase" ? "加薪" : "減薪" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="amount" label="金額" width="100">
          <template #default="{ row }">
            <span
              :class="row.type === 'increase' ? 'success-text' : 'error-text'"
            >
              {{ row.type === "increase" ? "+" : "-" }}{{ row.amount }} 元
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="reason" label="原因" min-width="150" />
      </el-table>

      <div
        v-if="adjustments.length === 0 && !loadingAdjustments"
        class="empty-state"
      >
        <el-icon size="48"><DocumentRemove /></el-icon>
        <p>暫無薪資調整記錄</p>
      </div>
    </el-card>

    <!-- 薪資調整對話框 -->
    <el-dialog
      v-model="adjustmentDialogVisible"
      title="新增薪資調整"
      :width="isMobile ? '95%' : '500px'"
    >
      <el-form
        ref="adjustmentFormRef"
        :model="adjustmentForm"
        :rules="adjustmentFormRules"
        label-width="80px"
      >
        <el-form-item label="工讀生" prop="workerId">
          <el-select
            v-model="adjustmentForm.workerId"
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

        <el-form-item label="調整類型" prop="type">
          <el-radio-group v-model="adjustmentForm.type">
            <el-radio label="increase">加薪</el-radio>
            <el-radio label="decrease">減薪</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="調整金額" prop="amount">
          <el-input-number
            v-model="adjustmentForm.amount"
            :min="1"
            :step="10"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="調整原因" prop="reason">
          <el-input
            v-model="adjustmentForm.reason"
            type="textarea"
            :rows="3"
            placeholder="請說明薪資調整的原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="adjustmentDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleAddAdjustment"
          :loading="submitting"
        >
          確認
        </el-button>
      </template>
    </el-dialog>

    <!-- 調整總薪資對話框 -->
    <el-dialog
      v-model="totalSalaryDialogVisible"
      title="調整總薪資"
      :width="isMobile ? '95%' : '600px'"
    >
      <el-alert
        title="說明"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        直接設定這位工讀生本月的總薪資金額（包含所有工時和額外薪資）
      </el-alert>

      <el-form
        ref="totalSalaryFormRef"
        :model="totalSalaryForm"
        :rules="totalSalaryFormRules"
        label-width="120px"
      >
        <el-form-item label="工讀生" prop="workerId">
          <el-select
            v-model="totalSalaryForm.workerId"
            placeholder="請選擇工讀生"
            style="width: 100%"
            @change="handleTotalSalaryWorkerChange"
          >
            <el-option
              v-for="worker in workers"
              :key="worker.id"
              :label="`${worker.number} - ${worker.name}`"
              :value="worker.id"
            />
          </el-select>
        </el-form-item>

        <el-divider />

        <el-form-item label="有效工時">
          <el-input
            :value="effectiveWorkHours + ' 小時'"
            disabled
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="目前時薪">
          <el-input
            :value="currentWage + ' 元/小時'"
            disabled
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="目前總薪資">
          <el-input
            :value="currentEstimatedSalary + ' 元'"
            disabled
            style="width: 100%"
          />
        </el-form-item>

        <el-divider />

        <el-form-item label="目標總薪資" prop="targetTotalSalary">
          <el-input-number
            v-model="totalSalaryForm.targetTotalSalary"
            :min="0"
            :step="100"
            :precision="0"
            style="width: 100%"
          />
          <span style="font-size: 12px; color: #909399; margin-left: 8px">
            元
          </span>
        </el-form-item>

        <el-form-item
          label="薪資調整預覽"
          v-if="totalSalaryForm.targetTotalSalary && currentEstimatedSalary"
        >
          <div style="padding: 10px; background: #f5f7fa; border-radius: 4px">
            <div style="margin-bottom: 8px">
              目前預估薪資：<strong>{{ currentEstimatedSalary }} 元</strong>
            </div>
            <div style="margin-bottom: 8px">
              目標總薪資：<strong
                >{{ totalSalaryForm.targetTotalSalary }} 元</strong
              >
            </div>
            <div>
              調整金額：
              <el-tag
                :type="salaryAdjustment >= 0 ? 'success' : 'danger'"
                style="margin-left: 8px"
              >
                {{ salaryAdjustment >= 0 ? "+" : "" }}{{ salaryAdjustment }} 元
              </el-tag>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="調整理由" prop="reason">
          <el-input
            v-model="totalSalaryForm.reason"
            type="textarea"
            :rows="3"
            placeholder="請說明調整總薪資的原因，例如：本月績效優秀、專案完成獎勵"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="totalSalaryDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleTotalSalaryAdjust"
          :loading="submitting"
          :disabled="
            !totalSalaryForm.targetTotalSalary ||
            totalSalaryForm.targetTotalSalary <= 0
          "
        >
          確認調整
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import moment from "moment";
import { DocumentRemove } from "@element-plus/icons-vue";
import { useWorkersStore } from "../stores/workers";

const workersStore = useWorkersStore();

const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value <= 768);

const workers = computed(() => workersStore.workers);

const selectedWorker = ref("");
const dateRange = ref([moment().format("YYYY-MM"), moment().format("YYYY-MM")]);

const salaryData = ref(null);
const adjustments = ref([]);
const calculating = ref(false);
const loadingAdjustments = ref(false);
const submitting = ref(false);

// 薪資調整對話框
const adjustmentDialogVisible = ref(false);
const adjustmentForm = ref({
  workerId: "",
  type: "increase",
  amount: 100,
  reason: "",
});

const adjustmentFormRules = {
  workerId: [{ required: true, message: "請選擇工讀生", trigger: "change" }],
  type: [{ required: true, message: "請選擇調整類型", trigger: "change" }],
  amount: [{ required: true, message: "請輸入調整金額", trigger: "blur" }],
  reason: [{ required: true, message: "請說明原因", trigger: "blur" }],
};

const adjustmentFormRef = ref();

// 調整總薪資對話框
const totalSalaryDialogVisible = ref(false);
const totalSalaryForm = ref({
  workerId: "",
  targetTotalSalary: 0,
  reason: "",
});

const totalSalaryFormRules = {
  workerId: [{ required: true, message: "請選擇工讀生", trigger: "change" }],
  targetTotalSalary: [
    { required: true, message: "請輸入目標總薪資", trigger: "blur" },
  ],
  reason: [{ required: true, message: "請說明調整原因", trigger: "blur" }],
};

const totalSalaryFormRef = ref();

// 計算工時數據
const currentPeriodHours = computed(() => {
  if (!salaryData.value) return 0;
  const regular = salaryData.value.workTime?.totalRegularHours || 0;
  const additional = salaryData.value.workTime?.totalAdditionalHours || 0;
  return regular + additional;
});

// 實際工作時數（只包含正常工時）
const actualWorkHours = computed(() => {
  if (!salaryData.value) return 0;
  return salaryData.value.workTime?.totalRegularHours || 0;
});

// 薪資計算工時（基本工時 + 加班工時）
const totalWorkHours = computed(() => {
  if (!salaryData.value) return 0;
  return salaryData.value.workTime?.totalSalaryHours || 0;
});

// 薪資計算工時（基本工時 + 加班工時）
const effectiveWorkHours = computed(() => {
  if (!salaryData.value) return 0;
  return salaryData.value.workTime?.totalSalaryHours || 0;
});

// 目前時薪
const currentWage = computed(() => {
  if (!totalSalaryForm.value.workerId) return 0;
  const worker = workers.value.find(
    (w) => w.id === totalSalaryForm.value.workerId,
  );
  return worker ? worker.baseHourlyWage || 0 : 0;
});

// 目前預估薪資（使用後端相同邏輯）
const currentEstimatedSalary = computed(() => {
  if (!salaryData.value) return 0;

  // 直接使用後端計算的總薪資
  return salaryData.value.salary?.totalSalary || 0;
});

// 薪資調整金額（目標總薪資與目前預估薪資的差額）
const salaryAdjustment = computed(() => {
  if (!totalSalaryForm.value.targetTotalSalary) return 0;
  return totalSalaryForm.value.targetTotalSalary - currentEstimatedSalary.value;
});

// 工具函數
const formatDate = (date) => moment(date).format("YYYY/MM/DD");

const getWorkerName = (workerId) => {
  const worker = workers.value.find((w) => w.id === workerId);
  return worker ? worker.name : "未知";
};

// 薪資計算
const calculateSalary = async () => {
  if (!selectedWorker.value || !dateRange.value) return;

  try {
    calculating.value = true;
    const startDate = moment(dateRange.value[0])
      .startOf("month")
      .format("YYYY-MM-DD");
    const endDate = moment(dateRange.value[1])
      .endOf("month")
      .format("YYYY-MM-DD");

    const response = await fetch(
      `/api/workers/${selectedWorker.value}/salary-calculation?startDate=${startDate}&endDate=${endDate}`,
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "薪資計算失敗");
    }

    // 後端返回格式：{ success: true, data: {...}, message: "..." }
    salaryData.value = result.data;
  } catch (error) {
    console.error("薪資計算失敗:", error);
    ElMessage.error(error.message || "薪資計算失敗");
  } finally {
    calculating.value = false;
  }
};

// 重新載入數據
const refreshData = async () => {
  if (selectedWorker.value) {
    await Promise.all([calculateSalary(), fetchAdjustments()]);
    ElMessage.success("數據已重新載入");
  } else {
    ElMessage.warning("請先選擇工讀生");
  }
};

// 載入薪資調整記錄
const fetchAdjustments = async () => {
  try {
    loadingAdjustments.value = true;
    let url = "/api/salary-adjustments";
    if (selectedWorker.value) {
      url += `?workerId=${selectedWorker.value}`;
    }

    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "載入薪資調整記錄失敗");
    }

    // 後端返回格式：{ success: true, data: [...], message: "..." }
    adjustments.value = result.data || [];
  } catch (error) {
    ElMessage.error(error.message || "載入薪資調整記錄失敗");
  } finally {
    loadingAdjustments.value = false;
  }
};

// 事件處理
const handleWorkerChange = () => {
  salaryData.value = null;
  if (selectedWorker.value) {
    fetchAdjustments();
  }
};

const handleDateChange = () => {
  if (selectedWorker.value && dateRange.value) {
    calculateSalary();
  }
};

const showAdjustmentDialog = () => {
  adjustmentForm.value = {
    workerId: selectedWorker.value,
    type: "increase",
    amount: 100,
    reason: "",
  };
  adjustmentDialogVisible.value = true;
};

const showTotalSalaryDialog = () => {
  if (!salaryData.value) {
    ElMessage.warning("請先計算薪資以獲取工作數據");
    return;
  }

  totalSalaryForm.value = {
    workerId: selectedWorker.value,
    targetTotalSalary: currentEstimatedSalary.value,
    reason: "",
  };
  totalSalaryDialogVisible.value = true;
};

const handleTotalSalaryWorkerChange = async () => {
  // 當選擇工讀生變更時，重新計算該工讀生的薪資數據
  if (totalSalaryForm.value.workerId && dateRange.value) {
    await calculateSalaryForWorker(totalSalaryForm.value.workerId);
  }
};

const calculateSalaryForWorker = async (workerId) => {
  try {
    calculating.value = true;
    const startDate = moment(dateRange.value[0])
      .startOf("month")
      .format("YYYY-MM-DD");
    const endDate = moment(dateRange.value[1])
      .endOf("month")
      .format("YYYY-MM-DD");

    const response = await fetch(
      `/api/workers/${workerId}/salary-calculation?startDate=${startDate}&endDate=${endDate}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "薪資計算失敗");
    }

    salaryData.value = result.data;
  } catch (error) {
    console.error("薪資計算失敗:", error);
    ElMessage.error(error.message || "薪資計算失敗");
  } finally {
    calculating.value = false;
  }
};

const handleTotalSalaryAdjust = async () => {
  try {
    await totalSalaryFormRef.value.validate();
    submitting.value = true;

    const response = await fetch("/api/salary-adjustments/total", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workerId: totalSalaryForm.value.workerId,
        targetTotalSalary: totalSalaryForm.value.targetTotalSalary,
        reason: totalSalaryForm.value.reason,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "總薪資設定失敗");
    }

    ElMessage.success(
      `總薪資設定成功！設定為 ${result.data.targetTotalSalary} 元`,
    );

    totalSalaryDialogVisible.value = false;

    // 重新載入薪資調整記錄
    await fetchAdjustments();

    // 重新計算薪資
    if (selectedWorker.value) {
      await calculateSalary();
    }
  } catch (error) {
    console.error("總薪資調整失敗", error);
    ElMessage.error(error.message || "總薪資調整失敗");
  } finally {
    submitting.value = false;
  }
};

const handleAddAdjustment = async () => {
  try {
    await adjustmentFormRef.value.validate();
    submitting.value = true;

    const response = await fetch("/api/salary-adjustments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(adjustmentForm.value),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "薪資調整紀錄失敗");
    }

    ElMessage.success("薪資調整紀錄成功");
    adjustmentDialogVisible.value = false;
    await fetchAdjustments();

    // 重新計算薪資
    if (selectedWorker.value) {
      await calculateSalary();
    }
  } catch (error) {
    console.error("薪資調整紀錄失敗:", error);
    ElMessage.error(error.message || "薪資調整紀錄失敗");
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  workersStore.fetchWorkers();
});
</script>

<style scoped>
.salary-container {
  padding: 20px;
  height: 100%;
  overflow: auto;
}

/* 自定義滾動條樣式 */
.salary-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.salary-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.salary-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.salary-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.salary-overview {
  margin-bottom: 20px;
}

.salary-item {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.salary-item.total {
  background-color: #e3f2fd;
  border: 2px solid #409eff;
}

.salary-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.salary-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.salary-item.total .salary-value {
  color: #409eff;
  font-size: 28px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

@media (max-width: 768px) {
  .salary-container {
    padding: 12px;
    height: 100%;
    overflow: auto;
  }

  .salary-container::-webkit-scrollbar {
    width: 4px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .salary-item {
    padding: 16px;
    margin-bottom: 12px;
  }

  .salary-value {
    font-size: 20px;
  }

  .salary-item.total .salary-value {
    font-size: 24px;
  }
}
</style>
