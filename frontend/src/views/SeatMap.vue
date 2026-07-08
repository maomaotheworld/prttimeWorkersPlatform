<template>
  <div class="seatmap-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button v-if="selectedSection" :icon="ArrowLeft" @click="selectedSection = null" type="info" plain>
          返回總覽
        </el-button>
        <h2>🏟️ 小巨蛋座位圖</h2>
      </div>
      <div class="header-right">
        <span class="stat-badge sold-badge">已售 {{ totalSold }}</span>
        <span class="stat-badge avail-badge">可售 {{ totalSeats - totalSold }}</span>
        <span class="stat-badge total-badge">共 {{ totalSeats }} 座</span>
        <el-button size="small" :icon="Refresh" @click="fetchSeats" :loading="loading" circle />
      </div>
    </div>

    <!-- 區塊總覽 -->
    <template v-if="!selectedSection">
      <!-- 舞台方向 -->
      <div class="stage-banner">🎵 舞　台</div>

      <!-- Level Tabs -->
      <el-tabs v-model="activeLevel" class="level-tabs">
        <el-tab-pane label="搖滾區（地面）" name="floor" />
        <el-tab-pane label="一樓看台" name="1F" />
        <el-tab-pane label="二樓看台" name="2F" />
      </el-tabs>

      <!-- Arena layout hint -->
      <div v-if="activeLevel !== 'floor'" class="layout-hint">
        <span>近舞台 → 側邊 → 後方</span>
      </div>

      <!-- Section Cards -->
      <div class="sections-overview">
        <div
          v-for="section in currentLevelSections"
          :key="section.id"
          class="section-card"
          :class="getSectionStatusClass(section.id, section)"
          @click="selectSection(section)"
        >
          <div class="section-name">{{ section.label }}</div>
          <div class="section-count">
            <span class="sold-num">{{ getSoldCount(section.id) }}</span>
            <span class="total-num"> / {{ getTotalSeats(section) }}</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: getSoldPercent(section.id, section) + '%' }"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- 座位詳細 -->
    <template v-else>
      <div class="detail-header">
        <h3>{{ selectedSection.label }}</h3>
        <div class="detail-stats">
          已售出 <strong>{{ getSoldCount(selectedSection.id) }}</strong> /
          共 <strong>{{ getTotalSeats(selectedSection) }}</strong> 座位
        </div>
        <el-tag v-if="!canEdit" type="warning" size="small">唯讀模式</el-tag>
      </div>

      <div class="stage-hint-small">⬆️ 舞台方向（越前面排數越小）</div>

      <!-- Legend -->
      <div class="legend">
        <div class="legend-item"><div class="seat-demo available" /> 可售</div>
        <div class="legend-item"><div class="seat-demo sold" /> 已售出</div>
        <div v-if="canEdit" class="legend-item tip">點選座位可切換狀態</div>
      </div>

      <!-- Seat Grid -->
      <div class="seat-grid-wrapper">
        <div v-for="row in getRows(selectedSection)" :key="row" class="seat-row">
          <div class="row-label">{{ row }}</div>
          <div class="row-seats">
            <button
              v-for="seat in selectedSection.seatsPerRow"
              :key="seat"
              class="seat-btn"
              :class="{
                sold: isSold(selectedSection.id, row, seat),
                toggling: togglingKey === `${selectedSection.id}:${row}:${seat}`,
                readonly: !canEdit,
              }"
              :title="`${selectedSection.label} ${row}排 ${seat}號`"
              @click="toggleSeat(selectedSection.id, row, seat)"
            >{{ seat }}</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ArrowLeft, Refresh } from "@element-plus/icons-vue";
import { useAuthStore } from "@/stores/auth";
import { ElMessage } from "element-plus";

const authStore = useAuthStore();
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const canEdit = computed(() =>
  authStore.isAdminOrEvelyn || authStore.isLeader
);

// ===== 座位設定 =====
// 台北小巨蛋 (Taipei Arena) 近似座位配置
// 搖滾區: A-E 五區；一樓: 101-112；二樓: 201-212
const SEAT_CONFIG = {
  "floor-a": { id: "floor-a", label: "搖滾A區", level: "floor", rowType: "number", rowCount: 8, seatsPerRow: 20 },
  "floor-b": { id: "floor-b", label: "搖滾B區", level: "floor", rowType: "number", rowCount: 8, seatsPerRow: 22 },
  "floor-c": { id: "floor-c", label: "搖滾C區", level: "floor", rowType: "number", rowCount: 8, seatsPerRow: 24 },
  "floor-d": { id: "floor-d", label: "搖滾D區", level: "floor", rowType: "number", rowCount: 8, seatsPerRow: 22 },
  "floor-e": { id: "floor-e", label: "搖滾E區", level: "floor", rowType: "number", rowCount: 7, seatsPerRow: 20 },

  "101": { id: "101", label: "101區", level: "1F", rowType: "letter", rowCount: 10, seatsPerRow: 18 },
  "102": { id: "102", label: "102區", level: "1F", rowType: "letter", rowCount: 10, seatsPerRow: 20 },
  "103": { id: "103", label: "103區", level: "1F", rowType: "letter", rowCount: 11, seatsPerRow: 20 },
  "104": { id: "104", label: "104區", level: "1F", rowType: "letter", rowCount: 11, seatsPerRow: 22 },
  "105": { id: "105", label: "105區", level: "1F", rowType: "letter", rowCount: 12, seatsPerRow: 22 },
  "106": { id: "106", label: "106區", level: "1F", rowType: "letter", rowCount: 12, seatsPerRow: 24 },
  "107": { id: "107", label: "107區", level: "1F", rowType: "letter", rowCount: 12, seatsPerRow: 24 },
  "108": { id: "108", label: "108區", level: "1F", rowType: "letter", rowCount: 12, seatsPerRow: 22 },
  "109": { id: "109", label: "109區", level: "1F", rowType: "letter", rowCount: 11, seatsPerRow: 22 },
  "110": { id: "110", label: "110區", level: "1F", rowType: "letter", rowCount: 11, seatsPerRow: 20 },
  "111": { id: "111", label: "111區", level: "1F", rowType: "letter", rowCount: 10, seatsPerRow: 20 },
  "112": { id: "112", label: "112區", level: "1F", rowType: "letter", rowCount: 10, seatsPerRow: 18 },

  "201": { id: "201", label: "201區", level: "2F", rowType: "letter", rowCount: 10, seatsPerRow: 22 },
  "202": { id: "202", label: "202區", level: "2F", rowType: "letter", rowCount: 10, seatsPerRow: 24 },
  "203": { id: "203", label: "203區", level: "2F", rowType: "letter", rowCount: 10, seatsPerRow: 26 },
  "204": { id: "204", label: "204區", level: "2F", rowType: "letter", rowCount: 10, seatsPerRow: 26 },
  "205": { id: "205", label: "205區", level: "2F", rowType: "letter", rowCount: 10, seatsPerRow: 24 },
  "206": { id: "206", label: "206區", level: "2F", rowType: "letter", rowCount: 10, seatsPerRow: 26 },
  "207": { id: "207", label: "207區", level: "2F", rowType: "letter", rowCount: 10, seatsPerRow: 28 },
  "208": { id: "208", label: "208區", level: "2F", rowType: "letter", rowCount: 10, seatsPerRow: 28 },
  "209": { id: "209", label: "209區", level: "2F", rowType: "letter", rowCount: 10, seatsPerRow: 26 },
  "210": { id: "210", label: "210區", level: "2F", rowType: "letter", rowCount: 10, seatsPerRow: 24 },
  "211": { id: "211", label: "211區", level: "2F", rowType: "letter", rowCount: 10, seatsPerRow: 22 },
  "212": { id: "212", label: "212區", level: "2F", rowType: "letter", rowCount: 10, seatsPerRow: 22 },
};

// ===== State =====
const soldSeats = ref({});
const selectedSection = ref(null);
const activeLevel = ref("floor");
const loading = ref(false);
const togglingKey = ref(null);

// ===== Computed =====
const allSections = computed(() => Object.values(SEAT_CONFIG));

const currentLevelSections = computed(() =>
  allSections.value.filter((s) => s.level === activeLevel.value)
);

const totalSeats = computed(() =>
  allSections.value.reduce((sum, s) => sum + getTotalSeats(s), 0)
);

const totalSold = computed(() => Object.keys(soldSeats.value).length);

// ===== Helpers =====
function getTotalSeats(section) {
  return section.rowCount * section.seatsPerRow;
}

function getRows(section) {
  if (section.rowType === "number") {
    return Array.from({ length: section.rowCount }, (_, i) => i + 1);
  }
  return Array.from({ length: section.rowCount }, (_, i) =>
    String.fromCharCode(65 + i)
  );
}

function isSold(sectionId, row, seat) {
  return !!soldSeats.value[`${sectionId}:${row}:${seat}`];
}

function getSoldCount(sectionId) {
  const prefix = `${sectionId}:`;
  return Object.keys(soldSeats.value).filter((k) => k.startsWith(prefix)).length;
}

function getSoldPercent(sectionId, section) {
  const total = getTotalSeats(section);
  if (!total) return 0;
  return Math.min(100, Math.round((getSoldCount(sectionId) / total) * 100));
}

function getSectionStatusClass(sectionId, section) {
  const pct = getSoldPercent(sectionId, section);
  if (pct === 0) return "status-empty";
  if (pct < 30) return "status-low";
  if (pct < 70) return "status-mid";
  if (pct < 100) return "status-high";
  return "status-full";
}

function selectSection(section) {
  selectedSection.value = section;
}

// ===== API =====
async function fetchSeats() {
  loading.value = true;
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API_BASE}/api/seats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) soldSeats.value = data.data || {};
  } catch {
    ElMessage.error("載入座位資料失敗");
  } finally {
    loading.value = false;
  }
}

async function toggleSeat(sectionId, row, seat) {
  if (!canEdit.value || togglingKey.value) return;
  const key = `${sectionId}:${row}:${seat}`;
  togglingKey.value = key;
  try {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`${API_BASE}/api/seats/toggle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ section: sectionId, row, seat }),
    });
    const data = await res.json();
    if (data.success) {
      soldSeats.value = data.data || {};
    } else {
      ElMessage.error(data.message || "操作失敗");
    }
  } catch {
    ElMessage.error("網路錯誤，請稍後再試");
  } finally {
    togglingKey.value = null;
  }
}

onMounted(fetchSeats);
</script>

<style scoped>
.seatmap-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 1.4rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.sold-badge  { background: #fee2e2; color: #dc2626; }
.avail-badge { background: #dcfce7; color: #16a34a; }
.total-badge { background: #f1f5f9; color: #475569; }

/* Stage banner */
.stage-banner {
  text-align: center;
  background: linear-gradient(90deg, #4f46e5, #7c3aed);
  color: white;
  padding: 10px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 4px;
  margin-bottom: 16px;
}

.stage-hint-small {
  text-align: center;
  color: #6b7280;
  font-size: 0.82rem;
  margin-bottom: 10px;
}

.layout-hint {
  color: #94a3b8;
  font-size: 0.8rem;
  margin-bottom: 8px;
  text-align: right;
}

/* Section Cards */
.sections-overview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.section-card {
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 10px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  text-align: center;
  user-select: none;
}

.section-card:hover {
  border-color: #6366f1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.18);
}

.section-name {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 6px;
  color: #1e293b;
}

.section-count {
  font-size: 0.8rem;
  margin-bottom: 6px;
}

.sold-num  { color: #dc2626; font-weight: 700; }
.total-num { color: #94a3b8; }

.progress-bar {
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #ef4444;
  border-radius: 2px;
  transition: width 0.3s;
}

/* Status tints */
.status-empty { border-color: #e2e8f0; }
.status-low   { border-color: #fbbf24; background: #fffbeb; }
.status-mid   { border-color: #f97316; background: #fff7ed; }
.status-high  { border-color: #ef4444; background: #fef2f2; }
.status-full  { border-color: #b91c1c; background: #fee2e2; }

/* Seat Detail */
.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.detail-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.detail-stats {
  color: #64748b;
  font-size: 0.9rem;
}

/* Legend */
.legend {
  display: flex;
  gap: 16px;
  margin-bottom: 14px;
  flex-wrap: wrap;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: #475569;
}

.legend-item.tip {
  color: #94a3b8;
  font-style: italic;
}

.seat-demo {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  border: 1px solid #cbd5e1;
  background: #f1f5f9;
}

.seat-demo.available { background: #dcfce7; border-color: #86efac; }
.seat-demo.sold      { background: #fee2e2; border-color: #fca5a5; }

/* Seat Grid */
.seat-grid-wrapper {
  overflow-x: auto;
  padding-bottom: 20px;
}

.seat-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 3px;
}

.row-label {
  width: 26px;
  min-width: 26px;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: #6b7280;
}

.row-seats {
  display: flex;
  gap: 2px;
}

.seat-btn {
  width: 26px;
  height: 26px;
  border: 1px solid #86efac;
  border-radius: 4px;
  background: #dcfce7;
  color: #166534;
  font-size: 9px;
  cursor: pointer;
  padding: 0;
  transition: background 0.12s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.seat-btn:hover:not(.readonly) {
  border-color: #6366f1;
  transform: scale(1.15);
  z-index: 1;
}

.seat-btn.sold {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}

.seat-btn.toggling {
  opacity: 0.4;
  cursor: wait;
}

.seat-btn.readonly {
  cursor: default;
}

@media (max-width: 768px) {
  .seatmap-container { padding: 12px; }

  .seat-btn {
    width: 22px;
    height: 22px;
    font-size: 7px;
  }

  .row-label {
    width: 20px;
    min-width: 20px;
    font-size: 0.65rem;
  }

  .sections-overview {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }
}
</style>
