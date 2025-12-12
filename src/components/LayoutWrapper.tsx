'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Sidebar from './Sidebar'
import SidebarToggle from './SidebarToggle'

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)
  const pathname = usePathname()

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768) // 768px 이상을 데스크톱으로 간주
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => {
      window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        // 세션이 없거나 에러가 발생하면 로그인하지 않은 것으로 처리
        const loggedIn = !error && !!user
        setIsLoggedIn(loggedIn)
        
        // 로그인 상태이고 데스크톱이면 사이드바를 열어둠
        if (loggedIn && window.innerWidth >= 768) {
          setIsSidebarOpen(true)
        }
        
        setIsChecking(false)
      } catch (err) {
        // 에러 발생 시 로그인하지 않은 것으로 처리
        setIsLoggedIn(false)
        setIsChecking(false)
      }
    }

    checkAuth()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setIsLoggedIn(true)
        // 데스크톱이면 사이드바 열기
        if (window.innerWidth >= 768) {
          setIsSidebarOpen(true)
        }
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false)
        setIsSidebarOpen(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 화면 크기 변경 시 데스크톱이면 사이드바 열기
  useEffect(() => {
    if (isDesktop && isLoggedIn) {
      setIsSidebarOpen(true)
    } else if (!isDesktop) {
      // 모바일로 변경되면 사이드바 닫기
      setIsSidebarOpen(false)
    }
  }, [isDesktop, isLoggedIn])

  // 경로 변경 시 모바일에서만 사이드바 닫기
  useEffect(() => {
    if (!isDesktop) {
      setIsSidebarOpen(false)
    }
  }, [pathname, isDesktop])

  // 로그인 페이지나 회원가입 페이지에서는 사이드바를 표시하지 않음
  const hideSidebar = pathname === '/login' || pathname === '/signup'

  if (isChecking) {
    return <>{children}</>
  }

  return (
    <>
      {isLoggedIn && !hideSidebar && (
        <>
          {/* 모바일에서만 토글 버튼 표시 */}
          {!isDesktop && (
            <SidebarToggle onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
          )}
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)}
            isDesktop={isDesktop}
          />
        </>
      )}
      <div
        style={{
          marginLeft: isLoggedIn && !hideSidebar && isDesktop && isSidebarOpen ? '280px' : '0',
          transition: 'margin-left 0.3s ease',
        }}
      >
        {children}
      </div>
    </>
  )
}
