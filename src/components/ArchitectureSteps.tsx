import React from 'react';
import { Database, Network, Grid, Megaphone } from 'lucide-react';

export const ArchitectureSteps: React.FC = () => {
  const steps = [
    {
      step: 'STEP 01',
      title: 'Multi-Stream Data',
      icon: Database,
      description:
        'Ingests high-precision 10m LiDAR elevation models, radar Doppler precipitation, slope aspect gradients, historical landslide fault planes, and road excavation cuttings.',
      footer: 'INPUT: RADAR • DEM • AWS',
    },
    {
      step: 'STEP 02',
      title: 'Spatio-Temporal AI',
      icon: Network,
      description:
        'Physics-Informed Neural Networks (PINN) compute transient seepage, infinite slope stability models, and Factor of Safety (FoS) across dynamic saturation layers.',
      footer: 'MODEL: PINN FOS INFERENCE',
    },
    {
      step: 'STEP 03',
      title: 'Continuous Surface',
      icon: Grid,
      description:
        'Interpolates 12,482 spatial grid tiles into smooth Gaussian risk contours—revealing sharp micro-topographical weaknesses along valleys, ridges, and drainage channels.',
      footer: 'RESOLUTION: 10M HEATMAP SURFACE',
    },
    {
      step: 'STEP 04',
      title: 'Civil Early Warning',
      icon: Megaphone,
      description:
        'Triggers localized early warning protocols: automated SMS, public siren broadcasts, MSDMA field mobilization, and dynamic evacuation routing before catastrophic slippage occurs.',
      footer: 'OUTPUT: AUTOMATED CIVIL ALERT',
    },
  ];

  return (
    <section className="border-t border-slate-800/80 bg-[#070b14] py-14 sm:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <div className="text-xs font-bold tracking-widest text-cyan-400 uppercase">
            MISSION-CRITICAL ARCHITECTURE
          </div>
          <h2 className="mt-2 font-['Chakra_Petch'] text-2xl font-bold tracking-tight text-white sm:text-3xl">
            How Aizawl's Risk Is Calculated
          </h2>
          <p className="mx-auto mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-400">
            Integrating high-resolution topographic data with physical hydrological models and neural network heuristics for instantaneous early warning.
          </p>
        </div>

        {/* 4 Step Cards */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg transition-all duration-300 hover:border-cyan-500/40 hover:bg-slate-900/80"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-800/40 text-cyan-400 transition group-hover:scale-105">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-bold tracking-wider text-cyan-400">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-100">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-800/80 pt-3">
                  <span className="font-mono text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                    {item.footer}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
