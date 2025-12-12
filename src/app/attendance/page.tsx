// src/app/attendance/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Member = {
  id: string
  name: string
}

export default function AttendancePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1) 첫 로딩 시 로그인 여부 + 멤버 목록 가져오기
  useEffect(() => {
    const init = async () => {
      try {
        // 로그인 체크
        const { data, error: authError } = await supabase.auth.getUser()
        if (authError || !data?.user) {
          router.replace('/login')
          return
        }

        // members 가져오기
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('id, name')
          .order('name', { ascending: true })

        if (membersError) {
          setError(membersError.message)
        } else {
          setMembers(membersData ?? [])
        }

        setLoading(false)
      } catch (err) {
        // 에러 발생 시 로그인 페이지로 이동
        router.replace('/login')
      }
    }

    init()
  }, [router])

  const toggleMember = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (selected.length === 0) {
      setError('한 명 이상 선택해주세요.')
      return
    }

    setSaving(true)

    const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const service_type = '주일3부'

    try {
      const { data, error: authError } = await supabase.auth.getUser()
      if (authError || !data?.user) {
        setSaving(false)
        router.replace('/login')
        return
      }

      const res = await fetch('/api/save-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          memberIds: selected,
          service_type,
        }),
      })

      const json = await res.json()
      setSaving(false)

      if (!res.ok || !json.success) {
        setError(json.error ?? '저장 중 오류가 발생했습니다.')
        return
      }

      router.push('/attendance/success')
    } catch (err) {
      setError('인증 오류가 발생했습니다.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <p>로딩 중...</p>
      </main>
    )
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>출석 체크</h1>
      <p style={{ marginBottom: 16 }}>오늘 출석할 사람을 선택하세요.</p>

      {error && (
        <div style={{ color: 'red', marginBottom: 12, fontSize: 14 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: 16 }}>
          {members.map((m) => (
            <li key={m.id} style={{ marginBottom: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(m.id)}
                  onChange={() => toggleMember(m.id)}
                  style={{ marginRight: 8 }}
                />
                {m.name}
              </label>
            </li>
          ))}
        </ul>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '10px 16px',
            borderRadius: 999,
            border: 'none',
            background: '#111827',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {saving ? '저장 중...' : '출석 저장'}
        </button>
      </form>
    </main>
  )
}
