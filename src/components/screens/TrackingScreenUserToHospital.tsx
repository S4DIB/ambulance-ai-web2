// This is a duplicate of TrackingScreen.tsx for user-to-hospital tracking
import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Phone, Video, Truck, Navigation, Zap, AlertTriangle, CheckCircle, Activity, Wifi } from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { analytics } from '../../utils/analytics';
import MetricsDisplay from '../MetricsDisplay';
import { metricsSimulator } from '../../utils/metricsData';
import { HospitalAPI } from '../../utils/emergencyAPI';

interface TrackingScreenUserToHospitalProps {
  updateState: (updates: any) => void;
  selectedHospital: any;
}

const TrackingScreenUserToHospital: React.FC<TrackingScreenUserToHospitalProps> = ({ updateState, selectedHospital }) => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [routeProgress, setRouteProgress] = useState(0); // 0 to 100
  const [etaMinutes, setEtaMinutes] = useState(15); // Simulated ETA
  const [isArrived, setIsArrived] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState(metricsSimulator.getLiveOperationalData());

  // Simulate route progress from user to hospital
  useEffect(() => {
    if (isArrived) return;
    const timer = setInterval(() => {
      setRouteProgress(prev => {
        const next = Math.min(prev + Math.random() * 6, 100);
        if (next >= 100) setIsArrived(true);
        return next;
      });
      setEtaMinutes(prev => Math.max(1, prev - Math.random() * 0.7));
    }, 1800);
    return () => clearInterval(timer);
  }, [isArrived]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    setLiveMetrics(metricsSimulator.getLiveOperationalData());
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          <Navigation className="inline h-6 w-6 sm:h-8 sm:w-8 mr-3 text-blue-600" />
          Tracking: Your Location → {selectedHospital?.name || 'Hospital'}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-4">
          Live tracking from your location to the selected hospital with AI-powered route optimization.
        </p>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Live System Status</h2>
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            Real-time
          </div>
        </div>
        <MetricsDisplay variant="compact" showLive={true} />
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 sm:p-4 rounded-full mr-4">
              <Navigation className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">En Route to Hospital</h2>
              <p className="text-gray-600 text-sm sm:text-base">Tracking your journey to {selectedHospital?.name || 'the hospital'}.</p>
            </div>
          </div>
          {!isArrived && (
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {Math.round(etaMinutes)} min
              </div>
              <div className="text-gray-500 text-xs sm:text-sm">ETA</div>
            </div>
          )}
        </div>
        {/* Progress Bar */}
        {!isArrived && (
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Your Location</span>
              <span>{routeProgress.toFixed(2)}% Complete</span>
              <span>{selectedHospital?.name || 'Hospital'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 sm:h-4 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${routeProgress}%` }}
              ></div>
            </div>
            <div className="text-center mt-2 text-xs sm:text-sm text-gray-500">
              {(100 - routeProgress).toFixed(2)}% Remaining
            </div>
          </div>
        )}
        {isArrived && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-700 mb-2">Arrived at {selectedHospital?.name || 'Hospital'}!</h2>
            <p className="text-gray-700 text-base">You have reached your destination. Please proceed to the hospital entrance.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingScreenUserToHospital; 