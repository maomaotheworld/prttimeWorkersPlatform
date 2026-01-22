<template>
  <div class="workers-container">
    <div class="page-header">
      <h1 class="page-title">工讀生管理</h1>
      <el-button type="primary" @click="showAddDialog" :icon="Plus">
        新增工讀生
      </el-button>
    </div>

    <el-card class="table-card">
      <el-table :data="workers" style="width: 100%" stripe>
        <el-table-column prop="workerNumber" label="工號" width="120" />
        <el-table-column prop="name" label="姓名" width="150" />
        <el-table-column prop="phoneNumber" label="電話" width="150" />
        <el-table-column prop="email" label="電子郵件" width="200" />
        <el-table-column prop="department" label="部門" width="120" />
        <el-table-column prop="position" label="職位" width="120" />
        <el-table-column prop="hourlyWage" label="時薪" width="100">
          <template #default="{ row }"> ${{ row.hourlyWage }} </template>
        </el-table-column>
        <el-table-column prop="status" label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === "active" ? "在職" : "離職" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editWorker(row)">
              編輯
            </el-button>
            <el-button type="danger" size="small" @click="deleteWorker(row)">
              刪除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/編輯對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '編輯工讀生' : '新增工讀生'"
      width="600px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="工號" prop="workerNumber">
          <el-input v-model="form.workerNumber" placeholder="請輸入工號" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="請輸入姓名" />
        </el-form-item>
        <el-form-item label="電話" prop="phoneNumber">
          <el-input v-model="form.phoneNumber" placeholder="請輸入電話" />
        </el-form-item>
        <el-form-item label="電子郵件" prop="email">
          <el-input v-model="form.email" placeholder="請輸入電子郵件" />
        </el-form-item>
        <el-form-item label="部門" prop="department">
          <el-input v-model="form.department" placeholder="請輸入部門" />
        </el-form-item>
        <el-form-item label="職位" prop="position">
          <el-input v-model="form.position" placeholder="請輸入職位" />
        </el-form-item>
        <el-form-item label="時薪" prop="hourlyWage">
          <el-input-number v-model="form.hourlyWage" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">確認</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { useWorkersStore } from "@/stores/workers";

// 使用 store
const workersStore = useWorkersStore();

// 響應式數據
const workers = ref([]);
const dialogVisible = ref(false);
const isEditing = ref(false);
const formRef = ref();

const form = ref({
  workerNumber: "",
  name: "",
  phoneNumber: "",
  email: "",
  department: "",
  position: "",
  hourlyWage: 0,
});

const rules = {
  workerNumber: [{ required: true, message: "請輸入工號", trigger: "blur" }],
  name: [{ required: true, message: "請輸入姓名", trigger: "blur" }],
  phoneNumber: [{ required: true, message: "請輸入電話", trigger: "blur" }],
  email: [{ required: true, message: "請輸入電子郵件", trigger: "blur" }],
  hourlyWage: [{ required: true, message: "請輸入時薪", trigger: "blur" }],
};

// 方法
const fetchWorkers = async () => {
  try {
    await workersStore.fetchWorkers();
    workers.value = workersStore.workers;
  } catch (error) {
    ElMessage.error("獲取工讀生列表失敗");
  }
};

const showAddDialog = () => {
  isEditing.value = false;
  dialogVisible.value = true;
};

const editWorker = (worker) => {
  isEditing.value = true;
  form.value = { ...worker };
  dialogVisible.value = true;
};

const deleteWorker = async (worker) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除工讀生 "${worker.name}" 嗎？`,
      "確認刪除",
      { type: "warning" },
    );

    await workersStore.deleteWorker(worker.id);
    ElMessage.success("刪除成功");
    await fetchWorkers();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("刪除失敗");
    }
  }
};

const submitForm = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    if (isEditing.value) {
      await workersStore.updateWorker(form.value);
      ElMessage.success("更新成功");
    } else {
      await workersStore.addWorker(form.value);
      ElMessage.success("新增成功");
    }

    dialogVisible.value = false;
    await fetchWorkers();
  } catch (error) {
    ElMessage.error("操作失敗");
  }
};

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  form.value = {
    workerNumber: "",
    name: "",
    phoneNumber: "",
    email: "",
    department: "",
    position: "",
    hourlyWage: 0,
  };
};

// 初始化
onMounted(() => {
  fetchWorkers();
});
</script>

<style scoped>
.workers-container {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.table-card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
