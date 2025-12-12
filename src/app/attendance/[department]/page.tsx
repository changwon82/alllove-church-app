'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Member = {
  id: string
  name: string
}

const getCurrentSunday = () => {
  const today = new Date()
  const day = today.getDay() // 0(일) ~ 6(토)
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - day)
  return sunday.toISOString().slice(0, 10) // YYYY-MM-DD
}

export default function DepartmentAttendancePage() {
  const router = useRouter()
  const params = useParams() as { department?: string | string[] }

  const departmentName = useMemo(() => {
    if (!params?.department) return ''
    return decodeURIComponent(
      Array.isArray(params.department) ? params.department[0] : params.department,
    )
  }, [params?.department])

  const [date, setDate] = useState<string>(getCurrentSunday)
  const [serviceType, setServiceType] = useState('주일3부')
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  // 로그인 + 권한 체크
  useEffect(() => {
    const init = async () => {
      try {
        setError(null)

        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData?.user) {
          router.replace('/login')
          return
        }

      if (!departmentName) {
        setError('부서 정보가 올바르지 않습니다.')
        setHasAccess(false)
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('departments')
        .eq('id', userData.user.id)
        .single()

      if (profileError) {
        setError(profileError.message)
        setHasAccess(false)
        setLoading(false)
        return
      }

      const departmentList = Array.isArray(profile?.departments)
        ? profile.departments
        : []

      if (!departmentList.includes(departmentName)) {
        setHasAccess(false)
        setLoading(false)
        return
      }

      setHasAccess(true)
      } catch (err) {
        // 에러 발생 시 로그인 페이지로 이동
        setError('인증 오류가 발생했습니다.')
        setHasAccess(false)
        setLoading(false)
      }
    }

    init()
  }, [departmentName, router])

  // 멤버 + 기존 출석 불러오기
  useEffect(() => {
    if (!hasAccess) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('id, name')
        .eq('department', departmentName)
        .order('name', { ascending: true })

      if (membersError) {
        setError(membersError.message)
        setMembers([])
        setSelectedMemberIds([])
        setLoading(false)
        return
      }

      setMembers(membersData ?? [])

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('member_id')
        .eq('department', departmentName)
        .eq('date', date)
        .eq('service_type', serviceType)

      if (attendanceError) {
        setError(attendanceError.message)
        setSelectedMemberIds([])
      } else {
        const ids = Array.from(
          new Set((attendanceData ?? []).map((row) => row.member_id)),
        )
        setSelectedMemberIds(ids)
      }

      setLoading(false)
    }

    fetchData()
  }, [hasAccess, departmentName, date, serviceType])

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    )
  }

  const handleSave = async () => {
    if (selectedMemberIds.length === 0) {
      setError('출석할 교인을 선택해주세요.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        setSaving(false)
        router.replace('/login')
        return
      }

      const res = await fetch('/api/save-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          memberIds: selectedMemberIds,
          service_type: serviceType,
          department: departmentName,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? '저장 중 오류가 발생했습니다.')
      }

      alert('출석이 저장되었습니다.')
    } catch (e: any) {
      setError(e.message ?? '저장 중 오류가 발생했습니다.')
    } finally {
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

  if (hasAccess === false) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>
          이 부서에 대한 권한이 없습니다.
        </h1>
      </main>
    )
  }

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>부서</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
            {departmentName}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 14,
              color: '#374151',
              gap: 6,
            }}
          >
            <span>출석 날짜</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                minWidth: 180,
              }}
            />
          </label>

          <label
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 14,
              color: '#374151',
              gap: 6,
            }}
          >
            <span>예배 구분</span>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                minWidth: 140,
              }}
            >
              <option value="주일3부">주일3부</option>
              <option value="주일1부">주일1부</option>
              <option value="주일2부">주일2부</option>
              <option value="수요예배">수요예배</option>
              <option value="금요기도회">금요기도회</option>
            </select>
          </label>
        </div>
      </header>

      {error && (
        <div style={{ color: '#b91c1c', marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}

      <section>
        <p style={{ margin: '0 0 12px', color: '#4b5563' }}>
          출석 체크할 교인을 선택하세요.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 12,
          }}
        >
          {members.map((member) => {
            const isSelected = selectedMemberIds.includes(member.id)
            return (
              <button
                key={member.id}
                onClick={() => toggleMember(member.id)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: isSelected ? '1px solid #2563eb' : '1px solid #e5e7eb',
                  background: isSelected ? '#dbeafe' : '#ffffff',
                  color: isSelected ? '#1d4ed8' : '#111827',
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected
                    ? '0 4px 12px rgba(37,99,235,0.25)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {member.name}
              </button>
            )
          })}
        </div>
      </section>

      <div style={{ marginTop: 24 }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 18px',
            borderRadius: 999,
            border: 'none',
            background: '#2563eb',
            color: '#ffffff',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            minWidth: 140,
            boxShadow: '0 10px 20px rgba(37,99,235,0.3)',
          }}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </main>
  )
}
