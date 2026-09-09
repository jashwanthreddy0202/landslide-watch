import React from 'react';
import {
  Compass,
  Cpu,
  Layers,
  Activity,
  Shield,
  HelpCircle,
  Database,
  Radio,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigateToMap: () => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigateToMap }) => {
  const faqs = [
    {
      q: 'Why is Aizawl exceptionally vulnerable to landslides during the monsoon?',
      a: 'Aizawl is built along a north-south trending narrow anticlinal ridge characterized by steep slopes (often exceeding 45°). Geologically, the ridge is composed of Surma Group Bhuban formations—alternating layers of hard sandstone and weak, weathered shale. When heavy monsoon rain infiltrates, the shale softens into clay gouge, reducing friction along bedding planes that dip directly into the valleys.',
    },
    {
      q: 'What is the "Factor of Safety" (FoS) and what do the numbers mean?',
      a: 'The Factor of Safety is the ratio of resisting forces (soil cohesion and internal friction) to driving forces (gravity and slope angle). An FoS greater than 1.5 indicates a stable slope. An FoS between 1.0 and 1.2 indicates marginal stability where sustained rainfall can trigger movement. An FoS below 1.0 means driving forces exceed resisting strength—collapse is physically imminent.',
    },
    {
      q: 'Why does 72-hour antecedent rainfall matter more than just today\'s rain?',
      a: 'While short cloudbursts cause flash debris flows, deep-seated slope failures require sub-surface pore-water pressure to accumulate. Rain from 24 to 72 hours prior saturates the soil column and builds hydrostatic pressure inside joints and bedding planes, drastically reducing the effective normal stress.',
    },
    {
      q: 'How does the Gemini AI Geotechnical Explainer work?',
      a: 'The system takes numerical sensor telemetry (pore pressure in kPa, inclinometer velocity in mm/hr, slope gradient, and rainfall) and sends it to Gemini 3.8 Flash with a strict geotechnical prompt. Gemini synthesizes the physical forces into an authoritative executive summary, actionable steps, and an everyday Mizo language translation for local safety broadcasts.',
    },
    {
      q: 'Is this application receiving live operational satellite data in Phase 1?',
      a: 'No. Phase 1 is a demonstration MVP built with synthetic telemetry and Geological Survey of India historical archives for algorithmic validation. It is architected with modular REST APIs so that in Phase 2, live telemetry from MSDMA and IMD can be plugged in without rewriting frontend components.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#060a14] py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
            <BookOpen className="h-3 w-3" />
            <span>GEOTECHNICAL ARCHITECTURE & EARLY WARNING MATH</span>
          </div>
          <h1 className="mt-3 font-['Chakra_Petch'] text-3xl sm:text-4xl font-extrabold text-white">
            How Landslide Watch Calculates Hazard
          </h1>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-400">
            A comprehensive overview of Aizawl's geological vulnerabilities, the infinite slope stability mathematics, and the multi-tier sensor AI pipeline.
          </p>
        </div>

        {/* Section 1: Geological Vulnerability of Aizawl */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-800/40 text-cyan-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                GEOLOGY & TOPOGRAPHY
              </span>
              <h2 className="font-['Chakra_Petch'] text-xl font-bold text-white">
                The Aizawl Ridge: Why Hilltop Slopes Fail
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <h3 className="font-bold text-slate-100 text-sm">
                1. Anticlinal Ridge Axis
              </h3>
              <p className="text-slate-400 leading-relaxed">
                The city of Aizawl is perched upon a sharp north-south anticlinal ridge rising from 800m to 1,280m AMSL, flanked steeply by the Tlawng River valley to the west and the Tuirial/Chite river basin to the east.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <h3 className="font-bold text-slate-100 text-sm">
                2. Bhuban Shale Interbedding
              </h3>
              <p className="text-slate-400 leading-relaxed">
                The geology comprises Tertiary Surma Group sediments with alternating beds of competent sandstone and highly weathered shale. Bedding planes dip steeply (25° to 50°) often daylighting directly into roadside cuttings.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-2">
              <h3 className="font-bold text-slate-100 text-sm">
                3. Urban Slope Surcharge
              </h3>
              <p className="text-slate-400 leading-relaxed">
                Rapid urban multi-storey construction along steep ridge edges, combined with toe-excavations for roads and unlined soakaway pits, increases surcharge load while reducing the natural toe-support.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: The Physical Stability Equation (Infinite Slope Model) */}
        <div className="rounded-2xl border border-cyan-900/50 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/30 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-300 uppercase">
                GEOTECHNICAL EQUILIBRIUM MODEL
              </span>
              <h2 className="font-['Chakra_Petch'] text-xl font-bold text-white">
                The Infinite Slope Stability Mathematics
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
            The Landslide Watch computation engine utilizes the limit equilibrium equation for translational planar slope failure across Aizawl's 12,482 10m grid cells:
          </p>

          {/* Mathematical Formula Box */}
          <div className="rounded-xl border border-cyan-800/60 bg-black/70 p-5 font-mono text-center overflow-x-auto">
            <div className="text-base sm:text-xl font-bold text-cyan-300">
              FoS = [ c' + (γ · z · cos²β - u) · tan(φ') ] / [ γ · z · sinβ · cosβ ]
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Factor of Safety = Available Resisting Shear Strength / Mobilized Driving Shear Stress
            </div>
          </div>

          {/* Variable Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
              <span className="font-mono font-bold text-cyan-400 text-sm">c'</span>
              <div className="font-semibold text-white mt-0.5">Effective Cohesion</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Interparticle soil bonding in Aizawl colluvium (typically 20 - 32 kPa).
              </p>
            </div>

            <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
              <span className="font-mono font-bold text-red-400 text-sm">u</span>
              <div className="font-semibold text-white mt-0.5">Pore-Water Pressure</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Hydrostatic uplift created by infiltrating monsoon water. Directly reduces normal stress.
              </p>
            </div>

            <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
              <span className="font-mono font-bold text-amber-400 text-sm">β</span>
              <div className="font-semibold text-white mt-0.5">Slope Gradient</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Derived from 10m LiDAR DEM. Gradients &gt;35° cause steep trigonometric acceleration of driving stress.
              </p>
            </div>

            <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
              <span className="font-mono font-bold text-emerald-400 text-sm">φ'</span>
              <div className="font-semibold text-white mt-0.5">Internal Friction Angle</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Shearing resistance between weathered shale layers (typically 20° - 28°).
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: The 4-Pillar Pipeline */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-800/40 text-cyan-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                SYSTEM PIPELINE
              </span>
              <h2 className="font-['Chakra_Petch'] text-xl font-bold text-white">
                From Sensor Telemetry to Civil Broadcast
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-cyan-400">01. INGESTION</span>
                <Radio className="h-4 w-4 text-slate-500" />
              </div>
              <h3 className="font-bold text-white text-sm">Hydro-Met Network</h3>
              <p className="text-slate-400 leading-relaxed">
                Tipping-bucket rain gauges, automated weather stations, and radar Doppler imagery capture rainfall accumulation in real-time.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-cyan-400">02. TELEMETRY</span>
                <Activity className="h-4 w-4 text-slate-500" />
              </div>
              <h3 className="font-bold text-white text-sm">Borehole Sensors</h3>
              <p className="text-slate-400 leading-relaxed">
                Vibrating wire piezometers and in-place inclinometers measure pore pressure build-up and sub-surface shear velocity (mm/hr).
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-cyan-400">03. PHYSICS AI</span>
                <Cpu className="h-4 w-4 text-slate-500" />
              </div>
              <h3 className="font-bold text-white text-sm">PINN Calculation</h3>
              <p className="text-slate-400 leading-relaxed">
                Physics-Informed Neural Networks merge the 10m DEM with transient unsaturated seepage models, generating dynamic FoS heatmaps.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-cyan-400">04. BROADCAST</span>
                <Shield className="h-4 w-4 text-slate-500" />
              </div>
              <h3 className="font-bold text-white text-sm">Civil Advisories</h3>
              <p className="text-slate-400 leading-relaxed">
                When FoS drops below 1.0, automated sirens, SMS broadcasts, and Gemini AI safety briefs in Mizo are dispatched to Ward Councils.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Phase 1 MVP Demonstration Disclosure */}
        <div className="rounded-2xl border border-amber-800/40 bg-amber-950/20 p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2 font-['Chakra_Petch'] text-lg font-bold text-amber-300">
            <Database className="h-5 w-5" />
            <span>Phase 1 MVP Demonstration Architecture</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            In accordance with project guidelines, this Phase 1 application operates using calibrated demonstration telemetry and Geological Survey of India historical archives. The architecture has been built with clean REST APIs (`/api/telemetry/overview`, `/api/locations`, `/api/alerts`, `/api/gemini/explain-risk`), ensuring that live government data streams and operational ML models can be plugged in during Phase 2 without rewriting the frontend UI.
          </p>
        </div>

        {/* Section 5: Frequently Asked Questions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-800/40 text-cyan-400">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                COMMUNITY EDUCATION
              </span>
              <h2 className="font-['Chakra_Petch'] text-xl font-bold text-white">
                Frequently Asked Questions
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                <h3 className="font-semibold text-white text-sm">{faq.q}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA to Explore Map */}
        <div className="text-center pt-4">
          <button
            onClick={onNavigateToMap}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-cyan-500"
          >
            <span>Explore Aizawl on the Interactive Risk Map</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
