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
          is_favorite: boolean;
          format: "plain" | "markdown";
        };
        Insert: {
          id?: string;
          user_id?: string;
          title?: string | null;
          content?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
          is_favorite?: boolean;
          format?: "plain" | "markdown";
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          content?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
          is_favorite?: boolean;
          format?: "plain" | "markdown";
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
      // 17단계: 계정마다 승인 상태·관리자 여부 (supabase/migrations/20261107062127_add_profiles_approval.sql)
      // 본인 것을 읽기만 할 수 있다. 바꾸는 건 관리자 함수(admin_set_status)만.
      // 지난 오늘 알림: 알림을 켠 기기 (supabase/migrations/20261108014217_push_subscriptions.sql)
      // 넣기는 save_push_subscription 함수로만, 읽기·지우기는 본인 것만
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
          last_sent_on: string | null;
        };
        Insert: { [_ in never]: never };
        Update: { [_ in never]: never };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          status: "pending" | "approved" | "rejected";
          is_admin: boolean;
          created_at: string;
          approved_at: string | null;
          onboarded_at: string | null;
        };
        Insert: { [_ in never]: never };
        Update: { [_ in never]: never };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_approved: { Args: Record<PropertyKey, never>; Returns: boolean };
      admin_list_signups: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          email: string | null;
          provider: string;
          status: "pending" | "approved" | "rejected";
          is_admin: boolean;
          post_count: number; // 글 개수만 (내용은 다루지 않음)
          created_at: string;
          approved_at: string | null;
        }[];
      };
      // 관리자 대시보드: 계정 삭제 (supabase/migrations/20261108011427_admin_dashboard.sql)
      admin_delete_account: { Args: { target: string }; Returns: undefined };
      admin_set_status: { Args: { target: string; new_status: "approved" | "rejected" }; Returns: undefined };
      // 18단계: 복구 코드 (supabase/migrations/20261107064302_add_account_recovery.sql)
      // 19.5단계: 사용법 안내를 봤다는 기록 (supabase/migrations/20261107074248_add_onboarding.sql)
      complete_onboarding: { Args: Record<PropertyKey, never>; Returns: undefined };
      // 20단계: 탈퇴 (supabase/migrations/20261107075800_add_delete_my_account.sql)
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      // 랜딩 문의하기 (supabase/migrations/20261108045400_inquiries.sql). 표는 직접 읽거나 쓸 수 없고 함수로만
      submit_inquiry: { Args: { p_email: string; p_message: string }; Returns: undefined };
      admin_list_inquiries: {
        Args: Record<PropertyKey, never>;
        Returns: { id: string; email: string; message: string; created_at: string; answered_at: string | null }[];
      };
      admin_update_inquiry: { Args: { target: string; action: "answered" | "unanswered" | "delete" }; Returns: undefined };
      save_push_subscription: { Args: { p_endpoint: string; p_p256dh: string; p_auth: string }; Returns: undefined };
      create_recovery_code: { Args: Record<PropertyKey, never>; Returns: string };
      reset_password_with_code: { Args: { identifier: string; code: string; new_password: string }; Returns: string | null };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// 화면 코드에서 짧게 쓰기 위한 별칭
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
export type PostUpdate = Database["public"]["Tables"]["posts"]["Update"];
export type PostNote = Database["public"]["Tables"]["post_notes"]["Row"];
export type Signup = Database["public"]["Functions"]["admin_list_signups"]["Returns"][number];
