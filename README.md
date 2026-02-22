# Abyssal Wardens - 深淵守衛：星曜詩篇

一款結合 ARPG 動作砍殺與塔防策略的創新刷寶遊戲。融合《暗黑破壞神》的狂熱刷寶、《流亡黯道》的無限流派構築，以及《明日方舟》與《王國守衛戰》的塔防大局觀。

---

## 專案狀態

- **GDD 版本:** v0.0.1
- **當前階段:** 設計階段
- **目標:** CBT 封閉測試

---

## 專案結構

```
abyssa-wardens-repo/
└── docs/
    ├── GDD/                      # 遊戲設計文檔
    │   └── GDD-0.0.1.md
    │
    ├── CDD/                      # 內容設計書 (Content Design)
    │   ├── heroes/               # 英雄設計
    │   ├── operators/            # 幹員設計
    │   ├── art-requirements/     # 美術需求規格
    │   └── story/                # 世界觀與劇情
    │
    ├── balance/                  # 數值企劃資料庫
    │   ├── items/                # 裝備數據
    │   ├── gems/                 # 寶石數據
    │   ├── talents/              # 天賦星盤
    │   ├── enemies/              # 敵人數據
    │   └── drops/                # 掉落率配置
    │
    ├── levels/                   # 關卡設計書 (LDD)
    │   ├── maps/                 # 地圖設計
    │   ├── deployment/           # 部署點配置
    │   └── terrain/               # 地形配置
    │
    └── encounters/               # 遭遇戰與波次配置
        ├── waves/                # 波次配置
        └── bosses/               # Boss 戰配置
```

---

## 核心設計支柱

1. **動態防禦 (Dynamic TD)** - 英雄走位 + 塔防部署的即時微操
2. **萬物皆可刷 (Loot is King)** - 裝備、寶石、幹員全由打怪掉落
3. **共鳴構築 (Resonance Build)** - 英雄與塔共用裝備插槽連線
4. **可控的護肝打造 (Deterministic Craft)** - 碎片與張力系統

---

## 聯絡

開發團隊：Abyssal Wardens Development Team
