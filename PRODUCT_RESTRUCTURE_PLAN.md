# AI 短影片 SaaS 產品重構規劃書

> 產出日期：2026-04-18
> 版本：v1.0
> 目標：將技術 Demo 改造為可收費的 SaaS 短影片平台

---

## 一、新產品定位摘要

### 核心轉變

| 項目 | 舊模式 | 新模式 |
|------|--------|--------|
| 產品定位 | AI 影片技術 Demo | 商業短影片自動化平台 |
| 主力影片 | 無明確秒數定位 | 15-60 秒短影片 |
| 賣點 | 「AI 可以生影片」 | 「輸入主題，產出可發佈的商業影片」 |
| 用戶心智 | 工具型 | 服務型（像 Canva 做設計） |
| 收費邏輯 | 每月 N 支影片 | 點數制（秒數 x 功能 = 消耗點數） |

### 一句話定位

「10 秒輸入主題，60 秒拿到可發佈的商業短影片。」

### 目標用戶

1. **自媒體創作者**：每天要發 1-3 支短影片，需要快速量產
2. **中小企業行銷**：需要產品介紹、品牌宣傳影片但沒預算請剪輯師
3. **電商賣家**：需要大量商品展示短影片
4. **行銷代操公司**：替客戶批量生成社群影片

### 影片產品分級

| 等級 | 秒數 | 定位 | 場景 | 點數消耗 |
|------|------|------|------|----------|
| Flash | 15-30 秒 | 流量型 | 社群限動、短影音、廣告素材 | 1 點 |
| Standard | 30-60 秒 | 商業型 | 產品介紹、品牌故事、教學內容 | 3 點 |
| Premium | 60-120 秒 | 高價型 | 完整品牌影片、深度內容 | 8 點 |

---

## 二、新的系統架構

### 整體架構圖

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                  │
│              Next.js 14 App Router                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ 影片生成  │ │ 任務中心  │ │ 我的作品  │ │ 帳戶   │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
└───────┼────────────┼────────────┼────────────┼──────┘
        │            │            │            │
   ┌────▼────────────▼────────────▼────────────▼──────┐
   │              Next.js API Routes                    │
   │  POST /generate  GET /jobs  GET /videos  Stripe   │
   └────────────────────┬─────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
   ┌────────────┐ ┌──────────┐ ┌──────────┐
   │  Supabase  │ │   n8n    │ │  Stripe  │
   │ Auth + DB  │ │ Workflow │ │ Payment  │
   │ + Storage  │ │  Engine  │ │          │
   └──────┬─────┘ └────┬─────┘ └──────────┘
          │             │
          │    ┌────────┼────────┬──────────┐
          │    ▼        ▼        ▼          ▼
          │ ┌──────┐ ┌──────┐ ┌──────┐ ┌────────┐
          │ │OpenAI│ │ TTS  │ │ LTX  │ │Creato- │
          │ │Script│ │Voice │ │Video │ │mate    │
          │ └──────┘ └──────┘ └──────┘ └────────┘
          │                                 │
          └──────── callback ◄──────────────┘
```

### 各元件角色

**Next.js (Vercel) — 前端 + API 閘道**
- 用戶操作介面（生成、管理、帳戶）
- API Routes 作為後端閘道（驗證、扣點、派發任務）
- 不直接呼叫 AI 服務，全部透過 n8n

**Supabase — 資料層 + 認證 + 儲存**
- Auth：用戶註冊登入（Google OAuth + Email）
- Database：用戶、影片、任務、方案、使用紀錄
- Storage：最終影片檔、縮圖、字幕檔、用戶上傳素材
- Realtime（未來）：即時狀態推送

**n8n Cloud — 工作流引擎**
- 接收 Webhook 觸發
- 根據影片等級分流處理
- 串接所有 AI 服務（OpenAI、TTS、LTX、Creatomate）
- 完成後 Callback 回前端 API
- 不做資料儲存，只做流程編排

**Stripe — 付款**
- 訂閱方案管理
- 加購點數包
- Webhook 同步訂閱狀態

### MVP vs Phase 2 功能切割

| 功能 | MVP (Phase 1) | Phase 2 |
|------|:---:|:---:|
| 主題輸入生成影片 | ✅ | |
| 3 種影片長度分級 | ✅ | |
| 風格選擇 (5種) | ✅ | |
| AI 腳本生成 + 預覽 | ✅ | |
| TTS 配音 | ✅ | |
| 任務狀態追蹤 | ✅ | |
| 影片下載 | ✅ | |
| 點數計費系統 | ✅ | |
| Stripe 訂閱 | ✅ | |
| 字幕 (SRT) 生成 | | ✅ |
| 素材上傳（圖片/影片） | | ✅ |
| 自訂語音克隆 | | ✅ |
| 批量生成 | | ✅ |
| API 對外開放 | | ✅ |
| 模板市集 | | ✅ |
| 多語系 | | ✅ |
| 影片分享頁 | ✅ (基礎) | ✅ (進階) |

---

## 三、新的前端頁面規格

### 3.1 影片生成頁 (`/generate`)

**設計原則**：三步驟精靈（Wizard），降低認知負擔

**Step 1 — 基本設定**

| 欄位 | 類型 | 選項 | 必填 | 說明 |
|------|------|------|:---:|------|
| 主題 / Topic | textarea | 自由輸入 | ✅ | 最多 200 字，placeholder 用引導語 |
| 影片長度 | radio card | Flash (15-30s) / Standard (30-60s) / Premium (60-120s) | ✅ | 顯示對應點數消耗 |
| 語言 | select | 中文 / English / 日本語 | ✅ | 影響腳本與配音 |

**Step 2 — 風格設定**

| 欄位 | 類型 | 選項 | 必填 | 說明 |
|------|------|------|:---:|------|
| 視覺風格 | image card grid | cinematic / anime / 3d_cartoon / watercolor / cyberpunk / minimal | ✅ | 每個選項帶預覽圖 |
| 配音 | toggle + select | 開啟/關閉；開啟後選聲音 | 選填 | 預設開啟 |
| 背景音樂 | select | none / upbeat / calm / epic / playful | 選填 | 預設 auto (系統根據風格選) |
| 進階選項 (收合) | collapsible | 語速、色調偏好、品牌色 | 選填 | Phase 2 再完整實作 |

**Step 3 — 腳本預覽與確認**

| 區塊 | 內容 | 操作 |
|------|------|------|
| 影片標題 | AI 生成 | 可編輯 |
| 開場 Hook | AI 生成的第一句吸引人的話 | 可編輯 |
| 分鏡列表 | 每場景：旁白文字 + 畫面描述 | 可編輯每一場 |
| 預估資訊 | 預估秒數、消耗點數、預計完成時間 | 唯讀 |
| 操作按鈕 | 「重新生成腳本」「確認生成影片」 | 確認後扣點 |

**關鍵 UX 細節**：
- 「確認生成」按鈕旁顯示「將消耗 X 點」
- 點數不足時按鈕 disabled，顯示「升級方案」連結
- Flash 等級顯示「約 2-3 分鐘完成」，Standard 顯示「約 5-8 分鐘」

### 3.2 任務狀態頁 (`/jobs`)

**列表檢視**

| 欄位 | 說明 |
|------|------|
| 影片標題 | 顯示 AI 生成標題或主題前 30 字 |
| 狀態徽章 | pending (灰) / processing (藍動畫) / completed (綠) / failed (紅) |
| 進度條 | 分階段：腳本→配音→畫面→合成→完成 (5 段) |
| 影片長度等級 | Flash / Standard / Premium 標籤 |
| 消耗點數 | 顯示本次消耗 |
| 建立時間 | 相對時間 (3 分鐘前) |
| 操作 | 查看詳情 / 下載 (completed) / 重試 (failed) |

**詳情頁** (`/jobs/[id]`)

| 狀態 | 顯示內容 |
|------|----------|
| processing | 五段進度動畫 + 預估剩餘時間 + 「完成後通知我」按鈕 |
| completed | 影片播放器 + 下載按鈕 + 影片資訊 + 腳本展開 + 分享連結 |
| failed | 錯誤訊息 + 「免費重試」按鈕 (失敗不扣點) + 客服連結 |

**Polling 策略**：processing 時每 5 秒輪詢 → 完成後停止

### 3.3 我的作品頁 (`/videos`)

**網格檢視 (預設)**

| 元素 | 說明 |
|------|------|
| 縮圖卡片 | 3 欄 grid，hover 顯示操作按鈕 |
| 篩選 | 按長度等級 / 按狀態 / 按日期 |
| 搜尋 | 搜主題或標題 |
| 排序 | 最新 / 最舊 / 標題 |
| 批量操作 | 多選 + 批量下載 / 批量刪除 |

**單一作品操作**
- 播放預覽
- 下載影片 (MP4)
- 下載字幕 (SRT) — Phase 2
- 重新命名
- 複製（以此為基礎重新生成）
- 分享連結
- 刪除 (soft delete)

### 3.4 定價頁 (`/pricing`)

| 方案 | 月費 | 點數 | 影片長度上限 | 特色功能 |
|------|------|------|-------------|----------|
| Free | $0 | 5 點/月 | Flash only | 720p, 浮水印 |
| Starter | $19 | 50 點/月 | Standard | 1080p, 無浮水印 |
| Pro | $49 | 150 點/月 | Premium | 1080p, 優先佇列, API |
| Enterprise | 聯繫我們 | 自訂 | 自訂 | 白標, 專屬支援 |

顯示元素：方案卡片 + 功能比較表 + FAQ + 年繳折扣 (8折)

### 3.5 帳戶設定頁 (`/settings`)

- 個人資料（名稱、信箱、頭像）
- 目前方案 + 剩餘點數
- 使用紀錄（點數消耗歷程）
- 付款管理（Stripe Portal 連結）
- API Key 管理（Pro 方案）— Phase 2

---

## 四、新的 API 設計

### 4.1 POST `/api/generate` — 建立影片任務

**Request Body**
```json
{
  "topic": "咖啡店的一天",
  "duration_tier": "standard",
  "language": "zh-TW",
  "style": "cinematic",
  "voice_enabled": true,
  "voice_id": "rachel",
  "bgm_mood": "calm",
  "script": {
    "title": "城市裡的咖啡香",
    "hook": "每一杯咖啡，都藏著一個故事",
    "scenes": [
      {
        "scene": 1,
        "narration": "清晨六點，老闆開始磨豆",
        "visual_prompt": "Close-up of coffee beans being ground...",
        "visual_zh": "咖啡豆研磨特寫"
      }
    ]
  }
}
```

**Response (201)**
```json
{
  "success": true,
  "job_id": "uuid-here",
  "credits_consumed": 3,
  "credits_remaining": 47,
  "estimated_duration_minutes": 5
}
```

**Error (402)**
```json
{
  "error": "INSUFFICIENT_CREDITS",
  "required": 3,
  "available": 1,
  "upgrade_url": "/pricing"
}
```

**業務邏輯**：
1. 驗證用戶身份 (Supabase Auth)
2. 驗證方案權限（Free 不能選 Standard/Premium）
3. 計算點數消耗 (Flash=1, Standard=3, Premium=8)
4. 檢查餘額 ≥ 所需點數
5. 建立 video_jobs 紀錄 (status=pending)
6. 扣除點數
7. 記錄 usage_log
8. 發送 Webhook 到 n8n
9. 回傳 job_id

### 4.2 GET `/api/jobs/[id]` — 查詢任務狀態

**Response**
```json
{
  "job_id": "uuid",
  "status": "processing",
  "progress": {
    "current_step": "generating_visuals",
    "steps": [
      { "name": "script", "status": "completed" },
      { "name": "voice", "status": "completed" },
      { "name": "visuals", "status": "in_progress" },
      { "name": "compositing", "status": "pending" },
      { "name": "finalizing", "status": "pending" }
    ]
  },
  "duration_tier": "standard",
  "credits_consumed": 3,
  "created_at": "2026-04-18T10:00:00Z",
  "estimated_completion": "2026-04-18T10:05:00Z"
}
```

**完成後額外欄位**
```json
{
  "status": "completed",
  "video_url": "https://xxx.supabase.co/storage/v1/object/public/videos/xxx.mp4",
  "thumbnail_url": "https://xxx.supabase.co/storage/v1/object/public/thumbnails/xxx.jpg",
  "duration_seconds": 45,
  "srt_url": null,
  "completed_at": "2026-04-18T10:04:30Z"
}
```

### 4.3 GET `/api/videos` — 我的影片列表

**Query Params**: `?status=completed&duration_tier=standard&page=1&limit=20&sort=newest`

**Response**
```json
{
  "videos": [
    {
      "id": "uuid",
      "topic": "咖啡店的一天",
      "custom_title": "城市裡的咖啡香",
      "status": "completed",
      "duration_tier": "standard",
      "duration_seconds": 45,
      "thumbnail_url": "...",
      "video_url": "...",
      "credits_consumed": 3,
      "created_at": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "has_more": true
  }
}
```

### 4.4 GET `/api/plans` — 方案列表

**Response**
```json
{
  "plans": [
    {
      "id": "free",
      "name": "Free",
      "monthly_price": 0,
      "yearly_price": 0,
      "monthly_credits": 5,
      "max_duration_tier": "flash",
      "resolution": "720p",
      "watermark": true,
      "priority_queue": false,
      "api_access": false
    },
    {
      "id": "starter",
      "name": "Starter",
      "monthly_price": 19,
      "yearly_price": 182,
      "monthly_credits": 50,
      "max_duration_tier": "standard",
      "resolution": "1080p",
      "watermark": false,
      "priority_queue": false,
      "api_access": false
    },
    {
      "id": "pro",
      "name": "Pro",
      "monthly_price": 49,
      "yearly_price": 470,
      "monthly_credits": 150,
      "max_duration_tier": "premium",
      "resolution": "1080p",
      "watermark": false,
      "priority_queue": true,
      "api_access": true
    }
  ]
}
```

### 4.5 POST `/api/estimate-cost` — 預估成本

**Request**
```json
{
  "duration_tier": "standard",
  "voice_enabled": true,
  "subtitle_enabled": false
}
```

**Response**
```json
{
  "credits_required": 3,
  "breakdown": {
    "base": 3,
    "voice_addon": 0,
    "subtitle_addon": 0
  },
  "user_credits_remaining": 47,
  "sufficient": true,
  "estimated_minutes": 5
}
```

### 4.6 POST `/api/callback` — n8n 回呼（內部）

維持現有設計，新增欄位：

**Request**
```json
{
  "video_id": "uuid",
  "status": "completed",
  "video_url": "https://...",
  "thumbnail_url": "https://...",
  "duration_seconds": 45,
  "progress_step": "finalizing",
  "render_id": "creatomate-render-id",
  "script_json": {},
  "error_message": null
}
```

**中間進度回呼**（新增）：n8n 在每個步驟完成時都發一次 callback，只更新 progress_step 欄位，前端 polling 就能即時顯示進度。

---

## 五、新的 n8n Workflow 設計

### 總覽

```
Webhook 進件
  │
  ▼
參數標準化 (Code)
  │
  ▼
進度回報：script_started (HTTP)
  │
  ▼
腳本生成 / 使用現成腳本 (IF → OpenAI / Code)
  │
  ▼
進度回報：script_done (HTTP)
  │
  ▼
根據 duration_tier 分流 (IF)
  ├── flash:   3-4 場景, 簡單 prompt
  ├── standard: 5-6 場景, 完整 prompt
  └── premium: 7-8 場景, 精細 prompt
  │
  ▼
畫面 Prompt 生成 (OpenAI)
  │
  ▼
進度回報：voice_started (HTTP)
  │
  ▼
TTS 配音 [可選] (IF → HTTP Request to TTS API)
  │
  ▼
音檔上傳到 Supabase Storage (HTTP)
  │
  ▼
進度回報：visuals_started (HTTP)
  │
  ▼
影片生成 — LTX API (HTTP Request)
  │
  ▼
等待 + 輪詢影片狀態 (Wait + IF Loop)
  │
  ▼
影片上傳到 Supabase Storage (HTTP)
  │
  ▼
進度回報：compositing_started (HTTP)
  │
  ▼
Creatomate 合成最終影片 (HTTP Request)
  │
  ▼
等待 + 輪詢 Render 狀態 (Wait + IF Loop)
  │
  ▼
最終影片上傳到 Supabase Storage (HTTP)
  │
  ▼
Callback 回前端：completed (HTTP)
```

### 逐節點說明

#### 節點 1：Webhook 進件
- 類型：Webhook
- 接收 POST，payload 含所有生成參數
- 回傳 `{ received: true, job_id }` 給前端

#### 節點 2：參數標準化 (Code)
- 將前端送來的各種格式統一
- 根據 `duration_tier` 設定場景數量限制：
  - flash: max_scenes=4, target_seconds=20
  - standard: max_scenes=6, target_seconds=45
  - premium: max_scenes=8, target_seconds=90
- 設定品質參數（解析度、幀率等）
- 驗證必要欄位存在

#### 節點 3：進度回報 — script_started (HTTP Request)
- POST 到 `callback_url`
- Body: `{ video_id, status: "processing", progress_step: "script" }`
- 讓前端即時更新進度條

#### 節點 4：Has Script? (IF)
- 條件：`$json.body.script` 是否存在且有效
- TRUE → 節點 5a (Use Provided Script)
- FALSE → 節點 5b (Generate Script)

#### 節點 5a：Use Provided Script (Code)
- 直接使用前端送來的腳本
- 包裝成標準格式供後續節點使用
- 根據 `max_scenes` 裁切場景數

#### 節點 5b：Generate Script + Prompts (OpenAI)
- System prompt 根據 `duration_tier` 調整：
  - flash: 「生成 3-4 場景的快節奏短腳本，每場景 5-7 秒」
  - standard: 「生成 5-6 場景的完整商業腳本，每場景 7-10 秒」
  - premium: 「生成 7-8 場景的深度敘事腳本，每場景 10-15 秒」
- 輸出：title, hook, narration, scenes[]

#### 節點 6：進度回報 — script_done

#### 節點 7：畫面 Prompt 優化 (OpenAI)
- 將中文場景描述轉為高品質英文 visual prompt
- 根據 `style` 加入風格關鍵詞
- 根據 `duration_tier` 調整 prompt 複雜度

#### 節點 8：Duration Tier 分流 (IF)
- flash → 使用較快的生成模型/較低解析度
- standard → 標準品質
- premium → 最高品質設定

#### 節點 9：TTS 配音 (條件執行)
- IF `voice_enabled === true`
- 呼叫 TTS API（ElevenLabs / OpenAI TTS）
- 輸入：narration 文字 + voice_id
- 輸出：音檔 URL

#### 節點 10：音檔上傳到 Supabase Storage (HTTP)
- PUT 到 Supabase Storage API
- 路徑：`audio/{job_id}/narration.mp3`
- 取得公開 URL

#### 節點 11：進度回報 — visuals_started

#### 節點 12：LTX 影片生成 (HTTP Request)
- 每個場景分別呼叫 LTX API
- 傳入：visual_prompt, duration (根據 tier), resolution
- 取得影片片段 URL

#### 節點 13：等待 + 輪詢 LTX 狀態 (Wait 30s + Loop)
- 每 30 秒檢查一次
- 最多輪詢 20 次（10 分鐘超時）

#### 節點 14：進度回報 — compositing_started

#### 節點 15：Build Creatomate Payload (Code)
- 組合所有素材：影片片段 + 音檔 + BGM
- 根據 `duration_tier` 設定 template
- BGM 從 Supabase Storage 取得（不再用 Pixabay）

#### 節點 16：Creatomate Render (HTTP Request)
- POST 到 Creatomate API
- 傳入完整合成指令

#### 節點 17：等待 + 輪詢 Render 狀態 (Wait 60s + Loop)

#### 節點 18：最終影片上傳 Supabase Storage (HTTP)
- 下載 Creatomate 產出的影片
- 上傳到 `videos/{job_id}/final.mp4`
- 生成縮圖上傳到 `thumbnails/{job_id}/thumb.jpg`

#### 節點 19：Callback — completed (HTTP Request)
- POST 到 `callback_url`
- Body 含 video_url, thumbnail_url, duration_seconds, status

#### 錯誤處理 (Error Trigger)
- 任何節點失敗 → 觸發 Error Workflow
- Callback status=failed + error_message
- 前端收到後自動退還點數

### BGM 處理策略（修復 Pixabay 403 問題）

**短期方案**（立即執行）：
1. 準備 5 個不同風格的 BGM MP3 檔案
2. 上傳到 Supabase Storage 的 `bgm/` bucket
3. Pick BGM 節點改為使用 Supabase Storage 的公開 URL

**長期方案**：
- 建立 BGM 資料庫表，可後台管理
- 支援用戶自訂 BGM 上傳

### 成本控制策略

| 等級 | OpenAI Tokens | TTS 字數 | LTX 秒數 | Creatomate |
|------|:---:|:---:|:---:|:---:|
| Flash | ~500 | ~100 字 | 15-30s | 1 render |
| Standard | ~1000 | ~200 字 | 30-60s | 1 render |
| Premium | ~2000 | ~400 字 | 60-120s | 1 render |

**成本上限保護**：
- n8n Code 節點在開頭計算預估成本
- 超過該等級成本上限 → 拒絕執行，回傳錯誤
- Premium 等級設定每日最大任務數（防止 API 費用失控）

---

## 六、新的資料模型

### profiles 表

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  
  -- 方案與點數
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  credits_remaining INTEGER NOT NULL DEFAULT 5,
  credits_monthly_reset INTEGER NOT NULL DEFAULT 5,  -- 每月重設的點數
  credits_reset_at TIMESTAMPTZ,                       -- 下次重設時間
  
  -- Stripe
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'inactive')),
  
  -- 限制
  max_duration_tier TEXT NOT NULL DEFAULT 'flash'
    CHECK (max_duration_tier IN ('flash', 'standard', 'premium')),
  priority_queue BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### video_jobs 表

```sql
CREATE TABLE video_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  -- 輸入參數
  topic TEXT NOT NULL,
  custom_title TEXT,
  duration_tier TEXT NOT NULL
    CHECK (duration_tier IN ('flash', 'standard', 'premium')),
  language TEXT NOT NULL DEFAULT 'zh-TW',
  style TEXT NOT NULL
    CHECK (style IN ('cinematic', 'anime', '3d_cartoon', 'watercolor', 
                     'cyberpunk', 'vintage_film', 'minimal', 'fantasy')),
  voice_enabled BOOLEAN DEFAULT TRUE,
  voice_id TEXT DEFAULT 'rachel',
  bgm_mood TEXT DEFAULT 'auto'
    CHECK (bgm_mood IN ('none', 'auto', 'upbeat', 'calm', 'epic', 
                         'dramatic', 'playful')),
  subtitle_enabled BOOLEAN DEFAULT FALSE,
  
  -- 腳本
  script_json JSONB,
  
  -- 任務狀態
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress_step TEXT DEFAULT 'queued'
    CHECK (progress_step IN ('queued', 'script', 'voice', 'visuals', 
                              'compositing', 'finalizing', 'done', 'error')),
  error_message TEXT,
  
  -- 成品
  video_url TEXT,
  thumbnail_url TEXT,
  srt_url TEXT,
  duration_seconds INTEGER,
  render_id TEXT,
  
  -- 成本
  credits_consumed INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd DECIMAL(10,4),  -- API 實際成本（內部追蹤）
  actual_cost_usd DECIMAL(10,4),
  
  -- 分享
  is_public BOOLEAN DEFAULT FALSE,
  share_slug TEXT UNIQUE,
  
  -- 時間戳
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,           -- 開始處理的時間
  completed_at TIMESTAMPTZ,         -- 完成的時間
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_video_jobs_user_id ON video_jobs(user_id);
CREATE INDEX idx_video_jobs_status ON video_jobs(user_id, status);
CREATE INDEX idx_video_jobs_created ON video_jobs(user_id, created_at DESC);
CREATE INDEX idx_video_jobs_share ON video_jobs(share_slug) WHERE share_slug IS NOT NULL;
CREATE INDEX idx_video_jobs_deleted ON video_jobs(deleted_at) WHERE deleted_at IS NULL;
```

### plans 表

```sql
CREATE TABLE plans (
  id TEXT PRIMARY KEY,              -- 'free', 'starter', 'pro', 'enterprise'
  name TEXT NOT NULL,
  description TEXT,
  
  -- 價格
  monthly_price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  yearly_price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  stripe_monthly_price_id TEXT,     -- Stripe Price ID
  stripe_yearly_price_id TEXT,
  
  -- 額度
  monthly_credits INTEGER NOT NULL DEFAULT 5,
  max_duration_tier TEXT NOT NULL DEFAULT 'flash'
    CHECK (max_duration_tier IN ('flash', 'standard', 'premium')),
  
  -- 功能
  resolution TEXT NOT NULL DEFAULT '720p',
  watermark BOOLEAN DEFAULT TRUE,
  priority_queue BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  max_concurrent_jobs INTEGER DEFAULT 1,
  
  -- 排序
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 預設方案資料
INSERT INTO plans VALUES
  ('free', 'Free', '免費體驗', 0, 0, NULL, NULL, 5, 'flash', '720p', true, false, false, 1, 0, true, NOW()),
  ('starter', 'Starter', '適合個人創作者', 19, 182, NULL, NULL, 50, 'standard', '1080p', false, false, false, 2, 1, true, NOW()),
  ('pro', 'Pro', '適合專業團隊', 49, 470, NULL, NULL, 150, 'premium', '1080p', false, true, true, 5, 2, true, NOW());
```

### usage_log 表

```sql
CREATE TABLE usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'video_started',      -- 開始生成（扣點）
      'video_completed',    -- 生成完成
      'video_failed',       -- 生成失敗（退點）
      'credits_purchased',  -- 購買點數包
      'credits_monthly',    -- 每月重設
      'plan_upgraded',      -- 升級方案
      'plan_downgraded',    -- 降級方案
      'plan_canceled'       -- 取消訂閱
    )),
  
  credits_delta INTEGER DEFAULT 0,  -- 正數=增加, 負數=消耗
  video_job_id UUID REFERENCES video_jobs(id),
  metadata JSONB,                   -- 額外資訊
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_log_user ON usage_log(user_id, created_at DESC);
```

### credit_packs 表（加購點數包）

```sql
CREATE TABLE credit_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO credit_packs VALUES
  ('pack_10', '10 點', 10, 4.99, NULL, true, 0),
  ('pack_50', '50 點', 50, 19.99, NULL, true, 1),
  ('pack_200', '200 點', 200, 59.99, NULL, true, 2);
```

---

## 七、新的收費模型

### 方案設計

#### Free — 免費試用
- 月費：$0
- 點數：5 點/月（自動重設）
- 限制：僅 Flash (15-30s)、720p、有浮水印
- 目的：讓用戶體驗產品，感受 AI 生成影片的效果
- 轉換策略：生成 3 支以上後提示升級

#### Starter — 個人創作者 ($19/月)
- 月費：$19（年繳 $182，省 $46）
- 點數：50 點/月
- 可用等級：Flash (1點) + Standard (3點)
- 功能：1080p、無浮水印、同時 2 個任務
- 換算：最多 50 支 Flash 或 16 支 Standard
- 目標用戶：自媒體、個人品牌

#### Pro — 專業團隊 ($49/月)
- 月費：$49（年繳 $470，省 $118）
- 點數：150 點/月
- 可用等級：全部（含 Premium 8點）
- 功能：1080p、優先佇列、API 存取、同時 5 個任務
- 換算：最多 150 支 Flash 或 50 支 Standard 或 18 支 Premium
- 目標用戶：行銷代操、小型團隊

#### Enterprise — 企業方案（聯繫報價）
- 自訂點數、白標、專屬客服
- 依年約談

### 加購點數包（適用所有付費方案）

| 名稱 | 點數 | 價格 | 單點價 |
|------|------|------|--------|
| 小包 | 10 點 | $4.99 | $0.50 |
| 中包 | 50 點 | $19.99 | $0.40 |
| 大包 | 200 點 | $59.99 | $0.30 |

### 點數消耗規則

| 影片類型 | 基礎點數 | 說明 |
|----------|---------|------|
| Flash (15-30s) | 1 點 | 含腳本+畫面+配音+合成 |
| Standard (30-60s) | 3 點 | 含腳本+畫面+配音+合成 |
| Premium (60-120s) | 8 點 | 含腳本+畫面+配音+合成 |

**規則**：
- 配音已含在基礎點數，關閉配音不減點（簡化計費）
- 字幕 (STT) Phase 2 上線後另外 +1 點
- 生成失敗自動退還全部點數
- 每月點數到期不累計，加購點數永不過期

### 成本控制

**API 成本估算（per video）**

| 項目 | Flash | Standard | Premium |
|------|-------|----------|---------|
| OpenAI (腳本) | $0.01 | $0.02 | $0.04 |
| TTS (配音) | $0.02 | $0.04 | $0.08 |
| LTX (影片) | $0.05 | $0.15 | $0.40 |
| Creatomate (合成) | $0.04 | $0.04 | $0.04 |
| Supabase Storage | $0.001 | $0.002 | $0.004 |
| **合計** | **~$0.12** | **~$0.25** | **~$0.56** |

**毛利計算**

| 方案 | 用戶每點價值 | 成本/點 | 毛利率 |
|------|-------------|---------|--------|
| Starter ($19/50點) | $0.38 | Flash $0.12 | 68% |
| Starter ($19/50點) | $0.38 | Standard $0.08 | 79% |
| Pro ($49/150點) | $0.33 | Flash $0.12 | 64% |
| Pro ($49/150點) | $0.33 | Premium $0.07 | 79% |

### 長影片限制策略

- Premium (60-120s) 僅 Pro 方案可用
- Premium 每日上限：Pro 方案 5 支/天
- Premium 每月上限：按點數自然限制（150÷8=18支）
- 超過 90 秒的影片加收 50% 點數（12點）— Phase 2
- 佇列優先級：Flash > Standard > Premium（避免長影片卡住短影片）

### 免費試用策略

1. **註冊即送 5 點**，可生成 5 支 Flash 影片
2. **首次升級**：Starter 首月 $9（5折）
3. **邀請獎勵**：每邀請 1 人註冊送 5 點
4. **功能限制驅動**：免費版 720p + 浮水印，形成明確差異

---

## 八、我現在應優先修改的重點

### 舊模式最大問題

1. **沒有秒數分級**：所有影片同質化，無法做差異定價
2. **收費按「支數」不按「資源」**：1 支 15 秒和 1 支 120 秒收同樣的 1 credit，成本差 5 倍
3. **前端沒有引導分流**：用戶不知道該選什麼，產品沒有策略性引導
4. **BGM 依賴外部不穩定來源**：Pixabay 403 直接導致全部 render 失敗
5. **沒有進度回報**：用戶只能看到 processing，不知道跑到哪一步

### 新模式核心調整

1. 點數制取代支數制（不同長度消耗不同點數）
2. 三級影片分流（Flash / Standard / Premium）
3. 前端三步驟精靈取代單頁表單
4. n8n Workflow 加入分流 + 中間進度回報
5. 自建 BGM 存到 Supabase Storage

### MVP 優先做的 3 件事

#### 第 1 優先：修復 BGM + 確保 pipeline 完整可用
- 上傳 BGM 到 Supabase Storage
- 更新 n8n Pick BGM 節點使用 Supabase URL
- 跑一次完整 end-to-end 測試確認影片能正常生成
- **預估工時**：2-3 小時
- **為什麼優先**：如果 pipeline 跑不通，其他都是空談

#### 第 2 優先：資料庫 + API 加入 duration_tier
- 新增 `duration_tier` 欄位到 video_jobs 表
- 修改 `credits_remaining` 扣點邏輯（1/3/8）
- 修改 `/api/generate` 加入 duration_tier 參數
- 更新 plans 表加入 `max_duration_tier`
- **預估工時**：3-4 小時
- **為什麼優先**：這是新商業模式的基礎，所有功能都建在這上面

#### 第 3 優先：前端生成頁改版
- 改成三步驟精靈 UI
- Step 1 加入影片長度選擇（顯示點數）
- 顯示用戶剩餘點數和方案限制
- 點數不足時顯示升級提示
- **預估工時**：4-5 小時
- **為什麼優先**：用戶直接感知到的產品體驗改變

### 後續優先序

4. n8n Workflow 加入 duration_tier 分流邏輯
5. 中間進度回報機制
6. 定價頁更新（點數制）
7. 加購點數包 + Stripe 整合
8. 字幕功能 (Phase 2)

---

## 附錄：從現在到 MVP 的執行路線圖

```
Week 1：修復 + 基礎改造
├── Day 1-2: 修復 BGM → pipeline 完整可跑
├── Day 3-4: DB migration (duration_tier + credits 新邏輯)
└── Day 5:   API 改版 (/generate 支援 duration_tier)

Week 2：前端改版
├── Day 1-3: 生成頁三步驟精靈 UI
├── Day 4:   任務狀態頁改版 (進度條)
└── Day 5:   我的作品頁改版

Week 3：商業化
├── Day 1-2: 定價頁改版 (新方案 + 點數)
├── Day 3-4: Stripe 整合 (新價格 + 點數包)
└── Day 5:   n8n Workflow 分流邏輯

Week 4：測試 + 上線
├── Day 1-2: End-to-end 測試 (三種長度各跑一次)
├── Day 3:   Bug fix + 效能優化
├── Day 4:   Landing page 更新
└── Day 5:   正式上線 🚀
```
