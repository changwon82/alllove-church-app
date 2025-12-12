"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type AttendanceData = {
  date: string;
  count: number;
};

// 최근 4주간의 주일 날짜들을 계산하는 함수
const getLast4Sundays = (): string[] => {
  const sundays: string[] = [];
  const today = new Date();
  const day = today.getDay(); // 0(일) ~ 6(토)
  
  // 오늘부터 가장 가까운 과거 주일 찾기
  const daysToSubtract = day === 0 ? 0 : day; // 오늘이 일요일이면 0, 아니면 day만큼 빼기
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - daysToSubtract);
  lastSunday.setHours(0, 0, 0, 0);
  
  // 최근 4주간의 주일 날짜들 계산
  for (let i = 0; i < 4; i++) {
    const sunday = new Date(lastSunday);
    sunday.setDate(lastSunday.getDate() - (i * 7));
    sundays.push(sunday.toISOString().slice(0, 10)); // YYYY-MM-DD
  }
  
  return sundays.reverse(); // 오래된 순서부터 최신 순서로
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);

  // 로그인 + 권한 체크
  useEffect(() => {
    const checkAccess = async () => {
      setError(null);
      setLoading(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profileError) {
        setError(profileError.message);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const role = profile?.role;
      if (role === "admin" || role === "staff") {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }

      setLoading(false);
    };

    checkAccess();
  }, [router]);

  // 출석 데이터 가져오기
  useEffect(() => {
    if (!hasAccess) return;

    const fetchAttendanceData = async () => {
      setError(null);
      const sundays = getLast4Sundays();
      const data: AttendanceData[] = [];

      for (const sunday of sundays) {
        // 각 주일 날짜별로 출석 인원 수 집계
        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from("attendance")
          .select("member_id")
          .eq("date", sunday);

        if (attendanceError) {
          console.error(`날짜 ${sunday}의 출석 데이터를 가져오는 중 오류:`, attendanceError);
          data.push({ date: sunday, count: 0 });
          continue;
        }

        // 고유한 member_id 개수 계산
        const uniqueMemberIds = new Set(
          (attendanceRecords || []).map((record) => record.member_id)
        );
        const count = uniqueMemberIds.size;

        // 날짜 포맷팅 (MM/DD 형식)
        const dateObj = new Date(sunday);
        const formattedDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

        data.push({ date: formattedDate, count });
      }

      setAttendanceData(data);
    };

    fetchAttendanceData();
  }, [hasAccess]);

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <p>로딩 중...</p>
      </main>
    );
  }

  if (hasAccess === false) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "32px",
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#b91c1c",
              marginBottom: "12px",
            }}
          >
            접근 권한이 없습니다.
          </h1>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            관리자 또는 스태프 권한이 필요합니다.
          </p>
        </div>
      </main>
    );
  }

  if (hasAccess === true) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: 24,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            출석 현황판
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            최근 4주간의 주일 출석 현황을 확인할 수 있습니다.
          </p>
        </header>

        {error && (
          <div
            style={{
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "14px",
              marginBottom: 24,
            }}
          >
            {error}
          </div>
        )}

        <section
          style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            padding: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
            주일별 출석 인원
          </h2>
          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  label={{ value: "날짜 (주일)", position: "insideBottom", offset: -5 }}
                />
                <YAxis 
                  label={{ value: "출석 인원 수", angle: -90, position: "insideLeft" }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    );
  }

  return null;
}
