<template>
  <div class="team-management">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <el-icon><Flag /></el-icon>
          Team 管理
        </h1>
        <p class="page-description">管理組織 Team，並指派用戶所屬 Team</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          新增 Team
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- Teams 列表 -->
      <el-col :xs="24" :sm="10" :md="8">
        <el-card class="teams-card">
          <template #header>
            <div class="card-header">
              <span>Teams 列表（{{ teams.length }}）</span>
              <el-button :icon="Refresh" circle size="small" @click="loadTeams" :loading="loading" />
            </div>
          </template>

          <el-skeleton :loading="loading" animated :rows="3">
            <template #default>
              <div v-if="!teams.length" class="empty-hint">
                <el-empty description="尚無 Team，請新增" :image-size="80" />
              </div>
              <div
                v-for="team in teams"
                :key="team.id"
                :class="['team-item', { active: selectedTeam?.id === team.id }]"
                @click="selectTeam(team)"
              >
                <div class="team-item-main">
                  <el-icon class="team-icon"><Flag /></el-icon>
                  <div class="team-info">
                    <div class="team-name">{{ team.name }}</div>
                    <div class="team-desc" v-if="team.description">{{ team.description }}</div>
                    <div class="team-count">
                      {{ getUsersByTeam(team.id).length }} 位成員
                    </div>
                  </div>
                </div>
                <div class="team-actions" @click.stop>
                  <el-button text :icon="Edit" size="small" @click="openEditDialog(team)" />
                  <el-button text :icon="Delete" size="small" type="danger" @click="handleDeleteTeam(team)" />
                </div>
              </div>
            </template>
          </el-skeleton>
        </el-card>
      </el-col>

      <!-- 用戶指派面板 -->
      <el-col :xs="24" :sm="14" :md="16">
        <el-card class="users-card">
          <template #header>
            <div class="card-header">
              <span v-if="selectedTeam">
                「{{ selectedTeam.name }}」的成員管理
              </span>
              <span v-else>請選擇左側的 Team 來管理成員</span>
            </div>
          </template>

          <div v-if="!selectedTeam" class="select-hint">
            <el-empty description="點選左側 Team 以管理成員" :image-size="100" />
          </div>

          <template v-else>
            <!-- 已在此 Team 的用戶 -->
            <div class="section-title">
              <el-icon><User /></el-icon>
              目前成員（{{ getUsersByTeam(selectedTeam.id).length }} 人）
            </div>
            <el-table
              :data="getUsersByTeam(selectedTeam.id)"
              size="small"
              class="member-table"
              empty-text="此 Team 尚無成員"
            >
              <el-table-column prop="username" label="帳號" width="120" />
              <el-table-column prop="name" label="姓名" width="120" />
              <el-table-column prop="role" label="角色" width="90">
                <template #default="{ row }">
                  <el-tag :type="getRoleTagType(row.role)" size="small">
                    {{ getRoleText(row.role) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template #default="{ row }">
                  <el-button
                    text
                    type="danger"
                    size="small"
                    :icon="RemoveFilled"
                    @click="handleUnassignUser(row)"
                    :loading="row.assigning"
                  >
                    移除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-divider />

            <!-- 未指派的用戶 -->
            <div class="section-title">
              <el-icon><UserFilled /></el-icon>
              未指派的用戶（{{ unassignedUsers.length }} 人）
            </div>
            <el-table
              :data="unassignedUsers"
              size="small"
              class="member-table"
              empty-text="所有用戶均已指派至某 Team"
            >
              <el-table-column prop="username" label="帳號" width="120" />
              <el-table-column prop="name" label="姓名" width="120" />
              <el-table-column prop="role" label="角色" width="90">
                <template #default="{ row }">
                  <el-tag :type="getRoleTagType(row.role)" size="small">
                    {{ getRoleText(row.role) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template #default="{ row }">
                  <el-button
                    text
                    type="success"
                    size="small"
                    :icon="CirclePlusFilled"
                    @click="handleAssignUser(row)"
                    :loading="row.assigning"
                  >
                    加入
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新增/編輯 Team Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '編輯 Team' : '新增 Team'"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名稱" prop="name">
          <el-input v-model="form.name" placeholder="請輸入 Team 名稱" />
        </el-form-item>
        <el-form-item label="說明" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="選填說明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEditing ? '儲存' : '新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Flag,
  Plus,
  Edit,
  Delete,
  Refresh,
  User,
  UserFilled,
  RemoveFilled,
  CirclePlusFilled,
} from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import { getApiUrl } from "@/config/api";

const authStore = useAuthStore();

const loading = ref(false);
const submitting = ref(false);
const teams = ref([]);
const users = ref([]);
const selectedTeam = ref(null);

const dialogVisible = ref(false);
const isEditing = ref(false);
const formRef = ref(null);
const form = ref({ name: "", description: "" });
const rules = {
  name: [{ required: true, message: "請輸入 Team 名稱", trigger: "blur" }],
};

const unassignedUsers = computed(() =>
  users.value.filter((u) => !u.teamId)
);

const getUsersByTeam = (teamId) =>
  users.value.filter((u) => u.teamId === teamId);

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${authStore.token}`,
});

const loadTeams = async () => {
  loading.value = true;
  try {
    const res = await fetch(getApiUrl("/api/teams"), {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (data.success) teams.value = data.data;
    else ElMessage.error(data.message || "載入 Teams 失敗");
  } catch (e) {
    ElMessage.error("載入 Teams 失敗");
  } finally {
    loading.value = false;
  }
};

const loadUsers = async () => {
  try {
    const res = await fetch(getApiUrl("/api/auth/users"), {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (data.success) users.value = data.data.map((u) => ({ ...u, assigning: false }));
  } catch (e) {
    console.error("載入用戶失敗", e);
  }
};

const selectTeam = (team) => {
  selectedTeam.value = selectedTeam.value?.id === team.id ? null : team;
};

const openCreateDialog = () => {
  isEditing.value = false;
  form.value = { name: "", description: "" };
  dialogVisible.value = true;
};

const openEditDialog = (team) => {
  isEditing.value = true;
  form.value = { id: team.id, name: team.name, description: team.description || "" };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    const url = isEditing.value
      ? getApiUrl(`/api/teams/${form.value.id}`)
      : getApiUrl("/api/teams");
    const method = isEditing.value ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: form.value.name, description: form.value.description }),
    });
    const data = await res.json();
    if (data.success) {
      ElMessage.success(isEditing.value ? "Team 已更新" : "Team 已新增");
      dialogVisible.value = false;
      await loadTeams();
      if (isEditing.value && selectedTeam.value?.id === form.value.id) {
        selectedTeam.value = teams.value.find((t) => t.id === form.value.id) || null;
      }
    } else {
      ElMessage.error(data.message || "操作失敗");
    }
  } catch (e) {
    ElMessage.error("操作失敗");
  } finally {
    submitting.value = false;
  }
};

const handleDeleteTeam = async (team) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除 Team「${team.name}」嗎？`,
      "確認刪除",
      { confirmButtonText: "刪除", cancelButtonText: "取消", type: "warning" }
    );
    const res = await fetch(getApiUrl(`/api/teams/${team.id}`), {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (data.success) {
      ElMessage.success("Team 已刪除");
      if (selectedTeam.value?.id === team.id) selectedTeam.value = null;
      await loadTeams();
      await loadUsers();
    } else {
      ElMessage.error(data.message || "刪除失敗");
    }
  } catch (e) {
    if (e !== "cancel") ElMessage.error(e.message || "刪除失敗");
  }
};

const handleAssignUser = async (user) => {
  if (!selectedTeam.value) return;
  user.assigning = true;
  try {
    const res = await fetch(getApiUrl("/api/teams/assign-user"), {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId: user.id, teamId: selectedTeam.value.id }),
    });
    const data = await res.json();
    if (data.success) {
      user.teamId = selectedTeam.value.id;
      ElMessage.success(`已將 ${user.name || user.username} 加入 Team`);
    } else {
      ElMessage.error(data.message || "指派失敗");
    }
  } catch (e) {
    ElMessage.error("指派失敗");
  } finally {
    user.assigning = false;
  }
};

const handleUnassignUser = async (user) => {
  user.assigning = true;
  try {
    const res = await fetch(getApiUrl("/api/teams/assign-user"), {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId: user.id, teamId: null }),
    });
    const data = await res.json();
    if (data.success) {
      user.teamId = null;
      ElMessage.success(`已將 ${user.name || user.username} 從 Team 移除`);
    } else {
      ElMessage.error(data.message || "移除失敗");
    }
  } catch (e) {
    ElMessage.error("移除失敗");
  } finally {
    user.assigning = false;
  }
};

const getRoleText = (role) => {
  const map = { admin: "管理員", leader: "小組長", reader: "訪客" };
  return map[role] || role;
};

const getRoleTagType = (role) => {
  const map = { admin: "danger", leader: "warning", reader: "info" };
  return map[role] || "";
};

onMounted(async () => {
  await Promise.all([loadTeams(), loadUsers()]);
});
</script>

<style scoped>
.team-management {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 4px;
}

.page-description {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.teams-card,
.users-card {
  min-height: 400px;
}

.team-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 6px;
  border: 1px solid transparent;
}

.team-item:hover {
  background: #f5f7fa;
}

.team-item.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.team-item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.team-icon {
  font-size: 20px;
  color: #409eff;
  flex-shrink: 0;
}

.team-name {
  font-weight: 500;
  font-size: 14px;
}

.team-desc {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-count {
  font-size: 12px;
  color: #67c23a;
  margin-top: 2px;
}

.team-actions {
  flex-shrink: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #555;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.member-table {
  width: 100%;
}

.select-hint,
.empty-hint {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

@media (max-width: 768px) {
  .team-management {
    padding: 12px;
  }
  .page-header {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
