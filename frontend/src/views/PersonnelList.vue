<template>
  <div class="personnel-list-page">
    <!-- 頁面頭部 -->

    <!-- 主要內容 -->
    <div class="page-content">
      <div class="personnel-list">
        <h1>人員列表</h1>

        <!-- 搜尋和篩選區域 -->
        <div class="filter-section">
          <div class="filter-row">
            <div class="search-box">
              <el-input
                v-model="searchName"
                placeholder="搜尋員工姓名"
                @input="handleSearch"
                clearable
                style="width: 300px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>

          <div class="filter-row">
            <div class="filter-item">
              <label>樓層篩選：</label>
              <el-select
                v-model="filterFloor"
                placeholder="選擇樓層"
                @change="applyFilters"
                clearable
                style="width: 200px"
              >
                <el-option
                  v-for="floor in availableFloors"
                  :key="floor"
                  :label="floor"
                  :value="floor"
                />
              </el-select>
            </div>

            <div class="filter-item">
              <label>組別篩選：</label>
              <el-select
                v-model="filterGroup"
                placeholder="選擇組別"
                @change="applyFilters"
                clearable
                style="width: 200px"
              >
                <el-option
                  v-for="group in groups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                />
              </el-select>
            </div>
          </div>
        </div>

        <!-- 人員表格 -->
        <div class="table-section">
          <el-table
            :data="filteredWorkers"
            stripe
            style="width: 100%"
            height="500"
            empty-text="暫無人員資料"
            v-loading="loading"
          >
            <el-table-column prop="number" label="編號" width="80" sortable />

            <el-table-column prop="name" label="姓名" width="120" sortable />

            <el-table-column prop="groupId" label="組別" width="150" sortable>
              <template #default="scope">
                <el-tag 
                  v-if="groupMapping[scope.row.groupId]"
                  size="small"
                  :style="getGroupTagStyle(groupMapping[scope.row.groupId])"
                >
                  {{ groupMapping[scope.row.groupId] }}
                </el-tag>
                <el-tag v-else size="small" type="info">
                  未分組
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="floor" label="樓層" width="100" sortable>
              <template #default="scope">
                <el-tag type="primary" size="small">
                  {{ scope.row.floor || "未設定" }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="job" label="工作" width="150" sortable>
              <template #default="scope">
                <el-tag type="success" size="small" v-if="scope.row.job">
                  {{ scope.row.job }}
                </el-tag>
                <el-tag type="info" size="small" v-else>
                  未設定
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from "vue";
import { useWorkersStore } from "../stores/workers";
import { useGroupsStore } from "../stores/groups";
import { Management, User, Search } from "@element-plus/icons-vue";
import { getApiUrl } from "../config/api";

export default defineComponent({
  name: "PersonnelList",
  components: {
    Management,
    User,
    Search,
  },
  setup() {
    const workersStore = useWorkersStore();
    const groupsStore = useGroupsStore();

    // 響應式數據
    const searchName = ref("");
    const filterFloor = ref("");
    const filterGroup = ref("");
    const loading = ref(false);
    const groupMapping = ref({});
    const groupMapping = ref({});

    // 計算屬性
    const workers = computed(() => workersStore.workers);
    const groups = computed(() => groupsStore.groups);

    // 可用樓層列表
    const availableFloors = computed(() => {
      const floors = [
        ...new Set(workers.value.map((w) => w.floor).filter(Boolean)),
      ];
      return floors.sort();
    });

    // 篩選後的工讀生列表
    const filteredWorkers = computed(() => {
      let result = workers.value.map((worker) => ({
        ...worker,
        groupName: groupMapping.value[worker.groupId] || worker.group || "",
      }));

      // 姓名搜尋
      if (searchName.value.trim()) {
        result = result.filter((worker) =>
          worker.name
            .toLowerCase()
            .includes(searchName.value.trim().toLowerCase()),
        );
      }

      // 樓層篩選
      if (filterFloor.value) {
        result = result.filter((worker) => worker.floor === filterFloor.value);
      }

      // 組別篩選
      if (filterGroup.value) {
        result = result.filter(
          (worker) => worker.groupId === filterGroup.value,
        );
      }

      return result;
    });

    // 方法
    const loadData = async () => {
      loading.value = true;
      try {
        // 同時載入工讀生數據和組別映射
        const [_, groupMappingData] = await Promise.all([
          workersStore.loadWorkers(),
          getGroupIdToNameMapping(),
        ]);
        
        // 更新組別映射
        groupMapping.value = groupMappingData;
        
        // 也載入組別數據用於篩選器
        await groupsStore.loadGroups();
      } catch (error) {
        console.error("載入數據時發生錯誤:", error);
      } finally {
        loading.value = false;
      }
    };

    // 獲取group ID到名稱的映射
    const getGroupIdToNameMapping = async () => {
      try {
        const response = await fetch(getApiUrl("/api/groups"), {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("獲取組別列表失敗");
        }

        const result = await response.json();
        const mapping = {};

        if (result.success && result.data) {
          result.data.forEach((group) => {
            mapping[group.id] = group.name;
          });
        }

        return mapping;
      } catch (error) {
        console.error("獲取組別映射失敗:", error);
        return {};
      }
    };

    const handleSearch = () => {
      // 搜尋會觸發計算屬性自動更新
    };

    const applyFilters = () => {
      // 篩選會觸發計算屬性自動更新
    };

    // 馬卡龍色系組別顏色 - 高對比度版本
    const macaronColors = [
      { bg: "#FFE1E6", text: "#B91C7C" }, // 櫻花粉配深紫紅
      { bg: "#E6F7ED", text: "#059669" }, // 薄荷綠配深綠
      { bg: "#E1F0FF", text: "#1E40AF" }, // 天空藍配深藍
      { bg: "#FEF3C7", text: "#D97706" }, // 檸檬黃配橙
      { bg: "#FFE4D1", text: "#EA580C" }, // 蜜桃橙配深橙
      { bg: "#F3E8FF", text: "#7C3AED" }, // 薰衣草紫配深紫
      { bg: "#ECFDF5", text: "#047857" }, // 青草綠配深綠
      { bg: "#FDEAEF", text: "#BE185D" }, // 玫瑰粉配深紫紅
      { bg: "#E0F2FE", text: "#0369A1" }, // 青藍色配深青
      { bg: "#F7FEE7", text: "#65A30D" }, // 淺綠黃配深綠
    ];

    const getGroupTagStyle = (groupName) => {
      if (!groupName)
        return {
          backgroundColor: macaronColors[0].bg,
          color: macaronColors[0].text,
        };

      // 使用組別名稱生成一致的顏色索引
      let hash = 0;
      for (let i = 0; i < groupName.length; i++) {
        hash = groupName.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % macaronColors.length;
      const colors = macaronColors[index];

      return {
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.text}20`,
        fontWeight: "500",
      };
    };

    // 生命周期
    onMounted(() => {
      loadData();
    });

    return {
      // 響應式數據
      searchName,
      filterFloor,
      filterGroup,
      loading,
      groupMapping,

      // 計算屬性
      workers,
      groups,
      availableFloors,
      filteredWorkers,

      // 方法
      handleSearch,
      applyFilters,
      getGroupTagStyle,
    };
  },
});
</script>

<style scoped>
.personnel-list-page {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: bold;
}

.header-actions {
  display: flex;
  align-items: center;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.personnel-list {
  padding: 20px 0;
}

h1 {
  margin-bottom: 30px;
  color: #2c3e50;
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
}

.filter-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 15px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.search-box {
  flex: 1;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-item label {
  font-weight: 500;
  color: #666;
  white-space: nowrap;
}

.table-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .page-content {
    padding: 0 15px;
  }

  .header-content {
    padding: 0 15px;
  }

  .logo {
    font-size: 1rem;
    gap: 8px;
  }

  .personnel-list {
    padding: 15px 0;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .search-box {
    width: 100%;
  }

  .filter-item {
    width: 100%;
  }

  .filter-item label {
    min-width: 80px;
  }

  h1 {
    font-size: 1.5rem;
  }

  :deep(.el-table) {
    font-size: 14px;
  }

  :deep(.el-table th),
  :deep(.el-table td) {
    padding: 8px 0;
  }
}

/* 確保表格在小螢幕上可以橫向滾動 */
@media (max-width: 600px) {
  .table-section {
    overflow-x: auto;
  }

  :deep(.el-table) {
    min-width: 600px;
  }

  .logo span {
    display: none;
  }
}
</style>
