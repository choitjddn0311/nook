-- Nook: posts 테이블 권한 줄이기 (MVP 10단계 마무리 점검)
-- Supabase에 적용된 마이그레이션 harden_posts_grants (버전 20261105070148)와 같은 내용.
--
-- Supabase는 새 테이블에 anon/authenticated 권한을 기본으로 모두 준다. 데이터는 RLS가 지키지만,
-- - 로그인 안 한 사람(anon)은 이 테이블에 접근할 일이 전혀 없으므로 권한을 모두 회수한다.
-- - TRUNCATE(테이블 통째로 비우기)는 RLS가 막지 못하므로 로그인 사용자에게서도 회수한다.
--   (REFERENCES, TRIGGER도 앱에서 쓰지 않으므로 함께 회수. 조회·작성·수정·삭제는 그대로)

revoke all on table public.posts from anon;
revoke truncate, references, trigger on table public.posts from authenticated;
