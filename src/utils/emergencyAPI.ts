import { supabase, EmergencyRequest, Ambulance, Hospital, User, AIAssessment } from './supabaseClient';

// Emergency Request API
export class EmergencyAPI {
  // Create new emergency request
  static async createEmergencyRequest(request: Omit<EmergencyRequest, 'id' | 'created_at' | 'updated_at'>): Promise<EmergencyRequest> {
    const { data, error } = await supabase
      .from('emergency_requests')
      .insert([request])
      .select()
      .single();

    if (error) throw new Error(`Failed to create emergency request: ${error.message}`);
    return data;
  }

  // Get user's emergency requests
  static async getUserEmergencyRequests(userId: string): Promise<EmergencyRequest[]> {
    const { data, error } = await supabase
      .from('emergency_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch emergency requests: ${error.message}`);
    return data || [];
  }

  // Get active emergency request for user
  static async getActiveEmergencyRequest(userId: string): Promise<EmergencyRequest | null> {
    const { data, error } = await supabase
      .from('emergency_requests')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'dispatched', 'enroute'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch active request: ${error.message}`);
    return data;
  }

  // Update emergency request status
  static async updateEmergencyRequestStatus(requestId: string, status: EmergencyRequest['status'], updates?: Partial<EmergencyRequest>): Promise<void> {
    const { error } = await supabase
      .from('emergency_requests')
      .update({ 
        status, 
        updated_at: new Date().toISOString(),
        ...updates 
      })
      .eq('id', requestId);

    if (error) throw new Error(`Failed to update emergency request: ${error.message}`);
  }

  // Subscribe to real-time emergency request updates
  static subscribeToEmergencyRequest(requestId: string, callback: (request: EmergencyRequest) => void) {
    return supabase
      .channel(`emergency_request_${requestId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'emergency_requests',
        filter: `id=eq.${requestId}`
      }, (payload) => {
        callback(payload.new as EmergencyRequest);
      })
      .subscribe();
  }
}

// Ambulance API
export class AmbulanceAPI {
  // Get available ambulances near location
  static async getAvailableAmbulances(location: { lat: number; lng: number }, radiusKm: number = 10): Promise<Ambulance[]> {
    const { data, error } = await supabase
      .from('ambulances')
      .select('*')
      .eq('status', 'available')
      .order('last_updated', { ascending: false });

    if (error) throw new Error(`Failed to fetch ambulances: ${error.message}`);
    
    // Filter by distance (simplified - in production use PostGIS)
    const ambulances = data || [];
    return ambulances.filter(ambulance => {
      const distance = this.calculateDistance(location, ambulance.current_location);
      return distance <= radiusKm;
    });
  }

  // Assign ambulance to emergency request
  static async assignAmbulanceToRequest(requestId: string, ambulanceId: string): Promise<void> {
    const { error } = await supabase
      .from('emergency_requests')
      .update({ 
        ambulance_id: ambulanceId,
        status: 'dispatched',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) throw new Error(`Failed to assign ambulance: ${error.message}`);

    // Update ambulance status
    await supabase
      .from('ambulances')
      .update({ 
        status: 'busy',
        last_updated: new Date().toISOString()
      })
      .eq('id', ambulanceId);
  }

  // Update ambulance location
  static async updateAmbulanceLocation(ambulanceId: string, location: { lat: number; lng: number }): Promise<void> {
    const { error } = await supabase
      .from('ambulances')
      .update({ 
        current_location: location,
        last_updated: new Date().toISOString()
      })
      .eq('id', ambulanceId);

    if (error) throw new Error(`Failed to update ambulance location: ${error.message}`);
  }

  // Subscribe to ambulance location updates
  static subscribeToAmbulanceLocation(ambulanceId: string, callback: (ambulance: Ambulance) => void) {
    return supabase
      .channel(`ambulance_${ambulanceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ambulances',
        filter: `id=eq.${ambulanceId}`
      }, (payload) => {
        callback(payload.new as Ambulance);
      })
      .subscribe();
  }

  private static calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Hospital API
export class HospitalAPI {
  // Get hospitals with available beds
  static async getAvailableHospitals(specialties?: string[], insurance?: string): Promise<Hospital[]> {
    let query = supabase
      .from('hospitals')
      .select('*')
      .gt('available_beds', 0)
      .order('available_beds', { ascending: false });

    if (specialties && specialties.length > 0) {
      query = query.overlaps('specialties', specialties);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch hospitals: ${error.message}`);
    
    let hospitals = data || [];
    
    // Filter by insurance if provided
    if (insurance) {
      hospitals = hospitals.filter(hospital => 
        hospital.insurance_accepted.includes(insurance)
      );
    }

    return hospitals;
  }

  // Get hospital by ID
  static async getHospitalById(hospitalId: string): Promise<Hospital> {
    const { data, error } = await supabase
      .from('hospitals')
      .select('*')
      .eq('id', hospitalId)
      .single();

    if (error) throw new Error(`Failed to fetch hospital: ${error.message}`);
    return data;
  }

  // Update hospital bed availability
  static async updateHospitalBeds(hospitalId: string, bedsUsed: number): Promise<void> {
    const { data: hospital } = await supabase
      .from('hospitals')
      .select('available_beds')
      .eq('id', hospitalId)
      .single();

    if (!hospital) throw new Error('Hospital not found');

    const { error } = await supabase
      .from('hospitals')
      .update({ 
        available_beds: Math.max(0, hospital.available_beds - bedsUsed),
        last_updated: new Date().toISOString()
      })
      .eq('id', hospitalId);

    if (error) throw new Error(`Failed to update hospital beds: ${error.message}`);
  }

  // Subscribe to hospital updates
  static subscribeToHospitalUpdates(hospitalId: string, callback: (hospital: Hospital) => void) {
    return supabase
      .channel(`hospital_${hospitalId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'hospitals',
        filter: `id=eq.${hospitalId}`
      }, (payload) => {
        callback(payload.new as Hospital);
      })
      .subscribe();
  }
}

// AI Assessment API
export class AIAssessmentAPI {
  // Save AI assessment
  static async saveAssessment(assessment: Omit<AIAssessment, 'id' | 'created_at'>): Promise<AIAssessment> {
    const { data, error } = await supabase
      .from('ai_assessments')
      .insert([assessment])
      .select()
      .single();

    if (error) throw new Error(`Failed to save AI assessment: ${error.message}`);
    return data;
  }

  // Get user's AI assessments
  static async getUserAssessments(userId: string): Promise<AIAssessment[]> {
    const { data, error } = await supabase
      .from('ai_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch AI assessments: ${error.message}`);
    return data || [];
  }

  // Get assessment by ID
  static async getAssessmentById(assessmentId: string): Promise<AIAssessment> {
    const { data, error } = await supabase
      .from('ai_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (error) throw new Error(`Failed to fetch assessment: ${error.message}`);
    return data;
  }
}

// User API
export class UserAPI {
  // Get user profile
  static async getUserProfile(userId: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw new Error(`Failed to fetch user profile: ${error.message}`);
    return data;
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) throw new Error(`Failed to update user profile: ${error.message}`);
  }

  // Create user profile
  static async createUserProfile(user: Omit<User, 'created_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) throw new Error(`Failed to create user profile: ${error.message}`);
    return data;
  }
}

// File Upload API
export class FileUploadAPI {
  // Upload emergency photos
  static async uploadEmergencyPhotos(files: File[], requestId: string): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileName = `${requestId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('emergency-photos')
        .upload(fileName, file);

      if (error) throw new Error(`Failed to upload photo: ${error.message}`);

      const { data: urlData } = supabase.storage
        .from('emergency-photos')
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  }

  // Upload voice notes
  static async uploadVoiceNote(audioBlob: Blob, requestId: string): Promise<string> {
    const fileName = `${requestId}/voice_${Date.now()}.webm`;
    const { data, error } = await supabase.storage
      .from('voice-notes')
      .upload(fileName, audioBlob);

    if (error) throw new Error(`Failed to upload voice note: ${error.message}`);

    const { data: urlData } = supabase.storage
      .from('voice-notes')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }
}

// Real-time API
export class RealTimeAPI {
  // Subscribe to all emergency request updates for a user
  static subscribeToUserEmergencyRequests(userId: string, callback: (request: EmergencyRequest) => void) {
    return supabase
      .channel(`user_emergency_requests_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'emergency_requests',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        callback(payload.new as EmergencyRequest);
      })
      .subscribe();
  }

  // Subscribe to ambulance fleet updates
  static subscribeToAmbulanceFleet(callback: (ambulance: Ambulance) => void) {
    return supabase
      .channel('ambulance_fleet')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ambulances'
      }, (payload) => {
        callback(payload.new as Ambulance);
      })
      .subscribe();
  }

  // Subscribe to hospital availability updates
  static subscribeToHospitalAvailability(callback: (hospital: Hospital) => void) {
    return supabase
      .channel('hospital_availability')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'hospitals'
      }, (payload) => {
        callback(payload.new as Hospital);
      })
      .subscribe();
  }
} 