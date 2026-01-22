<template>
  <div class="floors-container">
    <!-- 頁面標題和操作按鈕 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><OfficeBuilding /></el-icon>
          樓層管理
        </h1>
        <p class="page-description">管理工作樓層，查看各樓層工讀生分配情況</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showAddDialog">
          新增樓層
        </el-button>
      </div>
    </div>

    <!-- 統計卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ floors.length }}</div>
          <div class="stat-label">總樓層數</div>
        </div>
        <el-icon class="stat-icon"><OfficeBuilding /></el-icon>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ totalWorkers }}</div>
          <div class="stat-label">總工讀生數</div>
        </div>
        <el-icon class="stat-icon success"><UserFilled /></el-icon>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ averageWorkersPerFloor }}</div>
          <div class="stat-label">平均每層人數</div>
        </div>
        <el-icon class="stat-icon warning"><TrendCharts /></el-icon>
      </el-card>
    </div>

    <!-- 樓層列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><List /></el-icon>
            樓層列表
          </span>
          <el-button
            :icon="Refresh"
            @click="fetchFloors"
            :loading="loading"
            circle
          />
        </div>
      </template>

      <div class="floors-grid">
        <div
          v-for="floor in sortedFloors"
          :key="floor.id"
          class="floor-card"
          @click="viewFloorWorkers(floor)"
        >
          <div class="floor-header">
            <div class="floor-info">
              <h3 class="floor-name">{{ floor.name }}</h3>
              <p class="floor-description">
                {{ floor.description || "無描述" }}
              </p>
            </div>
            <div class="floor-actions" @click.stop>
              <el-button
                type="primary"
                size="small"
                :icon="Edit"
                @click="editFloor(floor)"
                circle
                plain
              />
              <el-button
                type="danger"
                size="small"
                :icon="Delete"
                @click="confirmDelete(floor)"
                circle
                plain
              />
            </div>
          </div>

          <div class="floor-stats">
            <div class="stat-item">
              <el-icon><UserFilled /></el-icon>
              <span>{{ floor.workerCount || 0 }} 人</span>
            </div>
            <div class="stat-item">
              <el-icon><Collection /></el-icon>
              <span>{{ floor.groupCount || 0 }} 組別</span>
            </div>
          </div>

          <!-- 工讀生列表預覽 -->
          <div
            v-if="floor.workers && floor.workers.length > 0"
            class="workers-preview"
          >
            <div class="preview-title">工讀生</div>
            <div class="workers-list">
              <el-tag
                v-for="worker in floor.workers.slice(0, 5)"
                :key="worker.id"
                size="small"
                class="worker-tag"
              >
                {{ worker.name }}
              </el-tag>
              <span v-if="floor.workers.length > 5" class="more-workers">
                +{{ floor.workers.length - 5 }} 更多
              </span>
            </div>
          </div>

          <div v-else class="empty-workers">
            <el-icon><Warning /></el-icon>
            <span>暫無工讀生</span>
          </div>
        </div>
      </div>

      <!-- 空狀態 -->
      <div v-if="floors.length === 0 && !loading" class="empty-state">
        <el-icon size="64"><OfficeBuilding /></el-icon>
        <p>暫無樓層資料</p>
        <el-button type="primary" @click="showAddDialog"
          >新增第一個樓層</el-button
        >
      </div>
    </el-card>

    <!-- 新增/編輯樓層對話框 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEditing ? '編輯樓層' : '新增樓層'"
      :width="isMobile ? '95%' : '500px'"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="樓層名稱" prop="name">
          <el-input v-model="formData.name" placeholder="例如：1F、B1、2F" />
        </el-form-item>
        <el-form-item label="樓層描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="請輸入樓層描述（可選）"
          />
        </el-form-item>
        <el-form-item label="排序順序" prop="sortOrder">
          <el-input-number
            v-model="formData.sortOrder"
            :min="0"
            :max="100"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEditing ? "更新" : "新增" }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 樓層工讀生詳情對話框 -->
    <el-dialog
      v-model="showWorkersDialog"
      :title="`${currentFloor?.name} - 工讀生詳情`"
      :width="isMobile ? '95%' : '800px'"
    >
      <div class="workers-detail">
        <div class="detail-header">
          <div class="floor-summary">
            <h4>{{ currentFloor?.name }}</h4>
            <p>{{ currentFloor?.description }}</p>
            <div class="summary-stats">
              <el-tag type="info">總計 {{ floorWorkers.length }} 人</el-tag>
              <el-tag type="success">{{ activeFloorWorkers }} 在職</el-tag>
            </div>
          </div>
        </div>

        <!-- 按組別分組顯示 -->
        <div
          v-if="workersByGroup && Object.keys(workersByGroup).length > 0"
          class="workers-by-group"
        >
          <div
            v-for="(workers, groupName) in workersByGroup"
            :key="groupName"
            class="group-section"
          >
            <div class="group-header">
              <el-tag type="warning" size="small">{{ groupName }}</el-tag>
              <span class="group-count">{{ workers.length }} 人</span>
            </div>
            <div class="group-workers">
              <div
                v-for="worker in workers"
                :key="worker.id"
                class="worker-item"
              >
                <div class="worker-info">
                  <span class="worker-name">{{ worker.name }}</span>
                  <span class="worker-number">{{ worker.workerNumber }}</span>
                </div>
                <div class="worker-details">
                  <span class="worker-wage">${{ worker.hourlyWage }}/時</span>
                  <el-tag
                    :type="worker.status === 'active' ? 'success' : 'danger'"
                    size="small"
                  >
                    {{ worker.status === "active" ? "在職" : "離職" }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-workers">
          <el-icon size="48"><UserFilled /></el-icon>
          <p>此樓層暫無工讀生</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  OfficeBuilding,
  Plus,
  Edit,
  Delete,
  Refresh,
  UserFilled,
  TrendCharts,
  List,
  Collection,
  Warning,
} from "@element-plus/icons-vue";
import { useWorkersStore } from "@/stores/workers";

// Store
const workersStore = useWorkersStore();

// 響應式數據
const loading = ref(false);
const submitting = ref(false);
const floors = ref([]);
const workers = ref([]);
const showFormDialog = ref(false);
const showWorkersDialog = ref(false);
const isEditing = ref(false);
const currentFloor = ref(null);
const floorWorkers = ref([]);

// 表單引用
const formRef = ref();

// 表單數據
const formData = reactive({
  name: "",
  description: "",
  sortOrder: 0,
});

// 計算屬性
const isMobile = computed(() => window.innerWidth <= 768);

const sortedFloors = computed(() => {
  return [...floors.value].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
  );
});

const totalWorkers = computed(() => {
  return floors.value.reduce((sum, floor) => sum + (floor.workerCount || 0), 0);
});

const averageWorkersPerFloor = computed(() => {
  if (floors.value.length === 0) return 0;
  return Math.round(totalWorkers.value / floors.value.length);
});

const activeFloorWorkers = computed(() => {
  return floorWorkers.value.filter((w) => w.status === "active").length;
});

const workersByGroup = computed(() => {
  const groups = {};
  floorWorkers.value.forEach((worker) => {
    const groupName = worker.group || "未分組";
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(worker);
  });
  return groups;
});

// 表單驗證規則
const formRules = {
  name: [{ required: true, message: "請輸入樓層名稱", trigger: "blur" }],
  sortOrder: [{ required: true, message: "請輸入排序順序", trigger: "blur" }],
};

// 方法
const fetchFloors = async () => {
  loading.value = true;
  try {
    // 獲取樓層列表
    const response = await fetch("/api/floors");
    const result = await response.json();

    if (result.success) {
      floors.value = result.data;

      // 為每個樓層獲取工讀生統計
      await Promise.all(
        floors.value.map(async (floor) => {
          const workersResponse = await fetch(
            `/api/floors/${floor.id}/workers`,
          );
          const workersResult = await workersResponse.json();

          if (workersResult.success) {
            floor.workers = workersResult.data;
            floor.workerCount = workersResult.data.length;
            floor.groupCount = [
              ...new Set(workersResult.data.map((w) => w.group)),
            ].length;
          }
        }),
      );
    }
  } catch (error) {
    ElMessage.error("載入樓層列表失敗");
  } finally {
    loading.value = false;
  }
};

const showAddDialog = () => {
  isEditing.value = false;
  resetForm();
  showFormDialog.value = true;
};

const editFloor = (floor) => {
  isEditing.value = true;
  Object.assign(formData, {
    id: floor.id,
    name: floor.name,
    description: floor.description || "",
    sortOrder: floor.sortOrder || 0,
  });
  showFormDialog.value = true;
};

const resetForm = () => {
  Object.assign(formData, {
    name: "",
    description: "",
    sortOrder: 0,
  });
};

const submitForm = async () => {
  try {
    submitting.value = true;
    const valid = await formRef.value.validate();
    if (!valid) return;

    const url = isEditing.value ? `/api/floors/${formData.id}` : "/api/floors";
    const method = isEditing.value ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (result.success) {
      ElMessage.success(isEditing.value ? "樓層更新成功" : "樓層新增成功");
      showFormDialog.value = false;
      await fetchFloors();
    } else {
      ElMessage.error(result.message || "操作失敗");
    }
  } catch (error) {
    ElMessage.error(isEditing.value ? "更新失敗" : "新增失敗");
  } finally {
    submitting.value = false;
  }
};

const confirmDelete = async (floor) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除樓層「${floor.name}」嗎？此操作將影響該樓層下的所有工讀生。`,
      "刪除確認",
      {
        confirmButtonText: "確認刪除",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    const response = await fetch(`/api/floors/${floor.id}`, {
      method: "DELETE",
    });

    const result = await response.json();

    if (result.success) {
      ElMessage.success("樓層刪除成功");
      await fetchFloors();
    } else {
      ElMessage.error(result.message || "刪除失敗");
    }
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("刪除失敗");
    }
  }
};

const viewFloorWorkers = async (floor) => {
  currentFloor.value = floor;

  try {
    const response = await fetch(`/api/floors/${floor.id}/workers`);
    const result = await response.json();

    if (result.success) {
      floorWorkers.value = result.data;
      showWorkersDialog.value = true;
    } else {
      ElMessage.error("載入工讀生資料失敗");
    }
  } catch (error) {
    ElMessage.error("載入工讀生資料失敗");
  }
};

// 組件掛載時載入數據
onMounted(() => {
  fetchFloors();
});
</script>

<style scoped>
.floors-container {
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
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.floors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.floor-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  background: white;
}

.floor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.floor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.floor-info h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.floor-description {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.floor-actions {
  display: flex;
  gap: 8px;
}

.floor-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
}

.stat-item .el-icon {
  color: #909399;
}

.workers-preview {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.preview-title {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.workers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.worker-tag {
  font-size: 12px;
}

.more-workers {
  font-size: 12px;
  color: #909399;
}

.empty-workers {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c0c4cc;
  font-size: 14px;
  padding: 20px;
  text-align: center;
  justify-content: center;
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

.workers-detail {
  max-height: 500px;
  overflow-y: auto;
}

.detail-header {
  margin-bottom: 20px;
}

.floor-summary h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.floor-summary p {
  margin: 0 0 12px 0;
  color: #7f8c8d;
}

.summary-stats {
  display: flex;
  gap: 8px;
}

.group-section {
  margin-bottom: 24px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.group-count {
  font-size: 14px;
  color: #606266;
}

.group-workers {
  padding: 16px;
}

.worker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f7fa;
}

.worker-item:last-child {
  border-bottom: none;
}

.worker-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.worker-name {
  font-weight: 500;
  color: #2c3e50;
}

.worker-number {
  font-size: 12px;
  color: #909399;
  font-family: "Monaco", "Consolas", monospace;
}

.worker-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.worker-wage {
  font-family: "Monaco", "Consolas", monospace;
  font-weight: 600;
  color: #67c23a;
  font-size: 14px;
}

.no-workers {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.no-workers .el-icon {
  color: #ddd;
  margin-bottom: 12px;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .floors-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px 16px;
  }

  .floors-grid {
    grid-template-columns: 1fr;
  }

  .floor-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .floor-stats {
    flex-direction: column;
    gap: 8px;
  }

  .workers-list {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Element Plus 樣式覆蓋 */
.table-card :deep(.el-card__header) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

.workers-detail::-webkit-scrollbar {
  width: 6px;
}

.workers-detail::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.workers-detail::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.workers-detail::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
