// src/app/page.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [departments, setDepartments] = useState<string[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser()

        // 세션이 없거나 에러가 발생하면 로그인하지 않은 것으로 처리
        if (userError || !userData?.user) {
          setEmail(null)
          setDepartments([])
          setIsLoading(false)
          return
        }

      setEmail(userData.user.email ?? null)

      const { data: rows, error: profileError } = await supabase
        .from('profiles')
        .select('departments, role, name')
        .eq('user_id', userData.user.id)

      if (profileError) {
        console.error('프로필을 불러오지 못했습니다.', profileError.message)
        setDepartments([])
        setIsLoading(false)
        return
      }

      if (!rows || rows.length === 0) {
        // 프로필이 아직 없는 경우
        setDepartments([])
        setIsLoading(false)
        return
      }

      // 혹시라도 여러 줄 있으면 첫 번째만 사용
      const profile = rows[0]
      setDepartments(profile.departments ?? [])
      // 필요하면 setRole(profile.role) 등도 여기서 해주면 됩니다.
      setIsLoading(false)
      } catch (err) {
        // 에러 발생 시 조용히 처리 (로그인하지 않은 것으로 간주)
        setEmail(null)
        setDepartments([])
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // 로그인 성공 시 프로필 다시 불러오기
  useEffect(() => {
    if (!showLoginModal && !showSignupModal) {
      const fetchProfile = async () => {
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser()
          if (userError || !userData?.user) {
            setEmail(null)
            setDepartments([])
            setIsLoading(false)
            return
          }
          
          setEmail(userData.user.email ?? null)
          const { data: rows } = await supabase
            .from('profiles')
            .select('departments, role, name')
            .eq('user_id', userData.user.id)
          if (rows && rows.length > 0) {
            setDepartments(rows[0].departments ?? [])
          }
          setIsLoading(false)
        } catch (err) {
          // 에러 발생 시 조용히 처리
          setEmail(null)
          setDepartments([])
          setIsLoading(false)
        }
      }
      fetchProfile()
    }
  }, [showLoginModal, showSignupModal])


  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        position: 'relative',
      }}
    >
      {/* 배경 장식 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />


      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <h1
          style={{
            fontSize: '42px',
            fontWeight: 800,
            marginBottom: '12px',
            color: 'white',
            textShadow: '0 2px 20px rgba(0,0,0,0.2)',
            letterSpacing: '-0.5px',
          }}
        >
          Alllove Church App
        </h1>
      </div>

      {/* 메인 메뉴 - 출석 체크 (로고 포함) */}
      <section
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          padding: '28px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          position: 'relative',
          zIndex: 1,
          border: '1px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* 로고 이미지 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <Image
            src="/alllove-logo.png"
            alt="Alllove Church Logo"
            width={200}
            height={200}
            style={{
              objectFit: 'contain',
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 20,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#1f2937', marginBottom: 4 }}>
              출석 체크
            </div>
          </div>
        </div>

        {!email ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <button
              onClick={() => setShowLoginModal(true)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              로그인 후 이용해 주세요
            </button>
            <button
              onClick={() => setShowSignupModal(true)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                background: 'white',
                color: '#667eea',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb'
                e.currentTarget.style.borderColor = '#667eea'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              회원가입
            </button>
          </div>
        ) : isLoading ? (
          <div
            style={{
              marginTop: 8,
              padding: '16px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              color: '#0369a1',
              fontSize: 14,
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            담당 부서를 불러오는 중입니다...
          </div>
        ) : (departments ?? []).length === 0 ? (
          <div
            style={{
              marginTop: 8,
              padding: '16px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              color: '#b91c1c',
              fontSize: 14,
              textAlign: 'center',
              border: '1px solid #fecaca',
              fontWeight: 500,
            }}
          >
            담당 부서가 없습니다.
          </div>
        ) : (departments ?? []).length === 1 ? (
          <Link href={`/attendance/${encodeURIComponent((departments ?? [])[0])}`}>
            <button
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: 16,
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              출석 체크
            </button>
          </Link>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(departments ?? []).map((department) => (
              <Link
                key={department}
                href={`/attendance/${encodeURIComponent(department)}`}
              >
                <button
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: 14,
                    border: '1px solid #e5e7eb',
                    background: 'white',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#374151',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
                    e.currentTarget.style.borderColor = '#667eea'
                    e.currentTarget.style.transform = 'translateX(4px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white'
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  {department}
                </button>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 로그인 모달 */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => {
            setShowLoginModal(false)
            window.location.reload()
          }}
        />
      )}

      {/* 회원가입 모달 */}
      {showSignupModal && (
        <SignupModal
          onClose={() => setShowSignupModal(false)}
          onSuccess={() => {
            setShowSignupModal(false)
            setShowLoginModal(true)
          }}
        />
      )}
    </main>
  )
}

// 로그인 모달 컴포넌트
function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (cooldownSeconds === null || cooldownSeconds <= 0) {
      return
    }
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev === null || prev <= 1) {
          return null
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const translateError = (errorMessage: string): string => {
    const lowerMessage = errorMessage.toLowerCase()
    if (lowerMessage.includes("for security purposes") || lowerMessage.includes("rate limit")) {
      const secondsMatch = errorMessage.match(/(\d+)\s*seconds?/i)
      const seconds = secondsMatch ? parseInt(secondsMatch[1]) : null
      if (seconds) {
        setCooldownSeconds(seconds)
        return `보안을 위해 ${seconds}초 후에 다시 시도해주세요.`
      }
      return "보안을 위해 잠시 후에 다시 시도해주세요."
    }
    if (lowerMessage.includes("invalid login credentials") || lowerMessage.includes("wrong password")) {
      return "아이디 또는 비밀번호가 올바르지 않습니다."
    }
    if (lowerMessage.includes("user not found")) {
      return "등록되지 않은 아이디입니다."
    }
    return errorMessage
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setCooldownSeconds(null)
    setLoading(true)

    // 로그인 시: 아이디로 로그인하려면 프로필에서 이메일을 찾아야 함
    // 하지만 간단하게 하기 위해 아이디를 이메일 형식으로 변환
    // 실제로는 프로필의 username으로 auth.users의 이메일을 찾아야 함
    const tempEmail = `${username.trim().toLowerCase()}@example.com`
    
    // 먼저 example.com 형식으로 시도
    let signInData, signInError
    const result1 = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password,
    })
    
    signInData = result1.data
    signInError = result1.error
    
    // example.com으로 실패하면, 프로필에서 실제 이메일 찾기
    if (signInError && signInError.message.includes('Invalid login credentials')) {
      // 프로필에서 username으로 이메일 찾기
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', username.trim().toLowerCase())
        .maybeSingle()
      
      if (profile?.email) {
        const result2 = await supabase.auth.signInWithPassword({
          email: profile.email,
          password,
        })
        signInData = result2.data
        signInError = result2.error
      }
    }

    if (signInError) {
      setLoading(false)
      setError(translateError(signInError.message))
      return
    }

    if (signInData.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("approved, role")
        .eq("user_id", signInData.user.id)
        .maybeSingle()

      if (profileError) {
        setLoading(false)
        setError("프로필을 확인하는 중 오류가 발생했습니다.")
        await supabase.auth.signOut()
        return
      }

      const isAdminOrStaff = profile?.role === "admin" || profile?.role === "staff"
      const isApproved = profile?.approved === true || isAdminOrStaff

      if (!isApproved) {
        setLoading(false)
        setError(
          "⏳ 관리자 승인 대기 중입니다.\n\n" +
          "회원가입이 완료되었지만 아직 관리자의 승인을 받지 못했습니다.\n" +
          "관리자가 승인하면 로그인할 수 있습니다.\n\n" +
          "승인까지 시간이 걸릴 수 있으니 잠시만 기다려주세요."
        )
        await supabase.auth.signOut()
        return
      }
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#fff',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          padding: '28px 24px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: '#6b7280',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          ×
        </button>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          로그인
        </h1>
        <p style={{ color: '#555', marginBottom: 20, fontSize: 14 }}>
          아이디와 비밀번호를 입력해 주세요.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="modal-username" style={{ fontSize: 14, fontWeight: 600 }}>
              아이디
            </label>
            <input
              id="modal-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="honggildong"
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="modal-password" style={{ fontSize: 14, fontWeight: 600 }}>
              비밀번호
            </label>
            <input
              id="modal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="******"
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '14px 16px',
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: 'pre-line',
              }}
            >
              {error}
              {cooldownSeconds !== null && cooldownSeconds > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                  ⏱️ {cooldownSeconds}초 후에 다시 시도할 수 있습니다.
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: 14,
              borderRadius: 12,
              border: 'none',
              backgroundColor: loading ? '#9ca3af' : '#111827',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}

// 회원가입 모달 컴포넌트
function SignupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (cooldownSeconds === null || cooldownSeconds <= 0) {
      return
    }
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev === null || prev <= 1) {
          return null
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownSeconds])

  const translateError = (errorMessage: string): string => {
    const lowerMessage = errorMessage.toLowerCase()
    if (lowerMessage.includes("for security purposes") || lowerMessage.includes("rate limit")) {
      const secondsMatch = errorMessage.match(/(\d+)\s*seconds?/i)
      const seconds = secondsMatch ? parseInt(secondsMatch[1]) : null
      if (seconds) {
        setCooldownSeconds(seconds)
        return `보안을 위해 ${seconds}초 후에 다시 시도해주세요.`
      }
      return "보안을 위해 잠시 후에 다시 시도해주세요."
    }
    if (lowerMessage.includes("user already registered") || lowerMessage.includes("already exists")) {
      return "이미 등록된 아이디입니다. 로그인을 시도해주세요."
    }
    return errorMessage
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setCooldownSeconds(null)

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.")
      return
    }

    if (!name || name.trim().length === 0) {
      setError("이름을 입력해주세요.")
      return
    }

    if (!username || username.trim().length === 0) {
      setError("아이디를 입력해주세요.")
      return
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    if (!usernameRegex.test(username.trim())) {
      setError("아이디는 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용할 수 있습니다.")
      return
    }

    // 이메일이 있으면 사용하고, 없으면 임시 이메일 생성
    // Supabase는 유효한 이메일 형식이 필요하므로 실제 이메일을 우선 사용
    let signupEmail: string
    if (email && email.trim().length > 0) {
      signupEmail = email.trim()
    } else {
      // 이메일이 없으면 아이디 기반으로 임시 이메일 생성
      // example.com은 RFC에서 예약된 도메인으로 유효한 형식으로 인정됨
      signupEmail = `${username.trim().toLowerCase()}@example.com`
    }

    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password,
        options: {
          emailRedirectTo: `${location.origin}/login`,
        },
      })

      if (signUpError) {
        throw signUpError
      }

      const user = data?.user
      if (!user) {
        throw new Error("사용자 계정이 생성되지 않았습니다.")
      }

      // 2단계: 프로필 생성 (API 라우트를 통해 RLS 우회)
      const profileResponse = await fetch("/api/create-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          full_name: name.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim() || null,
          role: "user",
          approved: false,
        }),
      })

      const profileResult = await profileResponse.json()

      if (!profileResponse.ok || !profileResult.success) {
        console.error("프로필 생성 에러:", profileResult)
        throw new Error(
          `프로필 생성 중 오류가 발생했습니다: ${profileResult.error || "알 수 없는 오류"}`
        )
      }

      setSuccess("회원가입이 완료되었습니다! 관리자 승인 후 로그인할 수 있습니다.")
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      let message = "회원가입 중 오류가 발생했습니다."
      if (err) {
        if (err.message) {
          message = translateError(err.message)
        } else if (typeof err === "string") {
          message = translateError(err)
        }
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#fff',
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          padding: '28px 24px',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: '#6b7280',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          ×
        </button>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
          회원가입
        </h1>
        <p style={{ color: '#555', marginBottom: 20, fontSize: 14 }}>
          기본 정보를 입력해 주세요. 관리자 승인 후 로그인할 수 있습니다.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="modal-signup-name" style={{ fontSize: 14, fontWeight: 600 }}>
              이름 <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="modal-signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="홍길동"
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="modal-signup-username" style={{ fontSize: 14, fontWeight: 600 }}>
              아이디 <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="modal-signup-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="honggildong"
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              영문, 숫자, 언더스코어(_), 하이픈(-)만 사용 가능합니다.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="modal-signup-password" style={{ fontSize: 14, fontWeight: 600 }}>
              비밀번호 <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="modal-signup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="******"
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="modal-signup-confirm" style={{ fontSize: 14, fontWeight: 600 }}>
              비밀번호 확인 <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="modal-signup-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="******"
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="modal-signup-email" style={{ fontSize: 14, fontWeight: 600 }}>
              이메일 (선택사항)
            </label>
            <input
              id="modal-signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
                fontSize: 14,
              }}
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              선택사항입니다. 비밀번호 찾기 등에 사용됩니다.
            </span>
          </div>

          {success && (
            <div
              style={{
                backgroundColor: '#ecfdf3',
                color: '#166534',
                border: '1px solid #bbf7d0',
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 13,
              }}
            >
              {success}
            </div>
          )}

          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {error}
              {cooldownSeconds !== null && cooldownSeconds > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                  ⏱️ {cooldownSeconds}초 후에 다시 시도할 수 있습니다.
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: 14,
              borderRadius: 12,
              border: 'none',
              backgroundColor: loading ? '#9ca3af' : '#111827',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
            }}
          >
            {loading ? '처리중...' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  )
}
