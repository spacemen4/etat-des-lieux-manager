export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          employe_id: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          organisation_id: string | null
          record_id: string
          table_name: string
          user_agent: string | null
          utilisateur_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          employe_id?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          organisation_id?: string | null
          record_id: string
          table_name: string
          user_agent?: string | null
          utilisateur_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          employe_id?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          organisation_id?: string | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          utilisateur_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      autres_equipements: {
        Row: {
          commentaires: string | null
          employe_id: string | null
          equipement: string
          etat_des_lieux_id: string | null
          etat_entree: string | null
          etat_sortie: string | null
          id: string
          photos: Json | null
          user_id: string | null
        }
        Insert: {
          commentaires?: string | null
          employe_id?: string | null
          equipement: string
          etat_des_lieux_id?: string | null
          etat_entree?: string | null
          etat_sortie?: string | null
          id?: string
          photos?: Json | null
          user_id?: string | null
        }
        Update: {
          commentaires?: string | null
          employe_id?: string | null
          equipement?: string
          etat_des_lieux_id?: string | null
          etat_entree?: string | null
          etat_sortie?: string | null
          id?: string
          photos?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autres_equipements_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autres_equipements_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "etat_des_lieux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autres_equipements_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "v_etat_des_lieux_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      cles: {
        Row: {
          commentaires: string | null
          employe_id: string | null
          etat_des_lieux_id: string | null
          id: string
          nombre: number | null
          numero_cle: string | null
          photos: Json | null
          type_cle_badge: string | null
          user_id: string | null
        }
        Insert: {
          commentaires?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          id?: string
          nombre?: number | null
          numero_cle?: string | null
          photos?: Json | null
          type_cle_badge?: string | null
          user_id?: string | null
        }
        Update: {
          commentaires?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          id?: string
          nombre?: number | null
          numero_cle?: string | null
          photos?: Json | null
          type_cle_badge?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cles_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cles_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "etat_des_lieux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cles_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "v_etat_des_lieux_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      employes: {
        Row: {
          actif: boolean | null
          created_at: string | null
          created_by_auth_user_id: string | null
          email: string | null
          fonction: string | null
          id: string
          nom: string
          password: string | null
          prenom: string
          telephone: string | null
          updated_at: string | null
          updated_by_auth_user_id: string | null
          user_id: string
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          created_by_auth_user_id?: string | null
          email?: string | null
          fonction?: string | null
          id?: string
          nom: string
          password?: string | null
          prenom: string
          telephone?: string | null
          updated_at?: string | null
          updated_by_auth_user_id?: string | null
          user_id: string
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
          created_by_auth_user_id?: string | null
          email?: string | null
          fonction?: string | null
          id?: string
          nom?: string
          password?: string | null
          prenom?: string
          telephone?: string | null
          updated_at?: string | null
          updated_by_auth_user_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      equipements_chauffage: {
        Row: {
          ballon_eau_chaude_etat: string | null
          chaudiere_date_dernier_entretien: string | null
          chaudiere_etat: string | null
          commentaires: string | null
          employe_id: string | null
          etat_des_lieux_id: string | null
          id: string
          photos: Json | null
          pompe_a_chaleur_etat: string | null
          pompe_a_chaleur_present: boolean | null
          radiateurs_etat: string | null
          radiateurs_nombre: number | null
          thermostat_etat: string | null
          thermostat_present: boolean | null
          user_id: string | null
        }
        Insert: {
          ballon_eau_chaude_etat?: string | null
          chaudiere_date_dernier_entretien?: string | null
          chaudiere_etat?: string | null
          commentaires?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          id?: string
          photos?: Json | null
          pompe_a_chaleur_etat?: string | null
          pompe_a_chaleur_present?: boolean | null
          radiateurs_etat?: string | null
          radiateurs_nombre?: number | null
          thermostat_etat?: string | null
          thermostat_present?: boolean | null
          user_id?: string | null
        }
        Update: {
          ballon_eau_chaude_etat?: string | null
          chaudiere_date_dernier_entretien?: string | null
          chaudiere_etat?: string | null
          commentaires?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          id?: string
          photos?: Json | null
          pompe_a_chaleur_etat?: string | null
          pompe_a_chaleur_present?: boolean | null
          radiateurs_etat?: string | null
          radiateurs_nombre?: number | null
          thermostat_etat?: string | null
          thermostat_present?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipements_chauffage_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipements_chauffage_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "etat_des_lieux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipements_chauffage_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "v_etat_des_lieux_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      equipements_energetiques: {
        Row: {
          chauffage_type: string | null
          commentaires: string | null
          date_dpe: string | null
          dpe_classe: string | null
          eau_chaude_type: string | null
          employe_id: string | null
          etat_des_lieux_id: string | null
          ges_classe: string | null
          id: string
          photos: Json | null
          presence_panneaux_solaires: boolean | null
          type_isolation: string | null
          user_id: string | null
        }
        Insert: {
          chauffage_type?: string | null
          commentaires?: string | null
          date_dpe?: string | null
          dpe_classe?: string | null
          eau_chaude_type?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          ges_classe?: string | null
          id?: string
          photos?: Json | null
          presence_panneaux_solaires?: boolean | null
          type_isolation?: string | null
          user_id?: string | null
        }
        Update: {
          chauffage_type?: string | null
          commentaires?: string | null
          date_dpe?: string | null
          dpe_classe?: string | null
          eau_chaude_type?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          ges_classe?: string | null
          id?: string
          photos?: Json | null
          presence_panneaux_solaires?: boolean | null
          type_isolation?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipements_energetiques_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipements_energetiques_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "etat_des_lieux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipements_energetiques_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "v_etat_des_lieux_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      etat_des_lieux: {
        Row: {
          adresse_bien: string
          bailleur_adresse: string | null
          bailleur_nom: string | null
          created_at: string | null
          created_by_auth_user_id: string | null
          date_entree: string | null
          date_sortie: string | null
          description_travaux: string | null
          employe_id: string | null
          id: string
          locataire_adresse: string | null
          locataire_nom: string | null
          organisation_id: string | null
          organization_id: string | null
          photos: Json | null
          rendez_vous_id: string | null
          signature_locataire: string | null
          signature_proprietaire_agent: string | null
          statut: string | null
          travaux_a_faire: boolean | null
          type_bien: string
          type_etat_des_lieux: string
          updated_at: string | null
          updated_by_auth_user_id: string | null
          user_id: string | null
          visibilite: string | null
        }
        Insert: {
          adresse_bien: string
          bailleur_adresse?: string | null
          bailleur_nom?: string | null
          created_at?: string | null
          created_by_auth_user_id?: string | null
          date_entree?: string | null
          date_sortie?: string | null
          description_travaux?: string | null
          employe_id?: string | null
          id?: string
          locataire_adresse?: string | null
          locataire_nom?: string | null
          organisation_id?: string | null
          organization_id?: string | null
          photos?: Json | null
          rendez_vous_id?: string | null
          signature_locataire?: string | null
          signature_proprietaire_agent?: string | null
          statut?: string | null
          travaux_a_faire?: boolean | null
          type_bien: string
          type_etat_des_lieux: string
          updated_at?: string | null
          updated_by_auth_user_id?: string | null
          user_id?: string | null
          visibilite?: string | null
        }
        Update: {
          adresse_bien?: string
          bailleur_adresse?: string | null
          bailleur_nom?: string | null
          created_at?: string | null
          created_by_auth_user_id?: string | null
          date_entree?: string | null
          date_sortie?: string | null
          description_travaux?: string | null
          employe_id?: string | null
          id?: string
          locataire_adresse?: string | null
          locataire_nom?: string | null
          organisation_id?: string | null
          organization_id?: string | null
          photos?: Json | null
          rendez_vous_id?: string | null
          signature_locataire?: string | null
          signature_proprietaire_agent?: string | null
          statut?: string | null
          travaux_a_faire?: boolean | null
          type_bien?: string
          type_etat_des_lieux?: string
          updated_at?: string | null
          updated_by_auth_user_id?: string | null
          user_id?: string | null
          visibilite?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etat_des_lieux_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etat_des_lieux_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etat_des_lieux_rendez_vous_id_fkey"
            columns: ["rendez_vous_id"]
            isOneToOne: false
            referencedRelation: "rendez_vous"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_etat_des_lieux_rendez_vous"
            columns: ["rendez_vous_id"]
            isOneToOne: false
            referencedRelation: "rendez_vous"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by_auth_user_id: string | null
          created_at: string | null
          email: string
          employe_id: string | null
          expires_at: string
          id: string
          invite_par_auth_user_id: string
          organisation_id: string
          role: string
          statut: string | null
          token: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_auth_user_id?: string | null
          created_at?: string | null
          email: string
          employe_id?: string | null
          expires_at: string
          id?: string
          invite_par_auth_user_id: string
          organisation_id: string
          role?: string
          statut?: string | null
          token: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by_auth_user_id?: string | null
          created_at?: string | null
          email?: string
          employe_id?: string | null
          expires_at?: string
          id?: string
          invite_par_auth_user_id?: string
          organisation_id?: string
          role?: string
          statut?: string | null
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          created_at: string | null
          currency: string
          due_date: string | null
          id: string
          invoice_number: string | null
          invoice_pdf: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string
          stripe_invoice_id: string
          subscription_id: string
          user_id: string | null
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status: string
          stripe_invoice_id: string
          subscription_id: string
          user_id?: string | null
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string
          subscription_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          active: boolean | null
          adresse: string | null
          created_at: string | null
          email: string | null
          employe_id: string | null
          id: string
          logo_url: string | null
          nom: string
          siret: string | null
          subscription_id: string | null
          telephone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          adresse?: string | null
          created_at?: string | null
          email?: string | null
          employe_id?: string | null
          id?: string
          logo_url?: string | null
          nom: string
          siret?: string | null
          subscription_id?: string | null
          telephone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          adresse?: string | null
          created_at?: string | null
          email?: string | null
          employe_id?: string | null
          id?: string
          logo_url?: string | null
          nom?: string
          siret?: string | null
          subscription_id?: string | null
          telephone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisations_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisations_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      parties_privatives: {
        Row: {
          commentaires: string | null
          employe_id: string | null
          etat_des_lieux_id: string | null
          etat_entree: string | null
          etat_sortie: string | null
          id: string
          numero: string | null
          photos: Json | null
          type_partie: string
          user_id: string | null
        }
        Insert: {
          commentaires?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          etat_entree?: string | null
          etat_sortie?: string | null
          id?: string
          numero?: string | null
          photos?: Json | null
          type_partie: string
          user_id?: string | null
        }
        Update: {
          commentaires?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          etat_entree?: string | null
          etat_sortie?: string | null
          id?: string
          numero?: string | null
          photos?: Json | null
          type_partie?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parties_privatives_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parties_privatives_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "etat_des_lieux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parties_privatives_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "v_etat_des_lieux_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions_partage: {
        Row: {
          accorde_par_auth_user_id: string
          auth_user_id: string
          created_at: string | null
          employe_id: string | null
          etat_des_lieux_id: string
          expires_at: string | null
          id: string
          permission: string
          user_id: string | null
        }
        Insert: {
          accorde_par_auth_user_id: string
          auth_user_id: string
          created_at?: string | null
          employe_id?: string | null
          etat_des_lieux_id: string
          expires_at?: string | null
          id?: string
          permission: string
          user_id?: string | null
        }
        Update: {
          accorde_par_auth_user_id?: string
          auth_user_id?: string
          created_at?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string
          expires_at?: string | null
          id?: string
          permission?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_partage_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permissions_partage_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "etat_des_lieux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permissions_partage_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "v_etat_des_lieux_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      pieces: {
        Row: {
          baignoire_douche: string | null
          chauffage_tuyauterie: string | null
          commentaires: string | null
          electricite_plomberie: string | null
          employe_id: string | null
          etat_des_lieux_id: string | null
          eviers_robinetterie: string | null
          hotte: string | null
          id: string
          menuiseries: string | null
          meubles_cuisine: string | null
          murs_menuiseries: string | null
          nom_piece: string
          photos: Json | null
          placards: string | null
          plafond: string | null
          plaque_cuisson: string | null
          rangements: string | null
          revetements_sols: string | null
          sanitaires: string | null
          user_id: string | null
        }
        Insert: {
          baignoire_douche?: string | null
          chauffage_tuyauterie?: string | null
          commentaires?: string | null
          electricite_plomberie?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          eviers_robinetterie?: string | null
          hotte?: string | null
          id?: string
          menuiseries?: string | null
          meubles_cuisine?: string | null
          murs_menuiseries?: string | null
          nom_piece: string
          photos?: Json | null
          placards?: string | null
          plafond?: string | null
          plaque_cuisson?: string | null
          rangements?: string | null
          revetements_sols?: string | null
          sanitaires?: string | null
          user_id?: string | null
        }
        Update: {
          baignoire_douche?: string | null
          chauffage_tuyauterie?: string | null
          commentaires?: string | null
          electricite_plomberie?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          eviers_robinetterie?: string | null
          hotte?: string | null
          id?: string
          menuiseries?: string | null
          meubles_cuisine?: string | null
          murs_menuiseries?: string | null
          nom_piece?: string
          photos?: Json | null
          placards?: string | null
          plafond?: string | null
          plaque_cuisson?: string | null
          rangements?: string | null
          revetements_sols?: string | null
          sanitaires?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pieces_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pieces_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "etat_des_lieux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pieces_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "v_etat_des_lieux_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          created_at: string | null
          feature_name: string
          id: string
          limit_value: number
          plan_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feature_name: string
          id?: string
          limit_value: number
          plan_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feature_name?: string
          id?: string
          limit_value?: number
          plan_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_limits_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      releve_compteurs: {
        Row: {
          eau_chaude_m3: string | null
          eau_froide_m3: string | null
          electricite_h_creuses: string | null
          electricite_h_pleines: string | null
          electricite_n_compteur: string | null
          employe_id: string | null
          etat_des_lieux_id: string | null
          gaz_naturel_n_compteur: string | null
          gaz_naturel_releve: string | null
          id: string
          nom_ancien_occupant: string | null
          photos: Json | null
          user_id: string | null
        }
        Insert: {
          eau_chaude_m3?: string | null
          eau_froide_m3?: string | null
          electricite_h_creuses?: string | null
          electricite_h_pleines?: string | null
          electricite_n_compteur?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          gaz_naturel_n_compteur?: string | null
          gaz_naturel_releve?: string | null
          id?: string
          nom_ancien_occupant?: string | null
          photos?: Json | null
          user_id?: string | null
        }
        Update: {
          eau_chaude_m3?: string | null
          eau_froide_m3?: string | null
          electricite_h_creuses?: string | null
          electricite_h_pleines?: string | null
          electricite_n_compteur?: string | null
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          gaz_naturel_n_compteur?: string | null
          gaz_naturel_releve?: string | null
          id?: string
          nom_ancien_occupant?: string | null
          photos?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "releve_compteurs_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "releve_compteurs_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "etat_des_lieux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "releve_compteurs_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "v_etat_des_lieux_with_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      rendez_vous: {
        Row: {
          adresse: string
          code_postal: string
          created_at: string | null
          created_by_auth_user_id: string | null
          date: string
          description: string | null
          duree: string | null
          email_contact: string
          employe_id: string | null
          etat_des_lieux_id: string | null
          heure: string
          id: string
          latitude: number | null
          longitude: number | null
          nom_contact: string
          note_personnelle: string | null
          organisation_id: string | null
          organization_id: string | null
          photos: Json | null
          statut: string | null
          telephone_contact: string
          type_bien: string | null
          type_etat_des_lieux: string | null
          updated_at: string | null
          updated_by_auth_user_id: string | null
          user_id: string | null
          ville: string
        }
        Insert: {
          adresse: string
          code_postal: string
          created_at?: string | null
          created_by_auth_user_id?: string | null
          date: string
          description?: string | null
          duree?: string | null
          email_contact: string
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          heure: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom_contact: string
          note_personnelle?: string | null
          organisation_id?: string | null
          organization_id?: string | null
          photos?: Json | null
          statut?: string | null
          telephone_contact: string
          type_bien?: string | null
          type_etat_des_lieux?: string | null
          updated_at?: string | null
          updated_by_auth_user_id?: string | null
          user_id?: string | null
          ville: string
        }
        Update: {
          adresse?: string
          code_postal?: string
          created_at?: string | null
          created_by_auth_user_id?: string | null
          date?: string
          description?: string | null
          duree?: string | null
          email_contact?: string
          employe_id?: string | null
          etat_des_lieux_id?: string | null
          heure?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom_contact?: string
          note_personnelle?: string | null
          organisation_id?: string | null
          organization_id?: string | null
          photos?: Json | null
          statut?: string | null
          telephone_contact?: string
          type_bien?: string | null
          type_etat_des_lieux?: string | null
          updated_at?: string | null
          updated_by_auth_user_id?: string | null
          user_id?: string | null
          ville?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_rendez_vous_etat_des_lieux"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "etat_des_lieux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rendez_vous_etat_des_lieux"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "v_etat_des_lieux_with_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendez_vous_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendez_vous_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "etat_des_lieux"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendez_vous_etat_des_lieux_id_fkey"
            columns: ["etat_des_lieux_id"]
            isOneToOne: false
            referencedRelation: "v_etat_des_lieux_with_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendez_vous_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          email: string
          employe_id: string | null
          id: string
          stripe_customer_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          employe_id?: string | null
          id?: string
          stripe_customer_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          employe_id?: string | null
          id?: string
          stripe_customer_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_webhooks: {
        Row: {
          created_at: string | null
          data: Json
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active: boolean | null
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          employe_id: string | null
          features: Json | null
          id: string
          interval: string
          interval_count: number
          name: string
          stripe_price_id: string
          stripe_product_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          amount: number
          created_at?: string | null
          currency?: string
          description?: string | null
          employe_id?: string | null
          features?: Json | null
          id?: string
          interval: string
          interval_count?: number
          name: string
          stripe_price_id: string
          stripe_product_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          employe_id?: string | null
          features?: Json | null
          id?: string
          interval?: string
          interval_count?: number
          name?: string
          stripe_price_id?: string
          stripe_product_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          employe_id: string | null
          id: string
          metadata: Json | null
          organisation_id: string | null
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          employe_id?: string | null
          id?: string
          metadata?: Json | null
          organisation_id?: string | null
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          employe_id?: string | null
          id?: string
          metadata?: Json | null
          organisation_id?: string | null
          plan_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_etat_des_lieux_with_permissions: {
        Row: {
          adresse_bien: string | null
          bailleur_adresse: string | null
          bailleur_nom: string | null
          created_at: string | null
          created_by_auth_user_id: string | null
          date_entree: string | null
          date_sortie: string | null
          description_travaux: string | null
          employe_id: string | null
          id: string | null
          locataire_adresse: string | null
          locataire_nom: string | null
          organisation_id: string | null
          organization_id: string | null
          permission: string | null
          photos: Json | null
          rendez_vous_id: string | null
          signature_locataire: string | null
          signature_proprietaire_agent: string | null
          statut: string | null
          travaux_a_faire: boolean | null
          type_bien: string | null
          type_etat_des_lieux: string | null
          updated_at: string | null
          updated_by_auth_user_id: string | null
          user_id: string | null
          visibilite: string | null
        }
        Insert: {
          adresse_bien?: string | null
          bailleur_adresse?: string | null
          bailleur_nom?: string | null
          created_at?: string | null
          created_by_auth_user_id?: string | null
          date_entree?: string | null
          date_sortie?: string | null
          description_travaux?: string | null
          employe_id?: string | null
          id?: string | null
          locataire_adresse?: string | null
          locataire_nom?: string | null
          organisation_id?: string | null
          organization_id?: string | null
          permission?: never
          photos?: Json | null
          rendez_vous_id?: string | null
          signature_locataire?: string | null
          signature_proprietaire_agent?: string | null
          statut?: string | null
          travaux_a_faire?: boolean | null
          type_bien?: string | null
          type_etat_des_lieux?: string | null
          updated_at?: string | null
          updated_by_auth_user_id?: string | null
          user_id?: string | null
          visibilite?: string | null
        }
        Update: {
          adresse_bien?: string | null
          bailleur_adresse?: string | null
          bailleur_nom?: string | null
          created_at?: string | null
          created_by_auth_user_id?: string | null
          date_entree?: string | null
          date_sortie?: string | null
          description_travaux?: string | null
          employe_id?: string | null
          id?: string | null
          locataire_adresse?: string | null
          locataire_nom?: string | null
          organisation_id?: string | null
          organization_id?: string | null
          permission?: never
          photos?: Json | null
          rendez_vous_id?: string | null
          signature_locataire?: string | null
          signature_proprietaire_agent?: string | null
          statut?: string | null
          travaux_a_faire?: boolean | null
          type_bien?: string | null
          type_etat_des_lieux?: string | null
          updated_at?: string | null
          updated_by_auth_user_id?: string | null
          user_id?: string | null
          visibilite?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etat_des_lieux_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etat_des_lieux_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etat_des_lieux_rendez_vous_id_fkey"
            columns: ["rendez_vous_id"]
            isOneToOne: false
            referencedRelation: "rendez_vous"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_etat_des_lieux_rendez_vous"
            columns: ["rendez_vous_id"]
            isOneToOne: false
            referencedRelation: "rendez_vous"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_etat_lieux_permission: {
        Args: {
          p_etat_des_lieux_id: string
          p_utilisateur_id: string
          p_permission?: string
        }
        Returns: boolean
      }
      check_plan_limit: {
        Args: {
          p_organisation_id: string
          p_feature_name: string
          p_current_count?: number
        }
        Returns: boolean
      }
      create_organisation_with_admin: {
        Args: {
          p_nom_organisation: string
          p_adresse_organisation: string
          p_email_admin: string
          p_prenom_admin: string
          p_nom_admin: string
          p_telephone_admin?: string
        }
        Returns: string
      }
      get_organisation_subscription: {
        Args: { p_organisation_id: string }
        Returns: {
          subscription_id: string
          plan_name: string
          status: string
          current_period_end: string
          cancel_at_period_end: boolean
        }[]
      }
      get_user_organisation_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      invite_user_to_organisation: {
        Args: { p_organisation_id: string; p_email: string; p_role?: string }
        Returns: string
      }
      is_organisation_admin: {
        Args: { p_organisation_id: string }
        Returns: boolean
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
