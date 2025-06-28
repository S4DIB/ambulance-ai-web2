import React, { useState, useEffect } from 'react';
import { Heart, Phone, MapPin, AlertTriangle, Video, Clock, Brain, Stethoscope, Database, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import MetricsDisplay from '../MetricsDisplay';
import { supabase } from '../../utils/supabaseClient';

interface DashboardScreenProps {
  updateState: (updates: any) => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ updateState }) => {
  const state = (window as any).state;
  const { t } = useTranslation();
  const currentUser = state.currentUser;
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [dbData, setDbData] = useState<any>(null);

  // Check database connection
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Test hospitals table
        const { data: hospitals, error: hospitalsError } = await supabase
          .from('hospitals')
          .select('name, available_beds')
          .limit(3);

        // Test ambulances table
        const { data: ambulances, error: ambulancesError } = await supabase
          .from('ambulances')
          .select('vehicle_number, status')
          .limit(3);

        if (hospitalsError || ambulancesError) {
          setDbStatus('error');
          console.error('Database test failed:', hospitalsError || ambulancesError);
        } else {
          setDbStatus('connected');
          setDbData({
            hospitals: hospitals || [],
            ambulances: ambulances || []
          });
          console.log('✅ Database connected successfully!', { hospitals, ambulances });
        }
      } catch (error) {
        setDbStatus('error');
        console.error('Database connection failed:', error);
      }
    };

    checkDatabase();
  }, []);

  const handleVideoCall = () => {
    updateState({ 
      isVideoCallActive: true,
      videoCallType: 'consultation'
    });
  };

  const getStatusMessage = () => {
    switch (state.bookingStatus) {
      case 'requested':
        return {
          message: t('requestReceivedDesc'),
          color: "bg-yellow-50 border-yellow-200 text-yellow-800",
          icon: AlertTriangle
        };
      case 'dispatched':
        return {
          message: t('ambulanceDispatchedDesc'),
          color: "bg-blue-50 border-blue-200 text-blue-800",
          icon: Phone
        };
      case 'enroute':
        return {
          message: `${t('enRouteDesc')} - ${t('etaMinutes')} ${state.etaMinutes} ${t('minutes')}`,
          color: "bg-green-50 border-green-200 text-green-800",
          icon: MapPin
        };
      case 'arrived':
        return {
          message: t('ambulanceArrivedDesc'),
          color: "bg-green-50 border-green-200 text-green-800",
          icon: Heart
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          Welcome {currentUser?.user_metadata?.full_name || currentUser?.email},
        </h1>
      </div>

      {/* Live Metrics Dashboard */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Live System Metrics</h2>
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            Real-time data
          </div>
        </div>
        <MetricsDisplay variant="dashboard" showLive={true} />
      </div>

      {/* Status Alert */}
      {statusInfo && (
        <div className={`rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border ${statusInfo.color}`}>
          <div className="flex items-center justify-center">
            <statusInfo.icon className="h-5 w-5 sm:h-6 sm:w-6 mr-3" />
            <p className="font-semibold text-base sm:text-lg text-center">{statusInfo.message}</p>
          </div>
          {state.bookingStatus === 'enroute' && (
            <div className="mt-4 text-center space-y-2">
              <button
                onClick={() => updateState({ currentPage: 'tracking' })}
                className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm sm:text-base mr-3"
              >
                {t('viewLiveTracking')}
              </button>
              <button
                onClick={handleVideoCall}
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
              >
                <Video className="h-4 w-4 inline mr-2" />
                {t('callParamedic')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Need Emergency Medical Help? */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 sm:p-8 text-white text-center mb-8 sm:mb-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{t('needEmergencyHelp')}</h2>
        <p className="text-red-100 mb-4 sm:mb-6 text-sm sm:text-base">
          {t('needEmergencyHelpDesc')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center">
          <button 
            onClick={() => updateState({ currentPage: 'book' })}
            className="bg-white text-red-600 px-4 sm:px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base"
          >
            {t('bookAmbulance')}
          </button>
          <button 
            onClick={() => updateState({ currentPage: 'assessment' })}
            className="border-2 border-white text-white px-4 sm:px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors duration-200 text-sm sm:text-base"
          >
            {t('aiAssessment')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
          <div className="bg-red-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-6">
            <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">{t('emergencyResponse')}</h3>
          <p className="text-gray-600 text-sm sm:text-base mb-4">{t('emergencyResponseDesc')}</p>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-red-800 font-semibold text-sm">Avg Response:</span>
              <span className="text-red-600 font-bold">8.3 min</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
          <div className="bg-blue-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-6">
            <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">{t('realTimeTracking')}</h3>
          <p className="text-gray-600 text-sm sm:text-base mb-4">{t('realTimeTrackingDesc')}</p>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-blue-800 font-semibold text-sm">Accuracy:</span>
              <span className="text-blue-600 font-bold">99.2%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100 md:col-span-2 lg:col-span-1">
          <div className="bg-green-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 sm:mb-6">
            <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">{t('aiMedicalAssessment')}</h3>
          <p className="text-gray-600 text-sm sm:text-base mb-4">{t('aiMedicalAssessmentDesc')}</p>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-green-800 font-semibold text-sm">AI Accuracy:</span>
              <span className="text-green-600 font-bold">94.7%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {(state.triageLevel || state.urgencyScore || state.matchedHospitals.length > 0) && (
        <div className="mt-8 sm:mt-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Your Recent Activity</h3>
          <MetricsDisplay variant="compact" showLive={false} />
        </div>
      )}
    </div>
  );
};

export default DashboardScreen;