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

    <!-- ===== 座位總覽（Arena Map）===== -->
    <template v-if="!selectedSection">
      <!-- 舞台 -->
      <div class="stage-banner">舞　台　STAGE</div>

      <!-- 主場地 Grid（7欄）-->
      <div class="arena-grid">
        <!-- Row B: 紫2B 紫1B 特A1 特A2 特A3 紅1B 紅2B -->
        <ZoneCard v-for="id in ['紫2B','紫1B','特A1','特A2','特A3','紅1B','紅2B']" :key="id"
          :section="SEAT_CONFIG[id]" :sold="getSoldCount(id)"
          @click="selectSection(SEAT_CONFIG[id])" />

        <!-- Row C: 紫2C 紫1C 特A4 特A5 特A6 紅1C 紅2C -->
        <ZoneCard v-for="id in ['紫2C','紫1C','特A4','特A5','特A6','紅1C','紅2C']" :key="id"
          :section="SEAT_CONFIG[id]" :sold="getSoldCount(id)"
          @click="selectSection(SEAT_CONFIG[id])" />

        <!-- Row D: 紫2D 紫1D 特B1 特B2 特B3 紅1D 紅2D -->
        <ZoneCard v-for="id in ['紫2D','紫1D','特B1','特B2','特B3','紅1D','紅2D']" :key="id"
          :section="SEAT_CONFIG[id]" :sold="getSoldCount(id)"
          @click="selectSection(SEAT_CONFIG[id])" />

        <!-- Row E: 紫2E 紫1E [空] [空] [空] 紅1E 紅2E -->
        <ZoneCard v-for="id in ['紫2E','紫1E']" :key="id"
          :section="SEAT_CONFIG[id]" :sold="getSoldCount(id)"
          @click="selectSection(SEAT_CONFIG[id])" />
        <div class="arena-empty" style="grid-column: span 3;" />
        <ZoneCard v-for="id in ['紅1E','紅2E']" :key="id"
          :section="SEAT_CONFIG[id]" :sold="getSoldCount(id)"
          @click="selectSection(SEAT_CONFIG[id])" />

        <!-- Row 黃2: 黃2E 黃2D [黃2C span3] 黃2B 黃2A -->
        <ZoneCard v-for="id in ['黃2E','黃2D']" :key="id"
          :section="SEAT_CONFIG[id]" :sold="getSoldCount(id)"
          @click="selectSection(SEAT_CONFIG[id])" />
        <ZoneCard id="黃2C" :section="SEAT_CONFIG['黃2C']" :sold="getSoldCount('黃2C')"
          @click="selectSection(SEAT_CONFIG['黃2C'])" style="grid-column: span 3;" />
        <ZoneCard v-for="id in ['黃2B','黃2A']" :key="id"
          :section="SEAT_CONFIG[id]" :sold="getSoldCount(id)"
          @click="selectSection(SEAT_CONFIG[id])" />
      </div>

      <!-- 黃3 弧形（10欄） -->
      <div class="yellow3-grid">
        <ZoneCard v-for="id in ['黃3J','黃3I','黃3H','黃3G','黃3F','黃3E','黃3D','黃3C','黃3B','黃3A']" :key="id"
          :section="SEAT_CONFIG[id]" :sold="getSoldCount(id)"
          @click="selectSection(SEAT_CONFIG[id])" />
      </div>

      <!-- 色碼說明 -->
      <div class="color-legend">
        <div class="cl-item floor">特區（地板）</div>
        <div class="cl-item purple1">紫1（內側）</div>
        <div class="cl-item purple2">紫2（外側）</div>
        <div class="cl-item red1">紅1（內側）</div>
        <div class="cl-item red2">紅2（外側）</div>
        <div class="cl-item yellow2">黃2（2F後方）</div>
        <div class="cl-item yellow3">黃3（3F後方）</div>
      </div>
    </template>

    <!-- ===== 座位詳細 ===== -->
    <template v-else>
      <div class="detail-header" :style="{ borderLeftColor: SEAT_CONFIG[selectedSection.id]?.borderColor }">
        <h3>{{ selectedSection.label }}</h3>
        <div class="detail-stats">
          已售出 <strong>{{ getSoldCount(selectedSection.id) }}</strong> /
          共 <strong>{{ getTotalSeats(selectedSection) }}</strong> 座位
          <el-tag :color="selectedSection.bg" size="small" style="margin-left:8px; color: inherit;">
            {{ selectedSection.label }}
          </el-tag>
        </div>
        <el-tag v-if="!canEdit" type="warning" size="small">唯讀模式</el-tag>
      </div>

      <div class="stage-hint-small">⬆️ 舞台方向（越前面排數越小）</div>

      <div class="legend">
        <div class="legend-item"><div class="seat-demo available" /> 可售</div>
        <div class="legend-item"><div class="seat-demo sold" /> 已售出</div>
        <div v-if="canEdit" class="legend-item tip">點選座位切換狀態</div>
      </div>

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
import { ref, computed, onMounted, defineComponent, h } from "vue";
import { ArrowLeft, Refresh } from "@element-plus/icons-vue";
import { useAuthStore } from "@/stores/auth";
import { ElMessage } from "element-plus";

const authStore = useAuthStore();
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const canEdit = computed(() =>
  authStore.isAdminOrEvelyn || authStore.isLeader
);

// ===== 座位設定（台北小巨蛋真實分區）=====
// 排數為研究資料估算值，座位數為合理近似值
const SEAT_CONFIG = {
  // ─── 地板特區（綠色）───
  "特A1": { id:"特A1", label:"特A1", type:"floor", bg:"#4ade80", borderColor:"#16a34a", rowType:"number", rowCount:15, seatsPerRow:15 },
  "特A2": { id:"特A2", label:"特A2", type:"floor", bg:"#4ade80", borderColor:"#16a34a", rowType:"number", rowCount:15, seatsPerRow:16 },
  "特A3": { id:"特A3", label:"特A3", type:"floor", bg:"#4ade80", borderColor:"#16a34a", rowType:"number", rowCount:15, seatsPerRow:15 },
  "特A4": { id:"特A4", label:"特A4", type:"floor", bg:"#4ade80", borderColor:"#16a34a", rowType:"number", rowCount:15, seatsPerRow:15 },
  "特A5": { id:"特A5", label:"特A5", type:"floor", bg:"#4ade80", borderColor:"#16a34a", rowType:"number", rowCount:15, seatsPerRow:16 },
  "特A6": { id:"特A6", label:"特A6", type:"floor", bg:"#4ade80", borderColor:"#16a34a", rowType:"number", rowCount:15, seatsPerRow:15 },
  "特B1": { id:"特B1", label:"特B1", type:"floor", bg:"#86efac", borderColor:"#16a34a", rowType:"number", rowCount:12, seatsPerRow:20 },
  "特B2": { id:"特B2", label:"特B2", type:"floor", bg:"#86efac", borderColor:"#16a34a", rowType:"number", rowCount:12, seatsPerRow:22 },
  "特B3": { id:"特B3", label:"特B3", type:"floor", bg:"#86efac", borderColor:"#16a34a", rowType:"number", rowCount:12, seatsPerRow:20 },

  // ─── 左側 紫色 內側（紫1）───
  "紫1B": { id:"紫1B", label:"紫1B", type:"purple1", bg:"#c084fc", borderColor:"#9333ea", rowType:"letter", rowCount:8,  seatsPerRow:10 },
  "紫1C": { id:"紫1C", label:"紫1C", type:"purple1", bg:"#c084fc", borderColor:"#9333ea", rowType:"letter", rowCount:10, seatsPerRow:12 },
  "紫1D": { id:"紫1D", label:"紫1D", type:"purple1", bg:"#c084fc", borderColor:"#9333ea", rowType:"letter", rowCount:10, seatsPerRow:12 },
  "紫1E": { id:"紫1E", label:"紫1E", type:"purple1", bg:"#c084fc", borderColor:"#9333ea", rowType:"letter", rowCount:8,  seatsPerRow:10 },

  // ─── 左側 紫色 外側（紫2）───
  "紫2B": { id:"紫2B", label:"紫2B", type:"purple2", bg:"#a855f7", borderColor:"#7e22ce", rowType:"letter", rowCount:12, seatsPerRow:18 },
  "紫2C": { id:"紫2C", label:"紫2C", type:"purple2", bg:"#a855f7", borderColor:"#7e22ce", rowType:"letter", rowCount:13, seatsPerRow:22 },
  "紫2D": { id:"紫2D", label:"紫2D", type:"purple2", bg:"#a855f7", borderColor:"#7e22ce", rowType:"letter", rowCount:13, seatsPerRow:22 },
  "紫2E": { id:"紫2E", label:"紫2E", type:"purple2", bg:"#a855f7", borderColor:"#7e22ce", rowType:"letter", rowCount:13, seatsPerRow:15 },

  // ─── 右側 紅色 內側（紅1）───
  "紅1B": { id:"紅1B", label:"紅1B", type:"red1", bg:"#f87171", borderColor:"#dc2626", rowType:"letter", rowCount:8,  seatsPerRow:10 },
  "紅1C": { id:"紅1C", label:"紅1C", type:"red1", bg:"#f87171", borderColor:"#dc2626", rowType:"letter", rowCount:10, seatsPerRow:12 },
  "紅1D": { id:"紅1D", label:"紅1D", type:"red1", bg:"#f87171", borderColor:"#dc2626", rowType:"letter", rowCount:10, seatsPerRow:12 },
  "紅1E": { id:"紅1E", label:"紅1E", type:"red1", bg:"#f87171", borderColor:"#dc2626", rowType:"letter", rowCount:8,  seatsPerRow:10 },

  // ─── 右側 紅色 外側（紅2）───
  "紅2B": { id:"紅2B", label:"紅2B", type:"red2", bg:"#ef4444", borderColor:"#991b1b", rowType:"letter", rowCount:12, seatsPerRow:18 },
  "紅2C": { id:"紅2C", label:"紅2C", type:"red2", bg:"#ef4444", borderColor:"#991b1b", rowType:"letter", rowCount:13, seatsPerRow:22 },
  "紅2D": { id:"紅2D", label:"紅2D", type:"red2", bg:"#ef4444", borderColor:"#991b1b", rowType:"letter", rowCount:13, seatsPerRow:22 },
  "紅2E": { id:"紅2E", label:"紅2E", type:"red2", bg:"#ef4444", borderColor:"#991b1b", rowType:"letter", rowCount:13, seatsPerRow:15 },

  // ─── 後方 黃2（2F，橘色）───
  "黃2A": { id:"黃2A", label:"黃2A", type:"yellow2", bg:"#fb923c", borderColor:"#c2410c", rowType:"letter", rowCount:13, seatsPerRow:18 },
  "黃2B": { id:"黃2B", label:"黃2B", type:"yellow2", bg:"#fb923c", borderColor:"#c2410c", rowType:"letter", rowCount:13, seatsPerRow:25 },
  "黃2C": { id:"黃2C", label:"黃2C", type:"yellow2", bg:"#fb923c", borderColor:"#c2410c", rowType:"letter", rowCount:15, seatsPerRow:32 },
  "黃2D": { id:"黃2D", label:"黃2D", type:"yellow2", bg:"#fb923c", borderColor:"#c2410c", rowType:"letter", rowCount:13, seatsPerRow:25 },
  "黃2E": { id:"黃2E", label:"黃2E", type:"yellow2", bg:"#fb923c", borderColor:"#c2410c", rowType:"letter", rowCount:13, seatsPerRow:18 },

  // ─── 後方 黃3（3F，黃色）───
  "黃3A": { id:"黃3A", label:"黃3A", type:"yellow3", bg:"#fbbf24", borderColor:"#92400e", rowType:"letter", rowCount:20, seatsPerRow:15 },
  "黃3B": { id:"黃3B", label:"黃3B", type:"yellow3", bg:"#fbbf24", borderColor:"#92400e", rowType:"letter", rowCount:20, seatsPerRow:18 },
  "黃3C": { id:"黃3C", label:"黃3C", type:"yellow3", bg:"#fbbf24", borderColor:"#92400e", rowType:"letter", rowCount:20, seatsPerRow:22 },
  "黃3D": { id:"黃3D", label:"黃3D", type:"yellow3", bg:"#fbbf24", borderColor:"#92400e", rowType:"letter", rowCount:20, seatsPerRow:26 },
  "黃3E": { id:"黃3E", label:"黃3E", type:"yellow3", bg:"#fbbf24", borderColor:"#92400e", rowType:"letter", rowCount:20, seatsPerRow:30 },
  "黃3F": { id:"黃3F", label:"黃3F", type:"yellow3", bg:"#fbbf24", borderColor:"#92400e", rowType:"letter", rowCount:20, seatsPerRow:30 },
  "黃3G": { id:"黃3G", label:"黃3G", type:"yellow3", bg:"#fbbf24", borderColor:"#92400e", rowType:"letter", rowCount:20, seatsPerRow:26 },
  "黃3H": { id:"黃3H", label:"黃3H", type:"yellow3", bg:"#fbbf24", borderColor:"#92400e", rowType:"letter", rowCount:20, seatsPerRow:22 },
  "黃3I": { id:"黃3I", label:"黃3I", type:"yellow3", bg:"#fbbf24", borderColor:"#92400e", rowType:"letter", rowCount:20, seatsPerRow:18 },
  "黃3J": { id:"黃3J", label:"黃3J", type:"yellow3", bg:"#fbbf24", borderColor:"#92400e", rowType:"letter", rowCount:20, seatsPerRow:15 },
};

// ─── ZoneCard 元件 ───
const ZoneCard = defineComponent({
  props: ["section", "sold"],
  emits: ["click"],
  setup(props, { emit }) {
    return () => {
      const s = props.section;
      if (!s) return null;
      const total = s.rowCount * s.seatsPerRow;
      const pct = total ? Math.round((props.sold / total) * 100) : 0;
      return h("div", {
        class: "zone-card",
        style: { background: s.bg, borderColor: s.borderColor },
        onClick: () => emit("click"),
      }, [
        h("div", { class: "zc-name" }, s.label),
        h("div", { class: "zc-count" }, `${props.sold}/${total}`),
        h("div", { class: "zc-bar" }, [
          h("div", { class: "zc-bar-fill", style: { width: pct + "%" } }),
        ]),
      ]);
    };
  },
});

// ─── State ───
const soldSeats   = ref({});
const selectedSection = ref(null);
const loading     = ref(false);
const togglingKey = ref(null);

// ─── Computed ───
const totalSeats = computed(() =>
  Object.values(SEAT_CONFIG).reduce((s, z) => s + z.rowCount * z.seatsPerRow, 0)
);
const totalSold = computed(() => Object.keys(soldSeats.value).length);

// ─── Helpers ───
function getTotalSeats(s) { return s.rowCount * s.seatsPerRow; }

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

function selectSection(section) {
  selectedSection.value = section;
}

// ─── API ───
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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ section: sectionId, row, seat }),
    });
    const data = await res.json();
    if (data.success) soldSeats.value = data.data || {};
    else ElMessage.error(data.message || "操作失敗");
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
  max-width: 900px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 10px;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.header-left h2 { margin: 0; font-size: 1.3rem; }
.header-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.stat-badge { padding: 3px 10px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }
.sold-badge  { background: #fee2e2; color: #dc2626; }
.avail-badge { background: #dcfce7; color: #16a34a; }
.total-badge { background: #f1f5f9; color: #475569; }

/* Stage */
.stage-banner {
  text-align: center;
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
  padding: 10px;
  border-radius: 8px 8px 0 0;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 6px;
  margin-bottom: 4px;
}

/* Arena Grid (7 columns) */
.arena-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}

/* Yellow 3F Grid (10 columns) */
.yellow3-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  margin-bottom: 12px;
}

/* Zone Card */
.zone-card {
  border: 2px solid transparent;
  border-radius: 6px;
  padding: 8px 4px 6px;
  cursor: pointer;
  text-align: center;
  transition: transform 0.15s, box-shadow 0.15s;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
}
.zone-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.25);
}
.zc-name { font-size: 0.78rem; font-weight: 700; color: #1e293b; }
.zc-count { font-size: 0.68rem; color: rgba(0,0,0,0.65); }
.zc-bar { height: 3px; background: rgba(0,0,0,0.15); border-radius: 2px; margin: 0 4px; overflow: hidden; }
.zc-bar-fill { height: 100%; background: rgba(0,0,0,0.5); border-radius: 2px; transition: width 0.3s; }

/* Empty cell */
.arena-empty { min-height: 60px; background: transparent; }

/* Color legend */
.color-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
}
.cl-item {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}
.cl-item.floor   { background: #4ade80; color: #166534; }
.cl-item.purple1 { background: #c084fc; color: #581c87; }
.cl-item.purple2 { background: #a855f7; color: white; }
.cl-item.red1    { background: #f87171; color: #7f1d1d; }
.cl-item.red2    { background: #ef4444; color: white; }
.cl-item.yellow2 { background: #fb923c; color: #7c2d12; }
.cl-item.yellow3 { background: #fbbf24; color: #78350f; }

/* Seat Detail */
.detail-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  padding-left: 10px;
  border-left: 5px solid #6366f1;
}
.detail-header h3 { margin: 0; font-size: 1.2rem; }
.detail-stats { color: #64748b; font-size: 0.88rem; }
.stage-hint-small { text-align: center; color: #6b7280; font-size: 0.8rem; margin-bottom: 10px; }

.legend { display: flex; gap: 14px; margin-bottom: 12px; flex-wrap: wrap; align-items: center; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: #475569; }
.legend-item.tip { color: #94a3b8; font-style: italic; }
.seat-demo { width: 16px; height: 16px; border-radius: 3px; border: 1px solid #cbd5e1; }
.seat-demo.available { background: #dcfce7; border-color: #86efac; }
.seat-demo.sold      { background: #fee2e2; border-color: #fca5a5; }

/* Seat Grid */
.seat-grid-wrapper { overflow-x: auto; padding-bottom: 20px; }
.seat-row { display: flex; align-items: center; gap: 3px; margin-bottom: 2px; }
.row-label { width: 24px; min-width: 24px; text-align: center; font-size: 0.7rem; font-weight: 700; color: #6b7280; }
.row-seats { display: flex; gap: 2px; }

.seat-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #86efac;
  border-radius: 3px;
  background: #dcfce7;
  color: #166534;
  font-size: 8px;
  cursor: pointer;
  padding: 0;
  transition: background 0.1s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.seat-btn:hover:not(.readonly) { border-color: #6366f1; transform: scale(1.15); }
.seat-btn.sold { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
.seat-btn.toggling { opacity: 0.4; cursor: wait; }
.seat-btn.readonly { cursor: default; }

@media (max-width: 768px) {
  .seatmap-container { padding: 10px; }
  .zone-card { min-height: 50px; padding: 4px 2px; }
  .zc-name { font-size: 0.65rem; }
  .zc-count { font-size: 0.58rem; }
  .seat-btn { width: 20px; height: 20px; font-size: 7px; }
  .row-label { width: 20px; min-width: 20px; font-size: 0.62rem; }
}
</style>
