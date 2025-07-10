// IndexedDB wrapper for offline data storage
class OfflineStorage {
  private dbName = 'WrenchdIVHC';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Jobs store
        if (!db.objectStoreNames.contains('jobs')) {
          const jobsStore = db.createObjectStore('jobs', { keyPath: 'id' });
          jobsStore.createIndex('userId', 'userId', { unique: false });
          jobsStore.createIndex('status', 'status', { unique: false });
          jobsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Pending operations store (for sync when back online)
        if (!db.objectStoreNames.contains('pendingOps')) {
          const pendingStore = db.createObjectStore('pendingOps', { keyPath: 'id', autoIncrement: true });
          pendingStore.createIndex('type', 'type', { unique: false });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // VHC data store
        if (!db.objectStoreNames.contains('vhcData')) {
          const vhcStore = db.createObjectStore('vhcData', { keyPath: 'jobId' });
          vhcStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Fit & Finish data store
        if (!db.objectStoreNames.contains('fitFinishData')) {
          const fitFinishStore = db.createObjectStore('fitFinishData', { keyPath: 'jobId' });
          fitFinishStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Vehicles cache
        if (!db.objectStoreNames.contains('vehicles')) {
          const vehiclesStore = db.createObjectStore('vehicles', { keyPath: 'vrm' });
          vehiclesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Customers cache
        if (!db.objectStoreNames.contains('customers')) {
          const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
          customersStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // User data cache
        if (!db.objectStoreNames.contains('userData')) {
          db.createObjectStore('userData', { keyPath: 'id' });
        }
      };
    });
  }

  // Generic store operations
  async get(storeName: string, key: string | number): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async put(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ ...data, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(storeName: string, key: string | number): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Job-specific operations
  async saveJob(job: any): Promise<void> {
    await this.put('jobs', job);
  }

  async getJobs(userId: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['jobs'], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  // Pending operations for sync
  async addPendingOperation(operation: {
    type: 'CREATE_JOB' | 'UPDATE_JOB' | 'DELETE_JOB' | 'CREATE_VHC' | 'UPDATE_VHC' | 'CREATE_FIT_FINISH' | 'UPDATE_FIT_FINISH';
    data: any;
    endpoint: string;
    method: string;
  }): Promise<void> {
    await this.put('pendingOps', {
      ...operation,
      timestamp: Date.now(),
      id: Date.now() + Math.random()
    });
  }

  async getPendingOperations(): Promise<any[]> {
    return this.getAll('pendingOps');
  }

  async clearPendingOperation(id: number): Promise<void> {
    await this.delete('pendingOps', id);
  }

  // VHC data operations
  async saveVhcData(jobId: string, data: any): Promise<void> {
    await this.put('vhcData', { jobId, ...data });
  }

  async getVhcData(jobId: string): Promise<any> {
    return this.get('vhcData', jobId);
  }

  // Fit & Finish data operations
  async saveFitFinishData(jobId: string, data: any): Promise<void> {
    await this.put('fitFinishData', { jobId, ...data });
  }

  async getFitFinishData(jobId: string): Promise<any> {
    return this.get('fitFinishData', jobId);
  }

  // Vehicle data operations
  async saveVehicle(vehicle: any): Promise<void> {
    await this.put('vehicles', vehicle);
  }

  async getVehicle(vrm: string): Promise<any> {
    return this.get('vehicles', vrm);
  }

  // Customer data operations
  async saveCustomer(customer: any): Promise<void> {
    await this.put('customers', customer);
  }

  async getCustomer(id: string): Promise<any> {
    return this.get('customers', id);
  }

  // User data operations
  async saveUserData(userData: any): Promise<void> {
    await this.put('userData', userData);
  }

  async getUserData(id: string): Promise<any> {
    return this.get('userData', id);
  }

  // Clear all data (for logout or reset)
  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    
    const storeNames = ['jobs', 'pendingOps', 'vhcData', 'fitFinishData', 'vehicles', 'customers', 'userData'];
    
    for (const storeName of storeNames) {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  }
}

export const offlineStorage = new OfflineStorage();