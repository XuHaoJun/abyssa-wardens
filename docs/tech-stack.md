# 開發技術選型建議

## 🗣️ 內部討論紀錄 (Internal Discussion Record)

**任務：** 為 Abyssal Wardens 選擇開發技術棧

**與會者：**
- 🔥 **Diablo 代表** — 敘事深度、黑暗氛圍、裝備驅動
- ⚡ **PoE 代表** — 系統複雜度、build 可能性
- 🛡️ **Arknights 代表** — 策略性塔位、角色魅力
- 🏰 **Kingdom Rush 代表** — 塔防核心樂趣、平衡性

---

## 1. 遊戲引擎

### 🔥 Diablo 代表建議：Unreal Engine 5

**理由：**
- 強大的渲染管線，完美呈現「Dark Sci-Fantasy」視覺風格
- 內建 Blueprints，適合快速迭代
- 對 ARPG 類型的支援成熟
- 更強的畫面表現力

**缺點：**
- 學習曲線較高
- 打包體積較大

---

### ⚡ PoE 代表建議：Unity

**理由：**
- 跨平台發布能力強（PC/Mobile/Switch）
- Asset Store 生態豐富
- C# 腳本對工程師友善
- 適合處理複雜的數據驅動系統

**缺點：**
- 需要較多優化工作
- 渲染需要額外調整

---

### 🛡️ Arknights 代表建議：Unity + Lua (或是 Godot)

**理由：**
- 行動裝置優化重要（考慮未來手機版）
- 熱更新能力關鍵
- 開發效率優先

**缺點：**
- 機能受限

---

### 🏰 Kingdom Rush 代表建議：Unity

**理由：**
- 足夠應對 2.5D 俯視角遊戲
- 、社群資源豐富
- 2D/3D 混用靈活

**缺點：**
- 同上

---

## 2. 伺服器架構

### 建議方案：客戶端-伺服器架構

| 組件 | 技術選型 |
|------|-----------|
| 遊戲伺服器 | Golang / Node.js |
| 資料庫 | PostgreSQL + Redis |
| 即時通訊 | WebSocket |
| 檔案存儲 | S3 / CDN |
| 拍賣行 | 獨立微服務 |

---

## 3. 數據存儲

| 數據類型 | 存儲方案 |
|----------|-----------|
| 玩家資料 | PostgreSQL |
| 物品/裝備 | PostgreSQL + JSON |
| 快取數據 | Redis |
| 日誌 | ELK Stack |
| 文件存儲 | S3 |

---

## 4. 開發工具

| 用途 | 工具 |
|------|------|
| 版本控制 | Git + GitHub |
| 專案管理 | Jira / Notion |
| 美術協作 | Figma |
| 3D 模型 | Blender / Maya |
| 2D 美術 | Photoshop / Aseprite |
| UI 設計 | Figma |

---

## 5. 最終建議

### 綜合四個團隊的建議：

| 項目 | 建議選擇 |
|------|-----------|
| **遊戲引擎** | **Unity** (跨平台 + C# + 生態) |
| **伺服器** | **Golang** (高效能 + 並發) |
| **資料庫** | **PostgreSQL + Redis** |
| **即時通訊** | **WebSocket** |
| **部署** | **Docker + Kubernetes** |

---

## 6. 選擇 Unity 的關鍵原因

1. **團隊熟悉度** — 大多數開發者有 Unity 經驗
2. **跨平台** — 一套程式碼發布多平台
3. **數據驅動** — 容易對接 JSON/CSV 數據表
4. **社區資源** — TD/ARPG 相關插件豐富

---

*文檔狀態：討論完成 ✅*
