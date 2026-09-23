import type { FC } from 'react'
import type { ImportSkip } from '@shared/types'
import './ImportIssuesBanner.css'

interface ImportIssuesBannerProps {
  issues: ImportSkip[]
  onDismiss: () => void
}

// Section 20 of the product spec: errors should never crash the app and
// should never show raw technical messages (ENOENT, etc.) — just a plain
// list of what didn't import and why.
const ImportIssuesBanner: FC<ImportIssuesBannerProps> = ({ issues, onDismiss }) => {
  return (
    <div className="import-issues" role="alert">
      <div className="import-issues__header">
        <span>
          {issues.length} file{issues.length === 1 ? '' : 's'} couldn&apos;t be imported
        </span>
        <button type="button" className="import-issues__dismiss" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
      <ul className="import-issues__list">
        {issues.map((issue, index) => (
          <li key={`${issue.fileName}-${index}`}>
            <span className="import-issues__file">{issue.fileName}</span> — {issue.reason}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ImportIssuesBanner
