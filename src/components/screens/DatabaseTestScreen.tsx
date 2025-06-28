import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, XCircle, RefreshCw, Building2, Truck, User, FileText } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface DatabaseTestScreenProps {
  updateState: (updates: any) => void;
}

const DatabaseTestScreen: React.FC<DatabaseTestScreenProps> = ({ updateState }) => {
  const [testResults, setTestResults] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');

  const runDatabaseTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    const results: any = {};

    try {
      // Test 1: Hospitals Table
      console.log('Testing hospitals table...');
      const { data: hospitals, error: hospitalsError } = await supabase
        .from('hospitals')
        .select('*')
        .limit(5);
      
      results.hospitals = {
        success: !hospitalsError,
        data: hospitals,
        error: hospitalsError?.message,
        count: hospitals?.length || 0
      };

      // Test 2: Ambulances Table
      console.log('Testing ambulances table...');
      const { data: ambulances, error: ambulancesError } = await supabase
        .from('ambulances')
        .select('*')
        .limit(5);
      
      results.ambulances = {
        success: !ambulancesError,
        data: ambulances,
        error: ambulancesError?.message,
        count: ambulances?.length || 0
      };

      // Test 3: Emergency Requests Table
      console.log('Testing emergency_requests table...');
      const { data: requests, error: requestsError } = await supabase
        .from('emergency_requests')
        .select('*')
        .limit(5);
      
      results.emergency_requests = {
        success: !requestsError,
        data: requests,
        error: requestsError?.message,
        count: requests?.length || 0
      };

      // Test 4: AI Assessments Table
      console.log('Testing ai_assessments table...');
      const { data: assessments, error: assessmentsError } = await supabase
        .from('ai_assessments')
        .select('*')
        .limit(5);
      
      results.ai_assessments = {
        success: !assessmentsError,
        data: assessments,
        error: assessmentsError?.message,
        count: assessments?.length || 0
      };

      // Test 5: Storage Buckets
      console.log('Testing storage buckets...');
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      results.storage = {
        success: !bucketsError,
        data: buckets,
        error: bucketsError?.message,
        count: buckets?.length || 0
      };

      setTestResults(results);
      
      // Check overall status
      const allTestsPassed = Object.values(results).every((test: any) => test.success);
      setOverallStatus(allTestsPassed ? 'success' : 'error');

      console.log('✅ All database tests completed!', results);

    } catch (error) {
      console.error('Database tests failed:', error);
      setOverallStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDatabaseTests();
  }, []);

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Database className="h-16 w-16 mx-auto mb-4 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Connection Test</h1>
        <p className="text-gray-600">Testing all database tables and connections</p>
      </div>

      {/* Overall Status */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md border">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-semibold text-lg">Overall Status:</span>
          </div>
          <div className="flex items-center">
            {overallStatus === 'idle' && (
              <div className="flex items-center text-gray-600">
                <span>Ready to test</span>
              </div>
            )}
            {overallStatus === 'running' && (
              <div className="flex items-center text-yellow-600">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Running tests...
              </div>
            )}
            {overallStatus === 'success' && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                All tests passed!
              </div>
            )}
            {overallStatus === 'error' && (
              <div className="flex items-center text-red-600">
                <XCircle className="h-5 w-5 mr-2" />
                Some tests failed
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={runDatabaseTests}
          disabled={isRunning}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running Tests...' : 'Run Tests Again'}
        </button>
      </div>

      {/* Test Results */}
      <div className="space-y-6">
        {/* Hospitals Test */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Building2 className="h-6 w-6 mr-3 text-blue-600" />
              <h3 className="text-lg font-semibold">Hospitals Table</h3>
            </div>
            {testResults.hospitals && getStatusIcon(testResults.hospitals.success)}
          </div>
          
          {testResults.hospitals && (
            <div className={getStatusColor(testResults.hospitals.success)}>
              {testResults.hospitals.success ? (
                <div>
                  <p>✅ Connected successfully</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Found {testResults.hospitals.count} hospitals
                  </p>
                  {testResults.hospitals.data && testResults.hospitals.data.length > 0 && (
                    <div className="mt-2 text-sm">
                      <strong>Sample data:</strong>
                      <ul className="mt-1 ml-4">
                        {testResults.hospitals.data.slice(0, 3).map((hospital: any, index: number) => (
                          <li key={index}>• {hospital.name} ({hospital.available_beds} beds available)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p>❌ Connection failed</p>
                  <p className="text-sm mt-1">{testResults.hospitals.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ambulances Test */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Truck className="h-6 w-6 mr-3 text-green-600" />
              <h3 className="text-lg font-semibold">Ambulances Table</h3>
            </div>
            {testResults.ambulances && getStatusIcon(testResults.ambulances.success)}
          </div>
          
          {testResults.ambulances && (
            <div className={getStatusColor(testResults.ambulances.success)}>
              {testResults.ambulances.success ? (
                <div>
                  <p>✅ Connected successfully</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Found {testResults.ambulances.count} ambulances
                  </p>
                  {testResults.ambulances.data && testResults.ambulances.data.length > 0 && (
                    <div className="mt-2 text-sm">
                      <strong>Sample data:</strong>
                      <ul className="mt-1 ml-4">
                        {testResults.ambulances.data.slice(0, 3).map((ambulance: any, index: number) => (
                          <li key={index}>• {ambulance.vehicle_number} ({ambulance.status})</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p>❌ Connection failed</p>
                  <p className="text-sm mt-1">{testResults.ambulances.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Emergency Requests Test */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="h-6 w-6 mr-3 text-red-600" />
              <h3 className="text-lg font-semibold">Emergency Requests Table</h3>
            </div>
            {testResults.emergency_requests && getStatusIcon(testResults.emergency_requests.success)}
          </div>
          
          {testResults.emergency_requests && (
            <div className={getStatusColor(testResults.emergency_requests.success)}>
              {testResults.emergency_requests.success ? (
                <div>
                  <p>✅ Connected successfully</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Found {testResults.emergency_requests.count} emergency requests
                  </p>
                </div>
              ) : (
                <div>
                  <p>❌ Connection failed</p>
                  <p className="text-sm mt-1">{testResults.emergency_requests.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Assessments Test */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <User className="h-6 w-6 mr-3 text-purple-600" />
              <h3 className="text-lg font-semibold">AI Assessments Table</h3>
            </div>
            {testResults.ai_assessments && getStatusIcon(testResults.ai_assessments.success)}
          </div>
          
          {testResults.ai_assessments && (
            <div className={getStatusColor(testResults.ai_assessments.success)}>
              {testResults.ai_assessments.success ? (
                <div>
                  <p>✅ Connected successfully</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Found {testResults.ai_assessments.count} AI assessments
                  </p>
                </div>
              ) : (
                <div>
                  <p>❌ Connection failed</p>
                  <p className="text-sm mt-1">{testResults.ai_assessments.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Storage Test */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Database className="h-6 w-6 mr-3 text-orange-600" />
              <h3 className="text-lg font-semibold">Storage Buckets</h3>
            </div>
            {testResults.storage && getStatusIcon(testResults.storage.success)}
          </div>
          
          {testResults.storage && (
            <div className={getStatusColor(testResults.storage.success)}>
              {testResults.storage.success ? (
                <div>
                  <p>✅ Connected successfully</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Found {testResults.storage.count} storage buckets
                  </p>
                  {testResults.storage.data && testResults.storage.data.length > 0 && (
                    <div className="mt-2 text-sm">
                      <strong>Buckets:</strong>
                      <ul className="mt-1 ml-4">
                        {testResults.storage.data.map((bucket: any, index: number) => (
                          <li key={index}>• {bucket.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p>❌ Connection failed</p>
                  <p className="text-sm mt-1">{testResults.storage.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Back to Dashboard */}
      <div className="mt-8 text-center">
        <button
          onClick={() => updateState({ currentPage: 'home' })}
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default DatabaseTestScreen; 