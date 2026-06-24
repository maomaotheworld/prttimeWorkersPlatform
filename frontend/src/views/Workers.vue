<template>
  <div
    class="workers-container"
    :class="{ 'has-fixed-editing': isMobile && currentEditingWorker }"
  >
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
        <el-button
          v-if="authStore.isEvelyn"
          type="warning"
          @click="clearServerCache"
        >
          刷新快取
        </el-button>
        <el-button
          v-if="authStore.isEvelyn"
          type="danger"
          @click="handleClearAllWorkers"
        >
          清除全部工讀生
        </el-button>
      </div>
    </div>

    <!-- 批次操作 -->
    <el-card v-if="selectedWorkers.length > 0" style="margin-bottom: 10px">
      <div style="display: flex; align-items: center; gap: 10px">
        <span>已選擇 {{ selectedWorkers.length }} 位工讀生</span>
        <el-button size="small" type="warning" @click="showBatchEditHours">
          批次編輯基本時數
        </el-button>
        <el-button
          size="small"
          type="info"
          @click="showBatchAdjustAccumulatedHours"
        >
          批次調整累積工時
        </el-button>
        <el-button size="small" type="primary" @click="showBatchEditWage">
          批次編輯時薪
        </el-button>
        <el-button size="small" type="danger" @click="confirmBatchDelete">
          批次刪除
        </el-button>
        <el-button size="small" @click="clearSelection"> 清除選擇 </el-button>
      </div>
    </el-card>

    <!-- 手機版當前編輯工讀生顯示 -->
    <el-card
      v-if="isMobile && currentEditingWorker"
      class="mobile-editing-worker"
    >
      <div class="editing-worker-info">
        <div class="worker-basic">
          <el-tag type="info" size="small">正在編輯</el-tag>
          <span class="worker-name"
            >{{ currentEditingWorker.workerNumber }} -
            {{ currentEditingWorker.name }}</span
          >
        </div>
        <div class="worker-details">
          <span class="detail-item">{{ currentEditingWorker.group }}</span>
          <span class="detail-item">{{ currentEditingWorker.floor }}樓</span>
          <span class="detail-item"
            >{{ currentEditingWorker.hourlyWage }}元/時</span
          >
        </div>
        <el-button
          size="small"
          @click="clearCurrentEditingWorker"
          style="margin-left: auto"
        >
          收起
        </el-button>
      </div>
    </el-card>

    <!-- 篩選器 -->
    <el-card style="margin-bottom: 10px">
      <div class="filter-container">
        <el-row :gutter="16" align="middle">
          <el-col :span="6">
            <el-input
              v-model="searchName"
              placeholder="搜尋姓名或編號"
              clearable
              @input="applyFilter"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </el-col>
          <el-col :span="5">
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
          <el-col :span="5" v-if="filterType === 'group'">
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
          <el-col :span="5" v-if="filterType === 'floor'">
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
          <el-col :span="3">
            <el-button @click="resetFilter">重置篩選</el-button>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- Table -->
    <el-card>
      <!-- Pagination Info Bar -->
      <div class="pagination-bar">
        <span class="pagination-total">共 <b>{{ filteredWorkers.length }}</b> 位工讀生</span>
        <div class="pagination-controls">
          <span class="pagination-label">每頁顯示</span>
          <el-select
            v-model="pageSize"
            size="small"
            style="width: 90px"
            @change="currentPage = 1"
          >
            <el-option label="10 筆" :value="10" />
            <el-option label="20 筆" :value="20" />
            <el-option label="50 筆" :value="50" />
            <el-option label="100 筆" :value="100" />
          </el-select>
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredWorkers.length"
            layout="prev, pager, next"
            :pager-count="5"
            small
          />
        </div>
      </div>

      <el-table
        :data="paginatedWorkers"
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" :width="isMobile ? '35' : '55'" />
        <el-table-column
          prop="workerNumber"
          label="編號"
          :width="isMobile ? '60' : '80'"
        />
        <el-table-column
          prop="name"
          label="姓名"
          :width="isMobile ? '80' : '120'"
        />
        <el-table-column label="組別" :width="isMobile ? '60' : '100'">
          <template #default="{ row }">
            <el-tag :style="getGroupTagStyle(row.group)" effect="light">
              {{ row.group }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="floor"
          label="樓層"
          :width="isMobile ? '50' : '80'"
        />
        <el-table-column
          prop="job"
          label="工作"
          :width="isMobile ? '100' : '150'"
        >
          <template #default="{ row }">
            <span style="font-size: 12px" :title="row.job">
              {{ row.job || "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="hourlyWage"
          label="時薪"
          :width="isMobile ? '60' : '80'"
        />
        <el-table-column label="累積工時" :width="isMobile ? '60' : '90'">
          <template #default="{ row }">
            {{ row.totalHours || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="薪資總額" :width="isMobile ? '80' : '100'">
          <template #default="{ row }">
            <span style="color: #67c23a; font-weight: bold">
              {{ calculateTotalSalary(row) }}元
            </span>
          </template>
        </el-table-column>
        <el-table-column label="消防" :width="isMobile ? '55' : '70'">
          <template #default="{ row }">
            <el-tag
              :type="row.fireTraining ? 'success' : 'danger'"
              size="small"
              style="cursor:pointer"
              @click="toggleFireTraining(row)"
            >
              {{ row.fireTraining ? "O" : "X" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          :width="isMobile ? '60' : '340'"
        >
          <template #default="{ row }">
            <!-- 桌面版：顯示所有按鈕 -->
            <template v-if="!isMobile">
              <el-button
                size="small"
                type="primary"
                @click="showEditWorker(row)"
              >
                編輯
              </el-button>
              <el-button
                size="small"
                type="warning"
                @click="showAdjustHours(row)"
              >
                工時
              </el-button>
              <el-button
                size="small"
                type="success"
                @click="showSalaryAdjust(row)"
              >
                加薪
              </el-button>
              <el-button
                size="small"
                :type="row.notes ? 'warning' : 'info'"
                @click="openNotesDialog(row)"
                :title="row.notes || '新增備註'"
              >
                {{ row.notes ? '📝備註' : '備註' }}
              </el-button>
              <el-button size="small" type="danger" @click="confirmDelete(row)">
                刪除
              </el-button>
            </template>

            <!-- 手機版：緊湊下拉選單 -->
            <template v-else>
              <el-dropdown
                @command="(command) => handleMobileAction(command, row)"
                trigger="click"
              >
                <el-button size="small" type="primary" style="padding: 4px 8px">
                  ⋯
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">
                      <el-icon><Edit /></el-icon>編輯
                    </el-dropdown-item>
                    <el-dropdown-item command="notes">
                      📝 備註{{ row.notes ? ' ●' : '' }}
                    </el-dropdown-item>
                    <el-dropdown-item command="hours">
                      <el-icon><Clock /></el-icon>調整工時
                    </el-dropdown-item>
                    <el-dropdown-item command="salary">
                      加薪 / 減薪
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>刪除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 備註 Dialog -->
    <el-dialog
      v-model="showNotesDialog"
      :title="`備註 — ${notesWorker?.name || ''}`"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="notesText"
        type="textarea"
        :rows="6"
        placeholder="輸入備註（例如：工作態度認真、需注意出勤…）"
        maxlength="500"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showNotesDialog = false">取消</el-button>
        <el-button type="primary" :loading="savingNotes" @click="saveNotes">
          儲存
        </el-button>
      </template>
    </el-dialog>

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
              {{ row.workerNumber || "缺失" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.name ? 'inherit' : 'red' }">
              {{ row.name || "缺失" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="group" label="組別" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.group ? 'inherit' : 'red' }">
              {{ row.group || "缺失" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="floor" label="樓層" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.floor ? 'inherit' : 'red' }">
              {{ row.floor || "缺失" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="job" label="工作" width="120">
          <template #default="{ row }">
            <span style="font-size: 12px">
              {{ row.job || "-" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="hourlyWage" label="時薪" width="70">
          <template #default="{ row }">
            <span :style="{ color: row.hourlyWage > 0 ? 'inherit' : 'red' }">
              {{ row.hourlyWage || "缺失" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="fireTraining" label="消防" width="60">
          <template #default="{ row }">
            <el-tag :type="row.fireTraining ? 'success' : 'danger'" size="small">
              {{ row.fireTraining ? "O" : "X" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="狀態" width="70">
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
        <el-button @click="closeHoursDialog">取消</el-button>
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
          <el-select
            v-model="workerForm.group"
            placeholder="請選擇組別"
            style="width: 100%"
          >
            <el-option
              v-for="group in allGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="樓層" prop="floor">
          <el-input v-model="workerForm.floor" placeholder="請輸入樓層" />
        </el-form-item>
        <el-form-item label="工作">
          <el-input
            v-model="workerForm.job"
            placeholder="請輸入工作內容 (選填)"
            type="textarea"
            :rows="2"
            maxlength="100"
            show-word-limit
          />
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
        <el-form-item label="消防演習">
          <el-switch
            v-model="workerForm.fireTraining"
            active-text="O（有參加）"
            inactive-text="X（未參加）"
            active-color="#67c23a"
            inactive-color="#f56c6c"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeWorkerDialog">取消</el-button>
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
      <div style="margin-bottom: 15px">
        <span
          >即將為 {{ selectedWorkers.length }} 位工讀生設定統一的基本時數</span
        >
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
    <el-dialog v-model="showBatchWageDialog" title="批次編輯時薪" width="400px">
      <div style="margin-bottom: 15px">
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
        <el-button @click="showBatchAccumulatedHoursDialog = false"
          >取消</el-button
        >
        <el-button
          type="primary"
          @click="submitBatchAccumulatedHours"
          :loading="submitting"
        >
          確定調整
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showSalaryAdjustDialog"
      title="薪資調整"
      width="420px"
    >
      <div v-if="salaryWorker" style="margin-bottom: 16px">
        <strong>{{ salaryWorker.workerNumber }} - {{ salaryWorker.name }}</strong>
      </div>

      <el-form label-width="90px">
        <el-form-item label="調整類型">
          <el-radio-group v-model="salaryForm.type">
            <el-radio label="increase">加薪</el-radio>
            <el-radio label="decrease">減薪</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="調整金額">
          <el-input-number
            v-model="salaryForm.amount"
            :min="1"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="調整原因">
          <el-input
            v-model="salaryForm.reason"
            type="textarea"
            :rows="3"
            placeholder="請輸入加薪或減薪原因"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showSalaryAdjustDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="salaryAdjusting"
          @click="submitSalaryAdjust"
        >
          確認
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Edit, Delete, Clock, ArrowDown, Search } from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import { useWorkersStore } from "@/stores/workers";
import { getApiUrl } from "@/config/api";
import { useAuthStore } from "@/stores/auth";

interface Worker {
  id: string;
  workerNumber: string;
  name: string;
  groupId?: string;
  group: string;
  floor: string;
  hourlyWage: number;
  baseHours: number;
  totalHours: number;
  notes?: string;
  fireTraining?: boolean;
}

const workersStore = useWorkersStore();
const authStore = useAuthStore();
const workers = ref<Worker[]>([]);
const loading = ref(false);
const WORKERS_FILTER_STORAGE_KEY = "workers-page-filters";

// 篩選相關
const filterType = ref("all"); // 'all', 'group', 'floor'
const selectedGroup = ref("");
const selectedFloor = ref("");
const restoreWorkersFilters = () => {
  try {
    const savedFilters = localStorage.getItem(WORKERS_FILTER_STORAGE_KEY);
    if (!savedFilters) return;

    const parsedFilters = JSON.parse(savedFilters);
    filterType.value = parsedFilters.filterType || "all";
    selectedGroup.value = parsedFilters.selectedGroup || "";
    selectedFloor.value = parsedFilters.selectedFloor || "";
  } catch (error) {
    console.warn("恢復工讀生篩選條件失敗:", error);
  }
};

const persistWorkersFilters = () => {
  localStorage.setItem(
    WORKERS_FILTER_STORAGE_KEY,
    JSON.stringify({
      filterType: filterType.value,
      selectedGroup: selectedGroup.value,
      selectedFloor: selectedFloor.value,
    }),
  );
};

// 手機版當前編輯工讀生
const currentEditingWorker = ref<Worker | null>(null);

const isMobile = computed(() => window.innerWidth <= 768);

// 獲取選中工讀生的詳細資料
const selectedWorkerDetails = computed(() => {
  const workerIds = selectedWorkers.value.map((w) => w.id);
  return workers.value.filter((worker) => workerIds.includes(worker.id));
});

// 獲取所有組別
const allGroups = computed(() => {
  return workersStore.groups || [];
});

// 獲取所有樓層
const allFloors = computed(() => {
  const floors = [...new Set(workers.value.map((worker) => worker.floor))];
  return floors.filter((floor) => floor).sort();
});

// Pagination
const currentPage = ref(1);
const pageSize = ref(100);

// 姓名/編號搜尋
const searchName = ref("");

// 篩選後的工讀生列表
const filteredWorkers = computed(() => {
  const sortByNumber = (list: Worker[]) =>
    [...list].sort((a, b) => {
      const na = parseInt(String(a.workerNumber || "").replace(/\D/g, "")) || 0;
      const nb = parseInt(String(b.workerNumber || "").replace(/\D/g, "")) || 0;
      return na - nb;
    });

  let list = workers.value;

  // 組別/樓層篩選
  if (filterType.value === "group" && selectedGroup.value) {
    list = list.filter((w) => w.group === selectedGroup.value);
  } else if (filterType.value === "floor" && selectedFloor.value) {
    list = list.filter((w) => w.floor === selectedFloor.value);
  }

  // 姓名/編號搜尋
  const q = searchName.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (w) =>
        (w.name || "").toLowerCase().includes(q) ||
        String(w.workerNumber || "").toLowerCase().includes(q),
    );
  }

  return sortByNumber(list);
});

// 分頁後的工讀生列表
const paginatedWorkers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredWorkers.value.slice(start, start + pageSize.value);
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

// 備註
const showNotesDialog = ref(false);
const notesWorker = ref<Worker | null>(null);
const notesText = ref("");
const savingNotes = ref(false);

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
  job: "",
  hourlyWage: 200,
  baseHours: 0,
  fireTraining: false,
});

const workerRules = {
  workerNumber: [{ required: true, message: "請輸入編號", trigger: "blur" }],
  name: [{ required: true, message: "請輸入姓名", trigger: "blur" }],
  group: [{ required: true, message: "請選擇組別", trigger: "change" }],
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
  baseHours: 0,
});
const batchWageForm = reactive({
  hourlyWage: 200,
});
const batchAccumulatedHoursForm = reactive({
  type: "add",
  hours: 1,
  reason: "",
});
const showSalaryAdjustDialog = ref(false);
const salaryAdjusting = ref(false);
const salaryWorker = ref<Worker | null>(null);
const salaryForm = reactive({
  type: "increase",
  amount: 100,
  reason: "",
});

// 手機版操作處理
const handleMobileAction = (command: string, row: Worker) => {
  switch (command) {
    case "edit":
      showEditWorker(row);
      break;
    case "notes":
      openNotesDialog(row);
      break;
    case "hours":
      showAdjustHours(row);
      break;
    case "salary":
      showSalaryAdjust(row);
      break;
    case "delete":
      confirmDelete(row);
      break;
  }
};

// 清除當前編輯的工讀生
const clearCurrentEditingWorker = () => {
  currentEditingWorker.value = null;
};

// 計算薪資總額（打卡工時 + 手動增減工時）× 時薪
const calculateTotalSalary = (worker) => {
  const totalHours = worker.totalHours || 0;
  const totalSalary = totalHours * (worker.hourlyWage || 0);
  return totalSalary.toLocaleString();
};

// 關閉工讀生對話框
const closeWorkerDialog = () => {
  showWorkerDialog.value = false;
  if (isMobile.value) {
    currentEditingWorker.value = null;
  }
  resetWorkerForm();
};

// 關閉工時對話框
const closeHoursDialog = () => {
  showHoursDialog.value = false;
  if (isMobile.value) {
    currentEditingWorker.value = null;
  }
};

// 篩選方法
const applyFilter = () => {
  currentPage.value = 1;
  console.log(
    "應用篩選:",
    filterType.value,
    selectedGroup.value,
    selectedFloor.value,
  );
};

const resetFilter = () => {
  filterType.value = "all";
  selectedGroup.value = "";
  selectedFloor.value = "";
  searchName.value = "";
  currentPage.value = 1;
  persistWorkersFilters();
};

const showSalaryAdjust = (worker: Worker) => {
  salaryWorker.value = worker;
  salaryForm.type = "increase";
  salaryForm.amount = 100;
  salaryForm.reason = "";
  showSalaryAdjustDialog.value = true;
};

const submitSalaryAdjust = async () => {
  if (!salaryWorker.value) return;
  if (!salaryForm.reason.trim()) {
    ElMessage.warning("請填寫調整原因");
    return;
  }
  if (!salaryForm.amount || salaryForm.amount <= 0) {
    ElMessage.warning("調整金額必須大於 0");
    return;
  }

  try {
    salaryAdjusting.value = true;

    const token = localStorage.getItem("auth_token");
    const response = await fetch(getApiUrl("/api/salary-adjustments"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        workerId: salaryWorker.value.id,
        type: salaryForm.type,
        amount: salaryForm.amount,
        reason: salaryForm.reason,
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "薪資調整失敗");
    }

    ElMessage.success(
      `${salaryWorker.value.name}${salaryForm.type === "increase" ? "加薪" : "減薪"}紀錄已建立`,
    );
    showSalaryAdjustDialog.value = false;
  } catch (error: any) {
    ElMessage.error("薪資調整失敗: " + (error.message || error));
  } finally {
    salaryAdjusting.value = false;
  }
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
    workers.value = workersStore.workers.map((worker) => {
      const hoursData = additionalHoursMap[worker.id] || { regularHours: 0, additionalHours: 0, totalHours: 0 };

      return {
        id: worker.id,
        workerNumber: worker.number || worker.workerNumber || "",
        name: worker.name || "",
        groupId: worker.groupId || "",
        group: groupMapping[worker.groupId] || worker.group || "",
        floor: worker.floor || "",
        job: worker.job || "",
        hourlyWage: worker.baseHourlyWage || worker.hourlyWage || 0,
        baseHours: worker.baseWorkingHours || worker.baseHours || 0,
        additionalHours: hoursData.additionalHours,
        regularHours: hoursData.regularHours,
        totalHours: hoursData.totalHours,
        fireTraining: worker.fireTraining === true,
        notes: worker.notes || "",
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
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("獲取組別列表失敗");
    }

    const result = await response.json();
    const mapping = {};

    if (result.success && result.data) {
      result.data.forEach((group) => {
        mapping[group.id] = group.name;
      });
    }

    return mapping;
  } catch (error) {
    console.error("獲取組別映射失敗:", error);
    return {};
  }
};

// 批量獲取所有工讀生的額外工時
const getAllWorkersAdditionalHours = async () => {
  try {
    const response = await fetch(
      getApiUrl("/api/time-records/additional-hours"),
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      },
    );

    if (!response.ok) {
      console.warn("批量獲取額外工時API不可用，使用預設值0");
      return {};
    }

    const result = await response.json();
    if (result.success && result.data) {
      // 轉換為 workerId -> { regularHours, additionalHours, totalHours } 的映射
      const hoursMap = {};
      result.data.forEach((item) => {
        hoursMap[item.workerId] = {
          regularHours: item.regularHours || 0,
          additionalHours: item.additionalHours || 0,
          totalHours: item.totalHours || 0,
        };
      });
      return hoursMap;
    }

    return {};
  } catch (error) {
    console.warn("批量獲取額外工時失敗，使用預設值:", error);
    return {};
  }
};

// 馬卡龍色系組別顏色 - 高對比度版本
const macaronColors = [
  { bg: "#FFE1E6", text: "#B91C7C" }, // 櫻花粉配深紫紅
  { bg: "#E6F7ED", text: "#059669" }, // 薄荷綠配深綠
  { bg: "#E1F0FF", text: "#1E40AF" }, // 天空藍配深藍
  { bg: "#FEF3C7", text: "#D97706" }, // 檸檬黃配橙
  { bg: "#FFE4D1", text: "#EA580C" }, // 蜜桃橙配深橙
  { bg: "#F3E8FF", text: "#7C3AED" }, // 薰衣草紫配深紫
  { bg: "#ECFDF5", text: "#047857" }, // 青草綠配深綠
  { bg: "#FDEAEF", text: "#BE185D" }, // 玫瑰粉配深紫紅
  { bg: "#E0F2FE", text: "#0369A1" }, // 青藍色配深青
  { bg: "#F7FEE7", text: "#65A30D" }, // 淺綠黃配深綠
];

const getGroupTagStyle = (groupName: string) => {
  if (!groupName)
    return {
      backgroundColor: macaronColors[0].bg,
      color: macaronColors[0].text,
    };

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
    fontWeight: "500",
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

      // 姓名空白、x、- 視為無效列，直接跳過不匯入
      const INVALID_NAMES = ["", "x", "X", "-", "—", "－"];
      if (INVALID_NAMES.includes(name)) {
        console.log(`跳過無效姓名列 ${i}: "${name}"`);
        continue;
      }
      const group = String(r[2] != null ? r[2] : "").trim();
      const floor = String(r[3] != null ? r[3] : "").trim();
      const job = String(r[4] != null ? r[4] : "").trim();
      const hourlyWage = r[5] != null ? Number(r[5]) : 0;
      const fireTrainingRaw = String(r[6] != null ? r[6] : "").trim();
      const fireTraining = fireTrainingRaw === "O" || fireTrainingRaw === "o";

      // 確保數據格式正確
      const workerData = {
        workerNumber,
        name,
        group,
        floor,
        job,
        hourlyWage,
        baseHours: 0,
        fireTraining,
        valid: workerNumber && name && group && floor && hourlyWage > 0,
      };

      console.log(`Excel 第${i}行解析結果:`, workerData);
      console.log(`Excel 第${i}行驗證:`, {
        workerNumber: !!workerNumber,
        name: !!name,
        group: !!group,
        floor: !!floor,
        hourlyWage: hourlyWage > 0,
        valid: workerData.valid,
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
  const cleanData = validData.map((item) => ({
    workerNumber: item.workerNumber,
    name: item.name,
    group: item.group,
    floor: item.floor,
  job: item.job,
    hourlyWage: item.hourlyWage,
    baseHours: item.baseHours || 0,
  fireTraining: item.fireTraining,
  }));

  console.log("準備匯入的數據:", cleanData);

  try {
    const results = await workersStore.importWorkers(cleanData);
    const skipped = results.skipped || 0;
    if (results.failed === 0 && skipped === 0) {
      ElMessage.success(`成功匯入 ${results.success} 筆`);
    } else if (results.failed === 0) {
      ElMessage.success(`新增 ${results.success} 筆，略過重複 ${skipped} 筆`);
    } else {
      const errorList = results.errors.slice(0, 5).join("、");
      const more = results.errors.length > 5 ? `...等 ${results.errors.length} 筆` : "";
      ElMessageBox.alert(
        `新增：${results.success} 筆　略過重複：${skipped} 筆　失敗：${results.failed} 筆\n\n失敗名單：${errorList}${more}`,
        "匯入結果",
        { type: "warning", confirmButtonText: "確定" }
      );
    }
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

// 清除全部工讀生（僅 evelyn）
const handleClearAllWorkers = async () => {
  // 第一次確認
  try {
    await ElMessageBox.confirm(
      `即將刪除全部 ${workers.value.length} 位工讀生及相關打卡、薪資紀錄，此操作無法復原（系統會先寄送備份到信箱）。確定要繼續？`,
      "⚠️ 清除全部工讀生",
      {
        confirmButtonText: "繼續",
        cancelButtonText: "取消",
        type: "warning",
        confirmButtonClass: "el-button--danger",
      }
    );
  } catch {
    return;
  }

  // 第二次確認
  try {
    await ElMessageBox.confirm(
      "請再次確認！這將永久刪除所有工讀生資料，確定執行？",
      "⚠️ 最後確認",
      {
        confirmButtonText: "確定刪除全部",
        cancelButtonText: "取消",
        type: "error",
        confirmButtonClass: "el-button--danger",
      }
    );
  } catch {
    return;
  }

  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(getApiUrl("/api/admin/cleanup/all-data"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (data.success) {
      ElMessage.success(data.message || "已清除全部工讀生資料");
      fetchWorkers();
    } else {
      ElMessage.error(data.message || "清除失敗");
    }
  } catch (error) {
    ElMessage.error("清除失敗：" + error.message);
  }
};

// 工時
const showAdjustHours = (worker: Worker) => {
  currentWorker.value = worker;

  // 在手機模式下設置當前編輯的工讀生
  if (isMobile.value) {
    currentEditingWorker.value = worker;
  }

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
    const adjustedHours =
      hoursForm.type === "add" ? hoursForm.hours : -hoursForm.hours;

    await workersStore.addTimeRecord({
      workerId: currentWorker.value.id,
      date: new Date().toISOString().split("T")[0],
      hours: adjustedHours,
      description: hoursForm.reason,
      adjustmentType: hoursForm.type,
      workerName: currentWorker.value.name,
    });

    ElMessage.success(
      `工時調整成功: ${hoursForm.type === "add" ? "+" : "-"}${Math.abs(adjustedHours)}小時`,
    );
    showHoursDialog.value = false;
    if (isMobile.value) {
      currentEditingWorker.value = null;
    }

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

  // 在手機模式下設置當前編輯的工讀生
  if (isMobile.value) {
    currentEditingWorker.value = worker;
  }

  console.log("編輯工讀生 - 原始數據:", worker);

  // 確保所有字段都正確映射，處理可能的字段名差異
  workerForm.id = worker.id || worker._id || "";
  workerForm.workerNumber = worker.workerNumber || worker.worker_number || "";
  workerForm.name = worker.name || "";
  workerForm.group =
    worker.groupId ||
    allGroups.value.find((group) => group.name === worker.group)?.id ||
    "";
  workerForm.floor = worker.floor || "";
  workerForm.job = worker.job || ""; // 新增工作欄位映射
  workerForm.hourlyWage =
    Number(worker.hourlyWage || worker.hourly_wage) || 200;
  workerForm.baseHours = Number(worker.baseHours || worker.base_hours) || 0;
  workerForm.fireTraining = !!worker.fireTraining;

  console.log("編輯工讀生 - 表單數據:", workerForm);

  showWorkerDialog.value = true;
};

const toggleFireTraining = async (worker: Worker) => {
  try {
    const newState = !worker.fireTraining;
    await workersStore.updateWorker(worker.id, {
      ...worker,
      fireTraining: newState,
    });
    // 即時更新本地列表，讓畫面立即反映
    const idx = workers.value.findIndex((w) => w.id === worker.id);
    if (idx !== -1) workers.value[idx].fireTraining = newState;
    ElMessage.success(`已更新 ${worker.name} 消防狀態`);
  } catch (e) {
    ElMessage.error("更新失敗");
  }
};

const openNotesDialog = (worker: Worker) => {
  notesWorker.value = worker;
  notesText.value = worker.notes || "";
  showNotesDialog.value = true;
};

const saveNotes = async () => {
  if (!notesWorker.value) return;
  savingNotes.value = true;
  try {
    await workersStore.updateWorker(notesWorker.value.id, {
      ...notesWorker.value,
      notes: notesText.value,
    });
    // 即時更新本地列表
    const idx = workers.value.findIndex((w) => w.id === notesWorker.value!.id);
    if (idx !== -1) workers.value[idx].notes = notesText.value;
    ElMessage.success("備註已儲存");
    showNotesDialog.value = false;
  } catch (e) {
    ElMessage.error("儲存失敗");
  } finally {
    savingNotes.value = false;
  }
};

const resetWorkerForm = () => {
  Object.assign(workerForm, {
    id: "",
    workerNumber: "",
    name: "",
    group: "",
    floor: "",
    job: "",
    hourlyWage: 200,
    baseHours: 0,
    fireTraining: false,
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
    if (isMobile.value) {
      currentEditingWorker.value = null;
    }
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
  batchAccumulatedHoursForm.type = "add";
  batchAccumulatedHoursForm.hours = 1;
  batchAccumulatedHoursForm.reason = "";
  showBatchAccumulatedHoursDialog.value = true;
};

const removeFromBatchSelection = (workerId: string) => {
  selectedWorkers.value = selectedWorkers.value.filter(
    (w) => w.id !== workerId,
  );
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
      },
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
        baseHours: batchHoursForm.baseHours,
      });
    }

    ElMessage.success(
      `成功更新 ${selectedWorkers.value.length} 位工讀生的基本時數`,
    );
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
      const response = await fetch(
        `${getApiUrl()}/workers/${worker.id}/additional-hours`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: batchAccumulatedHoursForm.type,
            hours: batchAccumulatedHoursForm.hours,
            reason: `[批次調整] ${batchAccumulatedHoursForm.reason}`,
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || `調整 ${worker.name} 的工時失敗`);
      }
    }

    const actionText =
      batchAccumulatedHoursForm.type === "add" ? "增加" : "減少";
    ElMessage.success(
      `成功為 ${selectedWorkerDetails.value.length} 位工讀生${actionText} ${batchAccumulatedHoursForm.hours} 小時`,
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
        hourlyWage: batchWageForm.hourlyWage,
      });
    }

    ElMessage.success(
      `成功更新 ${selectedWorkers.value.length} 位工讀生的時薪`,
    );
    showBatchWageDialog.value = false;
    selectedWorkers.value = [];
    fetchWorkers();
  } catch (error: any) {
    ElMessage.error("批次更新時薪失敗: " + (error.message || error));
  }
};

onMounted(async () => {
  restoreWorkersFilters();
  await fetchWorkers();
  // 載入組別數據用於篩選
  await workersStore.fetchGroups();
});

watch([filterType, selectedGroup, selectedFloor], () => {
  persistWorkersFilters();
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

/* Pagination bar */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-total {
  color: #606266;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-label {
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}

/* 手機版當前編輯工讀生樣式 */
.mobile-editing-worker {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  margin: 0 !important;
  border-radius: 0 !important;
}

.editing-worker-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.worker-basic {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.worker-name {
  font-weight: 600;
  font-size: 16px;
}

.worker-details {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-item {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

/* 手機版表格樣式調整 */
@media (max-width: 768px) {
  .workers-container {
    padding: 10px;
  }

  /* 當有固定編輯欄位時，為頁面內容添加頂部邊距 */
  .workers-container.has-fixed-editing {
    padding-top: 100px;
  }

  /* 確保表格可以橫向滾動 */
  .el-table {
    overflow-x: auto;
  }

  .el-table .el-table__body-wrapper {
    overflow-x: auto;
  }

  .page-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
