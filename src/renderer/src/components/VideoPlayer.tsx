import React, { useMemo } from 'react'
import { Activity, SessionSnapshot } from '../../../shared/types'
import { SharedShell } from './SharedShell'

export interface VideoPlayerProps {
  activity: Activity;
  snapshot: SessionSnapshot;
  onSnooze?: () => void;
  onResumeFocus: () => void;
  canSnooze?: boolean;
}

export function VideoPlayer({
  activity,
  snapshot,
  onSnooze,
  onResumeFocus,
  canSnooze
}: VideoPlayerProps): React.JSX.Element {
  const embedUrl = useMemo(() => {
    const url = activity.media?.url || (activity as any).url
    if (!url) return ''
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(ytRegex)
    if (match && match[5]) {
      return `https://www.youtube-nocookie.com/embed/${match[5]}?autoplay=1&controls=1&rel=0&enablejsapi=1&origin=https://www.youtube.com&widget_referrer=https://www.youtube.com`
    }
    return url
  }, [activity.media?.url, (activity as any).url])

  return (
    <SharedShell
      snapshot={snapshot}
      onResumeFocus={onResumeFocus}
    >
      <div className="flex flex-col items-center max-w-4xl w-full">
        {/* 16:9 Frame with hairline border and luminous top edge */}
        <div className="w-full aspect-video bg-black/60 rounded-[6px] border border-[var(--hair)] shadow-[0_-1px_10px_var(--accent-wash)] overflow-hidden relative">
          {embedUrl ? (
            <iframe
              id="youtube-player-frame"
              src={embedUrl}
              title={activity.name || 'Rest Video'}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--muted)] font-mono text-[12px] tracking-[0.1em] uppercase">
              No Video URL Configured
            </div>
          )}
        </div>

        {/* Tag + Title Beneath Video */}
        <div className="mt-5 flex items-center justify-between w-full font-mono">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[var(--accent)] border border-[var(--accent-line)] bg-[var(--accent-wash)] rounded-[3px]">
              Video
            </span>
            <span className="text-[13px] text-[var(--text)] tracking-[0.06em] font-medium">
              {activity.name}
            </span>
          </div>
          {activity.note && (
            <div className="text-[11px] text-[var(--muted)] tracking-[0.04em]">
              {activity.note}
            </div>
          )}
        </div>
      </div>
    </SharedShell>
  )
}
