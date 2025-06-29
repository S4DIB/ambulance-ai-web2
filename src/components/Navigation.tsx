import React, { useState } from 'react';
import { 
  Home, 
  Truck, 
  Brain, 
  Building2, 
  MapPin, 
  History,
  LogOut,
  Menu,
  X,
  Video,
  Globe
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import VideoCallModal from './VideoCallModal';
import { useTranslation } from '../utils/translations';
import { supabase } from '../utils/supabaseClient';

interface NavigationProps {
  activeScreen: string;
  onScreenChange: (screen: string) => void;
  bookingStatus: string;
  updateState: (updates: any) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeScreen, onScreenChange, bookingStatus, updateState }) => {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);

  const navItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'book', label: t('bookAmbulance'), icon: Truck },
    { id: 'assessment', label: t('aiAssessment'), icon: Brain },
    { id: 'hospitals', label: t('hospitals'), icon: Building2 },
    { id: 'tracking', label: t('tracking'), icon: MapPin },
    { id: 'history', label: t('history'), icon: History }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Reset state and return to login
    Object.assign((window as any).state, {
      currentPage: "home",
      isLoggedIn: false,
      bookingStatus: "none",
      pickupLocation: "",
      symptoms: "",
      triageLevel: null,
      urgencyScore: null,
      matchedHospitals: [],
      ambulancePosition: 0,
      etaMinutes: 5,
      patientName: "",
      contactNumber: "",
      emergencyType: "",
      assessmentResponses: [],
      isVideoCallActive: false,
      currentUser: null
    });
    window.dispatchEvent(new Event('statechange'));
  };

  const handleVideoCall = () => {
    setIsVideoCallOpen(true);
    updateState({ 
      isVideoCallActive: true,
      videoCallType: bookingStatus === 'enroute' || bookingStatus === 'dispatched' ? 'emergency' : 'consultation'
    });
  };

  const handleCloseVideoCall = () => {
    setIsVideoCallOpen(false);
    updateState({ isVideoCallActive: false });
  };

  const getButtonStyle = (itemId: string) => {
    const isActive = activeScreen === itemId;
    let baseStyle = `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 `;
    
    if (isActive) {
      baseStyle += 'bg-red-500 text-white shadow-md ';
    } else {
      baseStyle += 'text-gray-600 hover:text-red-600 hover:bg-red-50 ';
    }
    
    return baseStyle;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-2 rounded-lg">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  Rescufast.ai
                </span>
              </div>
            </div>
            
            {/* Desktop Navigation - Simplified */}
            <div className="hidden lg:block">
              <div className="flex items-center space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === 'tracking') {
                          const trackingPhase = (window as any).state.trackingPhase;
                          if (bookingStatus !== 'none') {
                            if (trackingPhase === 'userToHospital') {
                              onScreenChange('userToHospitalTracking');
                            } else {
                              onScreenChange('tracking');
                            }
                          } else {
                            onScreenChange('home');
                          }
                        } else {
                          onScreenChange(item.id);
                        }
                      }}
                      className={getButtonStyle(item.id)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{item.label}</span>
                      {item.id === 'tracking' && ['dispatched', 'enroute'].includes(bookingStatus) && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Right Side - Simplified */}
            <div className="hidden lg:flex items-center space-x-2">
              {/* Video Call - Only show when emergency is active */}
              {['dispatched', 'enroute'].includes(bookingStatus) && (
                <button
                  onClick={handleVideoCall}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 relative"
                  title={t('callParamedic')}
                >
                  <Video className="h-5 w-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                </button>
              )}

              {/* Language Selector */}
              <LanguageSelector />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title={t('logout')}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button 
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'tracking') {
                      const trackingPhase = (window as any).state.trackingPhase;
                      if (bookingStatus !== 'none') {
                        if (trackingPhase === 'userToHospital') {
                          onScreenChange('userToHospitalTracking');
                        } else {
                          onScreenChange('tracking');
                        }
                      } else {
                        onScreenChange('home');
                      }
                    } else {
                      onScreenChange(item.id);
                    }
                    setIsMobileMenuOpen(false);
                  }}
                  className={
                    `flex items-center space-x-3 w-full px-3 py-3 rounded-md text-base font-medium transition-all duration-200 relative
                    ${isActive 
                      ? 'bg-red-500 text-white' 
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-100'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.id === 'tracking' && ['dispatched', 'enroute'].includes(bookingStatus) && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1"></div>
                  )}
                </button>
              );
            })}
            
            {/* Mobile Video Call - Only when emergency active */}
            {['dispatched', 'enroute'].includes(bookingStatus) && (
              <button
                onClick={() => {
                  handleVideoCall();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-3 rounded-md text-base font-medium text-blue-600 hover:bg-blue-100 transition-all duration-200 relative"
              >
                <Video className="h-5 w-5" />
                <span>{t('videoCall')}</span>
                <div className="absolute right-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </button>
            )}

            {/* Mobile Language & Logout */}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="px-3 py-2">
                <LanguageSelector />
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 w-full px-3 py-3 rounded-md text-base font-medium text-gray-600 hover:text-red-600 hover:bg-red-100 transition-all duration-200"
              >
                <LogOut className="h-5 w-5" />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Video Call Modal */}
      <VideoCallModal
        isOpen={isVideoCallOpen}
        onClose={handleCloseVideoCall}
        paramedicName="Dr. Rahman"
        callType={window.state.videoCallType || 'consultation'}
      />
    </>
  );
};

export default Navigation;