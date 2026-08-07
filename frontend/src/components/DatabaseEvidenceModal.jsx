import React, { useState, useEffect } from 'react';
import { Database, Server, ShieldCheck, RefreshCw, X, FileText, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export default function DatabaseEvidenceModal({ isOpen, onClose, authToken }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDatabaseActivity = async () => {
    if (!authToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/system/database-activity', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setError('Failed to fetch database activity.');
      }
    } catch (err) {
      setError('Error connecting to database audit API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDatabaseActivity();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-dark-800 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/70 flex items-center justify-between bg-dark-900/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                System Evidence & Database Activity
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  LIVE PERSISTENT DB
                </span>
              </h2>
              <p className="text-xs text-slate-400">Real-time audit evidence showing transaction persistence across the 4-agent pipeline.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDatabaseActivity}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition"
              title="Refresh Database Evidence"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Database Infrastructure Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-700/60">
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 font-mono">Storage Engine</span>
                <p className="text-sm font-semibold text-slate-200">{data?.storage_type || 'Persistent SQLite'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 font-mono">Effective Database Path</span>
                <p className="text-xs font-mono text-cyan-300 truncate max-w-xs">{data?.effective_database_path || 'fraudguard.db'}</p>
              </div>
            </div>
          </div>

          {/* Database Record Counters */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> Database Table Record Counters
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-dark-900/80 border border-slate-700/60 text-center">
                <span className="text-[11px] text-slate-400 block font-mono">Invoices</span>
                <span className="text-xl font-extrabold text-white">{data?.counters?.total_invoices ?? '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900/80 border border-slate-700/60 text-center">
                <span className="text-[11px] text-slate-400 block font-mono">Vendors</span>
                <span className="text-xl font-extrabold text-cyan-300">{data?.counters?.total_vendors ?? '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900/80 border border-slate-700/60 text-center">
                <span className="text-[11px] text-slate-400 block font-mono">Purchase Orders</span>
                <span className="text-xl font-extrabold text-indigo-300">{data?.counters?.total_purchase_orders ?? '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900/80 border border-slate-700/60 text-center">
                <span className="text-[11px] text-slate-400 block font-mono">Goods Receipts</span>
                <span className="text-xl font-extrabold text-amber-300">{data?.counters?.total_goods_receipts ?? '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900/80 border border-slate-700/60 text-center">
                <span className="text-[11px] text-slate-400 block font-mono">Payment Ledger</span>
                <span className="text-xl font-extrabold text-emerald-300">{data?.counters?.total_payment_ledger_records ?? '-'}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900/80 border border-slate-700/60 text-center">
                <span className="text-[11px] text-slate-400 block font-mono">Fraud Blocked</span>
                <span className="text-xl font-extrabold text-rose-400">{data?.counters?.fraud_detections ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* Persisted Invoice Activity Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" /> Recent Persisted Transactions (`invoices` table)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-dark-900/60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-700/70">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Vendor / Entity</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Risk Score</th>
                    <th className="p-3">AI Verdict</th>
                    <th className="p-3">Risk Signals</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {data?.recent_invoices?.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-slate-400">#{inv.id}</td>
                      <td className="p-3 font-bold text-cyan-300">{inv.invoice_number}</td>
                      <td className="p-3 font-semibold text-slate-200">{inv.vendor_name}</td>
                      <td className="p-3 font-bold text-white">${inv.amount?.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.risk_score >= 50 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                          {inv.risk_score?.toFixed(0)}/100
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.status === 'APPROVED' || inv.status === 'APPROVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          inv.status === 'REJECTED' || inv.status === 'REJECT' || inv.status === 'HOLD' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] text-slate-400 truncate max-w-[200px]">
                        {inv.risk_signals && inv.risk_signals.length > 0 ? (
                          inv.risk_signals.map(s => typeof s === 'string' ? s : s.rule).join(', ')
                        ) : (
                          <span className="text-emerald-400">CLEAN</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Ledger Verification */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Settled Payment Ledger Records (`payment_ledger` table)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-700/60 bg-dark-900/60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-700/70">
                  <tr>
                    <th className="p-3">Tx Ref</th>
                    <th className="p-3">Order Ref</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Beneficiary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                  {data?.recent_ledger_records?.map((leg) => (
                    <tr key={leg.id} className="hover:bg-slate-800/40">
                      <td className="p-3 text-cyan-300 font-bold">{leg.transaction_reference}</td>
                      <td className="p-3 text-slate-300">{leg.order_reference}</td>
                      <td className="p-3 font-bold text-white">${leg.amount?.toLocaleString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${leg.status === 'SETTLED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-300'}`}>
                          {leg.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{leg.beneficiary_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-700/70 bg-dark-900/80 flex items-center justify-between text-xs text-slate-400">
          <span>Persisted database record updates take effect instantly on transaction state change.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
