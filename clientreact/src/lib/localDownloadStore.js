const DB_NAME = 'webharbour_downloads';
const STORE_NAME = 'downloads';
const DB_VERSION = 1;

const supportsIndexedDB = () => typeof indexedDB !== 'undefined';

const openDb = () =>
  new Promise((resolve, reject) => {
    if (!supportsIndexedDB()) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('appId', 'appId', { unique: false });
        store.createIndex('versionId', 'versionId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runStoreRequest = async (mode, callback) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    let request;
    try {
      request = callback(store);
    } catch (err) {
      reject(err);
      return;
    }
    if (request) {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } else {
      resolve();
    }
    tx.onabort = () => reject(tx.error);
  });
};

const buildDownloadKey = (appId, versionId) => `${String(appId)}:${String(versionId)}`;

const getStoredDownload = async (key) => runStoreRequest('readonly', (store) => store.get(key));

const saveStoredDownload = async (record) => runStoreRequest('readwrite', (store) => store.put(record));

const deleteStoredDownload = async (key) => runStoreRequest('readwrite', (store) => store.delete(key));

const triggerBlobDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'download';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export {
  supportsIndexedDB,
  buildDownloadKey,
  getStoredDownload,
  saveStoredDownload,
  deleteStoredDownload,
  triggerBlobDownload,
};
