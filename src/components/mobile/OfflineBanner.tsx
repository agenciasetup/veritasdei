'use client'

import { WifiOff } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

/**
 * Banner discreto no topo quando o navegador detecta `navigator.onLine = false`.
 * Aparece com slide-in e some quando volta a ficar online.
 *
 * Posicionado fixed para sobrepor a LiturgicalBar; respeita safe-area-top.
 */
export default function OfflineBanner() {
  const online = useOnlineStatus()

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
          className="fixed top-0 left-0 right-0 z-[110] flex items-center justify-center gap-2 px-4 py-2 safe-top"
          style={{
            background: 'rgba(217,79,92,0.92)',
            color: '#FFF',
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <WifiOff className="w-3.5 h-3.5" />
          <span>Sem conexão — usando dados em cache</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
