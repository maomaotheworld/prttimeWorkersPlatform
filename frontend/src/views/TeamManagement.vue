<template>
  <div class="team-management">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title"><el-icon><Flag /></el-icon> 所屬團隊管理</h1>
        <p class="page-description" v-if="!isEvelyn && myTeam">
          我的團隊：<strong>{{ myTeam.name }}</strong>
        </p>
        <p class="page-description" v-if="!isEvelyn && !myTeam" style="color:#f56c6c">
          您尚未被指派到任何團隊，請聯絡 Evelyn
        </p>
      </div>
      <el-button :icon="Refresh" @click="loadAll" :loading="loading">重新整理</el-button>
    </div>

    <!-- ===== Evelyn：兩個 Tab ===== -->
    <el-tabs v-if="isEvelyn" v-model="activeTab" type="border-card">

      <!-- Tab 1：工讀生認領 -->
      <el-tab-pane label="工讀生認領" name="workers">
        <!-- 選擇要管理哪個 team -->
        <div class="team-selector">
          <span class="selector-label">選擇團隊：</span>
          <el-select v-model="selectedTeamId" placeholder="選擇要管理的團隊" style="width:200px" clearable>
            <el-option v-for="t in teams" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
          <el-tag v-if="selectedTeamId" type="success" size="large" style="margin-left:12px">
            已認領：{{ getWorkersByTeam(selectedTeamId).length }} 人
          </el-tag>
        </div>

        <el-row :gutter="16" class="assign-board" v-if="selectedTeamId">
          <!-- 左：未認領 -->
          <el-col :xs="24" :sm="12">
            <el-card shadow="never" class="board-card">
              <template #header>
                <div class="board-header unassigned-header">
                  <span>未認領工讀生</span>
                  <el-tag type="info" size="small">{{ unassignedWorkers.length }}</el-tag>
                </div>
              </template>
              <div v-if="!unassignedWorkers.length" class="board-empty">目前無未認領組員</div>
              <div v-for="w in unassignedWorkers" :key="w.id" class="worker-row">
                <div class="worker-info">
                  <div class="worker-main">
                    <div class="worker-meta">
                      <span class="worker-name">{{ w.name }}</span>
                      <span class="worker-num">{{ w.number }}</span>
                      <span v-if="w.floor" class="worker-tag floor-tag">{{ w.floor }}</span>
                    </div>
                    <el-tooltip v-if="w.job" :content="w.job" placement="top" :show-after="200">
                      <div class="worker-job">{{ w.job }}</div>
                    </el-tooltip>
                  </div>
                </div>
                <el-button type="primary" size="small" plain :loading="w.assigning"
                  @click="assignWorker(w.id, selectedTeamId)">認領</el-button>
              </div>
            </el-card>
          </el-col>

          <!-- 右：已認領 -->
          <el-col :xs="24" :sm="12">
            <el-card shadow="never" class="board-card">
              <template #header>
                <div class="board-header assigned-header">
                  <span>已認領組員</span>
                  <el-tag type="success" size="small">{{ getWorkersByTeam(selectedTeamId).length }}</el-tag>
                </div>
              </template>
              <div v-if="!getWorkersByTeam(selectedTeamId).length" class="board-empty">尚未認領任何組員</div>
              <div v-for="w in getWorkersByTeam(selectedTeamId)" :key="w.id" class="worker-row">
                <div class="worker-info">
                  <span class="worker-name">{{ w.name }}</span>
                  <span class="worker-num">{{ w.number }}</span>
                </div>
                <el-button type="danger" size="small" plain :icon="CircleClose" :loading="w.assigning"
                  @click="assignWorker(w.id, null)" title="取消認領" />
              </div>
            </el-card>
          </el-col>
        </el-row>

        <div v-else class="board-empty" style="padding:60px 0">
          <el-empty description="請先選擇要管理的團隊" :image-size="80" />
        </div>
      </el-tab-pane>

      <!-- Tab 2：團隊設定 -->
      <el-tab-pane label="⚙️ 團隊設定" name="settings">
        <div class="settings-toolbar">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增團隊</el-button>
        </div>

        <div v-if="!teams.length" class="board-empty">
          <el-empty description="尚無團隊，請新增" :image-size="80" />
        </div>

        <el-card
          v-for="team in teams" :key="team.id"
          class="team-setting-card" shadow="never"
        >
          <div class="team-setting-header">
            <div class="team-setting-title">
              <el-icon class="team-icon"><Flag /></el-icon>
              <span class="team-name-text">{{ team.name }}</span>
              <span class="team-desc-text" v-if="team.description">{{ team.description }}</span>
            </div>
            <div class="team-setting-actions">
              <el-button size="small" :icon="Edit" @click="openEditDialog(team)">編輯</el-button>
              <el-button size="small" :icon="Delete" type="danger" plain @click="handleDeleteTeam(team)">刪除</el-button>
            </div>
          </div>

          <!-- 此 team 的小組長 -->
          <div class="team-leaders">
            <div class="leaders-label">小組長：</div>
            <div class="leaders-list">
              <el-tag
                v-for="u in getUsersByTeam(team.id)" :key="u.id"
                closable size="small" type="warning"
                @close="handleUnassignUser({ user: u })"
                style="margin:2px"
              >{{ u.name || u.username }}</el-tag>
              <span v-if="!getUsersByTeam(team.id).length" style="color:#bbb;font-size:12px">尚無小組長</span>

              <!-- 加入未指派的小組長 -->
              <el-select
                v-if="unassignedUsers.length"
                placeholder="+ 加入小組長"
                size="small"
                style="width:130px;margin-left:6px"
                @change="(uid) => handleAssignUser({ userId: uid, teamId: team.id })"
                :model-value="null"
              >
                <el-option v-for="u in unassignedUsers" :key="u.id" :label="u.name || u.username" :value="u.id" />
              </el-select>
            </div>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- ===== 組長：直接工讀生認領 ===== -->
    <template v-else>
      <div v-if="!myTeam" class="no-team-hint">
        <el-empty description="您尚未被指派到任何團隊，請聯絡 Evelyn" />
      </div>
      <template v-else>
        <el-row :gutter="16" class="assign-board">
          <!-- 左：未認領 -->
          <el-col :xs="24" :sm="12">
            <el-card shadow="never" class="board-card">
              <template #header>
                <div class="board-header unassigned-header">
                  <span>未認領工讀生</span>
                  <el-tag type="info" size="small">{{ unassignedWorkers.length }}</el-tag>
                </div>
              </template>
              <div v-if="!unassignedWorkers.length" class="board-empty">目前無未認領組員</div>
              <div v-for="w in unassignedWorkers" :key="w.id" class="worker-row">
                <div class="worker-info">
                  <div class="worker-main">
                    <div class="worker-meta">
                      <span class="worker-name">{{ w.name }}</span>
                      <span class="worker-num">{{ w.number }}</span>
                      <span v-if="w.floor" class="worker-tag floor-tag">{{ w.floor }}</span>
                    </div>
                    <el-tooltip v-if="w.job" :content="w.job" placement="top" :show-after="200">
                      <div class="worker-job">{{ w.job }}</div>
                    </el-tooltip>
                  </div>
                </div>
                <el-button type="primary" size="small" plain :loading="w.assigning"
                  @click="assignWorker(w.id, myTeam.id)">認領</el-button>
              </div>
            </el-card>
          </el-col>

          <!-- 右：我的團隊 -->
          <el-col :xs="24" :sm="12">
            <el-card shadow="never" class="board-card">
              <template #header>
                <div class="board-header assigned-header">
                  <span>🏠 {{ myTeam.name }}（我的團隊）</span>
                  <el-tag type="success" size="small">{{ myTeamWorkers.length }}</el-tag>
                </div>
              </template>
              <div v-if="!myTeamWorkers.length" class="board-empty">尚未認領任何組員</div>
              <div v-for="w in myTeamWorkers" :key="w.id" class="worker-row">
                <div class="worker-info">
                  <span class="worker-name">{{ w.name }}</span>
                  <span class="worker-num">{{ w.number }}</span>
                </div>
                <el-button type="danger" size="small" plain :icon="CircleClose" :loading="w.assigning"
                  @click="assignWorker(w.id, null)" title="取消認領" />
              </div>
            </el-card>
          </el-col>
        </el-row>
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
import { Flag, Plus, Edit, Delete, Refresh, User, UserFilled, CircleClose } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import { getApiUrl } from "@/config/api";

const authStore = useAuthStore();
const isEvelyn = computed(() => authStore.isEvelyn);

const loading = ref(false);
const submitting = ref(false);
const activeTab = ref("workers");
const selectedTeamId = ref(null);

const teams = ref([]);
const allUsers = ref([]);
const workers = ref([]);

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
const unassignedUsers = computed(() => allUsers.value.filter((u) => !u.teamId && u.role === "leader"));

const getUsersByTeam = (teamId) => allUsers.value.filter((u) => u.teamId === teamId);
const getWorkersByTeam = (teamId) => workers.value.filter((w) => w.teamId === teamId);
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

// ── 工讀生指派 ────────────────────────────────────────
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
const handleAssignUser = async ({ userId, teamId }) => {
  const user = allUsers.value.find((u) => u.id === userId);
  if (!user) return;
  user.assigning = true;
  try {
    const res = await fetch(getApiUrl("/api/teams/assign-user"), {
      method: "PATCH", headers: headers(),
      body: JSON.stringify({ userId, teamId }),
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
    if (data.success) { user.teamId = null; }
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
    if (data.success) { ElMessage.success("已刪除"); await loadAll(); }
    else ElMessage.error(data.message || "刪除失敗");
  } catch (e) { if (e !== "cancel") ElMessage.error(e.message || "刪除失敗"); }
};

onMounted(loadAll);
</script>

<style scoped>
.team-management { padding: 20px; max-width: 1200px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 22px; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0 0 4px; }
.page-description { color: #666; font-size: 14px; margin: 0; }

/* 工讀生認領 */
.team-selector { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.selector-label { font-size: 14px; font-weight: 500; color: #555; white-space: nowrap; }
.assign-board { margin-top: 0; }
.board-card { height: 100%; }
.board-header { display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 14px; }
.unassigned-header { color: #606266; }
.assigned-header { color: #3a8a4a; }
.worker-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 4px; border-bottom: 1px solid #f0f2f5; }
.worker-row:last-child { border-bottom: none; }
.worker-info { display: flex; align-items: flex-start; flex: 1; min-width: 0; }
.worker-main { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
.worker-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.worker-name { font-weight: 500; font-size: 14px; }
.worker-num { font-size: 12px; color: #999; }
.worker-tag { font-size: 11px; padding: 1px 6px; border-radius: 10px; white-space: nowrap; }
.floor-tag { background: #ecf5ff; color: #409eff; }
.worker-job {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: default;
  word-break: break-all;
}
.board-empty { color: #bbb; text-align: center; padding: 30px 0; font-size: 13px; }

/* 團隊設定 */
.settings-toolbar { margin-bottom: 16px; }
.team-setting-card { margin-bottom: 12px; }
.team-setting-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px; }
.team-setting-title { display: flex; align-items: center; gap: 8px; }
.team-icon { font-size: 18px; color: #409eff; }
.team-name-text { font-weight: 600; font-size: 15px; }
.team-desc-text { font-size: 12px; color: #999; }
.team-setting-actions { display: flex; gap: 6px; flex-shrink: 0; }
.team-leaders { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.leaders-label { font-size: 13px; color: #555; white-space: nowrap; }
.leaders-list { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }

.no-team-hint { display: flex; justify-content: center; padding: 60px 0; }
@media (max-width: 768px) { .team-management { padding: 12px; } .page-header { flex-direction: column; } .assign-board .el-col { margin-bottom: 16px; } }
</style>
