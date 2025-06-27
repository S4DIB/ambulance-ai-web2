import React, { useState } from 'react';
import { MapPin, Phone, Clock, User, CheckCircle, Truck, Navigation, Calendar, Plus, X } from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { analytics } from '../../utils/analytics';
import { offlineStorage } from '../../utils/offlineStorage';
import { ImageOptimizer } from '../../utils/performanceOptimizer';

interface BookAmbulanceScreenProps {
  updateState: (updates: any) => void;
}

const BookAmbulanceScreen: React.FC<BookAmbulanceScreenProps> = ({ updateState }) => {
  const state = (window as any).state;
  const { t } = useTranslation();
  const [bookingType, setBookingType] = useState<'emergency' | 'scheduled'>('emergency');
  const [formData, setFormData] = useState({
    patientName: state.patientName || '',
    pickupLocation: state.pickupLocation || '',
    symptoms: state.symptoms || '',
    destinationLocation: '',
    scheduledDate: '',
    scheduledTime: '',
    appointmentType: '',
    specialRequirements: '',
    contactNumber: '',
    emergencyContact: '',
    wheelchairAccess: false,
    oxygenRequired: false,
    stretcherRequired: false
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGettingDestination, setIsGettingDestination] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<{
    distance: number;
    baseRate: number;
    additionalCost: number;
    specialRequirementsCost: number;
    total: number;
    breakdown: string[];
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    const newFormData = {
      ...formData,
      [e.target.name]: value
    };
    setFormData(newFormData);

    // Calculate price when pickup or destination changes for scheduled bookings
    if (bookingType === 'scheduled' && (e.target.name === 'pickupLocation' || e.target.name === 'destinationLocation')) {
      calculatePrice(newFormData);
    }
  };

  const calculatePrice = (data: typeof formData) => {
    if (!data.pickupLocation || !data.destinationLocation) {
      setCalculatedPrice(null);
      return;
    }

    // Simulate distance calculation based on location names
    const locations: { [key: string]: { lat: number; lng: number } } = {
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

    // Extract location keywords and estimate distance
    const pickupKey = Object.keys(locations).find(key => 
      data.pickupLocation.toLowerCase().includes(key) || data.pickupLocation.toLowerCase().includes(key.replace(' ', ''))
    );
    const destKey = Object.keys(locations).find(key => 
      data.destinationLocation.toLowerCase().includes(key) || data.destinationLocation.toLowerCase().includes(key.replace(' ', ''))
    );

    if (pickupKey && destKey && locations[pickupKey] && locations[destKey]) {
      const pickup_coords = locations[pickupKey];
      const dest_coords = locations[destKey];
      
      // Haversine formula for distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = (dest_coords.lat - pickup_coords.lat) * Math.PI / 180;
      const dLng = (dest_coords.lng - pickup_coords.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(pickup_coords.lat * Math.PI / 180) * Math.cos(dest_coords.lat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      // Add some realistic road distance factor (usually 1.3-1.5x straight line)
      return Math.round(distance * 1.4 * 10) / 10;
    }

    // Default distance estimation based on string similarity and common patterns
    if (data.pickupLocation.toLowerCase().includes('airport') || data.destinationLocation.toLowerCase().includes('airport')) {
      return 25 + Math.random() * 10; // Airport is usually far
    }
    
    // Random realistic distance for Dhaka (5-30 km)
    return Math.round((8 + Math.random() * 22) * 10) / 10;
  };

  const handleAutoLocation = () => {
    setIsGettingLocation(true);
    analytics.track('location_request_started');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Simulate reverse geocoding with a realistic Dhaka address
          const dhakaAddresses = [
            "House 45, Road 12, Dhanmondi, Dhaka-1205",
            "Plot 23, Gulshan Avenue, Gulshan-1, Dhaka-1212",
            "Building 67, Banani C/A, Dhaka-1213",
            "House 89, Road 27, Uttara, Dhaka-1230",
            "Flat 4B, Mirpur DOHS, Dhaka-1216"
          ];
          
          const randomAddress = dhakaAddresses[Math.floor(Math.random() * dhakaAddresses.length)];
          
          setTimeout(() => {
            const newFormData = {
              ...formData,
              pickupLocation: randomAddress
            };
            setFormData(newFormData);
            setIsGettingLocation(false);
            
            // Recalculate price if destination is also set
            if (bookingType === 'scheduled') {
              calculatePrice(newFormData);
            }
            
            analytics.track('location_obtained', { 
              method: 'gps',
              address: randomAddress 
            });
          }, 1500);
        },
        (error) => {
          console.error('Error getting location:', error);
          analytics.track('location_error', { error: error.message });
          
          // Fallback to a default location
          const newFormData = {
            ...formData,
            pickupLocation: "Current Location - Dhaka, Bangladesh"
          };
          setFormData(newFormData);
          setIsGettingLocation(false);
        }
      );
    } else {
      // Geolocation not supported, use fallback
      const newFormData = {
        ...formData,
        pickupLocation: "Current Location - Dhaka, Bangladesh"
      };
      setFormData(newFormData);
      setIsGettingLocation(false);
      analytics.track('location_fallback', { reason: 'geolocation_not_supported' });
    }
  };

  const handleAutoDestination = () => {
    setIsGettingDestination(true);
    
    // Simulate getting popular destination locations
    const popularDestinations = [
      "Dhaka Medical College Hospital, Ramna, Dhaka-1000",
      "Square Hospital Limited, West Panthapath, Dhaka-1205",
      "United Hospital Limited, Gulshan-2, Dhaka-1212",
      "Apollo Hospitals Dhaka, Bashundhara R/A, Dhaka-1229",
      "Ibn Sina Hospital, Dhanmondi, Dhaka-1209",
      "Hazrat Shahjalal International Airport, Dhaka-1229",
      "Dhaka University, Ramna, Dhaka-1000",
      "New Market, Azimpur, Dhaka-1205",
      "Bashundhara City Shopping Complex, Panthapath, Dhaka-1205",
      "Uttara Sector 7, Dhaka-1230"
    ];
    
    setTimeout(() => {
      const randomDestination = popularDestinations[Math.floor(Math.random() * popularDestinations.length)];
      const newFormData = {
        ...formData,
        destinationLocation: randomDestination
      };
      setFormData(newFormData);
      setIsGettingDestination(false);
      
      // Recalculate price
      if (bookingType === 'scheduled') {
        calculatePrice(newFormData);
      }
      
      analytics.track('destination_suggested', { destination: randomDestination });
    }, 1000);
  };

  const handleRequestAmbulance = async () => {
    setIsSubmitting(true);
    
    try {
      const requestData = {
        ...formData,
        bookingType,
        calculatedPrice: calculatedPrice?.total,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        online: navigator.onLine
      };

      // Save offline first for emergency requests
      if (bookingType === 'emergency') {
        await offlineStorage.saveEmergencyRequest(requestData);
        analytics.trackEmergencyRequest(requestData);
      }

      if (bookingType === 'emergency') {
        // Update state with form data and booking status
        updateState({
          patientName: formData.patientName,
          pickupLocation: formData.pickupLocation,
          symptoms: formData.symptoms,
          bookingStatus: 'requested',
          currentPage: 'tracking'
        });

        // Simulate dispatch after 3 seconds
        setTimeout(() => {
          updateState({ 
            bookingStatus: 'dispatched',
            ambulancePosition: 10,
            etaMinutes: 8
          });
        }, 3000);

        // Simulate en route after 8 seconds
        setTimeout(() => {
          updateState({ 
            bookingStatus: 'enroute',
            ambulancePosition: 25,
            etaMinutes: 6
          });
        }, 8000);
      } else {
        // Handle scheduled booking
        updateState({
          patientName: formData.patientName,
          pickupLocation: formData.pickupLocation,
          destinationLocation: formData.destinationLocation,
          symptoms: formData.symptoms,
          scheduledDate: formData.scheduledDate,
          scheduledTime: formData.scheduledTime,
          bookingStatus: 'scheduled',
          calculatedPrice: calculatedPrice?.total,
          currentPage: 'scheduledConfirmation'
        });
        
        analytics.track('scheduled_booking_submitted', requestData);
      }
    } catch (error: any) {
      console.error('Failed to submit booking:', error);
      analytics.track('booking_submission_error', { 
        error: error.message,
        bookingType 
      });
      
      // Show error message but still proceed for emergency
      if (bookingType === 'emergency') {
        alert('Request saved offline. Will sync when connection is restored.');
        updateState({
          patientName: formData.patientName,
          pickupLocation: formData.pickupLocation,
          symptoms: formData.symptoms,
          bookingStatus: 'requested',
          currentPage: 'tracking'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get minimum time (current time if today is selected)
  const getMinTime = () => {
    const today = new Date();
    const selectedDate = new Date(formData.scheduledDate);
    
    if (selectedDate.toDateString() === today.toDateString()) {
      const hours = today.getHours().toString().padStart(2, '0');
      const minutes = today.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    return '';
  };

  // Show offline indicator
  const isOffline = !navigator.onLine;

  if (state.bookingStatus === 'requested') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto mb-4 sm:mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{t('ambulanceRequestSubmitted')}</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 px-4">
            {isOffline ? 'Request saved offline. Will sync when connection is restored.' : t('emergencyRequestReceived')}
          </p>
          
          {isOffline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                📱 You're currently offline. Your emergency request has been saved and will be sent automatically when connection is restored.
              </p>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('requestDetails')}</h3>
                <div className="space-y-2 text-left">
                  <p className="text-sm sm:text-base"><span className="font-medium">{t('patient')}:</span> {state.patientName}</p>
                  <p className="text-sm sm:text-base"><span className="font-medium">{t('location')}:</span> {state.pickupLocation}</p>
                  {state.symptoms && <p className="text-sm sm:text-base"><span className="font-medium">{t('symptoms')}:</span> {state.symptoms}</p>}
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('nextSteps')}</h3>
                <div className="space-y-2 text-left text-gray-600">
                  <p className="text-sm sm:text-base">• {t('dispatchReviewing')}</p>
                  <p className="text-sm sm:text-base">• {t('nearestAmbulanceAssigned')}</p>
                  <p className="text-sm sm:text-base">• {t('trackingInfoShortly')}</p>
                  <p className="text-sm sm:text-base">• {t('estimatedResponseTime')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center">
            <button
              onClick={() => updateState({ currentPage: 'tracking' })}
              className="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
            >
              {t('viewTracking')}
            </button>
            <button
              onClick={() => updateState({ currentPage: 'home' })}
              className="border border-gray-300 text-gray-700 px-4 sm:px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
            >
              {t('returnHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.currentPage === 'scheduledConfirmation') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center">
          <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-blue-500 mx-auto mb-4 sm:mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{t('ambulanceScheduledSuccessfully')}</h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 px-4">
            {t('scheduledTransportConfirmed')}
          </p>
          
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('bookingDetails')}</h3>
                <div className="space-y-2 text-left">
                  <p className="text-sm sm:text-base"><span className="font-medium">{t('patient')}:</span> {state.patientName}</p>
                  <p className="text-sm sm:text-base"><span className="font-medium">{t('date')}:</span> {new Date(state.scheduledDate).toLocaleDateString()}</p>
                  <p className="text-sm sm:text-base"><span className="font-medium">{t('time')}:</span> {state.scheduledTime}</p>
                  <p className="text-sm sm:text-base"><span className="font-medium">{t('pickup')}:</span> {state.pickupLocation}</p>
                  {state.destinationLocation && <p className="text-sm sm:text-base"><span className="font-medium">{t('destination')}:</span> {state.destinationLocation}</p>}
                  {state.calculatedPrice && (
                    <p className="text-sm sm:text-base">
                      <span className="font-medium">Total Cost:</span> 
                      <span className="text-green-600 font-bold"> ৳{state.calculatedPrice}</span>
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('importantInformation')}</h3>
                <div className="space-y-2 text-left text-gray-600">
                  <p className="text-sm sm:text-base">• {t('confirmationEmailSent')}</p>
                  <p className="text-sm sm:text-base">• {t('ambulanceArrivesEarly')}</p>
                  <p className="text-sm sm:text-base">• {t('modifyBookingUpTo')}</p>
                  <p className="text-sm sm:text-base">• {t('emergencyContactNotified')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center">
            <button
              onClick={() => updateState({ currentPage: 'history' })}
              className="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
            >
              {t('viewInHistory')}
            </button>
            <button
              onClick={() => updateState({ currentPage: 'home' })}
              className="border border-gray-300 text-gray-700 px-4 sm:px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
            >
              {t('returnHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Offline Indicator */}
      {isOffline && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
            <p className="text-yellow-800 text-sm font-medium">
              📱 You're offline. Emergency requests will be saved and sent when connection is restored.
            </p>
          </div>
        </div>
      )}

      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          {t('bookAmbulance')}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-4">{t('emergencyOrScheduled')}</p>
      </div>

      {/* Booking Type Selection */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto">
          <button
            onClick={() => {
              setBookingType('emergency');
              setCalculatedPrice(null); // Clear price for emergency
              analytics.track('booking_type_selected', { type: 'emergency' });
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              bookingType === 'emergency'
                ? 'bg-red-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Phone className="inline h-4 w-4 mr-2" />
            {t('emergencyBooking')}
          </button>
          <button
            onClick={() => {
              setBookingType('scheduled');
              // Recalculate price if both locations are set
              if (formData.pickupLocation && formData.destinationLocation) {
                calculatePrice(formData);
              }
              analytics.track('booking_type_selected', { type: 'scheduled' });
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              bookingType === 'scheduled'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="inline h-4 w-4 mr-2" />
            {t('scheduledBooking')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
            {bookingType === 'emergency' ? t('emergencyRequestForm') : t('scheduleAmbulanceTransport')}
          </h2>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-2" />
                {t('patientName')} *
              </label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                placeholder={t('enterPatientName')}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-2" />
                {t('pickupLocation')} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  placeholder={t('enterPickupAddress')}
                  required
                />
                <button
                  type="button"
                  onClick={handleAutoLocation}
                  disabled={isGettingLocation}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t('useCurrentLocation')}
                >
                  {isGettingLocation ? (
                    <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Scheduled Booking Fields */}
            {bookingType === 'scheduled' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-2" />
                    Destination Location *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="destinationLocation"
                      value={formData.destinationLocation}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      placeholder="Enter destination address or location"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleAutoDestination}
                      disabled={isGettingDestination}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Suggest popular destinations"
                    >
                      {isGettingDestination ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Hospital, clinic, home address, or any specific location
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-2" />
                      {t('date')} *
                    </label>
                    <input
                      type="date"
                      name="scheduledDate"
                      value={formData.scheduledDate}
                      onChange={handleInputChange}
                      min={getMinDate()}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline h-4 w-4 mr-2" />
                      {t('time')} *
                    </label>
                    <input
                      type="time"
                      name="scheduledTime"
                      value={formData.scheduledTime}
                      onChange={handleInputChange}
                      min={getMinTime()}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('appointmentType')}
                  </label>
                  <select
                    name="appointmentType"
                    value={formData.appointmentType}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  >
                    <option value="">{t('selectAppointmentType')}</option>
                    <option value="routine-checkup">{t('routineCheckup')}</option>
                    <option value="specialist-consultation">{t('specialistConsultation')}</option>
                    <option value="diagnostic-test">{t('diagnosticTest')}</option>
                    <option value="surgery">{t('surgery')}</option>
                    <option value="therapy">{t('therapySession')}</option>
                    <option value="discharge">{t('hospitalDischarge')}</option>
                    <option value="inter-hospital-transfer">{t('interHospitalTransfer')}</option>
                    <option value="home-transport">Home Transport</option>
                    <option value="elderly-care">Elderly Care Transport</option>
                    <option value="dialysis">Dialysis Transport</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('contactNumber')} *
                    </label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      placeholder="+880 1XXX-XXXXXX"
                      required={bookingType === 'scheduled'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('emergencyContact')}
                    </label>
                    <input
                      type="tel"
                      name="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      placeholder="+880 1XXX-XXXXXX"
                    />
                  </div>
                </div>

                {/* Special Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('specialRequirements')}
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="wheelchairAccess"
                        checked={formData.wheelchairAccess}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{t('wheelchairAccess')}</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="oxygenRequired"
                        checked={formData.oxygenRequired}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{t('oxygenRequired')}</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="stretcherRequired"
                        checked={formData.stretcherRequired}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{t('stretcherRequired')}</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {bookingType === 'emergency' ? `${t('symptoms')} (${t('optional')})` : t('medicalNotes')}
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                placeholder={
                  bookingType === 'emergency' 
                    ? t('describeEmergency')
                    : t('anySpecialNotes')
                }
              />
            </div>

            {bookingType === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('additionalRequirements')}
                </label>
                <textarea
                  name="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                  placeholder={t('anyOtherRequirements')}
                />
              </div>
            )}

            {/* Price Display for Scheduled Bookings */}
            {bookingType === 'scheduled' && calculatedPrice && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-green-600 mr-2">💰</span>
                  Estimated Cost
                </h3>
                
                <div className="space-y-2 mb-4">
                  {calculatedPrice.breakdown.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.split(':')[0]}:</span>
                      <span className="font-semibold text-gray-900">{item.split(':')[1]}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Cost:</span>
                    <span className="text-2xl font-bold text-green-600">৳{calculatedPrice.total}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Distance: {calculatedPrice.distance.toFixed(1)} km • Payment at pickup
                  </p>
                </div>
              </div>
            )}

            <button 
              onClick={handleRequestAmbulance}
              disabled={
                isSubmitting ||
                !formData.patientName || 
                !formData.pickupLocation || 
                (bookingType === 'scheduled' && (!formData.destinationLocation || !formData.scheduledDate || !formData.scheduledTime || !formData.contactNumber))
              }
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-base sm:text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed ${
                bookingType === 'emergency'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {bookingType === 'emergency' ? 'Submitting Emergency Request...' : 'Scheduling...'}
                </div>
              ) : (
                <>
                  {bookingType === 'emergency' ? t('requestAmbulance') : t('scheduleAmbulance')}
                  {bookingType === 'scheduled' && calculatedPrice && (
                    <span className="ml-2 text-sm opacity-90">
                      (৳{calculatedPrice.total})
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {bookingType === 'emergency' ? (
            <>
              <div className="bg-red-50 p-4 sm:p-6 rounded-xl border border-red-200">
                <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-3 sm:mb-4">
                  <Clock className="inline h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {t('emergencyResponseTime')}
                </h3>
                <p className="text-red-700 mb-3 sm:mb-4 text-sm sm:text-base">
                  {t('aiDispatchSystem')}
                </p>
                <div className="bg-white p-3 sm:p-4 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">{t('averageArrivalTime')}:</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">8-12 {t('minutes')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('basedOnCurrentTraffic')}</p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('whatToExpect')}</h3>
                <ul className="space-y-2 sm:space-y-3 text-gray-600">
                  <li className="flex items-start text-sm sm:text-base">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1 flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    {t('immediateConfirmation')}
                  </li>
                  <li className="flex items-start text-sm sm:text-base">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1 flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    {t('realTimeTracking')}
                  </li>
                  <li className="flex items-start text-sm sm:text-base">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1 flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    {t('qualifiedParamedics')}
                  </li>
                  <li className="flex items-start text-sm sm:text-base">
                    <div className="bg-green-100 rounded-full p-1 mr-3 mt-1 flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    {t('directTransport')}
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-50 p-4 sm:p-6 rounded-xl border border-blue-200">
                <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-3 sm:mb-4">
                  <Calendar className="inline h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {t('scheduledTransportBenefits')}
                </h3>
                <ul className="space-y-2 text-blue-700 text-sm sm:text-base">
                  <li>• {t('guaranteedAvailability')}</li>
                  <li>• {t('professionalMedicalTransport')}</li>
                  <li>• {t('specializedEquipment')}</li>
                  <li>• {t('comfortableSafeTransport')}</li>
                  <li>• {t('directBillingAvailable')}</li>
                  <li>• Flexible destination options</li>
                </ul>
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">{t('schedulingGuidelines')}</h3>
                <ul className="space-y-2 sm:space-y-3 text-gray-600">
                  <li className="flex items-start text-sm sm:text-base">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1 flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    {t('book24HoursAdvance')}
                  </li>
                  <li className="flex items-start text-sm sm:text-base">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1 flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    {t('modificationsAllowed')}
                  </li>
                  <li className="flex items-start text-sm sm:text-base">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1 flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    {t('confirmationCall')}
                  </li>
                  <li className="flex items-start text-sm sm:text-base">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1 flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    {t('cancellationAllowed')}
                  </li>
                  <li className="flex items-start text-sm sm:text-base">
                    <div className="bg-blue-100 rounded-full p-1 mr-3 mt-1 flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    Transport to any location within city limits
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 sm:p-6 rounded-xl border border-green-200">
                <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2 sm:mb-3">{t('pricingInformation')}</h3>
                <div className="text-green-700 text-sm sm:text-base">
                  <p className="mb-2">{t('baseRate')}: ৳2,500 {t('forFirst10km')}</p>
                  <p className="mb-2">{t('additional')}: ৳150 {t('perKm')}</p>
                  <p className="mb-2">Destination flexibility: No extra charge</p>
                  <p className="mb-2">Peak hours surcharge: 15% (7-10 AM, 5-8 PM)</p>
                  <p className="text-xs text-green-600">*{t('paymentOptionsAvailable')}</p>
                </div>
              </div>
            </>
          )}

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">{t('needHelpDeciding')}</h3>
            <p className="text-blue-100 mb-3 sm:mb-4 text-sm sm:text-base">
              {t('notSureNeedAmbulance')}
            </p>
            <button 
              onClick={() => {
                analytics.track('ai_assessment_clicked_from_booking');
                updateState({ currentPage: 'assessment' });
              }}
              className="bg-white text-blue-600 px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base"
            >
              {t('startAiAssessment')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAmbulanceScreen;