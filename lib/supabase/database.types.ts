/**
 * Tipos do banco de dados, escritos manualmente a partir das migrations em
 * supabase/migrations/. Quando o projeto Supabase estiver criado e linkado,
 * substituir este arquivo pelo output real de:
 *
 *   npx supabase gen types typescript --linked > lib/supabase/database.types.ts
 *
 * até lá, qualquer mudança de schema precisa ser refletida aqui manualmente,
 * incluindo o array `Relationships` de cada tabela (obrigatório para o
 * postgrest-js resolver corretamente os tipos de `.select()` e de joins).
 */

export type AppointmentStatus =
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type AdminRole = "owner" | "admin";

export interface Database {
  public: {
    Tables: {
      salons: {
        Row: {
          id: string;
          slug: string;
          name: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          id: string;
          salon_id: string;
          role: AdminRole;
          name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          salon_id: string;
          role?: AdminRole;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          role?: AdminRole;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_users_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      professionals: {
        Row: {
          id: string;
          salon_id: string;
          name: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          name: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          name?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "professionals_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          id: string;
          salon_id: string;
          name: string;
          duration_minutes: number;
          price_cents: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          name: string;
          duration_minutes: number;
          price_cents?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          name?: string;
          duration_minutes?: number;
          price_cents?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      professional_services: {
        Row: {
          salon_id: string;
          professional_id: string;
          service_id: string;
          created_at: string;
        };
        Insert: {
          salon_id: string;
          professional_id: string;
          service_id: string;
          created_at?: string;
        };
        Update: {
          salon_id?: string;
          professional_id?: string;
          service_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "professional_services_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "professional_services_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "professional_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      working_hours: {
        Row: {
          id: string;
          salon_id: string;
          professional_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          professional_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          professional_id?: string;
          weekday?: number;
          start_time?: string;
          end_time?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "working_hours_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "working_hours_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
        ];
      };
      blocks: {
        Row: {
          id: string;
          salon_id: string;
          professional_id: string;
          start_datetime: string;
          end_datetime: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          professional_id: string;
          start_datetime: string;
          end_datetime: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          professional_id?: string;
          start_datetime?: string;
          end_datetime?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocks_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          id: string;
          salon_id: string;
          name: string;
          whatsapp: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          name: string;
          whatsapp: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          name?: string;
          whatsapp?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clients_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          id: string;
          salon_id: string;
          professional_id: string;
          service_id: string;
          client_id: string;
          start_datetime: string;
          end_datetime: string;
          status: AppointmentStatus;
          price_cents: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          salon_id: string;
          professional_id: string;
          service_id: string;
          client_id: string;
          start_datetime: string;
          end_datetime: string;
          status?: AppointmentStatus;
          price_cents: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          salon_id?: string;
          professional_id?: string;
          service_id?: string;
          client_id?: string;
          start_datetime?: string;
          end_datetime?: string;
          status?: AppointmentStatus;
          price_cents?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_salon_id_fkey";
            columns: ["salon_id"];
            isOneToOne: false;
            referencedRelation: "salons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_professional_id_fkey";
            columns: ["professional_id"];
            isOneToOne: false;
            referencedRelation: "professionals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_salon_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
