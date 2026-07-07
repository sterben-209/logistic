import CryptoJS from 'crypto-js';
import { get, set } from 'idb-keyval';

export const MOCK_WORKERS = {
  GATE: { name: "Nguyễn Văn Trưởng (Cổng 1)", wallet: "0x71C4B436792C64e2611cC152411e4740e68331bc" },
  CRANE_DRY: { name: "Trần Đình Cẩu (Bãi Khô)", wallet: "0x3C4X7153592C64e2611cC152411e4740e68332de" },
  CRANE_HAZARDOUS: { name: "Lê Văn An (Bãi Hóa Chất)", wallet: "0x95222290DD7278Aa3Dddd389Cc1E1d165CC4BAfe" }
};

/**
 * Creates a SHA-256 hash from data and previous hash
 * @param {Object} data The payload data to hash
 * @param {string} previousHash The hash of the previous block
 * @returns {string} The computed SHA-256 hash
 */
export const generateHash = (data, previousHash) => {
  return CryptoJS.SHA256(JSON.stringify(data) + previousHash).toString(CryptoJS.enc.Hex);
};

/**
 * Logs an audit event into the Hash Chain
 * @param {string} userId Name of the mock worker or system user
 * @param {string} action The action performed
 * @param {string} targetId The ID of the container or subject
 * @param {Object} details Additional details about the action including wallet signature
 */
export const logAuditEvent = async (userId, action, targetId, details = {}) => {
  try {
    // 1. Fetch the existing logs from IndexedDB
    const existingLogs = await get('nexus_audit_logs') || [];
    
    // 2. Get the previous hash (latest log is at the end of the array)
    const previousHash = existingLogs.length > 0 
      ? existingLogs[existingLogs.length - 1].currentHash 
      : 'GENESIS_BLOCK';

    // 3. Create the payload
    const payload = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      containerId: targetId || userId, // Fallback for backward compatibility
      action,
      details: { ...details, signerName: userId }, // Store signer name in details too
      timestamp: new Date().toISOString(),
      previousHash
    };

    // 4. Calculate current hash
    const currentHash = generateHash(
      { containerId: payload.containerId, action: payload.action, details: payload.details, timestamp: payload.timestamp }, 
      previousHash
    );

    // 5. Save back to IndexedDB
    const newLog = {
      id: payload.id,
      containerId: payload.containerId,
      action: payload.action,
      details: payload.details,
      timestamp: payload.timestamp,
      previousHash: payload.previousHash,
      currentHash: currentHash
    };

    await set('nexus_audit_logs', [...existingLogs, newLog]);
    
    return true;
  } catch (error) {
    console.error("Audit Logging failed:", error);
    return false;
  }
};
