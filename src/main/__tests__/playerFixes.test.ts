import { describe, it, expect } from 'vitest'
import { normalizeYouTubeUrl } from '../../shared/youtube'

describe('Player Fixes: YouTube URL Normalization', () => {
  it('normalizes standard watch URL', () => {
    const result = normalizeYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(result.videoId).toBe('dQw4w9WgXcQ')
    expect(result.watchUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('normalizes watch URL with timestamp and playlist params', () => {
    const result = normalizeYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PL12345&index=2')
    expect(result.videoId).toBe('dQw4w9WgXcQ')
    expect(result.watchUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('normalizes youtu.be shortlinks', () => {
    const result = normalizeYouTubeUrl('https://youtu.be/dQw4w9WgXcQ?t=15')
    expect(result.videoId).toBe('dQw4w9WgXcQ')
    expect(result.watchUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('normalizes YouTube Shorts links', () => {
    const result = normalizeYouTubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share')
    expect(result.videoId).toBe('dQw4w9WgXcQ')
    expect(result.watchUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('normalizes embed URLs', () => {
    const result = normalizeYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1')
    expect(result.videoId).toBe('dQw4w9WgXcQ')
    expect(result.watchUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('normalizes raw 11-character video IDs', () => {
    const result = normalizeYouTubeUrl('dQw4w9WgXcQ')
    expect(result.videoId).toBe('dQw4w9WgXcQ')
    expect(result.watchUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('handles empty or invalid inputs gracefully', () => {
    expect(normalizeYouTubeUrl('')).toEqual({ videoId: null, watchUrl: '' })
    expect(normalizeYouTubeUrl('invalid-url-string')).toEqual({ videoId: null, watchUrl: '' })
  })
})
