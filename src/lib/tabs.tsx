import { Eraser, Gamepad2, ScanText, SlidersHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TabId, TabMeta } from '@/types'

export const TAB_META: Record<TabId, TabMeta> = {
  playground: {
    id: 'playground',
    label: 'Image Playground',
    shortLabel: 'Playground',
    description: 'Crop, resize, flip, rotate, and tune brightness, contrast, and saturation.',
  },
  eraser: {
    id: 'eraser',
    label: 'Magic Eraser',
    shortLabel: 'Eraser',
    description: 'Lift the subject out with in-browser background removal.',
  },
  retro: {
    id: 'retro',
    label: 'Retro Studio',
    shortLabel: 'Retro',
    description: 'Pixelate, reduce the palette, and dither like it\u2019s 1989.',
  },
  ocr: {
    id: 'ocr',
    label: 'Vision OCR',
    shortLabel: 'OCR',
    description: 'Pull text out of an image, entirely on-device.',
  },
}

export const TAB_ICONS: Record<TabId, LucideIcon> = {
  playground: SlidersHorizontal,
  eraser: Eraser,
  retro: Gamepad2,
  ocr: ScanText,
}
