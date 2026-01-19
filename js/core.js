/**
 * I·AM·Xhe - Core JavaScript Module
 * Sovereign Identity-First Append-Only Civilization Fabric
 */
// ============================================
// HELIA IPFS INTEGRATION
// ============================================
let heliaNode = null;

async function initHelia() {
  if (heliaNode) return heliaNode;
  try {
    if (!window.Helia?.create) {
      throw new Error('Helia library not loaded');
    }
    heliaNode = await window.Helia.create();
    console.log('Helia node initialized');
    return heliaNode;
  } catch (err) {
    console.error('Helia initialization failed:', err);
    throw err;
  }
}

async function publishToHelia(content) {
  if (!heliaNode) await initHelia();
  const bytes = new TextEncoder().encode(content);
  const { cid } = await heliaNode.add(bytes);
  return cid.toString();
}

async function getFromHelia(cidString) {
  if (!heliaNode) await initHelia();
  const cid = await heliaNode.get(cidString);
  const chunks = [];
  for await (const chunk of cid) {
    chunks.push(chunk);
  }
  const bytes = new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []));
  return new TextDecoder().decode(bytes);
}

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================
const XHE_CONFIG = {
  version: '1.0.0',
  dbName: 'XheKernel',
  dbVersion: 4,
  stores: {
    pulsars: 'pulsars',
    identity: 'identity',
    policyKeys: 'policyKeys',
    karma: 'karma',
    social: 'social',
    forks: 'forks'
  },
  ollamaEndpoint: 'http://localhost:11434',
  ipfsGateway: 'https://ipfs.io/ipfs/'
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
const XheUtils = {
  getRandomBytes(length) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  },
  bytesToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },
  hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  },
  async sha256(data) {
    const encoder = new TextEncoder();
    const buffer = typeof data === 'string' ? encoder.encode(data) : data;
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return this.bytesToHex(new Uint8Array(hashBuffer));
  },
  async deterministicId(seed, index = 0) {
    const data = `${seed}:${index}`;
    return await this.sha256(data);
  },
  formatHash(hash, length = 8) {
    if (!hash) return '—';
    return `${hash.slice(0, length)}...${hash.slice(-length)}`;
  },
  formatPulseIndex(index) {
    return `P#${String(index).padStart(6, '0')}`;
  },
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  generateMnemonic(wordCount = 12) {
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
      'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
      'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
      'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
      'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
      'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
      'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone',
      'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among',
      'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry',
      'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique',
      'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april',
      'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor',
      'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact',
      'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume',
      'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction',
      'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado',
      'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis',
      'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball',
      'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base',
      'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become',
      'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt',
      'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle',
      'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black',
      'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood',
      'blossom', 'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body',
      'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring',
      'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain',
      'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief',
      'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother',
      'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb',
      'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus',
      'business', 'busy', 'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable'
    ];
    const mnemonic = [];
    const bytes = this.getRandomBytes(wordCount);
    for (let i = 0; i < wordCount; i++) {
      mnemonic.push(words[bytes[i] % words.length]);
    }
    return mnemonic.join(' ');
  },
  log(message, type = 'info', consoleId = 'xhe-console') {
    const consoleEl = document.getElementById(consoleId);
    if (!consoleEl) return;
    const line = document.createElement('div');
    line.className = 'xhe-console-line';
    line.innerHTML = `<span class="xhe-console-timestamp">[${new Date().toISOString().slice(11, 19)}]</span> <span class="xhe-console-${type}">${message}</span>`;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }
};

// ============================================
// INDEXEDDB STORAGE
// ============================================
class XheStorage {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(XHE_CONFIG.dbName, XHE_CONFIG.dbVersion);

      request.onerror = () => {
        const err = request.error || new Error('IndexedDB open failed');
        console.error('IndexedDB open error:', err);
        reject(err);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log(`IndexedDB "${XHE_CONFIG.dbName}" opened (v${XHE_CONFIG.dbVersion})`);
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('pulsars')) {
          const pulsarStore = db.createObjectStore('pulsars', { keyPath: 'hash' });
          pulsarStore.createIndex('index', 'index', { unique: true });
          pulsarStore.createIndex('type', 'type', { unique: false });
        }
        if (!db.objectStoreNames.contains('identity')) {
          db.createObjectStore('identity', { keyPath: 'did' });
        }
        if (!db.objectStoreNames.contains('policyKeys')) {
          const keyStore = db.createObjectStore('policyKeys', { keyPath: 'id' });
          keyStore.createIndex('holder', 'holder', { unique: false });
          keyStore.createIndex('revoked', 'revoked', { unique: false });
        }
        if (!db.objectStoreNames.contains('karma')) {
          const karmaStore = db.createObjectStore('karma', { keyPath: 'did' });
          karmaStore.createIndex('score', 'score', { unique: false });
        }
        if (!db.objectStoreNames.contains('social')) {
          const socialStore = db.createObjectStore('social', { keyPath: 'id' });
          socialStore.createIndex('author', 'author', { unique: false });
          socialStore.createIndex('pulseIndex', 'pulseIndex', { unique: false });
        }
        if (!db.objectStoreNames.contains('forks')) {
          db.createObjectStore('forks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('entropy')) {
          db.createObjectStore('entropy', { keyPath: 'id' });
        }
      };

      request.onblocked = () => {
        console.warn('IndexedDB open blocked – another tab/version is using it');
        reject(new Error('IndexedDB blocked by another tab'));
      };
    });
  }

  _ensureDb() {
    if (!this.db) {
      throw new Error('Database not open – call and await init() first');
    }
  }

  async put(storeName, data) {
    this._ensureDb();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  async get(storeName, key) {
    this._ensureDb();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAll(storeName) {
    this._ensureDb();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(storeName, key) {
    this._ensureDb();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async count(storeName) {
    this._ensureDb();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async clear(storeName) {
    this._ensureDb();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async exportAll() {
    this._ensureDb();
    const data = {};
    const storeNames = Array.from(this.db.objectStoreNames);
    for (const name of storeNames) {
      data[name] = await this.getAll(name);
    }
    return data;
  }

  async importAll(data) {
    this._ensureDb();
    for (const [storeName, items] of Object.entries(data)) {
      if (this.db.objectStoreNames.contains(storeName)) {
        for (const item of items) {
          await this.put(storeName, item);
        }
      }
    }
  }
}

// ============================================
// PULSAR KERNEL
// ============================================
class XheKernel {
  constructor(storage) {
    this.storage = storage;
    this.currentIndex = 0;
    this.fuelLimit = 1000000;
  }

  async init() {
    const pulsars = await this.storage.getAll('pulsars');
    this.currentIndex = pulsars.length;
    return this;
  }

  async createPulsar(type, payload, parentHash = null) {
    const index = this.currentIndex++;
    const pulsar = {
      index,
      type,
      payload,
      parentHash,
      timestamp: Date.now(),
      fuel: 0
    };
    const hashInput = JSON.stringify({
      index: pulsar.index,
      type: pulsar.type,
      payload: pulsar.payload,
      parentHash: pulsar.parentHash
    });
    pulsar.hash = await XheUtils.sha256(hashInput);
    await this.storage.put('pulsars', pulsar);
    return pulsar;
  }

  async getPulsar(hash) {
    return await this.storage.get('pulsars', hash);
  }

  async getAllPulsars() {
    return await this.storage.getAll('pulsars');
  }

  async getLatestPulsars(count = 10) {
    const all = await this.getAllPulsars();
    return all.sort((a, b) => a.index - b.index).slice(-count);
  }

  async replayPulsars(fromIndex = 0) {
    const pulsars = await this.getAllPulsars();
    const results = [];
    for (const pulsar of pulsars) {
      if (pulsar.index >= fromIndex) {
        const hashInput = JSON.stringify({
          index: pulsar.index,
          type: pulsar.type,
          payload: pulsar.payload,
          parentHash: pulsar.parentHash
        });
        const calculatedHash = await XheUtils.sha256(hashInput);
        results.push({
          ...pulsar,
          valid: calculatedHash === pulsar.hash
        });
      }
    }
    return results;
  }
}

// ============================================
// IDENTITY MODULE
// ============================================
class XheIdentity {
  constructor(storage, kernel) {
    this.storage = storage;
    this.kernel = kernel;
    this.currentIdentity = null;
  }

  async init() {
    const identities = await this.storage.getAll('identity');
    if (identities.length > 0) {
      this.currentIdentity = identities[0];
    }
    return this;
  }

  async createIdentity(mnemonic = null) {
    if (!mnemonic) {
      mnemonic = XheUtils.generateMnemonic(12);
    }
    const masterSeed = await XheUtils.sha256(mnemonic);
    const did = `did:xhe:${masterSeed.slice(0, 32)}`;
    const identity = {
      did,
      mnemonic,
      masterSeed,
      created: Date.now(),
      publicKeys: {
        signing: await XheUtils.deterministicId(masterSeed, 0),
        encryption: await XheUtils.deterministicId(masterSeed, 1)
      }
    };
    await this.storage.put('identity', identity);
    await this.kernel.createPulsar('IDENTITY_CREATE', {
      did: identity.did,
      publicKeys: identity.publicKeys
    });
    this.currentIdentity = identity;
    return identity;
  }

  async recoverIdentity(mnemonic) {
    await this.storage.clear('identity');
    return await this.createIdentity(mnemonic);
  }

  async getCurrentIdentity() {
    return this.currentIdentity;
  }

  async verifyIdentity(did, signature, message) {
    const identity = await this.storage.get('identity', did);
    if (!identity) return false;
    const expectedSig = await XheUtils.sha256(`${message}:${identity.publicKeys.signing}`);
    return signature === expectedSig;
  }
}

// ============================================
// POLICY KEY MODULE
// ============================================
class XhePolicyKeys {
  constructor(storage, kernel) {
    this.storage = storage;
    this.kernel = kernel;
  }

  async issuePolicyKey(holderDid, capabilities, expiry = null) {
    const id = await XheUtils.sha256(`${holderDid}:${Date.now()}:${Math.random()}`);
    const policyKey = {
      id,
      holder: holderDid,
      capabilities,
      expiry,
      revoked: false,
      issuedAt: Date.now()
    };
    await this.storage.put('policyKeys', policyKey);
    await this.kernel.createPulsar('POLICY_KEY_ISSUE', {
      keyId: id,
      holder: holderDid,
      capabilities
    });
    return policyKey;
  }

  async revokePolicyKey(keyId) {
    const key = await this.storage.get('policyKeys', keyId);
    if (!key) throw new Error('Policy key not found');
    key.revoked = true;
    key.revokedAt = Date.now();
    await this.storage.put('policyKeys', key);
    await this.kernel.createPulsar('POLICY_KEY_REVOKE', { keyId });
    return key;
  }

  async checkCapability(keyId, capability) {
    const key = await this.storage.get('policyKeys', keyId);
    if (!key) return false;
    if (key.revoked) return false;
    if (key.expiry && Date.now() > key.expiry) return false;
    return key.capabilities.includes(capability) || key.capabilities.includes('*');
  }

  async getKeysByHolder(holderDid) {
    const allKeys = await this.storage.getAll('policyKeys');
    return allKeys.filter(k => k.holder === holderDid && !k.revoked);
  }

  async getAllKeys() {
    return await this.storage.getAll('policyKeys');
  }
}

// ============================================
// AI AGENT MODULE
// ============================================
class XheAIAgent {
  constructor(endpoint = XHE_CONFIG.ollamaEndpoint) {
    this.endpoint = endpoint;
    this.available = false;
  }

  async checkAvailability() {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      this.available = response.ok;
      return this.available;
    } catch {
      this.available = false;
      return false;
    }
  }

  async getModels() {
    if (!this.available) return [];
    try {
      const response = await fetch(`${this.endpoint}/api/tags`);
      const data = await response.json();
      return data.models || [];
    } catch {
      return [];
    }
  }

  async query(prompt, model = 'llama2', options = {}) {
    if (!this.available) {
      return { success: false, error: 'AI agent not available', advisory: true };
    }
    try {
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          ...options
        })
      });
      const data = await response.json();
      return {
        success: true,
        response: data.response,
        advisory: true,
        model,
        timestamp: Date.now()
      };
    } catch (error) {
      return { success: false, error: error.message, advisory: true };
    }
  }

  async explain(topic) {
    return await this.query(
      `As a sovereign identity system advisor, explain the following concept concisely: ${topic}`,
      'llama2'
    );
  }

  async simulate(scenario) {
    return await this.query(
      `Simulate the following scenario in a sovereign identity system and describe potential outcomes: ${scenario}`,
      'mistral'
    );
  }

  async flagAnomalies(data) {
    return await this.query(
      `Analyze this data for potential anomalies or security concerns in a sovereign identity context: ${JSON.stringify(data)}`,
      'phi'
    );
  }
}

// ============================================
// KARMA MODULE
// ============================================
class XheKarma {
  constructor(storage, kernel) {
    this.storage = storage;
    this.kernel = kernel;
  }

  async getKarma(did) {
    const karma = await this.storage.get('karma', did);
    return karma || { did, score: 0, history: [] };
  }

  async addKarma(did, amount, reason) {
    const karma = await this.getKarma(did);
    karma.score += amount;
    karma.history.push({ amount, reason, timestamp: Date.now() });
    await this.storage.put('karma', karma);
    await this.kernel.createPulsar('KARMA_CHANGE', {
      did,
      amount,
      reason,
      newScore: karma.score
    });
    return karma;
  }

  async getLeaderboard(limit = 10) {
    const allKarma = await this.storage.getAll('karma');
    return allKarma.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}

// ============================================
// SOCIAL LAYER MODULE
// ============================================
class XheSocial {
  constructor(storage, kernel) {
    this.storage = storage;
    this.kernel = kernel;
  }

  async createPost(authorDid, content, replyTo = null) {
    const id = await XheUtils.sha256(`${authorDid}:${content}:${Date.now()}`);
    const post = {
      id,
      author: authorDid,
      content,
      replyTo,
      pulseIndex: (await this.kernel.getAllPulsars()).length,
      created: Date.now()
    };
    await this.storage.put('social', post);
    await this.kernel.createPulsar('SOCIAL_POST', {
      postId: id,
      author: authorDid,
      replyTo
    });
    return post;
  }

  async getPosts(limit = 20) {
    const posts = await this.storage.getAll('social');
    return posts
      .filter(p => !p.replyTo)
      .sort((a, b) => b.created - a.created)
      .slice(0, limit);
  }

  async getReplies(postId) {
    const posts = await this.storage.getAll('social');
    return posts
      .filter(p => p.replyTo === postId)
      .sort((a, b) => a.created - b.created);
  }

  async getPostsByAuthor(authorDid) {
    const posts = await this.storage.getAll('social');
    return posts
      .filter(p => p.author === authorDid)
      .sort((a, b) => b.created - a.created);
  }
}

// ============================================
// FORK GOVERNANCE MODULE
// ============================================
class XheForkGovernance {
  constructor(storage, kernel) {
    this.storage = storage;
    this.kernel = kernel;
  }

  async createFork(name, description, fromPulseIndex) {
    const id = await XheUtils.sha256(`fork:${name}:${Date.now()}`);
    const fork = {
      id,
      name,
      description,
      fromPulseIndex,
      created: Date.now(),
      active: true
    };
    await this.storage.put('forks', fork);
    await this.kernel.createPulsar('FORK_CREATE', {
      forkId: id,
      name,
      fromPulseIndex
    });
    return fork;
  }

  async getForks() {
    return await this.storage.getAll('forks');
  }

  async selectFork(forkId) {
    const fork = await this.storage.get('forks', forkId);
    if (!fork) throw new Error('Fork not found');
    await this.kernel.createPulsar('FORK_SELECT', { forkId });
    return fork;
  }
}

// ============================================
// EXPORT / IMPORT SURVIVAL RITUAL
// ============================================
class XheSurvival {
  constructor(storage) {
    this.storage = storage;
  }

  async exportArchive() {
    const data = await this.storage.exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xhe-archive-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return data;
  }

  async importArchive(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await this.storage.importAll(data);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}

// ============================================
// NAVIGATION & UI HELPERS
// ============================================
const XheNav = {
  modules: [
    { id: '00', name: 'Kernel', file: '00-kernel.html' },
    { id: '01', name: 'Entropy', file: '01-entropy.html' },
    { id: '02', name: 'Identity', file: '02-identity.html' },
    { id: '03', name: 'Policy Keys', file: '03-policy-keys.html' },
    { id: '04', name: 'AI Agents', file: '04-ai-agents.html' },
    { id: '05', name: 'Addressing', file: '05-addressing-rails.html' },
    { id: '06', name: 'Storage', file: '06-storage-rendering.html' },
    { id: '07', name: 'Revocation', file: '07-revocation-compensation.html' },
    { id: '08', name: 'Karma', file: '08-karma-rewards.html' },
    { id: '09', name: 'Social', file: '09-social-layer.html' },
    { id: '10', name: 'Governance', file: '10-fork-governance.html' },
    { id: '11', name: 'Explorer', file: '11-verification-explorer.html' },
    { id: '12', name: 'Developer', file: '12-developer-portal.html', isDev: true },
    { id: '99', name: 'Constitution', file: '99-constitution.html' }
  ],

  getCurrentModule() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    return this.modules.find(m => m.file === filename) || this.modules[this.modules.length - 1];
  },

  renderNavigation(containerId = 'xhe-nav') {
    const container = document.getElementById(containerId);
    if (!container) return;
    const current = this.getCurrentModule();
    const coreModules = this.modules.filter(m => !m.isDev && m.id !== '99');
    const devModules = this.modules.filter(m => m.isDev);
    const constitution = this.modules.find(m => m.id === '99');

    let html = coreModules.map(m => `
      <a href="${m.file}"
         class="xhe-nav-link ${m.id === current.id ? 'active' : ''}"
         data-testid="nav-${m.id}">
        <span class="nav-index">${m.id}</span>
        <span>${m.name}</span>
      </a>
    `).join('');

    if (devModules.length > 0) {
      html += `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle);">
        <span style="font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Developer</span>
      </div>`;
      html += devModules.map(m => `
        <a href="${m.file}"
           class="xhe-nav-link ${m.id === current.id ? 'active' : ''}"
           data-testid="nav-${m.id}">
          <span class="nav-index">${m.id}</span>
          <span>${m.name}</span>
        </a>
      `).join('');
    }

    if (constitution) {
      html += `<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle);"></div>`;
      html += `
        <a href="${constitution.file}"
           class="xhe-nav-link ${constitution.id === current.id ? 'active' : ''}"
           data-testid="nav-${constitution.id}">
          <span class="nav-index">${constitution.id}</span>
          <span>${constitution.name}</span>
        </a>
      `;
    }

    container.innerHTML = html;
  },

  toggleMobileNav() {
    const sidebar = document.querySelector('.xhe-sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  }
};

// ============================================
// GLOBAL MODULE REFERENCES
// ============================================
let xheStorage = null;
let xheKernel = null;
let xheIdentity = null;
let xhePolicyKeys = null;
let xheAI = null;
let xheKarma = null;
let xheSocial = null;
let xheFork = null;
let xheSurvival = null;

// ============================================
// INIT FUNCTION
// ============================================
async function initXhe() {
  try {
    xheStorage = xheStorage || new XheStorage();

    try {
      await xheStorage.init();
    } catch (err) {
      console.error('Critical: Storage initialization failed – aborting core init', err);
      if (typeof XheUtils?.log === 'function') {
        XheUtils.log('Storage initialization failed – many features unavailable', 'error');
      }
      return false;
    }

    if (!xheStorage.db) {
      throw new Error('Database connection not established after init');
    }

    xheKernel = xheKernel || new XheKernel(xheStorage);
    await xheKernel.init();

    xheIdentity = xheIdentity || new XheIdentity(xheStorage, xheKernel);
    await xheIdentity.init();

    xhePolicyKeys = xhePolicyKeys || new XhePolicyKeys(xheStorage, xheKernel);
    xheKarma     = xheKarma     || new XheKarma(xheStorage, xheKernel);
    xheSocial    = xheSocial    || new XheSocial(xheStorage, xheKernel);
    xheFork      = xheFork      || new XheForkGovernance(xheStorage, xheKernel);
    xheSurvival  = xheSurvival  || new XheSurvival(xheStorage);

    xheAI = xheAI || new XheAIAgent();
    xheAI.checkAvailability().catch(() => {});

    if (typeof XheNav?.renderNavigation === 'function') {
      XheNav.renderNavigation();
    }

    console.log('I·AM·Xhe initialized successfully');
    return true;
  } catch (err) {
    console.error('I·AM·Xhe initialization failed:', err);
    return false;
  }
}

// ============================================
// AUTO START
// ============================================
function startXhe() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initXhe, { once: true });
  } else {
    initXhe();
  }
}

if (typeof window !== 'undefined') {
  startXhe();
}

// ============================================
// EXPORT / BROWSER ACCESS
// ============================================
window.xhe = {
  get storage()     { return xheStorage; },
  get kernel()      { return xheKernel; },
  get identity()    { return xheIdentity; },
  get policyKeys()  { return xhePolicyKeys; },
  get ai()          { return xheAI; },
  get karma()       { return xheKarma; },
  get social()      { return xheSocial; },
  get fork()        { return xheFork; },
  get survival()    { return xheSurvival; },

  XheStorage,
  XheKernel,
  XheIdentity,
  XhePolicyKeys,
  XheAIAgent,
  XheKarma,
  XheSocial,
  XheForkGovernance,
  XheSurvival,

  XheUtils,
  XheNav,
  XHE_CONFIG,
  initXhe,
  startXhe
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.xhe;
}