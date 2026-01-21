<template>
  <div class="time-records-container">
    <div class="page-header">
      <h1 class="page-title">Â∑•Ê?Ë®òÈ?</h1>
      <el-button type="primary" @click="showAddAdditionalDialog" :icon="Plus">
        ?∞Â?È°çÂ?Â∑•Ê?
      </el-button>
    </div>

    <!-- ÁØ©ÈÅ∏Ê¢ù‰ª∂ -->
    <el-card class="filter-card mb-20">
      <el-row :gutter="16">
        <el-col :xs="24" :sm="8">
          <el-select v-model="filterWorker" placeholder="?∏Ê?Â∑•Ë??? clearable>
            <el-option label="?®ÈÉ®Â∑•Ë??? value="" />
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
            range-separator="??
            start-placeholder="?ãÂ??•Ê?"
            end-placeholder="ÁµêÊ??•Ê?"
            format="YYYY/MM/DD"
            value-format="YYYY-MM-DD"
            @change="handleDateChange"
          />
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-button type="primary" @click="fetchRecords">?•Ë©¢</el-button>
          <el-button @click="resetFilters">?çÁΩÆ</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- Â∑•Ê?Ë®òÈ?Ë°®Ê†º -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="records"
        stripe
        class="responsive-table"
      >
        <el-table-column prop="date" label="?•Ê?" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>

        <el-table-column label="Â∑•Ë??? min-width="120">
          <template #default="{ row }">
            <div>
              <div>{{ getWorkerName(row.workerId) }}</div>
              <small class="info-text">{{
                getWorkerNumber(row.workerId)
              }}</small>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="‰∏äÁè≠?ÇÈ?" width="100">
          <template #default="{ row }">
            <span v-if="row.clockIn">
              {{ formatTime(row.clockIn) }}
            </span>
            <span v-else class="info-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="‰∏ãÁè≠?ÇÈ?" width="100">
          <template #default="{ row }">
            <span v-if="row.clockOut">
              {{ formatTime(row.clockOut) }}
            </span>
            <span v-else-if="row.clockIn" class="warning-text">?≤Ë?‰∏?/span>
            <span v-else class="info-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="Ê≠?∏∏Â∑•Ê?" width="100">
          <template #default="{ row }">
            {{ row.totalHours || 0 }} Â∞èÊ?
          </template>
        </el-table-column>

        <el-table-column label="È°çÂ?Â∑•Ê?" width="120">
          <template #default="{ row }">
            <span v-if="row.additionalHours > 0" class="success-text">
              +{{ row.additionalHours }} Â∞èÊ?
            </span>
            <span v-else-if="row.additionalHours < 0" class="danger-text">
              {{ row.additionalHours }} Â∞èÊ?
            </span>
            <span v-else class="info-text">-</span>
          </template>
        </el-table-column>

        <el-table-column label="Á∏ΩÂ∑•?? width="100">
          <template #default="{ row }">
            <strong>
              {{ ((row.totalHours || 0) + (row.additionalHours || 0)).toFixed(1) }} Â∞èÊ?
            </strong>
          </template>
        </el-table-column>

        <el-table-column label="Ë™øÊï¥Ë®òÈ?" min-width="200">
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
        <p>?´ÁÑ°Â∑•Ê?Ë®òÈ?</p>
      </div>
    </el-card>

    <!-- ?∞Â?È°çÂ?Â∑•Ê?Â∞çË©±Ê°?-->
    <el-dialog
      v-model="additionalDialogVisible"
      title="?ÇÊï∏Ë™øÊï¥"
      :width="isMobile ? '95%' : '500px'"
    >
      <el-form
        ref="additionalFormRef"
        :model="additionalForm"
        :rules="additionalFormRules"
        label-width="80px"
      >
        <el-form-item label="Â∑•Ë??? prop="workerId">
          <el-select
            v-model="additionalForm.workerId"
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

        <el-form-item label="?•Ê?" prop="date">
          <el-date-picker
            v-model="additionalForm.date"
            type="date"
            placeholder="?∏Ê??•Ê?"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Ë™øÊï¥È°ûÂ?" prop="adjustmentType">
          <el-radio-group v-model="additionalForm.adjustmentType">
            <el-radio-button label="add">?∞Â?Â∑•Ê?</el-radio-button>
            <el-radio-button label="subtract">??ô§Â∑•Ê?</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="?ÇÊï∏" prop="hours">
          <el-input-number
            v-model="additionalForm.hours"
            :min="0.1"
            :max="24"
            :step="0.5"
            :precision="1"
            style="width: 100%"
          />
          <span style="font-size: 12px; color: #909399; margin-left: 8px;">
            {{ additionalForm.adjustmentType === 'add' ? 'Â∞áÊñ∞Â¢? : 'Â∞áÊâ£?? }} {{ additionalForm.hours }} Â∞èÊ?
          </span>
        </el-form-item>

        <el-form-item label="?ÜÁî±" prop="reason">
          <el-input
            v-model="additionalForm.reason"
            type="textarea"
            :rows="3"
            :placeholder="additionalForm.adjustmentType === 'add' ? 'Ë´ãË™™?éÂ??≠Ê?È°çÂ?Â∑•Ê??ÑÁ??? : 'Ë´ãË™™?éÊâ£?§Â∑•?ÇÁ??ÜÁî±'"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="additionalDialogVisible = false">?ñÊ?</el-button>
        <el-button
          type="primary"
          @click="handleAddAdditional"
          :loading="submitting"
        >
          ?∞Â?
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

// ÁØ©ÈÅ∏Ê¢ù‰ª∂
const filterWorker = ref("");
const dateRange = ref([
  moment().startOf("month").format("YYYY-MM-DD"),
  moment().endOf("month").format("YYYY-MM-DD"),
]);

// È°çÂ?Â∑•Ê?Â∞çË©±Ê°?
const additionalDialogVisible = ref(false);
const additionalForm = ref({
  workerId: "",
  date: new Date(),
  hours: 1,
  reason: "",
  adjustmentType: "add", // ?êË®≠?∫Êñ∞Â¢ûÂ∑•??
});

const additionalFormRules = {
  workerId: [{ required: true, message: "Ë´ãÈÅ∏?áÂ∑•ËÆÄ??, trigger: "change" }],
  date: [{ required: true, message: "Ë´ãÈÅ∏?áÊó•??, trigger: "change" }],
  hours: [{ required: true, message: "Ë´ãËº∏?•È?Â§ñÂ∑•??, trigger: "blur" }],
  reason: [{ required: true, message: "Ë´ãË™™?éÁ???, trigger: "blur" }],
};

const additionalFormRef = ref();

// Â∑•ÂÖ∑?ΩÊï∏
const formatDate = (date) => moment(date).format("MM/DD");
const formatTime = (time) => moment(time).format("HH:mm");

const getWorkerName = (workerId) => {
  const worker = workers.value.find((w) => w.id === workerId);
  return worker ? worker.name : "?™Áü•";
};

const getWorkerNumber = (workerId) => {
  const worker = workers.value.find((w) => w.id === workerId);
  return worker ? worker.number : "";
};

// ?∏Ê??ç‰?
const fetchRecords = async () => {
  try {
    loading.value = true;
    let url = "/api/time-records";
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
      throw new Error(result.message || "ËºâÂÖ•Â∑•Ê?Ë®òÈ?Â§±Ê?");
    }

    // ÂæåÁ´ØËøîÂ??ºÂ???{ success: true, data: [...], message: "..." }
    records.value = result.data || [];
  } catch (error) {
    console.error("ËºâÂÖ•Â∑•Ê?Ë®òÈ?Â§±Ê?:", error);
    ElMessage.error(error.message || "ËºâÂÖ•Â∑•Ê?Ë®òÈ?Â§±Ê?");
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
    adjustmentType: "add", // ?êË®≠?∫Êñ∞Â¢ûÂ∑•??
  };
  additionalDialogVisible.value = true;
};

const handleAddAdditional = async () => {
  try {
    await additionalFormRef.value.validate();
    submitting.value = true;

    const token = authStore.token;
    const response = await fetch("/api/time-records/additional-hours", {
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
        adjustmentType: additionalForm.value.adjustmentType, // Ê∑ªÂ?Ë™øÊï¥È°ûÂ?
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "?ÇÊï∏Ë™øÊï¥Â§±Ê?");
    }

    const actionText = additionalForm.value.adjustmentType === "add" ? "?∞Â?" : "??ô§";
    ElMessage.success(`?ÇÊï∏${actionText}?êÂ?`);
    additionalDialogVisible.value = false;
    await fetchRecords();
  } catch (error) {
    console.error("È°çÂ?Â∑•Ê??∞Â?Â§±Ê?:", error);
    ElMessage.error(error.message || "È°çÂ?Â∑•Ê??∞Â?Â§±Ê?");
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

/* ?™Â?Áæ©Êªæ?ïÊ?Ê®?? */
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
