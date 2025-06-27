// Advanced performance optimization
import { lazy, Suspense } from 'react';

// Lazy load heavy components
export const LazyVideoCallModal = lazy(() => import('../components/VideoCallModal'));
export const LazyHospitalsScreen = lazy(() => import('../components/screens/HospitalsScreen'));
export const LazyAIAssessmentScreen = lazy(() => import('../components/screens/AIAssessmentScreen'));

// Image optimization for photo uploads
export class ImageOptimizer {
  static async compressImage(file: File, maxWidth = 1024, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  static async generateThumbnail(file: File, size = 150): Promise<string> {
    const compressed = await this.compressImage(file, size, 0.6);
    return URL.createObjectURL(compressed);
  }
}

// Service Worker for offline functionality
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  }
};

// Performance monitoring
export class PerformanceMonitor {
  static measurePageLoad() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        
        console.log('Page load time:', loadTime + 'ms');
        
        // Send to analytics
        this.sendMetrics({
          pageLoadTime: loadTime,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          firstPaint: this.getFirstPaint(),
          timestamp: Date.now()
        });
      });
    }
  }

  static getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : 0;
  }

  static sendMetrics(metrics: any) {
    // Send to analytics service
    console.log('Performance metrics:', metrics);
  }
}