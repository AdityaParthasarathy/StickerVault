import type { FC } from 'react'
import type { SortOrder } from '../lib/sortStickers'
import './ContentHeader.css'

interface ContentHeaderProps {
  title: string
  subtitle: string
  count: number
  showSort: boolean
  sortOrder: SortOrder
  onSortOrderChange: (order: SortOrder) => void
}

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'newest', label: 'Recently added' }
]

const ContentHeader: FC<ContentHeaderProps> = ({
  title,
  subtitle,
  count,
  showSort,
  sortOrder,
  onSortOrderChange
}) => {
  return (
    <div className="content-header">
      <div className="content-header__text">
        <h2 className="content-header__title">{title}</h2>
        <p className="content-header__subtitle">
          {subtitle}
          {count > 0 && <span className="content-header__count"> · {count}</span>}
        </p>
      </div>

      {showSort && (
        <select
          className="content-header__sort"
          value={sortOrder}
          onChange={(event) => onSortOrderChange(event.target.value as SortOrder)}
          aria-label="Sort stickers"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

export default ContentHeader
