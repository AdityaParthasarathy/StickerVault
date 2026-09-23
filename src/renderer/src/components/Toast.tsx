import { useEffect } from 'react'
import type { FC } from 'react'
import { CheckIcon } from './icons'
import './Toast.css'

interface ToastProps {
  message: string
  tone: 'success' | 'error'
  onDismiss: () => void
}

const Toast: FC<ToastProps> = ({ message, tone, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 1800)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className={`toast toast--${tone}`} role="status">
      {tone === 'success' && <CheckIcon className="toast__icon" />}
      {message}
    </div>
  )
}

export default Toast
