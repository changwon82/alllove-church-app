"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  full_name: string | null;
  email: string | null;
  position: string | null;
  departments: string[] | null;
  role: string | null;
};

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setError(null);
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUserEmail(user.email ?? null);

      // 프로필 조회
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError("프로필을 불러오는 중 문제가 발생했어요.");
        setLoading(false);
        return;
      }

      // 없으면 자동 생성
      if (!profile) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            role: "member",
          });

        if (insertError) {
          setError("프로필 생성 중 오류가 발생했어요.");
          setLoading(false);
          return;
        }

        // 생성 후 다시 조회
        const { data: newProfile } = await supabase
          .from("profiles")
          .select("full_name, email, position, departments, role")
          .eq("id", user.id)
          .maybeSingle();

        setProfile(newProfile);
      } else {
        setProfile(profile);
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const positionText = profile?.position || "성도";
  const emailText = profile?.email || userEmail || "-";
  const departments = profile?.departments ?? [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f4f4f5, #e5e7eb)",
        display: "flex",
        justifyContent: "center",
        padding: "24px 16px 48px",
        boxSizing: "border-box",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          backgroundColor: "#fff",
          borderRadius: "18px",
          boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
          padding: "24px",
          border: "1px solid #e5e7eb",
        }}
      >
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>마이페이지</p>
            <h1 style={{ margin: "4px 0 0", fontSize: "24px", fontWeight: 800, color: "#111827" }}>내 정보</h1>
          </div>
        </header>

        {loading ? (
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: "#f9fafb",
              border: "1px dashed #e5e7eb",
              borderRadius: "12px",
              color: "#4b5563",
              textAlign: "center",
            }}
          >
            정보를 불러오는 중입니다...
          </div>
        ) : error ? (
          <div
            style={{
              marginTop: "16px",
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        ) : !profile ? (
          <div
            style={{
              marginTop: "20px",
              padding: "18px",
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              color: "#4b5563",
              textAlign: "center",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            프로필 정보가 없습니다. 관리자에게 문의해 주세요.
          </div>
        ) : (
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div
              style={{
                padding: "18px 16px",
                borderRadius: "14px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e5e7eb",
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                rowGap: "10px",
                columnGap: "12px",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#6b7280", fontWeight: 600, fontSize: "14px" }}>이름</span>
              <span style={{ color: "#111827", fontSize: "15px", fontWeight: 700 }}>{profile.full_name || "-"}</span>

              <span style={{ color: "#6b7280", fontWeight: 600, fontSize: "14px" }}>이메일</span>
              <span style={{ color: "#111827", fontSize: "15px" }}>{emailText}</span>

              <span style={{ color: "#6b7280", fontWeight: 600, fontSize: "14px" }}>직분</span>
              <span style={{ color: "#111827", fontSize: "15px" }}>{positionText}</span>

              <span style={{ color: "#6b7280", fontWeight: 600, fontSize: "14px" }}>담당 부서</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {departments.length > 0 ? (
                  departments.map((dept) => (
                    <span
                      key={dept}
                      style={{
                        padding: "6px 10px",
                        backgroundColor: "#eef2ff",
                        color: "#3730a3",
                        borderRadius: "999px",
                        fontSize: "12px",
                        border: "1px solid #e0e7ff",
                      }}
                    >
                      {dept}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>-</span>
                )}
              </div>

              <span style={{ color: "#6b7280", fontWeight: 600, fontSize: "14px" }}>권한</span>
              <span
                style={{
                  color: "#111827",
                  fontSize: "14px",
                  fontWeight: 600,
                  padding: "6px 10px",
                  backgroundColor: "#ecfeff",
                  borderRadius: "10px",
                  border: "1px solid #a5f3fc",
                  display: "inline-flex",
                  width: "fit-content",
                }}
              >
                {profile.role || "미지정"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
