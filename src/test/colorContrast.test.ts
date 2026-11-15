// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const css = readFileSync('src/index.css', 'utf8')
const [light, dark] = css.split('@media (prefers-color-scheme: dark)')
function color(theme: string, token: string): number[] {
  const hex = theme.match(new RegExp(`--color-${token}: #([0-9a-f]{6})`))?.[1]
  if (!hex) throw new Error(`Missing color token: ${token}`)
  return [0, 2, 4].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
}
function luminance(rgb: number[]): number {
  const linear = rgb.map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
}
function contrast(a: number[], b: number[]): number {
  const values = [luminance(a), luminance(b)].sort((x, y) => x - y)
  return (values[1] + 0.05) / (values[0] + 0.05)
}

it.each([{ name: 'light', theme: light }, { name: 'dark', theme: dark }])(
  '$name text, feedback, focus and form borders meet contrast thresholds', ({ theme }) => {
    for (const surface of ['canvas', 'surface', 'surface-muted']) {
      const background = color(theme, surface)
      for (const token of ['fg', 'muted', 'danger', 'warning', 'success']) {
        const foreground = color(theme, token)
        expect(contrast(foreground, background), `${token} on ${surface}`).toBeGreaterThanOrEqual(4.5)
        if (['danger', 'warning', 'success'].includes(token)) {
          const tinted = foreground.map((channel, index) => channel * 0.14 + background[index] * 0.86)
          expect(contrast(foreground, tinted), `${token} badge/notice on ${surface}`).toBeGreaterThanOrEqual(4.5)
        }
      }
      expect(contrast(color(theme, 'control-border'), background)).toBeGreaterThanOrEqual(3)
      expect(contrast(color(theme, 'accent'), background)).toBeGreaterThanOrEqual(3)
    }
    expect(contrast(color(theme, 'accent-fg'), color(theme, 'accent'))).toBeGreaterThanOrEqual(4.5)
  },
)
