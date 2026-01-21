<template>
  <div class="attendance-container">
    <div class="page-header">
      <h1 class="page-title">?ìÂç°Á≥ªÁµ±</h1>
      <div class="current-time">
        <el-icon><Clock /></el-icon>
        {{ currentTime }}
      </div>
    </div>

    <!-- ?ÜÁ?ÁØ©ÈÅ∏?Ä??-->
    <el-card class="filter-card mb-20">
      <el-row :gutter="16" class="filter-row">
        <el-col :xs="24" :sm="8">
          <el-form-item label="?ÜÁ??πÂ?">
            <el-radio-group v-model="groupBy" @change="handleGroupChange">
              <el-radio-button label="all">?®ÈÉ®</el-radio-button>
              <el-radio-button label="floor">Ê®ìÂ±§</el-radio-button>
              <el-radio-button label="group">ÁµÑÂà•</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="8" v-if="groupBy === 'floor'">
          <el-form-item label="?∏Ê?Ê®ìÂ±§">
            <el-select
              v-model="selectedFloor"
              @change="filterWorkers"
              clearable
              placeholder="?∏Ê?Ê®ìÂ±§"
            >
              <el-option
                v-for="floor in availableFloors"
                :key="floor"
                :label="`${floor}Ê®ì`"
                :value="floor"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :xs="24" :sm="8" v-if="groupBy === 'group'">
          <el-form-item label="?∏Ê?ÁµÑÂà•">
            <el-select
              v-model="selectedGroup"
              @change="filterWorkers"
              clearable
              placeholder="?∏Ê?ÁµÑÂà•"
            >
              <el-option
                v-for="group in groups"
                :key="group.id"
                :label="group.name"
                :value="group.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-card>

    <!-- Â∑•Ë??üÊ??°Â?Ë°?-->
    <el-card class="attendance-list-card">
      <template #header>
        <div class="card-header">
          <span>Â∑•Ë??üÊ??°Â?Ë°?({{ filteredWorkers.length }}‰∫?</span>
          <div class="header-actions">
            <el-button
              type="primary"
              size="small"
              @click="refreshData"
              :loading="loading"
            >
              <el-icon><Refresh /></el-icon>
              ?∑Êñ∞
            </el-button>
          </div>
        </div>
      </template>

      <div class="table-container">
        <el-table
          v-loading="loading"
          :data="filteredWorkers"
          stripe
          class="attendance-table"
          :height="tableHeight"
        >
          <el-table-column prop="number" label="Á∑®Ë?" width="80" sortable />

          <el-table-column prop="name" label="ÂßìÂ?" min-width="100" />

          <el-table-column prop="floor" label="Ê®ìÂ±§" width="70">
            <template #default="{ row }"> {{ row.floor || "-" }}Ê®?</template>
          </el-table-column>

          <el-table-column prop="groupId" label="ÁµÑÂà•" min-width="90">
            <template #default="{ row }">
              <el-tag
                v-if="getGroupName(row.groupId)"
                size="small"
                :style="{
                  backgroundColor: getGroupColor(row.groupId),
                  border: 'none',
                  color: getTextColor(getGroupColor(row.groupId)),
                  fontWeight: '500',
                }"
              >
                {{ getGroupName(row.groupId) }}
              </el-tag>
              <span v-else class="info-text">?™Â?Áµ?/span>
            </template>
          </el-table-column>

          <el-table-column label="?ìÂç°?Ä?? min-width="140">
            <template #default="{ row }">
              <div class="attendance-status">
                <div v-if="row.todayAttendance?.clockIn" class="status-item">
                  <el-tag type="success" size="small">
                    ‰∏äÁè≠ {{ formatTime(row.todayAttendance.clockIn) }}
                  </el-tag>
                </div>
                <div v-if="row.todayAttendance?.clockOut" class="status-item">
                  <el-tag type="warning" size="small">
                    ‰∏ãÁè≠ {{ formatTime(row.todayAttendance.clockOut) }}
                  </el-tag>
                </div>
                <div v-if="!row.todayAttendance?.clockIn" class="status-item">
                  <el-tag type="info" size="small">?™Ê???/el-tag>
                </div>
                <div
                  v-else-if="
                    row.todayAttendance?.clockIn &&
                    !row.todayAttendance?.clockOut
                  "
                  class="status-item"
                >
                  <el-tag type="primary" size="small">Â∑•‰?‰∏?/el-tag>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            label="?ç‰?"
            :width="isMobile ? 80 : 200"
            fixed="right"
          >
            <template #default="{ row }">
              <div class="action-buttons">
                <!-- ‰∏äÁè≠?ìÂç°?âÈ? -->
                <el-button
                  v-if="!row.todayAttendance?.clockIn"
                  type="success"
                  size="small"
                  @click="handleQuickClock(row, 'in')"
                  :loading="row.clocking"
                >
                  ‰∏äÁè≠?ìÂç°
                </el-button>

                <!-- ‰∏ãÁè≠?ìÂç°?âÈ? -->
                <el-button
                  v-else-if="!row.todayAttendance?.clockOut"
                  type="warning"
                  size="small"
                  @click="handleQuickClock(row, 'out')"
                  :loading="row.clocking"
                >
                  ‰∏ãÁè≠?ìÂç°
                </el-button>

                <!-- Á∑®ËºØ?ÇÈ??âÈ? -->
                <el-button
                  type="primary"
                  size="small"
                  @click="showEditTimeDialog(row)"
                  plain
                >
                  Á∑®ËºØ?ÇÈ?
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- Á∑®ËºØ?ìÂç°?ÇÈ?Â∞çË©±Ê°?-->
    <el-dialog
      v-model="editTimeDialogVisible"
      title="Á∑®ËºØ?ìÂç°?ÇÈ?"
      :width="isMobile ? '95%' : '500px'"
      center
    >
      <el-form :model="timeEditForm" label-width="100px">
        <el-form-item label="Â∑•Ë???>
          <el-input
            :value="`${timeEditForm.workerNumber} - ${timeEditForm.workerName}`"
            readonly
          />
        </el-form-item>

        <el-form-item label="‰∏äÁè≠?ÇÈ?">
          <el-date-picker
            v-model="timeEditForm.clockIn"
            type="datetime"
            placeholder="?∏Ê?‰∏äÁè≠?ÇÈ?"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="‰∏ãÁè≠?ÇÈ?">
          <el-date-picker
            v-model="timeEditForm.clockOut"
            type="datetime"
            placeholder="?∏Ê?‰∏ãÁè≠?ÇÈ?"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="?ôË®ª">
          <el-input
            v-model="timeEditForm.note"
            type="textarea"
            :rows="3"
            placeholder="?ÇÈ?Ë™øÊï¥?üÂ??ñÂ?Ë®?
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editTimeDialogVisible = false">?ñÊ?</el-button>
          <el-button
            type="primary"
            @click="handleTimeEdit"
            :loading="submitting"
          >
            Á¢∫Â?‰øÆÊîπ
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import moment from "moment";
import { Clock, Refresh } from "@element-plus/icons-vue";
import { useWorkersStore } from "../stores/workers";
import { useGroupsStore } from "../stores/groups";
import { useAuthStore } from "../stores/auth";

const workersStore = useWorkersStore();
const groupsStore = useGroupsStore();
const authStore = useAuthStore();

// ?øÊ?ÂºèÊï∏??
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value <= 768);
const currentTime = ref(moment().format("YYYY/MM/DD HH:mm:ss"));

// Â∑•Ë??üÂ?ÁµÑÂà•?∏Ê?
const workers = computed(() => workersStore.workers);
const groups = computed(() => groupsStore.groups);

// ?ÜÁ??∏È?
const groupBy = ref("all");
const selectedFloor = ref("");
const selectedGroup = ref("");

// ÁØ©ÈÅ∏ÂæåÁ?Â∑•Ë??üÊ???
const filteredWorkers = ref([]);

// ?ØÁî®Ê®ìÂ±§Ê∏ÖÂñÆ
const availableFloors = computed(() => {
  const floors = [
    ...new Set(workers.value.map((w) => w.floor).filter((f) => f)),
  ];
  return floors.sort((a, b) => a - b);
});

// ËºâÂÖ•?Ä??
const loading = ref(false);
const submitting = ref(false);

// Á∑®ËºØ?ÇÈ?Â∞çË©±Ê°?
const editTimeDialogVisible = ref(false);
const timeEditForm = ref({
  workerId: "",
  workerNumber: "",
  workerName: "",
  clockIn: "",
  clockOut: "",
  note: "",
});

// Ë°®Ê†ºÈ´òÂ∫¶
const tableHeight = computed(() => {
  return isMobile.value ? "calc(100vh - 350px)" : "calc(100vh - 300px)";
});

// ?ÇÈ?ÂÆöÊ???
let timeInterval = null;

// È¶¨Âç°ÈæçÈ??≤È?ÁΩÆÔ?ÂæûWorkers.vueË§áË£ΩÔº?
const macaronColors = [
  "#FFB6C1",
  "#FFCCCB",
  "#FFE4E1",
  "#FFEFD5",
  "#FAFAD2",
  "#E6E6FA",
  "#F0E6FF",
  "#E0FFFF",
  "#F0FFFF",
  "#F5FFFA",
  "#FFF8DC",
  "#FFFACD",
  "#FFFAF0",
  "#FDF5E6",
  "#FAF0E6",
  "#FFE4B5",
  "#FFDAB9",
  "#FFE4B5",
  "#DDA0DD",
  "#D8BFD8",
  "#EE82EE",
  "#DA70D6",
  "#FF69B4",
  "#FFB6C1",
  "#FFA07A",
  "#F0E6FF",
  "#E6E6FA",
  "#D8BFD8",
  "#DDA0DD",
  "#EE82EE",
];

// Â∑•ÂÖ∑?ΩÊï∏
const formatTime = (timeString) => {
  return moment(timeString).format("HH:mm");
};

const updateCurrentTime = () => {
  currentTime.value = moment().format("YYYY/MM/DD HH:mm:ss");
};

const getGroupName = (groupId) => {
  if (!groupId) return "";
  const group = groups.value.find((g) => g.id === groupId);
  return group ? group.name : "";
};

const getGroupColor = (groupId) => {
  if (!groupId) return macaronColors[0];
  const groupIndex = groups.value.findIndex((g) => g.id === groupId);
  return macaronColors[groupIndex % macaronColors.length];
};

const getTextColor = (backgroundColor) => {
  const color = backgroundColor.replace("#", "");
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#333333" : "#ffffff";
};

// ?ÜÁ??ïÁ?
const handleGroupChange = () => {
  selectedFloor.value = "";
  selectedGroup.value = "";
  filterWorkers();
};

const filterWorkers = () => {
  let filtered = [...workers.value];

  if (groupBy.value === "floor" && selectedFloor.value) {
    filtered = filtered.filter((w) => w.floor === selectedFloor.value);
  } else if (groupBy.value === "group" && selectedGroup.value) {
    filtered = filtered.filter((w) => w.groupId === selectedGroup.value);
  }

  // ?∫Ê??ãÂ∑•ËÆÄ?üÊ∑ª?†‰??•Âá∫?§Ë???
  filteredWorkers.value = filtered.map((worker) => ({
    ...worker,
    todayAttendance: worker.todayAttendance || null,
    clocking: false,
  }));
};

// Âø´ÈÄüÊ??°Ë???
const handleQuickClock = async (worker, type) => {
  try {
    // Ë®≠Â?Ë©≤Â∑•ËÆÄ?üÁ?ËºâÂÖ•?Ä??
    worker.clocking = true;

    const endpoint =
      type === "in" ? "/time-records/clock-in" : "/time-records/clock-out";
    const action = type === "in" ? "‰∏äÁè≠" : "‰∏ãÁè≠";

    const response = await fetch(`http://localhost:3005/api${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ workerId: worker.id }),
    });

    const data = await response.json();

    if (data.success) {
      ElMessage.success(`${worker.name} ${action}?ìÂç°?êÂ?`);
      // ?çÊñ∞ËºâÂÖ•?∏Ê?
      await loadTodayAttendance();
    } else {
      throw new Error(data.message || "?ìÂç°Â§±Ê?");
    }
  } catch (error) {
    console.error(`${worker.name} ?ìÂç°Â§±Ê?:`, error);
    ElMessage.error(`${worker.name} ?ìÂç°Â§±Ê?`);
  } finally {
    worker.clocking = false;
  }
};

// È°ØÁ§∫Á∑®ËºØ?ÇÈ?Â∞çË©±Ê°?
const showEditTimeDialog = (worker) => {
  timeEditForm.value = {
    workerId: worker.id,
    workerNumber: worker.number,
    workerName: worker.name,
    clockIn: worker.todayAttendance?.clockIn || "",
    clockOut: worker.todayAttendance?.clockOut || "",
    note: "",
  };
  editTimeDialogVisible.value = true;
};

// ?ïÁ??ÇÈ?Á∑®ËºØ
const handleTimeEdit = async () => {
  try {
    submitting.value = true;

    const token = authStore.token;
    const response = await fetch("/api/time-records/edit-time", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        workerId: timeEditForm.value.workerId,
        clockIn: timeEditForm.value.clockIn,
        clockOut: timeEditForm.value.clockOut,
        note: timeEditForm.value.note,
        date: moment().format("YYYY-MM-DD"),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "?ÇÈ?Á∑®ËºØÂ§±Ê?");
    }

    ElMessage.success("?ìÂç°?ÇÈ?‰øÆÊîπ?êÂ?");
    editTimeDialogVisible.value = false;

    // ?çÊñ∞ËºâÂÖ•?∏Ê?
    await loadTodayAttendance();
  } catch (error) {
    console.error("?ÇÈ?Á∑®ËºØÂ§±Ê?:", error);
    ElMessage.error(error.message || "?ÇÈ?Á∑®ËºØÂ§±Ê?");
  } finally {
    submitting.value = false;
  }
};

// ËºâÂÖ•‰ªäÊó•?∫Âã§Ë®òÈ?
const loadTodayAttendance = async () => {
  try {
    const today = moment().format("YYYY-MM-DD");
    const token = authStore.token;
    const response = await fetch(`/api/time-records?date=${today}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "ËºâÂÖ•?∫Âã§Ë®òÈ?Â§±Ê?");
    }

    // ÂæåÁ´ØËøîÂ??ºÂ???{ success: true, data: [...], message: "..." }
    const records = result.data || [];
    
    // ?∫Ê??ãÂ∑•ËÆÄ?üË®≠ÂÆö‰??•Âá∫?§Ë???
    workers.value.forEach((worker) => {
      const attendance = records.find(
        (record) => record.workerId === worker.id,
      );
      worker.todayAttendance = attendance || null;
    });

    // ?çÊñ∞ÁØ©ÈÅ∏
    filterWorkers();
  } catch (error) {
    console.error("ËºâÂÖ•‰ªäÊó•?∫Âã§Ë®òÈ?Â§±Ê?:", error);
  }
};

// ?∑Êñ∞?∏Ê?
const refreshData = async () => {
  loading.value = true;
  try {
    await Promise.all([
      workersStore.fetchWorkers(),
      groupsStore.fetchGroups(),
      loadTodayAttendance(),
    ]);
  } catch (error) {
    console.error("?∑Êñ∞?∏Ê?Â§±Ê?:", error);
  } finally {
    loading.value = false;
  }
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener("resize", handleResize);

  // ?üÂ??ÇÈ?ÂÆöÊ???
  timeInterval = setInterval(updateCurrentTime, 1000);

  // ËºâÂÖ•?ùÂ??∏Ê?
  refreshData();
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (timeInterval) {
    clearInterval(timeInterval);
  }
});
</script>

<style scoped>
.attendance-container {
  padding: 20px;
  height: 100%;
  overflow: auto;
}

/* ?™Â?Áæ©Êªæ?ïÊ?Ê®?? */
.attendance-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.attendance-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.attendance-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.attendance-container::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  margin: 0;
  color: #303133;
}

.current-time {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.mb-20 {
  margin-bottom: 20px;
}

.filter-card .el-form-item {
  margin-bottom: 0;
}

.filter-row .el-col {
  margin-bottom: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.table-container {
  overflow-x: auto;
}

.attendance-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-item {
  display: flex;
  justify-content: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  margin: 0;
}

.info-text {
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* ?ãÊ?Á´ØÈÅ©??*/
@media (max-width: 768px) {
  .attendance-container {
    padding: 12px;
    padding-bottom: 60px; /* ?∫Ê?Ê©üÂ??®Â??™Á??∫Á©∫??*/
    height: 100%;
    overflow: auto;
  }

  .attendance-container::-webkit-scrollbar {
    width: 4px;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .current-time {
    font-size: 16px;
    justify-content: center;
  }

  .filter-row .el-col {
    margin-bottom: 16px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }

  .action-buttons .el-button {
    font-size: 11px;
    padding: 2px 6px;
    height: 24px;
    min-height: 24px;
  }

  .attendance-table .el-table__cell {
    padding: 8px 4px;
  }

  .attendance-status {
    gap: 2px;
  }
}
</style>
