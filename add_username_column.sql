-- profiles 테이블에 username 컬럼 추가 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. username 컬럼 추가
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. 기존 사용자의 username을 이메일에서 추출 (선택사항)
-- 이메일이 @church.local 형식이면 username 추출
UPDATE profiles 
SET username = SPLIT_PART(email, '@', 1)
WHERE email LIKE '%@church.local' AND username IS NULL;

-- 3. username에 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 4. 확인
SELECT id, name, username, email 
FROM profiles 
ORDER BY created_at DESC;
