# 관리자 승인 시스템 설정 가이드

## 기능 설명

- 이메일 인증 없이 회원가입 가능
- 관리자 승인 후 로그인 가능
- 관리자와 스태프는 자동 승인

## Supabase 설정

### 1. 이메일 인증 비활성화

1. Supabase 대시보드 > Authentication > Settings
2. "Enable email confirmations" 옵션을 **비활성화**
3. 저장

또는 SQL로 설정:

```sql
-- 이메일 인증 비활성화 (Supabase 대시보드에서 설정하는 것을 권장)
-- Settings > Authentication > Email Auth > Confirm email: OFF
```

### 2. profiles 테이블에 approved 컬럼 추가

Supabase SQL Editor에서 실행:

```sql
-- approved 컬럼 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- 기존 관리자와 스태프는 자동 승인
UPDATE profiles 
SET approved = true 
WHERE role IN ('admin', 'staff');
```

자세한 내용은 `add_approved_column.sql` 파일을 참고하세요.

## 작동 방식

### 회원가입
1. 사용자가 회원가입
2. 프로필이 `approved: false` 상태로 생성
3. "관리자 승인 대기 중" 메시지 표시

### 로그인
1. 사용자가 로그인 시도
2. 승인 상태 확인
3. 승인되지 않았으면 로그인 거부
4. 승인되었으면 로그인 허용

### 관리자 승인
1. 관리자가 `/admin/users` 페이지 접속
2. 승인 대기 중인 사용자 확인
3. "승인" 버튼 클릭
4. 사용자가 로그인 가능

## 관리자 페이지 기능

- **승인 상태 표시**: 각 사용자의 승인 상태 확인
- **승인 버튼**: 승인 대기 중인 사용자 승인
- **거부 버튼**: 승인된 사용자 거부 (관리자 제외)

## 주의사항

⚠️ **기존 사용자 처리**
- 기존 사용자는 `approved` 필드가 `null`일 수 있습니다
- 다음 SQL로 기본값 설정:

```sql
UPDATE profiles 
SET approved = COALESCE(approved, false)
WHERE approved IS NULL;
```

⚠️ **관리자 계정**
- 관리자와 스태프는 자동으로 승인된 것으로 간주됩니다
- `role`이 `admin` 또는 `staff`이면 승인 상태와 관계없이 로그인 가능
