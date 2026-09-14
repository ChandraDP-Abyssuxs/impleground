import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { ImageProvider } from '@/context/ImageContext'
import { AppShell } from '@/components/layout/AppShell'

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ImageProvider>
          <AppShell />
        </ImageProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
