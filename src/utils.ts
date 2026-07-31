export const classNames = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

export const formatDate = (value?: string | null) => {
  if (!value) return '未知日期'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

export const formatVerifiedAt = (value?: string | null) => {
  if (!value) return '待核验'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export const normalizeSearch = (value: string) => value.trim().toLocaleLowerCase('zh-CN')

export const matchesSearch = (fields: Array<string | number | null | undefined>, query: string) => {
  const normalized = normalizeSearch(query)
  if (!normalized) return true
  return fields.some((field) => String(field ?? '').toLocaleLowerCase('zh-CN').includes(normalized))
}

export const initials = (value: string) => value
  .split(/[\s.-]+/)
  .map((part) => part[0])
  .filter(Boolean)
  .slice(0, 2)
  .join('')
  .toUpperCase()
