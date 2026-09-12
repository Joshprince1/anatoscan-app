'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { LandmarkPins } from './components/AnatoCanvas';

// Dynamically import Konva canvas component with SSR disabled
const AnatoCanvas = dynamic(() => import('./components/AnatoCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-[600px] h-[500px] bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400">
      Initializing Interactive Canvas...
    </div>
  ),
});

export default function AnatoScanDashboard() {
  const [image, setImage] = useState<string | null>(null);

  // Initial Pin Positions
  const [pins, setPins] = useState<LandmarkPins>({
    acromion: { x: 200, y: 100 },
    olecranon: { x: 300, y: 280 },
    styloid: { x: 420, y: 400 },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handlePinDrag = (pinKey: keyof LandmarkPins, x: number, y: number) => {
    setPins((prev) => ({
      ...prev,
      [pinKey]: { x, y },
    }));
  };

  // Calculate live angle at Olecranon joint (degrees)
  const calculateAngle = () => {
    const p1 = pins.acromion;
    const p2 = pins.olecranon;
    const p3 = pins.styloid;

    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (mag1 === 0 || mag2 === 0) return '0.0';
    const angleRad = Math.acos(Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2))));
    return ((angleRad * 180) / Math.PI).toFixed(1);
  };

  // Calculate pixel distance offset
  const calculateOffset = () => {
    const dx = pins.olecranon.x - pins.acromion.x;
    const dy = pins.olecranon.y - pins.acromion.y;
    return Math.sqrt(dx * dx + dy * dy).toFixed(1);
  };

  return (
    <main className="min-h-screen p-8 bg-slate-900 text-slate-100 flex flex-col items-center">
      <header className="w-full max-w-6xl mb-8 border-b border-slate-700 pb-4">
        <h1 className="text-3xl font-bold text-blue-400">
          AnatoScan AI — Biomechanical Measurement
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Drag anatomical pins to calculate real-time joint kinematics
        </p>
      </header>

      <section className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center min-h-[520px]">
          {image ? (
            <AnatoCanvas imageUrl={image} pins={pins} onPinDrag={handlePinDrag} />
          ) : (
            <div className="text-center">
              <p className="text-slate-400 mb-4">No scan image loaded</p>
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">
                Upload Specimen Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-slate-200">
            Live Kinematics
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-slate-900 rounded border border-slate-700">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">
                Flexion Angle (Olecranon)
              </span>
              <span className="text-2xl font-mono font-bold text-emerald-400">
                {calculateAngle()}°
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-700">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">
                Acromion-Olecranon Segment
              </span>
              <span className="text-2xl font-mono font-bold text-blue-400">
                {calculateOffset()} px
              </span>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-700">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">
                Pin Coordinates
              </span>
              <div className="text-xs font-mono text-slate-300 mt-1 space-y-1">
                <div>Acromion: X:{pins.acromion.x.toFixed(0)} Y:{pins.acromion.y.toFixed(0)}</div>
                <div>Olecranon: X:{pins.olecranon.x.toFixed(0)} Y:{pins.olecranon.y.toFixed(0)}</div>
                <div>Styloid: X:{pins.styloid.x.toFixed(0)} Y:{pins.styloid.y.toFixed(0)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}