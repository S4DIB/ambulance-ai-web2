// AI Service for Medical Assessment
// Supports OpenRouter (DeepSeek), OpenAI, and Google Cloud
//
// ENV VARIABLES (set in .env):
// VITE_OPENROUTER_API_KEY=your_openrouter_api_key
// VITE_OPENAI_API_KEY=your_openai_api_key
// VITE_GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key
//
// Priority: OpenRouter (DeepSeek) > OpenAI > Google Cloud

export interface AIAnalysisResult {
  triageLevel: number; // 1-5
  urgencyScore: number; // 0-100
  confidence: number; // 0-100
  recommendations: string[];
  riskFactors: string[];
  suggestedSpecialties: string[];
  immediateActions: string[];
  aiModel: string;
  processingTime: number;
}

export interface PhotoAnalysisResult {
  detectedConditions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendations: string[];
  imageQuality: 'good' | 'poor' | 'unusable';
}

// Simulated medical image analysis for hackathon/demo
export interface SimulatedPhotoAnalysisResult {
  detectedConditions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  recommendations: string[];
  imageQuality: 'good' | 'poor';
}

export class AIService {
  private static readonly OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
  private static readonly OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  private static readonly GOOGLE_CLOUD_API_KEY = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
  private static readonly MEDICAL_AI_ENDPOINT = import.meta.env.VITE_MEDICAL_AI_ENDPOINT;

  // Utility to ensure value is always an array
  private static toArray(val: any) {
    return Array.isArray(val) ? val : val ? [val] : [];
  }

  // Robust JSON parse: tries to fix common LLM mistakes
  private static robustJsonParse(content: string): any {
    try {
      return JSON.parse(content);
    } catch (e1) {
      // Try to fix single quotes to double quotes
      let fixed = content.replace(/'/g, '"');
      try {
        return JSON.parse(fixed);
      } catch (e2) {
        // Try to fix unquoted property names (very basic, not perfect)
        fixed = fixed.replace(/([{,\s])(\w+):/g, '$1"$2":');
        try {
          return JSON.parse(fixed);
        } catch (e3) {
          console.error('Robust JSON parse failed:', {content, e1, e2, e3});
          throw e3;
        }
      }
    }
  }

  // Utility to map snake_case keys to camelCase
  private static mapSnakeToCamel(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const map: Record<string, string> = {
      'triage_level': 'triageLevel',
      'urgency_score': 'urgencyScore',
      'confidence_level': 'confidence',
      'specific_recommendations': 'recommendations',
      'risk_factors': 'riskFactors',
      'suggested_medical_specialties': 'suggestedSpecialties',
      'immediate_actions_needed': 'immediateActions',
    };
    const result: any = {};
    for (const key in obj) {
      const camelKey = map[key] || key;
      result[camelKey] = obj[key];
    }
    return result;
  }

  // Determine which provider to use
  private static getProvider() {
    if (this.OPENROUTER_API_KEY) return 'openrouter';
    if (this.OPENAI_API_KEY) return 'openai';
    if (this.GOOGLE_CLOUD_API_KEY) return 'google';
    return null;
  }

  // Analyze symptoms using the best available provider
  static async analyzeSymptoms(symptoms: string, patientAge?: number, patientGender?: string): Promise<AIAnalysisResult> {
    const provider = this.getProvider();
    if (!provider) {
      throw new Error('No AI API key configured. Please set VITE_OPENROUTER_API_KEY, VITE_OPENAI_API_KEY, or VITE_GOOGLE_CLOUD_API_KEY in your .env file.');
    }
    const startTime = Date.now();

    try {
      if (provider === 'openrouter') {
        // Use OpenRouter (DeepSeek)
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
            'X-Title': 'Rescufast.ai',
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-r1-0528:free',
            messages: [
              {
                role: 'system',
                content: `You are a medical AI assistant specializing in emergency triage. Analyze the symptoms and provide:
1. Triage level (1-5, where 1=immediate, 5=non-urgent)
2. Urgency score (0-100, where 0=not urgent, 100=critical)
3. Confidence level (0-100)
4. Specific recommendations
5. Risk factors to consider
6. Suggested medical specialties
7. Immediate actions needed

Respond in JSON format only.`
              },
              {
                role: 'user',
                content: `Patient symptoms: ${symptoms}
Patient age: ${patientAge || 'unknown'}
Patient gender: ${patientGender || 'unknown'}

Provide medical triage analysis in JSON format.`
              }
            ],
            temperature: 0.1,
            max_tokens: 1000
          })
        });
        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status}`);
        }
        const data = await response.json();
        // Patch: Remove Markdown code block if present
        let content = data.choices[0].message.content.trim();
        if (content.startsWith('```')) {
          content = content.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
        }
        console.log('Raw AI response:', content); // Log for debugging
        let analysis;
        try {
          analysis = AIService.robustJsonParse(content);
          // Map snake_case keys to camelCase
          analysis = AIService.mapSnakeToCamel(analysis);
        } catch (err) {
          console.error('AI analysis failed: Could not robustly parse JSON:', err, content);
          throw err;
        }
        // If required fields are missing, use fallback
        if (
          analysis.triageLevel === undefined ||
          analysis.urgencyScore === undefined ||
          analysis.confidence === undefined ||
          !analysis.recommendations
        ) {
          console.warn('AI response missing required fields, using fallback analysis.', analysis);
          analysis = AIService.fallbackAnalysis(symptoms);
        }
        return {
          triageLevel: analysis.triageLevel,
          urgencyScore: analysis.urgencyScore,
          confidence: analysis.confidence,
          recommendations: AIService.toArray(analysis.recommendations),
          riskFactors: AIService.toArray(analysis.riskFactors),
          suggestedSpecialties: AIService.toArray(analysis.suggestedSpecialties),
          immediateActions: AIService.toArray(analysis.immediateActions),
          aiModel: 'deepseek/deepseek-r1-0528:free (OpenRouter)',
          processingTime: Date.now() - startTime
        };
      }
      if (provider === 'openai') {
        // Use OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo', // Use gpt-4 if you have access
            messages: [
              {
                role: 'system',
                content: `You are a medical AI assistant specializing in emergency triage. Analyze the symptoms and provide:
1. Triage level (1-5, where 1=immediate, 5=non-urgent)
2. Urgency score (0-100, where 0=not urgent, 100=critical)
3. Confidence level (0-100)
4. Specific recommendations
5. Risk factors to consider
6. Suggested medical specialties
7. Immediate actions needed

Respond in JSON format only.`
              },
              {
                role: 'user',
                content: `Patient symptoms: ${symptoms}
Patient age: ${patientAge || 'unknown'}
Patient gender: ${patientGender || 'unknown'}

Provide medical triage analysis in JSON format.`
              }
            ],
            temperature: 0.1,
            max_tokens: 1000
          })
        });
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }
        const data = await response.json();
        // Patch: Remove Markdown code block if present
        let content = data.choices[0].message.content.trim();
        if (content.startsWith('```')) {
          content = content.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
        }
        console.log('Raw AI response:', content); // Log for debugging
        let analysis;
        try {
          analysis = AIService.robustJsonParse(content);
          // Map snake_case keys to camelCase
          analysis = AIService.mapSnakeToCamel(analysis);
        } catch (err) {
          console.error('AI analysis failed: Could not robustly parse JSON:', err, content);
          throw err;
        }
        // If required fields are missing, use fallback
        if (
          analysis.triageLevel === undefined ||
          analysis.urgencyScore === undefined ||
          analysis.confidence === undefined ||
          !analysis.recommendations
        ) {
          console.warn('AI response missing required fields, using fallback analysis.', analysis);
          analysis = AIService.fallbackAnalysis(symptoms);
        }
        return {
          triageLevel: analysis.triageLevel,
          urgencyScore: analysis.urgencyScore,
          confidence: analysis.confidence,
          recommendations: AIService.toArray(analysis.recommendations),
          riskFactors: AIService.toArray(analysis.riskFactors),
          suggestedSpecialties: AIService.toArray(analysis.suggestedSpecialties),
          immediateActions: AIService.toArray(analysis.immediateActions),
          aiModel: 'gpt-3.5-turbo (OpenAI)',
          processingTime: Date.now() - startTime
        };
      }
      // Fallback: Google Cloud or rule-based
      return this.fallbackAnalysis(symptoms);
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.fallbackAnalysis(symptoms);
    }
  }

  // Simulated medical image analysis for hackathon/demo
  static async analyzeMedicalPhotosSimulated(files: File[]): Promise<SimulatedPhotoAnalysisResult[]> {
    const possibleConditions = [
      { label: 'Skin Rash', severity: 'low', rec: 'Apply moisturizer and monitor for changes.' },
      { label: 'Burn (First Degree)', severity: 'medium', rec: 'Cool with water, avoid sun, seek care if worsens.' },
      { label: 'Laceration', severity: 'medium', rec: 'Clean wound, apply sterile dressing, seek stitches if deep.' },
      { label: 'Bruise/Contusion', severity: 'low', rec: 'Apply ice, elevate, monitor for swelling.' },
      { label: 'Possible Infection', severity: 'high', rec: 'Monitor for fever, redness, seek medical attention.' },
      { label: 'Fracture Suspected', severity: 'critical', rec: 'Immobilize, seek emergency care immediately.' },
      { label: 'Normal Skin', severity: 'low', rec: 'No abnormality detected.' }
    ];

    return files.map(file => {
      // Use filename to bias the result (for demo)
      const name = file.name.toLowerCase();
      let condition = possibleConditions[Math.floor(Math.random() * possibleConditions.length)];

      if (name.includes('rash')) condition = possibleConditions[0];
      if (name.includes('burn')) condition = possibleConditions[1];
      if (name.includes('cut') || name.includes('laceration')) condition = possibleConditions[2];
      if (name.includes('bruise')) condition = possibleConditions[3];
      if (name.includes('infect')) condition = possibleConditions[4];
      if (name.includes('fracture') || name.includes('xray')) condition = possibleConditions[5];
      if (name.includes('normal')) condition = possibleConditions[6];

      // Simulate confidence and image quality
      const confidence = Math.floor(70 + Math.random() * 30); // 70-100%
      const imageQuality = file.size > 500000 ? 'good' : 'poor';

      return {
        detectedConditions: [condition.label],
        severity: condition.severity as 'low' | 'medium' | 'high' | 'critical',
        confidence,
        recommendations: [condition.rec],
        imageQuality
      };
    });
  }

  // Replace the real photo analysis with the simulated one for demo
  static async analyzeMedicalPhotos(files: File[]): Promise<SimulatedPhotoAnalysisResult[]> {
    // Add a small delay to simulate processing
    await new Promise(res => setTimeout(res, 1200 + Math.random() * 800));
    return this.analyzeMedicalPhotosSimulated(files);
  }

  // Enhanced analysis combining symptoms and photos
  static async comprehensiveAnalysis(
    symptoms: string, 
    photos: File[], 
    patientAge?: number, 
    patientGender?: string
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();

    // Analyze symptoms
    const symptomAnalysis = await this.analyzeSymptoms(symptoms, patientAge, patientGender);
    
    // Analyze photos if provided
    let photoAnalysis: PhotoAnalysisResult[] = [];
    if (photos.length > 0) {
      photoAnalysis = await this.analyzeMedicalPhotos(photos);
    }

    // Combine analyses
    const combinedResult = this.combineAnalyses(symptomAnalysis, photoAnalysis);
    
    return {
      ...combinedResult,
      processingTime: Date.now() - startTime
    };
  }

  // Voice-to-text conversion for symptoms
  static async transcribeVoice(audioBlob: Blob): Promise<string> {
    if (!this.GOOGLE_CLOUD_API_KEY) {
      throw new Error('Google Cloud API key not configured');
    }

    try {
      // Convert audio to base64
      const base64 = await this.blobToBase64(audioBlob);
      
      const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${this.GOOGLE_CLOUD_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            enableAutomaticPunctuation: true,
            model: 'medical_dictation'
          },
          audio: {
            content: base64.split(',')[1]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google Speech API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results?.[0]?.alternatives?.[0]?.transcript || '';

    } catch (error) {
      console.error('Voice transcription failed:', error);
      throw new Error('Voice transcription failed');
    }
  }

  // Real-time medical consultation using AI
  static async getMedicalAdvice(
    symptoms: string, 
    context: string, 
    urgency: 'low' | 'medium' | 'high'
  ): Promise<string> {
    if (!this.OPENAI_API_KEY) {
      return 'AI service unavailable. Please contact emergency services directly.';
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are an emergency medical AI assistant. Provide immediate, actionable medical advice. 
              Always prioritize safety and recommend professional medical attention when appropriate.
              Keep responses concise and clear for emergency situations.`
            },
            {
              role: 'user',
              content: `Symptoms: ${symptoms}
              Context: ${context}
              Urgency: ${urgency}
              
              Provide immediate medical advice.`
            }
          ],
          temperature: 0.1,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error('Medical advice generation failed:', error);
      return 'Unable to provide AI medical advice. Please contact emergency services.';
    }
  }

  // Fallback analysis when AI services are unavailable
  private static fallbackAnalysis(symptoms: string): AIAnalysisResult {
    const lowerSymptoms = symptoms.toLowerCase();
    
    // Basic keyword-based triage
    let triageLevel = 3;
    let urgencyScore = 50;
    let confidence = 60;
    const recommendations: string[] = [];
    const riskFactors: string[] = [];
    const suggestedSpecialties: string[] = ['General Medicine'];
    const immediateActions: string[] = [];

    // Critical symptoms
    if (lowerSymptoms.includes('chest pain') || lowerSymptoms.includes('heart attack')) {
      triageLevel = 1;
      urgencyScore = 95;
      confidence = 85;
      recommendations.push('Immediate emergency medical attention required');
      immediateActions.push('Call emergency services immediately');
      suggestedSpecialties.push('Cardiology', 'Emergency Medicine');
    }
    
    // Severe symptoms
    else if (lowerSymptoms.includes('unconscious') || lowerSymptoms.includes('not breathing')) {
      triageLevel = 1;
      urgencyScore = 100;
      confidence = 90;
      recommendations.push('Critical emergency - immediate intervention needed');
      immediateActions.push('Call emergency services immediately', 'Begin CPR if trained');
      suggestedSpecialties.push('Emergency Medicine', 'Critical Care');
    }
    
    // Moderate symptoms
    else if (lowerSymptoms.includes('fever') || lowerSymptoms.includes('infection')) {
      triageLevel = 2;
      urgencyScore = 70;
      confidence = 75;
      recommendations.push('Seek medical attention within 2-4 hours');
      suggestedSpecialties.push('Internal Medicine', 'Infectious Disease');
    }
    
    // Mild symptoms
    else if (lowerSymptoms.includes('headache') || lowerSymptoms.includes('mild pain')) {
      triageLevel = 4;
      urgencyScore = 30;
      confidence = 70;
      recommendations.push('Monitor symptoms and seek care if they worsen');
      suggestedSpecialties.push('General Medicine', 'Neurology');
    }

    return {
      triageLevel,
      urgencyScore,
      confidence,
      recommendations,
      riskFactors,
      suggestedSpecialties,
      immediateActions,
      aiModel: 'Rule-based Fallback',
      processingTime: 0
    };
  }

  // Process Google Vision API results
  private static processVisionResults(data: any, file: File): PhotoAnalysisResult {
    const labels = data.responses?.[0]?.labelAnnotations || [];
    const texts = data.responses?.[0]?.textAnnotations || [];
    const objects = data.responses?.[0]?.localizedObjectAnnotations || [];

    const detectedConditions: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let confidence = 0;
    const recommendations: string[] = [];

    // Analyze labels for medical conditions
    labels.forEach((label: any) => {
      const labelText = label.description.toLowerCase();
      const labelConfidence = label.score * 100;

      if (labelText.includes('wound') || labelText.includes('cut') || labelText.includes('injury')) {
        detectedConditions.push('Visible injury');
        severity = 'medium';
        confidence = Math.max(confidence, labelConfidence);
        recommendations.push('Clean wound and apply sterile dressing');
      }
      
      if (labelText.includes('rash') || labelText.includes('skin condition')) {
        detectedConditions.push('Skin condition');
        severity = 'low';
        confidence = Math.max(confidence, labelConfidence);
        recommendations.push('Avoid scratching and seek dermatological evaluation');
      }
      
      if (labelText.includes('swelling') || labelText.includes('bruise')) {
        detectedConditions.push('Swelling/bruising');
        severity = 'medium';
        confidence = Math.max(confidence, labelConfidence);
        recommendations.push('Apply ice and elevate if possible');
      }
    });

    // Analyze detected text for medical information
    texts.forEach((text: any) => {
      const textContent = text.description.toLowerCase();
      if (textContent.includes('pain') || textContent.includes('emergency')) {
        detectedConditions.push('Medical text detected');
        recommendations.push('Text analysis suggests medical concern');
      }
    });

    // Determine image quality
    const imageQuality = file.size > 1000000 ? 'good' : 'poor';

    return {
      detectedConditions,
      severity,
      confidence,
      recommendations,
      imageQuality
    };
  }

  // Combine symptom and photo analyses
  private static combineAnalyses(
    symptomAnalysis: AIAnalysisResult, 
    photoAnalysis: PhotoAnalysisResult[]
  ): AIAnalysisResult {
    let combinedTriageLevel = symptomAnalysis.triageLevel;
    let combinedUrgencyScore = symptomAnalysis.urgencyScore;
    let combinedConfidence = symptomAnalysis.confidence;
    const combinedRecommendations = [...AIService.toArray(symptomAnalysis.recommendations)];

    // Adjust based on photo analysis
    photoAnalysis.forEach(photo => {
      if (photo.severity === 'critical') {
        combinedTriageLevel = Math.min(combinedTriageLevel, 1);
        combinedUrgencyScore = Math.max(combinedUrgencyScore, 90);
        combinedConfidence = Math.max(combinedConfidence, photo.confidence);
      } else if (photo.severity === 'high') {
        combinedTriageLevel = Math.min(combinedTriageLevel, 2);
        combinedUrgencyScore = Math.max(combinedUrgencyScore, 80);
      }
      combinedRecommendations.push(...AIService.toArray(photo.recommendations));
    });

    return {
      ...symptomAnalysis,
      triageLevel: combinedTriageLevel,
      urgencyScore: combinedUrgencyScore,
      confidence: combinedConfidence,
      recommendations: [...new Set(combinedRecommendations)] // Remove duplicates
    };
  }

  // Utility functions
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
} 