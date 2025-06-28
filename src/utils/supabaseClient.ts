import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface EmergencyRequest {
  id?: string;
  user_id: string;
  patient_name: string;
  pickup_location: string;
  destination_location?: string;
  symptoms: string;
  triage_level: number;
  urgency_score: number;
  status: 'pending' | 'dispatched' | 'enroute' | 'arrived' | 'completed' | 'cancelled';
  ambulance_id?: string;
  hospital_id?: string;
  created_at?: string;
  updated_at?: string;
  photos?: string[];
  voice_notes?: string[];
  estimated_arrival?: string;
  actual_arrival?: string;
  cost?: number;
  payment_status?: 'pending' | 'paid' | 'waived';
}

export interface Ambulance {
  id: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  paramedic_name: string;
  paramedic_phone: string;
  current_location: { lat: number; lng: number };
  status: 'available' | 'busy' | 'offline' | 'maintenance';
  equipment: string[];
  capacity: number;
  last_updated: string;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  phone: string;
  specialties: string[];
  total_beds: number;
  available_beds: number;
  icu_beds: number;
  emergency_beds: number;
  cost_level: 'low' | 'medium' | 'high' | 'premium';
  insurance_accepted: string[];
  rating: number;
  wait_time: number;
  location: { lat: number; lng: number };
  status: 'available' | 'limited' | 'full';
  last_updated: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  emergency_contacts: string[];
  medical_history: string[];
  insurance_provider?: string;
  insurance_number?: string;
  address: string;
  created_at: string;
}

export interface AIAssessment {
  id?: string;
  user_id: string;
  symptoms: string;
  photos?: string[];
  triage_level: number;
  urgency_score: number;
  ai_confidence: number;
  recommendations: string[];
  created_at?: string;
}

// Real-time subscription types
export type EmergencyRequestStatus = 'pending' | 'dispatched' | 'enroute' | 'arrived' | 'completed' | 'cancelled';
export type AmbulanceStatus = 'available' | 'busy' | 'offline' | 'maintenance';