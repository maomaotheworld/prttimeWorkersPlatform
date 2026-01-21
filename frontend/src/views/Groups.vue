<template>
  <div class="groups-container">
    <div class="page-header">
      <h1 class="page-title">çµ„åˆ¥ç®¡ç?</h1>
      <el-button type="primary" @click="showAddDialog" :icon="Plus">
        ?°å?çµ„åˆ¥
      </el-button>
    </div>

    <el-card class="table-card">
      <el-table v-loading="loading" :data="groups" stripe>
        <el-table-column prop="name" label="çµ„åˆ¥?ç¨±" min-width="150" />
        <el-table-column prop="description" label="?è¿°" min-width="200" />
        <el-table-column label="äººæ•¸" width="100">
          <template #default="{ row }">
            {{ getWorkerCount(row.id) }}
          </template>
        </el-table-column>
        <el-table-column label="?ä?" width="160">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showEditDialog(row)">
              ç·¨è¼¯
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              ?ªé™¤
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ?°å?/ç·¨è¼¯çµ„åˆ¥å°è©±æ¡?-->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? 'ç·¨è¼¯çµ„åˆ¥' : '?°å?çµ„åˆ¥'"
      :width="isMobile ? '95%' : '500px'"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="çµ„åˆ¥?ç¨±" prop="name">
          <el-input v-model="form.name" placeholder="è«‹è¼¸?¥ç??¥å?ç¨? />
        </el-form-item>
        <el-form-item label="?è¿°">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="è«‹è¼¸?¥ç??¥æ?è¿?
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">?–æ?</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? "?´æ–°" : "?°å?" }}
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
  name: [{ required: true, message: "è«‹è¼¸?¥ç??¥å?ç¨?, trigger: "blur" }],
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
      ElMessage.success("çµ„åˆ¥?´æ–°?å?");
    } else {
      await groupsStore.addGroup(form.value);
      ElMessage.success("çµ„åˆ¥?°å??å?");
    }

    dialogVisible.value = false;
  } catch (error) {
    // ?¯èª¤?•ç?
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (group) => {
  const workerCount = getWorkerCount(group.id);
  if (workerCount > 0) {
    ElMessage.warning(`?¡æ??ªé™¤ï¼Œæ­¤çµ„åˆ¥?„æ? ${workerCount} ?å·¥è®€?Ÿ`);
    return;
  }

  try {
    await ElMessageBox.confirm(
      `ç¢ºå?è¦åˆª?¤ç???"${group.name}" ?Žï?`,
      "ç¢ºè??ªé™¤",
      { type: "warning" },
    );

    await groupsStore.deleteGroup(group.id);
    ElMessage.success("çµ„åˆ¥?ªé™¤?å?");
  } catch (error) {
    // ?¯èª¤?•ç?
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
