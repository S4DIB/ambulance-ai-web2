import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Clock, Star, Search, Brain, Shield, Bed, Zap, CheckCircle, AlertCircle, Users, Heart, Activity } from 'lucide-react';

interface HospitalsScreenProps {
  updateState: (updates: any) => void;
}

const HospitalsScreen: React.FC<HospitalsScreenProps> = ({ updateState }) => {
  const state = (window as any).state;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('');
  const [isAIMatching, setIsAIMatching] = useState(false);
  const [smartMatches, setSmartMatches] = useState<any[]>([]);
  const [bedAvailability, setBedAvailability] = useState<{[key: number]: any}>({});
  const [showSymptomPrompt, setShowSymptomPrompt] = useState(false);
  const [symptomInput, setSymptomInput] = useState('');

  const bangladeshHospitals = [
    {
      id: 1,
      name: "Dhaka Medical College Hospital",
      address: "Ramna, Dhaka-1000, Bangladesh",
      phone: "+880-2-8626812",
      distance: 2.3,
      rating: 4.6,
      specialties: ["Emergency", "Trauma", "Cardiology", "Neurology", "Surgery"],
      status: "Available",
      waitTime: "15 min",
      description: "Premier government medical college hospital with comprehensive emergency services",
      insuranceAccepted: ["Government", "BUPA", "MetLife", "Pragati", "Green Delta"],
      totalBeds: 2000,
      availableBeds: 45,
      icuBeds: 8,
      emergencyBeds: 12,
      costLevel: "Low",
      qualityScore: 85,
      equipmentLevel: "Advanced",
      traumaCenter: true,
      cardiacCenter: false
    },
    {
      id: 2,
      name: "Square Hospital Limited",
      address: "18/F, Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka-1205",
      phone: "+880-2-8159457",
      distance: 3.8,
      rating: 4.8,
      specialties: ["Cardiology", "Oncology", "Orthopedics", "ICU", "Emergency"],
      status: "Available",
      waitTime: "20 min",
      description: "Leading private hospital with state-of-the-art medical facilities",
      insuranceAccepted: ["BUPA", "MetLife", "Pragati", "Green Delta", "Eastland", "Prime Islami"],
      totalBeds: 650,
      availableBeds: 23,
      icuBeds: 5,
      emergencyBeds: 8,
      costLevel: "High",
      qualityScore: 95,
      equipmentLevel: "Premium",
      traumaCenter: false,
      cardiacCenter: true
    },
    {
      id: 3,
      name: "Bangabandhu Sheikh Mujib Medical University",
      address: "Shahbag, Dhaka-1000, Bangladesh",
      phone: "+880-2-9661064",
      distance: 4.1,
      rating: 4.5,
      specialties: ["Emergency", "Surgery", "Pediatrics", "Gynecology", "Neurology"],
      status: "Limited",
      waitTime: "35 min",
      description: "Specialized medical university hospital with advanced treatment facilities",
      insuranceAccepted: ["Government", "BUPA", "MetLife", "Pragati"],
      totalBeds: 1200,
      availableBeds: 8,
      icuBeds: 2,
      emergencyBeds: 3,
      costLevel: "Medium",
      qualityScore: 88,
      equipmentLevel: "Advanced",
      traumaCenter: true,
      cardiacCenter: false
    },
    {
      id: 4,
      name: "United Hospital Limited",
      address: "Plot 15, Road 71, Gulshan-2, Dhaka-1212",
      phone: "+880-2-8836000",
      distance: 5.2,
      rating: 4.7,
      specialties: ["Cardiology", "Neurology", "Emergency", "ICU", "Oncology"],
      status: "Available",
      waitTime: "25 min",
      description: "Premium healthcare facility with international standard medical services",
      insuranceAccepted: ["BUPA", "MetLife", "Pragati", "Green Delta", "Eastland", "Prime Islami", "Reliance"],
      totalBeds: 500,
      availableBeds: 18,
      icuBeds: 6,
      emergencyBeds: 7,
      costLevel: "High",
      qualityScore: 92,
      equipmentLevel: "Premium",
      traumaCenter: false,
      cardiacCenter: true
    },
    {
      id: 5,
      name: "Apollo Hospitals Dhaka",
      address: "Plot 81, Block E, Bashundhara R/A, Dhaka-1229",
      phone: "+880-2-8401661",
      distance: 6.7,
      rating: 4.9,
      specialties: ["Cardiology", "Oncology", "Transplant", "Emergency", "Neurology"],
      status: "Available",
      waitTime: "18 min",
      description: "International chain hospital offering world-class healthcare services",
      insuranceAccepted: ["BUPA", "MetLife", "Pragati", "Green Delta", "Eastland", "Prime Islami", "Reliance", "Sadharan"],
      totalBeds: 670,
      availableBeds: 31,
      icuBeds: 9,
      emergencyBeds: 11,
      costLevel: "Premium",
      qualityScore: 98,
      equipmentLevel: "World-Class",
      traumaCenter: true,
      cardiacCenter: true
    },
    {
      id: 6,
      name: "Ibn Sina Hospital",
      address: "House 48, Road 9/A, Dhanmondi, Dhaka-1209",
      phone: "+880-2-8616646",
      distance: 3.2,
      rating: 4.4,
      specialties: ["General Medicine", "Surgery", "Pediatrics", "Emergency"],
      status: "Available",
      waitTime: "22 min",
      description: "Well-established hospital with comprehensive medical services",
      insuranceAccepted: ["BUPA", "MetLife", "Pragati", "Green Delta"],
      totalBeds: 300,
      availableBeds: 15,
      icuBeds: 3,
      emergencyBeds: 5,
      costLevel: "Medium",
      qualityScore: 82,
      equipmentLevel: "Standard",
      traumaCenter: false,
      cardiacCenter: false
    }
  ];

  // AI Hospital Matching Algorithm
  const performAIMatching = () => {
    setIsAIMatching(true);
    
    setTimeout(() => {
      const userSymptoms = state.symptoms || '';
      const userTriageLevel = state.triageLevel || 3;
      const userUrgencyScore = state.urgencyScore || 50;
      const userInsurance = state.userInsurance || 'BUPA'; // Default insurance
      
      const scoredHospitals = bangladeshHospitals.map(hospital => {
        let matchScore = 0;
        let reasons = [];
        
        // Symptom-based specialty matching
        if (userSymptoms.toLowerCase().includes('chest') || userSymptoms.toLowerCase().includes('heart')) {
          if (hospital.cardiacCenter) {
            matchScore += 30;
            reasons.push('Cardiac Center Available');
          }
          if (hospital.specialties.includes('Cardiology')) {
            matchScore += 20;
            reasons.push('Cardiology Specialist');
          }
        }
        
        if (userSymptoms.toLowerCase().includes('trauma') || userSymptoms.toLowerCase().includes('accident')) {
          if (hospital.traumaCenter) {
            matchScore += 30;
            reasons.push('Trauma Center');
          }
          if (hospital.specialties.includes('Emergency')) {
            matchScore += 15;
            reasons.push('Emergency Specialist');
          }
        }
        
        if (userSymptoms.toLowerCase().includes('brain') || userSymptoms.toLowerCase().includes('head')) {
          if (hospital.specialties.includes('Neurology')) {
            matchScore += 25;
            reasons.push('Neurology Department');
          }
        }
        
        // Triage level matching
        if (userTriageLevel <= 2) {
          // Critical cases need trauma centers or high-quality facilities
          if (hospital.traumaCenter) matchScore += 25;
          if (hospital.qualityScore >= 90) matchScore += 20;
          if (hospital.icuBeds > 5) matchScore += 15;
          reasons.push('High-Priority Care Available');
        } else if (userTriageLevel >= 4) {
          // Lower priority can go to general hospitals
          if (hospital.costLevel === 'Low' || hospital.costLevel === 'Medium') {
            matchScore += 15;
            reasons.push('Cost-Effective Option');
          }
        }
        
        // Insurance matching
        if (hospital.insuranceAccepted.includes(userInsurance)) {
          matchScore += 20;
          reasons.push('Insurance Accepted');
        }
        
        // Bed availability scoring
        const bedAvailabilityRatio = hospital.availableBeds / hospital.totalBeds;
        if (bedAvailabilityRatio > 0.05) {
          matchScore += 15;
          reasons.push('Good Bed Availability');
        } else if (bedAvailabilityRatio > 0.02) {
          matchScore += 8;
          reasons.push('Limited Bed Availability');
        }
        
        // Emergency bed availability for urgent cases
        if (userUrgencyScore >= 70 && hospital.emergencyBeds > 5) {
          matchScore += 20;
          reasons.push('Emergency Beds Available');
        }
        
        // Distance factor (closer is better)
        if (hospital.distance <= 3) {
          matchScore += 15;
          reasons.push('Close Proximity');
        } else if (hospital.distance <= 5) {
          matchScore += 10;
          reasons.push('Reasonable Distance');
        }
        
        // Quality and equipment scoring
        matchScore += hospital.qualityScore * 0.2;
        if (hospital.equipmentLevel === 'World-Class') {
          matchScore += 15;
          reasons.push('World-Class Equipment');
        } else if (hospital.equipmentLevel === 'Premium') {
          matchScore += 10;
          reasons.push('Premium Equipment');
        } else if (hospital.equipmentLevel === 'Advanced') {
          matchScore += 5;
          reasons.push('Advanced Equipment');
        }
        
        // Wait time factor
        const waitTimeMinutes = parseInt(hospital.waitTime);
        if (waitTimeMinutes <= 20) {
          matchScore += 10;
          reasons.push('Short Wait Time');
        }
        
        return {
          ...hospital,
          aiMatchScore: Math.round(matchScore),
          matchReasons: reasons,
          recommendationLevel: matchScore >= 80 ? 'Highly Recommended' : 
                              matchScore >= 60 ? 'Recommended' : 
                              matchScore >= 40 ? 'Suitable' : 'Available'
        };
      });
      
      // Sort by AI match score
      const sortedMatches = scoredHospitals.sort((a, b) => b.aiMatchScore - a.aiMatchScore);
      setSmartMatches(sortedMatches);
      setIsAIMatching(false);
      
      // Update state with matched hospitals
      updateState({
        matchedHospitals: sortedMatches.slice(0, 3) // Top 3 matches
      });
    }, 3000); // 3 second AI processing simulation
  };

  // Simulate real-time bed availability updates
  useEffect(() => {
    const updateBedAvailability = () => {
      const newAvailability: {[key: number]: any} = {};
      
      bangladeshHospitals.forEach(hospital => {
        const variation = Math.floor(Math.random() * 6) - 3; // -3 to +3 change
        const newAvailable = Math.max(0, hospital.availableBeds + variation);
        const newICU = Math.max(0, hospital.icuBeds + Math.floor(Math.random() * 3) - 1);
        const newEmergency = Math.max(0, hospital.emergencyBeds + Math.floor(Math.random() * 3) - 1);
        
        newAvailability[hospital.id] = {
          availableBeds: newAvailable,
          icuBeds: newICU,
          emergencyBeds: newEmergency,
          lastUpdated: new Date().toLocaleTimeString()
        };
      });
      
      setBedAvailability(newAvailability);
    };
    
    // Initial update
    updateBedAvailability();
    
    // Update every 30 seconds
    const interval = setInterval(updateBedAvailability, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-trigger AI matching if user has assessment data
  useEffect(() => {
    if ((state.symptoms || state.triageLevel || state.urgencyScore) && smartMatches.length === 0) {
      performAIMatching();
    }
  }, [state.symptoms, state.triageLevel, state.urgencyScore]);

  // Filter hospitals based on search and specialty
  const hospitalsToShow = smartMatches.length > 0 ? smartMatches : bangladeshHospitals;
  const filteredHospitals = hospitalsToShow.filter(hospital => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.specialties.some((spec: string) => spec.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSpecialty = !selectedSpecialty || hospital.specialties.includes(selectedSpecialty);
    const matchesInsurance = !insuranceFilter || hospital.insuranceAccepted.includes(insuranceFilter);
    return matchesSearch && matchesSpecialty && matchesInsurance;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'text-green-600 bg-green-100';
      case 'Limited':
        return 'text-yellow-600 bg-yellow-100';
      case 'Full':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendationColor = (level: string) => {
    switch (level) {
      case 'Highly Recommended':
        return 'text-green-700 bg-green-100 border-green-300';
      case 'Recommended':
        return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'Suitable':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getBedAvailabilityColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.1) return 'text-green-600';
    if (ratio > 0.05) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleGetDirections = (hospital: any) => {
    alert(`Getting directions to ${hospital.name}...\nAddress: ${hospital.address}`);
  };

  const handleBookAmbulanceToHospital = (hospital: any) => {
    updateState({
      currentPage: 'book',
      pickupLocation: state.pickupLocation || 'Current Location',
      symptoms: state.symptoms || `Transport to ${hospital.name}`,
      selectedHospital: hospital
    });
  };

  // Modified AI Matching Trigger
  const handleAIMatchClick = () => {
    if (!state.symptoms) {
      setShowSymptomPrompt(true);
    } else {
      performAIMatching();
    }
  };

  const handleSymptomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symptomInput.trim()) {
      updateState({ symptoms: symptomInput });
      setShowSymptomPrompt(false);
      setTimeout(() => {
        performAIMatching();
      }, 100); // Ensure state is updated before matching
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          <Brain className="inline h-6 w-6 sm:h-8 sm:w-8 mr-3 text-purple-600" />
          Smart Hospital Matching
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-4">
          AI-powered hospital recommendations based on your symptoms, insurance, and real-time bed availability
        </p>
      </div>

      {/* AI Matching Status */}
      {isAIMatching && (
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl p-6 sm:p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-3 border-white border-t-transparent rounded-full mr-4"></div>
            <h2 className="text-xl sm:text-2xl font-bold">AI is Analyzing Your Needs</h2>
          </div>
          <div className="text-center space-y-2 text-purple-100">
            <p>Processing your symptoms and medical history</p>
            <p>Matching with hospital specialties and capabilities</p>
            <p>Checking insurance coverage and costs</p>
            <p>Analyzing real-time bed availability</p>
            <p>Calculating optimal distance and wait times</p>
          </div>
        </div>
      )}

      {/* Smart Matching Results */}
      {smartMatches.length > 0 && !isAIMatching && (
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mr-2" />
              <h3 className="text-lg sm:text-xl font-semibold text-green-800">
                AI Matching Complete!
              </h3>
            </div>
            <button
              onClick={performAIMatching}
              className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm"
            >
              Re-analyze
            </button>
          </div>
          <p className="text-green-700 text-sm sm:text-base">
            Found {smartMatches.length} hospitals ranked by AI compatibility with your needs. 
            Top matches are shown first based on symptoms, insurance, and bed availability.
          </p>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="mb-6 sm:mb-8 grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search hospitals by name or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
        
        <select 
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
          className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
        >
          <option value="">All Specialties</option>
          <option value="Emergency">Emergency</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Neurology">Neurology</option>
          <option value="Trauma">Trauma</option>
          <option value="ICU">ICU</option>
          <option value="Surgery">Surgery</option>
          <option value="Oncology">Oncology</option>
        </select>

        <select 
          value={insuranceFilter}
          onChange={(e) => setInsuranceFilter(e.target.value)}
          className="px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
        >
          <option value="">All Insurance</option>
          <option value="BUPA">BUPA</option>
          <option value="MetLife">MetLife</option>
          <option value="Pragati">Pragati</option>
          <option value="Green Delta">Green Delta</option>
          <option value="Government">Government</option>
          <option value="Eastland">Eastland</option>
          <option value="Prime Islami">Prime Islami</option>
        </select>
      </div>

      {/* Manual AI Matching Trigger */}
      {smartMatches.length === 0 && !isAIMatching && (
        <div className="mb-6 sm:mb-8 text-center">
          <button
            onClick={handleAIMatchClick}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Brain className="inline h-5 w-5 sm:h-6 sm:w-6 mr-2" />
            Get AI Hospital Recommendations
          </button>
          <p className="text-gray-600 text-sm mt-2">
            Let AI analyze your symptoms and find the best hospital matches
          </p>
          {showSymptomPrompt && (
            <form onSubmit={handleSymptomSubmit} className="mt-4 mx-auto max-w-md bg-white rounded-xl shadow-lg border border-purple-200 p-6 text-left">
              <h3 className="text-lg font-semibold text-purple-800 mb-2">Enter your symptoms or condition</h3>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-3"
                placeholder="e.g. chest pain, fever, accident, etc."
                value={symptomInput}
                onChange={e => setSymptomInput(e.target.value)}
                required
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowSymptomPrompt(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700"
                >
                  Continue
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Hospital Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {filteredHospitals.map((hospital: any) => {
          const currentBeds = bedAvailability[hospital.id] || {
            availableBeds: hospital.availableBeds,
            icuBeds: hospital.icuBeds,
            emergencyBeds: hospital.emergencyBeds,
            lastUpdated: 'Just now'
          };
          
          return (
            <div 
              key={hospital.id} 
              className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border-2 ${
                hospital.aiMatchScore >= 80 ? 'border-green-300 bg-green-50' :
                hospital.aiMatchScore >= 60 ? 'border-blue-300 bg-blue-50' :
                'border-gray-200'
              }`}
            >
              {/* AI Recommendation Badge */}
              {hospital.recommendationLevel && (
                <div className="mb-3 sm:mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getRecommendationColor(hospital.recommendationLevel)}`}>
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    {hospital.recommendationLevel}
                    {hospital.aiMatchScore && (
                      <span className="ml-2 bg-white/50 px-2 py-0.5 rounded-full">
                        {hospital.aiMatchScore}% match
                      </span>
                    )}
                  </span>
                </div>
              )}
              
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-3 sm:mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{hospital.name}</h3>
                  <div className="flex items-start text-gray-600 mb-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{hospital.address}</span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-2">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-xs sm:text-sm font-mono">{hospital.phone}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">{hospital.description}</p>
                </div>
                <div className="text-right lg:ml-4 mt-2 lg:mt-0">
                  <div className="flex items-center justify-end lg:justify-start mb-1 sm:mb-2">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 mr-1" />
                    <span className="font-semibold text-sm sm:text-base">{hospital.rating}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">{hospital.distance} km</div>
                  <div className="text-xs sm:text-sm text-purple-600 font-medium">{hospital.costLevel} Cost</div>
                </div>
              </div>

              {/* Real-time Bed Availability */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center">
                    <Bed className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Real-time Bed Availability
                  </h4>
                  <span className="text-xs text-gray-500">Updated: {currentBeds.lastUpdated}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                  <div>
                    <p className={`text-lg sm:text-xl font-bold ${getBedAvailabilityColor(currentBeds.availableBeds, hospital.totalBeds)}`}>
                      {currentBeds.availableBeds}
                    </p>
                    <p className="text-xs text-gray-600">General Beds</p>
                  </div>
                  <div>
                    <p className={`text-lg sm:text-xl font-bold ${getBedAvailabilityColor(currentBeds.icuBeds, 20)}`}>
                      {currentBeds.icuBeds}
                    </p>
                    <p className="text-xs text-gray-600">ICU Beds</p>
                  </div>
                  <div>
                    <p className={`text-lg sm:text-xl font-bold ${getBedAvailabilityColor(currentBeds.emergencyBeds, 15)}`}>
                      {currentBeds.emergencyBeds}
                    </p>
                    <p className="text-xs text-gray-600">Emergency</p>
                  </div>
                </div>
              </div>

              {/* Insurance Coverage */}
              <div className="mb-3 sm:mb-4">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Insurance Accepted:
                </h4>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {hospital.insuranceAccepted.slice(0, 4).map((insurance: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800"
                    >
                      {insurance}
                    </span>
                  ))}
                  {hospital.insuranceAccepted.length > 4 && (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                      +{hospital.insuranceAccepted.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Specialties */}
              <div className="mb-3 sm:mb-4">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Specialties:</h4>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {hospital.specialties.map((specialty: string, index: number) => (
                    <span
                      key={index}
                      className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full ${
                        hospital.aiMatchScore >= 80 
                          ? 'bg-green-200 text-green-800' 
                          : hospital.aiMatchScore >= 60
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Match Reasons */}
              {hospital.matchReasons && hospital.matchReasons.length > 0 && (
                <div className="mb-3 sm:mb-4 bg-purple-50 rounded-lg p-3 border border-purple-200">
                  <h4 className="text-xs sm:text-sm font-semibold text-purple-800 mb-2 flex items-center">
                    <Brain className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Why AI Recommends This Hospital:
                  </h4>
                  <div className="space-y-1">
                    {hospital.matchReasons.slice(0, 3).map((reason: string, index: number) => (
                      <div key={index} className="flex items-center text-xs text-purple-700">
                        <CheckCircle className="h-3 w-3 mr-2 text-purple-600" />
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status and Wait Time */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 mr-2" />
                  <span className="text-xs sm:text-sm text-gray-600">Wait time: {hospital.waitTime}</span>
                </div>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(hospital.status)}`}>
                  {hospital.status}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-2 sm:mb-3">
                <button 
                  onClick={() => handleCall(hospital.phone)}
                  className="flex-1 bg-green-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
                >
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Call
                </button>
                <button 
                  onClick={() => handleGetDirections(hospital)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
                >
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Directions
                </button>
              </div>
              
              {/* Book Ambulance Button */}
              {(state.urgencyScore >= 60 || state.triageLevel <= 3 || hospital.aiMatchScore >= 60) && (
                <button 
                  onClick={() => handleBookAmbulanceToHospital(hospital)}
                  className="w-full bg-red-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
                >
                  <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Book Ambulance to This Hospital
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredHospitals.length === 0 && (
        <div className="text-center py-8 sm:py-12">
          <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No hospitals found</h3>
          <p className="text-gray-600 text-sm sm:text-base">Try adjusting your search criteria or insurance filter</p>
        </div>
      )}

      {/* AI Insights Dashboard */}
      <div className="mt-8 sm:mt-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl p-6 sm:p-8 text-white">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">AI Hospital Matching Insights</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
            <h3 className="text-sm sm:text-lg font-semibold mb-1">Total Hospitals</h3>
            <p className="text-2xl sm:text-3xl font-bold">{bangladeshHospitals.length}</p>
            <p className="text-purple-100 text-xs sm:text-sm">In network</p>
          </div>
          <div className="text-center">
            <Bed className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
            <h3 className="text-sm sm:text-lg font-semibold mb-1">Available Beds</h3>
            <p className="text-2xl sm:text-3xl font-bold">
              {Object.values(bedAvailability).reduce((sum: number, bed: any) => sum + bed.availableBeds, 0) || 140}
            </p>
            <p className="text-purple-100 text-xs sm:text-sm">Real-time count</p>
          </div>
          <div className="text-center">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
            <h3 className="text-sm sm:text-lg font-semibold mb-1">Insurance Plans</h3>
            <p className="text-2xl sm:text-3xl font-bold">8</p>
            <p className="text-purple-100 text-xs sm:text-sm">Accepted</p>
          </div>
          <div className="text-center">
            <Heart className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2" />
            <h3 className="text-sm sm:text-lg font-semibold mb-1">Avg Rating</h3>
            <p className="text-2xl sm:text-3xl font-bold">4.7</p>
            <p className="text-purple-100 text-xs sm:text-sm">Patient satisfaction</p>
          </div>
        </div>
      </div>

      {/* Emergency CTA */}
      <div className="mt-6 sm:mt-8 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 sm:p-8 text-white text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Need Emergency Transport?</h2>
        <p className="text-red-100 mb-4 sm:mb-6 text-sm sm:text-base">
          AI has analyzed the best hospitals for your needs. Book an ambulance for immediate transport.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center">
          <button 
            onClick={() => updateState({ currentPage: 'book' })}
            className="bg-white text-red-600 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 text-sm sm:text-base"
          >
            Book Ambulance
          </button>
          <button 
            onClick={() => updateState({ currentPage: 'assessment' })}
            className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors duration-200 text-sm sm:text-base"
          >
            Get AI Assessment First
          </button>
        </div>
      </div>
    </div>
  );
};

export default HospitalsScreen;