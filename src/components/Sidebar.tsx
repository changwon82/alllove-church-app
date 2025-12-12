'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isDesktop?: boolean
}

export default function Sidebar({ isOpen, onClose, isDesktop = false }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        
        // 세션이 없거나 에러가 발생하면 조용히 처리
        if (userError || !userData?.user) {
          return
        }
        
        setUserEmail(userData.user.email ?? null)

        const { data: profile } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('user_id', userData.user.id)
          .maybeSingle()

        if (profile) {
          setUserName(profile.name)
          setUserRole(profile.role)
        }
      } catch (err) {
        // 에러 발생 시 조용히 처리
        console.error('사용자 정보를 불러오는 중 오류:', err)
      }
    }

    fetchUserInfo()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onClose()
    router.push('/')
    router.refresh()
  }

  const menuItems = [
    { href: '/', label: '홈', icon: '🏠' },
    { href: '/mypage', label: '마이페이지', icon: '👤' },
    { href: '/attendance', label: '출석 체크', icon: '✓' },
  ]

  // 관리자 또는 스태프인 경우 관리자페이지 메뉴 추가
  if (userRole === 'admin' || userRole === 'staff') {
    menuItems.push({ href: '/admin', label: '관리자페이지', icon: '⚙️' })
  }

  // 관리자만 사용자 관리 메뉴 표시
  if (userRole === 'admin') {
    menuItems.push({ href: '/admin/users', label: '사용자 관리', icon: '👥' })
  }

  return (
    <>
      {/* 오버레이 - 모바일에서만 표시 */}
      {isOpen && !isDesktop && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* 사이드바 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : -280,
          width: 280,
          height: '100vh',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
          zIndex: 999,
          transition: 'left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'white', letterSpacing: '-0.5px' }}>
            메뉴
          </h2>
          {/* 데스크톱에서는 닫기 버튼 숨기기 */}
          {!isDesktop && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                fontSize: 20,
                cursor: 'pointer',
                padding: 0,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                color: 'white',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.transform = 'rotate(90deg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.transform = 'rotate(0deg)'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 사용자 정보 */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          }}
        >
          {userName && (
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 6,
                color: '#1f2937',
                letterSpacing: '-0.3px',
              }}
            >
              {userName}
            </div>
          )}
          {userEmail && (
            <div
              style={{
                fontSize: 13,
                color: '#6b7280',
                marginBottom: 8,
                fontWeight: 400,
              }}
            >
              {userEmail}
            </div>
          )}
          {userRole && (
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 11,
                color: userRole === 'admin' ? '#dc2626' : userRole === 'staff' ? '#2563eb' : '#059669',
                fontWeight: 600,
                background:
                  userRole === 'admin'
                    ? 'rgba(220, 38, 38, 0.1)'
                    : userRole === 'staff'
                    ? 'rgba(37, 99, 235, 0.1)'
                    : 'rgba(5, 150, 105, 0.1)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {userRole === 'admin' ? '관리자' : userRole === 'staff' ? '스태프' : '성도'}
            </div>
          )}
        </div>

        {/* 메뉴 항목 */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // 모바일에서만 메뉴 클릭 시 사이드바 닫기
                  if (!isDesktop) {
                    onClose()
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 20px',
                  textDecoration: 'none',
                  color: isActive ? '#667eea' : '#4b5563',
                  backgroundColor: isActive
                    ? 'linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)'
                    : 'transparent',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)'
                    : 'transparent',
                  borderLeft: isActive ? '4px solid #667eea' : '4px solid transparent',
                  fontSize: 15,
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s ease',
                  borderRadius: isActive ? '0 12px 12px 0' : '0',
                  marginRight: isActive ? '8px' : '0',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.05)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* 로그아웃 버튼 */}
        <div
          style={{
            padding: '20px',
            borderTop: '1px solid rgba(0,0,0,0.08)',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 12,
              border: '1px solid rgba(220, 38, 38, 0.2)',
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              color: '#dc2626',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.1)'
            }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </>
  )
}
