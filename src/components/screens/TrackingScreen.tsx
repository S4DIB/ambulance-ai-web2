import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Phone, Video, Truck, Navigation, Zap, AlertTriangle, CheckCircle, Activity, Wifi } from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { analytics } from '../../utils/analytics';
import MetricsDisplay from '../MetricsDisplay';
import { metricsSimulator } from '../../utils/metricsData';

interface TrackingScreenProps {
  updateState: (updates: any) => void;
}

const TrackingScreen: React.FC<TrackingScreenProps> = ({ updateState }) => {
  const state = (window as any).state;
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [routeOptimization, setRouteOptimization] = useState({
    isOptimizing: false,
    savedMinutes: 0,
    routesAnalyzed: 0
  });
  const [liveMetrics, setLiveMetrics] = useState(metricsSimulator.getLiveOperationalData());
  const [showArrivalPopup, setShowArrivalPopup] = useState(false);
  const [popupStep, setPopupStep] = useState(0); // 0: none, 1: hospital search, 2: hospital found, 3: route search, 4: route found
  const [showHospitalSelect, setShowHospitalSelect] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);

  // Hospital data (copied from HospitalsScreen)
  const hospitalOptions = [
    {
      id: 1,
      name: "Dhaka Medical College Hospital",
      availableBeds: 45,
      costLevel: "Low",
      address: "Ramna, Dhaka-1000, Bangladesh",
      fare: 1200
    },
    {
      id: 2,
      name: "Square Hospital Limited",
      availableBeds: 23,
      costLevel: "High",
      address: "18/F, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka-1205",
      fare: 1800
    },
    {
      id: 3,
      name: "Bangabandhu Sheikh Mujib Medical University",
      availableBeds: 8,
      costLevel: "Medium",
      address: "Shahbag, Dhaka-1000, Bangladesh",
      fare: 1500
    },
    {
      id: 4,
      name: "United Hospital Limited",
      availableBeds: 18,
      costLevel: "High",
      address: "Plot 15, Road 71, Gulshan-2, Dhaka-1212",
      fare: 2000
    },
    {
      id: 5,
      name: "Apollo Hospitals Dhaka",
      availableBeds: 31,
      costLevel: "Premium",
      address: "Plot 81, Block E, Bashundhara R/A, Dhaka-1229",
      fare: 2200
    },
    {
      id: 6,
      name: "Ibn Sina Hospital",
      availableBeds: 15,
      costLevel: "Medium",
      address: "House 48, Road 9/A, Dhanmondi, Dhaka-1209",
      fare: 1400
    }
  ];

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setLiveMetrics(metricsSimulator.getLiveOperationalData());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate route optimization
  useEffect(() => {
    if (state.bookingStatus === 'dispatched' || state.bookingStatus === 'enroute') {
      const optimizationTimer = setTimeout(() => {
        setRouteOptimization({
          isOptimizing: false,
          savedMinutes: Math.floor(Math.random() * 5) + 2, // 2-6 minutes saved
          routesAnalyzed: Math.floor(Math.random() * 15) + 8 // 8-22 routes
        });
        analytics.track('route_optimization_completed', {
          savedMinutes: routeOptimization.savedMinutes,
          routesAnalyzed: routeOptimization.routesAnalyzed
        });
      }, 3000);

      setRouteOptimization(prev => ({ ...prev, isOptimizing: true }));
      return () => clearTimeout(optimizationTimer);
    }
  }, [state.bookingStatus]);

  // Simulate ambulance position updates
  useEffect(() => {
    if (state.bookingStatus === 'enroute') {
      const positionTimer = setInterval(() => {
        const newPosition = Math.min(state.ambulancePosition + Math.random() * 5, 95);
        const newEta = Math.max(1, state.etaMinutes - Math.random() * 0.5);
        
        updateState({
          ambulancePosition: newPosition,
          etaMinutes: Math.round(newEta)
        });

        // Simulate arrival
        if (newPosition >= 95) {
          updateState({ bookingStatus: 'arrived' });
          analytics.track('ambulance_arrived', {
            totalTime: Date.now() - (state.requestTime || Date.now()),
            finalPosition: newPosition
          });
        }
      }, 2000);

      return () => clearInterval(positionTimer);
    }
  }, [state.bookingStatus, state.ambulancePosition]);

  // Show popup when ambulance arrives
  useEffect(() => {
    if (state.bookingStatus === 'arrived') {
      setShowArrivalPopup(true);
      setPopupStep(0);
    }
  }, [state.bookingStatus]);

  // Handle popup sequence
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showArrivalPopup) {
      if (popupStep === 1) {
        timer = setTimeout(() => setPopupStep(2), 2000);
      } else if (popupStep === 2) {
        timer = setTimeout(() => setPopupStep(3), 1500);
      } else if (popupStep === 3) {
        timer = setTimeout(() => setPopupStep(4), 2000);
      }
    }
    return () => clearTimeout(timer);
  }, [showArrivalPopup, popupStep]);

  const handleVideoCall = () => {
    updateState({ 
      isVideoCallActive: true,
      videoCallType: 'emergency'
    });
    analytics.track('emergency_video_call_started', {
      bookingStatus: state.bookingStatus,
      ambulancePosition: state.ambulancePosition
    });
  };

  const handleCall = () => {
    window.location.href = 'tel:+8801234567890';
    analytics.track('emergency_call_made', {
      bookingStatus: state.bookingStatus
    });
  };

  const getStatusInfo = () => {
    switch (state.bookingStatus) {
      case 'none':
        return {
          title: t('noActiveBooking'),
          description: t('noActiveBookingDesc'),
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: Truck,
          showProgress: false
        };
      case 'requested':
        return {
          title: t('requestReceived'),
          description: t('requestReceivedDesc'),
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: Clock,
          showProgress: true,
          progress: 10
        };
      case 'dispatched':
        return {
          title: t('ambulanceDispatched'),
          description: t('ambulanceDispatchedDesc'),
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: Navigation,
          showProgress: true,
          progress: 25
        };
      case 'enroute':
        return {
          title: t('enRouteWithAI'),
          description: t('enRouteDesc'),
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: MapPin,
          showProgress: true,
          progress: state.ambulancePosition || 50
        };
      case 'arrived':
        return {
          title: t('ambulanceArrived'),
          description: t('ambulanceArrivedDesc'),
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          icon: CheckCircle,
          showProgress: true,
          progress: 100
        };
      default:
        return {
          title: t('processing'),
          description: t('processingRequest'),
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: Activity,
          showProgress: true,
          progress: 5
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Mock traffic data
  const trafficEvents = [
    { type: 'construction', location: 'Dhanmondi Road 27', impact: 'Medium', time: '5 min ago' },
    { type: 'accident', location: 'Gulshan Circle 1', impact: 'High', time: '12 min ago' },
    { type: 'congestion', location: 'Farmgate Junction', impact: 'Low', time: '8 min ago' }
  ];

  const getTrafficImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (state.bookingStatus === 'none') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center py-8 sm:py-12">
          <Truck className="h-16 w-16 sm:h-20 sm:w-20 text-gray-400 mx-auto mb-4 sm:mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{t('noActiveBooking')}</h1>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base px-4">{t('noActiveBookingDesc')}</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center">
            <button
              onClick={() => updateState({ currentPage: 'book' })}
              className="bg-red-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 text-sm sm:text-base"
            >
              {t('bookAmbulance')}
            </button>
            <button
              onClick={() => updateState({ currentPage: 'home' })}
              className="border border-gray-300 text-gray-700 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
            >
              {t('returnHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Arrival & Sequence Popups */}
      {showArrivalPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative animate-fade-in border border-blue-100">
            {popupStep === 0 && (
              <>
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">🚑</span>
                  <h2 className="text-2xl font-bold mb-2 text-gray-900">Initiate hospital search and route optimization process.</h2>
                  <p className="text-gray-600 mb-4 text-base">Your ambulance has arrived. Let's find the best hospital and route for you.</p>
                  <button
                    onClick={() => setPopupStep(1)}
                    className="mt-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-green-500 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-green-600 transition-colors text-base"
                  >
                    Proceed
                  </button>
                </div>
              </>
            )}
            {popupStep === 1 && (
              <>
                <div className="flex flex-col items-center animate-pulse">
                  <span className="text-4xl mb-2">🏥</span>
                  <div className="mb-4">
                    <span className="inline-block w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Locating the closest hospital</h2>
                  <p className="text-gray-600 text-base">Based on proximity and real-time bed availability.</p>
                </div>
              </>
            )}
            {popupStep === 2 && (
              <>
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">✅</span>
                  <h2 className="text-2xl font-bold mb-2 text-green-700">Hospital found</h2>
                  <p className="text-gray-600 text-base">A suitable hospital has been identified for your needs.</p>
                </div>
              </>
            )}
            {popupStep === 3 && (
              <>
                <div className="flex flex-col items-center animate-pulse">
                  <span className="text-4xl mb-2">🗺️</span>
                  <div className="mb-4">
                    <span className="inline-block w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Determining the most efficient route</h2>
                  <p className="text-gray-600 text-base">Using our intelligent routing system for fastest arrival.</p>
                </div>
              </>
            )}
            {popupStep === 4 && (
              <>
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">🚦</span>
                  <h2 className="text-2xl font-bold mb-2 text-green-700">Route found</h2>
                  <p className="text-gray-600 text-base mb-4">Optimal route calculated.</p>
                  <button
                    onClick={() => {
                      setShowArrivalPopup(false);
                      setPopupStep(0);
                      setTimeout(() => setShowHospitalSelect(true), 200);
                    }}
                    className="mt-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-green-500 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-green-600 transition-colors text-base"
                  >
                    Proceed
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hospital Selection Modal */}
      {showHospitalSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-2xl px-4 py-6 sm:px-16 sm:py-12 max-w-6xl w-full text-center relative animate-fade-in border border-blue-100">
            <span className="text-4xl mb-2 block">🏥</span>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Select a Hospital</h2>
            <p className="text-gray-600 mb-6 text-base">Choose your preferred hospital based on bed availability and cost.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {hospitalOptions.map(hospital => (
                <div
                  key={hospital.id}
                  className={`bg-white border-2 rounded-2xl min-w-[250px] md:min-w-[300px] p-5 md:p-7 flex flex-col justify-between shadow-sm transition-all duration-200 hover:shadow-xl hover:border-blue-400 ${selectedHospital?.id === hospital.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
                >
                  <div className="mb-3">
                    <div className="flex items-center mb-2">
                      <span className="text-base md:text-xl font-bold text-gray-900 mr-2">{hospital.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className="flex items-center text-green-600 text-sm md:text-base font-medium"><span className="mr-1">🛏️</span>{hospital.availableBeds} beds</span>
                      <span className="flex items-center text-purple-600 text-sm md:text-base font-medium"><span className="mr-1">💸</span>{hospital.costLevel}</span>
                      <span className="flex items-center text-yellow-600 text-sm md:text-base font-medium"><span className="mr-1">🚕</span>{hospital.fare} BDT</span>
                    </div>
                    <div className="text-xs md:text-sm text-gray-500 mb-3 flex items-center"><MapPin className="h-3 w-3 mr-1 inline-block text-gray-400" />{hospital.address}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedHospital(hospital);
                      setShowHospitalSelect(false);
                      // Optionally: updateState({ selectedHospital: hospital });
                    }}
                    className="mt-2 w-full bg-gradient-to-r from-blue-600 to-green-500 text-white rounded-lg font-semibold py-2 md:py-2.5 shadow hover:from-blue-700 hover:to-green-600 transition-colors text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          <MapPin className="inline h-6 w-6 sm:h-8 sm:w-8 mr-3 text-blue-600" />
          {t('realTimeTracking')}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-4">
          Live tracking of your emergency ambulance with AI-powered route optimization
        </p>
      </div>

      {/* Live System Metrics */}
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

      {/* Status Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center">
            <div className={`${statusInfo.bgColor} p-3 sm:p-4 rounded-full mr-4`}>
              <statusInfo.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${statusInfo.color}`} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{statusInfo.title}</h2>
              <p className="text-gray-600 text-sm sm:text-base">{statusInfo.description}</p>
            </div>
          </div>
          
          {state.bookingStatus === 'enroute' && (
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {state.etaMinutes} min
              </div>
              <div className="text-gray-500 text-xs sm:text-sm">{t('etaMinutes')}</div>
              <div className="text-xs text-gray-400 mt-1">
                AI-optimized: -{routeOptimization.savedMinutes || 3}min
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {statusInfo.showProgress && (
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{t('start')}</span>
              <span>{statusInfo.progress.toFixed(2)}% {t('complete')}</span>
              <span>{t('arrived')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 sm:h-4 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${statusInfo.progress}%` }}
              ></div>
            </div>
            <div className="text-center mt-2 text-xs sm:text-sm text-gray-500">
              {(100 - statusInfo.progress).toFixed(2)}% {t('remaining')}
            </div>
          </div>
        )}

        {/* Real-time Performance Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 sm:mb-6">
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg text-center">
            <div className="text-lg sm:text-xl font-bold text-blue-600">{liveMetrics.ambulancesInTransit}</div>
            <div className="text-xs sm:text-sm text-blue-800">Ambulances In Transit</div>
          </div>
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg text-center">
            <div className="text-lg sm:text-xl font-bold text-green-600">{liveMetrics.currentTrafficLoad}%</div>
            <div className="text-xs sm:text-sm text-green-800">Traffic Load</div>
          </div>
          <div className="bg-purple-50 p-3 sm:p-4 rounded-lg text-center">
            <div className="text-lg sm:text-xl font-bold text-purple-600">{liveMetrics.networkLatency}ms</div>
            <div className="text-xs sm:text-sm text-purple-800">Network Latency</div>
          </div>
          <div className="bg-orange-50 p-3 sm:p-4 rounded-lg text-center">
            <div className="text-lg sm:text-xl font-bold text-orange-600">{liveMetrics.weatherImpact.delayImpact}%</div>
            <div className="text-xs sm:text-sm text-orange-800">Weather Impact</div>
          </div>
        </div>

        {/* Route Optimization Status */}
        {(state.bookingStatus === 'dispatched' || state.bookingStatus === 'enroute') && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-purple-200">
            {routeOptimization.isOptimizing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin h-5 w-5 sm:h-6 sm:w-6 border-2 border-purple-600 border-t-transparent rounded-full mr-3"></div>
                <span className="text-purple-800 font-semibold text-sm sm:text-base">
                  {t('aiRouteOptimization')}
                </span>
              </div>
            ) : routeOptimization.savedMinutes > 0 ? (
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2" />
                  <span className="text-green-800 font-semibold text-sm sm:text-base">
                    {t('routeOptimized')}
                  </span>
                </div>
                <p className="text-green-700 text-xs sm:text-sm">
                  {t('savedMinutes')} <span className="font-bold">{routeOptimization.savedMinutes}</span> minutes through AI optimization
                </p>
                <div className="mt-2 text-xs text-green-600">
                  Analyzed {routeOptimization.routesAnalyzed} alternative routes • Weather: {liveMetrics.weatherImpact.condition}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Live Route Progress */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
            <Navigation className="inline h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600" />
            {t('liveRouteProgress')}
          </h3>
          
          {/* Route Visualization */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full mr-2 sm:mr-3"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">{t('hospitalBase')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full mr-2 sm:mr-3"></div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">{t('yourLocation')}</span>
              </div>
            </div>
            
            {/* Route Line */}
            <div className="relative">
              <div className="w-full h-2 bg-gray-300 rounded-full">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-1000"
                  style={{ width: `${state.ambulancePosition || 0}%` }}
                ></div>
              </div>
              {/* Ambulance Icon */}
              <div 
                className="absolute top-0 transform -translate-y-1/2 transition-all duration-1000"
                style={{ left: `${state.ambulancePosition || 0}%` }}
              >
                <Truck className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* AI Features */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t('aiTrafficIntelligence')}</h4>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <p className="text-purple-100 text-xs sm:text-sm">{t('learningFactor')}</p>
                <p className="text-xl sm:text-2xl font-bold">94%</p>
              </div>
              <div>
                <p className="text-purple-100 text-xs sm:text-sm">{t('routesAnalyzed')}</p>
                <p className="text-xl sm:text-2xl font-bold">{routeOptimization.routesAnalyzed || 12}</p>
              </div>
            </div>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <p>✓ Real-time traffic analysis</p>
              <p>✓ Dynamic route optimization</p>
              <p>✓ Weather impact modeling</p>
              <p>✓ Predictive arrival calculation</p>
              <p>✓ Emergency lane coordination</p>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4 sm:space-y-6">
          {/* Emergency Actions */}
          {(state.bookingStatus === 'dispatched' || state.bookingStatus === 'enroute') && (
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('emergencyVideoCall')}</h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">{t('connectWithParamedic')}</p>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={handleVideoCall}
                  className="w-full bg-blue-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
                >
                  <Video className="h-4 w-4 mr-2" />
                  {t('videoCall')}
                </button>
                <button
                  onClick={handleCall}
                  className="w-full bg-green-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {t('call')}
                </button>
              </div>
            </div>
          )}

          {/* Ambulance Details */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('ambulanceDetails')}</h3>
            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('vehicleId')}:</span>
                <span className="font-semibold">AMB-{Math.floor(Math.random() * 1000) + 100}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('crew')}:</span>
                <span className="font-semibold">Dr. Rahman, Paramedic Ali</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('equipment')}:</span>
                <span className="font-semibold">Advanced Life Support</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('priorityLevel')}:</span>
                <span className="font-semibold text-red-600">High</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('contact')}:</span>
                <span className="font-semibold">+880-123-456-789</span>
              </div>
            </div>
          </div>

          {/* Live Traffic Events */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              <Wifi className="inline h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {t('liveTrafficEvents')}
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {trafficEvents.map((event, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-3 sm:pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">{event.location}</p>
                      <p className="text-xs text-gray-600 capitalize">{event.type}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTrafficImpactColor(event.impact)}`}>
                        {event.impact}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{event.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-red-50 rounded-xl p-4 sm:p-6 border border-red-200">
            <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2 sm:mb-3">{t('emergencyContactInfo')}</h3>
            <p className="text-red-700 text-xs sm:text-sm mb-3 sm:mb-4">{t('immediateAssistance')}</p>
            <button
              onClick={() => window.location.href = 'tel:999'}
              className="w-full bg-red-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
            >
              <Phone className="h-4 w-4 mr-2" />
              {t('callEmergencyServices')}
            </button>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('statusTimeline')}</h3>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center">
            <div className="bg-green-500 w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-3 sm:mr-4"></div>
            <div className="flex-1">
              <p className="text-sm sm:text-base font-semibold text-gray-900">{t('aiDispatchInitiated')}</p>
              <p className="text-xs sm:text-sm text-gray-600">{currentTime.toLocaleTimeString()}</p>
            </div>
          </div>
          
          {state.bookingStatus !== 'requested' && (
            <div className="flex items-center">
              <div className="bg-green-500 w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-3 sm:mr-4"></div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold text-gray-900">{t('aiRouteCalculated')}</p>
                <p className="text-xs sm:text-sm text-gray-600">{t('optimalPathSelected')}</p>
              </div>
            </div>
          )}
          
          {(state.bookingStatus === 'enroute' || state.bookingStatus === 'arrived') && (
            <div className="flex items-center">
              <div className="bg-green-500 w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-3 sm:mr-4"></div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold text-gray-900">{t('enRouteWithAiNav')}</p>
                <p className="text-xs sm:text-sm text-gray-600">{t('realTimeOptimization')}</p>
              </div>
            </div>
          )}
          
          {state.bookingStatus === 'arrived' && (
            <div className="flex items-center">
              <div className="bg-green-500 w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-3 sm:mr-4"></div>
              <div className="flex-1">
                <p className="text-sm sm:text-base font-semibold text-gray-900">{t('missionComplete')}</p>
                <p className="text-xs sm:text-sm text-gray-600">{t('ambulanceArrivedDesc')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingScreen;