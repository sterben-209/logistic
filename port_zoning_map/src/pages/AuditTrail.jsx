/**
 * AuditTrail Page
 * 
 * Blockchain-style immutable audit trail viewer for port operations.
 * 
 * Key Features:
 * - Hash-chain integrity verification: validates SHA-256 hash links between consecutive logs
 * - Cryptographic verification: each log contains previousHash and currentHash
 * - Block integrity check: recalculates hash from data and compares with stored hash
 * - IndexedDB persistence: logs stored in 'nexus_audit_logs' for offline access
 * - Worker verification: displays wallet addresses of personnel who performed actions
 * - Real-time status: shows verification result (success/error) with visual indicators
 * 
 * Hash Chain Structure:
 * - Log[0]: previousHash = "GENESIS_BLOCK"
 * - Log[i]: previousHash = Log[i-1].currentHash
 * - Log[i]: currentHash = SHA256(containerId + action + details + timestamp + previousHash)
 * - Any tampering = hash mismatch = detected violation
 * 
 * Verification Flow:
 * 1. Fetch all logs from IndexedDB (oldest first)
 * 2. Loop through logs sequentially
 * 3. For each log: verify previousHash link to prior log
 * 4. For each log: recalculate SHA-256, compare with stored hash
 * 5. If any mismatch found: mark as invalid and highlight row
 * 6. Display result with affected record ID
 * 
 * UI Components:
 * - Verification status banner (green success / red error)
 * - Data table with columns: timestamp, container ID, action, worker wallet, details, hash
 * - Control buttons: Refresh, Verify Integrity, Clear History
 * - Invalid rows highlighted in red for quick spotting of tampering
 * 
 * @component
 * @returns {JSX.Element} Full-page audit trail viewer with verification tools
 */
import React, { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { generateHash } from '../services/auditService';

/**
 * AuditTrail Component
 * Displays and verifies hash-chain audit logs
 * @component
 */
const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null); // null, 'success', 'error'
  const [invalidRowId, setInvalidRowId] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await get('nexus_audit_logs') || [];
      // IndexedDB array has oldest first (we appended), so reverse it to show newest first
      const sortedData = [...data].reverse();
      setLogs(sortedData);
      setVerificationResult(null);
      setInvalidRowId(null);
      setVerificationMessage('');
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const verifyChainIntegrity = async () => {
    setLoading(true);
    setVerificationMessage('Đang kiểm tra toàn vẹn dữ liệu...');
    
    try {
      // Fetch all logs ordered by oldest first to reconstruct chain
      const data = await get('nexus_audit_logs') || [];

      if (!data || data.length === 0) {
        setVerificationResult('success');
        setVerificationMessage('Không có dữ liệu để kiểm tra.');
        setLoading(false);
        return;
      }

      let isValid = true;
      let errorRow = null;

      for (let i = 0; i < data.length; i++) {
        const currentLog = data[i];
        
        // 1. Verify previous hash link (except for genesis log or first in DB if chain broken earlier)
        if (i > 0) {
          const prevLog = data[i - 1];
          if (currentLog.previousHash !== prevLog.currentHash) {
            isValid = false;
            errorRow = currentLog.id;
            break;
          }
        } else {
          // If it's the first log we fetched, it might not be the actual genesis, but we assume it is if previousHash is GENESIS_BLOCK
          // If it's not GENESIS_BLOCK, we can't fully verify the link to the past without all data. Assuming full fetch here.
        }

        // 2. Verify current hash calculation
        const expectedHash = generateHash({
          containerId: currentLog.containerId,
          action: currentLog.action,
          details: currentLog.details,
          timestamp: currentLog.timestamp
        }, currentLog.previousHash);

        if (currentLog.currentHash !== expectedHash) {
          isValid = false;
          errorRow = currentLog.id;
          break;
        }
      }

      if (isValid) {
        setVerificationResult('success');
        setVerificationMessage('Dữ liệu toàn vẹn 100%');
        setInvalidRowId(null);
      } else {
        setVerificationResult('error');
        setVerificationMessage('Phát hiện can thiệp dữ liệu!');
        setInvalidRowId(errorRow);
      }
    } catch (error) {
      console.error("Verification failed:", error);
      setVerificationResult('error');
      setVerificationMessage('Lỗi hệ thống khi kiểm tra!');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử Audit? Hành động này không thể hoàn tác.")) return;
    setLoading(true);
    try {
      await set('nexus_audit_logs', []);
      setLogs([]);
      setVerificationResult(null);
      setInvalidRowId(null);
      setVerificationMessage('Đã xóa toàn bộ lịch sử hệ thống.');
    } catch (error) {
      console.error("Lỗi khi xóa lịch sử:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatHash = (hash) => {
    if (!hash) return '';
    return hash.length > 10 ? `0x${hash.substring(0, 8)}...` : hash;
  };

  const formatDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleString('vi-VN');
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen text-on-surface">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-display-sm font-bold text-primary flex items-center gap-3">
            <span className="material-symbols-outlined text-4xl">security</span>
            Hash-Chain Audit Trail
          </h1>
          <p className="text-on-surface-variant mt-2">Lưu vết lịch sử chống chối cãi bằng Blockchain nội bộ</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors flex items-center gap-2 border border-outline/30 shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Làm mới
          </button>
          <button 
            onClick={verifyChainIntegrity}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-primary text-on-primary font-medium hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">shield</span>
            Kiểm tra toàn vẹn
          </button>
          <button 
            onClick={clearLogs}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-error text-white font-medium hover:bg-error/90 transition-colors shadow-md flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Xóa lịch sử
          </button>
        </div>
      </div>

      {verificationMessage && (
        <div className={`p-4 mb-6 rounded-xl flex items-center gap-3 font-medium shadow-sm border ${verificationResult === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
           <span className="material-symbols-outlined">
             {verificationResult === 'success' ? 'check_circle' : 'warning'}
           </span>
           {verificationMessage}
        </div>
      )}

      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant/30 text-on-surface-variant text-sm">
                <th className="p-4 font-semibold">Thời gian</th>
                <th className="p-4 font-semibold">Mã Đối tượng (Container/User)</th>
                <th className="p-4 font-semibold">Hành động</th>
                <th className="p-4 font-semibold">Địa chỉ ví người ký (Signer)</th>
                <th className="p-4 font-semibold">Chi tiết</th>
                <th className="p-4 font-semibold">Mã Hash (Current)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-on-surface-variant">
                    {loading ? 'Đang tải dữ liệu...' : 'Chưa có bản ghi Audit nào.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className={`transition-colors ${invalidRowId === log.id ? 'bg-red-500/20 hover:bg-red-500/30' : 'hover:bg-surface-container-highest/30'} ${verificationResult === 'success' ? 'bg-green-500/5' : ''}`}
                  >
                    <td className="p-4 text-sm whitespace-nowrap text-on-surface-variant">{formatDate(log.timestamp)}</td>
                    <td className="p-4 font-medium text-primary">{log.containerId}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-primary-container text-on-primary-container text-xs rounded-md font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.details && log.details.workerWalletAddress ? (
                        <div className="flex items-center gap-1.5" title={log.details.workerWalletAddress}>
                          <span className="material-symbols-outlined text-[14px] text-tertiary">account_balance_wallet</span>
                          <span className="font-mono text-sm text-on-surface-variant">{formatHash(log.details.workerWalletAddress)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-outline-variant italic">N/A</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="p-4 font-mono text-sm text-tertiary">
                      <div className="flex items-center gap-2" title={log.currentHash}>
                        <span className="material-symbols-outlined text-[16px] text-tertiary/70">tag</span>
                        {formatHash(log.currentHash)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;
