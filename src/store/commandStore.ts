/**
 * Command palette and search state management.
 */
import { signal } from '@preact/signals'

/** Whether the command palette is visible */
export const commandPaletteVisible = signal<boolean>(false)

/** Toggle command palette visibility */
export function toggleCommandPalette(): void {
  commandPaletteVisible.value = !commandPaletteVisible.value
}

/** Show the command palette */
export function showCommandPalette(): void {
  commandPaletteVisible.value = true
}

/** 隐藏命令面板 */
export function hideCommandPalette(): void {
  commandPaletteVisible.value = false
}

/** Current search query */
export const searchQuery = signal<string>('')
