import { useEffect, useRef, useState } from 'react'
import { copyText } from '../lib/clipboard'

interface CopyButtonProps {
  text: string
  small?: boolean
}

export function CopyButton({ text, small }: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function handleCopy() {
    const ok = await copyText(text)
    setState(ok ? 'copied' : 'error')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={!text}
      className={`shrink-0 rounded-lg font-medium transition-colors disabled:opacity-40 ${
        small ? 'min-h-9 px-3 text-xs' : 'min-h-11 px-4 text-sm'
      } ${
        state === 'copied'
          ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-900'
          : state === 'error'
            ? 'bg-red-600 text-white'
            : 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300'
      }`}
    >
      {state === 'copied' ? '✓ Kopiert' : state === 'error' ? 'Fehler' : 'Kopieren'}
    </button>
  )
}
