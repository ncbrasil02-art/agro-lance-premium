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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      animals: {
        Row: {
          birth_date: string | null
          breed: string | null
          color: string | null
          created_at: string
          genealogy: Json | null
          health_info: Json | null
          height: number | null
          id: string
          internal_code: string | null
          location: string | null
          name: string
          photos: string[] | null
          registration_number: string | null
          sex: string | null
          species: string | null
          updated_at: string
          videos: string[] | null
          weight: number | null
        }
        Insert: {
          birth_date?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string
          genealogy?: Json | null
          health_info?: Json | null
          height?: number | null
          id?: string
          internal_code?: string | null
          location?: string | null
          name: string
          photos?: string[] | null
          registration_number?: string | null
          sex?: string | null
          species?: string | null
          updated_at?: string
          videos?: string[] | null
          weight?: number | null
        }
        Update: {
          birth_date?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string
          genealogy?: Json | null
          health_info?: Json | null
          height?: number | null
          id?: string
          internal_code?: string | null
          location?: string | null
          name?: string
          photos?: string[] | null
          registration_number?: string | null
          sex?: string | null
          species?: string | null
          updated_at?: string
          videos?: string[] | null
          weight?: number | null
        }
        Relationships: []
      }
      bids: {
        Row: {
          amount: number
          bid_type: string | null
          created_at: string
          id: string
          is_manual: boolean | null
          lot_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          bid_type?: string | null
          created_at?: string
          id?: string
          is_manual?: boolean | null
          lot_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          bid_type?: string | null
          created_at?: string
          id?: string
          is_manual?: boolean | null
          lot_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contract_url: string | null
          created_at: string
          id: string
          signed_at: string | null
          status: string | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          contract_url?: string | null
          created_at?: string
          id?: string
          signed_at?: string | null
          status?: string | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          contract_url?: string | null
          created_at?: string
          id?: string
          signed_at?: string | null
          status?: string | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          animal_id: string | null
          created_at: string
          event_id: string | null
          file_type: string | null
          file_url: string
          id: string
          lot_id: string | null
          name: string
          user_id: string | null
        }
        Insert: {
          animal_id?: string | null
          created_at?: string
          event_id?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          lot_id?: string | null
          name: string
          user_id?: string | null
        }
        Update: {
          animal_id?: string | null
          created_at?: string
          event_id?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          lot_id?: string | null
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          active_lot_id: string | null
          auctioneer_name: string | null
          banner_url: string | null
          commission_rate: number | null
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string | null
          id: string
          location: string | null
          mode: string | null
          name: string
          promoter_company: string | null
          start_date: string
          status: string | null
          transmission_link: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          active_lot_id?: string | null
          auctioneer_name?: string | null
          banner_url?: string | null
          commission_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          mode?: string | null
          name: string
          promoter_company?: string | null
          start_date: string
          status?: string | null
          transmission_link?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          active_lot_id?: string | null
          auctioneer_name?: string | null
          banner_url?: string | null
          commission_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string | null
          id?: string
          location?: string | null
          mode?: string | null
          name?: string
          promoter_company?: string | null
          start_date?: string
          status?: string | null
          transmission_link?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_active_lot_id_fkey"
            columns: ["active_lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          animal_id: string | null
          bid_increment: number
          bids_count: number | null
          created_at: string
          current_price: number | null
          event_id: string | null
          id: string
          lot_number: number
          payment_methods: string[] | null
          reserve_price: number | null
          starting_price: number
          status: string | null
          updated_at: string
        }
        Insert: {
          animal_id?: string | null
          bid_increment?: number
          bids_count?: number | null
          created_at?: string
          current_price?: number | null
          event_id?: string | null
          id?: string
          lot_number: number
          payment_methods?: string[] | null
          reserve_price?: number | null
          starting_price: number
          status?: string | null
          updated_at?: string
        }
        Update: {
          animal_id?: string | null
          bid_increment?: number
          bids_count?: number | null
          created_at?: string
          current_price?: number | null
          event_id?: string | null
          id?: string
          lot_number?: number
          payment_methods?: string[] | null
          reserve_price?: number | null
          starting_price?: number
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lots_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          published_at: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          full_name: string | null
          id: string
          is_approved: boolean
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_approved?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          buyer_commission: number
          buyer_id: string
          created_at: string
          final_price: number
          id: string
          lot_id: string
          payment_status: string | null
          seller_commission: number
          seller_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          buyer_commission?: number
          buyer_id: string
          created_at?: string
          final_price: number
          id?: string
          lot_id: string
          payment_status?: string | null
          seller_commission?: number
          seller_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          buyer_commission?: number
          buyer_id?: string
          created_at?: string
          final_price?: number
          id?: string
          lot_id?: string
          payment_status?: string | null
          seller_commission?: number
          seller_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: true
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      place_bid: {
        Args: { p_amount: number; p_lot_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
