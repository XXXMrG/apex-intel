# 数据来源、署名与许可

## The Apex Legends Wiki

英雄、技能、武器与地图的部分结构化事实来自 The Apex Legends Wiki：

- https://apexlegends.wiki.gg/
- API 返回的许可：Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
- https://creativecommons.org/licenses/by-nc-sa/4.0/

每条生产数据均保存具体页面 URL、revision/oldid 与抓取时间。基于这些内容形成的数据整理同样按 CC BY-NC-SA 4.0 提供，使用时必须保留署名、非商业及相同方式共享条件。

若项目未来加入广告、赞助、付费功能或其他商业化，应先替换该数据来源或获得额外许可。

## Electronic Arts / Respawn

EA 官方新闻来源：

- https://www.ea.com/games/apex-legends/apex-legends/news

本站只聚合新闻元数据和原文链接，不复制完整文章。EA、Respawn、Apex Legends、角色、地图、武器、标识与官方素材的权利归其各自权利人所有。本站不声称获得这些内容的所有权，也不暗示官方背书。

新闻图片 URL 指向 EA 官方内容分发资源；其使用不受本仓库 MIT 代码许可证覆盖。

## 本地游戏图片资源

英雄立绘、技能图标、武器图、地图图与配件图标从 The Apex Legends Wiki 的具体文件页同步，并在 `src/data/media-manifest.json` 中保存源文件页、源 SHA-1、尺寸、同步时间和本地 SHA-256。生产页面使用仓库内 `public/media/apex/` 的优化副本，不在用户浏览时热链或抓取 Wiki。

这些图片描绘 EA / Respawn 的游戏角色、物品与场景；其著作权、商标及其他权利仍归 Electronic Arts、Respawn 及相关权利人所有。图片不受本仓库 MIT 代码许可证覆盖，也不因由 Wiki 托管而自动变成本站可自由再许可的原创内容。本站仅将其用于非官方游戏资料索引与识别，并保留逐文件来源链接。

## 中文编辑层

简体中文说明属于本站基于固定来源快照制作的非官方编辑翻译，目的仅为方便中文检索。英文原文、具体 revision 与 EA 原文链接仍是核验依据。

## 代码

项目原创代码按仓库根目录 `LICENSE` 中的 MIT License 发布。MIT License 不覆盖第三方数据、商标、新闻元数据、官方图片或游戏素材。
