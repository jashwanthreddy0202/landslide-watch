import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { submitFissureReport } from '../services/api';

interface FissureReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted?: () => void;
}

export const FissureReportModal: React.FC<FissureReportModalProps> = ({
  isOpen,
  onClose,
  onReportSubmitted,
}) => {
  const [formData, setFormData] = useState({
    reporterName: '',
    phone: '',
    ward: 'Ward XIX (Thuampui/Zemabawk)',
    locationDescription: '',
    fissureWidthCm: 2,
    fissureLengthMeters: 5,
    waterSeepageObserved: false,
    structureCracking: false,
    urgency: 'High' as 'Low' | 'Medium' | 'High' | 'Critical',
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.locationDescription.trim()) {
      setError('Please provide specific landmark or address details for the observation.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await submitFissureReport(formData);
      if (res.success) {
        setSuccessMessage(res.message || 'Report registered successfully. Reference ID: ' + (res.report?.id || 'REP-001'));
        if (onReportSubmitted) onReportSubmitted();
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 2200);
      } else {
        setError('Submission failed. Please call 1070 directly.');
      }
    } catch {
      setError('Network error submitting report. Please dial 1070 directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-red-800/80 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3.5">
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 uppercase">
              CITIZEN GEOTECHNICAL EARLY WARNING
            </span>
            <h3 className="font-['Chakra_Petch'] text-lg font-bold text-white">
              Report Ground Fissure or Slope Creep
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {successMessage ? (
          <div className="my-8 flex flex-col items-center justify-center text-center p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-white">Fissure Report Logged</h4>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed max-w-sm">
              {successMessage}
            </p>
            <span className="mt-3 text-[11px] font-mono text-cyan-400">
              AMC Quick Response Task Force dispatched for physical verification.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs text-slate-300">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-950/60 p-2.5 text-xs text-red-300 border border-red-800/60">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.reporterName}
                  onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                  placeholder="e.g., Lalsangliana"
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400">
                  Contact Phone (For verification)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., 94361XXXXX"
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400">
                Aizawl Municipal Ward / Sector *
              </label>
              <select
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="Ward XIX (Thuampui/Zemabawk)">Ward XIX (Thuampui / Zemabawk)</option>
                <option value="Ward XX (Durtlang Leitan)">Ward XX (Durtlang Leitan)</option>
                <option value="Ward XII (Bawngkawn South)">Ward XII (Bawngkawn South)</option>
                <option value="Ward XI (Ramhlun Vengthlang)">Ward XI (Ramhlun Vengthlang)</option>
                <option value="Ward IX (Laipuitlang Ridge)">Ward IX (Laipuitlang Ridge)</option>
                <option value="Ward X (Chaltlang)">Ward X (Chaltlang)</option>
                <option value="Ward VI (Khatla South)">Ward VI (Khatla South)</option>
                <option value="Ward I (Kulikawn)">Ward I (Kulikawn)</option>
                <option value="Melthum/Hlimen Southern Corridor">Melthum / Hlimen Outskirts</option>
                <option value="Ward V (Tuikual Valley)">Ward V (Tuikual Valley)</option>
                <option value="Ward VII (Mission Veng)">Ward VII (Mission Veng)</option>
                <option value="Ward XIII (Chanmari)">Ward XIII (Chanmari)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400">
                Exact Landmark / Street Observation *
              </label>
              <textarea
                rows={2}
                value={formData.locationDescription}
                onChange={(e) => setFormData({ ...formData, locationDescription: e.target.value })}
                placeholder="e.g., 20m below community hall staircase, ground fissure opening along retaining wall footing..."
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400">
                  Approx Fissure Width (cm)
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.fissureWidthCm}
                  onChange={(e) => setFormData({ ...formData, fissureWidthCm: parseFloat(e.target.value) || 1 })}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400">
                  Estimated Length (m)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.fissureLengthMeters}
                  onChange={(e) => setFormData({ ...formData, fissureLengthMeters: parseFloat(e.target.value) || 1 })}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.waterSeepageObserved}
                  onChange={(e) => setFormData({ ...formData, waterSeepageObserved: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-900 text-cyan-600 focus:ring-0"
                />
                <span>Muddy water spring or sudden seepage emerging from crack</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.structureCracking}
                  onChange={(e) => setFormData({ ...formData, structureCracking: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-900 text-cyan-600 focus:ring-0"
                />
                <span>Retaining wall leaning or house foundation doors/windows jamming</span>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                For urgent life threat, dial <strong className="text-red-400">1070</strong> immediately.
              </span>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{loading ? 'Submitting...' : 'Dispatch Report'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
