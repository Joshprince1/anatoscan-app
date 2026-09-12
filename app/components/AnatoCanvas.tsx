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
  acromion: PinPosition;
  olecranon: PinPosition;
  styloid: PinPosition;
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
    // Limit zoom boundaries between 0.5x and 5x
    newScale = Math.max(0.5, Math.min(5, newScale));

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Reset zoom and pan view
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

          {/* --- KINEMATIC CONNECTION LINES --- */}
          <Line
            points={[pins.acromion.x, pins.acromion.y, pins.olecranon.x, pins.olecranon.y]}
            stroke="#3b82f6"
            strokeWidth={3 / stageScale}
            dash={[5 / stageScale, 5 / stageScale]}
          />
          <Line
            points={[pins.olecranon.x, pins.olecranon.y, pins.styloid.x, pins.styloid.y]}
            stroke="#10b981"
            strokeWidth={3 / stageScale}
            dash={[5 / stageScale, 5 / stageScale]}
          />

          {/* --- ANATOMICAL PINS --- */}
          {/* Acromion Pin */}
          <Circle
            x={pins.acromion.x}
            y={pins.acromion.y}
            radius={10 / stageScale}
            fill="#3b82f6"
            stroke="#ffffff"
            strokeWidth={2 / stageScale}
            draggable
            onDragMove={(e) => onPinDrag('acromion', e.target.x(), e.target.y())}
          />
          <Text
            x={pins.acromion.x + (14 / stageScale)}
            y={pins.acromion.y - (6 / stageScale)}
            text="Acromion"
            fill="#60a5fa"
            fontSize={12 / stageScale}
            fontStyle="bold"
          />

          {/* Olecranon Pin */}
          <Circle
            x={pins.olecranon.x}
            y={pins.olecranon.y}
            radius={10 / stageScale}
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth={2 / stageScale}
            draggable
            onDragMove={(e) => onPinDrag('olecranon', e.target.x(), e.target.y())}
          />
          <Text
            x={pins.olecranon.x + (14 / stageScale)}
            y={pins.olecranon.y - (6 / stageScale)}
            text="Olecranon"
            fill="#34d399"
            fontSize={12 / stageScale}
            fontStyle="bold"
          />

          {/* Styloid Pin */}
          <Circle
            x={pins.styloid.x}
            y={pins.styloid.y}
            radius={10 / stageScale}
            fill="#a855f7"
            stroke="#ffffff"
            strokeWidth={2 / stageScale}
            draggable
            onDragMove={(e) => onPinDrag('styloid', e.target.x(), e.target.y())}
          />
          <Text
            x={pins.styloid.x + (14 / stageScale)}
            y={pins.styloid.y - (6 / stageScale)}
            text="Styloid"
            fill="#c084fc"
            fontSize={12 / stageScale}
            fontStyle="bold"
          />
        </Layer>
      </Stage>
    </div>
  );
}