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
          accepts_offers: boolean | null
          birth_date: string | null
          blood_percentage: string | null
          blood_typing: string | null
          book: string | null
          breed: string | null
          category_id: string | null
          chip_number: string | null
          color: string | null
          created_at: string
          default_bid_increment: number | null
          description: string | null
          genealogy: Json | null
          health_info: Json | null
          height: number | null
          id: string
          internal_code: string | null
          is_direct_sale: boolean | null
          location: string | null
          name: string
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          payment_formula: string | null
          pedigree_url: string | null
          photos: string[] | null
          registration_1cc: string | null
          registration_2: string | null
          registration_number: string | null
          sale_price: number | null
          sale_status: string | null
          seller_id: string | null
          seo_description: string | null
          seo_title: string | null
          sex: string | null
          slug: string | null
          species: string | null
          updated_at: string
          vaccination_records: Json | null
          veterinary_history: Json | null
          videos: string[] | null
          weight: number | null
          youtube_url: string | null
        }
        Insert: {
          accepts_offers?: boolean | null
          birth_date?: string | null
          blood_percentage?: string | null
          blood_typing?: string | null
          book?: string | null
          breed?: string | null
          category_id?: string | null
          chip_number?: string | null
          color?: string | null
          created_at?: string
          default_bid_increment?: number | null
          description?: string | null
          genealogy?: Json | null
          health_info?: Json | null
          height?: number | null
          id?: string
          internal_code?: string | null
          is_direct_sale?: boolean | null
          location?: string | null
          name: string
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          payment_formula?: string | null
          pedigree_url?: string | null
          photos?: string[] | null
          registration_1cc?: string | null
          registration_2?: string | null
          registration_number?: string | null
          sale_price?: number | null
          sale_status?: string | null
          seller_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sex?: string | null
          slug?: string | null
          species?: string | null
          updated_at?: string
          vaccination_records?: Json | null
          veterinary_history?: Json | null
          videos?: string[] | null
          weight?: number | null
          youtube_url?: string | null
        }
        Update: {
          accepts_offers?: boolean | null
          birth_date?: string | null
          blood_percentage?: string | null
          blood_typing?: string | null
          book?: string | null
          breed?: string | null
          category_id?: string | null
          chip_number?: string | null
          color?: string | null
          created_at?: string
          default_bid_increment?: number | null
          description?: string | null
          genealogy?: Json | null
          health_info?: Json | null
          height?: number | null
          id?: string
          internal_code?: string | null
          is_direct_sale?: boolean | null
          location?: string | null
          name?: string
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          payment_formula?: string | null
          pedigree_url?: string | null
          photos?: string[] | null
          registration_1cc?: string | null
          registration_2?: string | null
          registration_number?: string | null
          sale_price?: number | null
          sale_status?: string | null
          seller_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          sex?: string | null
          slug?: string | null
          species?: string | null
          updated_at?: string
          vaccination_records?: Json | null
          veterinary_history?: Json | null
          videos?: string[] | null
          weight?: number | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animals_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      bids: {
        Row: {
          amount: number
          bid_type: string | null
          bidder_name: string | null
          created_at: string
          id: string
          ip_address: string | null
          is_manual: boolean | null
          is_phone_bid: boolean | null
          lot_id: string | null
          phone_bidder_identifier: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          bid_type?: string | null
          bidder_name?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_manual?: boolean | null
          is_phone_bid?: boolean | null
          lot_id?: string | null
          phone_bidder_identifier?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          bid_type?: string | null
          bidder_name?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_manual?: boolean | null
          is_phone_bid?: boolean | null
          lot_id?: string | null
          phone_bidder_identifier?: string | null
          session_id?: string | null
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
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
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
      db_errors: {
        Row: {
          created_at: string | null
          error_context: string | null
          error_message: string | null
          function_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          error_context?: string | null
          error_message?: string | null
          function_name?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          error_context?: string | null
          error_message?: string | null
          function_name?: string | null
          id?: string
        }
        Relationships: []
      }
      direct_sales: {
        Row: {
          accepted_at: string | null
          accepted_ip: string | null
          animal_id: string
          buyer_email: string | null
          buyer_id: string | null
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string | null
          id: string
          negotiated_terms: string | null
          shipping_details: Json | null
          status: string | null
          total_price: number
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_ip?: string | null
          animal_id: string
          buyer_email?: string | null
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string | null
          id?: string
          negotiated_terms?: string | null
          shipping_details?: Json | null
          status?: string | null
          total_price: number
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_ip?: string | null
          animal_id?: string
          buyer_email?: string | null
          buyer_id?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string | null
          id?: string
          negotiated_terms?: string | null
          shipping_details?: Json | null
          status?: string | null
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_sales_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_sales_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      event_requests: {
        Row: {
          additional_info: string | null
          category: string | null
          created_at: string
          email: string | null
          estimated_animals: string | null
          estimated_date: string | null
          id: string
          location: string | null
          name: string
          status: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          additional_info?: string | null
          category?: string | null
          created_at?: string
          email?: string | null
          estimated_animals?: string | null
          estimated_date?: string | null
          id?: string
          location?: string | null
          name: string
          status?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          additional_info?: string | null
          category?: string | null
          created_at?: string
          email?: string | null
          estimated_animals?: string | null
          estimated_date?: string | null
          id?: string
          location?: string | null
          name?: string
          status?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          active_lot_id: string | null
          allows_pre_bidding: boolean | null
          auctioneer_name: string | null
          banner_url: string | null
          commission_rate: number | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          id: string
          is_featured: boolean | null
          is_live_interactive: boolean | null
          live_status_message: string | null
          location: string | null
          mode: string | null
          name: string
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          photos: string[] | null
          promoter_company: string | null
          promoter_logo_url: string | null
          regulation: string | null
          seller_id: string | null
          seller_name: string | null
          seo_description: string | null
          seo_title: string | null
          show_countdown: boolean | null
          slug: string | null
          start_date: string
          status: string | null
          transmission_link: string | null
          updated_at: string
          video_url: string | null
          viewers: number | null
        }
        Insert: {
          active_lot_id?: string | null
          allows_pre_bidding?: boolean | null
          auctioneer_name?: string | null
          banner_url?: string | null
          commission_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_featured?: boolean | null
          is_live_interactive?: boolean | null
          live_status_message?: string | null
          location?: string | null
          mode?: string | null
          name: string
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          photos?: string[] | null
          promoter_company?: string | null
          promoter_logo_url?: string | null
          regulation?: string | null
          seller_id?: string | null
          seller_name?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_countdown?: boolean | null
          slug?: string | null
          start_date: string
          status?: string | null
          transmission_link?: string | null
          updated_at?: string
          video_url?: string | null
          viewers?: number | null
        }
        Update: {
          active_lot_id?: string | null
          allows_pre_bidding?: boolean | null
          auctioneer_name?: string | null
          banner_url?: string | null
          commission_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          is_featured?: boolean | null
          is_live_interactive?: boolean | null
          live_status_message?: string | null
          location?: string | null
          mode?: string | null
          name?: string
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          photos?: string[] | null
          promoter_company?: string | null
          promoter_logo_url?: string | null
          regulation?: string | null
          seller_id?: string | null
          seller_name?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_countdown?: boolean | null
          slug?: string | null
          start_date?: string
          status?: string | null
          transmission_link?: string | null
          updated_at?: string
          video_url?: string | null
          viewers?: number | null
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
          {
            foreignKeyName: "events_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_events_active_lot"
            columns: ["active_lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
        ]
      }
      followed_lots: {
        Row: {
          created_at: string
          id: string
          lot_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lot_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followed_lots_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followed_lots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          amount: number
          buyer_id: string | null
          created_at: string | null
          due_date: string
          external_reference: string | null
          gateway_status: string | null
          id: string
          installment_number: number
          paid_at: string | null
          payment_method: string | null
          proof_url: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id?: string | null
          created_at?: string | null
          due_date: string
          external_reference?: string | null
          gateway_status?: string | null
          id?: string
          installment_number: number
          paid_at?: string | null
          payment_method?: string | null
          proof_url?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string | null
          created_at?: string | null
          due_date?: string
          external_reference?: string | null
          gateway_status?: string | null
          id?: string
          installment_number?: number
          paid_at?: string | null
          payment_method?: string | null
          proof_url?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      lots: {
        Row: {
          accepted_at: string | null
          accepted_ip: string | null
          allows_pre_bidding: boolean | null
          animal_id: string | null
          bid_increment: number
          bids_count: number | null
          created_at: string
          current_price: number | null
          end_date: string | null
          event_id: string | null
          id: string
          installment_count: number | null
          installment_interval: string | null
          is_currently_live: boolean | null
          is_featured: boolean | null
          last_bid_ip: string | null
          last_bid_user_agent: string | null
          live_timer_seconds: number | null
          lot_number: number
          payment_formula: string | null
          payment_methods: string[] | null
          reserve_price: number | null
          safety_price: number | null
          starting_price: number
          status: string | null
          updated_at: string
          viewers: number
          winner_id: string | null
          winner_link_reason: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_ip?: string | null
          allows_pre_bidding?: boolean | null
          animal_id?: string | null
          bid_increment?: number
          bids_count?: number | null
          created_at?: string
          current_price?: number | null
          end_date?: string | null
          event_id?: string | null
          id?: string
          installment_count?: number | null
          installment_interval?: string | null
          is_currently_live?: boolean | null
          is_featured?: boolean | null
          last_bid_ip?: string | null
          last_bid_user_agent?: string | null
          live_timer_seconds?: number | null
          lot_number: number
          payment_formula?: string | null
          payment_methods?: string[] | null
          reserve_price?: number | null
          safety_price?: number | null
          starting_price: number
          status?: string | null
          updated_at?: string
          viewers?: number
          winner_id?: string | null
          winner_link_reason?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_ip?: string | null
          allows_pre_bidding?: boolean | null
          animal_id?: string | null
          bid_increment?: number
          bids_count?: number | null
          created_at?: string
          current_price?: number | null
          end_date?: string | null
          event_id?: string | null
          id?: string
          installment_count?: number | null
          installment_interval?: string | null
          is_currently_live?: boolean | null
          is_featured?: boolean | null
          last_bid_ip?: string | null
          last_bid_user_agent?: string | null
          live_timer_seconds?: number | null
          lot_number?: number
          payment_formula?: string | null
          payment_methods?: string[] | null
          reserve_price?: number | null
          safety_price?: number | null
          starting_price?: number
          status?: string | null
          updated_at?: string
          viewers?: number
          winner_id?: string | null
          winner_link_reason?: string | null
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
          {
            foreignKeyName: "lots_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          recipient_id: string
          sender_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id: string
          sender_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          sender_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
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
      offers: {
        Row: {
          amount: number | null
          animal_id: string | null
          created_at: string
          description: string | null
          id: string
          lot_id: string | null
          negotiated_terms: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          animal_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lot_id?: string | null
          negotiated_terms?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          animal_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lot_id?: string | null
          negotiated_terms?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          label: string
          name: string
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          label: string
          name: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          label?: string
          name?: string
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          published_at: string | null
          read_time: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          published_at?: string | null
          read_time?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          published_at?: string | null
          read_time?: string | null
          seo_description?: string | null
          seo_title?: string | null
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
          {
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          auto_unlock_at: string | null
          avatar_url: string | null
          block_reason: string | null
          cep: string | null
          cnpj: string | null
          cpf: string | null
          created_at: string
          document_urls: string[] | null
          email: string | null
          full_name: string | null
          id: string
          is_approved: boolean
          is_blocked: boolean | null
          nationality: string | null
          phone: string | null
          pref_followed_lot_update: boolean | null
          pref_new_event_email: boolean | null
          pref_new_event_sms: boolean | null
          pref_new_event_whatsapp: boolean | null
          pref_outbid_email: boolean | null
          pref_outbid_push: boolean | null
          pref_outbid_sms: boolean | null
          pref_outbid_whatsapp: boolean | null
          risk_level: string | null
          risk_score: number | null
          role: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_unlock_at?: string | null
          avatar_url?: string | null
          block_reason?: string | null
          cep?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          document_urls?: string[] | null
          email?: string | null
          full_name?: string | null
          id: string
          is_approved?: boolean
          is_blocked?: boolean | null
          nationality?: string | null
          phone?: string | null
          pref_followed_lot_update?: boolean | null
          pref_new_event_email?: boolean | null
          pref_new_event_sms?: boolean | null
          pref_new_event_whatsapp?: boolean | null
          pref_outbid_email?: boolean | null
          pref_outbid_push?: boolean | null
          pref_outbid_sms?: boolean | null
          pref_outbid_whatsapp?: boolean | null
          risk_level?: string | null
          risk_score?: number | null
          role?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          auto_unlock_at?: string | null
          avatar_url?: string | null
          block_reason?: string | null
          cep?: string | null
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          document_urls?: string[] | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_approved?: boolean
          is_blocked?: boolean | null
          nationality?: string | null
          phone?: string | null
          pref_followed_lot_update?: boolean | null
          pref_new_event_email?: boolean | null
          pref_new_event_sms?: boolean | null
          pref_new_event_whatsapp?: boolean | null
          pref_outbid_email?: boolean | null
          pref_outbid_push?: boolean | null
          pref_outbid_sms?: boolean | null
          pref_outbid_whatsapp?: boolean | null
          risk_level?: string | null
          risk_score?: number | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          phone: string | null
          slug: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          slug?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_audit_details: {
        Row: {
          audit_id: string | null
          created_at: string
          id: string
          issues: Json
          item_id: string
          item_name: string | null
          item_type: string
        }
        Insert: {
          audit_id?: string | null
          created_at?: string
          id?: string
          issues: Json
          item_id: string
          item_name?: string | null
          item_type: string
        }
        Update: {
          audit_id?: string | null
          created_at?: string
          id?: string
          issues?: Json
          item_id?: string
          item_name?: string | null
          item_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_audit_details_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "seo_audits"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_audits: {
        Row: {
          created_at: string
          error_count: number | null
          healthy_count: number | null
          id: string
          processed_items: number | null
          progress_message: string | null
          status: string
          total_items: number | null
          warning_count: number | null
        }
        Insert: {
          created_at?: string
          error_count?: number | null
          healthy_count?: number | null
          id?: string
          processed_items?: number | null
          progress_message?: string | null
          status?: string
          total_items?: number | null
          warning_count?: number | null
        }
        Update: {
          created_at?: string
          error_count?: number | null
          healthy_count?: number | null
          id?: string
          processed_items?: number | null
          progress_message?: string | null
          status?: string
          total_items?: number | null
          warning_count?: number | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      transactions: {
        Row: {
          buyer_commission: number
          buyer_id: string
          checkout_url: string | null
          created_at: string
          final_price: number
          gateway_reference: string | null
          gateway_status: string | null
          id: string
          lot_id: string
          payment_gateway_id: string | null
          payment_method: string | null
          payment_status: string | null
          seller_commission: number
          seller_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          buyer_commission?: number
          buyer_id: string
          checkout_url?: string | null
          created_at?: string
          final_price: number
          gateway_reference?: string | null
          gateway_status?: string | null
          id?: string
          lot_id: string
          payment_gateway_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          seller_commission?: number
          seller_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          buyer_commission?: number
          buyer_id?: string
          checkout_url?: string | null
          created_at?: string
          final_price?: number
          gateway_reference?: string | null
          gateway_status?: string | null
          id?: string
          lot_id?: string
          payment_gateway_id?: string | null
          payment_method?: string | null
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
            foreignKeyName: "transactions_payment_gateway_id_fkey"
            columns: ["payment_gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
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
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string | null
          external_id: string
          gateway_name: string
          id: string
          next_retry_at: string | null
          payload: Json | null
          processed_at: string | null
          retry_count: number | null
          status: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          external_id: string
          gateway_name: string
          id?: string
          next_retry_at?: string | null
          payload?: Json | null
          processed_at?: string | null
          retry_count?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string | null
          external_id?: string
          gateway_name?: string
          id?: string
          next_retry_at?: string | null
          payload?: Json | null
          processed_at?: string | null
          retry_count?: number | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_risk: { Args: { p_user_id: string }; Returns: boolean }
      close_lot: { Args: { p_lot_id: string }; Returns: Json }
      delete_bid_safe: { Args: { p_bid_id: string }; Returns: Json }
      increment_lot_viewers: { Args: { p_lot_id: string }; Returns: undefined }
      increment_viewer_count: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_approved: { Args: never; Returns: boolean }
      log_db_error: {
        Args: {
          p_error_context: string
          p_error_message: string
          p_function_name: string
        }
        Returns: undefined
      }
      place_bid: {
        Args: { p_amount: number; p_lot_id: string; p_user_id: string }
        Returns: Json
      }
      place_bid_safe:
        | {
            Args: { p_amount: number; p_bid_type?: string; p_lot_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_amount: number
              p_bid_type?: string
              p_lot_id: string
              p_session_id?: string
            }
            Returns: Json
          }
      revert_sold_lot: { Args: { p_lot_id: string }; Returns: undefined }
      slugify: { Args: { "": string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
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
