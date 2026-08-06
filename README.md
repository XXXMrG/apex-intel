# APEX INTEL

中文 Apex Legends 静态资料与官方情报索引。采用红、黑、米白“战术档案”视觉，部署目标为 Netlify。

> 非官方社区项目，不隶属于 Electronic Arts 或 Respawn Entertainment。

## 当前快照

- 28 位英雄、84 项核心技能、112 项蓝甲／紫甲护甲天赋
- 29 把当前武器，覆盖 7 个分类
- 5 种 Season 30 腐化配件，记录官方效果方向、兼容范围与可审计实机属性卡示例
- 34 个 BR、Mixtape、训练、历史 Arenas 与限时地图记录
- 28 张英雄立绘、84 个技能图标、29 张武器图、34 张地图图与 22 个配件图标，全部随站点本地托管
- EA 官方新闻完整分页索引：117 条列表记录 + 1 条独立 featured，按 slug 去重共 118 条
- 每条 Wiki 数据保留来源 URL、抓取时间与 revision/oldid

快照对应 **Season 30 · Marked / 30.0**，核验日期为 **2026-08-06**。站内“当前”表示该次静态核验；地图轮换与活动日程按官方已发布计划记录，不冒充实时接口。

## 本地运行

要求：Node.js 22、Python 3，以及 `requirements-data.txt` 中的数据生成依赖。重新同步图片时还需安装 `cwebp`。

```bash
npm ci
python3 -m pip install -r requirements-data.txt
npm run build
npm run preview
```

访问 `http://localhost:4173`。

## 数据更新与审计

```bash
npm run data:generate
npm run media:sync
npm run data:audit
npm run typecheck
npm run build
```

`data:generate` 默认抓取最新 Wiki 快照，再应用 `scripts/apply-season-30.py` 中的 EA 30.0 上线编辑层。仅在明确需要离线复现研究缓存时使用：

```bash
APEX_DATA_OFFLINE=1 npm run data:generate
```

生产构建会自动执行数据完整性审计与 TypeScript 检查。审计覆盖：

- 记录数量与分类数量
- 唯一 ID
- 英雄三项核心技能与 28 × 4 护甲天赋矩阵
- Season 30 赛季、武器、地图轮换与五种腐化配件约束
- 必填字段
- Wiki revision
- 新闻完整分页与日期倒序
- 未解析 Wiki 标记
- 图片分类覆盖、文件存在性、来源信息、本地 SHA-256 与跨条目重复内容

研究报告位于 `research/`。

## 架构

- React 19 + TypeScript
- Wouter
- Webpack 5
- 构建期版本化 JSON
- Netlify 静态托管、SPA fallback 与 Netlify Forms
- 无登录、账号绑定、数据库、Functions 或玩家追踪

## 数据来源与许可

详见 [DATA-LICENSE.md](./DATA-LICENSE.md)。Wiki 结构化文本受 **CC BY-NC-SA 4.0** 约束；EA 新闻仅聚合标题、摘要、日期、图片 URL 与原文链接。

代码按 [MIT License](./LICENSE) 发布。数据、商标、游戏素材和第三方内容不因代码许可证而重新授权。
