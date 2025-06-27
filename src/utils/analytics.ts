// Advanced analytics and user behavior tracking
export class EmergencyAnalytics {
  private static instance: EmergencyAnalytics;
  private events: any[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  static getInstance(): EmergencyAnalytics {
    if (!EmergencyAnalytics.instance) {
      EmergencyAnalytics.instance = new EmergencyAnalytics();
    }
    return EmergencyAnalytics.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking() {
    // Track page visibility for emergency scenarios
    document.addEventListener('visibilitychange', () => {
      this.track('page_visibility_change', {
        hidden: document.hidden,
        timestamp: Date.now()
      });
    });

    // Track network status for offline handling
    window.addEventListener('online', () => {
      this.track('network_status_change', { status: 'online' });
    });

    window.addEventListener('offline', () => {
      this.track('network_status_change', { status: 'offline' });
    });
  }

  track(eventName: string, properties: any = {}) {
    const event = {
      eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
      }
    };

    this.events.push(event);
    
    // Send immediately for critical events
    if (this.isCriticalEvent(eventName)) {
      this.sendEvent(event);
    }

    // Batch send for non-critical events
    if (this.events.length >= 10) {
      this.sendBatch();
    }
  }

  private isCriticalEvent(eventName: string): boolean {
    const criticalEvents = [
      'emergency_request_submitted',
      'ambulance_arrived',
      'video_call_started',
      'app_error',
      'offline_emergency_request'
    ];
    return criticalEvents.includes(eventName);
  }

  private async sendEvent(event: any) {
    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  private async sendBatch() {
    if (this.events.length === 0) return;

    try {
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: this.events })
      });
      this.events = [];
    } catch (error) {
      console.error('Failed to send analytics batch:', error);
    }
  }

  // Emergency-specific tracking methods
  trackEmergencyRequest(requestData: any) {
    this.track('emergency_request_submitted', {
      triageLevel: requestData.triageLevel,
      urgencyScore: requestData.urgencyScore,
      hasSymptoms: !!requestData.symptoms,
      hasPhotos: requestData.uploadedImages > 0,
      location: requestData.pickupLocation
    });
  }

  trackAIAssessment(assessmentData: any) {
    this.track('ai_assessment_completed', {
      triageLevel: assessmentData.triageLevel,
      urgencyScore: assessmentData.urgencyScore,
      symptomsLength: assessmentData.symptoms?.length || 0,
      photosUploaded: assessmentData.uploadedImages || 0,
      voiceUsed: assessmentData.voiceUsed || false
    });
  }

  trackHospitalSelection(hospitalData: any) {
    this.track('hospital_selected', {
      hospitalId: hospitalData.id,
      hospitalName: hospitalData.name,
      distance: hospitalData.distance,
      aiMatchScore: hospitalData.aiMatchScore,
      ambulanceFare: hospitalData.ambulanceFare?.total
    });
  }

  trackVideoCall(callData: any) {
    this.track('video_call_started', {
      callType: callData.callType,
      duration: callData.duration,
      quality: callData.connectionQuality
    });
  }

  // Performance tracking
  trackPerformance(metrics: any) {
    this.track('performance_metrics', metrics);
  }

  // User journey tracking
  trackUserJourney(step: string, metadata: any = {}) {
    this.track('user_journey_step', {
      step,
      ...metadata
    });
  }
}

export const analytics = EmergencyAnalytics.getInstance();