<template>
  <div class="user-management">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Setting /></el-icon>
          ?®Êà∂ÁÆ°Á?
        </h1>
        <p class="page-description">ÁÆ°Á?Á≥ªÁµ±?®Êà∂Â∏≥Ë?ÔºåÊñ∞Â¢ûÂ?ÁµÑÈï∑Â∏≥Ë?</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
          ?∞Â?Â∞èÁ???
        </el-button>
      </div>
    </div>

    <!-- ?®Êà∂?óË°® -->
    <el-card class="user-list-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><User /></el-icon>
            ?®Êà∂?óË°®
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
        <el-table-column prop="username" label="Â∏≥Ë?" width="120">
          <template #default="{ row }">
            <span class="username">{{ row.username }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="ÂßìÂ?" width="120">
          <template #default="{ row }">
            <span class="user-name">{{ row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="role" label="ËßíËâ≤" width="100">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)" size="small">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="email" label="?µÁÆ±" min-width="180">
          <template #default="{ row }">
            <span class="email">{{ row.email || "-" }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="isActive" label="?Ä?? width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? "?üÁî®" : "?úÁî®" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="Âª∫Á??ÇÈ?" width="150">
          <template #default="{ row }">
            <span class="date">{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="?ç‰?" width="100" fixed="right">
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

    <!-- ?∞Â?Â∞èÁ??∑Â?Ë©±Ê? -->
    <el-dialog
      v-model="showCreateDialog"
      title="?∞Â?Â∞èÁ??∑Â∏≥??
      :width="isMobile ? '95%' : '500px'"
      :before-close="handleCloseDialog"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
      >
        <el-form-item label="Â∏≥Ë?" prop="username">
          <el-input
            v-model="createForm.username"
            placeholder="Ë´ãËº∏?•Â∏≥??
            clearable
          />
        </el-form-item>

        <el-form-item label="ÂØÜÁ¢º" prop="password">
          <el-input
            v-model="createForm.password"
            type="password"
            placeholder="Ë´ãËº∏?•Â?Á¢?
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item label="ÂßìÂ?" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="Ë´ãËº∏?•Â???
            clearable
          />
        </el-form-item>

        <el-form-item label="?µÁÆ±" prop="email">
          <el-input
            v-model="createForm.email"
            placeholder="Ë´ãËº∏?•ÈÉµÁÆ±Ô??∏Â°´Ôº?
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseDialog">?ñÊ?</el-button>
          <el-button
            type="primary"
            @click="handleCreateUser"
            :loading="creating"
          >
            Âª∫Á?Â∏≥Ë?
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

// ?øÊ?ÂºèÊï∏??
const loading = ref(false);
const creating = ref(false);
const showCreateDialog = ref(false);
const users = ref([]);

// Ë°®ÂñÆ?∏Ê?
const createForm = reactive({
  username: "",
  password: "",
  name: "",
  email: "",
});

// Ë°®ÂñÆÈ©óË?Ë¶èÂ?
const createRules = {
  username: [
    { required: true, message: "Ë´ãËº∏?•Â∏≥??, trigger: "blur" },
    { min: 3, max: 20, message: "Â∏≥Ë??∑Â∫¶??3 ??20 ?ãÂ?Á¨?, trigger: "blur" },
  ],
  password: [
    { required: true, message: "Ë´ãËº∏?•Â?Á¢?, trigger: "blur" },
    { min: 6, message: "ÂØÜÁ¢º?∑Â∫¶‰∏çËÉΩÂ∞ëÊñº 6 ?ãÂ?Á¨?, trigger: "blur" },
  ],
  name: [
    { required: true, message: "Ë´ãËº∏?•Â???, trigger: "blur" },
    { min: 2, max: 10, message: "ÂßìÂ??∑Â∫¶??2 ??10 ?ãÂ?Á¨?, trigger: "blur" },
  ],
  email: [{ type: "email", message: "Ë´ãËº∏?•Ê≠£Á¢∫Á??µÁÆ±?∞Â?", trigger: "blur" }],
};

// ÂºïÁî®
const createFormRef = ref();

// Ë®àÁ?Â±¨ÊÄ?
const isMobile = computed(() => window.innerWidth <= 768);

// ?πÊ?
const getRoleText = (role) => {
  const roleMap = {
    admin: "ÁÆ°Á???,
    leader: "Â∞èÁ???,
    reader: "Ë®™ÂÆ¢",
  };
  return roleMap[role] || "?™Áü•";
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

// ËºâÂÖ•?®Êà∂?óË°®
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
    ElMessage.error("ËºâÂÖ•?®Êà∂?óË°®Â§±Ê?");
  } finally {
    loading.value = false;
  }
};

// ?∞Â??®Êà∂
const handleCreateUser = async () => {
  try {
    // Ë°®ÂñÆÈ©óË?
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
    console.error("?∞Â??®Êà∂?ØË™§:", error);
    ElMessage.error("?∞Â??®Êà∂Â§±Ê?");
  } finally {
    creating.value = false;
  }
};

// Á¢∫Ë??™Èô§?®Êà∂
const confirmDelete = async (user) => {
  try {
    const confirmResult = await ElMessageBox.confirm(
      `Á¢∫Â?Ë¶ÅÂà™?§Áî®?∂„Ä?{user.name}??${user.username})?éÔ?`,
      "?™Èô§Á¢∫Ë?",
      {
        confirmButtonText: "Á¢∫Â??™Èô§",
        cancelButtonText: "?ñÊ?",
        type: "warning",
      },
    );

    if (confirmResult === "confirm") {
      await handleDeleteUser(user.id);
    }
  } catch (error) {
    // ?®Êà∂?ñÊ?
  }
};

// ?™Èô§?®Êà∂
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
    console.error("?™Èô§?®Êà∂?ØË™§:", error);
    ElMessage.error("?™Èô§?®Êà∂Â§±Ê?");
  }
};

// ?çÁΩÆË°®ÂñÆ
const resetCreateForm = () => {
  Object.keys(createForm).forEach((key) => {
    createForm[key] = "";
  });
  if (createFormRef.value) {
    createFormRef.value.clearValidate();
  }
};

// ?úÈ?Â∞çË©±Ê°?
const handleCloseDialog = () => {
  showCreateDialog.value = false;
  resetCreateForm();
};

// ÁµÑ‰ª∂?õË?
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

/* ?ãÊ?Á´ØÈÅ©??*/
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

/* Element Plus Ê®??Ë¶ÜË? */
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
