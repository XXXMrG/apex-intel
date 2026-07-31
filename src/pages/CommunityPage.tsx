import { useState, type FormEvent } from 'react'
import { PageHeader } from '../components/Common'

const communityLinks = [
  {
    code: 'DISCUSS',
    title: '本站 GitHub Discussions',
    description: '讨论资料结构、版本更新和产品建议。使用 GitHub 账号参与，本站不保存账号数据。',
    url: 'https://github.com/XXXMrG/apex-intel/discussions',
  },
  {
    code: 'OFFICIAL',
    title: 'EA Apex Legends Forums',
    description: '官方论坛与玩家反馈入口，适合问题报告和版本讨论。',
    url: 'https://forums.ea.com/category/apex-legends-en',
  },
  {
    code: 'REDDIT',
    title: 'r/apexlegends',
    description: '大型英文玩家社区。第三方内容不代表本站或 EA 立场。',
    url: 'https://www.reddit.com/r/apexlegends/',
  },
  {
    code: 'WIKI',
    title: 'Apex Legends Wiki',
    description: '社区维护的详细资料站，也是本项目结构化事实的重要核验来源。',
    url: 'https://apexlegends.wiki.gg/',
  },
  {
    code: 'ALGS',
    title: 'Apex Legends Global Series',
    description: '官方电竞赛事、赛程与公告入口。',
    url: 'https://www.ea.com/games/apex-legends/compete',
  },
]

type SubmitState = 'idle' | 'sending' | 'success' | 'error'

export function CommunityPage() {
  const [state, setState] = useState<SubmitState>('idle')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('sending')
    const form = event.currentTarget
    try {
      const formData = new FormData(form)
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(Array.from(formData.entries()).map(([key, value]) => [key, String(value)])).toString(),
      }).then((response) => {
        if (!response.ok) throw new Error(`Form submission failed: ${response.status}`)
      })
      form.reset()
      setState('success')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="community-page">
      <PageHeader
        eyebrow="COMMUNITY RELAY / NO SITE ACCOUNT"
        title="社区情报站"
        description="本站不建立账号系统。公开讨论交给 GitHub Discussions；新闻线索和数据纠错通过 Netlify Forms 接收。"
        meta={<span className="heading-meta">STATIC-FIRST · PRIVACY-LEAN</span>}
      />

      <section className="community-manifesto">
        <div><span>01</span><h2>不造一个空社区</h2><p>没有伪造帖子、点赞或在线人数。社区入口全部指向真实平台。</p></div>
        <div><span>02</span><h2>不保存站内身份</h2><p>本站无注册、登录、Cookie 画像和玩家绑定。</p></div>
        <div><span>03</span><h2>把纠错变成流程</h2><p>每条提交进入 Netlify 表单后台，核验通过后才更新静态数据。</p></div>
      </section>

      <section className="community-layout">
        <div className="community-directory">
          <header><span className="eyebrow">VERIFIED DESTINATIONS</span><h2>社区入口</h2></header>
          {communityLinks.map((item, index) => (
            <a key={item.code} href={item.url} target="_blank" rel="noreferrer" className="community-link">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <small>{item.code}</small>
              <div><h3>{item.title}</h3><p>{item.description}</p></div>
              <b>↗</b>
            </a>
          ))}
        </div>

        <div className="tip-console">
          <header><span className="eyebrow">FIELD REPORT</span><h2>提交新闻线索 / 数据纠错</h2><p>不需要账号。请附上可公开核验的来源链接。</p></header>
          <form
            name="community-tip"
            method="POST"
            data-netlify="true"
            netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="form-name" value="community-tip" />
            <p className="visually-hidden"><label>不要填写：<input name="bot-field" /></label></p>
            <label>
              <span>提交类型</span>
              <select name="type" required defaultValue="数据纠错">
                <option>数据纠错</option>
                <option>官方新闻线索</option>
                <option>社区资源推荐</option>
                <option>功能建议</option>
              </select>
            </label>
            <label>
              <span>来源链接</span>
              <input type="url" name="sourceUrl" placeholder="https://..." required />
            </label>
            <label>
              <span>说明</span>
              <textarea name="message" rows={5} placeholder="说明需要修正或收录的内容" required maxLength={1200} />
            </label>
            <label>
              <span>联系方式 <small>选填</small></span>
              <input name="contact" placeholder="GitHub / Discord / Email" maxLength={160} />
            </label>
            <button className="action-primary" type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? '正在发送…' : '发送现场报告'} <span>→</span>
            </button>
            <p className={`form-status status-${state}`} role="status">
              {state === 'success' && '已提交。我们会先核验来源，再更新资料。'}
              {state === 'error' && '提交失败。请稍后重试，或前往 GitHub Discussions。'}
            </p>
          </form>
        </div>
      </section>
    </div>
  )
}
