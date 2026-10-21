/**
 * YouTube URL normalization utilities
 */
export function normalizeYouTubeUrl(rawUrl?: string): { videoId: string | null; watchUrl: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { videoId: null, watchUrl: '' }
  }
  const trimmed = rawUrl.trim()

  // 1. Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return { videoId: trimmed, watchUrl: `https://www.youtube.com/watch?v=${trimmed}` }
  }

  try {
    const urlString = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const parsed = new URL(urlString)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '')

    // youtu.be/ID
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0]
      if (id && id.length === 11) {
        return { videoId: id, watchUrl: `https://www.youtube.com/watch?v=${id}` }
      }
    }

    // youtube.com or youtube-nocookie.com
    if (host === 'youtube.com' || host === 'youtube-nocookie.com' || host.endsWith('.youtube.com')) {
      const v = parsed.searchParams.get('v')
      if (v && v.length === 11) {
        return { videoId: v, watchUrl: `https://www.youtube.com/watch?v=${v}` }
      }

      const parts = parsed.pathname.split('/').filter(Boolean)
      if (parts.length >= 2 && ['shorts', 'embed', 'v', 'live'].includes(parts[0])) {
        const id = parts[1]
        if (id && id.length === 11) {
          return { videoId: id, watchUrl: `https://www.youtube.com/watch?v=${id}` }
        }
      }
    }
  } catch {
    // Ignore and fallback to regex
  }

  // Regex fallback: watch?v=..., shorts/..., embed/..., youtu.be/...
  const ytRegex = /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = trimmed.match(ytRegex)
  if (match && match[1]) {
    return { videoId: match[1], watchUrl: `https://www.youtube.com/watch?v=${match[1]}` }
  }

  return { videoId: null, watchUrl: '' }
}
