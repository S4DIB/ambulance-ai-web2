import React, { useState } from 'react';
import { Brain, MessageCircle, CheckCircle, AlertTriangle, ArrowRight, Mic, MicOff, Volume2, Camera, Upload, X, Eye } from 'lucide-react';
import { analytics } from '../../utils/analytics';
import { ImageOptimizer } from '../../utils/performanceOptimizer';

interface AIAssessmentScreenProps {
  updateState: (updates: any) => void;
}

const AIAssessmentScreen: React.FC<AIAssessmentScreenProps> = ({ updateState }) => {
  const state = (window as any).state;
  const [symptoms, setSymptoms] = useState(state.symptoms || '');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<Array<{file: File, preview: string, analysis?: string}>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize speech recognition
  React.useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
        analytics.track('voice_input_started');
      };
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setSymptoms(prev => prev + (prev ? ' ' : '') + finalTranscript);
          analytics.track('voice_input_transcribed', { 
            length: finalTranscript.length 
          });
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        analytics.track('voice_input_error', { error: event.error });
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        analytics.track('voice_input_ended');
      };
      
      setRecognition(recognitionInstance);
      setIsVoiceSupported(true);
    }
  }, []);

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
      analytics.track('text_to_speech_used', { textLength: text.length });
    }
  };

  // Photo Analysis Functions
  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    
    analytics.track('photos_selected', { count: files.length });
    const newImages: Array<{file: File, preview: string}> = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          // Optimize image before processing
          const optimizedFile = await ImageOptimizer.compressImage(file);
          const preview = await ImageOptimizer.generateThumbnail(optimizedFile);
          
          newImages.push({
            file: optimizedFile,
            preview
          });
        } catch (error) {
          console.error('Image optimization failed:', error);
          analytics.track('image_optimization_error', { error: error.message });
          
          // Fallback to original file
          const reader = new FileReader();
          reader.onload = (e) => {
            newImages.push({
              file,
              preview: e.target?.result as string
            });
          };
          reader.readAsDataURL(file);
        }
      }
    }
    
    setUploadedImages(prev => [...prev, ...newImages]);
    analyzeImages(newImages);
  };

  const analyzeImages = async (images: Array<{file: File, preview: string}>) => {
    setIsAnalyzing(true);
    analytics.track('image_analysis_started', { imageCount: images.length });
    
    // Simulate AI analysis with realistic medical assessments
    const medicalAnalyses = [
      "Visible inflammation and redness consistent with acute dermatitis. Recommend topical treatment and monitoring.",
      "Laceration appears superficial but may require cleaning and bandaging. Consider tetanus shot if not current.",
      "Swelling and discoloration suggest possible contusion. Apply ice and elevate if possible.",
      "Skin lesion shows irregular borders. Recommend dermatological evaluation for proper diagnosis.",
      "Burn appears to be first-degree. Cool water treatment and aloe vera may provide relief.",
      "Bruising pattern suggests impact injury. Monitor for increased pain or swelling.",
      "Rash distribution indicates possible allergic reaction. Antihistamines may help.",
      "Wound edges appear clean but deep. Professional medical cleaning and possible sutures needed."
    ];
    
    setTimeout(() => {
      const analyzedImages = images.map(img => ({
        ...img,
        analysis: medicalAnalyses[Math.floor(Math.random() * medicalAnalyses.length)]
      }));
      
      setUploadedImages(prev => {
        const updated = [...prev];
        analyzedImages.forEach(analyzed => {
          const index = updated.findIndex(img => img.file.name === analyzed.file.name);
          if (index !== -1) {
            updated[index] = analyzed;
          }
        });
        return updated;
      });
      
      // Add analysis to symptoms
      const analysisText = analyzedImages.map(img => `Photo Analysis: ${img.analysis}`).join(' ');
      setSymptoms(prev => prev + (prev ? '\n\n' : '') + analysisText);
      
      analytics.track('image_analysis_completed', { 
        imageCount: images.length,
        analysisLength: analysisText.length 
      });
      
      setIsAnalyzing(false);
    }, 2000 + Math.random() * 2000); // 2-4 seconds
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    analytics.track('image_removed', { index });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const capturePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      handleFileSelect(target.files);
    };
    input.click();
    analytics.track('camera_capture_initiated');
  };

  // Hospital type recommendation function
  function getHospitalType(level: number) {
    switch(level) {
      case 1: return "Trauma Center";
      case 2: return "Cardiac Center";
      case 3: return "General Hospital";
      case 4: return "Clinic";
      case 5: return "Observation";
      default: return "General Hospital";
    }
  }

  const handleGetTriageLevel = async () => {
    setIsProcessing(true);
    
    // Generate random triage and urgency as specified
    const triageLevel = Math.floor(Math.random() * 5) + 1;
    const urgencyScore = Math.floor(Math.random() * 101);
    
    const assessmentData = {
      triageLevel,
      urgencyScore,
      symptoms,
      uploadedImages: uploadedImages.length,
      voiceUsed: isVoiceSupported && symptoms.includes('voice'),
      timestamp: Date.now()
    };
    
    // Track assessment completion
    analytics.trackAIAssessment(assessmentData);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update state with assessment results
    updateState({
      triageLevel,
      urgencyScore,
      symptoms,
      uploadedImages: uploadedImages.length,
      currentPage: 'assessmentResult'
    });
    
    setIsProcessing(false);
  };

  const getTriageColor = (level: number) => {
    switch(level) {
      case 1: return 'text-red-600 bg-red-100';
      case 2: return 'text-orange-600 bg-orange-100';
      case 3: return 'text-yellow-600 bg-yellow-100';
      case 4: return 'text-blue-600 bg-blue-100';
      case 5: return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRecommendation = (triageLevel: number, urgencyScore: number) => {
    if (urgencyScore >= 70 || triageLevel <= 2) {
      return {
        level: "emergency",
        title: "Seek Immediate Medical Attention",
        description: "Based on your assessment, you should seek immediate medical care. Consider booking an ambulance.",
        action: "Book Ambulance"
      };
    } else if (urgencyScore >= 40 || triageLevel <= 3) {
      return {
        level: "urgent",
        title: "Seek Medical Care Soon",
        description: "Your assessment suggests you should see a healthcare provider within the next few hours.",
        action: "Find Hospitals"
      };
    } else {
      return {
        level: "moderate",
        title: "Monitor Symptoms",
        description: "Your symptoms appear manageable. Consider scheduling a routine appointment.",
        action: "Find Hospitals"
      };
    }
  };

  // Assessment Result Screen
  if (state.currentPage === 'assessmentResult') {
    const recommendation = getRecommendation(state.triageLevel, state.urgencyScore);
    
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto mb-4 sm:mb-6" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">AI Assessment Complete</h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Here are your assessment results and recommendations
          </p>
          {state.uploadedImages > 0 && (
            <p className="text-sm text-blue-600 mt-2">
              ✓ {state.uploadedImages} photo{state.uploadedImages > 1 ? 's' : ''} analyzed by AI
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Triage Level</h3>
              <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full text-xl sm:text-2xl font-bold ${getTriageColor(state.triageLevel)}`}>
                {state.triageLevel}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">Priority Level (1-5)</p>
            </div>
            
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Urgency Score</h3>
              <div className="text-3xl sm:text-4xl font-bold mb-2">
                <span className={getUrgencyColor(state.urgencyScore)}>{state.urgencyScore}</span>
                <span className="text-gray-400 text-xl sm:text-2xl">/100</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">AI-calculated urgency</p>
            </div>
            
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Recommended Hospital Type</h3>
              <div className="bg-blue-100 text-blue-800 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base">
                {getHospitalType(state.triageLevel)}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">Best suited for your needs</p>
            </div>
          </div>

          {state.symptoms && (
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Your Symptoms & Analysis</h3>
                {isVoiceSupported && (
                  <button
                    onClick={() => speakText(state.symptoms)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                    title="Listen to symptoms"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-gray-700 text-sm sm:text-base whitespace-pre-wrap">{state.symptoms}</p>
            </div>
          )}

          <div className={`rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 ${
            recommendation.level === 'emergency' ? 'bg-red-50 border border-red-200' : 
            recommendation.level === 'urgent' ? 'bg-orange-50 border border-orange-200' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              {recommendation.level === 'emergency' ? (
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 mr-3" />
              ) : (
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mr-3" />
              )}
              <h3 className={`text-lg sm:text-xl font-bold text-center ${
                recommendation.level === 'emergency' ? 'text-red-800' : 
                recommendation.level === 'urgent' ? 'text-orange-800' :
                'text-yellow-800'
              }`}>
                {recommendation.title}
              </h3>
            </div>
            <p className={`text-center mb-4 sm:mb-6 text-sm sm:text-base ${
              recommendation.level === 'emergency' ? 'text-red-700' : 
              recommendation.level === 'urgent' ? 'text-orange-700' :
              'text-yellow-700'
            }`}>
              {recommendation.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button 
              onClick={() => {
                analytics.track('assessment_action_clicked', { 
                  action: recommendation.action,
                  triageLevel: state.triageLevel,
                  urgencyScore: state.urgencyScore 
                });
                updateState({ currentPage: recommendation.action === 'Book Ambulance' ? 'book' : 'hospitals' });
              }}
              className={`px-6 sm:px-8 py-3 rounded-lg font-semibold transition-colors duration-200 text-sm sm:text-base ${
                recommendation.level === 'emergency' 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : recommendation.level === 'urgent'
                  ? 'bg-orange-600 text-white hover:bg-orange-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}
            >
              {recommendation.action}
              <ArrowRight className="inline h-4 w-4 ml-2" />
            </button>
            <button
              onClick={() => {
                analytics.track('new_assessment_clicked');
                updateState({ currentPage: 'assessment' });
              }}
              className="px-6 sm:px-8 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
            >
              New Assessment
            </button>
            <button
              onClick={() => {
                analytics.track('return_home_from_assessment');
                updateState({ currentPage: 'home' });
              }}
              className="px-6 sm:px-8 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
            >
              Return Home
            </button>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2 sm:mb-3">Important Disclaimer</h3>
          <p className="text-blue-800 text-xs sm:text-sm">
            This AI assessment is for informational purposes only and does not replace professional medical advice. 
            In case of a medical emergency, please call emergency services immediately or visit the nearest emergency room.
          </p>
        </div>
      </div>
    );
  }

  // Main Assessment Input Screen
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
          AI Medical Assessment
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-4">
          Get an AI-powered preliminary assessment of your symptoms with photo analysis
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        {/* Photo Upload Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
            <Camera className="inline h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
            Upload Photos for AI Analysis
          </h2>
          
          {/* Drag and Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-200 ${
              dragActive 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-300 hover:border-purple-400 hover:bg-purple-25'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-center">
                <Upload className="h-8 w-8 sm:h-12 sm:w-12 text-purple-500" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  Drop photos here or click to upload
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Upload images of injuries, rashes, wounds, or any visible symptoms
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="inline-flex items-center px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm sm:text-base"
                >
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => document.querySelector('input[type="file"]')?.click()}
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors duration-200 text-sm sm:text-base"
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Choose Files
                </button>
              </div>
            </div>
          </div>

          {/* Uploaded Images Display */}
          {uploadedImages.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Uploaded Photos ({uploadedImages.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <div className="relative">
                      <img
                        src={image.preview}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 sm:h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                    
                    <div className="mt-2 sm:mt-3">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                        {image.file.name}
                      </p>
                      
                      {image.analysis ? (
                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-center mb-1">
                            <Eye className="h-3 w-3 text-blue-600 mr-1" />
                            <span className="text-xs font-medium text-blue-800">AI Analysis:</span>
                          </div>
                          <p className="text-xs text-blue-700">{image.analysis}</p>
                        </div>
                      ) : isAnalyzing ? (
                        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <div className="flex items-center">
                            <div className="animate-spin h-3 w-3 border-2 border-yellow-600 border-t-transparent rounded-full mr-2"></div>
                            <span className="text-xs text-yellow-700">Analyzing...</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Text Symptoms Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
            <MessageCircle className="inline h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
            Describe Your Symptoms
          </h2>
          
          <div className="space-y-3 sm:space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Please describe your current symptoms, pain level, and any concerns:
            </label>
            
            <div className="relative">
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={6}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                placeholder="Example: I have been experiencing chest pain for the last hour, along with shortness of breath and dizziness. The pain is sharp and gets worse when I move..."
              />
              
              {/* Voice Input Controls */}
              {isVoiceSupported && (
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      isListening 
                        ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    title={isListening ? 'Stop recording' : 'Start voice input'}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>
                  
                  {symptoms && (
                    <button
                      type="button"
                      onClick={() => speakText(symptoms)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                      title="Listen to your description"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Voice Input Status */}
            {isVoiceSupported && (
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-gray-500">
                  Be as detailed as possible. Include when symptoms started, severity, and any factors that make them better or worse.
                </p>
                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span>{isListening ? 'Listening...' : 'Voice input available'}</span>
                </div>
              </div>
            )}
            
            {!isVoiceSupported && (
              <p className="text-xs sm:text-sm text-gray-500">
                Be as detailed as possible. Include when symptoms started, severity, and any factors that make them better or worse.
              </p>
            )}
          </div>
        </div>

        {/* Analysis Status */}
        {isAnalyzing && (
          <div className="mb-6 sm:mb-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-purple-200">
            <div className="flex items-center justify-center">
              <div className="animate-spin h-5 w-5 sm:h-6 sm:w-6 border-2 border-purple-600 border-t-transparent rounded-full mr-3"></div>
              <span className="text-purple-800 font-semibold text-sm sm:text-base">
                AI is analyzing your photos...
              </span>
            </div>
            <p className="text-center text-purple-700 text-xs sm:text-sm mt-2">
              This may take a few moments for accurate medical assessment
            </p>
          </div>
        )}

        <div className="text-center">
          <button 
            onClick={handleGetTriageLevel}
            disabled={isProcessing || (!symptoms.trim() && uploadedImages.length === 0)}
            className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Processing Assessment...
              </div>
            ) : (
              'Get AI Assessment'
            )}
          </button>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Provide symptoms or upload photos to get started
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-blue-50 p-4 sm:p-6 rounded-xl border border-blue-200">
          <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2 sm:mb-3">How It Works</h3>
          <ul className="text-blue-800 text-xs sm:text-sm space-y-1 sm:space-y-2">
            <li>• AI analyzes your symptoms & photos</li>
            <li>• Generates triage level (1-5)</li>
            <li>• Calculates urgency score (0-100)</li>
            <li>• Recommends appropriate care</li>
          </ul>
        </div>
        
        <div className="bg-purple-50 p-4 sm:p-6 rounded-xl border border-purple-200">
          <h3 className="text-base sm:text-lg font-semibold text-purple-900 mb-2 sm:mb-3">Photo Analysis</h3>
          <ul className="text-purple-800 text-xs sm:text-sm space-y-1 sm:space-y-2">
            <li>• Upload multiple injury photos</li>
            <li>• AI identifies visible symptoms</li>
            <li>• Instant medical assessment</li>
            <li>• Enhanced diagnostic accuracy</li>
          </ul>
        </div>
        
        <div className="bg-green-50 p-4 sm:p-6 rounded-xl border border-green-200">
          <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-2 sm:mb-3">Voice Features</h3>
          <ul className="text-green-800 text-xs sm:text-sm space-y-1 sm:space-y-2">
            <li>• Speak your symptoms naturally</li>
            <li>• Real-time voice transcription</li>
            <li>• Text-to-speech playback</li>
            <li>• Hands-free emergency reporting</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 bg-yellow-50 rounded-xl p-4 sm:p-6 border border-yellow-200">
        <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-2 sm:mb-3">Important Notice</h3>
        <p className="text-yellow-700 text-xs sm:text-sm">
          This AI assessment tool is designed to provide preliminary guidance only. Photo analysis is not a substitute for professional medical examination.
        </p>
      </div>
    </div>
  );
};

export default AIAssessmentScreen;