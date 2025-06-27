import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  RotateCcw, 
  MessageCircle,
  X,
  User,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useTranslation } from '../utils/translations';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  paramedicName?: string;
  callType: 'emergency' | 'consultation';
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({ 
  isOpen, 
  onClose, 
  paramedicName = "Dr. Rahman",
  callType 
}) => {
  const { t } = useTranslation();
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{sender: string, message: string, time: string}>>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTime = useRef<number>(0);

  // Simulate video call connection
  useEffect(() => {
    if (isOpen && callStatus === 'connecting') {
      const connectTimer = setTimeout(() => {
        setCallStatus('connected');
        callStartTime.current = Date.now();
        
        // Simulate getting user media
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
              }
            })
            .catch(err => console.log('Media access denied:', err));
        }
      }, 2000 + Math.random() * 3000); // 2-5 seconds connection time

      return () => clearTimeout(connectTimer);
    }
  }, [isOpen, callStatus]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  // Simulate connection quality changes
  useEffect(() => {
    if (callStatus === 'connected') {
      const qualityInterval = setInterval(() => {
        const qualities: Array<'excellent' | 'good' | 'poor'> = ['excellent', 'good', 'poor'];
        const weights = [0.6, 0.3, 0.1]; // Mostly good quality
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < qualities.length; i++) {
          cumulative += weights[i];
          if (random <= cumulative) {
            setConnectionQuality(qualities[i]);
            break;
          }
        }
      }, 5000);

      return () => clearInterval(qualityInterval);
    }
  }, [callStatus]);

  // Add initial chat messages
  useEffect(() => {
    if (callStatus === 'connected' && chatMessages.length === 0) {
      const initialMessages = [
        {
          sender: paramedicName,
          message: callType === 'emergency' 
            ? "I can see your emergency request. Can you describe what's happening?"
            : "Hello! I'm here to help with your medical consultation. How are you feeling?",
          time: new Date().toLocaleTimeString()
        }
      ];
      setChatMessages(initialMessages);
    }
  }, [callStatus, paramedicName, callType, chatMessages.length]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    
    // Stop media streams
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    setTimeout(() => {
      onClose();
      setCallStatus('connecting');
      setCallDuration(0);
      setChatMessages([]);
    }, 2000);
  };

  const toggleVideo = () => {
    setIsVideoMuted(!isVideoMuted);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoMuted;
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioMuted(!isAudioMuted);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isAudioMuted;
      }
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        sender: 'You',
        message: newMessage,
        time: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Simulate paramedic response
      setTimeout(() => {
        const responses = [
          "I understand. Let me check your symptoms.",
          "That's helpful information. Can you tell me more?",
          "Based on what you're describing, I recommend...",
          "Please try to stay calm. Help is on the way.",
          "Can you rate your pain level from 1 to 10?"
        ];
        const response = {
          sender: paramedicName,
          message: responses[Math.floor(Math.random() * responses.length)],
          time: new Date().toLocaleTimeString()
        };
        setChatMessages(prev => [...prev, response]);
      }, 1000 + Math.random() * 2000);
    }
  };

  const getConnectionIcon = () => {
    switch (connectionQuality) {
      case 'excellent': return <Wifi className="h-4 w-4 text-green-500" />;
      case 'good': return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'poor': return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-full">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{paramedicName}</h3>
              <div className="flex items-center space-x-2 text-sm text-blue-100">
                <span>
                  {callStatus === 'connecting' && t('connectingCall')}
                  {callStatus === 'connected' && `${t('callInProgress')} - ${formatDuration(callDuration)}`}
                  {callStatus === 'ended' && 'Call Ended'}
                </span>
                {callStatus === 'connected' && (
                  <>
                    <span>•</span>
                    {getConnectionIcon()}
                    <span className="capitalize">{connectionQuality}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 bg-gray-900 relative flex">
          {/* Main Video (Remote) */}
          <div className="flex-1 relative">
            {callStatus === 'connecting' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-lg">{t('connectingCall')}</p>
                  <p className="text-sm text-gray-300 mt-2">
                    {callType === 'emergency' ? 'Emergency paramedic will join shortly' : 'Connecting to medical professional'}
                  </p>
                </div>
              </div>
            ) : callStatus === 'ended' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <PhoneOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <p className="text-lg">Call Ended</p>
                  <p className="text-sm text-gray-300 mt-2">Duration: {formatDuration(callDuration)}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Simulated Remote Video */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="bg-white/20 p-8 rounded-full mb-4 mx-auto w-32 h-32 flex items-center justify-center">
                      <User className="h-16 w-16" />
                    </div>
                    <p className="text-xl font-semibold">{paramedicName}</p>
                    <p className="text-blue-200">Paramedic • Emergency Medicine</p>
                  </div>
                </div>
                
                {/* Connection Quality Indicator */}
                <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-2 flex items-center space-x-2">
                  {getConnectionIcon()}
                  <span className="text-white text-sm capitalize">{connectionQuality}</span>
                </div>
              </>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          {callStatus === 'connected' && (
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
              {isVideoMuted ? (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <VideoOff className="h-8 w-8 text-gray-400" />
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
                You
              </div>
            </div>
          )}

          {/* Chat Sidebar */}
          {showChat && callStatus === 'connected' && (
            <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900">Chat</h4>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs rounded-lg p-3 ${
                      msg.sender === 'You' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'You' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {callStatus === 'connected' && (
          <div className="bg-gray-800 p-6">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-colors ${
                  isAudioMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
                title={isAudioMuted ? 'Unmute Audio' : t('muteAudio')}
              >
                {isAudioMuted ? (
                  <MicOff className="h-6 w-6 text-white" />
                ) : (
                  <Mic className="h-6 w-6 text-white" />
                )}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${
                  isVideoMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
                title={isVideoMuted ? 'Turn On Video' : t('muteVideo')}
              >
                {isVideoMuted ? (
                  <VideoOff className="h-6 w-6 text-white" />
                ) : (
                  <Video className="h-6 w-6 text-white" />
                )}
              </button>

              <button
                className="p-4 rounded-full bg-gray-600 hover:bg-gray-700 transition-colors"
                title={t('switchCamera')}
              >
                <RotateCcw className="h-6 w-6 text-white" />
              </button>

              <button
                onClick={handleEndCall}
                className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                title={t('endCall')}
              >
                <PhoneOff className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCallModal;