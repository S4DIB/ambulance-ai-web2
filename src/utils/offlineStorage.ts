// Offline-first architecture for emergency situations
export class OfflineEmergencyStorage {
  private dbName = 'RescufastEmergency';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Emergency requests store
        if (!db.objectStoreNames.contains('emergencyRequests')) {
          const store = db.createObjectStore('emergencyRequests', { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('status', 'status');
        }
        
        // User medical history
        if (!db.objectStoreNames.contains('medicalHistory')) {
          const store = db.createObjectStore('medicalHistory', { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date');
          store.createIndex('type', 'type');
        }
        
        // Offline hospitals cache
        if (!db.objectStoreNames.contains('hospitalsCache')) {
          const store = db.createObjectStore('hospitalsCache', { keyPath: 'id' });
          store.createIndex('lastUpdated', 'lastUpdated');
        }
      };
    });
  }

  async saveEmergencyRequest(request: any) {
    if (!this.db) await this.init();
    
    const transaction = this.db!.transaction(['emergencyRequests'], 'readwrite');
    const store = transaction.objectStore('emergencyRequests');
    
    const requestWithTimestamp = {
      ...request,
      timestamp: Date.now(),
      syncStatus: navigator.onLine ? 'synced' : 'pending'
    };
    
    return store.add(requestWithTimestamp);
  }

  async syncPendingRequests() {
    if (!navigator.onLine) return;
    
    const transaction = this.db!.transaction(['emergencyRequests'], 'readwrite');
    const store = transaction.objectStore('emergencyRequests');
    const index = store.index('status');
    
    const pendingRequests = await new Promise<any[]>((resolve) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
    });
    
    for (const request of pendingRequests) {
      try {
        // Sync with server
        await this.syncToServer(request);
        request.syncStatus = 'synced';
        store.put(request);
      } catch (error) {
        console.error('Failed to sync request:', error);
      }
    }
  }

  private async syncToServer(request: any) {
    // Implement server sync logic
    return fetch('/api/emergency-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
  }
}

export const offlineStorage = new OfflineEmergencyStorage();