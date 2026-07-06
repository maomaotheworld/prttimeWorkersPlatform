<template>
  <div class="team-management">
    <!-- ===== EVELYN 管理視角 ===== -->
    <template v-if="isEvelyn">
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title"><el-icon><Flag /></el-icon> 所屬團隊管理</h1>
          <p class="page-description">管理組織團隊，並指派小組長所屬團隊</p>
        </div>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增團隊</el-button>
      </div>

      <el-row :gutter="20">
        <el-col :xs="24" :sm="10" :md="8">
          <el-card class="teams-card">
            <template #header>
              <div class="card-header">
                <span>團隊列表（{{ teams.length }}）</span>
                <el-button :icon="Refresh" circle size="small" @click="loadAll" :loading="loading" />
              </div>
            </template>
            <el-skeleton :loading="loading" animated :rows="3">
              <template #default>
                <div v-if="!teams.length" class="empty-hint">
                  <el-empty description="尚無團隊，請新增" :image-size="80" />
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
                      <div class="team-count">{{ getUsersByTeam(team.id).length }} 位小組長</div>
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

        <el-col :xs="24" :sm="14" :md="16">
          <el-card>
            <template #header>
              <span v-if="selectedTeam">「{{ selectedTeam.name }}」的小組長管理</span>
              <span v-else>點選左側團隊以管理所屬小組長</span>
            </template>
            <div v-if="!selectedTeam" class="select-hint">
              <el-empty description="選擇左側團隊" :image-size="100" />
            </div>
            <template v-else>
              <div class="section-title"><el-icon><User /></el-icon> 目前小組長（{{ getUsersByTeam(selectedTeam.id).length }} 人）</div>
              <el-table :data="getUsersByTeam(selectedTeam.id)" size="small" empty-text="此團隊尚無小組長">
                <el-table-column prop="username" label="帳號" width="110" />
                <el-table-column prop="name" label="姓名" />
                <el-table-column prop="role" label="角色" width="90">
                  <template #default="{ row }">
                    <el-tag :type="getRoleTagType(row.role)" size="small">{{ getRoleText(row.role) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="90" align="center">
                  <template #default="{ row }">
                    <el-button text type="danger" size="small" :icon="RemoveFilled" @click="handleUnassignUser(row)" :loading="row.assigning">移除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <el-divider />
              <div class="section-title"><el-icon><UserFilled /></el-icon> 未指派的小組長（{{ unassignedUsers.length }} 人）</div>
              <el-table :data="unassignedUsers" size="small" empty-text="所有小組長均已指派">
                <el-table-column prop="username" label="帳號" width="110" />
                <el-table-column prop="name" label="姓名" />
                <el-table-column prop="role" label="角色" width="90">
                  <template #default="{ row }">
                    <el-tag :type="getRoleTagType(row.role)" size="small">{{ getRoleText(row.role) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="90" align="center">
                  <template #default="{ row }">
                    <el-button text type="success" size="small" :icon="CirclePlusFilled" @click="handleAssignUser(row)" :loading="row.assigning">加入</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </el-card>
        </el-col>
      </el-row>
    </template>

    <!-- ===== 小組長 工讀生指派視角 ===== -->
    <template v-else>
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title"><el-icon><Flag /></el-icon> 所屬團隊管理</h1>
          <p class="page-description" v-if="myTeam">
            我的團隊：<strong>{{ myTeam.name }}</strong>　可將未分配的組員拖曳或選取加入
          </p>
          <p class="page-description" v-else style="color:#f56c6c">
            您尚未被指派到任何團隊，請聯絡 Evelyn
          </p>
        </div>
        <el-button :icon="Refresh" @click="loadAll" :loading="loading">重新整理</el-button>
      </div>

      <div v-if="!myTeam" class="no-team-hint">
        <el-empty description="您尚未被指派到任何團隊" />
      </div>

      <template v-else>
        <el-card class="toolbar-card" v-if="selectedWorkerIds.length">
          <div class="toolbar-row">
            <span>已選取 <strong>{{ selectedWorkerIds.length }}</strong> 位組員</span>
            <div>
              <el-button type="primary" size="small" @click="handleBatchAssign(myTeam.id)" :loading="assigning">加入我的團隊</el-button>
              <el-button size="small" @click="selectedWorkerIds = []">取消</el-button>
            </div>
          </div>
        </el-card>

        <el-row :gutter="16" class="teams-board">
          <!-- 未分配組員 -->
          <el-col :xs="24" :sm="12" :md="8">
            <div
              class="team-column"
              @dragover.prevent
              @dragenter.prevent="dragOverZone = 'unassigned'"
              @dragleave="dragOverZone = null"
              @drop.prevent="handleDrop(null)"
              :class="{ 'drag-over': dragOverZone === 'unassigned' }"
            >
              <div class="column-header unassigned-header">
                <span>未分配組員</span>
                <el-tag type="info" size="small">{{ unassignedWorkers.length }}</el-tag>
              </div>
              <div class="column-body">
                <div v-if="!unassignedWorkers.length" class="column-empty">目前無未分配組員</div>
                <div
                  v-for="worker in unassignedWorkers"
                  :key="worker.id"
                  class="worker-card"
                  draggable="true"
                  @dragstart="handleDragStart(worker)"
                  @dragend="draggedWorker = null"
                  :class="{ 'selected': selectedWorkerIds.includes(worker.id) }"
                  @click="toggleSelect(worker.id)"
                >
                  <el-checkbox
                    :model-value="selectedWorkerIds.includes(worker.id)"
                    @change="toggleSelect(worker.id)"
                    @click.stop
                    size="small"
                  />
                  <div class="worker-info">
                    <span class="worker-name">{{ worker.name }}</span>
                    <span class="worker-num">{{ worker.number }}</span>
                  </div>
                  <el-icon class="drag-handle"><Rank /></el-icon>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 我的 Team -->
          <el-col :xs="24" :sm="12" :md="8">
            <div
              class="team-column my-team"
              @dragover.prevent
              @dragenter.prevent="dragOverZone = myTeam.id"
              @dragleave="dragOverZone = null"
              @drop.prevent="handleDrop(myTeam.id)"
              :class="{ 'drag-over': dragOverZone === myTeam.id }"
            >
              <div class="column-header my-team-header">
                <span>🏠 {{ myTeam.name }}（我的）</span>
                <el-tag type="success" size="small">{{ getWorkersByTeam(myTeam.id).length }}</el-tag>
              </div>
              <div class="column-body">
                <div v-if="!getWorkersByTeam(myTeam.id).length" class="column-empty drag-hint">拖曳組員到此處加入</div>
                <div
                  v-for="worker in getWorkersByTeam(myTeam.id)"
                  :key="worker.id"
                  class="worker-card in-team"
                  draggable="true"
                  @dragstart="handleDragStart(worker)"
                  @dragend="draggedWorker = null"
                >
                  <div class="worker-info">
                    <span class="worker-name">{{ worker.name }}</span>
                    <span class="worker-num">{{ worker.number }}</span>
                  </div>
                  <el-button text type="danger" size="small" :icon="RemoveFilled" @click="assignWorker(worker.id, null)" :loading="worker.assigning" title="移出團隊" />
                </div>
              </div>
            </div>
          </el-col>

          <!-- 其他 Teams（唯讀） -->
          <el-col :xs="24" :sm="24" :md="8">
            <div v-for="team in otherTeams" :key="team.id" class="team-column other-team" style="margin-bottom:16px">
              <div class="column-header other-team-header">
                <span>{{ team.name }}</span>
                <el-tag type="warning" size="small">{{ getWorkersByTeam(team.id).length }}</el-tag>
              </div>
              <div class="column-body readonly">
                <div v-if="!getWorkersByTeam(team.id).length" class="column-empty">無組員</div>
                <div v-for="worker in getWorkersByTeam(team.id)" :key="worker.id" class="worker-card readonly-card">
                  <div class="worker-info">
                    <span class="worker-name">{{ worker.name }}</span>
                    <span class="worker-num">{{ worker.number }}</span>
                  </div>
                </div>
              </div>
            </div>
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
import { Flag, Plus, Edit, Delete, Refresh, User, UserFilled, RemoveFilled, CirclePlusFilled, Rank } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import { getApiUrl } from "@/config/api";

const authStore = useAuthStore();
const isEvelyn = computed(() => authStore.isEvelyn);

const loading = ref(false);
const submitting = ref(false);
const assigning = ref(false);
const teams = ref([]);
const allUsers = ref([]);
const workers = ref([]);
const selectedTeam = ref(null);
const selectedWorkerIds = ref([]);
const draggedWorker = ref(null);
const dragOverZone = ref(null);

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

const otherTeams = computed(() =>
  teams.value.filter((t) => t.id !== myTeam.value?.id)
);

const unassignedUsers = computed(() =>
  allUsers.value.filter((u) => !u.teamId)
);

const unassignedWorkers = computed(() =>
  workers.value.filter((w) => !w.teamId)
);

const getUsersByTeam = (teamId) => allUsers.value.filter((u) => u.teamId === teamId);
const getWorkersByTeam = (teamId) => workers.value.filter((w) => w.teamId === teamId);

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
    const [teamsData, workersData] = await Promise.all([
      teamsRes.json(), workersRes.json(),
    ]);
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

// ── 工讀生指派（拖曳 / 選取）───────────────────────────
const handleDragStart = (worker) => {
  draggedWorker.value = worker;
};

const handleDrop = async (targetTeamId) => {
  dragOverZone.value = null;
  if (!draggedWorker.value) return;
  const worker = draggedWorker.value;
  draggedWorker.value = null;

  if (targetTeamId === null && worker.teamId !== myTeam.value?.id) {
    return ElMessage.warning("只能移出您自己 Team 的組員");
  }
  if (targetTeamId !== null && targetTeamId !== myTeam.value?.id) {
    return ElMessage.warning("只能將組員拖入您自己的 Team");
  }
  if (worker.teamId === targetTeamId) return;

  await assignWorker(worker.id, targetTeamId);
};

const assignWorker = async (workerId, teamId) => {
  const worker = workers.value.find((w) => w.id === workerId);
  if (worker) worker.assigning = true;
  try {
    const res = await fetch(getApiUrl(`/api/workers/${workerId}/assign-team`), {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ teamId }),
    });
    const data = await res.json();
    if (data.success) {
      if (worker) worker.teamId = teamId;
      selectedWorkerIds.value = selectedWorkerIds.value.filter((id) => id !== workerId);
    } else {
      ElMessage.error(data.message || "指派失敗");
    }
  } catch (e) {
    ElMessage.error("指派失敗");
  } finally {
    if (worker) worker.assigning = false;
  }
};

const toggleSelect = (workerId) => {
  const idx = selectedWorkerIds.value.indexOf(workerId);
  if (idx === -1) selectedWorkerIds.value.push(workerId);
  else selectedWorkerIds.value.splice(idx, 1);
};

const handleBatchAssign = async (teamId) => {
  assigning.value = true;
  const ids = [...selectedWorkerIds.value];
  for (const id of ids) await assignWorker(id, teamId);
  assigning.value = false;
  ElMessage.success(`已將 ${ids.length} 位組員加入團隊`);
};

// ── 小組長指派（Evelyn）────────────────────────────────
const selectTeam = (team) => {
  selectedTeam.value = selectedTeam.value?.id === team.id ? null : team;
};

const handleAssignUser = async (user) => {
  if (!selectedTeam.value) return;
  user.assigning = true;
  try {
    const res = await fetch(getApiUrl("/api/teams/assign-user"), {
      method: "PATCH", headers: headers(),
      body: JSON.stringify({ userId: user.id, teamId: selectedTeam.value.id }),
    });
    const data = await res.json();
    if (data.success) { user.teamId = selectedTeam.value.id; ElMessage.success("已加入團隊"); }
    else ElMessage.error(data.message || "指派失敗");
  } catch (e) { ElMessage.error("指派失敗"); }
  finally { user.assigning = false; }
};

const handleUnassignUser = async (user) => {
  user.assigning = true;
  try {
    const res = await fetch(getApiUrl("/api/teams/assign-user"), {
      method: "PATCH", headers: headers(),
      body: JSON.stringify({ userId: user.id, teamId: null }),
    });
    const data = await res.json();
    if (data.success) { user.teamId = null; ElMessage.success("已移出團隊"); }
    else ElMessage.error(data.message || "移除失敗");
  } catch (e) { ElMessage.error("移除失敗"); }
  finally { user.assigning = false; }
};

// ── Team CRUD（Evelyn）────────────────────────────────
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
    if (data.success) {
      ElMessage.success("已刪除");
      if (selectedTeam.value?.id === team.id) selectedTeam.value = null;
      await loadAll();
    } else ElMessage.error(data.message || "刪除失敗");
  } catch (e) { if (e !== "cancel") ElMessage.error(e.message || "刪除失敗"); }
};

const getRoleText = (role) => ({ admin: "管理員", leader: "小組長", reader: "訪客" }[role] || role);
const getRoleTagType = (role) => ({ admin: "danger", leader: "warning", reader: "info" }[role] || "");

onMounted(loadAll);
</script>

<style scoped>
.team-management { padding: 20px; max-width: 1400px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 22px; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0 0 4px; }
.page-description { color: #666; font-size: 14px; margin: 0; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.team-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 8px; border-radius: 8px; cursor: pointer; transition: background 0.2s; margin-bottom: 6px; border: 1px solid transparent; }
.team-item:hover { background: #f5f7fa; }
.team-item.active { background: #ecf5ff; border-color: #409eff; }
.team-item-main { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.team-icon { font-size: 20px; color: #409eff; flex-shrink: 0; }
.team-name { font-weight: 500; font-size: 14px; }
.team-desc { font-size: 12px; color: #999; margin-top: 2px; }
.team-count { font-size: 12px; color: #67c23a; margin-top: 2px; }
.team-actions { flex-shrink: 0; }
.section-title { font-size: 14px; font-weight: 600; color: #555; display: flex; align-items: center; gap: 6px; margin-bottom: 10px; }
.select-hint, .empty-hint { display: flex; justify-content: center; min-height: 200px; align-items: center; }
.toolbar-card { margin-bottom: 16px; }
.toolbar-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.teams-board { margin-top: 0; }
.team-column { border: 2px dashed #dcdfe6; border-radius: 12px; min-height: 400px; transition: all 0.2s; background: #fafafa; display: flex; flex-direction: column; }
.team-column.drag-over { border-color: #409eff; background: #ecf5ff; box-shadow: 0 0 0 3px rgba(64,158,255,0.15); }
.team-column.my-team { border-color: #67c23a; background: #f0f9eb; }
.team-column.my-team.drag-over { background: #d4efde; box-shadow: 0 0 0 3px rgba(103,194,58,0.2); }
.team-column.other-team { border-style: solid; border-color: #e4e7ed; opacity: 0.85; }
.column-header { padding: 12px 14px; font-weight: 600; font-size: 14px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; align-items: center; }
.unassigned-header { background: #f0f2f5; color: #606266; }
.my-team-header { background: #d4efde; color: #3a8a4a; }
.other-team-header { background: #fdf6ec; color: #b8741a; }
.column-body { flex: 1; padding: 8px; overflow-y: auto; max-height: 60vh; }
.column-body.readonly { pointer-events: none; }
.column-empty { color: #bbb; text-align: center; padding: 40px 0; font-size: 13px; }
.column-empty.drag-hint { color: #a0cfff; }
.worker-card { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #fff; border-radius: 8px; border: 1px solid #e4e7ed; margin-bottom: 6px; cursor: grab; transition: all 0.15s; user-select: none; }
.worker-card:active { cursor: grabbing; }
.worker-card:hover { border-color: #409eff; box-shadow: 0 2px 8px rgba(64,158,255,0.15); }
.worker-card.selected { border-color: #409eff; background: #ecf5ff; }
.worker-card.in-team { border-color: #b3e19d; }
.worker-card.readonly-card { cursor: default; }
.worker-card.readonly-card:hover { border-color: #e4e7ed; box-shadow: none; }
.worker-info { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0; }
.worker-name { font-weight: 500; font-size: 14px; }
.worker-num { font-size: 12px; color: #999; }
.drag-handle { color: #bbb; font-size: 16px; flex-shrink: 0; }
.no-team-hint { display: flex; justify-content: center; padding: 60px 0; }
@media (max-width: 768px) { .team-management { padding: 12px; } .page-header { flex-direction: column; } .column-body { max-height: 300px; } }
</style>
