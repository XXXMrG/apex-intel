import { Link } from '../components/AppLink'

export function NotFoundPage() {
  return (
    <div className="not-found">
      <span>404 / SIGNAL LOST</span>
      <h1>这条航线不存在。</h1>
      <p>返回资料总览，或从左侧导航重新选择目标。</p>
      <Link className="action-primary" to="/">返回总览 <b>→</b></Link>
    </div>
  )
}
