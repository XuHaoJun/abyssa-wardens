# Abyssal Wardens - 開發 ROADMAP

## 執行順序規劃

遵循 **「內容 → 數值 → 關卡 → 遭遇戰」** 的邏輯依賴關係。

---

## Phase 1: CDD 內容設計 (Content Design)

**目標：** 定義遊戲的核心角色與藝術風格

### 1.1 英雄設計 (heroes/)
| 順序 | 狀態 | 檔案 | 說明 |
|:----:|:----:|------|------|
| 1 | [x] | `CDD/heroes/機甲軍工師.md` | 定義技能組、背景故事、美術需求 |
| 2 | [x] | `CDD/heroes/虛空血法師.md` | 定義技能組、背景故事、美術需求 |

### 1.2 幹員設計 (operators/)
| 順序 | 狀態 | 檔案 | 說明 |
|:----:|:----:|------|------|
| 3 | [x] | `CDD/operators/operator-list.md` | 12 種幹員清單與分類 |
| 4 | [x] | `CDD/operators/operators-detail.md` | 每種幹員的詳細設計 |

### 1.3 美術需求 (art-requirements/)
| 順序 | 狀態 | 檔案 | 說明 |
|:----:|:----:|------|------|
| 5 | [x] | `CDD/art-requirements/hero-models.md` | 英雄 3D 模型規格 |
| 6 | [x] | `CDD/art-requirements/operator-models.md` | 幹員 3D 模型規格 |
| 7 | [ ] | `CDD/art-requirements/ui-layout.md` | UI 介面佈局規格 |

---

## Phase 2: Balance 數值企劃 (Stats & Data)

**目標：** 建立裝備、寶石、天賦的數據庫

> **依賴：** Phase 1 完成的英雄與幹員設計

### 2.1 寶石數據 (gems/)
| 順序 | 狀態 | 檔案 | 說明 |
|:----:|:----:|------|------|
| 8 | [ ] | `balance/gems/skills.json` | 10 顆主動技能石數據 |
| 9 | [ ] | `balance/gems/supports.json` | 15 顆輔助寶石數據 |
| 10 | [ ] | `balance/gems/operators.json` | 12 種陣地石 (幹員) 數據 |

### 2.2 裝備數據 (items/)
| 順序 | 狀態 | 檔案 | 說明 |
|:----:|:----:|------|------|
| 11 | [ ] | `balance/items/weapons.json` | 武器基礎屬性與詞綴池 |
| 12 | [ ] | `balance/items/armors.json` | 防具基礎屬性與詞綴池 |
| 13 | [ ] | `balance/items/legendaries.json` | 20 件傳奇裝備設計 |

### 2.3 天賦與敵人 (talents / enemies)
| 順序 | 狀態 | 檔案 | 說明 |
|:----:|:----:|------|------|
| 14 | [ ] | `balance/talents/constellation.json` | 星盤天賦節點數據 |
| 15 | [ ] | `balance/enemies/base.json` | 10 種基礎敵人數據 |
| 16 | [ ] | `balance/enemies/elites.json` | 5 種精英詞綴數據 |
| 17 | [ ] | `balance/drops/drop-table.json` | 掉落率權重配置 |

---

## Phase 3: Levels 關卡設計 (Level Design)

**目標：** 設計地圖與部署點配置

> **依賴：** Phase 1 的幹員設計（決定高台/平地需求）

### 3.1 地圖設計 (maps/)
| 順序 | 狀態 | 檔案 | 說明 |
|:----:|:----:|------|------|
| 18 | [ ] | `levels/maps/廢棄礦坑.md` | 白盒配置、怪物路線、高台位置 |
| 19 | [ ] | `levels/maps/腐化森林.md` | 白盒配置、怪物路線、高台位置 |
| 20 | [ ] | `levels/maps/星曜神殿.md` | 白盒配置、怪物路線、高台位置 |

### 3.2 地形與部署 (deployment / terrain)
| 順序 | 狀態 | 檔案 | 說明 |
|:----:|:----:|------|------|
| 21 | [ ] | `levels/deployment/tile-config.md` | 平地/高台網格規則 |
| 22 | [ ] | `levels/terrain/traps.md` | 陷阱與環境機制 |

---

## Phase 4: Encounters 遭遇戰配置 (Wave & Boss)

**目標：** 設計波次與 Boss 戰

> **依賴：** Phase 2 的敵人數據 + Phase 3 的地圖配置

### 4.1 波次配置 (waves/)
| 順序 | 狀態 | 檔案 | 說明 |
|:----:|:----:|------|------|
| 23 | [ ] | `encounters/waves/tutorial-waves.md` | 教學關波次設計 |
| 24 | [ ] | `encounters/waves/main-waves.md` | 主線關卡波次配置 |

### 4.2 Boss 戰 (bosses/)
| 順序 | 狀態 | 檔案 | 說明 |
|:----:|:----:|------|------|
| 25 | [ ] | `encounters/bosses/莫拉斯.md` | Uber Boss 完整階段設計 |
| 26 | [ ] | `encounters/bosses/守門Boss.md` | 中型守門 Boss 設計 |

---

## Phase 5: 整合與驗收

| 順序 | 狀態 | 項目 | 說明 |
|:----:|:----:|------|------|
| 27 | [ ] | GDD v0.1.0 | 整合所有附屬文件，更新版本 |
| 28 | [ ] | Tech Prototype | 工程師產出可玩原型 |
| 29 | [ ] | CBT 準備 | 確認 10~15 小時遊戲體驗 |

---

## 備註

- **CDD** 產出主要為 `.md` 文件，供美術/動畫師參考
- **Balance** 產出主要為 `.json`/`.csv` 文件，供程式直接讀取
- **Levels** 產出為 `.md` + 關卡配置圖，供關卡設計師使用
- **Encounters** 產出為 `.md` + 數據表，供 AI/戰鬥設計師使用

---

*Last Updated: 2026-02-22*
