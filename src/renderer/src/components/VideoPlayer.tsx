import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Activity, SessionSnapshot } from '../../../shared/types'
import { normalizeYouTubeUrl } from '../../../shared/youtube'
import { SharedShell } from './SharedShell'

export { normalizeYouTubeUrl }

export interface VideoPlayerProps {
  activity: Activity;
  snapshot: SessionSnapshot;
  onSnooze?: () => void;
  onResumeFocus: () => void;
  canSnooze?: boolean;
}

const CHROME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

export function VideoPlayer({
  activity,
  snapshot,
  onSnooze,
  onResumeFocus,
  canSnooze
}: VideoPlayerProps): React.JSX.Element {
  const [loadFailed, setLoadFailed] = useState<boolean>(false)
  const webviewRef = useRef<any>(null)

  const rawUrl = activity.media?.url || (activity as any).url
  const { videoId, watchUrl } = useMemo(() => normalizeYouTubeUrl(rawUrl), [rawUrl])

  const embedUrl = useMemo(() => {
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`
    }
    return watchUrl || rawUrl || ''
  }, [videoId, watchUrl, rawUrl])

  useEffect(() => {
    setLoadFailed(false)
  }, [embedUrl])

  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return

    const handleFailLoad = (e: any) => {
      // Ignore aborted loads (-3) during navigation/redirects
      if (e.errorCode === -3) return
      console.error(`[webview did-fail-load] code=${e.errorCode} desc=${e.errorDescription} url=${e.validatedURL}`)
      setLoadFailed(true)
    }

    const handleConsoleMessage = (e: any) => {
      console.log(`[webview console-message] [level ${e.level}] ${e.message}`)
    }

    const handleDomReady = () => {
      try {
        wv.insertCSS?.(`
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
            background: #000000 !important;
            background-color: #000000 !important;
          }
          .ytp-pause-overlay {
            display: none !important;
          }
        `)?.catch?.(() => {})
      } catch {}
      try {
        wv.executeJavaScript?.(`
          (function() {
            try {
              const v = document.querySelector('video');
              if (v && v.paused) {
                v.play().catch(() => {});
              }
            } catch {}
          })();
        `)?.catch?.(() => {})
      } catch {}
    }

    wv.addEventListener('did-fail-load', handleFailLoad)
    wv.addEventListener('console-message', handleConsoleMessage)
    wv.addEventListener('dom-ready', handleDomReady)

    return () => {
      wv.removeEventListener('did-fail-load', handleFailLoad)
      wv.removeEventListener('console-message', handleConsoleMessage)
      wv.removeEventListener('dom-ready', handleDomReady)
    }
  }, [embedUrl])

  return (
    <SharedShell
      snapshot={snapshot}
      activity={activity}
      onResumeFocus={onResumeFocus}
      canSnooze={false}
    >
      <div className="w-full h-full flex flex-col items-center justify-center py-2">
        {/* Dynamic 16:9 Video Frame scaled to comfortably fill the screen */}
        <div
          className="w-full rounded-xl border border-[rgba(175,221,255,0.22)] shadow-[0_12px_48px_rgba(0,0,0,0.85)] bg-black overflow-hidden relative flex items-center justify-center"
          style={{
            maxWidth: 'min(94vw, calc((100vh - 190px) * (16 / 9)))',
            aspectRatio: '16 / 9'
          }}
        >
          {loadFailed || !embedUrl ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-black font-mono">
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center mb-4 text-[var(--accent)]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[14px] text-[var(--text)] tracking-[0.06em] font-medium mb-1">
                Video cannot be loaded.
              </p>
              <p className="text-[12px] text-[var(--muted)] tracking-[0.04em] max-w-md">
                Take a quiet moment to rest your eyes until the rest period ends.
              </p>
            </div>
          ) : (
            <webview
              ref={webviewRef}
              id="youtube-player-webview"
              src={embedUrl}
              partition="persist:video"
              useragent={CHROME_USER_AGENT}
              httpreferrer="https://www.youtube.com"
              allowpopups={false}
              style={{ width: '100%', height: '100%', backgroundColor: '#000000' }}
              className="w-full h-full border-0 bg-black"
            />
          )}
        </div>

        {/* Quiet Tag + Title Beneath Video */}
        <div
          className="mt-3.5 flex items-center justify-between w-full font-mono px-1"
          style={{
            maxWidth: 'min(94vw, calc((100vh - 190px) * (16 / 9)))'
          }}
        >
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[var(--accent)] border border-[rgba(175,221,255,0.25)] bg-[rgba(175,221,255,0.06)] rounded-full">
              Video
            </span>
            <span className="text-[12.5px] text-white/90 tracking-[0.06em] font-medium">
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
