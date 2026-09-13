import jsPDF from 'jspdf';
import { LandmarkPins, CalibrationPins } from '../components/AnatoCanvas';

interface ReportData {
  imageUrl: string | null;
  pins: LandmarkPins;
  calPins: CalibrationPins;
  knownMm: number;
  mmPerPixel: number;
  elbowAngle: string;
  wristAngle: string;
  mmShoulderElbow: string;
  mmElbowWrist: string;
  mmWristKnuckle: string;
  totalChainMm: string;
}

export function generateAnatoPDF(data: ReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Title
  doc.setFillColor(15, 23, 42); // slate-900 background banner
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ANATOSCAN AI — CLINICAL STUDY SHEET', 14, 18);

  // Metadata Timestamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  const timestamp = new Date().toLocaleString();
  doc.text(Generated: , pageWidth - 14, 18, { align: 'right' });

  // Reset text color for body
  doc.setTextColor(30, 41, 59);

  let cursorY = 40;

  // --- SECTION 1: CALIBRATION & SCALE ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Scale Calibration & Reference', 14, cursorY);
  
  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(Known Reference Scale:  mm, 14, cursorY);
  doc.text(Calculated Pixel-to-Millimeter Ratio:  mm/px, 14, cursorY + 6);

  cursorY += 20;

  // --- SECTION 2: JOINT KINEMATICS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Joint Angular Telemetry', 14, cursorY);

  cursorY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(• Elbow Flexion Angle (Shoulder ? Elbow ? Wrist): °, 14, cursorY);
  doc.text(• Wrist Flexion Angle (Elbow ? Wrist ? Knuckle): °, 14, cursorY + 6);

  cursorY += 22;

  // --- SECTION 3: SEGMENT LENGTHS ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. Multi-Segment Limb Analysis', 14, cursorY);

  cursorY += 8;

  // Table Headers
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, cursorY, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Limb Segment', 18, cursorY + 5.5);
  doc.text('Length (mm)', pageWidth - 50, cursorY + 5.5);

  const segments = [
    { name: 'Shoulder to Elbow', val: ${data.mmShoulderElbow} mm },
    { name: 'Elbow to Wrist', val: ${data.mmElbowWrist} mm },
    { name: 'Wrist to Knuckle', val: ${data.mmWristKnuckle} mm },
    { name: 'Total Chain Length', val: ${data.totalChainMm} mm },
  ];

  cursorY += 8;
  doc.setFont('helvetica', 'normal');

  segments.forEach((seg, idx) => {
    if (idx === 3) {
      doc.setFont('helvetica', 'bold');
    }
    doc.text(seg.name, 18, cursorY + 6);
    doc.text(seg.val, pageWidth - 50, cursorY + 6);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(14, cursorY + 9, pageWidth - 14, cursorY + 9);
    cursorY += 10;
  });

  // Footer note
  cursorY += 20;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('AnatoScan AI Biometric Suite — Certified Automated Kinematic Measurement', pageWidth / 2, cursorY, { align: 'center' });

  // Trigger browser download
  doc.save(AnatoScan_Report_.pdf);
}
