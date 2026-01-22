<template>
  <div class="workers-container">
    <!-- Header -->
    <div class="page-header">
      <h2>工讀生管理</h2>
      <div class="actions">
        <el-button
          v-if="!isMobile"
          type="success"
          @click="showImportDialog = true"
        >
          Excel 匯入
        </el-button>
        <el-button type="primary" @click="showAddWorker">
          新增工讀生
        </el-button>
      </div>
    </div>

    <!-- 批次操作 -->
    <el-card v-if="selectedWorkers.length > 0" style="margin-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span>已選擇 {{ selectedWorkers.length }} 位工讀生</span>
        <el-button
          size="small"
          type="warning"
          @click="showBatchEditHours"
        >
          批次編輯基本時數
        </el-button>
        <el-button
          size="small"
          type="primary"
          @click="showBatchEditWage"
        >
          批次編輯時薪
        </el-button>
        <el-button
          size="small"
          type="danger"
          @click="confirmBatchDelete"
        >
          批次刪除
        </el-button>
        <el-button
          size="small"
          @click="clearSelection"
        >
          清除選擇
        </el-button>
      </div>
    </el-card>

    <!-- Table -->
    <el-card>
      <el-table 
        :data="workers" 
        stripe 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column 
          type="selection" 
          width="55"
        />
        <el-table-column prop="workerNumber" label="編號" width="80" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="group" label="組別" width="100" />
        <el-table-column prop="floor" label="樓層" width="80" />
        <el-table-column prop="hourlyWage" label="時薪" width="80" />
        <el-table-column prop="baseHours" label="基本時數" width="90" />
        <el-table-column prop="totalHours" label="累積工時" width="90" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="showEditWorker(row)">
              編輯
            </el-button>
            <el-button
              size="small"
              type="warning"
              @click="showAdjustHours(row)"
            >
              工時
            </el-button>
            <el-button size="small" type="danger" @click="confirmDelete(row)">
              刪除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Excel 匯入 Dialog -->
    <el-dialog v-model="showImportDialog" title="Excel 匯入" width="600px">
      <el-upload
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".xlsx,.xls"
      >
        <div class="el-upload__text">拖曳或點擊上傳 Excel</div>
      </el-upload>

      <el-table
        v-if="previewData.length"
        :data="previewData"
        size="small"
        style="margin-top: 12px"
        border
      >
        <el-table-column prop="workerNumber" label="編號" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.workerNumber ? 'inherit' : 'red' }">
              {{ row.workerNumber || '缺失' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.name ? 'inherit' : 'red' }">
              {{ row.name || '缺失' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="group" label="組別" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.group ? 'inherit' : 'red' }">
              {{ row.group || '缺失' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="floor" label="樓層" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.floor ? 'inherit' : 'red' }">
              {{ row.floor || '缺失' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="hourlyWage" label="時薪" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.hourlyWage > 0 ? 'inherit' : 'red' }">
              {{ row.hourlyWage || '缺失' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="狀態" width="80">
          <template #default="{ row }">
            <el-tag :type="row.valid ? 'success' : 'danger'">
              {{ row.valid ? "有效" : "錯誤" }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="validCount === 0"
          :loading="importing"
          @click="confirmImport"
        >
          匯入 ({{ validCount }})
        </el-button>
      </template>
    </el-dialog>

    <!-- 工時調整 Dialog -->
    <el-dialog v-model="showHoursDialog" title="調整工時" width="400px">
      <div v-if="currentWorker">
        <p>{{ currentWorker.name }} ({{ currentWorker.workerNumber }})</p>
        <p>目前累積工時：{{ currentWorker.totalHours }} 小時</p>
      </div>

      <el-form>
        <el-form-item label="類型">
          <el-radio-group v-model="hoursForm.type">
            <el-radio label="add">增加</el-radio>
            <el-radio label="subtract">減少</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="時數">
          <el-input-number v-model="hoursForm.hours" :min="0.5" :step="0.5" />
        </el-form-item>

        <el-form-item label="原因">
          <el-input v-model="hoursForm.reason" type="textarea" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showHoursDialog = false">取消</el-button>
        <el-button type="primary" @click="submitHoursAdjust"> 確認 </el-button>
      </template>
    </el-dialog>

    <!-- 編輯工讀生 Dialog -->
    <el-dialog
      v-model="showWorkerDialog"
      :title="isEditing ? '編輯工讀生' : '新增工讀生'"
      width="500px"
    >
      <el-form
        ref="workerFormRef"
        :model="workerForm"
        :rules="workerRules"
        label-width="100px"
      >
        <el-form-item label="編號" prop="workerNumber">
          <el-input
            v-model="workerForm.workerNumber"
            placeholder="請輸入編號"
          />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="workerForm.name" placeholder="請輸入姓名" />
        </el-form-item>
        <el-form-item label="組別" prop="group">
          <el-input v-model="workerForm.group" placeholder="請輸入組別" />
        </el-form-item>
        <el-form-item label="樓層" prop="floor">
          <el-input v-model="workerForm.floor" placeholder="請輸入樓層" />
        </el-form-item>
        <el-form-item label="時薪" prop="hourlyWage">
          <el-input-number
            v-model="workerForm.hourlyWage"
            :min="100"
            :step="5"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="基本時數" prop="baseHours">
          <el-input-number
            v-model="workerForm.baseHours"
            :min="1"
            :max="12"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showWorkerDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitWorker"
          :loading="submittingWorker"
        >
          {{ isEditing ? "更新" : "新增" }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 批次編輯基本時數對話框 -->
    <el-dialog
      v-model="showBatchHoursDialog"
      title="批次編輯基本時數"
      width="400px"
    >
      <div style="margin-bottom: 15px;">
        <span>即將為 {{ selectedWorkers.length }} 位工讀生設定統一的基本時數</span>
      </div>
      
      <el-form label-width="80px">
        <el-form-item label="基本時數">
          <el-input-number
            v-model="batchHoursForm.baseHours"
            :min="1"
            :max="12"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showBatchHoursDialog = false">取消</el-button>
        <el-button type="primary" @click="submitBatchHours">
          確定更新
        </el-button>
      </template>
    </el-dialog>

    <!-- 批次編輯時薪對話框 -->
    <el-dialog
      v-model="showBatchWageDialog"
      title="批次編輯時薪"
      width="400px"
    >
      <div style="margin-bottom: 15px;">
        <span>即將為 {{ selectedWorkers.length }} 位工讀生設定統一的時薪</span>
      </div>
      
      <el-form label-width="80px">
        <el-form-item label="時薪">
          <el-input-number
            v-model="batchWageForm.hourlyWage"
            :min="100"
            :step="5"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showBatchWageDialog = false">取消</el-button>
        <el-button type="primary" @click="submitBatchWage">
          確定更新
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import * as XLSX from "xlsx";
import { useWorkersStore } from "@/stores/workers";

interface Worker {
  id: string;
  workerNumber: string;
  name: string;
  group: string;
  floor: string;
  hourlyWage: number;
  baseHours: number;
  totalHours: number;
}

const workersStore = useWorkersStore();
const workers = ref<Worker[]>([]);
const loading = ref(false);

const isMobile = computed(() => window.innerWidth <= 768);

// Excel
const showImportDialog = ref(false);
const previewData = ref<any[]>([]);
const importing = ref(false);

// 工時調整
const showHoursDialog = ref(false);
const currentWorker = ref<Worker | null>(null);
const hoursForm = reactive({
  type: "add",
  hours: 1,
  reason: "",
});

// 編輯工讀生
const showWorkerDialog = ref(false);
const isEditing = ref(false);
const submittingWorker = ref(false);
const workerFormRef = ref();
const workerForm = reactive({
  id: "",
  workerNumber: "",
  name: "",
  group: "",
  floor: "",
  hourlyWage: 200,
  baseHours: 8,
});

const workerRules = {
  workerNumber: [{ required: true, message: "請輸入編號", trigger: "blur" }],
  name: [{ required: true, message: "請輸入姓名", trigger: "blur" }],
  group: [{ required: true, message: "請輸入組別", trigger: "blur" }],
  floor: [{ required: true, message: "請輸入樓層", trigger: "blur" }],
  hourlyWage: [{ required: true, message: "請輸入時薪", trigger: "blur" }],
  baseHours: [{ required: true, message: "請輸入基本時數", trigger: "blur" }],
};

// 批次編輯相關變數
const selectedWorkers = ref<Worker[]>([]);
const showBatchHoursDialog = ref(false);
const showBatchWageDialog = ref(false);
const batchHoursForm = reactive({
  baseHours: 8,
});
const batchWageForm = reactive({
  hourlyWage: 200,
});

const fetchWorkers = async () => {
  loading.value = true;
  try {
    await workersStore.fetchWorkers();
    workers.value = workersStore.workers;
    console.log("Workers.vue: 獲取到的工讀生數據", workers.value);
    console.log("Workers.vue: 第一個工讀生數據樣例", workers.value[0]);
  } catch (error) {
    console.error("Workers.vue: 獲取工讀生失敗", error);
    ElMessage.error("獲取工讀生列表失敗");
  } finally {
    loading.value = false;
  }
};

const handleFileChange = (file: any) => {
  const reader = new FileReader();
  reader.onload = (e: any) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[];

    console.log("Excel 原始數據:", rows);
    console.log("Excel 標題行:", rows[0]);

    const result = [];
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      console.log(`Excel 第${i}行原始數據:`, r);
      
      if (!r || r.length === 0) {
        console.log(`跳過空行 ${i}`);
        continue;
      }

      // 更嚴格的數據處理
      const workerNumber = String(r[0] != null ? r[0] : "").trim();
      const name = String(r[1] != null ? r[1] : "").trim();
      const group = String(r[2] != null ? r[2] : "").trim();
      const floor = String(r[3] != null ? r[3] : "").trim();
      const hourlyWage = r[4] != null ? Number(r[4]) : 0;

      // 確保數據格式正確
      const workerData = {
        workerNumber,
        name,
        group,
        floor,
        hourlyWage: hourlyWage,
        baseHours: 8,
        valid: workerNumber && name && group && floor && hourlyWage > 0,
      };

      console.log(`Excel 第${i}行解析結果:`, workerData);
      console.log(`Excel 第${i}行驗證:`, {
        workerNumber: !!workerNumber,
        name: !!name,
        group: !!group,
        floor: !!floor,
        hourlyWage: hourlyWage > 0,
        valid: workerData.valid
      });

      result.push(workerData);
    }

    console.log("Excel 最終解析結果:", result);
    previewData.value = result;
  };
  reader.readAsArrayBuffer(file.raw);
};

const validCount = computed(
  () => previewData.value.filter((i) => i.valid).length,
);

const confirmImport = async () => {
  importing.value = true;
  const validData = previewData.value.filter((i) => i.valid);
  
  // 清理數據格式，移除不需要的欄位
  const cleanData = validData.map(item => ({
    workerNumber: item.workerNumber,
    name: item.name,
    group: item.group,
    floor: item.floor,
    hourlyWage: item.hourlyWage,
    baseHours: item.baseHours || 8,
  }));

  console.log("準備匯入的數據:", cleanData);

  try {
    await workersStore.importWorkers(cleanData);
    ElMessage.success(`成功匯入 ${cleanData.length} 筆`);
    showImportDialog.value = false;
    previewData.value = [];
    fetchWorkers();
  } catch (error) {
    console.error("匯入失敗:", error);
    ElMessage.error("匯入失敗: " + error.message);
  } finally {
    importing.value = false;
  }
};

// 工時
const showAdjustHours = (worker: Worker) => {
  currentWorker.value = worker;
  hoursForm.type = "add";
  hoursForm.hours = 1;
  hoursForm.reason = "";
  showHoursDialog.value = true;
};

const submitHoursAdjust = async () => {
  if (!currentWorker.value) return;
  if (!hoursForm.reason.trim()) {
    ElMessage.error("請填寫調整原因");
    return;
  }

  try {
    await workersStore.addTimeRecord({
      workerId: currentWorker.value.id,
      date: new Date().toISOString().split("T")[0], // 今天日期
      hours: hoursForm.hours,
      description: hoursForm.reason,
      adjustmentType: hoursForm.type,
    });
    ElMessage.success("工時調整成功");
    showHoursDialog.value = false;
    fetchWorkers();
  } catch (error) {
    ElMessage.error("工時調整失敗: " + error.message);
  }
};

// 編輯工讀生
const showAddWorker = () => {
  isEditing.value = false;
  resetWorkerForm();
  showWorkerDialog.value = true;
};

const showEditWorker = (worker: Worker) => {
  isEditing.value = true;
  
  console.log("編輯工讀生 - 原始數據:", worker);
  
  // 確保所有字段都正確映射，處理可能的字段名差異
  workerForm.id = worker.id || worker._id || "";
  workerForm.workerNumber = worker.workerNumber || worker.worker_number || "";
  workerForm.name = worker.name || "";
  workerForm.group = worker.group || "";
  workerForm.floor = worker.floor || "";
  workerForm.hourlyWage = Number(worker.hourlyWage || worker.hourly_wage) || 200;
  workerForm.baseHours = Number(worker.baseHours || worker.base_hours) || 8;
  
  console.log("編輯工讀生 - 表單數據:", workerForm);
  
  showWorkerDialog.value = true;
};

const resetWorkerForm = () => {
  Object.assign(workerForm, {
    id: "",
    workerNumber: "",
    name: "",
    group: "",
    floor: "",
    hourlyWage: 200,
    baseHours: 8,
  });
};

const submitWorker = async () => {
  try {
    const valid = await workerFormRef.value.validate();
    if (!valid) return;

    submittingWorker.value = true;

    if (isEditing.value) {
      await workersStore.updateWorker(workerForm.id, workerForm);
      ElMessage.success("工讀生更新成功");
    } else {
      await workersStore.addWorker(workerForm);
      ElMessage.success("工讀生新增成功");
    }

    showWorkerDialog.value = false;
    fetchWorkers();
  } catch (error) {
    ElMessage.error(
      (isEditing.value ? "更新" : "新增") + "失敗: " + error.message,
    );
  } finally {
    submittingWorker.value = false;
  }
};

const confirmDelete = async (worker: Worker) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除工讀生「${worker.name}」嗎？`,
      "刪除確認",
      {
        confirmButtonText: "確認刪除",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    await workersStore.deleteWorker(worker.id);
    ElMessage.success("工讀生刪除成功");
    fetchWorkers();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("刪除失敗: " + error.message);
    }
  }
};

// 批次編輯相關函數
const handleSelectionChange = (selection: Worker[]) => {
  selectedWorkers.value = selection;
};

const clearSelection = () => {
  selectedWorkers.value = [];
};

const showBatchEditHours = () => {
  if (selectedWorkers.value.length === 0) {
    ElMessage.warning("請先選擇要編輯的工讀生");
    return;
  }
  showBatchHoursDialog.value = true;
};

const showBatchEditWage = () => {
  if (selectedWorkers.value.length === 0) {
    ElMessage.warning("請先選擇要編輯的工讀生");
    return;
  }
  showBatchWageDialog.value = true;
};

const confirmBatchDelete = async () => {
  if (selectedWorkers.value.length === 0) {
    ElMessage.warning("請先選擇要刪除的工讀生");
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `確定要刪除選中的 ${selectedWorkers.value.length} 位工讀生嗎？此操作無法撤銷。`,
      "批次刪除確認",
      {
        confirmButtonText: "確定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    
    for (const worker of selectedWorkers.value) {
      await workersStore.deleteWorker(worker.id);
    }
    
    ElMessage.success(`成功刪除 ${selectedWorkers.value.length} 位工讀生`);
    selectedWorkers.value = [];
    fetchWorkers();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error("批次刪除失敗: " + (error.message || error));
    }
  }
};

const submitBatchHours = async () => {
  try {
    for (const worker of selectedWorkers.value) {
      await workersStore.updateWorker(worker.id, {
        ...worker,
        baseHours: batchHoursForm.baseHours
      });
    }
    
    ElMessage.success(`成功更新 ${selectedWorkers.value.length} 位工讀生的基本時數`);
    showBatchHoursDialog.value = false;
    selectedWorkers.value = [];
    fetchWorkers();
  } catch (error: any) {
    ElMessage.error("批次更新時數失敗: " + (error.message || error));
  }
};

const submitBatchWage = async () => {
  try {
    for (const worker of selectedWorkers.value) {
      await workersStore.updateWorker(worker.id, {
        ...worker,
        hourlyWage: batchWageForm.hourlyWage
      });
    }
    
    ElMessage.success(`成功更新 ${selectedWorkers.value.length} 位工讀生的時薪`);
    showBatchWageDialog.value = false;
    selectedWorkers.value = [];
    fetchWorkers();
  } catch (error: any) {
    ElMessage.error("批次更新時薪失敗: " + (error.message || error));
  }
};

onMounted(fetchWorkers);
</script>

<style scoped>
.workers-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.actions {
  display: flex;
  gap: 8px;
}
</style>
