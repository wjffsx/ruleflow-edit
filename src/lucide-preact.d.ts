// Type augmentation for lucide-preact to fix module resolution issues
// The original .d.ts uses `declare namespace index` + file-level `export {}`
// which causes TypeScript to fail resolving named exports under moduleResolution: "bundler"
// This file re-exports from the original namespace to make named imports work

declare module 'lucide-preact' {
  export type LucideIcon = import('lucide-preact/dist/lucide-preact').LucideIcon
  export type LucideProps = import('lucide-preact/dist/lucide-preact').LucideProps

  // Icons used in this project
  export const AArrowDown: LucideIcon
  export const AArrowUp: LucideIcon
  export const ALargeSmall: LucideIcon
  export const Accessibility: LucideIcon
  export const Activity: LucideIcon
  export const AlertTriangle: LucideIcon
  export const Bug: LucideIcon
  export const CheckCircle: LucideIcon
  export const ChevronDown: LucideIcon
  export const ChevronRight: LucideIcon
  export const ChevronUp: LucideIcon
  export const Copy: LucideIcon
  export const Download: LucideIcon
  export const Group: LucideIcon
  export const Keyboard: LucideIcon
  export const Minus: LucideIcon
  export const MousePointer2: LucideIcon
  export const Palette: LucideIcon
  export const PanelLeft: LucideIcon
  export const PanelLeftClose: LucideIcon
  export const Play: LucideIcon
  export const Plus: LucideIcon
  export const RotateCcw: LucideIcon
  export const Save: LucideIcon
  export const Search: LucideIcon
  export const Settings: LucideIcon
  export const Star: LucideIcon
  export const ToggleLeft: LucideIcon
  export const ToggleRight: LucideIcon
  export const Trash2: LucideIcon
  export const Ungroup: LucideIcon
  export const Upload: LucideIcon
  export const X: LucideIcon
  export const XCircle: LucideIcon
  export const Zap: LucideIcon
  export const ZoomIn: LucideIcon
  export const ZoomOut: LucideIcon
  export const FileText: LucideIcon
  export const FilePlus: LucideIcon
  export const FolderOpen: LucideIcon
  export const Undo2: LucideIcon
  export const Redo2: LucideIcon
  export const Square: LucideIcon
  export const Pause: LucideIcon
  export const SkipForward: LucideIcon
  export const Maximize: LucideIcon
  export const Map: LucideIcon
  export const LayoutGrid: LucideIcon
  export const Grid3X3: LucideIcon
  export const Grid2X2: LucideIcon
  export const List: LucideIcon
  export const Pin: LucideIcon
  export const ExternalLink: LucideIcon
  export const PanelRight: LucideIcon
  export const PanelRightClose: LucideIcon
  export const Sun: LucideIcon
  export const Moon: LucideIcon
  export const Monitor: LucideIcon
  export const Pencil: LucideIcon
  export const Clock: LucideIcon
  export const ArrowDown: LucideIcon
  export const ArrowUp: LucideIcon
  export const Hash: LucideIcon
  export const Database: LucideIcon
}
