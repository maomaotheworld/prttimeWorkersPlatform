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
          type="info"
          @click="showBatchAdjustAccumulatedHours"
        >
          批次調整累積工時
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

    <!-- 篩選器 -->
    <el-card style="margin-bottom: 10px;">
      <div class="filter-container">
        <el-row :gutter="16" align="middle">
          <el-col :span="6">
            <el-select
              v-model="filterType"
              placeholder="篩選方式"
              @change="applyFilter"
              style="width: 100%"
            >
              <el-option label="全選" value="all" />
              <el-option label="依組別篩選" value="group" />
              <el-option label="依樓層篩選" value="floor" />
            </el-select>
          </el-col>
          <el-col :span="6" v-if="filterType === 'group'">
            <el-select
              v-model="selectedGroup"
              placeholder="選擇組別"
              @change="applyFilter"
              style="width: 100%"
            >
              <el-option
                v-for="group in allGroups"
                :key="group.id"
                :label="group.name"
                :value="group.name"
              />
            </el-select>
          </el-col>
          <el-col :span="6" v-if="filterType === 'floor'">
            <el-select
              v-model="selectedFloor"
              placeholder="選擇樓層"
              @change="applyFilter"
              style="width: 100%"
            >
              <el-option
                v-for="floor in allFloors"
                :key="floor"
                :label="floor"
                :value="floor"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button @click="resetFilter">重置篩選</el-button>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- Table -->
    <el-card>
      <el-table 
        :data="filteredWorkers" 
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
        <el-table-column label="組別" width="100">
          <template #default="{ row }">
            <el-tag 
              :style="getGroupTagStyle(row.group)" 
              effect="light"
            >
              {{ row.group }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="floor" label="樓層" width="80" />
        <el-table-column prop="hourlyWage" label="時薪" width="80" />
        <el-table-column prop="baseHours" label="基本時數" width="90" />
        <el-table-column label="累積工時" width="90">
          <template #default="{ row }">
            {{ row.baseHours + (row.additionalHours || 0) }}
          </template>
        </el-table-column>
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

    <!-- 批次調整累積工時對話框 -->
    <el-dialog
      v-model="showBatchAccumulatedHoursDialog"
      title="批次調整累積工時"
      width="500px"
    >
      <el-alert
        title="注意"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px"
      >
        此功能將調整所選工讀生的累積工時，會新增工時記錄並記錄操作日誌
      </el-alert>

      <el-form>
        <el-form-item label="調整類型">
          <el-radio-group v-model="batchAccumulatedHoursForm.type">
            <el-radio label="add">增加工時</el-radio>
            <el-radio label="subtract">減少工時</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="調整時數">
          <el-input-number
            v-model="batchAccumulatedHoursForm.hours"
            :min="0.5"
            :step="0.5"
            style="width: 100%"
          />
          <span style="color: #909399; font-size: 12px; margin-left: 8px">
            小時
          </span>
        </el-form-item>

        <el-form-item label="調整原因">
          <el-input
            v-model="batchAccumulatedHoursForm.reason"
            type="textarea"
            :rows="3"
            placeholder="請說明調整原因，例如：補登漏打卡、活動加班、錯誤修正等"
          />
        </el-form-item>

        <el-form-item label="影響工讀生">
          <el-tag
            v-for="worker in selectedWorkerDetails"
            :key="worker.id"
            style="margin: 2px"
            closable
            @close="removeFromBatchSelection(worker.id)"
          >
            {{ worker.number }} - {{ worker.name }}
          </el-tag>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showBatchAccumulatedHoursDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitBatchAccumulatedHours"
          :loading="submitting"
        >
          確定調整
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
import { getApiUrl } from "@/config/api";

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

// 篩選相關
const filterType = ref('all'); // 'all', 'group', 'floor'
const selectedGroup = ref('');
const selectedFloor = ref('');

const isMobile = computed(() => window.innerWidth <= 768);

// 獲取選中工讀生的詳細資料
const selectedWorkerDetails = computed(() => {
  const workerIds = selectedWorkers.value.map(w => w.id);
  return workers.value.filter(worker => workerIds.includes(worker.id));
});

// 獲取所有組別
const allGroups = computed(() => {
  return workersStore.groups || [];
});

// 獲取所有樓層
const allFloors = computed(() => {
  const floors = [...new Set(workers.value.map(worker => worker.floor))];
  return floors.filter(floor => floor).sort();
});

// 篩選後的工讀生列表
const filteredWorkers = computed(() => {
  if (filterType.value === 'all') {
    return workers.value;
  } else if (filterType.value === 'group' && selectedGroup.value) {
    return workers.value.filter(worker => worker.group === selectedGroup.value);
  } else if (filterType.value === 'floor' && selectedFloor.value) {
    return workers.value.filter(worker => worker.floor === selectedFloor.value);
  }
  return workers.value;
});

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
const showBatchAccumulatedHoursDialog = ref(false);
const batchHoursForm = reactive({
  baseHours: 8,
});
const batchWageForm = reactive({
  hourlyWage: 200,
});
const batchAccumulatedHoursForm = reactive({
  type: 'add',
  hours: 1,
  reason: '',
});

// 篩選方法
const applyFilter = () => {
  // 當篩選條件改變時，這個計算屬性會自動重新計算
  console.log('應用篩選:', filterType.value, selectedGroup.value, selectedFloor.value);
};

const resetFilter = () => {
  filterType.value = 'all';
  selectedGroup.value = '';
  selectedFloor.value = '';
};

const fetchWorkers = async () => {
  loading.value = true;
  try {
    await workersStore.fetchWorkers();
    
    // 獲取group映射（ID到名稱）
    const groupMapping = await getGroupIdToNameMapping();
    
    // 嘗試批量獲取所有工讀生的額外工時
    const additionalHoursMap = await getAllWorkersAdditionalHours();
    
    // 映射後端數據到前端顯示格式
    workers.value = workersStore.workers.map(worker => {
      const additionalHours = additionalHoursMap[worker.id] || 0;
      
      return {
        id: worker.id,
        workerNumber: worker.number || worker.workerNumber || "",
        name: worker.name || "",
        group: groupMapping[worker.groupId] || worker.group || "",
        floor: worker.floor || "",
        hourlyWage: worker.baseHourlyWage || worker.hourlyWage || 0,
        baseHours: worker.baseWorkingHours || worker.baseHours || 8,
        additionalHours: additionalHours,
        totalHours: (worker.baseWorkingHours || worker.baseHours || 8) + additionalHours
      };
    });
    
    console.log("Workers.vue: 原始工讀生數據", workersStore.workers);
    console.log("Workers.vue: 映射後工讀生數據", workers.value);
  } catch (error) {
    console.error("Workers.vue: 獲取工讀生失敗", error);
    ElMessage.error("獲取工讀生列表失敗");
  } finally {
    loading.value = false;
  }
};

// 獲取group ID到名稱的映射
const getGroupIdToNameMapping = async () => {
  try {
    const response = await fetch(getApiUrl("/api/groups"), {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
      }
    });
    
    if (!response.ok) {
      throw new Error('獲取組別列表失敗');
    }
    
    const result = await response.json();
    const mapping = {};
    
    if (result.success && result.data) {
      result.data.forEach(group => {
        mapping[group.id] = group.name;
      });
    }
    
    return mapping;
  } catch (error) {
    console.error('獲取組別映射失敗:', error);
    return {};
  }
};

// 批量獲取所有工讀生的額外工時
const getAllWorkersAdditionalHours = async () => {
  try {
    const response = await fetch(getApiUrl("/api/time-records/additional-hours"), {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
      }
    });
    
    if (!response.ok) {
      console.warn('批量獲取額外工時API不可用，使用預設值0');
      return {};
    }
    
    const result = await response.json();
    if (result.success && result.data) {
      // 轉換為 workerId -> additionalHours 的映射
      const hoursMap = {};
      result.data.forEach(item => {
        hoursMap[item.workerId] = item.totalHours || 0;
      });
      return hoursMap;
    }
    
    return {};
  } catch (error) {
    console.warn('批量獲取額外工時失敗，使用預設值:', error);
    return {};
  }
};

// 馬卡龍色系組別顏色 - 高對比度版本  
const macaronColors = [
  { bg: '#FFE1E6', text: '#B91C7C' }, // 櫻花粉配深紫紅
  { bg: '#E6F7ED', text: '#059669' }, // 薄荷綠配深綠
  { bg: '#E1F0FF', text: '#1E40AF' }, // 天空藍配深藍  
  { bg: '#FEF3C7', text: '#D97706' }, // 檸檬黃配橙
  { bg: '#FFE4D1', text: '#EA580C' }, // 蜜桃橙配深橙
  { bg: '#F3E8FF', text: '#7C3AED' }, // 薰衣草紫配深紫
  { bg: '#ECFDF5', text: '#047857' }, // 青草綠配深綠
  { bg: '#FDEAEF', text: '#BE185D' }, // 玫瑰粉配深紫紅
  { bg: '#E0F2FE', text: '#0369A1' }, // 青藍色配深青
  { bg: '#F7FEE7', text: '#65A30D' }, // 淺綠黃配深綠
];

const getGroupTagStyle = (groupName: string) => {
  if (!groupName) return { backgroundColor: macaronColors[0].bg, color: macaronColors[0].text };
  
  // 使用組別名稱生成一致的顏色索引
  let hash = 0;
  for (let i = 0; i < groupName.length; i++) {
    hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % macaronColors.length;
  const colors = macaronColors[index];
  
  return {
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.text}20`,
    fontWeight: '500'
  };
};

// 保留舊的函數用於向後兼容
const getGroupColor = (groupName: string) => {
  const style = getGroupTagStyle(groupName);
  return style.backgroundColor;
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
    const adjustedHours = hoursForm.type === "add" ? hoursForm.hours : -hoursForm.hours;
    
    await workersStore.addTimeRecord({
      workerId: currentWorker.value.id,
      date: new Date().toISOString().split("T")[0],
      hours: adjustedHours,
      description: hoursForm.reason,
      adjustmentType: hoursForm.type,
      workerName: currentWorker.value.name
    });
    
    ElMessage.success(`工時調整成功: ${hoursForm.type === "add" ? "+" : "-"}${Math.abs(adjustedHours)}小時`);
    showHoursDialog.value = false;
    
    // 重新獲取所有工讀生數據以確保更新正確
    await fetchWorkers();
    
  } catch (error) {
    ElMessage.error("工時調整失敗: " + (error.message || error));
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

const showBatchAdjustAccumulatedHours = () => {
  if (selectedWorkers.value.length === 0) {
    ElMessage.warning("請先選擇要調整的工讀生");
    return;
  }
  // 重置表單
  batchAccumulatedHoursForm.type = 'add';
  batchAccumulatedHoursForm.hours = 1;
  batchAccumulatedHoursForm.reason = '';
  showBatchAccumulatedHoursDialog.value = true;
};

const removeFromBatchSelection = (workerId: string) => {
  selectedWorkers.value = selectedWorkers.value.filter(w => w.id !== workerId);
  if (selectedWorkers.value.length === 0) {
    showBatchAccumulatedHoursDialog.value = false;
  }
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

const submitBatchAccumulatedHours = async () => {
  // 表單驗證
  if (!batchAccumulatedHoursForm.reason.trim()) {
    ElMessage.warning("請填寫調整原因");
    return;
  }
  
  if (batchAccumulatedHoursForm.hours <= 0) {
    ElMessage.warning("調整時數必須大於0");
    return;
  }

  try {
    submitting.value = true;
    
    // 批次調整每個選中的工讀生
    for (const worker of selectedWorkerDetails.value) {
      const response = await fetch(`${getApiUrl()}/workers/${worker.id}/additional-hours`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: batchAccumulatedHoursForm.type,
          hours: batchAccumulatedHoursForm.hours,
          reason: `[批次調整] ${batchAccumulatedHoursForm.reason}`,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || `調整 ${worker.name} 的工時失敗`);
      }
    }
    
    const actionText = batchAccumulatedHoursForm.type === 'add' ? '增加' : '減少';
    ElMessage.success(
      `成功為 ${selectedWorkerDetails.value.length} 位工讀生${actionText} ${batchAccumulatedHoursForm.hours} 小時`
    );
    
    showBatchAccumulatedHoursDialog.value = false;
    selectedWorkers.value = [];
    await fetchWorkers(); // 重新載入數據
    
  } catch (error: any) {
    ElMessage.error("批次調整工時失敗: " + (error.message || error));
  } finally {
    submitting.value = false;
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

onMounted(async () => {
  await fetchWorkers();
  // 載入組別數據用於篩選
  await workersStore.fetchGroups();
});
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

.filter-container {
  padding: 10px 0;
}

.filter-container .el-col {
  display: flex;
  align-items: center;
}
</style>
