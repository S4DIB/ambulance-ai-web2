import React from 'react';
import Navigation from './components/Navigation';
import HomeScreen from './components/screens/HomeScreen';
import BookAmbulanceScreen from './components/screens/BookAmbulanceScreen';
import AIAssessmentScreen from './components/screens/AIAssessmentScreen';
import HospitalsScreen from './components/screens/HospitalsScreen';
import TrackingScreen from './components/screens/TrackingScreen';
import HistoryScreen from './components/screens/HistoryScreen';
import DatabaseTestScreen from './components/screens/DatabaseTestScreen';
import { EmergencyErrorBoundary } from './utils/errorBoundary';
import { analytics } from './utils/analytics';
import { offlineStorage } from './utils/offlineStorage';
import { registerServiceWorker, PerformanceMonitor } from './utils/performanceOptimizer';
import { supabase } from './utils/supabaseClient';

// Initialize Bolt state
if (typeof window !== 'undefined') {
  // Load from localStorage if available
  const savedState = localStorage.getItem('rescufast_state');
  if (!(window as any).state) {
    (window as any).state = savedState ? JSON.parse(savedState) : {
      // Current screen/page
      currentPage: "home",
      
      // User authentication
      isLoggedIn: false,
      
      // Language preference
      language: "en",
      
      // Booking data
      bookingStatus: "none", // none, requested, dispatched, enroute, arrived
      pickupLocation: "",
      symptoms: "",
      triageLevel: null, // 1 to 5
      urgencyScore: null, // 0 to 100
      matchedHospitals: [], // array of hospital objects
      
      // Ambulance tracking
      ambulancePosition: 0, // 0 to 100 (% along route)
      etaMinutes: 5,
      
      // Additional state for better UX
      patientName: "",
      contactNumber: "",
      emergencyType: "",
      assessmentResponses: [],
      bookingHistory: [],
      assessmentHistory: [],
      
      // Video call state
      isVideoCallActive: false,
      videoCallType: 'emergency' // 'emergency' | 'consultation'
    };
  }

  // Initialize offline storage and analytics
  offlineStorage.init().catch(console.error);
  registerServiceWorker();
  PerformanceMonitor.measurePageLoad();
  
  // Track app initialization
  analytics.track('app_initialized', {
    userAgent: navigator.userAgent,
    language: navigator.language,
    online: navigator.onLine
  });

  // Test database connection
  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('name, available_beds')
        .limit(1);
      
      if (error) {
        console.error('Database connection failed:', error);
      } else {
        console.log('✅ Database connected successfully! Found hospitals:', data);
      }
    } catch (err) {
      console.error('Database test failed:', err);
    }
  };

  testDatabaseConnection();

  console.log('App loaded. Initial state:', (window as any).state);
}

function App() {
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  React.useEffect(() => {
    const handleStateChange = () => forceUpdate();
    window.addEventListener('statechange', handleStateChange);
    return () => window.removeEventListener('statechange', handleStateChange);
  }, []);

  const updateState = async (updates: any) => {
    const oldState = { ...(window as any).state };
    Object.assign((window as any).state, updates);
    // Persist state to localStorage
    localStorage.setItem('rescufast_state', JSON.stringify((window as any).state));
    // Debug log
    console.log('State after update:', (window as any).state);
    // Log stack trace for all updateState calls
    console.trace('updateState called with:', updates);
    // Log currentPage changes
    if (updates.currentPage && oldState.currentPage !== updates.currentPage) {
      console.log(`currentPage changed from '${oldState.currentPage}' to '${updates.currentPage}'`, { oldState, updates, newState: (window as any).state });
    }
    // Warn and trace if currentPage is set to home or assessment unexpectedly (not on initial load or logout)
    if (
      (updates.currentPage === 'home' || updates.currentPage === 'assessment') &&
      oldState.currentPage !== updates.currentPage &&
      !(updates.isLoggedIn === false) // allow on logout
    ) {
      console.warn('Warning: currentPage was set to', updates.currentPage, 'unexpectedly!', updates, oldState);
      console.trace('Stack trace for unexpected navigation:');
    }
    
    // Save critical state changes offline
    if (updates.bookingStatus || updates.triageLevel || updates.urgencyScore) {
      try {
        await offlineStorage.saveEmergencyRequest({
          ...updates,
          timestamp: Date.now(),
          previousState: oldState
        });
      } catch (error) {
        console.error('Failed to save state offline:', error);
      }
    }
    
    // Track important state changes
    if (updates.currentPage) {
      analytics.trackUserJourney(`page_${updates.currentPage}`, updates);
    }
    
    if (updates.bookingStatus) {
      analytics.track('booking_status_change', {
        from: oldState.bookingStatus,
        to: updates.bookingStatus,
        ...updates
      });
    }
    
    window.dispatchEvent(new Event('statechange'));
  };

  const renderScreen = () => {
    try {
      switch ((window as any).state.currentPage) {
        case 'home':
          return <HomeScreen updateState={updateState} />;
        case 'book':
          return <BookAmbulanceScreen updateState={updateState} />;
        case 'assessment':
          return <AIAssessmentScreen updateState={updateState} />;
        case 'assessmentResult':
          return <AIAssessmentScreen updateState={updateState} />;
        case 'hospitals':
          return <HospitalsScreen updateState={updateState} />;
        case 'tracking':
          return <TrackingScreen updateState={updateState} />;
        case 'history':
          return <HistoryScreen updateState={updateState} />;
        case 'database-test':
          return <DatabaseTestScreen updateState={updateState} />;
        default:
          return <HomeScreen updateState={updateState} />;
      }
    } catch (error: any) {
      // Log error and show fallback
      analytics.track('screen_render_error', {
        screen: (window as any).state?.currentPage,
        error: error.message
      });
      throw error; // Let ErrorBoundary handle it
    }
  };

  return (
    <EmergencyErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {window.state.isLoggedIn && (
          <Navigation 
            activeScreen={window.state.currentPage} 
            onScreenChange={(screen: string) => updateState({ currentPage: screen })}
            bookingStatus={window.state.bookingStatus}
            updateState={updateState}
          />
        )}
        <main>
          {renderScreen()}
        </main>
      </div>
    </EmergencyErrorBoundary>
  );
}

export default App;