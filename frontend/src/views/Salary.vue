<template>
  <div class="salary-container">
    <div class="page-header">
      <h1 class="page-title">?™Ë?ÁÆ°Á?</h1>
    </div>

    <!-- ?™Ë?Ë®àÁ??Ä??-->
    <el-card class="calculation-card mb-20">
      <template #header>
        <div class="card-header">
          <span>?™Ë?Ë®àÁ?</span>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="8">
          <el-form-item label="?∏Ê?Â∑•Ë???>
            <el-select
              v-model="selectedWorker"
              placeholder="Ë´ãÈÅ∏?áÂ∑•ËÆÄ??
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
          <el-form-item label="Ë®àÁ??üÈ?">
            <el-date-picker
              v-model="dateRange"
              type="monthrange"
              range-separator="??
              start-placeholder="?ãÂ??à‰ªΩ"
              end-placeholder="ÁµêÊ??à‰ªΩ"
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
            Ë®àÁ??™Ë?
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- ?™Ë?Ë©≥Á¥∞Ë≥áË? -->
    <el-card v-if="salaryData" class="salary-detail-card mb-20">
      <template #header>
        <div class="card-header">
          <span
            >?™Ë?Ë©≥Ê? - {{ salaryData.worker.name }} ({{
              salaryData.period.startDate
            }}
            ??{{ salaryData.period.endDate }})</span
          >
        </div>
      </template>

      <el-row :gutter="16" class="salary-overview">
        <el-col :xs="24" :sm="6">
          <div class="salary-item">
            <div class="salary-label">?∫Êú¨?ÇËñ™</div>
            <div class="salary-value">
              {{ salaryData.worker.baseHourlyWage }} ??
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6">
          <div class="salary-item">
            <div class="salary-label">Â∑•‰?Â§©Êï∏</div>
            <div class="salary-value">
              {{ salaryData.workTime.workingDays }} Â§?
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6">
          <div class="salary-item">
            <div class="salary-label">Á∏ΩÂ∑•??/div>
            <div class="salary-value">
              {{
                salaryData.workTime.totalRegularHours +
                salaryData.workTime.totalAdditionalHours
              }}
              Â∞èÊ?
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="6">
          <div class="salary-item total">
            <div class="salary-label">Á∏ΩËñ™Ë≥?/div>
            <div class="salary-value">
              {{ salaryData.salary.totalSalary }} ??
            </div>
          </div>
        </el-col>
      </el-row>

      <el-divider />

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <h3>Â∑•Ê?Ë©≥Ê?</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="Ê≠?∏∏Â∑•Ê?">
              {{ salaryData.workTime.totalRegularHours }} Â∞èÊ?
            </el-descriptions-item>
            <el-descriptions-item label="È°çÂ?Â∑•Ê?">
              {{ salaryData.workTime.totalAdditionalHours }} Â∞èÊ?
            </el-descriptions-item>
            <el-descriptions-item label="Â∑•‰?Â§©Êï∏">
              {{ salaryData.workTime.workingDays }} Â§?
            </el-descriptions-item>
          </el-descriptions>
        </el-col>

        <el-col :xs="24" :sm="12">
          <h3>?™Ë?Ë®àÁ?</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="?∫Êú¨?™Ë?">
              {{ salaryData.salary.baseSalary }} ??
            </el-descriptions-item>
            <el-descriptions-item label="È°çÂ??™Ë?">
              {{ salaryData.salary.additionalSalary }} ??
            </el-descriptions-item>
            <el-descriptions-item label="?™Ë?Ë™øÊï¥">
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
            <el-descriptions-item label="Á∏ΩËñ™Ë≥?>
              <strong style="font-size: 18px; color: #409eff">
                {{ salaryData.salary.totalSalary }} ??
              </strong>
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
    </el-card>

    <!-- ?™Ë?Ë™øÊï¥ -->
    <el-card class="adjustment-card mb-20">
      <template #header>
        <div class="card-header">
          <span>?™Ë?Ë™øÊï¥</span>
          <div>
            <el-button
              type="success"
              size="small"
              @click="showTotalSalaryDialog"
              :disabled="!selectedWorker"
              style="margin-right: 8px;"
            >
              Ë™øÊï¥Á∏ΩËñ™Ë≥?
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="showAdjustmentDialog"
              :disabled="!selectedWorker"
            >
              ?∞Â?Ë™øÊï¥
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loadingAdjustments" :data="adjustments" stripe>
        <el-table-column prop="date" label="?•Ê?" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>

        <el-table-column label="Â∑•Ë??? min-width="120">
          <template #default="{ row }">
            {{ getWorkerName(row.workerId) }}
          </template>
        </el-table-column>

        <el-table-column prop="type" label="È°ûÂ?" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.type === 'increase' ? 'success' : 'danger'"
              size="small"
            >
              {{ row.type === "increase" ? "?†Ëñ™" : "Ê∏õËñ™" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="amount" label="?ëÈ?" width="100">
          <template #default="{ row }">
            <span
              :class="row.type === 'increase' ? 'success-text' : 'error-text'"
            >
              {{ row.type === "increase" ? "+" : "-" }}{{ row.amount }} ??
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="reason" label="?ÜÁî±" min-width="150" />
      </el-table>

      <div
        v-if="adjustments.length === 0 && !loadingAdjustments"
        class="empty-state"
      >
        <el-icon size="48"><DocumentRemove /></el-icon>
        <p>?´ÁÑ°?™Ë?Ë™øÊï¥Ë®òÈ?</p>
      </div>
    </el-card>

    <!-- ?™Ë?Ë™øÊï¥Â∞çË©±Ê°?-->
    <el-dialog
      v-model="adjustmentDialogVisible"
      title="?∞Â??™Ë?Ë™øÊï¥"
      :width="isMobile ? '95%' : '500px'"
    >
      <el-form
        ref="adjustmentFormRef"
        :model="adjustmentForm"
        :rules="adjustmentFormRules"
        label-width="80px"
      >
        <el-form-item label="Â∑•Ë??? prop="workerId">
          <el-select
            v-model="adjustmentForm.workerId"
            placeholder="Ë´ãÈÅ∏?áÂ∑•ËÆÄ??
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

        <el-form-item label="Ë™øÊï¥È°ûÂ?" prop="type">
          <el-radio-group v-model="adjustmentForm.type">
            <el-radio label="increase">?†Ëñ™</el-radio>
            <el-radio label="decrease">Ê∏õËñ™</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="Ë™øÊï¥?ëÈ?" prop="amount">
          <el-input-number
            v-model="adjustmentForm.amount"
            :min="1"
            :step="10"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Ë™øÊï¥?ÜÁî±" prop="reason">
          <el-input
            v-model="adjustmentForm.reason"
            type="textarea"
            :rows="3"
            placeholder="Ë´ãË™™?éËñ™Ë≥áË™ø?¥Á??ÜÁî±"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="adjustmentDialogVisible = false">?ñÊ?</el-button>
        <el-button
          type="primary"
          @click="handleAddAdjustment"
          :loading="submitting"
        >
          ?∞Â?
        </el-button>
      </template>
    </el-dialog>

    <!-- Ë™øÊï¥Á∏ΩËñ™Ë≥áÂ?Ë©±Ê? -->
    <el-dialog
      v-model="totalSalaryDialogVisible"
      title="Ë™øÊï¥Á∏ΩËñ™Ë≥?
      :width="isMobile ? '95%' : '600px'"
    >
      <el-alert
        title="Ë™™Ê?"
        type="info"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        Ëº∏ÂÖ•Ë¶ÅÊîØ‰ªòÁµ¶Â∑•Ë??üÁ?Á∏ΩËñ™Ë≥?Á≥ªÁµ±Â∞áÊ†π?öÂ∑•‰ΩúÊ??∏Ëá™?ïË?ÁÆóÊñ∞?ÑÊ???
      </el-alert>

      <el-form
        ref="totalSalaryFormRef"
        :model="totalSalaryForm"
        :rules="totalSalaryFormRules"
        label-width="120px"
      >
        <el-form-item label="Â∑•Ë??? prop="workerId">
          <el-select
            v-model="totalSalaryForm.workerId"
            placeholder="Ë´ãÈÅ∏?áÂ∑•ËÆÄ??
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

        <el-form-item label="?¨Ê?Â∑•‰??ÇÊï∏">
          <el-input
            :value="currentPeriodHours + ' Â∞èÊ?'"
            disabled
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="?ÆÂ??ÇËñ™">
          <el-input
            :value="currentWage + ' ??Â∞èÊ?'"
            disabled
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="?ÆÂ??ê‰º∞?™Ë?">
          <el-input
            :value="currentEstimatedSalary + ' ??"
            disabled
            style="width: 100%"
          />
        </el-form-item>

        <el-divider />

        <el-form-item label="Ë™øÊï¥ÂæåÁ∏Ω?™Ë?" prop="targetTotalSalary">
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

        <el-form-item label="Ë®àÁ?ÂæåÊñ∞?ÇËñ™" v-if="calculatedNewWage > 0">
          <el-tag type="primary" size="large" style="padding: 10px 15px;">
            {{ calculatedNewWage }} ??Â∞èÊ?
          </el-tag>
        </el-form-item>

        <el-form-item label="?ÇËñ™Ë™øÊï¥" v-if="calculatedNewWage > 0">
          <el-tag
            :type="wageAdjustment >= 0 ? 'success' : 'danger'"
            size="large"
            style="padding: 10px 15px;"
          >
            {{ wageAdjustment >= 0 ? '+' : '' }}{{ wageAdjustment }} ??Â∞èÊ?
            ({{ wageAdjustmentPercent }})
          </el-tag>
        </el-form-item>

        <el-form-item label="?™Ë?Ë™øÊï¥" v-if="calculatedNewWage > 0">
          <el-tag
            :type="salaryAdjustment >= 0 ? 'success' : 'danger'"
            size="large"
            style="padding: 10px 15px;"
          >
            {{ salaryAdjustment >= 0 ? '+' : '' }}{{ salaryAdjustment }} ??
          </el-tag>
        </el-form-item>

        <el-form-item label="Ë™øÊï¥?ÜÁî±" prop="reason">
          <el-input
            v-model="totalSalaryForm.reason"
            type="textarea"
            :rows="3"
            placeholder="Ë´ãË™™?éË™ø?¥Á∏Ω?™Ë??ÑÁ??±Ô?‰æãÂ?ÔºöÊú¨?àÁ∏æ?àÁ??µ„ÄÅÂ?Ê°àÁ??ëÁ?Ôº?
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="totalSalaryDialogVisible = false">?ñÊ?</el-button>
        <el-button
          type="primary"
          @click="handleTotalSalaryAdjust"
          :loading="submitting"
          :disabled="calculatedNewWage <= 0"
        >
          Á¢∫Ë?Ë™øÊï¥
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

// ?™Ë?Ë™øÊï¥Â∞çË©±Ê°?
const adjustmentDialogVisible = ref(false);
const adjustmentForm = ref({
  workerId: "",
  type: "increase",
  amount: 100,
  reason: "",
});

const adjustmentFormRules = {
  workerId: [{ required: true, message: "Ë´ãÈÅ∏?áÂ∑•ËÆÄ??, trigger: "change" }],
  type: [{ required: true, message: "Ë´ãÈÅ∏?áË™ø?¥È???, trigger: "change" }],
  amount: [{ required: true, message: "Ë´ãËº∏?•Ë™ø?¥È?È°?, trigger: "blur" }],
  reason: [{ required: true, message: "Ë´ãË™™?éÁ???, trigger: "blur" }],
};

const adjustmentFormRef = ref();

// Ë™øÊï¥Á∏ΩËñ™Ë≥áÂ?Ë©±Ê?
const totalSalaryDialogVisible = ref(false);
const totalSalaryForm = ref({
  workerId: "",
  targetTotalSalary: 0,
  reason: "",
});

const totalSalaryFormRules = {
  workerId: [{ required: true, message: "Ë´ãÈÅ∏?áÂ∑•ËÆÄ??, trigger: "change" }],
  targetTotalSalary: [{ required: true, message: "Ë´ãËº∏?•ÁõÆÊ®ôÁ∏Ω?™Ë?", trigger: "blur" }],
  reason: [{ required: true, message: "Ë´ãË™™?éË™ø?¥Á???, trigger: "blur" }],
};

const totalSalaryFormRef = ref();

// ?¨Ê?Â∑•‰??ÇÊï∏
const currentPeriodHours = computed(() => {
  if (!salaryData.value) return 0;
  const regular = salaryData.value.workTime?.totalRegularHours || 0;
  const additional = salaryData.value.workTime?.totalAdditionalHours || 0;
  return regular + additional;
});

// ?ÆÂ??ÇËñ™
const currentWage = computed(() => {
  if (!totalSalaryForm.value.workerId) return 0;
  const worker = workers.value.find(w => w.id === totalSalaryForm.value.workerId);
  return worker ? (worker.baseHourlyWage || 0) : 0;
});

// ?ÆÂ??ê‰º∞?™Ë?
const currentEstimatedSalary = computed(() => {
  return Math.round(currentPeriodHours.value * currentWage.value);
});

// Ë®àÁ?ÂæåÁ??∞Ê???
const calculatedNewWage = computed(() => {
  if (!totalSalaryForm.value.targetTotalSalary || currentPeriodHours.value === 0) return 0;
  return Math.round(totalSalaryForm.value.targetTotalSalary / currentPeriodHours.value);
});

// ?ÇËñ™Ë™øÊï¥
const wageAdjustment = computed(() => {
  return calculatedNewWage.value - currentWage.value;
});

// ?ÇËñ™Ë™øÊï¥?æÂ?ÊØ?
const wageAdjustmentPercent = computed(() => {
  if (currentWage.value === 0) return '0%';
  const percent = ((wageAdjustment.value / currentWage.value) * 100).toFixed(1);
  return `${percent >= 0 ? '+' : ''}${percent}%`;
});

// ?™Ë?Ë™øÊï¥?ëÈ?
const salaryAdjustment = computed(() => {
  return totalSalaryForm.value.targetTotalSalary - currentEstimatedSalary.value;
});

// Â∑•ÂÖ∑?ΩÊï∏
const formatDate = (date) => moment(date).format("YYYY/MM/DD");

const getWorkerName = (workerId) => {
  const worker = workers.value.find((w) => w.id === workerId);
  return worker ? worker.name : "?™Áü•";
};

// ?™Ë?Ë®àÁ?
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
      throw new Error(result.message || "?™Ë?Ë®àÁ?Â§±Ê?");
    }

    // ÂæåÁ´ØËøîÂ??ºÂ???{ success: true, data: {...}, message: "..." }
    salaryData.value = result.data;
  } catch (error) {
    console.error("?™Ë?Ë®àÁ?Â§±Ê?:", error);
    ElMessage.error(error.message || "?™Ë?Ë®àÁ?Â§±Ê?");
  } finally {
    calculating.value = false;
  }
};

// ËºâÂÖ•?™Ë?Ë™øÊï¥Ë®òÈ?
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
      throw new Error(result.message || "ËºâÂÖ•?™Ë?Ë™øÊï¥Ë®òÈ?Â§±Ê?");
    }

    // ÂæåÁ´ØËøîÂ??ºÂ???{ success: true, data: [...], message: "..." }
    adjustments.value = result.data || [];
  } catch (error) {
    console.error("ËºâÂÖ•?™Ë?Ë™øÊï¥Ë®òÈ?Â§±Ê?:", error);
  } finally {
    loadingAdjustments.value = false;
  }
};

// ‰∫ã‰ª∂?ïÁ?
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
    ElMessage.warning("Ë´ãÂ?Ë®àÁ??™Ë?‰ª•Áç≤?ñÂ∑•‰ΩúÊ???);
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
  // ?∂ÈÅ∏?áÂ∑•ËÆÄ?üÊ?,?çÊñ∞Ë®àÁ?Ë©≤Â∑•ËÆÄ?üÁ??™Ë??∏Ê?
  if (totalSalaryForm.value.workerId && dateRange.value) {
    await calculateSalaryForWorker(totalSalaryForm.value.workerId);
  }
};

const calculateNewWage = () => {
  // ?∂Ëº∏?•ÁõÆÊ®ôÁ∏Ω?™Ë????ÉËá™?ïËß∏??computed Ë®àÁ??∞Ê???
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
      throw new Error(result.message || "?™Ë?Ë®àÁ?Â§±Ê?");
    }

    salaryData.value = result.data;
  } catch (error) {
    console.error("?™Ë?Ë®àÁ?Â§±Ê?:", error);
    ElMessage.error(error.message || "?™Ë?Ë®àÁ?Â§±Ê?");
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
      throw new Error(result.message || "Á∏ΩËñ™Ë≥áË™ø?¥Â§±??);
    }

    ElMessage.success(`Á∏ΩËñ™Ë≥áË™ø?¥Ê??üÔ??∞Ê??™Ô?${calculatedNewWage.value} ??Â∞èÊ?`);
    totalSalaryDialogVisible.value = false;
    
    // ?çÊñ∞ËºâÂÖ•Â∑•Ë??üË???
    await workersStore.fetchWorkers();

    // ?çÊñ∞Ë®àÁ??™Ë?
    if (selectedWorker.value) {
      await calculateSalary();
    }
  } catch (error) {
    console.error("Á∏ΩËñ™Ë≥áË™ø?¥Â§±??", error);
    ElMessage.error(error.message || "Á∏ΩËñ™Ë≥áË™ø?¥Â§±??);
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
      throw new Error(result.message || "?™Ë?Ë™øÊï¥?∞Â?Â§±Ê?");
    }

    ElMessage.success("?™Ë?Ë™øÊï¥?∞Â??êÂ?");
    adjustmentDialogVisible.value = false;
    await fetchAdjustments();

    // ?çÊñ∞Ë®àÁ??™Ë?
    if (selectedWorker.value) {
      await calculateSalary();
    }
  } catch (error) {
    console.error("?™Ë?Ë™øÊï¥?∞Â?Â§±Ê?:", error);
    ElMessage.error(error.message || "?™Ë?Ë™øÊï¥?∞Â?Â§±Ê?");
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

/* ?™Â?Áæ©Êªæ?ïÊ?Ê®?? */
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
