<template>
  <div class="workers-container">
    <!-- 頁面標題和操作按鈕 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><UserFilled /></el-icon>
          工讀生管理
        </h1>
        <p class="page-description">管理工讀生基本資料、時薪調整和工時記錄</p>
      </div>
      <div class="header-actions">
        <!-- Excel 匯入按鈕（僅電腦版顯示） -->
        <el-button 
          v-if="!isMobile" 
          type="success" 
          :icon="Upload" 
          @click="showImportDialog = true"
          class="import-btn"
        >
          匯入 Excel
        </el-button>
        <el-button type="primary" :icon="Plus" @click="showAddDialog">
          新增工讀生
        </el-button>
      </div>
    </div>

    <!-- 統計卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ workers.length }}</div>
          <div class="stat-label">總工讀生數</div>
        </div>
        <el-icon class="stat-icon"><UserFilled /></el-icon>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ activeWorkersCount }}</div>
          <div class="stat-label">在職人數</div>
        </div>
        <el-icon class="stat-icon success"><CircleCheck /></el-icon>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ uniqueGroups.length }}</div>
          <div class="stat-label">工作組別</div>
        </div>
        <el-icon class="stat-icon warning"><Collection /></el-icon>
      </el-card>
    </div>

    <!-- 篩選器 -->
    <el-card class="filter-card">
      <div class="filters">
        <el-select v-model="filterGroup" placeholder="篩選組別" clearable style="width: 150px">
          <el-option label="全部組別" value="" />
          <el-option v-for="group in uniqueGroups" :key="group" :label="group" :value="group" />
        </el-select>
        <el-select v-model="filterFloor" placeholder="篩選樓層" clearable style="width: 120px">
          <el-option label="全部樓層" value="" />
          <el-option v-for="floor in uniqueFloors" :key="floor" :label="floor" :value="floor" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="篩選狀態" clearable style="width: 120px">
          <el-option label="全部狀態" value="" />
          <el-option label="在職" value="active" />
          <el-option label="離職" value="inactive" />
        </el-select>
        <el-input 
          v-model="searchText" 
          placeholder="搜尋姓名或編號" 
          clearable 
          style="width: 200px"
          :prefix-icon="Search"
        />
      </div>
    </el-card>

    <!-- 工讀生列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">工讀生列表</span>
          <el-button :icon="Refresh" @click="fetchWorkers" :loading="loading" circle />
        </div>
      </template>

      <el-table 
        :data="filteredWorkers" 
        v-loading="loading" 
        stripe 
        class="workers-table"
        :default-sort="{ prop: 'workerNumber', order: 'ascending' }"
      >
        <el-table-column prop="workerNumber" label="編號" width="100" sortable>
          <template #default="{ row }">
            <span class="worker-number">{{ row.workerNumber }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="姓名" width="120" sortable>
          <template #default="{ row }">
            <div class="worker-name">
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="group" label="組別" width="100" sortable>
          <template #default="{ row }">
            <el-tag size="small" :type="getGroupTagType(row.group)">
              {{ row.group }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="floor" label="樓層" width="80" sortable>
          <template #default="{ row }">
            <span class="floor-text">{{ row.floor }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="hourlyWage" label="基本時薪" width="110" sortable>
          <template #default="{ row }">
            <div class="wage-display">
              <span class="wage-amount">${{ row.hourlyWage }}</span>
              <el-button 
                type="text" 
                size="small" 
                :icon="Edit" 
                @click="showWageDialog(row)"
                class="wage-edit-btn"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="狀態" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '在職' : '離職' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="建立時間" width="150">
          <template #default="{ row }">
            <span class="date-text">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column fixed="right" label="操作" width="200">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" :icon="Edit" @click="editWorker(row)" plain>
                編輯
              </el-button>
              <el-button 
                type="warning" 
                size="small" 
                :icon="Clock" 
                @click="showHoursDialog(row)"
                plain
              >
                工時
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                :icon="Delete" 
                @click="confirmDelete(row)"
                plain
              >
                刪除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空狀態 -->
      <div v-if="filteredWorkers.length === 0 && !loading" class="empty-state">
        <el-icon size="64"><UserFilled /></el-icon>
        <p>暫無工讀生資料</p>
        <el-button type="primary" @click="showAddDialog">新增第一位工讀生</el-button>
      </div>
    </el-card>

    <!-- Excel 匯入對話框 -->
    <el-dialog
      v-model="showImportDialog"
      title="匯入 Excel 檔案"
      :width="isMobile ? '95%' : '600px'"
    >
      <div class="import-content">
        <el-alert
          title="Excel 格式要求"
          type="info"
          :closable="false"
          class="format-alert"
        >
          <div>必要欄位：編號(A欄)、姓名(B欄)、組別(C欄)、樓層(D欄)、時薪(E欄)</div>
        </el-alert>

        <el-upload
          ref="uploadRef"
          class="excel-upload"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          accept=".xlsx,.xls"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            拖拽檔案到此處，或<em>點擊選擇檔案</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支援 .xlsx 和 .xls 格式，檔案大小不超過 5MB
            </div>
          </template>
        </el-upload>

        <!-- 預覽數據 -->
        <div v-if="previewData.length > 0" class="preview-section">
          <h4>預覽數據</h4>
          <el-table :data="previewData" size="small" max-height="300">
            <el-table-column prop="workerNumber" label="編號" width="80" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="group" label="組別" width="100" />
            <el-table-column prop="floor" label="樓層" width="80" />
            <el-table-column prop="hourlyWage" label="時薪" width="80" />
            <el-table-column label="狀態" width="80">
              <template #default="{ row }">
                <el-tag :type="row.valid ? 'success' : 'danger'" size="small">
                  {{ row.valid ? '有效' : '錯誤' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div class="preview-stats">
            <span>總計 {{ previewData.length }} 筆，有效 {{ validCount }} 筆，錯誤 {{ previewData.length - validCount }} 筆</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirmImport" 
          :disabled="validCount === 0"
          :loading="importing"
        >
          確認匯入
        </el-button>
      </template>
    </el-dialog>

    <!-- 新增/編輯工讀生對話框 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEditing ? '編輯工讀生' : '新增工讀生'"
      :width="isMobile ? '95%' : '500px'"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="編號" prop="workerNumber">
          <el-input v-model="formData.workerNumber" placeholder="請輸入編號" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="請輸入姓名" />
        </el-form-item>
        <el-form-item label="組別" prop="group">
          <el-select v-model="formData.group" placeholder="請選擇組別" filterable allow-create>
            <el-option v-for="group in uniqueGroups" :key="group" :label="group" :value="group" />
          </el-select>
        </el-form-item>
        <el-form-item label="樓層" prop="floor">
          <el-select v-model="formData.floor" placeholder="請選擇樓層" filterable allow-create>
            <el-option v-for="floor in uniqueFloors" :key="floor" :label="floor" :value="floor" />
          </el-select>
        </el-form-item>
        <el-form-item label="基本時薪" prop="hourlyWage">
          <el-input-number 
            v-model="formData.hourlyWage" 
            :min="100" 
            :max="1000" 
            :step="5"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEditing ? '更新' : '新增' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 調整時薪對話框 -->
    <el-dialog
      v-model="showWageAdjustDialog"
      title="調整基本時薪"
      :width="isMobile ? '95%' : '400px'"
    >
      <div class="wage-adjust-content">
        <div class="worker-info">
          <h4>{{ currentWorker?.name }} ({{ currentWorker?.workerNumber }})</h4>
          <p>目前時薪：${{ currentWorker?.hourlyWage }}</p>
        </div>
        <el-form ref="wageFormRef" :model="wageAdjustForm" :rules="wageAdjustRules" label-width="100px">
          <el-form-item label="新時薪" prop="newWage">
            <el-input-number 
              v-model="wageAdjustForm.newWage" 
              :min="100" 
              :max="1000" 
              :step="5"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="調整原因" prop="reason">
            <el-input 
              v-model="wageAdjustForm.reason" 
              type="textarea" 
              :rows="3"
              placeholder="請輸入調整原因"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showWageAdjustDialog = false">取消</el-button>
        <el-button type="primary" @click="submitWageAdjust" :loading="adjustingWage">
          確認調整
        </el-button>
      </template>
    </el-dialog>

    <!-- 工時調整對話框 -->
    <el-dialog
      v-model="showHoursAdjustDialog"
      title="調整工時記錄"
      :width="isMobile ? '95%' : '500px'"
    >
      <div class="hours-adjust-content">
        <div class="worker-info">
          <h4>{{ currentWorker?.name }} ({{ currentWorker?.workerNumber }})</h4>
        </div>
        <el-form ref="hoursFormRef" :model="hoursAdjustForm" :rules="hoursAdjustRules" label-width="100px">
          <el-form-item label="調整類型" prop="type">
            <el-radio-group v-model="hoursAdjustForm.type">
              <el-radio label="add">增加工時</el-radio>
              <el-radio label="subtract">減少工時</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="調整時數" prop="hours">
            <el-input-number 
              v-model="hoursAdjustForm.hours" 
              :min="0.5" 
              :max="12" 
              :step="0.5"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="調整日期" prop="date">
            <el-date-picker
              v-model="hoursAdjustForm.date"
              type="date"
              placeholder="選擇日期"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="調整原因" prop="reason">
            <el-input 
              v-model="hoursAdjustForm.reason" 
              type="textarea" 
              :rows="3"
              placeholder="請輸入調整原因"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showHoursAdjustDialog = false">取消</el-button>
        <el-button type="primary" @click="submitHoursAdjust" :loading="adjustingHours">
          確認調整
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  UserFilled, Plus, Upload, Edit, Delete, Clock, Refresh,
  CircleCheck, Collection, Search, UploadFilled
} from '@element-plus/icons-vue'
import { useWorkersStore } from '@/stores/workers'
import * as XLSX from 'xlsx'
import moment from 'moment'

// Store
const workersStore = useWorkersStore()

// 響應式數據
const loading = ref(false)
const workers = ref([])
const showImportDialog = ref(false)
const showFormDialog = ref(false)
const showWageAdjustDialog = ref(false)
const showHoursAdjustDialog = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const importing = ref(false)
const adjustingWage = ref(false)
const adjustingHours = ref(false)

// 表單引用
const formRef = ref()
const wageFormRef = ref()
const hoursFormRef = ref()

// 篩選器
const filterGroup = ref('')
const filterFloor = ref('')
const filterStatus = ref('')
const searchText = ref('')

// Excel 匯入相關
const previewData = ref([])
const uploadRef = ref()

// 表單數據
const formData = reactive({
  workerNumber: '',
  name: '',
  group: '',
  floor: '',
  hourlyWage: 200
})

const wageAdjustForm = reactive({
  newWage: 0,
  reason: ''
})

const hoursAdjustForm = reactive({
  type: 'add',
  hours: 1,
  date: '',
  reason: ''
})

const currentWorker = ref(null)

// 計算屬性
const isMobile = computed(() => window.innerWidth <= 768)

const activeWorkersCount = computed(() => 
  workers.value.filter(w => w.status === 'active').length
)

const uniqueGroups = computed(() => 
  [...new Set(workers.value.map(w => w.group).filter(Boolean))]
)

const uniqueFloors = computed(() => 
  [...new Set(workers.value.map(w => w.floor).filter(Boolean))]
)

const filteredWorkers = computed(() => {
  let result = workers.value

  if (filterGroup.value) {
    result = result.filter(w => w.group === filterGroup.value)
  }
  if (filterFloor.value) {
    result = result.filter(w => w.floor === filterFloor.value)
  }
  if (filterStatus.value) {
    result = result.filter(w => w.status === filterStatus.value)
  }
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    result = result.filter(w => 
      w.name.toLowerCase().includes(search) || 
      w.workerNumber.toLowerCase().includes(search)
    )
  }

  return result
})

const validCount = computed(() => 
  previewData.value.filter(item => item.valid).length
)

// 表單驗證規則
const formRules = {
  workerNumber: [
    { required: true, message: '請輸入編號', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '請輸入姓名', trigger: 'blur' }
  ],
  group: [
    { required: true, message: '請選擇組別', trigger: 'change' }
  ],
  floor: [
    { required: true, message: '請選擇樓層', trigger: 'change' }
  ],
  hourlyWage: [
    { required: true, message: '請輸入基本時薪', trigger: 'blur' }
  ]
}

const wageAdjustRules = {
  newWage: [
    { required: true, message: '請輸入新時薪', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '請輸入調整原因', trigger: 'blur' }
  ]
}

const hoursAdjustRules = {
  hours: [
    { required: true, message: '請輸入調整時數', trigger: 'blur' }
  ],
  date: [
    { required: true, message: '請選擇調整日期', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '請輸入調整原因', trigger: 'blur' }
  ]
}

// 方法
const fetchWorkers = async () => {
  loading.value = true
  try {
    await workersStore.fetchWorkers()
    workers.value = workersStore.workers
  } catch (error) {
    ElMessage.error('載入工讀生列表失敗')
  } finally {
    loading.value = false
  }
}

const getGroupTagType = (group) => {
  const types = ['', 'success', 'warning', 'danger', 'info']
  const hash = group.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  return types[Math.abs(hash) % types.length]
}

const formatDate = (dateString) => {
  return moment(dateString).format('YYYY-MM-DD HH:mm')
}

const showAddDialog = () => {
  isEditing.value = false
  resetForm()
  showFormDialog.value = true
}

const editWorker = (worker) => {
  isEditing.value = true
  Object.assign(formData, worker)
  showFormDialog.value = true
}

const resetForm = () => {
  Object.assign(formData, {
    workerNumber: '',
    name: '',
    group: '',
    floor: '',
    hourlyWage: 200
  })
}

const submitForm = async () => {
  try {
    submitting.value = true
    const valid = await formRef.value.validate()
    if (!valid) return

    if (isEditing.value) {
      await workersStore.updateWorker(formData.id, formData)
      ElMessage.success('工讀生資料更新成功')
    } else {
      await workersStore.addWorker(formData)
      ElMessage.success('工讀生新增成功')
    }

    showFormDialog.value = false
    await fetchWorkers()
  } catch (error) {
    ElMessage.error(isEditing.value ? '更新失敗' : '新增失敗')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = async (worker) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除工讀生「${worker.name}」嗎？`,
      '刪除確認',
      {
        confirmButtonText: '確認刪除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await workersStore.deleteWorker(worker.id)
    ElMessage.success('工讀生刪除成功')
    await fetchWorkers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('刪除失敗')
    }
  }
}

const showWageDialog = (worker) => {
  currentWorker.value = worker
  wageAdjustForm.newWage = worker.hourlyWage
  wageAdjustForm.reason = ''
  showWageAdjustDialog.value = true
}

const submitWageAdjust = async () => {
  try {
    adjustingWage.value = true
    const valid = await wageFormRef.value.validate()
    if (!valid) return

    await workersStore.adjustWage({
      workerId: currentWorker.value.id,
      oldWage: currentWorker.value.hourlyWage,
      newWage: wageAdjustForm.newWage,
      reason: wageAdjustForm.reason
    })

    ElMessage.success('時薪調整成功')
    showWageAdjustDialog.value = false
    await fetchWorkers()
  } catch (error) {
    ElMessage.error('時薪調整失敗')
  } finally {
    adjustingWage.value = false
  }
}

const showHoursDialog = (worker) => {
  currentWorker.value = worker
  hoursAdjustForm.type = 'add'
  hoursAdjustForm.hours = 1
  hoursAdjustForm.date = ''
  hoursAdjustForm.reason = ''
  showHoursAdjustDialog.value = true
}

const submitHoursAdjust = async () => {
  try {
    adjustingHours.value = true
    const valid = await hoursFormRef.value.validate()
    if (!valid) return

    await workersStore.adjustHours({
      workerId: currentWorker.value.id,
      type: hoursAdjustForm.type,
      hours: hoursAdjustForm.hours,
      date: hoursAdjustForm.date,
      reason: hoursAdjustForm.reason
    })

    ElMessage.success('工時調整成功')
    showHoursAdjustDialog.value = false
  } catch (error) {
    ElMessage.error('工時調整失敗')
  } finally {
    adjustingHours.value = false
  }
}

// Excel 匯入處理
const handleFileChange = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 })
      
      parseExcelData(jsonData)
    } catch (error) {
      ElMessage.error('Excel 檔案解析失敗')
    }
  }
  reader.readAsArrayBuffer(file.raw)
}

const parseExcelData = (data) => {
  const result = []
  
  // 跳過標題行
  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const workerNumber = String(row[0] || '').trim()
    const name = String(row[1] || '').trim()
    const group = String(row[2] || '').trim()
    const floor = String(row[3] || '').trim()
    const hourlyWage = Number(row[4]) || 0

    const valid = workerNumber && name && group && floor && hourlyWage > 0

    result.push({
      workerNumber,
      name,
      group,
      floor,
      hourlyWage,
      valid
    })
  }

  previewData.value = result
}

const confirmImport = async () => {
  try {
    importing.value = true
    const validData = previewData.value.filter(item => item.valid)
    
    await workersStore.importWorkers(validData)
    ElMessage.success(`成功匯入 ${validData.length} 筆工讀生資料`)
    
    showImportDialog.value = false
    previewData.value = []
    await fetchWorkers()
  } catch (error) {
    ElMessage.error('匯入失敗')
  } finally {
    importing.value = false
  }
}

// 組件掛載時載入數據
onMounted(() => {
  fetchWorkers()
})
</script>

<style scoped>
.workers-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-content h1 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
}

.page-description {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.import-btn {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  border: none;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card :deep(.el-card__body) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  color: #7f8c8d;
  font-size: 14px;
}

.stat-icon {
  font-size: 48px;
  opacity: 0.2;
}

.stat-icon.success {
  color: #67c23a;
}

.stat-icon.warning {
  color: #e6a23c;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filters {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.table-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.workers-table {
  width: 100%;
}

.worker-number {
  font-family: 'Monaco', 'Consolas', monospace;
  font-weight: 600;
  color: #409eff;
}

.worker-name {
  font-weight: 500;
}

.floor-text {
  font-family: 'Monaco', 'Consolas', monospace;
  font-weight: 500;
}

.wage-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wage-amount {
  font-weight: 600;
  color: #67c23a;
  font-family: 'Monaco', 'Consolas', monospace;
}

.wage-edit-btn {
  color: #909399;
  padding: 0;
}

.wage-edit-btn:hover {
  color: #409eff;
}

.date-text {
  color: #909399;
  font-size: 13px;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state .el-icon {
  color: #ddd;
  margin-bottom: 16px;
}

.import-content {
  padding: 0 4px;
}

.format-alert {
  margin-bottom: 20px;
}

.excel-upload {
  margin: 20px 0;
}

.preview-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.preview-section h4 {
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.preview-stats {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 14px;
  color: #606266;
}

.wage-adjust-content,
.hours-adjust-content {
  padding: 0 4px;
}

.worker-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.worker-info h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.worker-info p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .workers-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: stretch;
  }

  .header-actions .el-button {
    flex: 1;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .filters .el-select,
  .filters .el-input {
    width: 100% !important;
  }

  .workers-table {
    font-size: 14px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
}

/* Element Plus 樣式覆蓋 */
.table-card :deep(.el-card__header) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.workers-table :deep(.el-table__header) {
  background-color: #f8f9fa;
}

.workers-table :deep(.el-table__row:hover > td) {
  background-color: #f0f9ff;
}

.workers-table :deep(.el-tag) {
  font-weight: 500;
}
</style>
  hourlyWage: 0,
});

const rules = {
  workerNumber: [{ required: true, message: "請輸入工號", trigger: "blur" }],
  name: [{ required: true, message: "請輸入姓名", trigger: "blur" }],
  phoneNumber: [{ required: true, message: "請輸入電話", trigger: "blur" }],
  email: [{ required: true, message: "請輸入電子郵件", trigger: "blur" }],
  hourlyWage: [{ required: true, message: "請輸入時薪", trigger: "blur" }],
};

// 方法
const fetchWorkers = async () => {
  try {
    await workersStore.fetchWorkers();
    workers.value = workersStore.workers;
  } catch (error) {
    ElMessage.error("獲取工讀生列表失敗");
  }
};

const showAddDialog = () => {
  isEditing.value = false;
  dialogVisible.value = true;
};

const editWorker = (worker) => {
  isEditing.value = true;
  form.value = { ...worker };
  dialogVisible.value = true;
};

const deleteWorker = async (worker) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除工讀生 "${worker.name}" 嗎？`,
      "確認刪除",
      { type: "warning" },
    );

    await workersStore.deleteWorker(worker.id);
    ElMessage.success("刪除成功");
    await fetchWorkers();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("刪除失敗");
    }
  }
};

const submitForm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    if (isEditing.value) {
      await workersStore.updateWorker(form.value);
      ElMessage.success("更新成功");
    } else {
      await workersStore.addWorker(form.value);
      ElMessage.success("新增成功");
    }

    dialogVisible.value = false;
    await fetchWorkers();
  } catch (error) {
    ElMessage.error("操作失敗");
  }
};

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.value = {
    workerNumber: "",
    name: "",
    phoneNumber: "",
    email: "",
    department: "",
    position: "",
    hourlyWage: 0,
  };
};

// 初始化
onMounted(() => {
  fetchWorkers();
});
</script>

<style scoped>
.workers-container {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.table-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
