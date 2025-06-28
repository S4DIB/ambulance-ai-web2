// Real-time Emergency Dispatch Service
// This handles actual emergency request processing and ambulance assignment

import { EmergencyAPI, AmbulanceAPI, HospitalAPI, FileUploadAPI, RealTimeAPI } from './emergencyAPI';
import { AIService, AIAnalysisResult } from './aiService';
import { EmergencyRequest, Ambulance, Hospital, supabase } from './supabaseClient';

export interface DispatchResult {
  success: boolean;
  emergencyRequest: EmergencyRequest;
  assignedAmbulance?: Ambulance;
  estimatedArrival: number; // in minutes
  cost: number;
  message: string;
  error?: string;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export class DispatchService {
  private static readonly BASE_RATE = 1200; // BDT for first 10km
  private static readonly PER_KM_RATE = 50; // BDT per additional km
  private static readonly EMERGENCY_SURCHARGE = 1.5; // 50% surcharge for emergency

  // Main dispatch function - processes emergency request end-to-end
  static async dispatchEmergency(
    userId: string,
    patientName: string,
    pickupLocation: string,
    symptoms: string,
    photos: File[] = [],
    voiceNotes: Blob[] = []
  ): Promise<DispatchResult> {
    try {
      // Step 1: AI Assessment
      const aiAnalysis = await this.performAIAssessment(symptoms, photos);
      
      // Step 2: Get user's location
      const location = await this.getLocationFromAddress(pickupLocation);
      
      // Step 3: Find nearest available ambulance
      const nearestAmbulance = await this.findNearestAmbulance(location);
      
      if (!nearestAmbulance) {
        return {
          success: false,
          emergencyRequest: {} as EmergencyRequest,
          estimatedArrival: 0,
          cost: 0,
          message: 'No ambulances available in your area',
          error: 'NO_AMBULANCE_AVAILABLE'
        };
      }

      // Step 4: Calculate cost and ETA
      const cost = this.calculateCost(location, nearestAmbulance.current_location, aiAnalysis.triageLevel);
      const estimatedArrival = this.calculateETA(location, nearestAmbulance.current_location, aiAnalysis.triageLevel);

      // Step 5: Upload files if provided
      let photoUrls: string[] = [];
      let voiceUrls: string[] = [];

      if (photos.length > 0) {
        photoUrls = await FileUploadAPI.uploadEmergencyPhotos(photos, `temp_${Date.now()}`);
      }

      if (voiceNotes.length > 0) {
        for (const voiceNote of voiceNotes) {
          const voiceUrl = await FileUploadAPI.uploadVoiceNote(voiceNote, `temp_${Date.now()}`);
          voiceUrls.push(voiceUrl);
        }
      }

      // Step 6: Create emergency request
      const emergencyRequest = await EmergencyAPI.createEmergencyRequest({
        user_id: userId,
        patient_name: patientName,
        pickup_location: pickupLocation,
        symptoms: symptoms,
        triage_level: aiAnalysis.triageLevel,
        urgency_score: aiAnalysis.urgencyScore,
        status: 'pending',
        photos: photoUrls,
        voice_notes: voiceUrls,
        cost: cost
      });

      // Step 7: Assign ambulance
      await AmbulanceAPI.assignAmbulanceToRequest(emergencyRequest.id!, nearestAmbulance.id);

      // Step 8: Start real-time tracking
      this.startRealTimeTracking(emergencyRequest.id!, nearestAmbulance.id);

      return {
        success: true,
        emergencyRequest,
        assignedAmbulance: nearestAmbulance,
        estimatedArrival,
        cost,
        message: `Emergency request created successfully. Ambulance ${nearestAmbulance.vehicle_number} assigned.`
      };

    } catch (error) {
      console.error('Dispatch failed:', error);
      return {
        success: false,
        emergencyRequest: {} as EmergencyRequest,
        estimatedArrival: 0,
        cost: 0,
        message: 'Failed to process emergency request',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Perform AI assessment using real AI service
  private static async performAIAssessment(symptoms: string, photos: File[]): Promise<AIAnalysisResult> {
    try {
      if (photos.length > 0) {
        return await AIService.comprehensiveAnalysis(symptoms, photos);
      } else {
        return await AIService.analyzeSymptoms(symptoms);
      }
    } catch (error) {
      console.error('AI assessment failed:', error);
      // Fallback to basic assessment
      return {
        triageLevel: 3,
        urgencyScore: 50,
        confidence: 60,
        recommendations: ['Seek medical attention'],
        riskFactors: [],
        suggestedSpecialties: ['General Medicine'],
        immediateActions: [],
        aiModel: 'Fallback',
        processingTime: 0
      };
    }
  }

  // Get location coordinates from address
  private static async getLocationFromAddress(address: string): Promise<Location> {
    try {
      // Use Google Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${import.meta.env.VITE_GOOGLE_CLOUD_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          address: data.results[0].formatted_address
        };
      }

      throw new Error('No location found for address');

    } catch (error) {
      console.error('Geocoding failed:', error);
      
      // Fallback to hardcoded Dhaka locations
      const dhakaLocations: { [key: string]: Location } = {
        'dhanmondi': { lat: 23.7461, lng: 90.3742 },
        'gulshan': { lat: 23.7925, lng: 90.4078 },
        'uttara': { lat: 23.8759, lng: 90.3795 },
        'old dhaka': { lat: 23.7104, lng: 90.4074 },
        'ramna': { lat: 23.7367, lng: 90.3950 },
        'banani': { lat: 23.7937, lng: 90.4066 },
        'mirpur': { lat: 23.8223, lng: 90.3654 },
        'bashundhara': { lat: 23.8103, lng: 90.4370 },
        'panthapath': { lat: 23.7515, lng: 90.3944 },
        'airport': { lat: 23.8103, lng: 90.4370 }
      };

      const lowerAddress = address.toLowerCase();
      for (const [key, location] of Object.entries(dhakaLocations)) {
        if (lowerAddress.includes(key)) {
          return location;
        }
      }

      // Default to Dhaka center
      return { lat: 23.7461, lng: 90.3742 };
    }
  }

  // Find nearest available ambulance
  private static async findNearestAmbulance(location: Location): Promise<Ambulance | null> {
    try {
      const ambulances = await AmbulanceAPI.getAvailableAmbulances(location, 15); // 15km radius
      
      if (ambulances.length === 0) {
        return null;
      }

      // Sort by distance and return the nearest
      return ambulances.sort((a, b) => {
        const distanceA = this.calculateDistance(location, a.current_location);
        const distanceB = this.calculateDistance(location, b.current_location);
        return distanceA - distanceB;
      })[0];

    } catch (error) {
      console.error('Failed to find ambulance:', error);
      return null;
    }
  }

  // Calculate cost based on distance and urgency
  private static calculateCost(pickup: Location, ambulanceLocation: Location, triageLevel: number): number {
    const distance = this.calculateDistance(pickup, ambulanceLocation);
    
    let baseCost = this.BASE_RATE;
    if (distance > 10) {
      baseCost += (distance - 10) * this.PER_KM_RATE;
    }

    // Apply emergency surcharge for high urgency
    if (triageLevel <= 2) {
      baseCost *= this.EMERGENCY_SURCHARGE;
    }

    return Math.round(baseCost);
  }

  // Calculate estimated time of arrival
  private static calculateETA(pickup: Location, ambulanceLocation: Location, triageLevel: number): number {
    const distance = this.calculateDistance(pickup, ambulanceLocation);
    
    // Base speed: 40 km/h in city traffic
    let baseSpeed = 40;
    
    // Adjust speed based on urgency
    if (triageLevel === 1) {
      baseSpeed = 60; // Emergency speed
    } else if (triageLevel === 2) {
      baseSpeed = 50; // High priority
    }

    // Calculate time in minutes
    const timeInHours = distance / baseSpeed;
    return Math.round(timeInHours * 60);
  }

  // Calculate distance between two points
  private static calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Start real-time tracking
  private static startRealTimeTracking(requestId: string, ambulanceId: string) {
    // Subscribe to ambulance location updates
    AmbulanceAPI.subscribeToAmbulanceLocation(ambulanceId, (ambulance) => {
      // Update emergency request with new ambulance location
      const etaMinutes = this.calculateETA(
        { lat: 23.7461, lng: 90.3742 }, // Pickup location (would be stored in request)
        ambulance.current_location,
        3 // Default triage level
      );
      
      EmergencyAPI.updateEmergencyRequestStatus(requestId, 'enroute', {
        estimated_arrival: new Date(Date.now() + etaMinutes * 60000).toISOString()
      });
    });

    // Subscribe to emergency request updates
    EmergencyAPI.subscribeToEmergencyRequest(requestId, (request) => {
      // Handle status changes
      if (request.status === 'arrived') {
        this.handleAmbulanceArrival(requestId, ambulanceId);
      }
    });
  }

  // Handle ambulance arrival
  private static async handleAmbulanceArrival(requestId: string, ambulanceId: string) {
    try {
      // Update ambulance status back to available
      await AmbulanceAPI.updateAmbulanceLocation(ambulanceId, { lat: 23.7461, lng: 90.3742 });
      
      // Update emergency request
      await EmergencyAPI.updateEmergencyRequestStatus(requestId, 'arrived', {
        actual_arrival: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to handle ambulance arrival:', error);
    }
  }

  // Get hospital recommendations based on AI analysis
  static async getHospitalRecommendations(
    specialties: string[],
    insurance?: string,
    location?: Location
  ): Promise<Hospital[]> {
    try {
      const hospitals = await HospitalAPI.getAvailableHospitals(specialties, insurance);
      
      if (location) {
        // Sort by distance if location provided
        return hospitals.sort((a, b) => {
          const distanceA = this.calculateDistance(location, a.location);
          const distanceB = this.calculateDistance(location, b.location);
          return distanceA - distanceB;
        });
      }

      return hospitals;

    } catch (error) {
      console.error('Failed to get hospital recommendations:', error);
      return [];
    }
  }

  // Update ambulance location (for ambulance app)
  static async updateAmbulanceLocation(ambulanceId: string, location: Location): Promise<void> {
    try {
      await AmbulanceAPI.updateAmbulanceLocation(ambulanceId, location);
    } catch (error) {
      console.error('Failed to update ambulance location:', error);
      throw error;
    }
  }

  // Cancel emergency request
  static async cancelEmergencyRequest(requestId: string): Promise<void> {
    try {
      await EmergencyAPI.updateEmergencyRequestStatus(requestId, 'cancelled');
    } catch (error) {
      console.error('Failed to cancel emergency request:', error);
      throw error;
    }
  }

  // Get real-time system metrics
  static async getSystemMetrics(): Promise<any> {
    try {
      // Get active emergency requests
      const { data: activeRequests } = await supabase
        .from('emergency_requests')
        .select('*')
        .in('status', ['pending', 'dispatched', 'enroute']);

      // Get available ambulances
      const { data: availableAmbulances } = await supabase
        .from('ambulances')
        .select('*')
        .eq('status', 'available');

      // Get hospitals with available beds
      const { data: hospitalsWithBeds } = await supabase
        .from('hospitals')
        .select('*')
        .gt('available_beds', 0);

      return {
        activeEmergencyRequests: activeRequests?.length || 0,
        availableAmbulances: availableAmbulances?.length || 0,
        hospitalsWithBeds: hospitalsWithBeds?.length || 0,
        totalAvailableBeds: hospitalsWithBeds?.reduce((sum: number, h: Hospital) => sum + h.available_beds, 0) || 0,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to get system metrics:', error);
      return {
        activeEmergencyRequests: 0,
        availableAmbulances: 0,
        hospitalsWithBeds: 0,
        totalAvailableBeds: 0,
        timestamp: new Date().toISOString()
      };
    }
  }
} 