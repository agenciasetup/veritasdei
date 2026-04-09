'use client'

import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

const PUBLIC_PATHS = ['/login', '/auth', '/privacidade', '/termos', '/onboarding']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()

  const isPublicPage = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  const showSidebar = isAuthenticated && !isPublicPage

  return (
    <>
      {showSidebar && <Sidebar />}
      <div style={{ marginLeft: showSidebar ? '64px' : '0' }}>
        {children}
      </div>
    </>
  )
}
