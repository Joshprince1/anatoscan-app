'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { LandmarkPins, CalibrationPins } from './components/AnatoCanvas';
import { generateAnatoPDF } from './utils/generateReport';

const AnatoCanvas = dynamic(() => import('./components/AnatoCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-slate-950 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400">
      Initializing Canvas...
    </div>
  ),
});

export default function AnatoScanDashboard() {
  // --- SCAN A STATE (Baseline) ---
  const [imageA, setImageA] = useState<string | null>(null);
  const [pinsA, setPinsA] = useState<LandmarkPins>({
    shoulder: { x: 180, y: 100 },
    elbow: { x: 280, y: 240 },
    wrist: { x: 380, y: 340 },
    knuckle: { x: 460, y: 420 },
  });
  const [calPinsA, setCalPinsA] = useState<CalibrationPins>({
    calA: { x: 50, y: 460 },
    calB: { x: 150, y: 460 },
  });
  const [knownMmA, setKnownMmA] = useState<number>(50);

  // --- SCAN B STATE (Follow-up) ---
  const [imageB, setImageB] = useState<string | null>(null);
  const [pinsB, setPinsB] = useState<LandmarkPins>({
    shoulder: { x: 180, y: 100 },
    elbow: { x: 270, y: 220 },
    wrist: { x: 390, y: 320 },
    knuckle: { x: 470, y: 400 },
  });
  const [calPinsB, setCalPinsB] = useState<CalibrationPins>({
    calA: { x: 50, y: 460 },
    calB: { x: 150, y: 460 },
  });
  const [knownMmB, setKnownMmB] = useState<number>(50);

  // Handlers for Scan A
  const handleImageUploadA = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageA(URL.createObjectURL(file));
  };
  const handlePinDragA = (key: keyof LandmarkPins, x: number, y: number) => {
    setPinsA((prev) => ({ ...prev, [key]: { x, y } }));
  };
  const handleCalPinDragA = (key: keyof CalibrationPins, x: number, y: number) => {
    setCalPinsA((prev) => ({ ...prev, [key]: { x, y } }));
  };

  // Handlers for Scan B
  const handleImageUploadB = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImageB(URL.createObjectURL(file));
  };
  const handlePinDragB = (key: keyof LandmarkPins, x: number, y: number) => {
    setPinsB((prev) => ({ ...prev, [key]: { x, y } }));
  };
  const handleCalPinDragB = (key: keyof CalibrationPins, x: number, y: number) => {
    setCalPinsB((prev) => ({ ...prev, [key]: { x, y } }));
  };

  // Telemetry Calculations helper
  const getPixelDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const calculateJointAngle = (p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) => {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    if (mag1 === 0 || mag2 === 0) return 0;
    const angleRad = Math.acos(Math.max(-1, Math.min(1, dotProduct / (mag1 * mag2))));
    return (angleRad * 180) / Math.PI;
  };

  // Metrics Scan A
  const calDistA = getPixelDistance(calPinsA.calA, calPinsA.calB);
  const ratioA = calDistA > 0 ? knownMmA / calDistA : 0;
  const elbowAngleA = calculateJointAngle(pinsA.shoulder, pinsA.elbow, pinsA.wrist);
  const wristAngleA = calculateJointAngle(pinsA.elbow, pinsA.wrist, pinsA.knuckle);
  const chainA = (
    (getPixelDistance(pinsA.shoulder, pinsA.elbow) +
      getPixelDistance(pinsA.elbow, pinsA.wrist) +
      getPixelDistance(pinsA.wrist, pinsA.knuckle)) *
    ratioA
  );

  // Metrics Scan B
  const calDistB = getPixelDistance(calPinsB.calA, calPinsB.calB);
  const ratioB = calDistB > 0 ? knownMmB / calDistB : 0;
  const elbowAngleB = calculateJointAngle(pinsB.shoulder, pinsB.elbow, pinsB.wrist);
  const wristAngleB = calculateJointAngle(pinsB.elbow, pinsB.wrist, pinsB.knuckle);
  const chainB = (
    (getPixelDistance(pinsB.shoulder, pinsB.elbow) +
      getPixelDistance(pinsB.elbow, pinsB.wrist) +
      getPixelDistance(pinsB.wrist, pinsB.knuckle)) *
    ratioB
  );

  // Deltas (Progress)
  const elbowDelta = elbowAngleB - elbowAngleA;
  const chainDelta = chainB - chainA;

  return (
    <main className="min-h-screen p-8 bg-slate-900 text-slate-100 flex flex-col items-center">
      <header className="w-full max-w-7xl mb-8 border-b border-slate-700 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-400">
            AnatoScan AI — Comparative Range-of-Motion Suite
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Side-by-side clinical assessment for pre- and post-treatment progress tracking
          </p>
        </div>
      </header>

      {/* DUAL WORKSPACE GRID */}
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* --- SCAN A (BASELINE) --- */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-blue-400">Scan A: Baseline (Pre-Rehab)</h2>
            <div className="text-xs font-mono bg-blue-950 text-blue-300 px-2 py-1 rounded border border-blue-800">
              Elbow: {elbowAngleA.toFixed(1)}°
            </div>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[420px] bg-slate-950 rounded-lg border border-slate-700 p-2">
            {imageA ? (
              <AnatoCanvas
                imageUrl={imageA}
                pins={pinsA}
                calPins={calPinsA}
                onPinDrag={handlePinDragA}
                onCalPinDrag={handleCalPinDragA}
              />
            ) : (
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">
                Upload Baseline Image
                <input type="file" accept="image/*" onChange={handleImageUploadA} className="hidden" />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm font-mono">
            <div className="p-2.5 bg-slate-900 rounded border border-slate-700">
              <span className="text-xs text-slate-400 block font-sans">Elbow Flexion</span>
              <span className="text-emerald-400 font-bold text-lg">{elbowAngleA.toFixed(1)}°</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded border border-slate-700">
              <span className="text-xs text-slate-400 block font-sans">Total Chain Length</span>
              <span className="text-amber-400 font-bold text-lg">{chainA.toFixed(1)} mm</span>
            </div>
          </div>
        </div>

        {/* --- SCAN B (FOLLOW-UP) --- */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-emerald-400">Scan B: Follow-up (Post-Rehab)</h2>
            <div className="text-xs font-mono bg-emerald-950 text-emerald-300 px-2 py-1 rounded border border-emerald-800">
              Elbow: {elbowAngleB.toFixed(1)}°
            </div>
          </div>

          <div className="flex flex-col items-center justify-center min-h-[420px] bg-slate-950 rounded-lg border border-slate-700 p-2">
            {imageB ? (
              <AnatoCanvas
                imageUrl={imageB}
                pins={pinsB}
                calPins={calPinsB}
                onPinDrag={handlePinDragB}
                onCalPinDrag={handleCalPinDragB}
              />
            ) : (
              <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg transition-colors">
                Upload Follow-up Image
                <input type="file" accept="image/*" onChange={handleImageUploadB} className="hidden" />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm font-mono">
            <div className="p-2.5 bg-slate-900 rounded border border-slate-700">
              <span className="text-xs text-slate-400 block font-sans">Elbow Flexion</span>
              <span className="text-emerald-400 font-bold text-lg">{elbowAngleB.toFixed(1)}°</span>
            </div>
            <div className="p-2.5 bg-slate-900 rounded border border-slate-700">
              <span className="text-xs text-slate-400 block font-sans">Total Chain Length</span>
              <span className="text-amber-400 font-bold text-lg">{chainB.toFixed(1)} mm</span>
            </div>
          </div>
        </div>

      </div>

      {/* --- COMPARATIVE DELTA SUMMARY CARD --- */}
      <section className="w-full max-w-7xl bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Rehabilitation Progress & Delta Analysis</h3>
          <p className="text-sm text-slate-400">Calculated variance between baseline and follow-up kinematic telemetry.</p>
        </div>

        <div className="flex flex-wrap gap-4 font-mono">
          <div className="px-4 py-3 bg-slate-900 rounded-lg border border-slate-700 text-center">
            <span className="text-xs text-slate-400 block font-sans uppercase">Elbow Angle Delta</span>
            <span className={`text-xl font-bold ${elbowDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {elbowDelta > 0 ? `+${elbowDelta.toFixed(1)}°` : `${elbowDelta.toFixed(1)}°`}
            </span>
          </div>

          <div className="px-4 py-3 bg-slate-900 rounded-lg border border-slate-700 text-center">
            <span className="text-xs text-slate-400 block font-sans uppercase">Chain Length Delta</span>
            <span className={`text-xl font-bold ${chainDelta >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
              {chainDelta > 0 ? `+${chainDelta.toFixed(1)} mm` : `${chainDelta.toFixed(1)} mm`}
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}