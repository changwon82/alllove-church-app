"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  position: string | null;
  role: string | null;
  departments: string[] | null;
  approved: boolean | null;
};

type EditableProfile = Profile & {
  editingName: string;
  editingEmail: string;
  editingPosition: string;
  editingRole: string;
  editingDepartments: string;
  saving: boolean;
  deleting: boolean;
  approving: boolean;
};

const POSITIONS = [
  "목사",
  "부목사",
  "강도사",
  "전도사",
  "집사",
  "안수집사",
  "권사",
  "장로",
  "성도",
];

const ROLES = ["user", "staff", "admin"];

export default function UsersManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<EditableProfile[]>([]);

  useEffect(() => {
    const checkAccessAndLoadProfiles = async () => {
      setError(null);
      setLoading(true);

      // 로그인 확인
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError || !userData?.user) {
        router.replace("/login");
        return;
      }

      // admin 권한 확인
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      if (profile?.role !== "admin") {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setHasAccess(true);

      // 모든 프로필 목록 가져오기
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, position, role, departments, approved")
        .order("full_name", { ascending: true, nullsFirst: false });

      if (profilesError) {
        setError(profilesError.message);
        setLoading(false);
        return;
      }

      // 편집 가능한 형태로 변환
      const editableProfiles: EditableProfile[] = (allProfiles || []).map(
        (p) => ({
          ...p,
          approved: p.approved ?? false,
          editingName: p.full_name || "",
          editingEmail: p.email || "",
          editingPosition: p.position || "성도",
          editingRole: p.role || "user",
          editingDepartments: Array.isArray(p.departments)
            ? p.departments.join(", ")
            : "",
          saving: false,
          deleting: false,
          approving: false,
        })
      );

      setProfiles(editableProfiles);
      setLoading(false);
    };

    checkAccessAndLoadProfiles();
  }, [router]);

  const handleUpdateProfile = async (profileId: string) => {
    const profileIndex = profiles.findIndex((p) => p.id === profileId);
    if (profileIndex === -1) return;

    const profile = profiles[profileIndex];
    
    // departments 문자열을 배열로 변환
    const departmentsArray = profile.editingDepartments
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    // 상태 업데이트: saving = true
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId ? { ...p, saving: true } : p
      )
    );

    // Supabase에 업데이트
    const { error: updateError } = await supabase
      .from("profiles")
        .update({
          full_name: profile.editingName || null,
          email: profile.editingEmail || null,
          position: profile.editingPosition,
          role: profile.editingRole,
          departments: departmentsArray,
          // 관리자로 변경 시 자동 승인
          approved: profile.editingRole === "admin" ? true : profile.approved,
        })
      .eq("id", profileId);

    if (updateError) {
      setError(`업데이트 실패: ${updateError.message}`);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId ? { ...p, saving: false } : p
        )
      );
      return;
    }

    // 성공 시 로컬 상태 업데이트
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId
          ? {
              ...p,
              full_name: profile.editingName || null,
              email: profile.editingEmail || null,
              position: profile.editingPosition,
              role: profile.editingRole,
              departments: departmentsArray,
              saving: false,
            }
          : p
      )
    );
  };

  const handleApproveProfile = async (profileId: string, approve: boolean) => {
    const profileIndex = profiles.findIndex((p) => p.id === profileId);
    if (profileIndex === -1) return;

    // 상태 업데이트: approving = true
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId ? { ...p, approving: true } : p
      )
    );

    // Supabase에 업데이트
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ approved: approve })
      .eq("id", profileId);

    if (updateError) {
      setError(`승인 처리 실패: ${updateError.message}`);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId ? { ...p, approving: false } : p
        )
      );
      return;
    }

    // 성공 시 로컬 상태 업데이트
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId
          ? {
              ...p,
              approved: approve,
              approving: false,
            }
          : p
      )
    );
  };

  const handleDeleteProfile = async (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId);
    if (!profile) return;

    // 확인 대화상자
    const confirmed = window.confirm(
      `정말로 "${profile.full_name || profile.email || "이 사용자"}"를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    // 상태 업데이트: deleting = true
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId ? { ...p, deleting: true } : p
      )
    );

    // Supabase에서 삭제
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (deleteError) {
      setError(`삭제 실패: ${deleteError.message}`);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId ? { ...p, deleting: false } : p
        )
      );
      return;
    }

    // 성공 시 목록에서 제거
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  const handleFieldChange = (
    profileId: string,
    field: "editingName" | "editingEmail" | "editingPosition" | "editingRole" | "editingDepartments",
    value: string
  ) => {
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === profileId ? { ...p, [field]: value } : p
      )
    );
  };

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
            관리자 권한이 필요합니다.
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
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            사용자 관리
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            모든 사용자의 프로필을 관리할 수 있습니다.
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

        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            padding: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            border: "1px solid #e5e7eb",
            overflowX: "auto",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #e5e7eb",
                  textAlign: "left",
                }}
              >
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  이름
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  이메일
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  직분
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  권한
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  부서
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  승인 상태
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  작업
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  삭제
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr
                  key={profile.id}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <td
                    style={{
                      padding: "16px",
                    }}
                  >
                    <input
                      type="text"
                      value={profile.editingName}
                      onChange={(e) =>
                        handleFieldChange(
                          profile.id,
                          "editingName",
                          e.target.value
                        )
                      }
                      placeholder="이름"
                      style={{
                        padding: "8px 12px",
                        fontSize: "14px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        color: "#111827",
                        width: "100%",
                        minWidth: "120px",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      padding: "16px",
                    }}
                  >
                    <input
                      type="email"
                      value={profile.editingEmail}
                      onChange={(e) =>
                        handleFieldChange(
                          profile.id,
                          "editingEmail",
                          e.target.value
                        )
                      }
                      placeholder="이메일"
                      style={{
                        padding: "8px 12px",
                        fontSize: "14px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        color: "#111827",
                        width: "100%",
                        minWidth: "200px",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      padding: "16px",
                    }}
                  >
                    <select
                      value={profile.editingPosition}
                      onChange={(e) =>
                        handleFieldChange(
                          profile.id,
                          "editingPosition",
                          e.target.value
                        )
                      }
                      style={{
                        padding: "8px 12px",
                        fontSize: "14px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        color: "#111827",
                        width: "100%",
                        minWidth: "120px",
                      }}
                    >
                      {POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    style={{
                      padding: "16px",
                    }}
                  >
                    <select
                      value={profile.editingRole}
                      onChange={(e) =>
                        handleFieldChange(
                          profile.id,
                          "editingRole",
                          e.target.value
                        )
                      }
                      style={{
                        padding: "8px 12px",
                        fontSize: "14px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        color: "#111827",
                        width: "100%",
                        minWidth: "100px",
                      }}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    style={{
                      padding: "16px",
                    }}
                  >
                    <input
                      type="text"
                      value={profile.editingDepartments}
                      onChange={(e) =>
                        handleFieldChange(
                          profile.id,
                          "editingDepartments",
                          e.target.value
                        )
                      }
                      placeholder="예: 청년부, 찬양팀"
                      style={{
                        padding: "8px 12px",
                        fontSize: "14px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        color: "#111827",
                        width: "100%",
                        minWidth: "200px",
                      }}
                    />
                  </td>
                  <td
                    style={{
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor: profile.approved
                            ? "#d1fae5"
                            : "#fee2e2",
                          color: profile.approved ? "#065f46" : "#991b1b",
                        }}
                      >
                        {profile.approved ? "✓ 승인됨" : "⏳ 대기중"}
                      </div>
                      {!profile.approved && (
                        <button
                          onClick={() => handleApproveProfile(profile.id, true)}
                          disabled={profile.approving || profile.saving || profile.deleting}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor:
                              profile.approving || profile.saving || profile.deleting
                                ? "#9ca3af"
                                : "#059669",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor:
                              profile.approving || profile.saving || profile.deleting
                                ? "not-allowed"
                                : "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (
                              !profile.approving &&
                              !profile.saving &&
                              !profile.deleting
                            ) {
                              e.currentTarget.style.backgroundColor = "#047857";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (
                              !profile.approving &&
                              !profile.saving &&
                              !profile.deleting
                            ) {
                              e.currentTarget.style.backgroundColor = "#059669";
                            }
                          }}
                        >
                          {profile.approving ? "처리중..." : "승인"}
                        </button>
                      )}
                      {profile.approved && profile.role !== "admin" && (
                        <button
                          onClick={() => handleApproveProfile(profile.id, false)}
                          disabled={profile.approving || profile.saving || profile.deleting}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            backgroundColor:
                              profile.approving || profile.saving || profile.deleting
                                ? "#9ca3af"
                                : "#dc2626",
                            color: "#fff",
                            border: "none",
                            borderRadius: "6px",
                            cursor:
                              profile.approving || profile.saving || profile.deleting
                                ? "not-allowed"
                                : "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (
                              !profile.approving &&
                              !profile.saving &&
                              !profile.deleting
                            ) {
                              e.currentTarget.style.backgroundColor = "#b91c1c";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (
                              !profile.approving &&
                              !profile.saving &&
                              !profile.deleting
                            ) {
                              e.currentTarget.style.backgroundColor = "#dc2626";
                            }
                          }}
                        >
                          {profile.approving ? "처리중..." : "거부"}
                        </button>
                      )}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "16px",
                    }}
                  >
                    <button
                      onClick={() => handleUpdateProfile(profile.id)}
                      disabled={profile.saving || profile.deleting || profile.approving}
                      style={{
                        padding: "8px 16px",
                        fontSize: "14px",
                        fontWeight: 600,
                        backgroundColor:
                          profile.saving || profile.deleting || profile.approving
                            ? "#9ca3af"
                            : "#3b82f6",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor:
                          profile.saving || profile.deleting || profile.approving
                            ? "not-allowed"
                            : "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (
                          !profile.saving &&
                          !profile.deleting &&
                          !profile.approving
                        ) {
                          e.currentTarget.style.backgroundColor = "#2563eb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (
                          !profile.saving &&
                          !profile.deleting &&
                          !profile.approving
                        ) {
                          e.currentTarget.style.backgroundColor = "#3b82f6";
                        }
                      }}
                    >
                      {profile.saving ? "저장 중..." : "저장"}
                    </button>
                  </td>
                  <td
                    style={{
                      padding: "16px",
                    }}
                  >
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      disabled={profile.saving || profile.deleting || profile.approving}
                      style={{
                        padding: "8px 16px",
                        fontSize: "14px",
                        fontWeight: 600,
                        backgroundColor:
                          profile.deleting || profile.saving || profile.approving
                            ? "#9ca3af"
                            : "#dc2626",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor:
                          profile.saving || profile.deleting || profile.approving
                            ? "not-allowed"
                            : "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (
                          !profile.saving &&
                          !profile.deleting &&
                          !profile.approving
                        ) {
                          e.currentTarget.style.backgroundColor = "#b91c1c";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (
                          !profile.saving &&
                          !profile.deleting &&
                          !profile.approving
                        ) {
                          e.currentTarget.style.backgroundColor = "#dc2626";
                        }
                      }}
                    >
                      {profile.deleting ? "삭제 중..." : "삭제"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {profiles.length === 0 && (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              사용자가 없습니다.
            </div>
          )}
        </div>
      </main>
    );
  }

  return null;
}
