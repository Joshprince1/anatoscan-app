'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { LandmarkPins, CalibrationPins } from './components/AnatoCanvas';

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

  // Anatomical Pin Positions
  const [pins, setPins] = useState<LandmarkPins>({
    acromion: { x: 200, y: 100 },
    olecranon: { x: 300, y: 280 },
    styloid: { x: 420, y: 400 },
  });

  // Calibration Scale Pins
  const [calPins, setCalPins] = useState<CalibrationPins>({
    calA: { x: 50, y: 450 },
    calB: { x: 150, y: 450 },
  });

  // Known real-world distance between Cal A and Cal B (in mm)
  const [knownMm, setKnownMm] = useState<number>(50);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  const handlePinDrag = (pinKey: keyof LandmarkPins, x: number, y: number) => {
    setPins((prev) => ({ ...prev, [pinKey]: { x, y } }));
  };

  const handleCalPinDrag = (calKey: keyof CalibrationPins, x: number, y: number) => {
    setCalPins((prev) => ({ ...prev, [calKey]: { x, y } }));
  };

  // Distance helper in pixels
  const getPixelDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calibration Ratio: mm per pixel
  const calPixelDistance = getPixelDistance(calPins.calA, calPins.calB);
  const mmPerPixel = calPixelDistance > 0 ? knownMm / calPixelDistance : 0;

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

  // Acromion-Olecranon Segment lengths
  const pxAcromionOlecranon = getPixelDistance(pins.acromion, pins.olecranon);
  const mmAcromionOlecranon = (pxAcromionOlecranon * mmPerPixel).toFixed(1);
  const cmAcromionOlecranon = (pxAcromionOlecranon * mmPerPixel / 10).toFixed(2);

  // Olecranon-Styloid Segment lengths
  const pxOlecranonStyloid = getPixelDistance(pins.olecranon, pins.styloid);
  const mmOlecranonStyloid = (pxOlecranonStyloid * mmPerPixel).toFixed(1);

  return (
    <main className="min-h-screen p-8 bg-slate-900 text-slate-100 flex flex-col items-center">
      <header className="w-full max-w-6xl mb-8 border-b border-slate-700 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">
            AnatoScan AI — Biomechanical Measurement
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Drag anatomical & calibration pins for precise kinematic assessment
          </p>
        </div>
      </header>

      <section className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col items-center justify-center min-h-[520px]">
          {image ? (
            <AnatoCanvas
              imageUrl={image}
              pins={pins}
              calPins={calPins}
              onPinDrag={handlePinDrag}
              onCalPinDrag={handleCalPinDrag}
            />
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

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col gap-5">
          <h2 className="text-xl font-semibold text-slate-200">
            Live Kinematics & Scale
          </h2>

          {/* CALIBRATION CONTROL CARD */}
          <div className="p-4 bg-yellow-950/40 border border-yellow-700/50 rounded-lg space-y-3">
            <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider block">
              Scale Calibration (Yellow Line)
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300 whitespace-nowrap">Known Scale (mm):</label>
              <input
                type="number"
                value={knownMm}
                onChange={(e) => setKnownMm(Math.max(1, Number(e.target.value)))}
                className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-amber-300 font-mono text-sm focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div className="text-xs font-mono text-yellow-300/80">
              Scale Line: {calPixelDistance.toFixed(1)} px | Scale: {mmPerPixel.toFixed(3)} mm/px
            </div>
          </div>

          {/* KINEMATIC METRICS */}
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
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-2xl font-mono font-bold text-blue-400">
                  {mmAcromionOlecranon} mm
                </span>
                <span className="text-sm font-mono text-slate-400">
                  ({cmAcromionOlecranon} cm / {pxAcromionOlecranon.toFixed(0)} px)
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded border border-slate-700">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">
                Olecranon-Styloid Segment
              </span>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-2xl font-mono font-bold text-purple-400">
                  {mmOlecranonStyloid} mm
                </span>
                <span className="text-sm font-mono text-slate-400">
                  ({pxOlecranonStyloid.toFixed(0)} px)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}