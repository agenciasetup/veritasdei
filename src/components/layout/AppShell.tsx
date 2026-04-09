'use client'

import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      {/* Main content offset by collapsed sidebar width (64px) */}
      <div style={{ marginLeft: '64px' }}>
        {children}
      </div>
    </>
  )
}
