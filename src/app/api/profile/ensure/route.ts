import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { userId, email } = (await req.json()) as {
      userId: string;
      email: string | null;
    };

    if (!userId) {
      return NextResponse.json(
        { message: "userId가 없습니다." },
        { status: 400 }
      );
    }

    // 서비스 롤 키를 사용하여 RLS 우회
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { message: "서버 설정 오류: 환경 변수가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1) 기존 프로필 조회 (user_id로 조회)
    const { data: existing, error: selectError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) {
      console.error("프로필 조회 실패:", selectError);
      return NextResponse.json(
        { message: "프로필 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    if (existing) {
      // 이미 있으면 그대로 반환
      return NextResponse.json({ profile: existing }, { status: 200 });
    }

    // 2) 없으면 새로 생성 (승인 대기 상태)
    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        email: email || null,
        name: null,
        role: "user", // 기본값
        position: "성도",
        departments: null,
        approved: false, // 관리자 승인 대기
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      console.error("프로필 생성 실패:", insertError);
      return NextResponse.json(
        { message: "프로필 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: inserted }, { status: 201 });
  } catch (err: any) {
    console.error("ensure profile route error:", err);
    return NextResponse.json(
      { message: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
