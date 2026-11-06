// Supabase DB의 TypeScript 타입.
// supabase/migrations/20261105055525_create_posts.sql 스키마를 기준으로, Supabase 타입 생성기와 같은 모양으로 직접 작성했다.
// DB 구조를 바꾸면 이 파일도 같이 고친다.
//
// - Row:    DB에서 읽어 온 글 한 줄
// - Insert: 새 글을 넣을 때 (기본값이 있는 칸은 생략 가능)
// - Update: 글을 고칠 때 (모든 칸 생략 가능)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          content: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title?: string | null;
          content?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          content?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // 14단계: 글 아래에 덧붙인 생각 (supabase/migrations/20261105080049_create_post_notes.sql)
      post_notes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id?: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_notes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// 화면 코드에서 짧게 쓰기 위한 별칭
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];
export type PostNote = Database["public"]["Tables"]["post_notes"]["Row"];
