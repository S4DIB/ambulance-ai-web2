import React, { useState, useEffect } from 'react';
import { History, Calendar, MapPin, Clock, FileText, Download, Brain, Truck, Menu, X } from 'lucide-react';
import { EmergencyAPI, ScheduledAmbulanceAPI } from '../../utils/emergencyAPI';
import { EmergencyRequest } from '../../utils/supabaseClient';
import { ScheduledAmbulanceRequest } from '../../utils/emergencyAPI';
import { AIAssessmentAPI } from '../../utils/emergencyAPI';

interface HistoryScreenProps {
  updateState: (updates: any) => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ updateState }) => {
  const state = (window as any).state;
  const [selectedTab, setSelectedTab] = useState('requests');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [ambulanceHistory, setAmbulanceHistory] = useState<any[]>([]);
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const currentUser = state.currentUser;
        if (!currentUser || !currentUser.id) {
          setAmbulanceHistory([]);
          setLoading(false);
          return;
        }
        // Fetch emergency requests
        const emergencyRequests: EmergencyRequest[] = await EmergencyAPI.getUserEmergencyRequests(currentUser.id);
        // Fetch scheduled ambulance requests
        const scheduledRequests: ScheduledAmbulanceRequest[] = await ScheduledAmbulanceAPI.getUserScheduledRequests(currentUser.id);
        // Map and merge both types for display
        const mappedEmergencies = emergencyRequests.map(req => ({
          id: req.id,
          date: req.created_at ? req.created_at.split('T')[0] : '',
          time: req.created_at ? req.created_at.split('T')[1]?.slice(0,5) : '',
          type: 'Emergency',
          pickup: req.pickup_location,
          destination: req.destination_location,
          status: req.status,
          cost: req.cost ? `৳${req.cost}` : 'N/A',
          urgencyScore: req.urgency_score,
          triageLevel: req.triage_level,
          patientName: req.patient_name,
          symptoms: req.symptoms
        }));
        const mappedScheduled = scheduledRequests.map(req => ({
          id: req.id,
          date: req.scheduled_date,
          time: req.scheduled_time,
          type: 'Scheduled',
          pickup: req.pickup_location,
          destination: req.destination_location,
          status: req.status,
          cost: req.cost ? `৳${req.cost}` : 'N/A',
          urgencyScore: 30, // or map from your logic
          triageLevel: 3, // or map from your logic
          patientName: req.patient_name,
          symptoms: req.symptoms
        }));
        setAmbulanceHistory([...mappedEmergencies, ...mappedScheduled].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)));
      } catch (error) {
        setAmbulanceHistory([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [state.currentUser]);

  useEffect(() => {
    const fetchAssessments = async () => {
      setLoadingAssessments(true);
      try {
        const currentUser = state.currentUser;
        if (!currentUser || !currentUser.id) {
          setAssessmentHistory([]);
          setLoadingAssessments(false);
          return;
        }
        const assessments = await AIAssessmentAPI.getUserAssessments(currentUser.id);
        // Map DB fields to UI fields
        const mapped = assessments.map((a: any) => ({
          id: a.id,
          date: a.created_at ? a.created_at.split('T')[0] : '',
          time: a.created_at ? a.created_at.split('T')[1]?.slice(0,5) : '',
          symptoms: a.symptoms,
          recommendation: Array.isArray(a.recommendations) ? a.recommendations[0] : '',
          urgencyScore: a.urgency_score,
          triageLevel: a.triage_level,
        }));
        setAssessmentHistory(mapped.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)));
      } catch (error) {
        setAssessmentHistory([]);
      } finally {
        setLoadingAssessments(false);
      }
    };
    fetchAssessments();
  }, [state.currentUser]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleRepeatBooking = (booking: any) => {
    updateState({
      currentPage: 'book',
      patientName: booking.patientName || '',
      pickupLocation: booking.pickup || '',
      emergencyType: booking.type || '',
      symptoms: booking.symptoms || ''
    });
  };

  const handleNewAssessment = () => {
    updateState({ currentPage: 'assessment' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          <History className="inline h-6 w-6 sm:h-8 sm:w-8 mr-3 text-purple-600" />
          Medical History
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-4">View your past ambulance requests and AI assessments</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 sm:mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-8">
            <button
              onClick={() => setSelectedTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center justify-center sm:justify-start ${
                selectedTab === 'requests'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Truck className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">Ambulance Requests ({ambulanceHistory.length})</span>
            </button>
            <button
              onClick={() => setSelectedTab('assessments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center justify-center sm:justify-start ${
                selectedTab === 'assessments'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Brain className="h-4 w-4 mr-2" />
              <span className="text-sm sm:text-base">AI Assessments ({assessmentHistory.length})</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Content based on selected tab */}
      {selectedTab === 'requests' ? (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Ambulance Request History</h2>
          </div>

          {ambulanceHistory.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-lg">
              <Truck className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No ambulance requests yet</h3>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base px-4">Your ambulance booking history will appear here</p>
              <button
                onClick={() => updateState({ currentPage: 'book' })}
                className="bg-red-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm sm:text-base"
              >
                Book Your First Ambulance
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {ambulanceHistory.map((request: any) => (
                <div key={request.id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4">
                    <div className="flex items-center mb-3 sm:mb-0">
                      <div className="bg-purple-100 p-2 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          Booking #{request.id} - {request.type}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {request.date} at {request.time}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Journey Details</h4>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-start text-xs sm:text-sm text-gray-600">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>From: {request.pickup}</span>
                        </div>
                        {request.destination && (
                          <div className="flex items-start text-xs sm:text-sm text-gray-600">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-red-500 flex-shrink-0 mt-0.5" />
                            <span>To: {request.destination}</span>
                          </div>
                        )}
                        {request.duration && (
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-blue-500" />
                            <span>Duration: {request.duration}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Medical Details</h4>
                      <div className="space-y-1 sm:space-y-2">
                        {request.urgencyScore && (
                          <div className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">Urgency Score:</span> 
                            <span className={`ml-1 font-bold ${getUrgencyColor(request.urgencyScore)}`}>
                              {request.urgencyScore}/100
                            </span>
                          </div>
                        )}
                        {request.triageLevel && (
                          <div className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">Triage Level:</span> 
                            <span className={`ml-1 font-bold ${getUrgencyColor(request.triageLevel * 20)}`}>
                              {request.triageLevel}/5
                            </span>
                          </div>
                        )}
                        {request.patientName && (
                          <div className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">Patient:</span> {request.patientName}
                          </div>
                        )}
                        {request.crew && (
                          <div className="text-xs sm:text-sm text-gray-600">
                            <span className="font-medium">Crew:</span> {request.crew}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {request.symptoms && (
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Symptoms/Notes</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{request.symptoms}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <div className="text-base sm:text-lg font-semibold text-gray-900">
                      {request.cost}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-xs sm:text-sm">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 inline mr-2" />
                        View Details
                      </button>
                      <button 
                        onClick={() => handleRepeatBooking(request)}
                        className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-xs sm:text-sm"
                      >
                        Book Similar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">AI Assessment History</h2>
            <button className="flex items-center justify-center px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm sm:text-base">
              <Download className="h-4 w-4 mr-2" />
              Export Assessments
            </button>
          </div>

          {loadingAssessments ? (
            <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-lg">
              <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Loading AI assessments...</h3>
            </div>
          ) : assessmentHistory.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-lg">
              <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No AI assessments yet</h3>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base px-4">Your health assessment history will appear here</p>
              <button
                onClick={handleNewAssessment}
                className="bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
              >
                Start Your First Assessment
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {assessmentHistory.map((assessment: any) => (
                <div key={assessment.id} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 sm:mb-4">
                    <div className="flex items-center mb-3 sm:mb-0">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          AI Assessment #{assessment.id}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {assessment.date} at {assessment.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right self-start">
                      <div className={`text-xs sm:text-sm font-medium ${getUrgencyColor(assessment.urgencyScore || 50)}`}>
                        Score: {assessment.urgencyScore || 50}/100
                      </div>
                      <div className={`text-xs ${getUrgencyColor((assessment.triageLevel || 3) * 20)}`}>
                        Level {assessment.triageLevel || 3}/5
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Symptoms Reported</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{assessment.symptoms}</p>
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">AI Recommendation</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{assessment.recommendation}</p>
                    </div>
                  </div>

                  {assessment.followed && (
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Follow-up Action</h4>
                      <p className="text-xs sm:text-sm text-gray-600">{assessment.followed}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                    <button className="px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-xs sm:text-sm">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 inline mr-2" />
                      View Full Report
                    </button>
                    <button 
                      onClick={handleNewAssessment}
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-xs sm:text-sm"
                    >
                      New Assessment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Statistics */}
      <div className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white">
          <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">Total Requests</h3>
          <p className="text-2xl sm:text-3xl font-bold">{ambulanceHistory.length}</p>
          <p className="text-purple-100 text-xs sm:text-sm">Ambulance bookings</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
          <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">AI Assessments</h3>
          <p className="text-2xl sm:text-3xl font-bold">{assessmentHistory.length}</p>
          <p className="text-blue-100 text-xs sm:text-sm">Health evaluations</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white">
          <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">Avg Response</h3>
          <p className="text-2xl sm:text-3xl font-bold">{state.etaMinutes || 12} min</p>
          <p className="text-green-100 text-xs sm:text-sm">Average arrival time</p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 sm:p-6 text-white">
          <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">Last Urgency</h3>
          <p className="text-2xl sm:text-3xl font-bold">{state.urgencyScore || '--'}</p>
          <p className="text-orange-100 text-xs sm:text-sm">Most recent score</p>
        </div>
      </div>
    </div>
  );
};

export default HistoryScreen;