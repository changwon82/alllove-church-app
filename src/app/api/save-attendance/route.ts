// src/app/api/save-attendance/route.ts
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
  try {
    const { date, memberIds, service_type, department } = await req.json()

    if (!date || !service_type || !department || !Array.isArray(memberIds)) {
      return Response.json(
        { success: false, error: '날짜, 예배 종류, 부서, 출석 대상이 필요합니다.' },
        { status: 400 },
      )
    }

    // 1. 해당 date + service_type + department에 대한 기존 attendance 행을 모두 삭제
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('date', date)
      .eq('service_type', service_type)
      .eq('department', department)

    if (deleteError) throw deleteError

    // 2. 이번 memberIds 전체를 다시 insert (memberIds가 비어있을 수도 있음)
    if (memberIds.length > 0) {
      const records = memberIds.map((id: string) => ({
        member_id: id,
        date,
        service_type,
        department,
      }))

      const { error: insertError } = await supabase
        .from('attendance')
        .insert(records)

      if (insertError) throw insertError
    }

    return Response.json({ success: true })
  } catch (e: any) {
    console.error(e)
    return Response.json(
      { success: false, error: e.message ?? '알 수 없는 오류' },
      { status: 500 },
    )
  }
}
