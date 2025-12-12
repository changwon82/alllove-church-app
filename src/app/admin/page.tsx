"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  user_id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  position: string | null;
  departments: string[] | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAttendance: 0,
    todayAttendance: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) 현재 로그인 유저 가져오기
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          router.replace("/login");
          return;
        }

        // 2) 서버 API에 "프로필 보장(ensure)" 요청
        const res = await fetch("/api/profile/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message ?? "프로필 확인 중 오류가 발생했습니다.");
        }

        const data = (await res.json()) as { profile: Profile };

        if (!cancelled) {
          setProfile(data.profile);

          // 관리자 또는 스태프인 경우 통계 데이터 가져오기
          if (data.profile.role === "admin" || data.profile.role === "staff") {
            const [usersResult, attendanceResult, todayResult] = await Promise.all([
              supabase.from("profiles").select("id", { count: "exact", head: true }),
              supabase.from("attendance").select("id", { count: "exact", head: true }),
              supabase
                .from("attendance")
                .select("id", { count: "exact", head: true })
                .eq("date", new Date().toISOString().split("T")[0]),
            ]);

            if (!cancelled) {
              setStats({
                totalUsers: usersResult.count || 0,
                totalAttendance: attendanceResult.count || 0,
                todayAttendance: todayResult.count || 0,
              });
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("AdminPage init error:", err);
          setError(err.message ?? "알 수 없는 오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        <div style={{ textAlign: "center", color: "white" }}>
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
              animation: "spin 1s linear infinite",
            }}
          >
            ⏳
          </div>
          <p style={{ fontSize: 18, fontWeight: 600, opacity: 0.9 }}>로딩 중...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: "24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
            maxWidth: "500px",
            width: "100%",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 20 }}>⚠️</div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#dc2626",
              marginBottom: "16px",
              letterSpacing: "-0.5px",
            }}
          >
            오류가 발생했습니다
          </h1>
          <p
            style={{
              color: "#6b7280",
              fontSize: "15px",
              whiteSpace: "pre-line",
              lineHeight: 1.6,
            }}
          >
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: "24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 20 }}>📋</div>
          <p style={{ color: "#6b7280", fontSize: "16px", fontWeight: 500 }}>
            프로필 정보를 불러올 수 없습니다.
          </p>
        </div>
      </main>
    );
  }

  // ✅ 여기부터는 profile이 항상 존재한다고 가정하고 사용 가능
  if (profile.role !== "admin" && profile.role !== "staff") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: "24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "#dc2626",
              marginBottom: "12px",
              letterSpacing: "-0.5px",
            }}
          >
            접근 권한이 없습니다.
          </h1>
          <p style={{ color: "#6b7280", fontSize: "15px", lineHeight: 1.6 }}>
            관리자 또는 스태프 권한이 필요합니다.
          </p>
        </div>
      </main>
    );
  }

  const adminCards = [
    {
      title: "출석 현황",
      description: "주일별 출석 통계를 확인합니다",
      href: "/admin/dashboard",
      icon: "📊",
      color: "#2563eb",
    },
    {
      title: "사용자 관리",
      description: "모든 사용자의 정보를 관리합니다",
      href: "/admin/users",
      icon: "👥",
      color: "#059669",
      adminOnly: true,
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 32px",
        maxWidth: 1400,
        margin: "0 auto",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
    >
      <header style={{ marginBottom: 40 }}>
        <div
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            borderRadius: 24,
            padding: "32px",
            marginBottom: 32,
            boxShadow: "0 10px 40px rgba(102, 126, 234, 0.3)",
            color: "white",
          }}
        >
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              marginBottom: 12,
              letterSpacing: "-1px",
              textShadow: "0 2px 20px rgba(0,0,0,0.2)",
            }}
          >
            관리자 대시보드
          </h1>
          <p style={{ fontSize: 16, opacity: 0.95, marginBottom: 4 }}>
            {profile.name || profile.email} 님, 환영합니다.
          </p>
          <p style={{ fontSize: 14, opacity: 0.85 }}>
            시스템 관리 및 통계를 확인할 수 있습니다.
          </p>
        </div>
      </header>

        {/* 통계 카드 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 20,
              padding: 28,
              boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)",
              color: "white",
              transition: "all 0.3s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 15px 40px rgba(102, 126, 234, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(102, 126, 234, 0.3)";
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.9 }}>👥</div>
            <div style={{ fontSize: 42, fontWeight: 800, marginBottom: 8, letterSpacing: "-1px" }}>
              {stats.totalUsers}
            </div>
            <div style={{ fontSize: 15, opacity: 0.9, fontWeight: 500 }}>전체 사용자</div>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              borderRadius: 20,
              padding: 28,
              boxShadow: "0 10px 30px rgba(245, 87, 108, 0.3)",
              color: "white",
              transition: "all 0.3s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 15px 40px rgba(245, 87, 108, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(245, 87, 108, 0.3)";
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.9 }}>✓</div>
            <div style={{ fontSize: 42, fontWeight: 800, marginBottom: 8, letterSpacing: "-1px" }}>
              {stats.totalAttendance}
            </div>
            <div style={{ fontSize: 15, opacity: 0.9, fontWeight: 500 }}>전체 출석 기록</div>
          </div>
          <div
            style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              borderRadius: 20,
              padding: 28,
              boxShadow: "0 10px 30px rgba(79, 172, 254, 0.3)",
              color: "white",
              transition: "all 0.3s ease",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 15px 40px rgba(79, 172, 254, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 10px 30px rgba(79, 172, 254, 0.3)";
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.9 }}>📅</div>
            <div style={{ fontSize: 42, fontWeight: 800, marginBottom: 8, letterSpacing: "-1px" }}>
              {stats.todayAttendance}
            </div>
            <div style={{ fontSize: 15, opacity: 0.9, fontWeight: 500 }}>오늘 출석</div>
          </div>
        </div>

        {/* 관리 기능 카드 */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
          }}
        >
          {adminCards
            .filter((card) => !card.adminOnly || profile.role === "admin")
            .map((card) => (
              <Link
                key={card.href}
                href={card.href}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                    borderRadius: 24,
                    padding: 32,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    border: "1px solid rgba(0,0,0,0.05)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${card.color}20 0%, ${card.color}10 100%)`,
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      fontSize: 48,
                      marginBottom: 20,
                      textAlign: "center",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {card.icon}
                  </div>
                  <h2
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      marginBottom: 10,
                      textAlign: "center",
                      color: "#1f2937",
                      letterSpacing: "-0.5px",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {card.title}
                  </h2>
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: 15,
                      textAlign: "center",
                      margin: 0,
                      lineHeight: 1.6,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {card.description}
                  </p>
                </div>
              </Link>
            ))}
        </section>
      </main>
  );
}
