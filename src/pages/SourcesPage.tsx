import { Link } from '../components/AppLink'
import { attachments, dataSnapshot, legends, maps, news, season, weapons } from '../data'
import { formatVerifiedAt } from '../utils'

const datasets = [
  { code: 'S30', title: '赛季 30.0 规则', dataset: season, countLabel: `${season.highlights.length} 组已上线改动` },
  { code: 'LG', title: '英雄与技能', dataset: legends, countLabel: `${legends.items.length} 英雄 / ${dataSnapshot.counts.abilities} 核心技能` },
  { code: 'UP', title: '英雄护甲天赋', dataset: legends, countLabel: `${dataSnapshot.counts.upgrades} 项 / 蓝紫甲各二选一` },
  { code: 'WP', title: '枪械', dataset: weapons, countLabel: `${weapons.items.length} 件武器` },
  { code: 'AT', title: '腐化配件', dataset: attachments, countLabel: `${attachments.items.length} 件 / 精确属性卡示例` },
  { code: 'MP', title: '地图', dataset: maps, countLabel: `${maps.items.length} 张地图记录` },
  { code: 'RX', title: '官方新闻', dataset: news, countLabel: `${news.items.length} 条完整分页及 featured 记录` },
]

export function SourcesPage() {
  return (
    <div className="sources-page">
      <header className="sources-hero">
        <span className="eyebrow">PROVENANCE / COMPLETENESS / LICENSE</span>
        <h1>数据来源与完整性</h1>
        <p>“全量”必须绑定版本、范围和核验日期。本页公开每个数据集的口径、来源与已知限制。</p>
        <Link to="/">← 返回总览</Link>
      </header>

      <section className="snapshot-card">
        <div><span>CURRENT SNAPSHOT</span><b>{dataSnapshot.season}</b></div>
        <div><span>VERIFIED AT</span><b>{formatVerifiedAt(dataSnapshot.verifiedAt)}</b></div>
        <div><span>STATIC RECORDS</span><b>{dataSnapshot.counts.legends + dataSnapshot.counts.upgrades + dataSnapshot.counts.weapons + dataSnapshot.counts.attachments + dataSnapshot.counts.maps + dataSnapshot.counts.news}</b></div>
        <i />
      </section>

      <section className="source-ledger">
        {datasets.map((item, index) => (
          <article key={item.code}>
            <span className="source-number">0{index + 1}</span>
            <div className="source-title"><small>{item.code}</small><h2>{item.title}</h2></div>
            <dl>
              <div><dt>记录范围</dt><dd>{item.countLabel}</dd></div>
              <div><dt>版本</dt><dd>{item.dataset.meta.gameVersion}</dd></div>
              <div><dt>抓取时间</dt><dd>{formatVerifiedAt(item.dataset.meta.fetchedAt)}</dd></div>
              <div><dt>主来源</dt><dd>{item.dataset.meta.sourceName}</dd></div>
              {item.dataset.meta.license && <div><dt>数据许可</dt><dd>{item.dataset.meta.license}</dd></div>}
            </dl>
            <a href={item.dataset.meta.sourceUrl} target="_blank" rel="noreferrer">打开主来源 ↗</a>
          </article>
        ))}
      </section>

      <section className="scope-grid">
        <article>
          <span className="eyebrow">SCOPE 01</span>
          <h2>什么叫“全量”</h2>
          <ul>
            <li>英雄：当前正式可用名册，每位 3 项核心技能与 4 项护甲升级天赋。</li>
            <li>枪械：当前武器目录的 7 个分类，不包含投掷物和活动限定变体。</li>
            <li>腐化配件：30.0 正式上线的 5 种，兼容范围按武器槽位计算；精确示例保留属性卡来源。</li>
            <li>地图：当前与历史正式地图，按大逃杀、Mixtape/其他、竞技场历史分类。</li>
            <li>新闻：EA API 完整分页列表及独立 featured，按 slug 去重，不复制全文。</li>
          </ul>
        </article>
        <article>
          <span className="eyebrow">SCOPE 02</span>
          <h2>不会伪装成实时</h2>
          <ul>
            <li>地图轮换、复制器轮换等高频数据未接入时，只展示静态状态。</li>
            <li>补丁后数据可能变化，页面始终展示核验时间。</li>
            <li>来源缺少的数据字段显示“—”，不通过推测补齐。</li>
            <li>发现错误可在社区页提交公开来源，核验后再更新。</li>
          </ul>
        </article>
        <article>
          <span className="eyebrow">LICENSE</span>
          <h2>许可与品牌说明</h2>
          <p>EA 官方新闻仅聚合标题、摘要、发布日期、图片链接与原文地址。社区 Wiki 衍生描述和结构化数据按其页面许可署名；代码许可与数据许可分开管理。</p>
          <p>英雄、技能、枪械、地图与配件图片使用站内优化副本，逐项保留 Wiki 文件来源和校验值，不在用户浏览时抓取第三方页面。</p>
          <p>简体中文说明是本站基于固定来源快照制作的非官方编辑翻译；具体事实以页面保存的英文来源和 revision 为准。</p>
          <p>Apex Legends、相关角色、图像和标志均为 Electronic Arts Inc. 的商标或版权内容。本项目为非官方社区项目。</p>
          <a href="https://apexlegends.wiki.gg/wiki/Apex_Legends_Wiki:Copyrights" target="_blank" rel="noreferrer">Wiki 版权说明 ↗</a>
        </article>
      </section>
    </div>
  )
}
