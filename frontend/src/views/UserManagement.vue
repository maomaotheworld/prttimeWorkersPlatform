<template>
  <div class="user-management">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Setting /></el-icon>
          ?�戶管�?
        </h1>
        <p class="page-description">管�?系統?�戶帳�?，新增�?組長帳�?</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          ?��?小�???
        </el-button>
      </div>
    </div>

    <!-- ?�戶?�表 -->
    <el-card class="user-list-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><User /></el-icon>
            ?�戶?�表
          </span>
          <el-button
            type="primary"
            :icon="Refresh"
            @click="loadUsers"
            :loading="loading"
            circle
          />
        </div>
      </template>

      <el-table :data="users" v-loading="loading" class="user-table" stripe>
        <el-table-column prop="username" label="帳�?" width="120">
          <template #default="{ row }">
            <span class="username">{{ row.username }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="姓�?" width="120">
          <template #default="{ row }">
            <span class="user-name">{{ row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" size="small">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="email" label="?�箱" min-width="180">
          <template #default="{ row }">
            <span class="email">{{ row.email || "-" }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="isActive" label="狀態" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? "啟用" : "停用" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="建�??��?" width="150">
          <template #default="{ row }">
            <span class="date">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="?��?" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.role !== 'admin'"
              type="danger"
              size="small"
              :icon="Delete"
              @click="confirmDelete(row)"
              circle
              plain
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 創建小組長對話框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="創建小組長帳號"
      :width="isMobile ? '95%' : '500px'"
      :before-close="handleCloseDialog"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
      >
        <el-form-item label="帳號" prop="username">
          <el-input
            v-model="createForm.username"
            placeholder="請輸入帳號"
            clearable
          />
        </el-form-item>

        <el-form-item label="密碼" prop="password">
          <el-input
            v-model="createForm.password"
            type="password"
            placeholder="請輸入密碼"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item label="姓名" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="請輸入姓名"
            clearable
          />
        </el-form-item>

        <el-form-item label="信箱" prop="email">
          <el-input
            v-model="createForm.email"
            placeholder="請輸入郵箱（可選填）"
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button
            type="primary"
            @click="handleCreateUser"
            :loading="creating"
          >
            建立帳號
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Setting, User, Plus, Delete, Refresh } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import moment from "moment";

const authStore = useAuthStore();

// ?��?式數??
const loading = ref(false);
const creating = ref(false);
const showCreateDialog = ref(false);
const users = ref([]);

// 表單?��?
const createForm = reactive({
  username: "",
  password: "",
  name: "",
  email: "",
});

// 表單驗證規則
const createRules = {
  username: [
    { required: true, message: "請輸入帳號", trigger: "blur" },
    { min: 3, max: 20, message: "帳號長度應在3到20個字元", trigger: "blur" },
  ],
  password: [
    { required: true, message: "請輸入密碼", trigger: "blur" },
    { min: 6, message: "密碼長度不能少於6個字元", trigger: "blur" },
  ],
  name: [
    { required: true, message: "請輸入姓名", trigger: "blur" },
    { min: 2, max: 10, message: "姓名長度應在2到10個字元", trigger: "blur" },
  ],
  email: [
    { type: "email", message: "請輸入正確的電子郵箱格式", trigger: "blur" },
  ],
};

// 引用
const createFormRef = ref();

// 計算屬性
const isMobile = computed(() => window.innerWidth <= 768);

// 方法
const getRoleText = (role) => {
  const roleMap = {
    admin: "管理者",
    leader: "小組長",
    reader: "訪客",
  };
  return roleMap[role] || "未知";
};

const getRoleTagType = (role) => {
  const typeMap = {
    admin: "danger",
    leader: "warning",
    reader: "info",
  };
  return typeMap[role] || "";
};

const formatDate = (dateString) => {
  return moment(dateString).format("YYYY-MM-DD HH:mm");
};

// 載入?�戶?�表
const loadUsers = async () => {
  loading.value = true;
  try {
    const result = await authStore.fetchUsers();
    if (result.success) {
      users.value = result.data;
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    ElMessage.error("載入?�戶?�表失�?");
  } finally {
    loading.value = false;
  }
};

// ?��??�戶
const handleCreateUser = async () => {
  try {
    // 表單驗�?
    const valid = await createFormRef.value.validate();
    if (!valid) return;

    creating.value = true;

    const result = await authStore.createLeader(createForm);

    if (result.success) {
      ElMessage.success(result.message);
      showCreateDialog.value = false;
      resetCreateForm();
      await loadUsers();
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error("?��??�戶?�誤:", error);
    ElMessage.error("?��??�戶失�?");
  } finally {
    creating.value = false;
  }
};

// 確�??�除?�戶
const confirmDelete = async (user) => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      `確�?要刪?�用?��?{user.name}??${user.username})?��?`,
      "?�除確�?",
      {
        confirmButtonText: "確�??�除",
        cancelButtonText: "?��?",
        type: "warning",
      },
    );

    if (confirmResult === "confirm") {
      await handleDeleteUser(user.id);
    }
  } catch (error) {
    // ?�戶?��?
  }
};

// ?�除?�戶
const handleDeleteUser = async (userId) => {
  try {
    const result = await authStore.deleteUser(userId);

    if (result.success) {
      ElMessage.success(result.message);
      await loadUsers();
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error("?�除?�戶?�誤:", error);
    ElMessage.error("?�除?�戶失�?");
  }
};

// ?�置表單
const resetCreateForm = () => {
  Object.keys(createForm).forEach((key) => {
    createForm[key] = "";
  });
  if (createFormRef.value) {
    createFormRef.value.clearValidate();
  }
};

// ?��?對話�?
const handleCloseDialog = () => {
  showCreateDialog.value = false;
  resetCreateForm();
};

// 組件?��?
onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-management {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-content h1 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.page-description {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.user-list-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
}

.user-table {
  min-height: 200px;
}

.username {
  font-weight: 500;
  color: #409eff;
}

.user-name {
  font-weight: 500;
}

.email {
  color: #7f8c8d;
  font-size: 13px;
}

.date {
  color: #95a5a6;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* ?��?端適??*/
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }

  .header-content h1 {
    font-size: 20px;
  }

  .user-table {
    font-size: 14px;
  }
}

/* Element Plus �??覆�? */
.user-list-card :deep(.el-card__header) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.user-table :deep(.el-table__header) {
  background-color: #f8f9fa;
}

.user-table :deep(.el-table__row:hover > td) {
  background-color: #f0f9ff;
}
</style>
