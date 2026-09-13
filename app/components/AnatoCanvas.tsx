'use client';

import React, { useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Text, Line } from 'react-konva';
import useImage from 'use-image';
import Konva from 'konva';

export interface PinPosition {
  x: number;
  y: number;
}

export interface LandmarkPins {
  shoulder: PinPosition;
  elbow: PinPosition;
  wrist: PinPosition;
  knuckle: PinPosition;
}

export interface CalibrationPins {
  calA: PinPosition;
  calB: PinPosition;
}

interface AnatoCanvasProps {
  imageUrl: string;
  pins: LandmarkPins;
  calPins: CalibrationPins;
  onPinDrag: (pinKey: keyof LandmarkPins, x: number, y: number) => void;
  onCalPinDrag: (calKey: keyof CalibrationPins, x: number, y: number) => void;
}

export default function AnatoCanvas({
  imageUrl,
  pins,
  calPins,
  onPinDrag,
  onCalPinDrag,
}: AnatoCanvasProps) {
  const [image] = useImage(imageUrl);

  // Stage transform state for zoom and pan
  const [stageScale, setStageScale] = useState<number>(1);
  const [stagePos, setStagePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle mouse wheel zoom centered around mouse pointer
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.5, Math.min(5, newScale));

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleResetView = () => {
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Canvas View Controls Bar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 shadow-lg">
        <span>Zoom: {Math.round(stageScale * 100)}%</span>
        <button
          onClick={handleResetView}
          className="ml-2 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded border border-slate-600 transition-colors"
        >
          Reset View
        </button>
      </div>

      <Stage
        width={600}
        height={500}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        draggable
        className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950 cursor-grab active:cursor-grabbing"
      >
        <Layer>
          {/* Specimen Image Layer */}
          {image && (
            <KonvaImage
              image={image}
              width={600}
              height={500}
              listening={false}
            />
          )}

          {/* --- CALIBRATION RULER OVERLAY --- */}
          <Line
            points={[calPins.calA.x, calPins.calA.y, calPins.calB.x, calPins.calB.y]}
            stroke="#eab308"
            strokeWidth={2 / stageScale}
            dash={[4 / stageScale, 4 / stageScale]}
          />

          {/* Calibration Handle A */}
          <Circle
            x={calPins.calA.x}
            y={calPins.calA.y}
            radius={7 / stageScale}
            fill="#eab308"
            stroke="#ffffff"
            strokeWidth={2 / stageScale}
            draggable
            onDragMove={(e) => onCalPinDrag('calA', e.target.x(), e.target.y())}
          />
          <Text
            x={calPins.calA.x - 15}
            y={calPins.calA.y - (22 / stageScale)}
            text="Cal A"
            fill="#fde047"
            fontSize={11 / stageScale}
            fontStyle="bold"
          />

          {/* Calibration Handle B */}
          <Circle
            x={calPins.calB.x}
            y={calPins.calB.y}
            radius={7 / stageScale}
            fill="#eab308"
            stroke="#ffffff"
            strokeWidth={2 / stageScale}
            draggable
            onDragMove={(e) => onCalPinDrag('calB', e.target.x(), e.target.y())}
          />
          <Text
            x={calPins.calB.x - 15}
            y={calPins.calB.y - (22 / stageScale)}
            text="Cal B"
            fill="#fde047"
            fontSize={11 / stageScale}
            fontStyle="bold"
          />

          {/* --- MULTI-SEGMENT KINEMATIC CHAIN LINES --- */}
          {/* Segment 1: Shoulder to Elbow */}
          <Line
            points={[pins.shoulder.x, pins.shoulder.y, pins.elbow.x, pins.elbow.y]}
            stroke="#3b82f6"
            strokeWidth={3 / stageScale}
            dash={[5 / stageScale, 5 / stageScale]}
          />
          {/* Segment 2: Elbow to Wrist */}
          <Line
            points={[pins.elbow.x, pins.elbow.y, pins.wrist.x, pins.wrist.y]}
            stroke="#10b981"
            strokeWidth={3 / stageScale}
            dash={[5 / stageScale, 5 / stageScale]}
          />
          {/* Segment 3: Wrist to Knuckle */}
          <Line
            points={[pins.wrist.x, pins.wrist.y, pins.knuckle.x, pins.knuckle.y]}
            stroke="#f97316"
            strokeWidth={3 / stageScale}
            dash={[5 / stageScale, 5 / stageScale]}
          />

          {/* --- ANATOMICAL LANDMARK PINS --- */}
          {/* Shoulder Pin */}
          <Circle
            x={pins.shoulder.x}
            y={pins.shoulder.y}
            radius={10 / stageScale}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={2 / stageScale}
            draggable
            onDragMove={(e) => onPinDrag('shoulder', e.target.x(), e.target.y())}
          />
          <Text
            x={pins.shoulder.x + (14 / stageScale)}
            y={pins.shoulder.y - (6 / stageScale)}
            text="Shoulder"
            fill="#60a5fa"
            fontSize={12 / stageScale}
            fontStyle="bold"
          />

          {/* Elbow Pin */}
          <Circle
            x={pins.elbow.x}
            y={pins.elbow.y}
            radius={10 / stageScale}
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth={2 / stageScale}
            draggable
            onDragMove={(e) => onPinDrag('elbow', e.target.x(), e.target.y())}
          />
          <Text
            x={pins.elbow.x + (14 / stageScale)}
            y={pins.elbow.y - (6 / stageScale)}
            text="Elbow"
            fill="#34d399"
            fontSize={12 / stageScale}
            fontStyle="bold"
          />

          {/* Wrist Pin */}
          <Circle
            x={pins.wrist.x}
            y={pins.wrist.y}
            radius={10 / stageScale}
            fill="#a855f7"
            stroke="#ffffff"
            strokeWidth={2 / stageScale}
            draggable
            onDragMove={(e) => onPinDrag('wrist', e.target.x(), e.target.y())}
          />
          <Text
            x={pins.wrist.x + (14 / stageScale)}
            y={pins.wrist.y - (6 / stageScale)}
            text="Wrist"
            fill="#c084fc"
            fontSize={12 / stageScale}
            fontStyle="bold"
          />

          {/* Knuckle Pin */}
          <Circle
            x={pins.knuckle.x}
            y={pins.knuckle.y}
            radius={10 / stageScale}
            fill="#f97316"
            stroke="#ffffff"
            strokeWidth={2 / stageScale}
            draggable
            onDragMove={(e) => onPinDrag('knuckle', e.target.x(), e.target.y())}
          />
          <Text
            x={pins.knuckle.x + (14 / stageScale)}
            y={pins.knuckle.y - (6 / stageScale)}
            text="Knuckle"
            fill="#fb923c"
            fontSize={12 / stageScale}
            fontStyle="bold"
          />
        </Layer>
      </Stage>
    </div>
  );
}