import React, { useMemo, useRef, useEffect } from 'react'
import { Activity, SessionSnapshot } from '../../../shared/types'
import { SharedShell } from './SharedShell'

export interface SpotifyPlayerProps {
  activity: Activity;
  snapshot: SessionSnapshot;
  onSnooze?: () => void;
  onResumeFocus: () => void;
  canSnooze?: boolean;
}

export function SpotifyPlayer({
  activity,
  snapshot,
  onSnooze,
  onResumeFocus,
  canSnooze
}: SpotifyPlayerProps): React.JSX.Element {
  const webviewRef = useRef<any>(null)

  const embedUrl = useMemo(() => {
    const url = activity.media?.url || (activity as any).url
    if (!url) return 'https://open.spotify.com/embed/playlist/37i9dQZF1DX3rxVfibe1L0'
    const autoplayParam = activity.media?.autoplay ? '&autoplay=1' : ''
    if (url.includes('/embed/')) {
      if (activity.media?.autoplay && !url.includes('autoplay=')) {
        return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`
      }
      return url
    }
    // Convert regular spotify url to embed url
    const spotRegex = /^(https?:\/\/)?(open\.spotify\.com\/(track|playlist|album|episode|show)\/)([a-zA-Z0-9]+)/
    const match = url.match(spotRegex)
    if (match && match[3] && match[4]) {
      return `https://open.spotify.com/embed/${match[3]}/${match[4]}?utm_source=generator&theme=0${autoplayParam}`
    }
    if (activity.media?.autoplay && !url.includes('autoplay=')) {
      return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`
    }
    return url
  }, [activity.media?.url, activity.media?.autoplay, (activity as any).url])

  useEffect(() => {
    const el = webviewRef.current
    if (!el) return
    const handleDomReady = (): void => {
      if (activity.media?.autoplay) {
        try {
          el.executeJavaScript?.(`
            (function() {
              const playBtn = document.querySelector('[data-testid="play-button"], button[aria-label*="Play"], button[title*="Play"]');
              if (playBtn) playBtn.click();
            })();
          `).catch(() => {})
        } catch {
          // ignore
        }
      }
    }
    el.addEventListener('dom-ready', handleDomReady)
    return () => {
      el.removeEventListener('dom-ready', handleDomReady)
    }
  }, [activity.media?.autoplay])

  return (
    <SharedShell
      snapshot={snapshot}
      activity={activity}
      onSnooze={onSnooze}
      onResumeFocus={onResumeFocus}
      canSnooze={canSnooze}
    >
      <div className="flex flex-col items-center max-w-xl w-full">
        {/* Equaliser & Cover Frame */}
        <div className="w-full h-[380px] bg-black/60 rounded-[8px] border border-[var(--hair)] shadow-[0_-1px_12px_var(--accent-wash)] overflow-hidden relative">
          <webview
            ref={webviewRef}
            src={embedUrl}
            partition="persist:spotify"
            className="w-full h-full border-0"
            allowpopups={true}
            webpreferences="autoplayPolicy=no-user-gesture-required"
          />
        </div>

        {/* Tag + Title Beneath Player */}
        <div className="mt-5 flex items-center justify-between w-full font-mono gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[#1DB954] border border-[rgba(29,185,84,0.3)] bg-[rgba(29,185,84,0.08)] rounded-[3px]">
              Spotify
            </span>
            <span className="text-[13px] text-[var(--text)] tracking-[0.06em] font-medium">
              {activity.name}
            </span>
          </div>
          {(activity.notes || activity.note) && (
            <div className="text-[11px] text-[var(--muted)] tracking-[0.04em] max-w-xs text-right line-clamp-2" title={activity.notes || activity.note}>
              {activity.notes || activity.note}
            </div>
          )}
        </div>
      </div>
    </SharedShell>
  )
}
