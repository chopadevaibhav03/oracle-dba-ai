import React, { useEffect, useState } from 'react';
import { HitlActionRequest } from '../types/oracle';
import {
  AlertOctagon,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Database,
  Fingerprint,
  KeyRound,
  Lock,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  UserCheck,
  X,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  request: HitlActionRequest | null;
  onClose: () => void;
  onApprove: (data: {
    operator: string;
    cabTicket: string;
    mfaCode: string;
    justification: string;
  }) => Promise<void>;
  onReject?: (reason: string) => void;
}

const OPERATORS = [
  { id: 'CHOPADE_V', name: 'CHOPADE_V', title: 'Principal Oracle DBA', level: 'Level 4 / SOX Tier-1' },
  { id: 'PATEL_A', name: 'PATEL_A', title: 'Head of SRE & Security', level: 'Level 4 / Dual Custody' },
  { id: 'BREAKGLASS', name: 'SEC_BREAKGLASS_ADMIN', title: 'Emergency Break-Glass Incident DBA', level: 'Level 5 / Emergency' },
];

export const HitlApprovalModal: React.FC<Props> = ({
  isOpen,
  request,
  onClose,
  onApprove,
  onReject,
}) => {
  const [operator, setOperator] = useState(OPERATORS[0].name);
  const [cabTicket, setCabTicket] = useState('CHG-2024-' + Math.floor(1000 + Math.random() * 9000));
  const [justification, setJustification] = useState('Performance stabilization & CIS compliance remediation.');
  const [mfaCode, setMfaCode] = useState('');
  const [expectedMfa, setExpectedMfa] = useState('');
  const [totpSeconds, setTotpSeconds] = useState(30);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [acknowledgedRollback, setAcknowledgedRollback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate dynamic 6-digit TOTP challenge
  const generateNewMfa = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedMfa(code);
    setTotpSeconds(30);
  };

  useEffect(() => {
    if (isOpen) {
      generateNewMfa();
      setIsBiometricVerified(false);
      setAcknowledgedRollback(false);
      setMfaCode('');
      setCabTicket('CHG-2024-' + Math.floor(1000 + Math.random() * 9000));
    }
  }, [isOpen]);

  // Countdown timer for TOTP
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTotpSeconds((prev) => {
        if (prev <= 1) {
          generateNewMfa();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const isMfaValid = mfaCode.trim() === expectedMfa || isBiometricVerified;
  const canApprove = isMfaValid && acknowledgedRollback && !isSubmitting;

  const handleQuickAutofillMfa = () => {
    setMfaCode(expectedMfa);
  };

  const handleBiometricTouch = () => {
    setIsBiometricVerified(true);
    setMfaCode(expectedMfa);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canApprove) return;
    setIsSubmitting(true);
    try {
      await onApprove({
        operator,
        cabTicket,
        mfaCode: mfaCode || expectedMfa,
        justification,
      });
      onClose();
    } catch (err: any) {
      alert(`Approval execution failed: ${err?.message || 'Verification error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors">
        
        {/* Header Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950/80 border border-red-700/80 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">
                  Human-in-the-Loop (HITL) Authorization Gate
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                  {request.riskLevel} RISK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-layer authorization required for production database modification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-300 max-h-[80vh] overflow-y-auto">
          
          {/* Action Impact Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-xs">{request.title}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {request.database}
              </span>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Blast Radius:</strong> {request.blastRadius}
              </span>
            </div>

            {/* Commands Preview */}
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                Executable Commands:
              </span>
              <pre className="p-2.5 rounded-lg bg-slate-900 text-cyan-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-24">
                {request.commands.join('\n')}
              </pre>
            </div>

            {/* Rollback Plan Preview */}
            {request.rollbackCommand && (
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block mb-1">
                  Emergency Rollback Plan:
                </span>
                <pre className="p-2 rounded-lg bg-slate-900/90 text-amber-300 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">
                  {request.rollbackCommand}
                </pre>
              </div>
            )}
          </div>

          {/* Layer 1: Operator Persona */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Layer 1: Authorized Operator Identity &amp; Clearance
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {OPERATORS.map((op) => (
                <button
                  type="button"
                  key={op.id}
                  onClick={() => setOperator(op.name)}
                  className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                    operator === op.name
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 text-cyan-900 dark:text-cyan-200 shadow-sm'
                      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>{op.name}</span>
                    {operator === op.name && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{op.title}</div>
                  <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{op.level}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Layer 2: Multi-Factor Authentication (MFA Challenge) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-cyan-500" />
                <span className="font-bold text-slate-900 dark:text-white text-xs">
                  Layer 2: Step-Up Multi-Factor Verification (TOTP / Hardware Token)
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Expires in {totpSeconds}s</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-500 block">Authenticator Challenge Token:</span>
                <span className="text-base font-black tracking-widest text-cyan-600 dark:text-cyan-400 font-mono">
                  {expectedMfa.slice(0, 3)} {expectedMfa.slice(3)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickAutofillMfa}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  Autofill Code
                </button>

                <button
                  type="button"
                  onClick={handleBiometricTouch}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isBiometricVerified
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>{isBiometricVerified ? 'Verified' : 'FIDO2 Touch'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Enter 6-Digit TOTP Passcode:
              </label>
              <input
                type="text"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 648912"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-center text-sm font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Layer 3: CAB Change Governance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Layer 3: CAB Ticket ID (ServiceNow/Jira)
              </label>
              <input
                type="text"
                value={cabTicket}
                onChange={(e) => setCabTicket(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Business Justification
              </label>
              <input
                type="text"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Operational Safeguard Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledgedRollback}
                onChange={(e) => setAcknowledgedRollback(e.target.checked)}
                className="mt-0.5 rounded border-slate-400 text-cyan-600 focus:ring-0"
              />
              <span className="text-[11px] text-amber-900 dark:text-amber-200 leading-tight">
                <strong>Human-in-the-Loop Sign-off:</strong> I have reviewed the predicted impact on <span className="font-mono">{request.database}</span>, verified that concurrent locks are non-blocking, and take personal responsibility for this production change.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onReject?.('Rejected by operator');
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Reject / Cancel
            </button>

            <button
              type="submit"
              disabled={!canApprove}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition-all cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying &amp; Applying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authorize &amp; Execute Production Change</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
