/**
 * I·AM·Xhe - Developer API Module
 * Provides sandboxed APIs for third-party applications
 */

const XheDevAPI = {
  // App Registry Store Name
  APP_STORE: 'registeredApps',
  
  // ============================================
  // APP REGISTRATION
  // ============================================
  
  async registerApp({ name, description, url, capabilities }) {
    // Generate app DID
    const appSeed = `app:${name}:${Date.now()}`;
    const appDid = `did:xhe:app:${(await XheUtils.sha256(appSeed)).slice(0, 32)}`;
    
    // Get current identity as owner
    const ownerIdentity = await xheIdentity.getCurrentIdentity();
    if (!ownerIdentity) {
      throw new Error('Identity required to register apps');
    }
    
    // Issue policy key for the app
    const policyKey = await xhePolicyKeys.issuePolicyKey(appDid, capabilities);
    
    const app = {
      did: appDid,
      name,
      description,
      url,
      capabilities,
      owner: ownerIdentity.did,
      policyKeyId: policyKey.id,
      registered: Date.now(),
      active: true
    };
    
    // Store in apps registry
    await this._ensureAppStore();
    await xheStorage.put(this.APP_STORE, app);
    
    // Record in pulsar
    await xheKernel.createPulsar('APP_REGISTER', {
      appDid,
      name,
      owner: ownerIdentity.did,
      capabilities,
      policyKeyId: policyKey.id
    });
    
    return app;
  },
  
  async getRegisteredApps() {
    await this._ensureAppStore();
    return await xheStorage.getAll(this.APP_STORE);
  },
  
  async getApp(appDid) {
    await this._ensureAppStore();
    return await xheStorage.get(this.APP_STORE, appDid);
  },
  
  async _ensureAppStore() {
    // Ensure the apps store exists
    if (!xheStorage.db.objectStoreNames.contains(this.APP_STORE)) {
      // Need to upgrade database version
      const currentVersion = xheStorage.db.version;
      xheStorage.db.close();
      
      await new Promise((resolve, reject) => {
        const request = indexedDB.open('XheKernel', currentVersion + 1);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.APP_STORE)) {
            db.createObjectStore(this.APP_STORE, { keyPath: 'did' });
          }
        };
        
        request.onsuccess = () => {
          xheStorage.db = request.result;
          resolve();
        };
        
        request.onerror = () => reject(request.error);
      });
    }
  },
  
  // ============================================
  // PULSE API
  // ============================================
  
  async submitPulse({ appDid, policyKey, operations }) {
    // Verify policy key
    const key = await xheStorage.get('policyKeys', policyKey);
    if (!key || key.revoked) {
      throw new Error('Invalid or revoked policy key');
    }
    
    if (key.holder !== appDid) {
      throw new Error('Policy key does not belong to this app');
    }
    
    // Check WRITE capability
    if (!key.capabilities.includes('WRITE') && !key.capabilities.includes('*')) {
      throw new Error('WRITE capability required');
    }
    
    // Execute operations
    const results = [];
    for (const op of operations) {
      const pulsar = await xheKernel.createPulsar(op.type, {
        ...op.payload,
        _app: appDid,
        _policyKey: policyKey
      });
      results.push(pulsar);
    }
    
    // Record API call
    await xheKernel.createPulsar('API_CALL', {
      api: 'submitPulse',
      app: appDid,
      operationsCount: operations.length
    });
    
    return results;
  },
  
  listenPulsar({ types, callback }) {
    // Store callback for event dispatching
    if (!this._pulsarListeners) {
      this._pulsarListeners = [];
    }
    
    const listener = { types, callback };
    this._pulsarListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this._pulsarListeners.indexOf(listener);
      if (index > -1) {
        this._pulsarListeners.splice(index, 1);
      }
    };
  },
  
  _dispatchPulsar(pulsar) {
    if (!this._pulsarListeners) return;
    
    for (const listener of this._pulsarListeners) {
      if (listener.types.includes(pulsar.type) || listener.types.includes('*')) {
        try {
          listener.callback(pulsar);
        } catch (e) {
          console.error('Pulsar listener error:', e);
        }
      }
    }
  },
  
  // ============================================
  // IDENTITY API
  // ============================================
  
  async getDID() {
    const identity = await xheIdentity.getCurrentIdentity();
    return identity ? identity.did : null;
  },
  
  async derivePolicyKey({ appDid, capabilities }) {
    const identity = await xheIdentity.getCurrentIdentity();
    if (!identity) {
      throw new Error('Identity required');
    }
    
    return await xhePolicyKeys.issuePolicyKey(appDid, capabilities);
  },
  
  async verifyCapability(appDid, policyKeyId, capability) {
    return await xhePolicyKeys.checkCapability(policyKeyId, capability);
  },
  
  // ============================================
  // STORAGE API
  // ============================================
  
  async storeContent({ data, type, appDid, policyKey }) {
    // Verify STORAGE capability if credentials provided
    if (policyKey) {
      const hasCapability = await this.verifyCapability(appDid, policyKey, 'STORAGE');
      if (!hasCapability) {
        throw new Error('STORAGE capability required');
      }
    }
    
    // Generate content hash (CID simulation)
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = await XheUtils.sha256(content);
    const cid = `Qm${hash.slice(0, 44)}`;
    
    // Store in pulsar
    await xheKernel.createPulsar('CONTENT_STORE', {
      cid,
      type: type || 'application/json',
      size: content.length,
      _app: appDid
    });
    
    return { cid, hash, size: content.length };
  },
  
  async retrieveContent({ cid }) {
    // Search for content in pulsars
    const pulsars = await xheKernel.getAllPulsars();
    const contentPulsar = pulsars.find(p => 
      p.type === 'CONTENT_STORE' && p.payload.cid === cid
    );
    
    if (!contentPulsar) {
      throw new Error('Content not found');
    }
    
    return {
      cid,
      metadata: contentPulsar.payload,
      pulseIndex: contentPulsar.index
    };
  },
  
  // ============================================
  // KARMA API
  // ============================================
  
  async getKarma(did) {
    if (!did) {
      const identity = await xheIdentity.getCurrentIdentity();
      did = identity?.did;
    }
    
    if (!did) {
      throw new Error('DID required');
    }
    
    return await xheKarma.getKarma(did);
  },
  
  async rewardKarma({ actorDid, targetDid, reason, amount = 1, appDid, policyKey }) {
    // Verify KARMA_GRANT capability
    if (policyKey) {
      const hasCapability = await this.verifyCapability(appDid, policyKey, 'KARMA_GRANT');
      if (!hasCapability) {
        throw new Error('KARMA_GRANT capability required');
      }
    }
    
    return await xheKarma.addKarma(targetDid, amount, reason);
  },
  
  async getLeaderboard(limit = 10) {
    return await xheKarma.getLeaderboard(limit);
  },
  
  // ============================================
  // SOCIAL API
  // ============================================
  
  async createPost({ content, replyTo, appDid, policyKey }) {
    // Verify SOCIAL_POST capability
    if (policyKey) {
      const hasCapability = await this.verifyCapability(appDid, policyKey, 'SOCIAL_POST');
      if (!hasCapability) {
        throw new Error('SOCIAL_POST capability required');
      }
    }
    
    const identity = await xheIdentity.getCurrentIdentity();
    if (!identity) {
      throw new Error('Identity required');
    }
    
    return await xheSocial.createPost(identity.did, content, replyTo);
  },
  
  async getPosts(limit = 20) {
    return await xheSocial.getPosts(limit);
  },
  
  // ============================================
  // GOVERNANCE API
  // ============================================
  
  async submitProposal({ title, description, type = 'feature' }) {
    const identity = await xheIdentity.getCurrentIdentity();
    if (!identity) {
      throw new Error('Identity required');
    }
    
    return await xheKernel.createPulsar('GOVERNANCE_PROPOSAL', {
      title,
      description,
      type,
      proposer: identity.did,
      votes: { yes: 0, no: 0, abstain: 0 },
      status: 'active'
    });
  },
  
  async vote({ proposalHash, choice, weight = 1 }) {
    const identity = await xheIdentity.getCurrentIdentity();
    if (!identity) {
      throw new Error('Identity required');
    }
    
    return await xheKernel.createPulsar('GOVERNANCE_VOTE', {
      proposalHash,
      voter: identity.did,
      choice,
      weight
    });
  },
  
  async selectFork({ forkId }) {
    return await xheFork.selectFork(forkId);
  },
  
  async createFork({ name, description, fromPulseIndex }) {
    return await xheFork.createFork(name, description, fromPulseIndex);
  },
  
  // ============================================
  // UTILITY METHODS
  // ============================================
  
  async validatePolicyKey(appDid, policyKeyId, requiredCapabilities) {
    const key = await xheStorage.get('policyKeys', policyKeyId);
    
    if (!key) {
      return { valid: false, error: 'Key not found' };
    }
    
    if (key.revoked) {
      return { valid: false, error: 'Key revoked' };
    }
    
    if (key.holder !== appDid) {
      return { valid: false, error: 'Key does not belong to app' };
    }
    
    if (key.expiry && Date.now() > key.expiry) {
      return { valid: false, error: 'Key expired' };
    }
    
    const missingCaps = requiredCapabilities.filter(cap => 
      !key.capabilities.includes(cap) && !key.capabilities.includes('*')
    );
    
    if (missingCaps.length > 0) {
      return { valid: false, error: `Missing capabilities: ${missingCaps.join(', ')}` };
    }
    
    return { valid: true, key };
  },
  
  // Schema validation for pulsar payloads
  validateSchema(payload, schema) {
    // Simple schema validation
    for (const [key, type] of Object.entries(schema)) {
      if (type.required && payload[key] === undefined) {
        return { valid: false, error: `Missing required field: ${key}` };
      }
      
      if (payload[key] !== undefined && typeof payload[key] !== type.type) {
        return { valid: false, error: `Invalid type for ${key}: expected ${type.type}` };
      }
    }
    
    return { valid: true };
  }
};

// Capability schemas for deterministic enforcement
const CapabilitySchemas = {
  READ: {
    description: 'Read ledger data, fetch content, view karma',
    operations: ['query', 'fetch', 'view']
  },
  WRITE: {
    description: 'Submit pulsars, store content',
    operations: ['submitPulse', 'storeContent']
  },
  SOCIAL_POST: {
    description: 'Create posts, reply to threads',
    operations: ['createPost', 'reply']
  },
  KARMA_GRANT: {
    description: 'Award karma to users',
    operations: ['rewardKarma']
  },
  STORAGE: {
    description: 'Access IPFS storage',
    operations: ['storeContent', 'retrieveContent', 'pin']
  },
  DELEGATE: {
    description: 'Issue sub-policy keys',
    operations: ['derivePolicyKey']
  },
  ADMIN: {
    description: 'Full system access',
    operations: ['*']
  }
};

// Pulsar type schemas
const PulsarSchemas = {
  APP_REGISTER: {
    appDid: { type: 'string', required: true },
    name: { type: 'string', required: true },
    owner: { type: 'string', required: true },
    capabilities: { type: 'object', required: true }
  },
  CONTENT_STORE: {
    cid: { type: 'string', required: true },
    type: { type: 'string', required: false },
    size: { type: 'number', required: false }
  },
  API_CALL: {
    api: { type: 'string', required: true },
    app: { type: 'string', required: false }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { XheDevAPI, CapabilitySchemas, PulsarSchemas };
}
