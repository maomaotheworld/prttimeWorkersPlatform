<template>
  <div class="salary-container">
    <div class="page-header">
      <h1 class="page-title">?��?管�?</h1>
    </div>

    <!-- ?��?計�??�??-->
    <el-card class="calculation-card mb-20">
      <template #header>
        <div class="card-header">
          <span>?��?計�?</span>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="8">
          <el-form-item label="?��?工�???>
            <el-select
              v-model="selectedWorker"
              placeholder="請選?�工讀??
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
          <el-form-item label="計�??��?">
            <el-date-picker
              v-model="dateRange"
              type="monthrange"
              range-separator="??
              start-placeholder="?��??�份"
              end-placeholder="結�??�份"
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
            計�??��?
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- ?��?詳細資�? -->
    <el-card v-if="salaryData" class="salary-detail-card mb-20">
      <template #header>
        <div class="card-header">
          <span
            >?��?詳�? - {{ salaryData.worker.name }} ({{
              salaryData.period.startDate
            }}
            ??{{ salaryData.period.endDate }})</span
          >
        </div>
      </template>

      <el-row :gutter="16" class="salary-overview">
        <el-col :xs="24" :sm="6">
          <div class="salary-item">
            <div class="salary-label">?�本?�薪</div>
            <div class="salary-value">
              {{ salaryData.worker.baseHourlyWage }} ??
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6">
          <div class="salary-item">
            <div class="salary-label">工�?天數</div>
            <div class="salary-value">
              {{ salaryData.workTime.workingDays }} �?
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6">
          <div class="salary-item">
            <div class="salary-label">總工??/div>
            <div class="salary-value">
              {{
                salaryData.workTime.totalRegularHours +
                salaryData.workTime.totalAdditionalHours
              }}
              小�?
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6">
          <div class="salary-item total">
            <div class="salary-label">總薪�?/div>
            <div class="salary-value">
              {{ salaryData.salary.totalSalary }} ??
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <h3>工�?詳�?</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="�?��工�?">
              {{ salaryData.workTime.totalRegularHours }} 小�?
            </el-descriptions-item>
            <el-descriptions-item label="額�?工�?">
              {{ salaryData.workTime.totalAdditionalHours }} 小�?
            </el-descriptions-item>
            <el-descriptions-item label="工�?天數">
              {{ salaryData.workTime.workingDays }} �?
            </el-descriptions-item>
          </el-descriptions>
        </el-col>

        <el-col :xs="24" :sm="12">
          <h3>?��?計�?</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="?�本?��?">
              {{ salaryData.salary.baseSalary }} ??
            </el-descriptions-item>
            <el-descriptions-item label="額�??��?">
              {{ salaryData.salary.additionalSalary }} ??
            </el-descriptions-item>
            <el-descriptions-item label="?��?調整">
              <span
                :class="
                  salaryData.salary.totalAdjustments >= 0
                    ? 'success-text'
                    : 'error-text'
                "
              >
                {{ salaryData.salary.totalAdjustments >= 0 ? "+" : ""
                }}{{ salaryData.salary.totalAdjustments }} ??
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="總薪�?>
              <strong style="font-size: 18px; color: #409eff">
                {{ salaryData.salary.totalSalary }} ??
              </strong>
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
    </el-card>

    <!-- ?��?調整 -->
    <el-card class="adjustment-card mb-20">
      <template #header>
        <div class="card-header">
          <span>?��?調整</span>
          <div>
            <el-button
              type="success"
              size="small"
              @click="showTotalSalaryDialog"
              :disabled="!selectedWorker"
              style="margin-right: 8px;"
            >
              調整總薪�?
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="showAdjustmentDialog"
              :disabled="!selectedWorker"
            >
              ?��?調整
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loadingAdjustments" :data="adjustments" stripe>
        <el-table-column prop="date" label="?��?" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>

        <el-table-column label="工�??? min-width="120">
          <template #default="{ row }">
            {{ getWorkerName(row.workerId) }}
          </template>
        </el-table-column>

        <el-table-column prop="type" label="類�?" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.type === 'increase' ? 'success' : 'danger'"
              size="small"
            >
              {{ row.type === "increase" ? "?�薪" : "減薪" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="amount" label="?��?" width="100">
          <template #default="{ row }">
            <span
              :class="row.type === 'increase' ? 'success-text' : 'error-text'"
            >
              {{ row.type === "increase" ? "+" : "-" }}{{ row.amount }} ??
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="reason" label="?�由" min-width="150" />
      </el-table>

      <div
        v-if="adjustments.length === 0 && !loadingAdjustments"
        class="empty-state"
      >
        <el-icon size="48"><DocumentRemove /></el-icon>
        <p>?�無?��?調整記�?</p>
      </div>
    </el-card>

    <!-- ?��?調整對話�?-->
    <el-dialog
      v-model="adjustmentDialogVisible"
      title="?��??��?調整"
      :width="isMobile ? '95%' : '500px'"
    >
      <el-form
        ref="adjustmentFormRef"
        :model="adjustmentForm"
        :rules="adjustmentFormRules"
        label-width="80px"
      >
        <el-form-item label="工�??? prop="workerId">
          <el-select
            v-model="adjustmentForm.workerId"
            placeholder="請選?�工讀??
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

        <el-form-item label="調整類�?" prop="type">
          <el-radio-group v-model="adjustmentForm.type">
            <el-radio label="increase">?�薪</el-radio>
            <el-radio label="decrease">減薪</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="調整?��?" prop="amount">
          <el-input-number
            v-model="adjustmentForm.amount"
            :min="1"
            :step="10"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="調整?�由" prop="reason">
          <el-input
            v-model="adjustmentForm.reason"
            type="textarea"
            :rows="3"
            placeholder="請說?�薪資調?��??�由"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="adjustmentDialogVisible = false">?��?</el-button>
        <el-button
          type="primary"
          @click="handleAddAdjustment"
          :loading="submitting"
        >
          ?��?
        </el-button>
      </template>
    </el-dialog>

    <!-- 調整總薪資�?話�? -->
    <el-dialog
      v-model="totalSalaryDialogVisible"
      title="調整總薪�?
      :width="isMobile ? '95%' : '600px'"
    >
      <el-alert
        title="說�?"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        輸入要支付給工�??��?總薪�?系統將根?�工作�??�自?��?算新?��???
      </el-alert>

      <el-form
        ref="totalSalaryFormRef"
        :model="totalSalaryForm"
        :rules="totalSalaryFormRules"
        label-width="120px"
      >
        <el-form-item label="工�??? prop="workerId">
          <el-select
            v-model="totalSalaryForm.workerId"
            placeholder="請選?�工讀??
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

        <el-form-item label="?��?工�??�數">
          <el-input
            :value="currentPeriodHours + ' 小�?'"
            disabled
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="?��??�薪">
          <el-input
            :value="currentWage + ' ??小�?'"
            disabled
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="?��??�估?��?">
          <el-input
            :value="currentEstimatedSalary + ' ??"
            disabled
            style="width: 100%"
          />
        </el-form-item>

        <el-divider />

        <el-form-item label="調整後總?��?" prop="targetTotalSalary">
          <el-input-number
            v-model="totalSalaryForm.targetTotalSalary"
            :min="0"
            :step="100"
            :precision="0"
            style="width: 100%"
            @change="calculateNewWage"
          />
          <span style="font-size: 12px; color: #909399; margin-left: 8px;">
            ??
          </span>
        </el-form-item>

        <el-form-item label="計�?後新?�薪" v-if="calculatedNewWage > 0">
          <el-tag type="primary" size="large" style="padding: 10px 15px;">
            {{ calculatedNewWage }} ??小�?
          </el-tag>
        </el-form-item>

        <el-form-item label="?�薪調整" v-if="calculatedNewWage > 0">
          <el-tag
            :type="wageAdjustment >= 0 ? 'success' : 'danger'"
            size="large"
            style="padding: 10px 15px;"
          >
            {{ wageAdjustment >= 0 ? '+' : '' }}{{ wageAdjustment }} ??小�?
            ({{ wageAdjustmentPercent }})
          </el-tag>
        </el-form-item>

        <el-form-item label="?��?調整" v-if="calculatedNewWage > 0">
          <el-tag
            :type="salaryAdjustment >= 0 ? 'success' : 'danger'"
            size="large"
            style="padding: 10px 15px;"
          >
            {{ salaryAdjustment >= 0 ? '+' : '' }}{{ salaryAdjustment }} ??
          </el-tag>
        </el-form-item>

        <el-form-item label="調整?�由" prop="reason">
          <el-input
            v-model="totalSalaryForm.reason"
            type="textarea"
            :rows="3"
            placeholder="請說?�調?�總?��??��??��?例�?：本?�績?��??�、�?案�??��?�?
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="totalSalaryDialogVisible = false">?��?</el-button>
        <el-button
          type="primary"
          @click="handleTotalSalaryAdjust"
          :loading="submitting"
          :disabled="calculatedNewWage <= 0"
        >
          確�?調整
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

// ?��?調整對話�?
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

// 調整總薪資�?話�?
const totalSalaryDialogVisible = ref(false);
const totalSalaryForm = ref({
  workerId: "",
  targetTotalSalary: 0,
  reason: "",
});

const totalSalaryFormRules = {
  workerId: [{ required: true, message: "請選擇工讀生", trigger: "change" }],
  targetTotalSalary: [{ required: true, message: "請輸入目標總薪資", trigger: "blur" }],
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

// ?��??�薪
const currentWage = computed(() => {
  if (!totalSalaryForm.value.workerId) return 0;
  const worker = workers.value.find(w => w.id === totalSalaryForm.value.workerId);
  return worker ? (worker.baseHourlyWage || 0) : 0;
});

// ?��??�估?��?
const currentEstimatedSalary = computed(() => {
  return Math.round(currentPeriodHours.value * currentWage.value);
});

// 計�?後�??��???
const calculatedNewWage = computed(() => {
  if (!totalSalaryForm.value.targetTotalSalary || currentPeriodHours.value === 0) return 0;
  return Math.round(totalSalaryForm.value.targetTotalSalary / currentPeriodHours.value);
});

// ?�薪調整
const wageAdjustment = computed(() => {
  return calculatedNewWage.value - currentWage.value;
});

// ?�薪調整?��?�?
const wageAdjustmentPercent = computed(() => {
  if (currentWage.value === 0) return '0%';
  const percent = ((wageAdjustment.value / currentWage.value) * 100).toFixed(1);
  return `${percent >= 0 ? '+' : ''}${percent}%`;
});

// ?��?調整?��?
const salaryAdjustment = computed(() => {
  return totalSalaryForm.value.targetTotalSalary - currentEstimatedSalary.value;
});

// 工具?�數
const formatDate = (date) => moment(date).format("YYYY/MM/DD");

const getWorkerName = (workerId) => {
  const worker = workers.value.find((w) => w.id === workerId);
  return worker ? worker.name : "?�知";
};

// ?��?計�?
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
      throw new Error(result.message || "?��?計�?失�?");
    }

    // 後端返�??��???{ success: true, data: {...}, message: "..." }
    salaryData.value = result.data;
  } catch (error) {
    console.error("?��?計�?失�?:", error);
    ElMessage.error(error.message || "?��?計�?失�?");
  } finally {
    calculating.value = false;
  }
};

// 載入?��?調整記�?
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
      throw new Error(result.message || "載入?��?調整記�?失�?");
    }

    // 後端返�??��???{ success: true, data: [...], message: "..." }
    adjustments.value = result.data || [];
  } catch (error) {
    console.error("載入?��?調整記�?失�?:", error);
  } finally {
    loadingAdjustments.value = false;
  }
};

// 事件?��?
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
    ElMessage.warning("請�?計�??��?以獲?�工作�???);
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
  // ?�選?�工讀?��?,?�新計�?該工讀?��??��??��?
  if (totalSalaryForm.value.workerId && dateRange.value) {
    await calculateSalaryForWorker(totalSalaryForm.value.workerId);
  }
};

const calculateNewWage = () => {
  // ?�輸?�目標總?��????�自?�觸??computed 計�??��???
};

const calculateSalaryForWorker = async (workerId) => {
  try {
    calculating.value = true;
    const startDate = moment(dateRange.value[0]).startOf("month").format("YYYY-MM-DD");
    const endDate = moment(dateRange.value[1]).endOf("month").format("YYYY-MM-DD");

    const response = await fetch(
      `/api/workers/${workerId}/salary-calculation?startDate=${startDate}&endDate=${endDate}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "?��?計�?失�?");
    }

    salaryData.value = result.data;
  } catch (error) {
    console.error("?��?計�?失�?:", error);
    ElMessage.error(error.message || "?��?計�?失�?");
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
        newHourlyWage: calculatedNewWage.value,
        targetTotalSalary: totalSalaryForm.value.targetTotalSalary,
        currentTotalHours: currentPeriodHours.value,
        reason: totalSalaryForm.value.reason,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "總薪資調?�失??);
    }

    ElMessage.success(`總薪資調?��??��??��??��?${calculatedNewWage.value} ??小�?`);
    totalSalaryDialogVisible.value = false;
    
    // ?�新載入工�??��???
    await workersStore.fetchWorkers();

    // ?�新計�??��?
    if (selectedWorker.value) {
      await calculateSalary();
    }
  } catch (error) {
    console.error("總薪資調?�失??", error);
    ElMessage.error(error.message || "總薪資調?�失??);
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
      throw new Error(result.message || "?��?調整?��?失�?");
    }

    ElMessage.success("?��?調整?��??��?");
    adjustmentDialogVisible.value = false;
    await fetchAdjustments();

    // ?�新計�??��?
    if (selectedWorker.value) {
      await calculateSalary();
    }
  } catch (error) {
    console.error("?��?調整?��?失�?:", error);
    ElMessage.error(error.message || "?��?調整?��?失�?");
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

/* ?��?義滾?��?�?? */
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
