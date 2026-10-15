// Stable key for a spoken line, shared by the browser player and the generator script.
export const normLine = (t: string) => t.replace(/\s+/g, ' ').trim()

export function lineKey(text: string) {
  const s = normLine(text).toLowerCase()
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36) + s.length.toString(36)
}
