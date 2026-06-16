// ─────────────────────────────────────────────────────────────
//  Heartlight Collective — Supabase Database Types
//  Hand-crafted for the Heartlight Collective schema
//  Generate via: npx supabase gen types typescript --project-id YOUR_ID
// ─────────────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      /* ═══ C.E.S. Profiles ═══ */
      profiles: {
        Row: {
          id: string                    // uuid — Supabase auth user id
          ces_number: string | null     // 9-digit C.E.S.
          name: string
          pronouns: string
          title: string
          location: string
          sun_placement: string | null
          moon_placement: string | null
          emoji: string
          photo_url: string | null
          bio: string
          numerology: string[]
          accessibility: string[]
          consent: string
          portfolio_link: string
          portfolio_items: Json          // PortfolioItem[]
          contact_methods: Json         // ContactMethods
          contact_visibility: Json      // Record<string, boolean>
          public_contact_visibility: boolean
          ces_passphrase_hash: string | null  // hashed, never plain text
          wish_availability: string
          directory_wish_status: string
          stewardship: string
          stewardship_note: string
          peer_payment_methods: Json          // PaymentMethodConfig[]
          location_data: Json | null           // LocationData
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ces_number: string
          name: string
          pronouns?: string
          title?: string
          location?: string
          sun_placement?: string
          moon_placement?: string
          emoji?: string
          photo_url?: string | null
          bio?: string
          numerology?: string[]
          accessibility?: string[]
          consent?: string
          portfolio_link?: string
          portfolio_items?: Json
          contact_methods?: Json
          contact_visibility?: Json
          public_contact_visibility?: boolean
          ces_passphrase_hash?: string | null
          wish_availability?: string
          directory_wish_status?: string
          stewardship?: string
          stewardship_note?: string
          peer_payment_methods?: Json
          location_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ces_number?: string | null
          name?: string
          pronouns?: string
          title?: string
          location?: string
          sun_placement?: string | null
          moon_placement?: string | null
          emoji?: string
          photo_url?: string | null
          bio?: string
          numerology?: string[]
          accessibility?: string[]
          consent?: string
          portfolio_link?: string
          portfolio_items?: Json
          contact_methods?: Json
          contact_visibility?: Json
          public_contact_visibility?: boolean
          ces_passphrase_hash?: string | null
          wish_availability?: string
          directory_wish_status?: string
          stewardship?: string
          stewardship_note?: string
          peer_payment_methods?: Json
          location_data?: Json | null
          updated_at?: string
        }
      }

      /* ═══ Vendors / Storefronts ═══ */
      vendors: {
        Row: {
          id: string
          name: string
          slug: string
          description: string
          core_directive: string | null     // Vendor Shop bio / mission (nullable)
          logo_url: string | null
          owner_ces: string
          owner_name: string
          members: Json                 // VendorMember[]
          payment_methods: Json          // PaymentMethodConfig[]
          exchange_policy: Json          // ExchangeForm[]
          location_data: Json | null     // LocationData
          tags: string[]
          status: string                // 'active' | 'paused' | 'under_review'
          collective_funded: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string
          core_directive?: string | null
          logo_url?: string | null
          owner_ces: string
          owner_name: string
          members?: Json
          payment_methods?: Json
          exchange_policy?: Json
          location_data?: Json | null
          tags?: string[]
          status?: string
          collective_funded?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          slug?: string
          description?: string
          core_directive?: string | null
          logo_url?: string | null
          owner_ces?: string
          owner_name?: string
          members?: Json
          payment_methods?: Json
          exchange_policy?: Json
          location_data?: Json | null
          tags?: string[]
          status?: string
          collective_funded?: boolean
          updated_at?: string
        }
      }

      /* ═══ Offerings ═══ */
      offerings: {
        Row: {
          id: string
          vendor_id: string
          title: string
          description: string
          category: string
          price_type: string           // 'fixed' | 'gift' | 'collective_funded' | 'negotiable'
          price_cents: number | null
          currency: string               // 'USD'
          image_url: string | null
          availability: string          // 'available' | 'limited' | 'waitlist' | 'unavailable'
          consent_required: boolean
          max_participants: number | null
          stripe_price_id: string | null
          exchange_policy: Json          // ExchangeForm[]
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          title: string
          description?: string
          category?: string
          price_type?: string
          price_cents?: number | null
          currency?: string
          image_url?: string | null
          availability?: string
          consent_required?: boolean
          max_participants?: number | null
          stripe_price_id?: string | null
          exchange_policy?: Json
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          category?: string
          price_type?: string
          price_cents?: number | null
          image_url?: string | null
          availability?: string
          consent_required?: boolean
          max_participants?: number | null
          stripe_price_id?: string | null
          exchange_policy?: Json
          tags?: string[]
          updated_at?: string
        }
      }

      /* ═══ Exchange Journeys ═══ */
      exchange_journeys: {
        Row: {
          id: string
          agreement_id: string | null
          title: string
          description: string
          wishing_ces: string
          wishing_name: string
          co_creator_ces: string
          co_creator_name: string
          status: string               // 'agreement_pending' | 'active' | 'fulfillment_review' | 'complete' | 'adapted'
          current_phase: string         // 'before' | 'during' | 'after'
          selected_codes: number[]
          fulfillment_notes: string
          fulfillment_signed_at: string | null
          fulfillment_signed_by: string[]
          adaptation_consent: boolean
          adapted_from_journey_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agreement_id?: string | null
          title: string
          description?: string
          wishing_ces: string
          wishing_name: string
          co_creator_ces: string
          co_creator_name: string
          status?: string
          current_phase?: string
          selected_codes?: number[]
          fulfillment_notes?: string
          fulfillment_signed_at?: string | null
          fulfillment_signed_by?: string[]
          adaptation_consent?: boolean
          adapted_from_journey_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          status?: string
          current_phase?: string
          selected_codes?: number[]
          fulfillment_notes?: string
          fulfillment_signed_at?: string | null
          fulfillment_signed_by?: string[]
          adaptation_consent?: boolean
          updated_at?: string
        }
      }

      /* ═══ Code Log Entries ═══ */
      code_logs: {
        Row: {
          id: string
          exchange_id: string
          author_ces: string
          author_name: string
          ray: string
          code_number: number
          timestamp: string
          content: string
          visibility: string           // 'private' | 'public'
          phase: string               // 'before' | 'during' | 'after'
          mood_energy: string | null
          created_at: string
        }
        Insert: {
          id?: string
          exchange_id: string
          author_ces: string
          author_name: string
          ray?: string
          code_number: number
          timestamp?: string
          content: string
          visibility?: string
          phase?: string
          mood_energy?: string | null
          created_at?: string
        }
        Update: {
          content?: string
          visibility?: string
          phase?: string
          mood_energy?: string | null
          timestamp?: string
        }
      }

      /* ═══ Exchange Requests ═══ */
      exchange_requests: {
        Row: {
          id: string
          offering_id: string
          vendor_id: string
          requester_ces: string
          requester_name: string
          provider_ces: string
          provider_name: string
          message: string
          price_type: string
          payment_method: string | null
          status: string               // 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'
          collective_petition_id: string | null
          consent_acknowledged: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          offering_id: string
          vendor_id: string
          requester_ces: string
          requester_name: string
          provider_ces: string
          provider_name: string
          message?: string
          price_type?: string
          payment_method?: string | null
          status?: string
          collective_petition_id?: string | null
          consent_acknowledged?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: string
          collective_petition_id?: string | null
          consent_acknowledged?: boolean
          updated_at?: string
        }
      }

      /* ═══ Agreements ═══ (for before-phase) */
      agreements: {
        Row: {
          id: string
          source_type: string
          source_wish_id: string | null
          source_wish_name: string
          status: string                // 'draft' | 'signed'
          wishing_profile_id: string
          wishing_ces: string
          wishing_name: string
          co_creator_profile_id: string
          co_creator_ces: string
          co_creator_name: string
          roles: Json                   // AgreementRole[]
          portal_start_phase: string
          portal_end_phase: string
          portal_timeline: string
          scope: string
          format: string
          exchange_pathway: string
          spring_milestone: string
          summer_milestone: string
          fall_milestone: string
          opening_note: string
          reply_preference: string
          boundaries: string
          co_creator_blessing: string
          receiver_blessing: string
          shared_contact_methods: Json // ContactMethods
          created_at: string
          updated_at: string
          signed_at: string | null
        }
        Insert: {
          id?: string
          source_type: string
          source_wish_id?: string | null
          source_wish_name?: string
          status?: string
          wishing_profile_id: string
          wishing_ces: string
          wishing_name: string
          co_creator_profile_id: string
          co_creator_ces: string
          co_creator_name: string
          roles?: Json
          portal_start_phase?: string
          portal_end_phase?: string
          portal_timeline?: string
          scope?: string
          format?: string
          exchange_pathway?: string
          spring_milestone?: string
          summer_milestone?: string
          fall_milestone?: string
          opening_note?: string
          reply_preference?: string
          boundaries?: string
          co_creator_blessing?: string
          receiver_blessing?: string
          shared_contact_methods?: Json
          created_at?: string
          updated_at?: string
          signed_at?: string | null
        }
        Update: {
          source_type?: string
          source_wish_id?: string | null
          source_wish_name?: string
          status?: string
          wishing_ces?: string
          wishing_name?: string
          co_creator_ces?: string
          co_creator_name?: string
          roles?: Json
          portal_start_phase?: string
          portal_end_phase?: string
          portal_timeline?: string
          scope?: string
          format?: string
          exchange_pathway?: string
          spring_milestone?: string
          summer_milestone?: string
          fall_milestone?: string
          opening_note?: string
          reply_preference?: string
          boundaries?: string
          co_creator_blessing?: string
          receiver_blessing?: string
          shared_contact_methods?: Json
          updated_at?: string
          signed_at?: string | null
        }
      }

      /* ═══ Exchange Agreements (Wave 6.9 multi-party) ═══ */
      exchange_agreements: {
        Row: {
          id: string
          offering_id: string | null
          vendor_id: string | null
          wish_id: string | null
          requester_ces: string
          requester_name: string
          provider_ces: string
          provider_name: string
          message: string
          requester_role: string
          provider_role: string
          parties: Json                      // AgreementParty[]
          main_quest: Json                    // QuestItem
          main_quest_directive: Json | null   // QuestItem
          main_quests: Json | null             // QuestItem[]
          side_quests: Json                   // QuestItem[]
          proposed_price_cents: number | null
          agreed_price_cents: number | null
          payment_method: string | null
          communication_prefs: string
          dedication_of_profits: Json | null
          scheduled_meetings: Json            // ScheduledMeeting[]
          status: string
          requester_consented: boolean
          provider_consented: boolean
          collective_funding_requested: boolean
          collective_funding_approved: boolean | null
          safety_reports: Json | null          // SafetyReport[]
          versions: Json                       // AgreementVersion[]
          pending_update: Json | null           // AgreementVersion
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          offering_id?: string | null
          vendor_id?: string | null
          wish_id?: string | null
          requester_ces: string
          requester_name: string
          provider_ces: string
          provider_name: string
          message?: string
          requester_role?: string
          provider_role?: string
          parties?: Json
          main_quest?: Json
          main_quest_directive?: Json | null
          main_quests?: Json | null
          side_quests?: Json
          proposed_price_cents?: number | null
          agreed_price_cents?: number | null
          payment_method?: string | null
          communication_prefs?: string
          dedication_of_profits?: Json | null
          scheduled_meetings?: Json
          status?: string
          requester_consented?: boolean
          provider_consented?: boolean
          collective_funding_requested?: boolean
          collective_funding_approved?: boolean | null
          safety_reports?: Json | null
          versions?: Json
          pending_update?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          offering_id?: string | null
          vendor_id?: string | null
          wish_id?: string | null
          requester_ces?: string
          requester_name?: string
          provider_ces?: string
          provider_name?: string
          message?: string
          requester_role?: string
          provider_role?: string
          parties?: Json
          main_quest?: Json
          main_quest_directive?: Json | null
          main_quests?: Json | null
          side_quests?: Json
          proposed_price_cents?: number | null
          agreed_price_cents?: number | null
          payment_method?: string | null
          communication_prefs?: string
          dedication_of_profits?: Json | null
          scheduled_meetings?: Json
          status?: string
          requester_consented?: boolean
          provider_consented?: boolean
          collective_funding_requested?: boolean
          collective_funding_approved?: boolean | null
          safety_reports?: Json | null
          versions?: Json
          pending_update?: Json | null
          updated_at?: string
        }
      }

      /* ═══ Exchange Calendars (availability + meetings) ═══ */
      exchange_calendars: {
        Row: {
          ces: string                         // PK — one calendar per being
          availability_blocks: Json           // AvailabilityBlock[]
          scheduled_meetings: Json             // ScheduledMeeting[]
          updated_at: string
          created_at: string
        }
        Insert: {
          ces: string
          availability_blocks?: Json
          scheduled_meetings?: Json
          updated_at?: string
          created_at?: string
        }
        Update: {
          availability_blocks?: Json
          scheduled_meetings?: Json
          updated_at?: string
        }
      }

      /* ═══ Exchange Alerts (Steward Gate) ═══ */
      exchange_alerts: {
        Row: {
          id: string
          exchange_id: string
          exchange_title: string
          type: string
          from_ces: string
          from_name: string
          to_ces: string | null
          message: string
          status: string
          created_at: string
          reviewed_by: string | null
          reviewed_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          exchange_id: string
          exchange_title: string
          type: string
          from_ces: string
          from_name: string
          to_ces?: string | null
          message?: string
          status?: string
          created_at?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          metadata?: Json | null
        }
        Update: {
          exchange_id?: string
          exchange_title?: string
          type?: string
          from_ces?: string
          from_name?: string
          to_ces?: string | null
          message?: string
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          metadata?: Json | null
          updated_at?: string
        }
      }

      /* ═══ Vendor Invites ═══ */
      vendor_invites: {
        Row: {
          id: string
          vendor_id: string
          vendor_name: string
          invited_by_ces: string
          invited_by_name: string
          invitee_ces: string
          invitee_name: string
          role: string
          message: string | null
          status: string
          created_at: string
          responded_at: string | null
        }
        Insert: {
          id?: string
          vendor_id: string
          vendor_name: string
          invited_by_ces: string
          invited_by_name: string
          invitee_ces: string
          invitee_name: string
          role?: string
          message?: string | null
          status?: string
          created_at?: string
          responded_at?: string | null
        }
        Update: {
          vendor_id?: string
          vendor_name?: string
          invited_by_ces?: string
          invited_by_name?: string
          invitee_ces?: string
          invitee_name?: string
          role?: string
          message?: string | null
          status?: string
          responded_at?: string | null
        }
      }

      /* ═══ Vendor Join Requests ═══ */
      vendor_join_requests: {
        Row: {
          id: string
          vendor_id: string
          requester_ces: string
          requester_name: string
          message: string | null
          status: string
          requested_at: string
          responded_at: string | null
          responded_by_ces: string | null
        }
        Insert: {
          id?: string
          vendor_id: string
          requester_ces: string
          requester_name: string
          message?: string | null
          status?: string
          requested_at?: string
          responded_at?: string | null
          responded_by_ces?: string | null
        }
        Update: {
          vendor_id?: string
          requester_ces?: string
          requester_name?: string
          message?: string | null
          status?: string
          responded_at?: string | null
          responded_by_ces?: string | null
        }
      }

      /* ═══ Collective Petitions ═══ */
      collective_petitions: {
        Row: {
          id: string
          exchange_request_id: string
          requester_ces: string
          requester_name: string
          provider_ces: string
          provider_name: string
          offering_title: string
          amount_cents: number
          message: string
          status: string
          steward_notes: string | null
          reviewed_by_ces: string | null
          reviewed_by_name: string | null
          created_at: string
          reviewed_at: string | null
          funded_at: string | null
        }
        Insert: {
          id?: string
          exchange_request_id: string
          requester_ces: string
          requester_name: string
          provider_ces: string
          provider_name: string
          offering_title: string
          amount_cents: number
          message?: string
          status?: string
          steward_notes?: string | null
          reviewed_by_ces?: string | null
          reviewed_by_name?: string | null
          created_at?: string
          reviewed_at?: string | null
          funded_at?: string | null
        }
        Update: {
          exchange_request_id?: string
          requester_ces?: string
          requester_name?: string
          provider_ces?: string
          provider_name?: string
          offering_title?: string
          amount_cents?: number
          message?: string
          status?: string
          steward_notes?: string | null
          reviewed_by_ces?: string | null
          reviewed_by_name?: string | null
          reviewed_at?: string | null
          funded_at?: string | null
        }
      }

      /* ═══ Wishes / Gifts (Heartlight Exchange) ═══ */
      wishes: {
        Row: {
          id: string
          type: string                        // 'wish' | 'gift' | 'offering'
          title: string
          description: string
          author_ces: string
          author_name: string
          scope: string
          category: string | null
          tags: string[]
          location: string | null
          lat: number | null
          lng: number | null
          price_cents: number | null
          price_type: string | null
          payment_method: string | null
          exchange_policy: Json | null          // ExchangeForm[]
          images: string[]
          status: string
          claimed_by_ces: string | null
          claimed_by_name: string | null
          collective_funding_requested: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          title: string
          description?: string
          author_ces: string
          author_name: string
          scope?: string
          category?: string | null
          tags?: string[]
          location?: string | null
          lat?: number | null
          lng?: number | null
          price_cents?: number | null
          price_type?: string | null
          payment_method?: string | null
          exchange_policy?: Json | null
          images?: string[]
          status?: string
          claimed_by_ces?: string | null
          claimed_by_name?: string | null
          collective_funding_requested?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          type?: string
          title?: string
          description?: string
          author_ces?: string
          author_name?: string
          scope?: string
          category?: string | null
          tags?: string[]
          location?: string | null
          lat?: number | null
          lng?: number | null
          price_cents?: number | null
          price_type?: string | null
          payment_method?: string | null
          exchange_policy?: Json | null
          images?: string[]
          status?: string
          claimed_by_ces?: string | null
          claimed_by_name?: string | null
          collective_funding_requested?: boolean
          updated_at?: string
        }
      }
    }
    Enums: {
      // Add enums here if you choose to use Supabase enums
    }
    Views: {
      // Add views here if you create Supabase views
    }
  }
}
