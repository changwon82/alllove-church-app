"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);

  // 카운트다운 타이머
  useEffect(() => {
    if (cooldownSeconds === null || cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev === null || prev <= 1) return null;
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
      const secondsMatch = errorMessage.match(/(\d+)\s*seconds?/i);
      const seconds = secondsMatch ? parseInt(secondsMatch[1]) : null;

      if (seconds) {
        setCooldownSeconds(seconds);
        return `보안을 위해 ${seconds}초 후에 다시 시도해주세요. 잠시만 기다려주세요.`;
      }
      return "보안을 위해 잠시 후에 다시 시도해주세요.";
    }

    if (
      lowerMessage.includes("user already registered") ||
      lowerMessage.includes("already exists") ||
      lowerMessage.includes("duplicate key") ||
      lowerMessage.includes("unique constraint")
    ) {
      return "이미 등록된 이메일입니다. 로그인을 시도해주세요.";
    }

    if (lowerMessage.includes("invalid email") || lowerMessage.includes("email format")) {
      return "올바른 이메일 형식이 아닙니다.";
    }

    if (lowerMessage.includes("password") && lowerMessage.includes("weak")) {
      return "비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.";
    }

    if (lowerMessage.includes("password") && lowerMessage.includes("length")) {
      return "비밀번호는 최소 6자 이상이어야 합니다.";
    }

    if (lowerMessage.includes("email not confirmed") || lowerMessage.includes("email confirmation")) {
      return "이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.";
    }

    if (lowerMessage.includes("foreign key") || lowerMessage.includes("constraint")) {
      return "데이터베이스 제약 조건 오류가 발생했습니다. 관리자에게 문의해주세요.";
    }

    if (lowerMessage.includes("null value") || lowerMessage.includes("not null")) {
      return "필수 정보가 누락되었습니다. 모든 필드를 입력해주세요.";
    }

    if (lowerMessage.includes("network") || lowerMessage.includes("connection")) {
      return "네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.";
    }

    return errorMessage;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setCooldownSeconds(null);

    // 기본 검증
    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (!name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    if (!username.trim()) {
      setError("아이디를 입력해주세요.");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      setError("아이디는 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용할 수 있습니다.");
      return;
    }

    // 이메일이 있으면 사용하고, 없으면 임시 이메일 생성
    // Supabase는 유효한 이메일 형식이 필요하므로 실제 이메일을 우선 사용
    let signupEmail: string;
    if (email && email.trim().length > 0) {
      signupEmail = email.trim();
    } else {
      // 이메일이 없으면 아이디 기반으로 임시 이메일 생성
      // example.com은 RFC에서 예약된 도메인으로 유효한 형식으로 인정됨
      signupEmail = `${username.trim().toLowerCase()}@example.com`;
    }

    setLoading(true);

    try {
      // 1단계: Supabase Auth에 이메일/비밀번호로 계정 생성
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password,
        options: {
          emailRedirectTo: `${location.origin}/login`,
        },
      });

      if (signUpError) {
        console.error("회원가입 에러:", signUpError);
        throw signUpError;
      }

      const user = data?.user;
      if (!user) {
        throw new Error("사용자 계정이 생성되지 않았습니다. 이메일 인증이 필요할 수 있습니다.");
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
      });

      const profileResult = await profileResponse.json();

      if (!profileResponse.ok || !profileResult.success) {
        console.error("프로필 생성 에러:", profileResult);
        throw new Error(
          `프로필 생성 중 오류가 발생했습니다: ${profileResult.error || "알 수 없는 오류"}`
        );
      }

      setSuccess("회원가입이 완료되었습니다! 관리자 승인 후 로그인할 수 있습니다.");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      let message = "회원가입 중 오류가 발생했습니다.";

      if (err) {
        // 에러 메시지 추출
        if (err.message) {
          message = translateError(err.message);
        } else if (typeof err === "string") {
          message = translateError(err);
        } else if (err.error?.message) {
          message = translateError(err.error.message);
        } else if (err.code) {
          // 코드만 있는 경우
          message = `오류가 발생했습니다. (코드: ${err.code})`;
        } else {
          // 빈 객체나 알 수 없는 에러
          const errorStr = JSON.stringify(err);
          if (errorStr !== "{}") {
            message = `오류가 발생했습니다: ${errorStr}`;
          } else {
            message = "프로필 생성 중 오류가 발생했습니다. RLS 정책을 확인하거나 관리자에게 문의해주세요.";
          }
        }

        if (process.env.NODE_ENV === "development") {
          console.error("전체 에러 객체:", err);
          console.error("에러 타입:", typeof err);
          console.error("에러 키:", Object.keys(err || {}));
          if (err.code) {
            message += ` (코드: ${err.code})`;
          }
        }
      }

      setError(message);
    } finally {
      setLoading(false);
    }
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
          회원가입
        </h1>
        <p style={{ color: "#555", marginBottom: "20px", fontSize: "14px" }}>
          기본 정보를 입력해 주세요. 관리자 승인 후 로그인할 수 있습니다.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* 이름 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="name" style={{ fontSize: "14px", fontWeight: 600 }}>
              이름 <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="홍길동"
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
          </div>

          {/* 아이디 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="username" style={{ fontSize: "14px", fontWeight: 600 }}>
              아이디 <span style={{ color: "#dc2626" }}>*</span>
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
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              영문, 숫자, 언더스코어(_), 하이픈(-)만 사용 가능합니다.
            </span>
          </div>

          {/* 비밀번호 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="password" style={{ fontSize: "14px", fontWeight: 600 }}>
              비밀번호 <span style={{ color: "#dc2626" }}>*</span>
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
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
          </div>

          {/* 비밀번호 확인 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="confirmPassword" style={{ fontSize: "14px", fontWeight: 600 }}>
              비밀번호 확인 <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="******"
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
          </div>

          {/* 이메일 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="email" style={{ fontSize: "14px", fontWeight: 600 }}>
              이메일 (선택사항)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                fontSize: 14,
              }}
            />
            <span style={{ fontSize: "12px", color: "#6b7280" }}>
              선택사항입니다. 비밀번호 찾기 등에 사용됩니다.
            </span>
          </div>

          {/* 메시지 영역 */}
          {success && (
            <div
              style={{
                backgroundColor: "#ecfdf3",
                color: "#166534",
                border: "1px solid #bbf7d0",
                padding: "10px 12px",
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
                backgroundColor: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                padding: "10px 12px",
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: "pre-line",
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
              border: "none",
              backgroundColor: loading ? "#9ca3af" : "#111827",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.2s ease",
            }}
          >
            {loading ? "처리중..." : "회원가입"}
          </button>
        </form>
      </div>
    </div>
  );
}
