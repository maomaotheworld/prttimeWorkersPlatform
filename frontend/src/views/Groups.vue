<template>
  <div class="groups-container">
    <div class="page-header">
      <h1 class="page-title">組別管理</h1>
      <el-button type="primary" @click="showAddDialog" :icon="Plus">
        新增組別
      </el-button>
    </div>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="groups" stripe>
        <el-table-column prop="name" label="組別?�稱" min-width="150" />
        <el-table-column prop="description" label="?�述" min-width="200" />
        <el-table-column label="人數" width="100">
          <template #default="{ row }">
            {{ getWorkerCount(row.id) }}
          </template>
        </el-table-column>
        <el-table-column label="?��?" width="160">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showEditDialog(row)">
              編輯
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              ?�除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ?��?/編輯組別對話�?-->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '編輯組別' : '?��?組別'"
      :width="isMobile ? '95%' : '500px'"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="組別名稱" prop="name">
          <el-input v-model="form.name" placeholder="請輸入組別名稱" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="請輸入組別描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? "更新" : "新增" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { useGroupsStore } from "../stores/groups";
import { useWorkersStore } from "../stores/workers";

const groupsStore = useGroupsStore();
const workersStore = useWorkersStore();

const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value <= 768);

const groups = computed(() => groupsStore.groups);
const workers = computed(() => workersStore.workers);
const loading = computed(() => groupsStore.loading);

const dialogVisible = ref(false);
const isEdit = ref(false);
const submitting = ref(false);

const form = ref({
  name: "",
  description: "",
});

const formRules = {
  name: [{ required: true, message: "請輸入組別名稱", trigger: "blur" }],
};

const formRef = ref();

const getWorkerCount = (groupId) => {
  return workers.value.filter((w) => w.groupId === groupId).length;
};

const showAddDialog = () => {
  isEdit.value = false;
  form.value = { name: "", description: "" };
  dialogVisible.value = true;
};

const showEditDialog = (group) => {
  isEdit.value = true;
  form.value = { ...group };
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  try {
    await formRef.value.validate();
    submitting.value = true;

    if (isEdit.value) {
      await groupsStore.updateGroup(form.value.id, form.value);
      ElMessage.success("組別更新成功");
    } else {
      await groupsStore.addGroup(form.value);
      ElMessage.success("組別新增成功");
    }

    dialogVisible.value = false;
  } catch (error) {
    // 錯誤處理
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (group) => {
  const workerCount = getWorkerCount(group.id);
  if (workerCount > 0) {
    ElMessage.warning(`無法刪除，此組別還有 ${workerCount} 名工讀生`);
    return;
  }

  try {
    await ElMessageBox.confirm(
      `確定要刪除組別"${group.name}" 嗎？`,
      "確認刪除",
      { type: "warning" },
    );

    await groupsStore.deleteGroup(group.id);
    ElMessage.success("組別刪除成功");
  } catch (error) {
    // 錯誤處理
  }
};

onMounted(() => {
  groupsStore.fetchGroups();
  workersStore.fetchWorkers();
});
</script>

<style scoped>
.groups-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .groups-container {
    padding: 12px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
