-- profiles 테이블에 approved 컬럼 추가 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. approved 컬럼 추가 (기본값: false)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- 2. 기존 사용자 중 관리자와 스태프는 자동 승인
UPDATE profiles 
SET approved = true 
WHERE role IN ('admin', 'staff');

-- 3. 확인
SELECT id, email, name, role, approved 
FROM profiles 
ORDER BY created_at DESC;
