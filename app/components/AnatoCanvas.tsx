'use client';

import React from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Text, Line } from 'react-konva';
import useImage from 'use-image';

export interface PinPosition {
  x: number;
  y: number;
}

export interface LandmarkPins {
  acromion: PinPosition;
  olecranon: PinPosition;
  styloid: PinPosition;
}

interface AnatoCanvasProps {
  imageUrl: string;
  pins: LandmarkPins;
  onPinDrag: (pinKey: keyof LandmarkPins, x: number, y: number) => void;
}

export default function AnatoCanvas({ imageUrl, pins, onPinDrag }: AnatoCanvasProps) {
  const [image] = useImage(imageUrl);

  return (
    <Stage width={600} height={500} className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
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

        {/* Kinematic Connection Lines */}
        <Line
          points={[pins.acromion.x, pins.acromion.y, pins.olecranon.x, pins.olecranon.y]}
          stroke="#3b82f6"
          strokeWidth={3}
          dash={[5, 5]}
        />
        <Line
          points={[pins.olecranon.x, pins.olecranon.y, pins.styloid.x, pins.styloid.y]}
          stroke="#10b981"
          strokeWidth={3}
          dash={[5, 5]}
        />

        {/* Acromion Pin */}
        <Circle
          x={pins.acromion.x}
          y={pins.acromion.y}
          radius={10}
          fill="#3b82f6"
          stroke="#ffffff"
          strokeWidth={2}
          draggable
          onDragMove={(e) => onPinDrag('acromion', e.target.x(), e.target.y())}
        />
        <Text
          x={pins.acromion.x + 12}
          y={pins.acromion.y - 6}
          text="Acromion"
          fill="#60a5fa"
          fontSize={12}
          fontStyle="bold"
        />

        {/* Olecranon Pin */}
        <Circle
          x={pins.olecranon.x}
          y={pins.olecranon.y}
          radius={10}
          fill="#10b981"
          stroke="#ffffff"
          strokeWidth={2}
          draggable
          onDragMove={(e) => onPinDrag('olecranon', e.target.x(), e.target.y())}
        />
        <Text
          x={pins.olecranon.x + 12}
          y={pins.olecranon.y - 6}
          text="Olecranon"
          fill="#34d399"
          fontSize={12}
          fontStyle="bold"
        />

        {/* Styloid Pin */}
        <Circle
          x={pins.styloid.x}
          y={pins.styloid.y}
          radius={10}
          fill="#a855f7"
          stroke="#ffffff"
          strokeWidth={2}
          draggable
          onDragMove={(e) => onPinDrag('styloid', e.target.x(), e.target.y())}
        />
        <Text
          x={pins.styloid.x + 12}
          y={pins.styloid.y - 6}
          text="Styloid"
          fill="#c084fc"
          fontSize={12}
          fontStyle="bold"
        />
      </Layer>
    </Stage>
  );
}