<template>
  <div class="personnel-list-page">
    <!-- 頁面頭部 -->

    <!-- 主要內容 -->
    <div class="page-content">
      <div class="personnel-list">
        <h1>人員列表(閱覽模式)</h1>

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

            <el-table-column prop="name" label="姓名" min-width="120" sortable />

            <el-table-column prop="groupId" label="組別" min-width="150" sortable>
              <template #default="scope">
                <el-tag
                  v-if="groupMapping[scope.row.groupId]"
                  size="small"
                  :style="getGroupTagStyle(groupMapping[scope.row.groupId])"
                >
                  {{ groupMapping[scope.row.groupId] }}
                </el-tag>
                <el-tag v-else size="small" type="info"> 未分組 </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="floor" label="樓層" min-width="100" sortable>
              <template #default="scope">
                <el-tag type="primary" size="small">
                  {{ scope.row.floor || "未設定" }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="job" label="工作" min-width="150" sortable>
              <template #default="scope">
                <el-tag type="success" size="small" v-if="scope.row.job">
                  {{ scope.row.job }}
                </el-tag>
                <el-tag type="info" size="small" v-else> 未設定 </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="所屬團隊" min-width="100">
              <template #default="scope">
                <el-tag v-if="getTeamName(scope.row.teamId)" type="primary" size="small" effect="plain">
                  {{ getTeamName(scope.row.teamId) }}
                </el-tag>
                <span v-else style="color:#bbb;font-size:12px">—</span>
              </template>
            </el-table-column>

            <el-table-column label="消防" min-width="70">
              <template #default="scope">
                <el-tag
                  :type="scope.row.fireTraining ? 'success' : 'danger'"
                  size="small"
                >
                  {{ scope.row.fireTraining ? "O" : "X" }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="消防編組" min-width="130" sortable>
              <template #default="scope">
                <div v-if="getFireGroup(scope.row.number)" style="display:flex;align-items:center;gap:4px">
                  <el-tag
                    size="small"
                    :style="getFireGroupStyle(getFireGroup(scope.row.number))"
                  >
                    {{ getFireGroup(scope.row.number) }}
                  </el-tag>
                  <el-tag
                    v-if="isFireLeader(scope.row.number)"
                    size="small"
                    type="danger"
                    effect="dark"
                    style="font-size:10px;padding:0 4px"
                  >班長</el-tag>
                </div>
                <el-tag v-else size="small" type="info">—</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 消防編組資訊 -->
        <div class="fire-drill-section">
          <div class="fire-drill-header">
            <span class="fire-icon">🔥</span>
            <h2>消防演習編組</h2>
            <div class="fire-drill-meta">
              <el-tag type="danger" size="large">7月3日</el-tag>
              <span class="meeting-time-main">一般集合時間：<b>16:55</b></span>
              <span class="meeting-time-leader">班長集合時間：<b style="color:#e74c3c">16:25</b></span>
            </div>
          </div>

          <!-- 搜尋框 -->
          <div class="fire-search-box">
            <el-input
              v-model="fireSearch"
              placeholder="搜尋姓名或編號…"
              clearable
              style="max-width:300px"
            >
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <span v-if="fireSearch" class="fire-search-hint">
              {{ fireSearchCount }} 位符合
            </span>
          </div>

          <div class="fire-groups-grid">
            <div
              v-for="group in fireGroupsList"
              :key="group.name"
              class="fire-group-card"
              :style="{ borderColor: group.color }"
            >
              <div class="fire-group-title" :style="{ backgroundColor: group.color, color: group.textColor }">
                <span>{{ group.name }}</span>
                <el-tag size="small" type="danger" effect="dark" style="margin-left:8px">
                  班長：{{ group.leaderName ? group.leaderName : group.leader + '號' }}
                </el-tag>
              </div>
              <div class="fire-group-members">
                <div
                  v-for="member in group.members"
                  :key="member.number"
                  class="fire-member-chip"
                  :class="{
                    'is-leader': member.isLeader,
                    'is-highlighted': fireSearch && isFireMatch(member),
                    'is-dimmed': fireSearch && !isFireMatch(member),
                  }"
                >
                  <span class="member-number">{{ member.number }}</span>
                  <span class="member-name">{{ member.name || '—' }}</span>
                  <span v-if="member.isLeader" class="leader-badge">⭐ 16:25</span>
                </div>
              </div>
              <div class="fire-group-footer">
                共 {{ group.members.length }} 人
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted, computed } from "vue";
import { useWorkersStore } from "../stores/workers";
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

    // 響應式數據
    const searchName = ref("");
    const filterFloor = ref("");
    const filterGroup = ref("");
    const loading = ref(false);

    // PersonnelList 專用的響應式資料
    const workersData = ref([]);
    const groupsData = ref([]);
    const teamsData = ref([]);

    // 計算屬性 - 使用本地的響應式資料
    const workers = computed(() => workersData.value);
    const groups = computed(() => groupsData.value);

    // 組別映射 - 從 groupsData 創建 ID 到名稱的映射
    const groupMapping = computed(() => {
      const mapping = {};
      groupsData.value.forEach((group) => {
        mapping[group.id] = group.name;
      });
      return mapping;
    });

    // 可用樓層列表
    const availableFloors = computed(() => {
      const floors = [
        ...new Set(workers.value.map((w) => w.floor).filter(Boolean)),
      ];
      return floors.sort();
    });

    // 篩選後的工讀生列表
    const filteredWorkers = computed(() => {
      console.log("PersonnelList: 計算 filteredWorkers");
      console.log("PersonnelList: workers.value:", workers.value);
      console.log("PersonnelList: groupMapping.value:", groupMapping.value);

      let result = workers.value.map((worker) => ({
        ...worker,
        groupName: groupMapping.value[worker.groupId] || worker.group || "",
      }));

      console.log("PersonnelList: 映射後的工讀生:", result);

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

      console.log("PersonnelList: 最終篩選結果:", result);
      // 依編號從小到大排序
      return [...result].sort((a, b) => {
        const na = parseInt(String(a.number || "").replace(/\D/g, "")) || 0;
        const nb = parseInt(String(b.number || "").replace(/\D/g, "")) || 0;
        return na - nb;
      });
    });

    // 專門為訪客模式設計的載入函數
    const loadWorkersForGuests = async () => {
      try {
        console.log("PersonnelList: 正在載入工讀生資料（訪客模式）");

        // 直接構建完整 URL，避免 getApiUrl 的問題
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:3005";
        const fullUrl = `${API_BASE_URL}/api/workers`;
        console.log("PersonnelList: 完整 API URL:", fullUrl);

        console.log("PersonnelList: 準備發送 fetch 請求...");
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log(
          "PersonnelList: Workers API 回應狀態:",
          response.status,
          response.statusText,
        );
        console.log("PersonnelList: Workers API response object:", response);
        console.log("PersonnelList: Response headers:", [
          ...response.headers.entries(),
        ]);

        if (!response.ok && response.status !== 304) {
          throw new Error(
            `載入工讀生失敗: ${response.status} ${response.statusText}`,
          );
        }

        console.log("PersonnelList: 準備解析 JSON...");
        const result = await response.json();
        console.log("PersonnelList: 收到工讀生資料:", result);

        if (result && result.success && result.data) {
          workersData.value = result.data;
          console.log(
            "PersonnelList: 工讀生資料更新完成，數量:",
            result.data.length,
          );
          return result.data;
        } else {
          console.error("PersonnelList: API 回應格式錯誤:", result);
          workersData.value = [];
          return [];
        }
      } catch (error) {
        console.error("PersonnelList: 載入工讀生失敗:", error);
        console.error("PersonnelList: Error stack:", error.stack);
        console.error("PersonnelList: Error name:", error.name);
        console.error("PersonnelList: Error message:", error.message);
        workersData.value = [];
        return [];
      }
    };

    const loadGroupsForGuests = async () => {
      try {
        console.log("PersonnelList: 正在載入組別資料（訪客模式）");

        // 直接構建完整 URL，避免 getApiUrl 的問題
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://localhost:3005";
        const fullUrl = `${API_BASE_URL}/api/groups`;
        console.log("PersonnelList: 完整 Groups API URL:", fullUrl);

        console.log("PersonnelList: 準備發送 Groups fetch 請求...");
        const response = await fetch(fullUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log(
          "PersonnelList: Groups API 回應狀態:",
          response.status,
          response.statusText,
        );
        console.log("PersonnelList: Groups API response object:", response);
        console.log("PersonnelList: Groups Response headers:", [
          ...response.headers.entries(),
        ]);

        if (!response.ok && response.status !== 304) {
          throw new Error(
            `載入組別失敗: ${response.status} ${response.statusText}`,
          );
        }

        console.log("PersonnelList: 準備解析 Groups JSON...");
        const result = await response.json();
        console.log("PersonnelList: 收到組別資料:", result);

        if (result && result.success && result.data) {
          groupsData.value = result.data;
          console.log(
            "PersonnelList: 組別資料更新完成，數量:",
            result.data.length,
          );
          return result.data;
        } else {
          console.error("PersonnelList: Groups API 回應格式錯誤:", result);
          groupsData.value = [];
          return [];
        }
      } catch (error) {
        console.error("PersonnelList: 載入組別失敗:", error);
        console.error("PersonnelList: Groups Error stack:", error.stack);
        console.error("PersonnelList: Groups Error name:", error.name);
        console.error("PersonnelList: Groups Error message:", error.message);
        groupsData.value = [];
        return [];
      }
    };

    // 方法 - 專為訪客模式設計的載入邏輯
    const loadData = async () => {
      console.log("PersonnelList: 開始載入數據（訪客模式）...");
      console.log(
        "PersonnelList: 環境變數 VITE_API_URL:",
        import.meta.env.VITE_API_URL,
      );
      console.log("PersonnelList: 所有環境變數:", import.meta.env);
      loading.value = true;
      try {
        // 分別載入，不使用 Promise.all，方便除錯
        console.log("PersonnelList: 開始載入工讀生資料...");
        const workersResult = await loadWorkersForGuests();
        console.log(
          "PersonnelList: 工讀生載入結果:",
          workersResult?.length || 0,
        );

        console.log("PersonnelList: 開始載入組別資料...");
        const groupsResult = await loadGroupsForGuests();
        console.log("PersonnelList: 組別載入結果:", groupsResult?.length || 0);

        // 載入團隊資料
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3005";
          const res = await fetch(`${API_BASE_URL}/api/teams`);
          const data = await res.json();
          if (data.success) teamsData.value = data.data;
        } catch (e) { /* 非關鍵，失敗不影響頁面 */ }

        console.log("PersonnelList: 所有數據載入完成");
        console.log(
          "PersonnelList: 最終工讀生數據:",
          workersData.value?.length || 0,
        );
        console.log(
          "PersonnelList: 最終組別數據:",
          groupsData.value?.length || 0,
        );
      } catch (error) {
        console.error("PersonnelList: 載入數據失敗:", error);
      } finally {
        loading.value = false;
        console.log("PersonnelList: 載入完成");
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

    const getTeamName = (teamId) =>
      teamsData.value.find((t) => t.id === teamId)?.name || null;

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

    // 消防編組設定
    const FIRE_GROUP_CONFIG = [
      {
        name: '通報班',
        leader: '01',
        color: '#dbeafe',
        textColor: '#1e40af',
        check: (n) => (n >= 1 && n <= 36 && n !== 17),
      },
      {
        name: '滅火班',
        leader: '37',
        color: '#fef9c3',
        textColor: '#854d0e',
        check: (n) => (n >= 37 && n <= 55) || n === 109,
      },
      {
        name: '引導避難班',
        leader: '65',
        color: '#dcfce7',
        textColor: '#14532d',
        check: (n) => n >= 65 && n <= 93,
      },
      {
        name: '緊急救護班',
        leader: '94',
        color: '#fce7f3',
        textColor: '#831843',
        check: (n) => n >= 94 && n <= 108,
      },
      {
        name: '安全防護班',
        leader: '115',
        color: '#ede9fe',
        textColor: '#4c1d95',
        check: (n) => n === 17 || n === 115 || (n >= 56 && n <= 64) || (n >= 110 && n <= 113),
      },
    ];

    const FIRE_LEADERS = new Set(['01', '37', '65', '94', '115']);

    const getFireGroup = (workerNumber) => {
      if (!workerNumber) return null;
      const n = parseInt(String(workerNumber).replace(/\D/g, ''), 10);
      if (isNaN(n)) return null;
      const found = FIRE_GROUP_CONFIG.find((g) => g.check(n));
      return found ? found.name : null;
    };

    const isFireLeader = (workerNumber) => {
      if (!workerNumber) return false;
      const padded = String(workerNumber).padStart(2, '0');
      return FIRE_LEADERS.has(padded) || FIRE_LEADERS.has(String(workerNumber));
    };

    const getFireGroupStyle = (groupName) => {
      const cfg = FIRE_GROUP_CONFIG.find((g) => g.name === groupName);
      if (!cfg) return {};
      return { backgroundColor: cfg.color, color: cfg.textColor, border: `1px solid ${cfg.textColor}30` };
    };

    // 消防編組列表（含人員）
    const fireGroupsList = computed(() => {
      return FIRE_GROUP_CONFIG.map((cfg) => {
        const members = workersData.value
          .filter((w) => {
            const n = parseInt(String(w.number || '').replace(/\D/g, ''), 10);
            return !isNaN(n) && cfg.check(n) && w.fireTraining === true;
          })
          .map((w) => ({
            ...w,
            isLeader: isFireLeader(w.number),
          }))
          .sort((a, b) => {
            const na = parseInt(String(a.number || '').replace(/\D/g, ''), 10) || 0;
            const nb = parseInt(String(b.number || '').replace(/\D/g, ''), 10) || 0;
            return na - nb;
          });

        // 找班長姓名
        const leaderWorker = workersData.value.find((w) => isFireLeader(w.number) && members.some((m) => m.id === w.id));

        return {
          ...cfg,
          members,
          leaderName: leaderWorker?.name || null,
        };
      });
    });

    // 消防編組搜尋
    const fireSearch = ref('');

    const isFireMatch = (member) => {
      const q = fireSearch.value.trim().toLowerCase();
      if (!q) return false;
      const name = (member.name || '').toLowerCase();
      const num = String(member.number || '').toLowerCase();
      return name.includes(q) || num.includes(q);
    };

    const fireSearchCount = computed(() => {
      if (!fireSearch.value.trim()) return 0;
      return fireGroupsList.value.reduce(
        (acc, g) => acc + g.members.filter((m) => isFireMatch(m)).length,
        0,
      );
    });

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
      workersData,
      groupsData,
      teamsData,

      // 計算屬性
      workers,
      groups,
      groupMapping,
      availableFloors,
      filteredWorkers,

      // 方法
      handleSearch,
      applyFilters,
      getTeamName,
      getGroupTagStyle,
      getFireGroup,
      isFireLeader,
      getFireGroupStyle,
      fireGroupsList,
      fireSearch,
      isFireMatch,
      fireSearchCount,
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

/* 消防編組區塊 */
.fire-drill-section {
  margin-top: 32px;
  background: white;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-top: 4px solid #ef4444;
}

.fire-drill-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.fire-drill-header h2 {
  margin: 0;
  font-size: 1.4rem;
  color: #c0392b;
}

.fire-icon {
  font-size: 1.6rem;
}

.fire-drill-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-left: auto;
}

.meeting-time-main,
.meeting-time-leader {
  font-size: 14px;
  color: #444;
  background: #f8f8f8;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.fire-groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.fire-group-card {
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.fire-group-title {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  font-weight: bold;
  font-size: 15px;
}

.fire-group-members {
  padding: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
}

.fire-member-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 13px;
  transition: background 0.2s;
}

.fire-member-chip.is-leader {
  background: #fff3cd;
  border-color: #f0ad4e;
  font-weight: bold;
}

.member-number {
  color: #888;
  font-size: 11px;
}

.member-name {
  color: #333;
}

.leader-badge {
  font-size: 11px;
  color: #e74c3c;
  margin-left: 2px;
}

.fire-group-footer {
  padding: 6px 14px;
  font-size: 12px;
  color: #888;
  background: #fafafa;
  border-top: 1px solid #eee;
  text-align: right;
}

@media (max-width: 768px) {
  .fire-groups-grid {
    grid-template-columns: 1fr;
  }
  .fire-drill-meta {
    margin-left: 0;
  }
}

.fire-search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.fire-search-hint {
  font-size: 13px;
  color: #e74c3c;
  font-weight: 600;
}

.fire-member-chip.is-highlighted {
  background: #fff3cd;
  border: 2px solid #f39c12;
  color: #b7610a;
  font-weight: bold;
  box-shadow: 0 0 0 3px rgba(243,156,18,0.25);
  transform: scale(1.06);
  z-index: 1;
  position: relative;
}

.fire-member-chip.is-dimmed {
  opacity: 0.3;
}
</style>
