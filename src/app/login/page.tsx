"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/");
      }
    };

    checkSession();
  }, [router]);

  // 카운트다운 타이머
  useEffect(() => {
    if (cooldownSeconds === null || cooldownSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // 에러 메시지를 한국어로 변환하는 함수
  const translateError = (errorMessage: string): string => {
    const lowerMessage = errorMessage.toLowerCase();
    
    // Rate limiting 에러 처리
    if (lowerMessage.includes("for security purposes") || lowerMessage.includes("rate limit")) {
      // 대기 시간 추출 (예: "after 31 seconds"에서 31 추출)
      const secondsMatch = errorMessage.match(/(\d+)\s*seconds?/i);
      const seconds = secondsMatch ? parseInt(secondsMatch[1]) : null;
      
      if (seconds) {
        setCooldownSeconds(seconds);
        return `보안을 위해 ${seconds}초 후에 다시 시도해주세요. 잠시만 기다려주세요.`;
      }
      return "보안을 위해 잠시 후에 다시 시도해주세요.";
    }
    
    // 다른 일반적인 에러 메시지 번역
    if (lowerMessage.includes("invalid login credentials") || lowerMessage.includes("wrong password")) {
      return "아이디 또는 비밀번호가 올바르지 않습니다.";
    }
    
    if (lowerMessage.includes("email not confirmed")) {
      return "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.";
    }
    
    if (lowerMessage.includes("user not found")) {
      return "등록되지 않은 아이디입니다.";
    }
    
    // 기본값: 원본 메시지 반환
    return errorMessage;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setCooldownSeconds(null);
    setLoading(true);

    // 로그인 시: 아이디로 로그인
    // 먼저 example.com 형식으로 시도 (이메일 없이 가입한 경우)
    let signInData, signInError
    const tempEmail = `${username.trim().toLowerCase()}@example.com`
    
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
      setLoading(false);
      const translatedMessage = translateError(signInError.message);
      setError(translatedMessage);
      return;
    }

      // 2단계: 승인 상태 확인
      if (signInData.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("approved, role")
          .eq("user_id", signInData.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("프로필 조회 에러:", profileError);
          setLoading(false);
          setError("프로필을 확인하는 중 오류가 발생했습니다.");
          // 로그아웃 처리
          await supabase.auth.signOut();
          return;
        }

        // 관리자와 스태프는 자동 승인된 것으로 간주
        const isAdminOrStaff = profile?.role === "admin" || profile?.role === "staff";
        const isApproved = profile?.approved === true || isAdminOrStaff;

        if (!isApproved) {
          setLoading(false);
          setError(
            "⏳ 관리자 승인 대기 중입니다.\n\n" +
            "회원가입이 완료되었지만 아직 관리자의 승인을 받지 못했습니다.\n" +
            "관리자가 승인하면 로그인할 수 있습니다.\n\n" +
            "승인까지 시간이 걸릴 수 있으니 잠시만 기다려주세요."
          );
          // 로그아웃 처리
          await supabase.auth.signOut();
          return;
        }
      }

    setLoading(false);
    router.push("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f4f4f5",
        padding: "20px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          backgroundColor: "#fff",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          padding: "28px 24px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
          로그인
        </h1>
        <p style={{ color: "#555", marginBottom: "20px", fontSize: "14px" }}>
          아이디와 비밀번호를 입력해 주세요.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="username" style={{ fontSize: "14px", fontWeight: 600 }}>
              아이디
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="honggildong"
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="password" style={{ fontSize: "14px", fontWeight: 600 }}>
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="******"
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
              }}
            />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                padding: "14px 16px",
                borderRadius: "10px",
                fontSize: "13px",
                lineHeight: "1.6",
                whiteSpace: "pre-line",
              }}
            >
              {error}
              {cooldownSeconds !== null && cooldownSeconds > 0 && (
                <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.8 }}>
                  ⏱️ {cooldownSeconds}초 후에 다시 시도할 수 있습니다.
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "4px",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: loading ? "#9ca3af" : "#111827",
              color: "#fff",
              fontWeight: 700,
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s ease",
            }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
