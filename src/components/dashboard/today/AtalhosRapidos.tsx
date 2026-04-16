'use client'

import Link from 'next/link'
import { Cross, BookOpen, MapPin } from 'lucide-react'

/**
 * Atalhos circulares no estilo "stories" do Instagram:
 * 3 ações que 90% dos católicos fazem diariamente.
 */
const ATALHOS = [
  { href: '/rosario', icon: Cross, label: 'Terço' },
  { href: '/oracoes', icon: BookOpen, label: 'Orações' },
  { href: '/paroquias/buscar', icon: MapPin, label: 'Igrejas perto' },
]

export default function AtalhosRapidos() {
  return (
    <section className="px-5 mb-3">
      <div className="flex items-center justify-around">
        {ATALHOS.map(a => {
          const Icon = a.icon
          return (
            <Link
              key={a.href}
              href={a.href}
              className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              style={{ minWidth: '72px' }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(201,168,76,0.18), rgba(201,168,76,0.03))',
                  border: '2px solid rgba(201,168,76,0.35)',
                  boxShadow: '0 4px 20px rgba(201,168,76,0.15)',
                  color: '#C9A84C',
                }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <span
                className="text-[11px]"
                style={{ color: '#A8A096', fontFamily: 'Poppins, sans-serif' }}
              >
                {a.label}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
