# 이메일 도메인 변경 안내

## 문제
Supabase가 `@church.local` 도메인을 유효하지 않은 이메일로 판단하여 회원가입 시 에러가 발생했습니다.

## 해결
모든 내부 이메일 형식을 `@church.local`에서 `@alllove.church`로 변경했습니다.

## 변경된 파일
- `src/app/page.tsx` (LoginModal, SignupModal)
- `src/app/login/page.tsx`
- `src/app/signup/page.tsx`

## 영향
- **기존 사용자**: 기존에 `@church.local` 형식으로 가입한 사용자는 로그인할 수 없습니다.
- **해결 방법**: 기존 사용자의 이메일을 업데이트해야 합니다.

## 기존 사용자 이메일 업데이트 SQL

Supabase SQL Editor에서 실행:

```sql
-- 기존 사용자의 이메일을 새 도메인으로 업데이트
UPDATE auth.users
SET email = REPLACE(email, '@church.local', '@alllove.church')
WHERE email LIKE '%@church.local';

-- 확인
SELECT id, email 
FROM auth.users 
WHERE email LIKE '%@alllove.church';
```

또는 profiles 테이블의 username을 사용하여 업데이트:

```sql
-- profiles 테이블의 username을 기반으로 auth.users의 이메일 업데이트
UPDATE auth.users
SET email = p.username || '@alllove.church'
FROM profiles p
WHERE auth.users.id = p.user_id
  AND auth.users.email LIKE '%@church.local';
```

## 새 사용자
이제부터 회원가입하는 모든 사용자는 `아이디@alllove.church` 형식으로 저장됩니다.
