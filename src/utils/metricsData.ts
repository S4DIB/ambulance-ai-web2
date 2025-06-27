// Realistic simulated metrics for demo purposes
export class MetricsSimulator {
  private static instance: MetricsSimulator;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  static getInstance(): MetricsSimulator {
    if (!MetricsSimulator.instance) {
      MetricsSimulator.instance = new MetricsSimulator();
    }
    return MetricsSimulator.instance;
  }

  // Real-time system metrics
  getSystemMetrics() {
    const uptime = Date.now() - this.startTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    
    return {
      activeAmbulances: 47 + Math.floor(Math.random() * 8), // 47-54
      totalRequests: 1247 + Math.floor(uptime / 60000), // Increases over time
      avgResponseTime: 8.3 + (Math.random() * 2 - 1), // 7.3-9.3 minutes
      successRate: 98.7 + (Math.random() * 0.6 - 0.3), // 98.4-99.0%
      hospitalsBedAvailability: 847 + Math.floor(Math.random() * 50), // 847-897
      aiAccuracy: 94.2 + (Math.random() * 2), // 94.2-96.2%
      systemUptime: hours,
      currentLoad: 67 + Math.floor(Math.random() * 20), // 67-87%
      emergencyCallsToday: 89 + Math.floor(uptime / 300000), // Increases every 5 min
      liveSaves: 12 + Math.floor(uptime / 1800000) // Increases every 30 min
    };
  }

  // Performance metrics for different features
  getPerformanceMetrics() {
    return {
      aiAssessment: {
        avgProcessingTime: 2.1 + (Math.random() * 0.8), // 2.1-2.9 seconds
        accuracy: 94.7 + (Math.random() * 2), // 94.7-96.7%
        totalAssessments: 3847,
        correctDiagnoses: 3642,
        falsePositives: 89,
        falseNegatives: 116
      },
      hospitalMatching: {
        avgMatchTime: 1.3 + (Math.random() * 0.4), // 1.3-1.7 seconds
        matchAccuracy: 96.2 + (Math.random() * 1.5), // 96.2-97.7%
        hospitalsAnalyzed: 847,
        successfulMatches: 2934,
        patientSatisfaction: 4.8 + (Math.random() * 0.2) // 4.8-5.0
      },
      routeOptimization: {
        avgTimeSaved: 4.2 + (Math.random() * 2), // 4.2-6.2 minutes
        fuelSaved: 23.7 + (Math.random() * 5), // 23.7-28.7%
        routesOptimized: 1847,
        trafficEventsProcessed: 12847
      }
    };
  }

  // Geographic and demographic data
  getDemographicMetrics() {
    return {
      coverage: {
        dhaka: { population: 9000000, coverage: 94.2, avgResponse: 8.1 },
        chittagong: { population: 2500000, coverage: 87.3, avgResponse: 9.7 },
        sylhet: { population: 500000, coverage: 91.8, avgResponse: 7.9 },
        rajshahi: { population: 450000, coverage: 89.1, avgResponse: 8.8 }
      },
      demographics: {
        totalPopulationCovered: 12450000,
        ruralCoverage: 78.3,
        urbanCoverage: 96.7,
        avgIncomeLevel: 'Middle',
        primaryLanguages: ['Bengali', 'English']
      }
    };
  }

  // Real-time traffic and operational data
  getLiveOperationalData() {
    const now = new Date();
    const hour = now.getHours();
    
    // Traffic varies by time of day
    let trafficMultiplier = 1;
    if (hour >= 7 && hour <= 10) trafficMultiplier = 1.4; // Morning rush
    if (hour >= 17 && hour <= 20) trafficMultiplier = 1.3; // Evening rush
    if (hour >= 22 || hour <= 5) trafficMultiplier = 0.7; // Night time
    
    return {
      currentTrafficLoad: Math.floor(45 * trafficMultiplier + Math.random() * 20),
      activeEmergencies: 12 + Math.floor(Math.random() * 8),
      ambulancesInTransit: 23 + Math.floor(Math.random() * 12),
      hospitalCapacity: {
        available: 847 + Math.floor(Math.random() * 50),
        occupied: 2156 + Math.floor(Math.random() * 100),
        critical: 89 + Math.floor(Math.random() * 20)
      },
      weatherImpact: this.getWeatherImpact(),
      networkLatency: 45 + Math.floor(Math.random() * 30), // ms
      serverLoad: 23 + Math.floor(Math.random() * 40) // %
    };
  }

  private getWeatherImpact() {
    const conditions = ['Clear', 'Light Rain', 'Heavy Rain', 'Fog', 'Storm'];
    const impacts = [0, 15, 35, 25, 45]; // % delay
    const index = Math.floor(Math.random() * conditions.length);
    
    return {
      condition: conditions[index],
      delayImpact: impacts[index],
      visibility: index === 3 ? 'Low' : index === 4 ? 'Very Low' : 'Good'
    };
  }

  // Financial and cost metrics
  getFinancialMetrics() {
    return {
      costSavings: {
        fuelSavings: 847500, // BDT saved this month
        timeSavings: 2340, // Hours saved
        hospitalEfficiency: 23.7, // % improvement
        patientOutcomes: 18.9 // % better outcomes
      },
      revenue: {
        monthlyRevenue: 12450000, // BDT
        avgCostPerRide: 2500,
        insuranceCoverage: 78.3, // % of rides covered
        governmentSubsidy: 34.2 // % subsidized
      }
    };
  }

  // AI Model Performance
  getAIModelMetrics() {
    return {
      models: {
        triageClassifier: {
          accuracy: 94.7,
          precision: 93.2,
          recall: 95.8,
          f1Score: 94.5,
          lastTrained: '2024-01-15',
          trainingData: 45000,
          inferenceTime: 1.2 // seconds
        },
        hospitalMatcher: {
          accuracy: 96.2,
          precision: 95.8,
          recall: 96.6,
          f1Score: 96.2,
          lastTrained: '2024-01-18',
          trainingData: 78000,
          inferenceTime: 0.8
        },
        routeOptimizer: {
          accuracy: 91.3,
          avgTimeSaved: 4.7,
          fuelEfficiency: 23.4,
          lastTrained: '2024-01-20',
          trainingData: 120000,
          inferenceTime: 2.1
        }
      },
      dataQuality: {
        completeness: 97.8,
        accuracy: 94.2,
        consistency: 96.1,
        timeliness: 98.9
      }
    };
  }
}

export const metricsSimulator = MetricsSimulator.getInstance();