import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Clock, Users, Heart, Zap, Brain, MapPin } from 'lucide-react';
import { metricsSimulator } from '../utils/metricsData';

interface MetricsDisplayProps {
  variant?: 'dashboard' | 'compact' | 'detailed';
  showLive?: boolean;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ 
  variant = 'dashboard', 
  showLive = true 
}) => {
  const [metrics, setMetrics] = useState(metricsSimulator.getSystemMetrics());
  const [performance, setPerformance] = useState(metricsSimulator.getPerformanceMetrics());
  const [operational, setOperational] = useState(metricsSimulator.getLiveOperationalData());
  const [aiMetrics, setAiMetrics] = useState(metricsSimulator.getAIModelMetrics());

  useEffect(() => {
    if (!showLive) return;

    const interval = setInterval(() => {
      setMetrics(metricsSimulator.getSystemMetrics());
      setOperational(metricsSimulator.getLiveOperationalData());
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [showLive]);

  if (variant === 'compact') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-3 sm:p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs sm:text-sm">Response Time</p>
              <p className="text-xl sm:text-2xl font-bold">{metrics.avgResponseTime.toFixed(1)}min</p>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-green-200 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 sm:p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm">AI Accuracy</p>
              <p className="text-xl sm:text-2xl font-bold">{metrics.aiAccuracy.toFixed(1)}%</p>
            </div>
            <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-3 sm:p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs sm:text-sm">Active Units</p>
              <p className="text-xl sm:text-2xl font-bold">{metrics.activeAmbulances}</p>
            </div>
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-purple-200 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-3 sm:p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-xs sm:text-sm">Lives Saved</p>
              <p className="text-xl sm:text-2xl font-bold">{metrics.liveSaves}</p>
            </div>
            <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-6">
        {/* AI Performance Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600 animate-pulse" />
            AI Model Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Triage Classifier</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-semibold">{aiMetrics.models.triageClassifier.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span>F1 Score:</span>
                  <span className="font-semibold">{aiMetrics.models.triageClassifier.f1Score}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Inference:</span>
                  <span className="font-semibold">{aiMetrics.models.triageClassifier.inferenceTime}s</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Hospital Matcher</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-semibold">{aiMetrics.models.hospitalMatcher.accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Precision:</span>
                  <span className="font-semibold">{aiMetrics.models.hospitalMatcher.precision}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Inference:</span>
                  <span className="font-semibold">{aiMetrics.models.hospitalMatcher.inferenceTime}s</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Route Optimizer</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Time Saved:</span>
                  <span className="font-semibold">{aiMetrics.models.routeOptimizer.avgTimeSaved}min</span>
                </div>
                <div className="flex justify-between">
                  <span>Fuel Efficiency:</span>
                  <span className="font-semibold">{aiMetrics.models.routeOptimizer.fuelEfficiency}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Inference:</span>
                  <span className="font-semibold">{aiMetrics.models.routeOptimizer.inferenceTime}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-600 animate-pulse" />
            Live Operational Data
            {showLive && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{operational.activeEmergencies}</p>
              <p className="text-sm text-gray-600">Active Emergencies</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{operational.ambulancesInTransit}</p>
              <p className="text-sm text-gray-600">Units in Transit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{operational.currentTrafficLoad}%</p>
              <p className="text-sm text-gray-600">Traffic Load</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{operational.networkLatency}ms</p>
              <p className="text-sm text-gray-600">Network Latency</p>
            </div>
          </div>
        </div>

        {/* Performance Trends */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600 animate-pulse" />
            Performance Trends
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">AI Assessment Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Processing Time:</span>
                  <span className="font-semibold">{performance.aiAssessment.avgProcessingTime.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Accuracy Rate:</span>
                  <span className="font-semibold text-green-600">{performance.aiAssessment.accuracy.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Assessments:</span>
                  <span className="font-semibold">{performance.aiAssessment.totalAssessments.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Hospital Matching</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Match Time:</span>
                  <span className="font-semibold">{performance.hospitalMatching.avgMatchTime.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Match Accuracy:</span>
                  <span className="font-semibold text-green-600">{performance.hospitalMatching.matchAccuracy.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Patient Satisfaction:</span>
                  <span className="font-semibold">{performance.hospitalMatching.patientSatisfaction.toFixed(1)}/5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default dashboard variant
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-lg font-semibold">Response Time</h3>
          <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200 animate-pulse" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold">{metrics.avgResponseTime.toFixed(1)} min</p>
        <p className="text-blue-100 text-xs sm:text-sm">Average citywide</p>
        {showLive && <div className="mt-2 flex items-center">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
          <span className="text-xs">Live</span>
        </div>}
      </div>

      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-lg font-semibold">Success Rate</h3>
          <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-200 animate-pulse" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold">{metrics.successRate.toFixed(1)}%</p>
        <p className="text-green-100 text-xs sm:text-sm">Emergency outcomes</p>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-lg font-semibold">AI Accuracy</h3>
          <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-purple-200 animate-pulse" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold">{metrics.aiAccuracy.toFixed(1)}%</p>
        <p className="text-purple-100 text-xs sm:text-sm">Diagnosis precision</p>
      </div>

      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-lg font-semibold">Lives Saved</h3>
          <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-200 animate-pulse" />
        </div>
        <p className="text-2xl sm:text-3xl font-bold">{metrics.liveSaves}</p>
        <p className="text-red-100 text-xs sm:text-sm">Today</p>
      </div>
    </div>
  );
};

export default MetricsDisplay;