export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          address: string | null
          bike_parking: boolean
          category: string
          change_rooms: boolean
          coffee: boolean
          created_at: string
          description: string | null
          event_cost: string | null
          event_dates: string | null
          family_friendly: boolean
          foursquare_id: string | null
          hero_image_url: string | null
          high_chairs: boolean
          hours_close: string | null
          hours_open: string | null
          id: string
          is_event: boolean
          is_open: boolean
          latitude: number
          longitude: number
          name: string
          organizer_facebook: string | null
          organizer_instagram: string | null
          organizer_name: string | null
          organizer_phone: string | null
          organizer_website: string | null
          outdoor_seating: boolean
          parking: boolean
          pet_friendly: boolean
          phone: string | null
          power_outlets: boolean
          rating: number | null
          region: string | null
          review_count: number
          shade: boolean
          show_in_featured: boolean
          show_in_whats_on: boolean
          showers: boolean
          source_url: string | null
          ticket_url: string | null
          updated_at: string
          website: string | null
          wheelchair_accessible: boolean
          wifi: boolean
        }
        Insert: {
          address?: string | null
          bike_parking?: boolean
          category: string
          change_rooms?: boolean
          coffee?: boolean
          created_at?: string
          description?: string | null
          event_cost?: string | null
          event_dates?: string | null
          family_friendly?: boolean
          foursquare_id?: string | null
          hero_image_url?: string | null
          high_chairs?: boolean
          hours_close?: string | null
          hours_open?: string | null
          id?: string
          is_event?: boolean
          is_open?: boolean
          latitude: number
          longitude: number
          name: string
          organizer_facebook?: string | null
          organizer_instagram?: string | null
          organizer_name?: string | null
          organizer_phone?: string | null
          organizer_website?: string | null
          outdoor_seating?: boolean
          parking?: boolean
          pet_friendly?: boolean
          phone?: string | null
          power_outlets?: boolean
          rating?: number | null
          region?: string | null
          review_count?: number
          shade?: boolean
          show_in_featured?: boolean
          show_in_whats_on?: boolean
          showers?: boolean
          source_url?: string | null
          ticket_url?: string | null
          updated_at?: string
          website?: string | null
          wheelchair_accessible?: boolean
          wifi?: boolean
        }
        Update: {
          address?: string | null
          bike_parking?: boolean
          category?: string
          change_rooms?: boolean
          coffee?: boolean
          created_at?: string
          description?: string | null
          event_cost?: string | null
          event_dates?: string | null
          family_friendly?: boolean
          foursquare_id?: string | null
          hero_image_url?: string | null
          high_chairs?: boolean
          hours_close?: string | null
          hours_open?: string | null
          id?: string
          is_event?: boolean
          is_open?: boolean
          latitude?: number
          longitude?: number
          name?: string
          organizer_facebook?: string | null
          organizer_instagram?: string | null
          organizer_name?: string | null
          organizer_phone?: string | null
          organizer_website?: string | null
          outdoor_seating?: boolean
          parking?: boolean
          pet_friendly?: boolean
          phone?: string | null
          power_outlets?: boolean
          rating?: number | null
          region?: string | null
          review_count?: number
          shade?: boolean
          show_in_featured?: boolean
          show_in_whats_on?: boolean
          showers?: boolean
          source_url?: string | null
          ticket_url?: string | null
          updated_at?: string
          website?: string | null
          wheelchair_accessible?: boolean
          wifi?: boolean
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          activity_id: string | null
          created_at: string
          event_date: string
          event_time: string | null
          id: string
          notes: string | null
          title: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          event_date: string
          event_time?: string | null
          id?: string
          notes?: string | null
          title: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          event_date?: string
          event_time?: string | null
          id?: string
          notes?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          session_id: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type: string
          session_id?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          session_id?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          activity_id: string
          add_to_public_feed: boolean
          comment: string | null
          created_at: string
          id: string
          photo_url: string | null
          photo_urls: string[] | null
          rating: number
          share_with_friends: boolean
          user_id: string
        }
        Insert: {
          activity_id: string
          add_to_public_feed?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          photo_url?: string | null
          photo_urls?: string[] | null
          rating: number
          share_with_friends?: boolean
          user_id: string
        }
        Update: {
          activity_id?: string
          add_to_public_feed?: boolean
          comment?: string | null
          created_at?: string
          id?: string
          photo_url?: string | null
          photo_urls?: string[] | null
          rating?: number
          share_with_friends?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foursquare_cache: {
        Row: {
          created_at: string
          data: Json
          id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          discount_code: string | null
          discount_percentage: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          partnership_tier: string | null
          redemption_count: number
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          discount_code?: string | null
          discount_percentage?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          partnership_tier?: string | null
          redemption_count?: number
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          discount_code?: string | null
          discount_percentage?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          partnership_tier?: string | null
          redemption_count?: number
        }
        Relationships: []
      }
      photos: {
        Row: {
          activity_id: string
          id: string
          photo_url: string
          uploaded_at: string
          user_id: string | null
        }
        Insert: {
          activity_id: string
          id?: string
          photo_url: string
          uploaded_at?: string
          user_id?: string | null
        }
        Update: {
          activity_id?: string
          id?: string
          photo_url?: string
          uploaded_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_items: {
        Row: {
          activity_id: string
          added_at: string
          id: string
          playlist_id: string
        }
        Insert: {
          activity_id: string
          added_at?: string
          id?: string
          playlist_id: string
        }
        Update: {
          activity_id?: string
          added_at?: string
          id?: string
          playlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          is_premium: boolean
          marketing_opt_in: boolean
          name: string | null
          newsletter_opt_in: boolean
          premium_expires_at: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_premium?: boolean
          marketing_opt_in?: boolean
          name?: string | null
          newsletter_opt_in?: boolean
          premium_expires_at?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_premium?: boolean
          marketing_opt_in?: boolean
          name?: string | null
          newsletter_opt_in?: boolean
          premium_expires_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_icon_url: string | null
          badge_name: string
          description: string | null
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_icon_url?: string | null
          badge_name: string
          description?: string | null
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_icon_url?: string | null
          badge_name?: string
          description?: string | null
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_activity: { Args: { p_data: Json }; Returns: string }
      admin_delete_activity: {
        Args: { p_activity_id: string }
        Returns: undefined
      }
      admin_update_activity: {
        Args: { p_activity_id: string; p_updates: Json }
        Returns: undefined
      }
      bulk_import_activities: {
        Args: { activities_json: Json }
        Returns: number
      }
      bulk_import_activities_v2: {
        Args: { activities_json: Json }
        Returns: number
      }
      chat_message_limit_exceeded: { Args: never; Returns: boolean }
      check_in_limit_exceeded: { Args: never; Returns: boolean }
      get_profile_id_from_auth: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_premium_user: { Args: never; Returns: boolean }
      playlist_limit_exceeded: { Args: never; Returns: boolean }
      upsert_foursquare_venue: {
        Args: {
          p_address?: string
          p_category: string
          p_description?: string
          p_foursquare_id: string
          p_hero_image_url?: string
          p_latitude: number
          p_longitude: number
          p_name: string
          p_phone?: string
          p_rating?: number
          p_website?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
