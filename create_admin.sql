-- 관리자 계정 생성 SQL 스크립트
-- Supabase SQL Editor에서 실행하세요

-- ============================================
-- 방법 1: 아이디로 관리자 설정 (가장 간단)
-- ============================================
-- 아래 'admin'을 실제 회원가입한 아이디로 변경하세요
UPDATE profiles
SET 
  role = 'admin',
  approved = true
WHERE username = 'admin';

-- ============================================
-- 방법 2: 이메일로 관리자 설정
-- ============================================
-- 아래 이메일을 실제 회원가입한 이메일로 변경하세요
-- UPDATE profiles
-- SET 
--   role = 'admin',
--   approved = true
-- WHERE email = 'admin@church.local';

-- ============================================
-- 방법 3: user_id로 관리자 설정
-- ============================================
-- 아래 UUID를 실제 user_id로 변경하세요
-- (Supabase Authentication > Users에서 확인)
-- UPDATE profiles
-- SET 
--   role = 'admin',
--   approved = true
-- WHERE user_id = '여기에-UUID-입력';

-- ============================================
-- 확인: 관리자로 설정된 사용자 확인
-- ============================================
SELECT 
  id,
  name,
  username,
  email,
  role,
  approved,
  created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;
