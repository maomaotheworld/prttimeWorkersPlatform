<template>
  <div class="permissions-matrix-container">
    <!-- 頁面頭部 -->
    <div class="page-header">
      <h2>權限矩陣管理</h2>
      <p class="page-description">管理系統中各角色的權限配置</p>
    </div>

    <!-- 權限說明卡片 -->
    <el-card shadow="hover" style="margin-bottom: 20px">
      <template #header>
        <div class="card-header">
          <span>權限說明</span>
        </div>
      </template>
      <div class="permission-descriptions">
        <el-tag type="success" effect="dark">管理員 (admin)</el-tag>
        <span>: 擁有所有權限，可以管理整個系統</span>
        <br /><br />
        <el-tag type="warning" effect="dark">小組長 (leader)</el-tag>
        <span>: 可以編輯工讀生資料、匯入數據、查看報表</span>
        <br /><br />
        <el-tag type="info" effect="dark">閱讀者 (reader)</el-tag>
        <span>: 只能查看資料，不能編輯或刪除</span>
      </div>
    </el-card>

    <!-- 權限矩陣表格 -->
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>權限矩陣表</span>
          <el-button
            type="primary"
            size="small"
            @click="handleSavePermissions"
            :loading="saving"
          >
            保存修改
          </el-button>
        </div>
      </template>

      <el-table
        :data="permissionsData"
        border
        stripe
        style="width: 100%"
        class="permissions-table"
      >
        <el-table-column prop="feature" label="功能模塊" width="200" fixed>
          <template #default="{ row }">
            <div class="feature-cell">
              <el-icon><component :is="row.icon" /></el-icon>
              <span>{{ row.feature }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="path" label="路徑" width="180">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.path }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="管理員" width="120" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.admin"
              disabled
              active-color="#67c23a"
            />
          </template>
        </el-table-column>

        <el-table-column label="小組長" width="120" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.leader"
              @change="handlePermissionChange(row, 'leader')"
              active-color="#e6a23c"
            />
          </template>
        </el-table-column>

        <el-table-column label="閱讀者" width="120" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.reader"
              @change="handlePermissionChange(row, 'reader')"
              active-color="#909399"
            />
          </template>
        </el-table-column>

        <el-table-column label="需要的權限" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="perm in row.permissions"
              :key="perm"
              size="small"
              style="margin: 2px"
            >
              {{ getPermissionLabel(perm) }}
            </el-tag>
            <span v-if="!row.permissions.length" class="text-muted">無需特定權限</span>
          </template>
        </el-table-column>

        <el-table-column label="說明" min-width="250">
          <template #default="{ row }">
            {{ row.description }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 權限細項配置 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>詳細權限配置</span>
        </div>
      </template>

      <el-table
        :data="detailedPermissions"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="permission" label="權限代碼" width="200">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.permission }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="label" label="權限名稱" width="180" />

        <el-table-column label="管理員" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.admin"
              disabled
              active-color="#67c23a"
            />
          </template>
        </el-table-column>

        <el-table-column label="小組長" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.leader"
              @change="handleDetailPermissionChange(row, 'leader')"
              active-color="#e6a23c"
            />
          </template>
        </el-table-column>

        <el-table-column label="閱讀者" width="100" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.reader"
              @change="handleDetailPermissionChange(row, 'reader')"
              active-color="#909399"
            />
          </template>
        </el-table-column>

        <el-table-column label="說明" min-width="300">
          <template #default="{ row }">
            {{ row.description }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 修改歷史記錄 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>修改歷史</span>
        </div>
      </template>

      <el-timeline>
        <el-timeline-item
          v-for="log in changeHistory"
          :key="log.id"
          :timestamp="log.timestamp"
          placement="top"
        >
          <el-card>
            <h4>{{ log.action }}</h4>
            <p>{{ log.details }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-empty
        v-if="changeHistory.length === 0"
        description="暫無修改記錄"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuthStore } from "@/stores/auth";
import {
  HomeFilled,
  User,
  UserFilled,
  Clock,
  Calendar,
  Money,
  Document,
  Setting,
} from "@element-plus/icons-vue";

const authStore = useAuthStore();
const saving = ref(false);

// 權限數據
const permissionsData = ref([
  {
    feature: "首頁",
    path: "/",
    icon: HomeFilled,
    admin: true,
    leader: true,
    reader: true,
    permissions: [],
    description: "系統主頁，顯示統計數據和快速操作",
  },
  {
    feature: "工讀生管理",
    path: "/workers",
    icon: User,
    admin: true,
    leader: true,
    reader: false,
    permissions: ["canEditWorkers"],
    description: "管理工讀生資料，包括新增、編輯、刪除",
  },
  {
    feature: "人員列表",
    path: "/personnel-list",
    icon: UserFilled,
    admin: true,
    leader: true,
    reader: true,
    permissions: [],
    description: "公開的人員列表頁面，無需登入即可查看",
  },
  {
    feature: "組別管理",
    path: "/groups",
    icon: UserFilled,
    admin: true,
    leader: true,
    reader: false,
    permissions: ["canEditWorkers"],
    description: "管理工讀生組別，分配組別成員",
  },
  {
    feature: "打卡系統",
    path: "/attendance",
    icon: Clock,
    admin: true,
    leader: true,
    reader: false,
    permissions: ["canClockIn"],
    description: "工讀生打卡上下班功能",
  },
  {
    feature: "工時記錄",
    path: "/time-records",
    icon: Calendar,
    admin: true,
    leader: false,
    reader: false,
    permissions: ["canEditTime"],
    description: "查看和編輯工時記錄，調整額外工時",
  },
  {
    feature: "薪資管理",
    path: "/salary",
    icon: Money,
    admin: true,
    leader: false,
    reader: false,
    permissions: ["canViewReports"],
    description: "計算和管理薪資，生成薪資報表",
  },
  {
    feature: "活動資料",
    path: "/activity-logs",
    icon: Document,
    admin: true,
    leader: false,
    reader: false,
    permissions: [],
    description: "查看系統操作日誌和活動記錄",
  },
  {
    feature: "用戶管理",
    path: "/user-management",
    icon: Setting,
    admin: true,
    leader: false,
    reader: false,
    permissions: ["canManageUsers"],
    description: "管理系統用戶，創建和刪除帳號",
  },
]);

// 詳細權限配置
const detailedPermissions = ref([
  {
    permission: "canManageUsers",
    label: "用戶管理",
    admin: true,
    leader: false,
    reader: false,
    description: "創建、編輯、刪除系統用戶帳號",
  },
  {
    permission: "canEditWorkers",
    label: "編輯工讀生",
    admin: true,
    leader: true,
    reader: false,
    description: "新增、修改、刪除工讀生資料",
  },
  {
    permission: "canImportData",
    label: "匯入數據",
    admin: true,
    leader: true,
    reader: false,
    description: "從 Excel 批量匯入工讀生資料",
  },
  {
    permission: "canClockIn",
    label: "打卡功能",
    admin: true,
    leader: true,
    reader: false,
    description: "使用打卡系統記錄上下班時間",
  },
  {
    permission: "canEditTime",
    label: "編輯工時",
    admin: true,
    leader: true,
    reader: false,
    description: "調整和修改工時記錄",
  },
  {
    permission: "canViewReports",
    label: "查看報表",
    admin: true,
    leader: true,
    reader: false,
    description: "查看統計報表和數據分析",
  },
  {
    permission: "canDeleteData",
    label: "刪除數據",
    admin: true,
    leader: false,
    reader: false,
    description: "刪除重要數據（需要管理員權限）",
  },
]);

// 修改歷史
const changeHistory = ref([]);

// 獲取權限標籤
const getPermissionLabel = (permission) => {
  const labels = {
    canManageUsers: "用戶管理",
    canEditWorkers: "編輯工讀生",
    canImportData: "匯入數據",
    canClockIn: "打卡功能",
    canEditTime: "編輯工時",
    canViewReports: "查看報表",
    canDeleteData: "刪除數據",
  };
  return labels[permission] || permission;
};

// 處理權限變更
const handlePermissionChange = (row, role) => {
  addChangeLog(`修改 ${row.feature} 的 ${getRoleLabel(role)} 訪問權限`, 
    `${row.feature} (${row.path}) - ${getRoleLabel(role)}: ${row[role] ? "允許" : "禁止"}`
  );
};

// 處理詳細權限變更
const handleDetailPermissionChange = (row, role) => {
  addChangeLog(`修改 ${row.label} 權限`, 
    `${row.label} (${row.permission}) - ${getRoleLabel(role)}: ${row[role] ? "啟用" : "禁用"}`
  );
};

// 獲取角色標籤
const getRoleLabel = (role) => {
  const labels = {
    admin: "管理員",
    leader: "小組長",
    reader: "閱讀者",
  };
  return labels[role] || role;
};

// 添加變更日誌
const addChangeLog = (action, details) => {
  changeHistory.value.unshift({
    id: Date.now(),
    action,
    details,
    timestamp: new Date().toLocaleString("zh-TW"),
  });

  // 只保留最近 20 條記錄
  if (changeHistory.value.length > 20) {
    changeHistory.value = changeHistory.value.slice(0, 20);
  }
};

// 保存權限配置
const handleSavePermissions = async () => {
  try {
    await ElMessageBox.confirm(
      "確定要保存權限配置嗎？這將影響所有用戶的訪問權限。",
      "保存確認",
      {
        confirmButtonText: "確定保存",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    saving.value = true;

    // 這裡可以調用 API 保存到後端
    // await api.post("/api/permissions/save", {
    //   permissions: permissionsData.value,
    //   detailedPermissions: detailedPermissions.value,
    // });

    // 模擬保存
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success("權限配置保存成功");
    addChangeLog("保存權限配置", "所有權限配置已成功保存");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("保存失敗: " + error.message);
    }
  } finally {
    saving.value = false;
  }
};

// 檢查是否為 Evelyn
const checkAccess = () => {
  const allowedUsers = ["evelyn", "evelyn.pan"];
  const username = authStore.user?.username?.toLowerCase() || "";

  if (!allowedUsers.includes(username)) {
    ElMessageBox.alert(
      "此頁面僅限 Evelyn 使用，您沒有訪問權限。",
      "訪問被拒絕",
      {
        confirmButtonText: "返回首頁",
        type: "error",
        callback: () => {
          window.location.href = "/";
        },
      }
    );
  }
};

onMounted(() => {
  checkAccess();
});
</script>

<style scoped>
.permissions-matrix-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
}

.page-description {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-descriptions {
  line-height: 1.8;
  color: #606266;
}

.feature-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feature-cell .el-icon {
  font-size: 18px;
  color: #409eff;
}

.text-muted {
  color: #909399;
  font-size: 12px;
}

.permissions-table {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  font-weight: 600;
}

:deep(.el-switch) {
  --el-switch-on-color: var(--switch-color, #409eff);
}

@media (max-width: 768px) {
  .permissions-matrix-container {
    padding: 10px;
  }

  .page-header h2 {
    font-size: 20px;
  }

  :deep(.el-table) {
    font-size: 12px;
  }

  :deep(.el-card) {
    margin-bottom: 10px;
  }
}
</style>
