'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

const PUBLIC_PATHS = ['/login', '/auth', '/privacidade', '/termos', '/onboarding']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()

  const isPublicPage = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const showSidebar = isAuthenticated && !isPublicPage

  return (
    <>
      {/* Sidebar only on md+ screens */}
      {showSidebar && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}
      <div className={`${showSidebar ? 'md:ml-16 pb-bottom-nav' : ''}`}>
        {children}
      </div>
      {/* Bottom nav only on mobile */}
      {showSidebar && <BottomNav />}
    </>
  )
}
