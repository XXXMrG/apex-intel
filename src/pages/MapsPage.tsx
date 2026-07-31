import { useEffect, useMemo, useState } from 'react'
import { useSearch } from 'wouter'
import { DatabaseToolbar, EmptyState, PageHeader } from '../components/Common'
import { DetailDrawer } from '../components/DetailDrawer'
import { maps } from '../data'
import type { MapRecord } from '../types'
import { formatDate, matchesSearch } from '../utils'

export function MapsPage() {
  const search = useSearch()
  const [query, setQuery] = useState('')
  const [selectedMode, setSelectedMode] = useState('全部')
  const [selectedMap, setSelectedMap] = useState<MapRecord | null>(null)

  const modes = ['全部', 'BR', 'Mixtape', 'Arenas', '训练', '历史 / 限时']
  const filtered = useMemo(() => maps.items.filter((map) => {
    const modeMatch = selectedMode === '全部'
      || (selectedMode === 'BR' && map.mode.includes('Battle Royale'))
      || (selectedMode === 'Mixtape' && map.status.startsWith('当前模式地图'))
      || (selectedMode === 'Arenas' && map.mode.includes('Arenas'))
      || (selectedMode === '训练' && map.mode.includes('Training'))
      || (selectedMode === '历史 / 限时' && /已退役|历史|限时/.test(map.status))
    return modeMatch && matchesSearch([map.name, map.nameZh, map.mode, map.status, map.description, map.descriptionZh], query)
  }), [query, selectedMode])

  useEffect(() => {
    const params = new URLSearchParams(search)
    const target = params.get('map')
    if (target) setSelectedMap(maps.items.find((map) => map.id === target) ?? null)
  }, [search])

  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setSelectedMap(null)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  return (
    <div className="database-page">
      <PageHeader
        eyebrow="THEATER INDEX / ALL MAP RECORDS"
        title="地图数据库"
        description="大逃杀、Mixtape、训练与历史竞技场地图分层归档；轮换状态以核验快照为准，不冒充实时轮换。"
        meta={<span className="heading-meta">{maps.items.length} MAP RECORDS</span>}
      />
      <DatabaseToolbar
        query={query}
        onQueryChange={setQuery}
        queryLabel="搜索地图、模式或状态"
        options={modes}
        selected={selectedMode}
        onSelectedChange={setSelectedMode}
        resultCount={filtered.length}
      />

      {filtered.length ? (
        <section className="map-grid" aria-live="polite">
          {filtered.map((map, index) => (
            <button className="map-card" type="button" key={map.id} onClick={() => setSelectedMap(map)}>
              <div className="map-graphic" aria-hidden="true">
                <i /><i /><i /><span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="map-card-copy">
                <div><span>{map.mode}</span><small>{map.status}</small></div>
                <h2>{map.nameZh || map.name}</h2>
                {map.nameZh && <p>{map.name}</p>}
                <b>打开地图档案 ↗</b>
              </div>
            </button>
          ))}
        </section>
      ) : <EmptyState />}

      <DetailDrawer
        open={Boolean(selectedMap)}
        onClose={() => setSelectedMap(null)}
        eyebrow={selectedMap ? `${selectedMap.mode.toUpperCase()} MAP` : 'MAP'}
        title={selectedMap ? `${selectedMap.nameZh ? `${selectedMap.nameZh} / ` : ''}${selectedMap.name}` : ''}
        subtitle={selectedMap?.descriptionZh ?? selectedMap?.description}
        sourceUrl={selectedMap?.source.url}
      >
        {selectedMap && (
          <>
            <dl className="fact-line">
              <div><dt>模式</dt><dd>{selectedMap.mode}</dd></div>
              <div><dt>状态</dt><dd>{selectedMap.status}</dd></div>
              <div><dt>发布日期</dt><dd>{formatDate(selectedMap.releaseDate)}</dd></div>
            </dl>
            <div className="map-coordinate-panel" aria-hidden="true">
              <div className="coordinate-radar"><i /><i /><i /></div>
              <span>ARCHIVE / {selectedMap.id.toUpperCase()}</span>
              <b>{maps.meta.gameVersion}</b>
            </div>
            <p className="drawer-note">当前站点记录地图基础资料与版本状态。实时轮换需要单独接入可用的轮换接口，此页不会把静态快照伪装成实时数据。</p>
          </>
        )}
      </DetailDrawer>
    </div>
  )
}
