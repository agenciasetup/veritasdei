'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

interface MobileStickyCtaProps {
  onFindChurch: () => void
}

export function MobileStickyCta({ onFindChurch }: MobileStickyCtaProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 480)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed left-3 right-3 z-40 md:hidden rounded-2xl p-2 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        background: 'rgba(10,8,6,0.92)',
        border: '1px solid rgba(201,168,76,0.3)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
      }}
      aria-hidden={!visible}
    >
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          onClick={onFindChurch}
          className="btn-gold inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[11px]"
        >
          <MapPin className="w-3.5 h-3.5" />
          Encontrar igreja
        </button>
        <Link
          href="/login?tab=registro"
          className="btn-ghost-dark inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-[11px]"
        >
          Entrar
        </Link>
      </div>
    </div>
  )
}
