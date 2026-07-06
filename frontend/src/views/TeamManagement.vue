<template>
  <div class="team-management">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title"><el-icon><Flag /></el-icon> 所屬團隊管理</h1>
        <p class="page-description" v-if="!isEvelyn && myTeam">
          我的團隊：<strong>{{ myTeam.name }}</strong>　已認領 <strong>{{ myTeamWorkers.length }}</strong> 位組員
        </p>
        <p class="page-description" v-if="!isEvelyn && !myTeam" style="color:#f56c6c">
          您尚未被指派到任何團隊，請聯絡 Evelyn
        </p>
      </div>
      <el-button :icon="Refresh" @click="loadAll" :loading="loading">重新整理</el-button>
    </div>

    <!-- Evelyn 有兩個 Tab；組長只看工讀生認領 -->
    <el-tabs v-if="isEvelyn" v-model="activeTab" type="border-card">
      <!-- Tab 1: 工讀生認領（Evelyn 全權） -->
      <el-tab-pane label="工讀生認領" name="workers">
        <el-card class="filter-card" shadow="never" style="margin-bottom:12px">
          <el-radio-group v-model="workerFilter" size="small">
            <el-radio-button label="all">全部工讀生（{{ workers.length }}）</el-radio-button>
            <el-radio-button label="unassigned">未認領（{{ unassignedWorkers.length }}）</el-radio-button>
          </el-radio-group>
        </el-card>
        <el-table :data="filteredWorkers" v-loading="loading" stripe size="small" empty-text="無資料">
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="number" label="工號" width="80" />
          <el-table-column prop="group" label="組別" width="100">
            <template #default="{ row }">{{ row.group || '—' }}</template>
          </el-table-column>
          <el-table-column label="所屬團隊" min-width="150">
            <template #default="{ row }">
              <el-select
                :model-value="row.teamId || ''"
                size="small"
                placeholder="未認領"
                style="width:130px"
                clearable
                @change="(val) => assignWorker(row.id, val || null)"
              >
                <el-option v-for="team in teams" :key="team.id" :label="team.name" :value="team.id" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 2: 團隊設定（Evelyn only） -->
      <el-tab-pane label="⚙️ 團隊設定" name="settings">
        <div style="display:flex; justify-content:flex-end; margin-bottom:12px">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增團隊</el-button>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="10" :md="8">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>團隊列表（{{ teams.length }}）</span>
                  <el-button :icon="Refresh" circle size="small" @click="loadAll" :loading="loading" />
                </div>
              </template>
              <div v-if="!teams.length" class="empty-hint">
                <el-empty description="尚無團隊，請新增" :image-size="80" />
              </div>
              <div
                v-for="team in teams" :key="team.id"
                :class="['team-item', { active: selectedTeam?.id === team.id }]"
                @click="selectTeam(team)"
              >
                <div class="team-item-main">
                  <el-icon class="team-icon"><Flag /></el-icon>
                  <div class="team-info">
                    <div class="team-name">{{ team.name }}</div>
                    <div class="team-desc" v-if="team.description">{{ team.description }}</div>
                    <div class="team-count">{{ getUsersByTeam(team.id).length }} 位小組長</div>
                  </div>
                </div>
                <div class="team-actions" @click.stop>
                  <el-button text :icon="Edit" size="small" @click="openEditDialog(team)" />
                  <el-button text :icon="Delete" size="small" type="danger" @click="handleDeleteTeam(team)" />
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="14" :md="16">
            <el-card>
              <template #header>
                <span v-if="selectedTeam">「{{ selectedTeam.name }}」的小組長管理</span>
                <span v-else>點選左側團隊以管理所屬小組長</span>
              </template>
              <div v-if="!selectedTeam" class="select-hint">
                <el-empty description="選擇左側團隊" :image-size="80" />
              </div>
              <template v-else>
                <div class="section-title"><el-icon><User /></el-icon> 目前小組長（{{ getUsersByTeam(selectedTeam.id).length }} 人）</div>
                <el-table :data="getUsersByTeam(selectedTeam.id)" size="small" empty-text="此團隊尚無小組長">
                  <el-table-column prop="username" label="帳號" width="110" />
                  <el-table-column prop="name" label="姓名" />
                  <el-table-column label="操作" width="90" align="center">
                    <template #default="{ row }">
                      <el-button text type="danger" size="small" :icon="RemoveFilled" @click="handleUnassignUser({ user: row })" :loading="row.assigning">移除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
                <el-divider />
                <div class="section-title"><el-icon><UserFilled /></el-icon> 未指派的小組長（{{ unassignedUsers.length }} 人）</div>
                <el-table :data="unassignedUsers" size="small" empty-text="所有小組長均已指派">
                  <el-table-column prop="username" label="帳號" width="110" />
                  <el-table-column prop="name" label="姓名" />
                  <el-table-column label="操作" width="90" align="center">
                    <template #default="{ row }">
                      <el-button text type="success" size="small" :icon="CirclePlusFilled" @click="handleAssignUser({ user: row, teamId: selectedTeam.id })" :loading="row.assigning">加入</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </template>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 組長視角：直接顯示認領表 -->
    <template v-else>
      <div v-if="!myTeam" class="no-team-hint">
        <el-empty description="您尚未被指派到任何團隊，請聯絡 Evelyn" />
      </div>
      <template v-else>
        <!-- 篩選 -->
        <el-card class="filter-card">
          <el-radio-group v-model="workerFilter" size="small">
            <el-radio-button label="all">全部工讀生（{{ workers.length }}）</el-radio-button>
            <el-radio-button label="unassigned">未認領（{{ unassignedWorkers.length }}）</el-radio-button>
            <el-radio-button label="mine">我的團隊（{{ myTeamWorkers.length }}）</el-radio-button>
          </el-radio-group>
        </el-card>

        <!-- 工讀生總表 -->
        <el-card>
          <el-table :data="filteredWorkers" v-loading="loading" stripe size="small" empty-text="無資料">
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="number" label="工號" width="80" />
            <el-table-column prop="group" label="組別" width="100">
              <template #default="{ row }">{{ row.group || '—' }}</template>
            </el-table-column>
            <el-table-column label="狀態" min-width="130">
              <template #default="{ row }">
                <el-tag v-if="row.teamId === myTeam.id" type="success" size="small">🏠 我的團隊</el-tag>
                <el-tag v-else-if="row.teamId" type="warning" size="small">🔒 {{ getTeamName(row.teamId) }}</el-tag>
                <el-tag v-else type="info" size="small">未認領</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="110" align="center" fixed="right">
              <template #default="{ row }">
                <el-button v-if="!row.teamId" type="primary" size="small" plain :loading="row.assigning" @click="assignWorker(row.id, myTeam.id)">認領</el-button>
                <el-button v-else-if="row.teamId === myTeam.id" type="danger" size="small" plain :loading="row.assigning" @click="assignWorker(row.id, null)">移出</el-button>
                <el-tooltip v-else :content="`已屬於「${getTeamName(row.teamId)}」，請由對方組長先移出`" placement="top">
                  <el-button size="small" disabled><el-icon><Lock /></el-icon></el-button>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </template>
    </template>

    <!-- 新增/編輯 Dialog -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? '編輯團隊' : '新增團隊'" width="420px" :close-on-click-modal="false">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名稱" prop="name">
          <el-input v-model="form.name" placeholder="請輸入團隊名稱" />
        </el-form-item>
        <el-form-item label="說明">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="選填說明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">{{ isEditing ? '儲存' : '新增' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Flag, Plus, Edit, Delete, Refresh, User, UserFilled, RemoveFilled, CirclePlusFilled, Lock } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import { getApiUrl } from "@/config/api";

const authStore = useAuthStore();
const isEvelyn = computed(() => authStore.isEvelyn);

const loading = ref(false);
const submitting = ref(false);
const activeTab = ref("workers");
const workerFilter = ref("all");
const teams = ref([]);
const allUsers = ref([]);
const workers = ref([]);
const selectedTeam = ref(null);

const dialogVisible = ref(false);
const isEditing = ref(false);
const formRef = ref(null);
const form = ref({ name: "", description: "" });
const rules = { name: [{ required: true, message: "請輸入團隊名稱", trigger: "blur" }] };

// ── 計算屬性 ──────────────────────────────────────────
const myTeam = computed(() => {
  const teamId = authStore.user?.teamId;
  return teams.value.find((t) => t.id === teamId) || null;
});

const unassignedWorkers = computed(() => workers.value.filter((w) => !w.teamId));
const myTeamWorkers = computed(() => workers.value.filter((w) => w.teamId === myTeam.value?.id));
const unassignedUsers = computed(() => allUsers.value.filter((u) => !u.teamId));

const filteredWorkers = computed(() => {
  if (workerFilter.value === "unassigned") return unassignedWorkers.value;
  if (workerFilter.value === "mine") return myTeamWorkers.value;
  return workers.value;
});

const getUsersByTeam = (teamId) => allUsers.value.filter((u) => u.teamId === teamId);
const getTeamName = (teamId) => teams.value.find((t) => t.id === teamId)?.name || teamId;

// ── API helpers ───────────────────────────────────────
const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${authStore.token}`,
});

const loadAll = async () => {
  loading.value = true;
  try {
    const [teamsRes, workersRes] = await Promise.all([
      fetch(getApiUrl("/api/teams"), { headers: headers() }),
      fetch(getApiUrl("/api/workers"), { headers: headers() }),
    ]);
    const [teamsData, workersData] = await Promise.all([teamsRes.json(), workersRes.json()]);
    if (teamsData.success) teams.value = teamsData.data;
    if (workersData.success) workers.value = workersData.data.map((w) => ({ ...w, assigning: false }));

    if (isEvelyn.value) {
      const usersRes = await fetch(getApiUrl("/api/auth/users"), { headers: headers() });
      const usersData = await usersRes.json();
      if (usersData.success) allUsers.value = usersData.data.map((u) => ({ ...u, assigning: false }));
    }
  } catch (e) {
    ElMessage.error("載入資料失敗");
  } finally {
    loading.value = false;
  }
};

// ── 工讀生指派（組長 & Evelyn 共用）────────────────────
const assignWorker = async (workerId, teamId) => {
  const worker = workers.value.find((w) => w.id === workerId);
  if (worker) worker.assigning = true;
  try {
    const res = await fetch(getApiUrl(`/api/workers/${workerId}/assign-team`), {
      method: "PATCH", headers: headers(),
      body: JSON.stringify({ teamId }),
    });
    const data = await res.json();
    if (data.success) {
      if (worker) worker.teamId = teamId;
    } else {
      ElMessage.error(data.message || "指派失敗");
    }
  } catch (e) {
    ElMessage.error("指派失敗");
  } finally {
    if (worker) worker.assigning = false;
  }
};

// ── 小組長指派（Evelyn）────────────────────────────────
const selectTeam = (team) => {
  selectedTeam.value = selectedTeam.value?.id === team.id ? null : team;
};

const handleAssignUser = async ({ user, teamId }) => {
  user.assigning = true;
  try {
    const res = await fetch(getApiUrl("/api/teams/assign-user"), {
      method: "PATCH", headers: headers(),
      body: JSON.stringify({ userId: user.id, teamId }),
    });
    const data = await res.json();
    if (data.success) { user.teamId = teamId; ElMessage.success("已指派"); }
    else ElMessage.error(data.message || "指派失敗");
  } catch (e) { ElMessage.error("指派失敗"); }
  finally { user.assigning = false; }
};

const handleUnassignUser = async ({ user }) => {
  user.assigning = true;
  try {
    const res = await fetch(getApiUrl("/api/teams/assign-user"), {
      method: "PATCH", headers: headers(),
      body: JSON.stringify({ userId: user.id, teamId: null }),
    });
    const data = await res.json();
    if (data.success) { user.teamId = null; ElMessage.success("已移出"); }
    else ElMessage.error(data.message || "移除失敗");
  } catch (e) { ElMessage.error("移除失敗"); }
  finally { user.assigning = false; }
};

// ── Team CRUD ─────────────────────────────────────────
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
    const url = isEditing.value ? getApiUrl(`/api/teams/${form.value.id}`) : getApiUrl("/api/teams");
    const res = await fetch(url, {
      method: isEditing.value ? "PUT" : "POST", headers: headers(),
      body: JSON.stringify({ name: form.value.name, description: form.value.description }),
    });
    const data = await res.json();
    if (data.success) { ElMessage.success(isEditing.value ? "已更新" : "已新增"); dialogVisible.value = false; await loadAll(); }
    else ElMessage.error(data.message || "操作失敗");
  } catch (e) { ElMessage.error("操作失敗"); }
  finally { submitting.value = false; }
};

const handleDeleteTeam = async (team) => {
  try {
    await ElMessageBox.confirm(`確定要刪除「${team.name}」嗎？`, "確認刪除", {
      confirmButtonText: "刪除", cancelButtonText: "取消", type: "warning",
    });
    const res = await fetch(getApiUrl(`/api/teams/${team.id}`), { method: "DELETE", headers: headers() });
    const data = await res.json();
    if (data.success) { ElMessage.success("已刪除"); if (selectedTeam.value?.id === team.id) selectedTeam.value = null; await loadAll(); }
    else ElMessage.error(data.message || "刪除失敗");
  } catch (e) { if (e !== "cancel") ElMessage.error(e.message || "刪除失敗"); }
};

const getRoleText = (role) => ({ admin: "管理員", leader: "小組長", reader: "訪客" }[role] || role);
const getRoleTagType = (role) => ({ admin: "danger", leader: "warning", reader: "info" }[role] || "");

onMounted(loadAll);
</script>

<style scoped>
.team-management { padding: 20px; max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 22px; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0 0 4px; }
.page-description { color: #666; font-size: 14px; margin: 0; }
.filter-card { margin-bottom: 16px; }
.no-team-hint { display: flex; justify-content: center; padding: 60px 0; }
@media (max-width: 768px) { .team-management { padding: 12px; } .page-header { flex-direction: column; } }
</style>
