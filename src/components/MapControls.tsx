import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export interface MapControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  className?: string;
}

export const MapControls: React.FC<MapControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-xl border border-slate-800/80 bg-slate-950/90 p-1.5 shadow-xl backdrop-blur-md text-xs pointer-events-auto ${className}`}
    >
      <button
        id="map-zoom-in-btn"
        type="button"
        onClick={onZoomIn}
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-slate-300 transition hover:bg-cyan-950 hover:text-cyan-300"
        title="Zoom In (+)"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
      <div className="font-mono text-[10px] font-bold text-cyan-400 py-0.5" title="Current Zoom">
        {Math.round(zoom * 100)}%
      </div>
      <button
        id="map-zoom-out-btn"
        type="button"
        onClick={onZoomOut}
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-slate-300 transition hover:bg-cyan-950 hover:text-cyan-300"
        title="Zoom Out (-)"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <div className="my-0.5 h-px w-full bg-slate-800" />
      <button
        id="map-reset-view-btn"
        type="button"
        onClick={onResetView}
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-slate-300 transition hover:bg-cyan-950 hover:text-cyan-300"
        title="Recenter & Reset View"
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
