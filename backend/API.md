# API 文檔

## 基本資訊

- 基本網址: `http://localhost:3000/api`
- 資料格式: JSON
- 字符編碼: UTF-8

## 通用回應格式

```json
{
  "success": true, // 或 false
  "data": {}, // 資料內容（成功時）
  "message": "" // 回應訊息
}
```

## API 端點

### 工讀生管理

#### 獲取所有工讀生

- **GET** `/api/workers`
- **回應**: 工讀生列表

#### 獲取單個工讀生

- **GET** `/api/workers/:id`
- **參數**: `id` - 工讀生ID
- **回應**: 工讀生詳細資料

#### 新增工讀生

- **POST** `/api/workers`
- **請求體**:

```json
{
  "number": "W001", // 工讀生編號（必填）
  "name": "張小明", // 姓名（必填）
  "gender": "male", // 性別: male/female（必填）
  "level": 5, // 等級 1-10（必填）
  "groupId": "group-1", // 組別ID（選填）
  "baseHourlyWage": 200, // 基本時薪（選填）
  "baseWorkingHours": 8 // 基本工時（選填）
}
```

#### 更新工讀生

- **PUT** `/api/workers/:id`
- **參數**: `id` - 工讀生ID
- **請求體**: 同新增工讀生

#### 批次更新工讀生薪資時數

- **PUT** `/api/workers/batch-update-wage`
- **請求體**:

```json
{
  "workerIds": ["worker-1", "worker-2"], // 工讀生ID陣列（必填）
  "baseHourlyWage": 250, // 基本時薪（選填）
  "baseWorkingHours": 8 // 基本工時（選填）
}
```

#### 刪除工讀生

- **DELETE** `/api/workers/:id`
- **參數**: `id` - 工讀生ID

### 組別管理

#### 獲取所有組別

- **GET** `/api/groups`
- **回應**: 組別列表

#### 新增組別

- **POST** `/api/groups`
- **請求體**:

```json
{
  "name": "新組別", // 組別名稱（必填）
  "description": "組別說明" // 組別說明（選填）
}
```

#### 更新組別

- **PUT** `/api/groups/:id`
- **參數**: `id` - 組別ID
- **請求體**: 同新增組別

#### 刪除組別

- **DELETE** `/api/groups/:id`
- **參數**: `id` - 組別ID

### 工時記錄

#### 獲取工時記錄

- **GET** `/api/time-records`
- **查詢參數**:
  - `workerId` - 工讀生ID（選填）
  - `date` - 日期（選填）

#### 上班打卡

- **POST** `/api/time-records/clock-in`
- **請求體**:

```json
{
  "workerId": "worker-id" // 工讀生ID（必填）
}
```

#### 下班打卡

- **POST** `/api/time-records/clock-out`
- **請求體**:

```json
{
  "workerId": "worker-id" // 工讀生ID（必填）
}
```

#### 新增額外工時

- **POST** `/api/time-records/additional-hours`
- **請求體**:

```json
{
  "workerId": "worker-id", // 工讀生ID（必填）
  "date": "2024-01-19", // 日期（必填）
  "hours": 2.5, // 額外工時，支援小數點（必填）
  "reason": "加班原因" // 加班理由（必填）
}
```

### 薪資調整

#### 獲取薪資調整記錄

- **GET** `/api/salary-adjustments`
- **查詢參數**:
  - `workerId` - 工讀生ID（選填）

#### 新增薪資調整

- **POST** `/api/salary-adjustments`
- **請求體**:

```json
{
  "workerId": "worker-id", // 工讀生ID（必填）
  "type": "increase", // 調整類型: increase/decrease（必填）
  "amount": 500, // 調整金額（必填）
  "reason": "表現優異" // 調整理由（必填）
}
```

### 統計資訊

#### 獲取總覽統計

- **GET** `/api/dashboard/stats`
- **回應**:

```json
{
  "totalWorkers": 10, // 總工讀生數
  "totalGroups": 3, // 總組別數
  "todayClockedIn": 5, // 今日打卡人數
  "monthlyHours": 120.5 // 本月總工時
}
```

#### 計算工讀生薪資

- **GET** `/api/workers/:id/salary-calculation`
- **參數**: `id` - 工讀生ID
- **查詢參數**:
  - `startDate` - 開始日期（選填，預設為本月第一天）
  - `endDate` - 結束日期（選填，預設為本月最後一天）
- **回應**:

```json
{
  "worker": {
    "id": "worker-id",
    "number": "W001",
    "name": "張小明",
    "baseHourlyWage": 200,
    "baseWorkingHours": 8
  },
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "workTime": {
    "totalRegularHours": 120.5,
    "totalAdditionalHours": 10.5,
    "workingDays": 20
  },
  "salary": {
    "baseSalaryFromHours": 24100,
    "baseSalaryFromDays": 32000,
    "baseSalary": 32000,
    "additionalSalary": 2100,
    "totalAdjustments": 500,
    "totalSalary": 34600
  }
}
```

### 系統

#### 健康檢查

- **GET** `/health`
- **回應**: 服務狀態

## 錯誤代碼

- `200` - 成功
- `201` - 創建成功
- `400` - 請求錯誤
- `404` - 資源不存在
- `500` - 伺服器錯誤

## 使用範例

```bash
# 新增工讀生（包含薪資時數）
curl -X POST http://localhost:3000/api/workers \
  -H "Content-Type: application/json" \
  -d '{
    "number": "W001",
    "name": "張小明",
    "gender": "male",
    "level": 5,
    "baseHourlyWage": 200,
    "baseWorkingHours": 8
  }'

# 批次更新工讀生薪資
curl -X PUT http://localhost:3000/api/workers/batch-update-wage \
  -H "Content-Type: application/json" \
  -d '{
    "workerIds": ["worker-1", "worker-2"],
    "baseHourlyWage": 250,
    "baseWorkingHours": 8
  }'

# 新增額外工時（支援小數點）
curl -X POST http://localhost:3000/api/time-records/additional-hours \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "worker-id",
    "date": "2024-01-19",
    "hours": 2.5,
    "reason": "處理緊急事務"
  }'

# 計算工讀生薪資
curl "http://localhost:3000/api/workers/worker-id/salary-calculation?startDate=2024-01-01&endDate=2024-01-31"

# 上班打卡
curl -X POST http://localhost:3000/api/time-records/clock-in \
  -H "Content-Type: application/json" \
  -d '{
    "workerId": "worker-id"
  }'
```
