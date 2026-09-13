'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { LandmarkPins, CalibrationPins } from './components/AnatoCanvas';

const AnatoCanvas = dynamic(() => import('./components/AnatoCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-[600px] h-[500px] bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400">
      Initializing Multi-Segment Canvas...
    </div>
  ),
});

export default function AnatoScanDashboard() {
  const [image, setImage] = useState<string | null>(null);

  // 4-Pin Multi-Segment Landmark Positions
  const [pins, setPins] = useState<LandmarkPins>({
    shoulder: { x: 180, y: 100 },
    elbow: { x: 280, y: 240 },
    wrist: { x: 380, y: 340 },
    knuckle: { x: 460, y: 420 },
  });

  // Calibration Scale Pins
  const [calPins, setCalPins] = useState<CalibrationPins>({
    calA: { x: 50, y: 460 },
    calB: { x: 150, y: 460 },
  });

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

  const getPixelDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const calPixelDistance = getPixelDistance(calPins.calA, calPins.calB);
  const mmPerPixel = calPixelDistance > 0 ? knownMm / calPixelDistance : 0;

  // Generic angle calculation helper for any 3 consecutive points
  const calculateJointAngle = (p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) => {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (mag1 === 0 || mag2 === 0) return '0.0';
    const angleRad = Math.acos(Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2))));
    return ((angleRad * 180) / Math.PI).toFixed(1);
  };

  // Elbow Angle (Shoulder - Elbow - Wrist)
  const elbowAngle = calculateJointAngle(pins.shoulder, pins.elbow, pins.wrist);
  // Wrist Angle (Elbow - Wrist - Knuckle)
  const wristAngle = calculateJointAngle(pins.elbow, pins.wrist, pins.knuckle);

  // Segment metrics
  const pxShoulderElbow = getPixelDistance(pins.shoulder, pins.elbow);
  const mmShoulderElbow = (pxShoulderElbow * mmPerPixel).toFixed(1);

  const pxElbowWrist = getPixelDistance(pins.elbow, pins.wrist);
  const mmElbowWrist = (pxElbowWrist * mmPerPixel).toFixed(1);

  const pxWristKnuckle = getPixelDistance(pins.wrist, pins.knuckle);
  const mmWristKnuckle = (pxWristKnuckle * mmPerPixel).toFixed(1);

  const totalChainMm = ((pxShoulderElbow + pxElbowWrist + pxWristKnuckle) * mmPerPixel).toFixed(1);

  return (
    <main className="min-h-screen p-8 bg-slate-900 text-slate-100 flex flex-col items-center">
      <header className="w-full max-w-6xl mb-8 border-b border-slate-700 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">
            AnatoScan AI — Multi-Segment Kinematic Chain
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Full-limb kinematic analysis with multi-joint angular telemetry
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

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col gap-4 overflow-y-auto max-h-[600px]">
          <h2 className="text-xl font-semibold text-slate-200">
            Multi-Segment Telemetry
          </h2>

          {/* CALIBRATION CARD */}
          <div className="p-3 bg-yellow-950/40 border border-yellow-700/50 rounded-lg space-y-2">
            <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider block">
              Scale Calibration
            </span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-300">Known (mm):</label>
              <input
                type="number"
                value={knownMm}
                onChange={(e) => setKnownMm(Math.max(1, Number(e.target.value)))}
                className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-amber-300 font-mono text-sm focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div className="text-xs font-mono text-yellow-300/80">
              Ratio: {mmPerPixel.toFixed(3)} mm/px
            </div>
          </div>

          {/* JOINT ANGLES */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900 rounded border border-slate-700">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Elbow Angle</span>
              <span className="text-xl font-mono font-bold text-emerald-400">{elbowAngle}°</span>
            </div>
            <div className="p-3 bg-slate-900 rounded border border-slate-700">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Wrist Angle</span>
              <span className="text-xl font-mono font-bold text-purple-400">{wristAngle}°</span>
            </div>
          </div>

          {/* SEGMENT LENGTHS */}
          <div className="space-y-2">
            <div className="p-2.5 bg-slate-900 rounded border border-slate-700 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 block">Shoulder-Elbow</span>
                <span className="text-lg font-mono font-bold text-blue-400">{mmShoulderElbow} mm</span>
              </div>
              <span className="text-xs font-mono text-slate-500">{pxShoulderElbow.toFixed(0)} px</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded border border-slate-700 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 block">Elbow-Wrist</span>
                <span className="text-lg font-mono font-bold text-emerald-400">{mmElbowWrist} mm</span>
              </div>
              <span className="text-xs font-mono text-slate-500">{pxElbowWrist.toFixed(0)} px</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded border border-slate-700 flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 block">Wrist-Knuckle</span>
                <span className="text-lg font-mono font-bold text-orange-400">{mmWristKnuckle} mm</span>
              </div>
              <span className="text-xs font-mono text-slate-500">{pxWristKnuckle.toFixed(0)} px</span>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-700 flex justify-between items-center mt-2">
              <span className="text-xs font-semibold text-slate-300 uppercase">Total Chain Length</span>
              <span className="text-xl font-mono font-bold text-amber-400">{totalChainMm} mm</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}