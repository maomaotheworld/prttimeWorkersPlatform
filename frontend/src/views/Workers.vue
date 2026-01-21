<template>
  <div class="workers-container">
    <!-- 右下角浮動按鈕群組 -->
    <div class="floating-buttons">
      <!-- 新增工讀生按鈕 -->
      <el-button
        v-if="authStore.hasPermission('canEditWorkers')"
        class="floating-add-btn"
        type="primary"
        @click="showAddDialog"
        :icon="Plus"
        size="large"
        circle
      />

      <!-- 批次薪資設定按鈕 -->
      <el-button
        v-if="
          selectedWorkers.length > 0 &&
          authStore.hasPermission('canEditWorkers')
        "
        class="floating-batch-btn"
        type="warning"
        @click="showBatchWageDialog"
        :icon="Money"
        size="large"
        circle
      />
    </div>

    <!-- 搜尋和篩選 -->
    <el-card class="filter-card mb-20">
      <div class="filter-content">
        <el-row :gutter="16" class="filter-row">
          <el-col :xs="24" :sm="8">
            <el-input
              v-model="searchText"
              placeholder="搜尋工讀生姓名或編號"
              :prefix-icon="Search"
              clearable
            />
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-select v-model="filterGroup" placeholder="篩選組別" clearable>
              <el-option label="全部組別" value="" />
              <el-option
                v-for="group in groups"
                :key="group.id"
                :label="group.name"
                :value="group.id"
              />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="8">
            <div class="filter-actions">
              <el-button
                v-if="!isMobile && authStore.hasPermission('canImportData')"
                type="success"
                @click="showImportDialog"
                :icon="Upload"
                size="default"
              >
                匯入 Excel
              </el-button>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 樓層篩選標籤 -->
    <el-card class="filter-tabs-card mb-20">
      <el-tabs v-model="activeFloorTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane
          v-for="floor in availableFloors"
          :key="floor"
          :label="floor || '未設定'"
          :name="floor || 'unset'"
        />
      </el-tabs>
    </el-card>

    <!-- 工讀生列表 -->
    <el-card class="table-card">
      <div class="table-container">
        <el-table
          v-loading="loading"
          :data="filteredWorkers"
          @selection-change="handleSelectionChange"
          stripe
          class="responsive-table"
          :height="tableHeight"
          style="width: 100%"
        >
          <el-table-column type="selection" :width="isMobile ? 40 : 55" />

          <el-table-column
            prop="number"
            label="編號"
            :width="isMobile ? 60 : 80"
          />

          <el-table-column
            prop="name"
            label="姓名"
            :min-width="isMobile ? 70 : 120"
          />

          <el-table-column
            prop="groupId"
            label="組別"
            :min-width="isMobile ? 65 : 120"
          >
            <template #default="{ row }">
              <el-tag
                v-if="getGroupName(row.groupId)"
                size="small"
                :style="{
                  backgroundColor: getGroupColor(row.groupId),
                  border: 'none',
                  color: getTextColor(getGroupColor(row.groupId)),
                  fontWeight: '500',
                  fontSize: '14px',
                }"
              >
                {{ getGroupName(row.groupId) }}
              </el-tag>
              <span v-else class="info-text">未分組</span>
            </template>
          </el-table-column>

          <el-table-column
            prop="floor"
            label="樓層"
            :width="isMobile ? 60 : 80"
          >
            <template #default="{ row }">
              {{ row.floor || "未設定" }}
            </template>
          </el-table-column>

          <el-table-column
            prop="level"
            label="等級"
            :width="isMobile ? 50 : 80"
          />

          <el-table-column
            prop="baseHourlyWage"
            label="基本時薪"
            :width="isMobile ? 70 : 100"
          >
            <template #default="{ row }">
              {{ row.baseHourlyWage || 0 }} 元
            </template>
          </el-table-column>

          <el-table-column
            prop="baseWorkingHours"
            label="基本工時"
            :width="isMobile ? 70 : 100"
          >
            <template #default="{ row }">
              {{ row.baseWorkingHours || 0 }} 小時
            </template>
          </el-table-column>

          <el-table-column
            label="操作"
            :width="isMobile ? 60 : 80"
            fixed="right"
          >
            <template #default="{ row }">
              <el-dropdown
                trigger="click"
                @command="(command) => handleCommand(command, row)"
              >
                <el-button size="small" :icon="More" circle />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-if="authStore.hasPermission('canEditWorkers')"
                      command="edit"
                      :icon="Edit"
                      >編輯</el-dropdown-item
                    >
                    <el-dropdown-item
                      v-if="authStore.hasPermission('canEditTime')"
                      command="time"
                      :icon="Clock"
                      >時數</el-dropdown-item
                    >
                    <el-dropdown-item
                      v-if="authStore.hasPermission('canEditWorkers')"
                      command="delete"
                      :icon="Delete"
                      divided
                      >刪除</el-dropdown-item
                    >
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 新增/編輯工讀生對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '編輯工讀生' : '新增工讀生'"
      :width="isMobile ? '95%' : '600px'"
      center
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        class="responsive-form"
      >
        <el-form-item label="編號" prop="number">
          <el-input v-model="form.number" placeholder="請輸入工讀生編號" />
        </el-form-item>

        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="請輸入姓名" />
        </el-form-item>

        <el-form-item label="性別" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="等級" prop="level">
          <el-slider
            v-model="form.level"
            :min="1"
            :max="10"
            :step="1"
            show-stops
            show-input
          />
        </el-form-item>

        <el-form-item label="組別">
          <el-select v-model="form.groupId" placeholder="請選擇組別" clearable>
            <el-option
              v-for="group in groups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="樓層">
          <el-input
            v-model="form.floor"
            placeholder="請輸入樓層 (如：1F, B1, 3F)"
          />
        </el-form-item>

        <el-form-item label="基本時薪">
          <el-input-number
            v-model="form.baseHourlyWage"
            :min="0"
            :step="1"
            placeholder="基本時薪"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="基本工時">
          <el-input-number
            v-model="form.baseWorkingHours"
            :min="0"
            :step="0.5"
            :precision="1"
            placeholder="基本工時"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="action-buttons">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? "更新" : "新增" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 批次薪資設定對話框 -->
    <el-dialog
      v-model="batchWageDialogVisible"
      title="批次薪資設定"
      :width="isMobile ? '95%' : '500px'"
      center
    >
      <el-form ref="batchFormRef" :model="batchForm" label-width="100px">
        <el-form-item label="基本時薪">
          <el-input-number
            v-model="batchForm.baseHourlyWage"
            :min="0"
            :step="1"
            placeholder="統一設定基本時薪"
            style="width: 100%"
          />
          <div class="form-tip">留空則不修改此項目</div>
        </el-form-item>

        <el-form-item label="基本工時">
          <el-input-number
            v-model="batchForm.baseWorkingHours"
            :min="0"
            :step="0.5"
            :precision="1"
            placeholder="統一設定基本工時"
            style="width: 100%"
          />
          <div class="form-tip">留空則不修改此項目</div>
        </el-form-item>

        <el-form-item label="選中人員">
          <div class="selected-workers">
            <el-tag
              v-for="worker in selectedWorkers"
              :key="worker.id"
              type="info"
              size="small"
              style="margin: 2px"
            >
              {{ worker.name }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="action-buttons">
          <el-button @click="batchWageDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleBatchWageSubmit"
            :loading="submitting"
          >
            批次更新
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 時數調整對話框 -->
    <el-dialog
      v-model="timeDialogVisible"
      title="時數調整"
      :width="isMobile ? '95%' : '500px'"
      center
    >
      <el-form ref="timeFormRef" :model="timeForm" label-width="100px">
        <el-form-item label="工讀生">
          <el-input v-model="timeForm.workerName" readonly />
        </el-form-item>

        <el-form-item label="日期" required>
          <el-date-picker
            v-model="timeForm.date"
            type="date"
            placeholder="選擇日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="調整類型" required>
          <el-radio-group v-model="timeForm.adjustmentType">
            <el-radio value="add">增加時數</el-radio>
            <el-radio value="subtract">扣除時數</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="時數" required>
          <el-input-number
            v-model="timeForm.hours"
            :min="0.5"
            :step="0.5"
            :precision="1"
            placeholder="請輸入時數"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="備註">
          <el-input
            v-model="timeForm.description"
            type="textarea"
            :rows="3"
            placeholder="請輸入調整原因或備註"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="action-buttons">
          <el-button @click="timeDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleTimeSubmit"
            :loading="submitting"
          >
            確定調整
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Excel 匯入對話框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="匯入 Excel 檔案"
      :width="isMobile ? '95%' : '600px'"
      center
    >
      <div class="import-content">
        <div class="import-instructions">
          <el-alert
            title="檔案格式說明"
            type="info"
            :closable="false"
            show-icon
          >
            <div class="format-description">
              <p><strong>Excel 檔案格式要求：</strong></p>
              <ul>
                <li>A 欄位：工讀生編號</li>
                <li>B 欄位：姓名</li>
                <li>C 欄位：組別名稱</li>
                <li>D 欄位：樓層</li>
                <li>E 欄位：基本時薪</li>
              </ul>
              <p class="note">
                系統會自動建立不存在的組別，並將工讀生分配到對應組別。
              </p>
            </div>
          </el-alert>
        </div>

        <div class="file-upload-area">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".xlsx,.xls"
            :before-upload="beforeUpload"
            @change="handleFileChange"
            drag
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽檔案到此處或 <em>點擊選擇檔案</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">只能上傳 .xlsx/.xls 檔案</div>
            </template>
          </el-upload>
        </div>

        <!-- 預覽數據 -->
        <div v-if="previewData.length > 0" class="preview-section">
          <h3>數據預覽</h3>
          <el-table
            :data="previewData.slice(0, 5)"
            stripe
            size="small"
            max-height="200"
          >
            <el-table-column prop="number" label="編號" width="100" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="groupName" label="組別" width="100" />
            <el-table-column prop="floor" label="樓層" width="80" />
            <el-table-column
              prop="baseHourlyWage"
              label="基本時薪"
              width="100"
            />
            <el-table-column prop="status" label="狀態" width="80">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'valid' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ row.status === "valid" ? "正常" : "錯誤" }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div class="preview-summary">
            <p>總共 {{ previewData.length }} 筆數據</p>
            <p>有效數據：{{ validDataCount }} 筆</p>
            <p>錯誤數據：{{ errorDataCount }} 筆</p>
            <p v-if="newGroupsCount > 0">新組別：{{ newGroupsCount }} 個</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="action-buttons">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleImportSubmit"
            :loading="importing"
            :disabled="validDataCount === 0"
          >
            匯入 ({{ validDataCount }} 筆)
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Edit,
  Delete,
  Search,
  Money,
  Upload,
  UploadFilled,
  More,
  Clock,
} from "@element-plus/icons-vue";
import { useWorkersStore } from "../stores/workers";
import { useGroupsStore } from "../stores/groups";
import { useAuthStore } from "../stores/auth";
import * as XLSX from "xlsx";

const workersStore = useWorkersStore();
const groupsStore = useGroupsStore();
const authStore = useAuthStore();

// 響應式數據
const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);
const isMobile = computed(() => windowWidth.value <= 768);

// 計算表格高度
const tableHeight = computed(() => {
  if (isMobile.value) {
    // 手機版使用較小的固定高度
    return 400;
  }

  // 桌面版動態計算
  // 頁面總高度 - 頭部導航(60px) - 頁面頭部(120px) - 篩選卡片(100px) - 樓層標籤(80px) - 邊距和其他元素(100px)
  const usedHeight = 460;
  const availableHeight = windowHeight.value - usedHeight;

  // 最小高度450px，最大高度700px
  return Math.max(450, Math.min(availableHeight, 700));
});

// 表格數據
const workers = computed(() => workersStore.workers);
const groups = computed(() => groupsStore.groups);
const loading = computed(() => workersStore.loading);

// 搜尋和篩選
const searchText = ref("");
const filterGroup = ref("");

// 樓層篩選
const activeFloorTab = ref(localStorage.getItem("selectedFloorTab") || "all");

// 計算可用的樓層
const availableFloors = computed(() => {
  const floors = [
    ...new Set(workers.value.map((w) => w.floor).filter((f) => f)),
  ];
  return floors.sort((a, b) => {
    // 簡單排序：數字樓層在前，地下室在後
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    if (!isNaN(aNum)) return -1;
    if (!isNaN(bNum)) return 1;
    return a.localeCompare(b);
  });
});

const filteredWorkers = computed(() => {
  let result = workers.value;

  // 樓層篩選
  if (activeFloorTab.value !== "all") {
    if (activeFloorTab.value === "unset") {
      result = result.filter((w) => !w.floor);
    } else {
      result = result.filter((w) => w.floor === activeFloorTab.value);
    }
  }

  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter(
      (worker) =>
        worker.name.toLowerCase().includes(search) ||
        worker.number.toLowerCase().includes(search),
    );
  }

  if (filterGroup.value) {
    result = result.filter((worker) => worker.groupId === filterGroup.value);
  }

  // 當顯示"全部"時，按編號排序
  if (activeFloorTab.value === "all") {
    result = result.sort((a, b) => {
      const aNum = parseInt(a.number) || 0;
      const bNum = parseInt(b.number) || 0;
      return aNum - bNum;
    });
  }

  return result;
});

// 表格選擇
const selectedWorkers = ref([]);

const handleSelectionChange = (selection) => {
  selectedWorkers.value = selection;
};

// 樓層標籤處理
const handleTabChange = (tabName) => {
  activeFloorTab.value = tabName;
  localStorage.setItem("selectedFloorTab", tabName);
};

// 操作按鈕處理
const handleCommand = (command, worker) => {
  if (command === "edit") {
    showEditDialog(worker);
  } else if (command === "delete") {
    handleDelete(worker);
  } else if (command === "time") {
    showTimeDialog(worker);
  }
};

// 對話框狀態
const dialogVisible = ref(false);
const batchWageDialogVisible = ref(false);
const importDialogVisible = ref(false);
const timeDialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);
const importing = ref(false);

// 表單數據
const form = ref({
  number: "",
  name: "",
  gender: "male",
  level: 1,
  groupId: "",
  baseHourlyWage: 0,
  baseWorkingHours: 0,
});

const batchForm = ref({
  baseHourlyWage: undefined,
  baseWorkingHours: undefined,
});

const timeForm = ref({
  workerId: "",
  workerName: "",
  date: "",
  hours: 0,
  description: "",
  adjustmentType: "add", // 'add' 或 'subtract'
});

// 表單驗證規則
const formRules = {
  number: [{ required: true, message: "請輸入工讀生編號", trigger: "blur" }],
  name: [{ required: true, message: "請輸入姓名", trigger: "blur" }],
  gender: [{ required: true, message: "請選擇性別", trigger: "change" }],
  level: [{ required: true, message: "請選擇等級", trigger: "change" }],
};

const formRef = ref();
const batchFormRef = ref();
const uploadRef = ref();

// Excel 匯入相關
const previewData = ref([]);
const validDataCount = computed(
  () => previewData.value.filter((item) => item.status === "valid").length,
);
const errorDataCount = computed(
  () => previewData.value.filter((item) => item.status === "error").length,
);
const newGroupsCount = ref(0);

// 馬卡龍色系配色（柔和清新）
const macaronColors = [
  "#FFB5C5", // 粉紅
  "#FFD4A3", // 杏桃
  "#A8E6CF", // 薄荷綠
  "#87CEEB", // 天空藍
  "#E6B0E7", // 薰衣草紫
  "#FFE4B5", // 奶油黃
  "#F4A5A5", // 玫瑰粉
  "#B5E7A0", // 抹茶綠
  "#A8D8EA", // 水藍
  "#FFCCE1", // 櫻花粉
  "#FFE5B4", // 芒果黃
  "#D4A5A5", // 可可棕
  "#C5E1A5", // 青蘋果綠
  "#B3D9FF", // 嬰兒藍
  "#F0C4FF", // 丁香紫
  "#FFD4D4", // 蜜桃粉
  "#D4F1D4", // 清新綠
  "#FFE0B2", // 焦糖奶茶
  "#E1BEE7", // 梅子紫
  "#C8E6C9", // 薄荷奶綠
];

// 工具函數
const getGroupName = (groupId) => {
  if (!groupId) return "";
  const group = groups.value.find((g) => g.id === groupId);
  return group ? group.name : "";
};

// 獲取組別顏色
const getGroupColor = (groupId) => {
  if (!groupId) return macaronColors[0];
  const groupIndex = groups.value.findIndex((g) => g.id === groupId);
  return macaronColors[groupIndex % macaronColors.length];
};

// 計算適合的文字顏色（根據背景色亮度）
const getTextColor = (backgroundColor) => {
  // 移除 # 號
  const color = backgroundColor.replace("#", "");

  // 將十六進制轉換為 RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // 計算相對亮度 (使用 WCAG 標準)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // 亮度大於 0.5 使用深色文字，否則使用淺色文字
  return luminance > 0.5 ? "#333333" : "#ffffff";
};

// 對話框操作
const showAddDialog = () => {
  isEdit.value = false;
  form.value = {
    number: "",
    name: "",
    gender: "male",
    level: 1,
    groupId: "",
    floor: "",
    baseHourlyWage: 0,
    baseWorkingHours: 0,
  };
  dialogVisible.value = true;
};

const showEditDialog = (worker) => {
  isEdit.value = true;
  form.value = { ...worker };
  dialogVisible.value = true;
};

const showBatchWageDialog = () => {
  batchForm.value = {
    baseHourlyWage: undefined,
    baseWorkingHours: undefined,
  };
  batchWageDialogVisible.value = true;
};

const showTimeDialog = (worker) => {
  timeForm.value = {
    workerId: worker.id,
    workerName: worker.name,
    date: new Date().toISOString().split("T")[0], // 今天日期
    hours: 0,
    description: "",
    adjustmentType: "add",
  };
  timeDialogVisible.value = true;
};

// Excel 匯入相關函數
const showImportDialog = () => {
  previewData.value = [];
  newGroupsCount.value = 0;
  importDialogVisible.value = true;
};

const beforeUpload = (file) => {
  const isExcel =
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel";

  if (!isExcel) {
    ElMessage.error("只能上傳 Excel 檔案！");
    return false;
  }

  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isLt5M) {
    ElMessage.error("檔案大小不能超過 5MB！");
    return false;
  }

  return true;
};

const handleFileChange = (file) => {
  if (file.raw) {
    parseExcelFile(file.raw);
  }
};

const parseExcelFile = async (file) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // 直接用標題行（中文）自動對應
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // 處理數據並驗證
    const processedData = [];
    const existingGroups = groups.value.map((g) => g.name);
    const newGroups = new Set();

    jsonData.forEach((row, index) => {
      // 保留原始姓名（包含數字與點）
      const name = String(row["姓名"] || "").trim();
      const groupName = String(row["組別"] || "").trim();

      const item = {
        number: String(row["編號"] || "").trim(),
        name,
        groupName,
        floor: String(row["樓層"] || "").trim(),
        baseHourlyWage: Number(row["時薪"]) || 0,
        status: "valid",
        errors: [],
      };

      // 驗證必要欄位
      if (!item.number) {
        item.status = "error";
        item.errors.push("編號不能為空");
      }

      if (!item.name) {
        item.status = "error";
        item.errors.push("姓名不能為空");
      }

      // 檢查編號是否重複（與現有工讀生）
      if (workers.value.find((w) => w.number === item.number)) {
        item.status = "error";
        item.errors.push("編號已存在");
      }

      // 檢查編號是否在當前匯入數據中重複
      if (processedData.find((p) => p.number === item.number)) {
        item.status = "error";
        item.errors.push("編號重複");
      }

      // 檢查組別
      if (item.groupName && !existingGroups.includes(item.groupName)) {
        newGroups.add(item.groupName);
      }

      processedData.push(item);
    });

    previewData.value = processedData;
    newGroupsCount.value = newGroups.size;

    ElMessage.success(`成功解析 Excel 檔案，共 ${processedData.length} 筆數據`);
  } catch (error) {
    console.error("解析 Excel 檔案失敗:", error);
    ElMessage.error("Excel 檔案解析失敗，請檢查檔案格式");
  }
};

const handleImportSubmit = async () => {
  try {
    importing.value = true;

    const validData = previewData.value.filter(
      (item) => item.status === "valid",
    );

    if (validData.length === 0) {
      ElMessage.warning("沒有有效的數據可以匯入");
      return;
    }

    // 先創建新組別
    const existingGroups = groups.value.map((g) => g.name);
    const newGroups = [
      ...new Set(
        validData
          .map((item) => item.groupName)
          .filter((name) => name && !existingGroups.includes(name)),
      ),
    ];

    const createdGroups = {};
    for (const groupName of newGroups) {
      try {
        console.log(`正在建立組別: ${groupName}`);
        const newGroup = await groupsStore.addGroup({
          name: groupName,
          description: `從 Excel 匯入的組別`,
        });
        console.log(`組別建立成功:`, newGroup);
        if (newGroup && newGroup.id) {
          createdGroups[groupName] = newGroup.id;
          console.log(`組別 ${groupName} 的 ID: ${newGroup.id}`);
        } else {
          console.error(`組別 ${groupName} 建立失敗：沒有回傳 ID`);
        }
      } catch (error) {
        console.error(`創建組別 ${groupName} 失敗:`, error);
        console.error(`錯誤詳情:`, error.message, error.stack);
      }
    }

    console.log(`已建立的組別對應表:`, createdGroups);

    // 重新載入組別列表
    await groupsStore.fetchGroups();
    console.log(`重新載入後的組別列表:`, groups.value);

    // 匯入工讀生
    let successCount = 0;
    let failCount = 0;

    for (const item of validData) {
      try {
        // 在匯入時才對應 groupId（此時新組別已建立）
        let groupId = null;
        if (item.groupName) {
          const group = groups.value.find((g) => g.name === item.groupName);
          groupId = group ? group.id : createdGroups[item.groupName];
          console.log(
            `工讀生 ${item.name} 的組別 ${item.groupName} 對應到 groupId: ${groupId}`,
          );
        }

        const workerData = {
          number: item.number,
          name: item.name,
          gender: "male", // 預設值
          level: 1, // 預設值
          groupId: groupId,
          floor: item.floor || "",
          baseHourlyWage: item.baseHourlyWage,
          baseWorkingHours: 8, // 預設值
        };

        console.log(`準備新增工讀生:`, workerData);
        await workersStore.addWorker(workerData);
        console.log(`工讀生 ${item.name} 新增成功`);
        successCount++;
      } catch (error) {
        console.error(`匯入工讀生 ${item.name} 失敗:`, error);
        console.error(`錯誤詳情:`, error.message, error.stack);
        failCount++;
      }
    }

    if (newGroups.length > 0) {
      ElMessage.success(
        `匯入完成！成功匯入 ${successCount} 名工讀生，${failCount} 名失敗，新建 ${newGroups.length} 個組別`,
      );
    } else {
      ElMessage.success(
        `匯入完成！成功匯入 ${successCount} 名工讀生，${failCount} 名失敗`,
      );
    }

    importDialogVisible.value = false;
    previewData.value = [];

    // 清空上傳組件
    uploadRef.value?.clearFiles();
  } catch (error) {
    ElMessage.error("匯入過程中發生錯誤");
    console.error("匯入錯誤:", error);
  } finally {
    importing.value = false;
  }
};

// 提交操作
const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    submitting.value = true;

    if (isEdit.value) {
      await workersStore.updateWorker(form.value.id, form.value);
      ElMessage.success("工讀生資料更新成功");
    } else {
      await workersStore.addWorker(form.value);
      ElMessage.success("工讀生新增成功");
    }

    dialogVisible.value = false;
  } catch (error) {
    // 錯誤處理已在 store 中完成
  } finally {
    submitting.value = false;
  }
};

const handleBatchWageSubmit = async () => {
  try {
    if (
      batchForm.value.baseHourlyWage === undefined &&
      batchForm.value.baseWorkingHours === undefined
    ) {
      ElMessage.warning("請至少設定一個項目");
      return;
    }

    submitting.value = true;
    const workerIds = selectedWorkers.value.map((w) => w.id);
    const updateData = {};

    if (batchForm.value.baseHourlyWage !== undefined) {
      updateData.baseHourlyWage = batchForm.value.baseHourlyWage;
    }
    if (batchForm.value.baseWorkingHours !== undefined) {
      updateData.baseWorkingHours = batchForm.value.baseWorkingHours;
    }

    const result = await workersStore.batchUpdateWage(workerIds, updateData);
    ElMessage.success(`成功更新 ${result.updatedCount} 名工讀生的薪資設定`);

    batchWageDialogVisible.value = false;
    selectedWorkers.value = [];
  } catch (error) {
    // 錯誤處理已在 store 中完成
  } finally {
    submitting.value = false;
  }
};

const handleTimeSubmit = async () => {
  try {
    if (timeForm.value.hours <= 0) {
      ElMessage.warning("請輸入有效的時數");
      return;
    }

    if (!timeForm.value.date) {
      ElMessage.warning("請選擇日期");
      return;
    }

    submitting.value = true;

    const description =
      timeForm.value.description ||
      `${timeForm.value.adjustmentType === "add" ? "手動新增" : "手動扣除"}時數`;

    const timeRecord = {
      workerId: timeForm.value.workerId,
      date: timeForm.value.date,
      hours: timeForm.value.hours,
      description: description,
      adjustmentType: timeForm.value.adjustmentType, // 傳遞調整類型：add 或 subtract
    };

    await workersStore.addTimeRecord(timeRecord);
    ElMessage.success(
      `時數${timeForm.value.adjustmentType === "add" ? "新增" : "扣除"}記錄已建立`,
    );

    timeDialogVisible.value = false;
    timeForm.value = {
      workerId: "",
      workerName: "",
      date: "",
      hours: 0,
      description: "",
      adjustmentType: "add",
    };
  } catch (error) {
    ElMessage.error(error.message || "時數調整記錄建立失敗");
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (worker) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除工讀生 "${worker.name}" 嗎？`,
      "確認刪除",
      {
        confirmButtonText: "確定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    await workersStore.deleteWorker(worker.id);
    ElMessage.success("工讀生刪除成功");
  } catch (error) {
    if (error !== "cancel") {
      // 錯誤處理已在 store 中完成
    }
  }
};

// 響應式處理
const handleResize = () => {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
  workersStore.fetchWorkers();
  groupsStore.fetchGroups();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.workers-container {
  padding: 20px;
  position: relative;
  height: 100%;
  overflow: auto;
}

/* 自定義滾動條樣式 */
.workers-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.workers-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.workers-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.workers-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 右下角浮動按鈕群組 */
.floating-buttons {
  position: fixed;
  bottom: 70px;
  right: 30px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 新增工讀生按鈕 */
.floating-add-btn {
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.floating-add-btn:hover {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}

/* 批次薪資設定按鈕 */
.floating-batch-btn {
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.4);
}

.floating-batch-btn:hover {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}

/* 篩選卡片內容 */
.filter-content {
  width: 100%;
}

.filter-row {
  align-items: center;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-card .el-col {
  margin-bottom: 8px;
}

.table-container {
  overflow: hidden;
}

.table-card {
  margin-bottom: 20px;
}

.responsive-table {
  width: 100%;
}

.responsive-table .el-table__body-wrapper {
  overflow-y: auto !important;
}

.selected-workers {
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 8px;
  background-color: #f5f7fa;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* Excel 匯入樣式 */
.import-content {
  padding: 10px 0;
}

.import-instructions {
  margin-bottom: 20px;
}

.format-description ul {
  margin: 10px 0;
  padding-left: 20px;
}

.format-description li {
  margin-bottom: 5px;
}

.format-description .note {
  margin-top: 10px;
  color: #e6a23c;
  font-size: 13px;
}

.file-upload-area {
  margin: 20px 0;
}

.preview-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.preview-section h3 {
  margin-bottom: 16px;
  color: #303133;
  font-size: 16px;
}

.preview-summary {
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}

.preview-summary p {
  margin: 4px 0;
  color: #606266;
}

/* 手機端適配 */
@media (max-width: 768px) {
  .workers-container {
    padding: 12px;
    height: 100%;
    overflow: auto;
  }

  .workers-container::-webkit-scrollbar {
    width: 4px;
  }

  /* 手機端篩選卡片高度調整 */
  .filter-card .el-card__body {
    padding: 8px 12px !important;
  }

  /* 手機端表格卡片調整 */
  .table-card .el-card__body {
    padding: 5px !important;
  }

  .table-card .el-card__body .el-table {
    height: calc(100vh - 280px); /* 增加表格本身的高度 */
  }

  .table-card .el-card__body .el-table .el-table__fixed-right {
    right: 0 !important;
  }

  .table-card .el-card__body .el-table .el-table__fixed-right-patch {
    right: 0 !important;
  }

  /* 確保固定右側欄位在手機端正常顯示 */
  .responsive-table .el-table__fixed-right {
    z-index: 10;
    background-color: #fff;
  }

  .responsive-table .el-table__fixed-right .el-table__fixed-body-wrapper {
    z-index: 10;
  }

  /* 手機端浮動按鈕群組調整 */
  .floating-buttons {
    bottom: 70px;
    right: 20px;
    gap: 12px;
  }

  .floating-add-btn,
  .floating-batch-btn {
    width: 48px;
    height: 48px;
  }

  /* 手機端篩選動作按鈕 */
  .filter-actions {
    justify-content: center;
  }

  .filter-row .el-col {
    margin-bottom: 12px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-actions {
    justify-content: center;
  }

  .page-actions .el-button {
    flex: 1;
  }

  .filter-card .el-row .el-col {
    margin-bottom: 12px;
  }

  .responsive-table {
    font-size: 16px;
  }

  .responsive-table .el-button {
    padding: 4px 8px;
    font-size: 14px;
  }

  .table-container {
    overflow-x: auto;
  }

  .responsive-table {
    width: 100%;
  }

  /* 手機版固定右側操作欄位優化 */
  .responsive-table .el-table__fixed-right {
    right: 0 !important;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  }

  /* 手機端表格欄位優化 */
  .responsive-table .el-table__cell {
    padding: 8px 4px; /* 減少欄位內邊距 */
  }

  .responsive-table .el-tag {
    padding: 0 4px; /* 減少標籤內邊距 */
    font-size: 14px; /* 調整標籤字體 */
  }

  .responsive-table .el-dropdown .el-button {
    width: 28px;
    height: 28px;
    padding: 0;
  }
}

.filter-tabs-card {
  .el-tabs__header {
    margin: 0;
  }

  .el-tabs__nav-wrap::after {
    height: 1px;
  }
}

@media (max-width: 768px) {
  .filter-tabs-card {
    .el-tabs__item {
      padding: 0 10px;
      font-size: 14px;
    }
  }
}
</style>
