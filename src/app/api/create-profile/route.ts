import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 서버 사이드에서 사용할 Supabase 클라이언트
// 서비스 롤 키를 사용하여 RLS를 우회합니다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('환경 변수가 설정되지 않았습니다. NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.')
}

const supabaseAdmin = serviceRoleKey
  ? createClient(supabaseUrl!, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: '서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요.' 
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { user_id, full_name, username, email, role } = body

    // 필수 필드 검증
    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id가 필요합니다.' },
        { status: 400 }
      )
    }

    // 기존 프로필 확인 (id로 조회)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .maybeSingle()

    let result
    if (existingProfile) {
      // 기존 프로필 업데이트
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: full_name || existingProfile.full_name || null,
          username: username || existingProfile.username || null,
          email: email || existingProfile.email || null,
          role: role || existingProfile.role || 'user',
          approved: role === 'admin' ? true : (existingProfile.approved ?? false), // 관리자로 변경 시 자동 승인
        })
        .eq('id', user_id)
        .select()
        .single()

      if (error) {
        console.error('프로필 업데이트 에러:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }
      result = data
    } else {
      // 새 프로필 생성 (승인 대기 상태)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user_id,
          full_name: full_name || null,
          username: username || null,
          email: email || null,
          role: role || 'user',
          approved: role === 'admin' ? true : false, // 관리자는 자동 승인
        })
        .select()
        .single()

      if (error) {
        console.error('프로필 생성 에러:', error)
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        )
      }
      result = data
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('API 에러:', error)
    return NextResponse.json(
      { success: false, error: error.message || '프로필 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
