import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';
import { MotorcycleRegistration, VerificationLog, Language } from '../types';
import { QRCodeCard } from './QRCodeCard';
import { ZoomableDocumentContainer } from './ZoomableDocumentContainer';
import { SmartImage } from './SmartImage';
import { lookupRegistrationInDb } from '../services/dbService';

const getStoredLastScanResult = (): MotorcycleRegistration | null => {
  // LocalStorage data loading disabled
  return null;
};

const saveLastScanResult = (_val: MotorcycleRegistration | 'not_found' | null): void => {
  // LocalStorage save disabled
};

const DataField: React.FC<{
  label: string;
  value: React.ReactNode;
  isMono?: boolean;
  isPrimary?: boolean;
  className?: string;
}> = ({ label, value, isMono = false, isPrimary = false, className = "" }) => {
  return (
    <div className={`p-2.5 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-center min-h-[54px] shadow-2xs ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-secondary font-bold block mb-0.5">
        {label}
      </span>
      <div className={`text-xs font-black truncate text-on-surface leading-tight ${isMono ? 'font-mono' : ''} ${isPrimary ? 'text-primary' : ''}`}>
        {value || '-'}
      </div>
    </div>
  );
};

interface SharedScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  registrations: MotorcycleRegistration[];
  userBadgeId: string;
  onAddVerificationLog: (log: VerificationLog, isNoteUpdate?: boolean) => void;
  isPage?: boolean;
}

export const SharedScannerModal: React.FC<SharedScannerModalProps> = ({
  isOpen,
  onClose,
  lang,
  registrations,
  userBadgeId,
  onAddVerificationLog,
  isPage = false,
}) => {
  const isAmharic = lang === 'am';
  const [searchMode, setSearchMode] = useState<'camera' | 'manual'>('camera');
  const [searchPlate, setSearchPlate] = useState('');
  const [scannedRegResult, setScannedRegResult] = useState<MotorcycleRegistration | 'not_found' | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanFlash, setScanFlash] = useState<'success' | 'not_found' | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [currentLog, setCurrentLog] = useState<VerificationLog | null>(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [capturedFrameSrc, setCapturedFrameSrc] = useState<string | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [expandedVehicleSpecs, setExpandedVehicleSpecs] = useState(false);
  const [expandedDocs, setExpandedDocs] = useState(false);
  const [expandedDigitalId, setExpandedDigitalId] = useState(false);
  const [showNotesSection, setShowNotesSection] = useState(false);
  const [showDigitalIdModal, setShowDigitalIdModal] = useState(false);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef(false);



  // Audio indicator synthesizer using Web Audio API
  const playScanFeedback = (isSuccess: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (isSuccess) {
        // High-pitched pleasant dual-tone success beep (880Hz -> 1760Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        osc2.frequency.setValueAtTime(1760, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.08);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.25);

        if (navigator.vibrate) {
          navigator.vibrate([80, 40, 80]);
        }
      } else {
        // Low-tone warning sound for unverified QR
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);

        if (navigator.vibrate) {
          navigator.vibrate([150]);
        }
      }
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  };

// Fullscreen forced request removed per user preference.

  // Reset and start camera scanner whenever modal/page is opened
  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      setScannedRegResult(null);
      setCameraError('');
      setCurrentLog(null);
      setVerificationNotes('');
      setShowNotesSection(false);
      setUploadedImageSrc(null);
      setCapturedFrameSrc(null);
      setIsProcessingScan(false);
      setExpandedVehicleSpecs(false);
      setExpandedDocs(false);
      setExpandedDigitalId(false);
    }
  }, [isOpen]);

  // Helper function to auto-create and save verification log immediately upon QR match/search
  const autoSaveLog = (foundReg: MotorcycleRegistration, initialNotes?: string) => {
    const isPass = foundReg.status === 'printed' || foundReg.status === 'approved';
    const logId = `LOG-${Math.floor(100000 + Math.random() * 900000)}`;
    const noteText =
      initialNotes !== undefined
        ? initialNotes
        : isPass
        ? 'QR permit scan verified.'
        : 'Unapproved vehicle permit scanned.';

    const newLog: VerificationLog = {
      id: logId,
      scannedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      plateNumber: foundReg.plateNumber,
      fullName: foundReg.fullName,
      phone: foundReg.phone,
      vehicleCategory: foundReg.vehicleCategory,
      engineOrSerialNo: foundReg.engineOrSerialNo,
      permitStatus: foundReg.status,
      verificationStatus: isPass ? 'verified' : 'warning',
      officerNotes: noteText,
      officerBadgeId: userBadgeId || 'OFF-8842',
      locationName: 'Field Checkpoint Scan',
      userPortraitPhoto: foundReg.userPortraitPhoto || foundReg.nationalIdPhoto,
      nationalIdPhoto: foundReg.nationalIdPhoto,
      drivingLicensePhoto: foundReg.drivingLicensePhoto,
      drivingPermitPhoto: foundReg.drivingPermitPhoto,
    };

    setCurrentLog(newLog);
    setVerificationNotes(noteText);

    if (onAddVerificationLog) {
      onAddVerificationLog(newLog, false);
    }
    return newLog;
  };

  // Live update the existing log whenever officer types or updates notes
  const handleNoteChange = (newNotes: string) => {
    setVerificationNotes(newNotes);
    if (currentLog && onAddVerificationLog) {
      const updatedLog: VerificationLog = {
        ...currentLog,
        officerNotes: newNotes,
        scannedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };
      setCurrentLog(updatedLog);
      onAddVerificationLog(updatedLog, true);
    }
  };

  // Flip camera between front and rear facing mode
  const handleFlipCamera = () => {
    setIsTorchOn(false);
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Toggle flash/torch on active video track
  const handleToggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setIsTorchOn(nextState);
      } catch (e) {
        console.warn('Torch constraint not supported on this device/browser:', e);
      }
    }
  };

  // Live Camera QR Scan Loop via jsQR
  useEffect(() => {
    let active = true;

    if (isOpen && isScanning && searchMode === 'camera' && !scannedRegResult) {
      setCameraError('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(isAmharic ? 'ካሜራ በዚህ አሳሽ አይደገፍም' : 'Camera is not supported on this browser or device.');
        return;
      }

      navigator.mediaDevices
        .getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        .then((stream) => {
          if (!active) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          const scanFrame = () => {
            if (!active) return;
            const video = videoRef.current;
            if (video && video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
              });
              if (code && code.data) {
                processQRData(code.data);
                return;
              }
            }
            animFrameRef.current = requestAnimationFrame(scanFrame);
          };

          animFrameRef.current = requestAnimationFrame(scanFrame);
        })
        .catch((err) => {
          if (!active) return;
          let msg = err?.message || 'Camera error';
          if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || msg.toLowerCase().includes('permission')) {
            msg = isAmharic ? 'የካሜራ ፍቃድ ተከልክሏል (Camera permission denied).' : 'Camera permission denied.';
          } else {
            msg = isAmharic ? 'ካሜራ ማግኘት አልተቻለም (Camera unavailable).' : 'Camera unavailable or disconnected.';
          }
          setCameraError(msg);
        });
    }

    return () => {
      active = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, isScanning, searchMode, scannedRegResult, isAmharic, facingMode]);

  if (!isOpen) return null;

  // Capture snapshot from video element
  const captureCameraFrame = (): string | null => {
    if (!videoRef.current || videoRef.current.readyState < 2) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.85);
      }
    } catch (e) {
      console.warn('Failed to capture video frame snapshot:', e);
    }
    return null;
  };

  const processQRData = async (qrData: string, imageOverride?: string) => {
    const cleanData = qrData.trim();
    if (!cleanData) return;
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    // Show active scanning processing animation
    setIsProcessingScan(true);

    if (imageOverride) {
      setUploadedImageSrc(imageOverride);
    } else {
      const frame = captureCameraFrame();
      if (frame) {
        setCapturedFrameSrc(frame);
      }
    }

    // Perform deep query against both local cache and live Firestore permit database
    const match = await lookupRegistrationInDb(cleanData, registrations);

    // Scanning delay (850ms) so scanning laser beam animation plays over captured camera/image frame
    setTimeout(() => {
      setIsProcessingScan(false);
      if (match) {
        playScanFeedback(true);
        setScanFlash('success');
        autoSaveLog(match);
        setTimeout(() => {
          setScannedRegResult(match);
          setIsScanning(false);
          setScanFlash(null);
          isProcessingRef.current = false;
        }, 450);
      } else {
        playScanFeedback(false);
        setScanFlash('not_found');
        setTimeout(() => {
          setScannedRegResult('not_found');
          setIsScanning(false);
          setScanFlash(null);
          isProcessingRef.current = false;
        }, 450);
      }
    }, 850);
  };

  const handleScanResult = (result: any) => {
    if (result && result.length > 0 && result[0].rawValue) {
      processQRData(result[0].rawValue);
    }
  };

  const handleSearchLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlate.trim()) return;

    setIsProcessingScan(true);
    const found = await lookupRegistrationInDb(searchPlate.trim(), registrations);
    setIsProcessingScan(false);

    if (found) {
      setScannedRegResult(found);
      autoSaveLog(found);
      setIsScanning(false);
    } else {
      setScannedRegResult('not_found');
      setCurrentLog(null);
      setIsScanning(false);
    }
  };

  // Helper to scan HTMLImageElement for QR or Barcodes using native API + multi-scale jsQR
  const decodeQRFromImage = async (img: HTMLImageElement): Promise<string | null> => {
    // 1. Try Native BarcodeDetector API if available
    if ('BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'data_matrix', 'pdf417']
        });
        const detected = await detector.detect(img);
        if (detected && detected.length > 0 && detected[0].rawValue) {
          return detected[0].rawValue;
        }
      } catch (err) {
        console.warn('Native BarcodeDetector failed, trying jsQR scales:', err);
      }
    }

    // 2. Try jsQR across multiple scaled canvas resolutions
    const targetSizes = [800, 1200, 500, Math.max(img.width, img.height)];
    for (const maxDim of targetSizes) {
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) continue;

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      });
      if (code && code.data && code.data.trim()) {
        return code.data.trim();
      }
    }

    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Synchronously set object URL for instant 0ms preview & immediate scanning animation
    const instantPreviewUrl = URL.createObjectURL(file);
    setUploadedImageSrc(instantPreviewUrl);
    setCapturedFrameSrc(null);
    setIsScanning(true);
    setScannedRegResult(null);
    setIsProcessingScan(true);
    isProcessingRef.current = true;

    const img = new Image();
    img.onload = async () => {
      const foundData = await decodeQRFromImage(img);
      
      // Delay so the user sees the active scanning animation over uploaded image in camera view
      setTimeout(() => {
        isProcessingRef.current = false;
        if (foundData) {
          processQRData(foundData, instantPreviewUrl);
        } else {
          setIsProcessingScan(false);
          playScanFeedback(false);
          setScanFlash('not_found');
          setTimeout(() => {
            setScannedRegResult('not_found');
            setIsScanning(false);
            setScanFlash(null);
            isProcessingRef.current = false;
          }, 450);
        }
      }, 700);
    };
    img.src = instantPreviewUrl;

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartCameraScan = () => {
    setCameraError('');
    setIsScanning(true);
    setUploadedImageSrc(null);
    setCapturedFrameSrc(null);
    setIsProcessingScan(false);
    setScannedRegResult(null);
  };

  const handleRescan = () => {
    setScannedRegResult(null);
    setCurrentLog(null);
    setSearchPlate('');
    setVerificationNotes('');
    setExpandedVehicleSpecs(false);
    setExpandedDocs(false);
    setExpandedDigitalId(false);
    setShowNotesSection(false);
    setZoomedImage(null);
    setUploadedImageSrc(null);
    setCapturedFrameSrc(null);
    setIsProcessingScan(false);
    if (searchMode === 'camera') {
      handleStartCameraScan();
    }
  };

  const mainCardContent = (
    <>
      {/* Hidden File Input for Image Scanning */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {!scannedRegResult ? (
        <div className="flex-1 flex flex-col min-h-0 justify-between gap-0 overflow-hidden h-full max-h-full w-full relative">
          {/* Camera View Box - Full viewpoint height & width */}
          <div className="relative bg-slate-950 rounded-none w-full flex-1 min-h-0 overflow-hidden flex flex-col items-center justify-center border-0">
            {isScanning ? (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black overflow-hidden">
                {uploadedImageSrc ? (
                  <img
                    src={uploadedImageSrc}
                    alt="Uploaded QR Image"
                    className="w-full h-full object-cover bg-slate-950"
                  />
                ) : capturedFrameSrc ? (
                  <img
                    src={capturedFrameSrc}
                    alt="Captured Camera Frame"
                    className="w-full h-full object-cover bg-slate-950"
                  />
                ) : (
                  <video 
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}

                {/* Dark Vignette Overlay for Camera Feed */}
                <div className="absolute inset-0 bg-black/25 pointer-events-none z-0" />

                {/* Top Active Scanning Status Badge (Shown only for live camera processing, disabled for image upload scanning) */}
                {isProcessingScan && !uploadedImageSrc && (
                  <div className="absolute top-16 z-30 flex items-center gap-2 bg-sky-500/90 px-4 py-1.5 rounded-full text-white font-extrabold text-xs sm:text-sm shadow-xl border border-sky-300 backdrop-blur-md">
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>
                      {isAmharic ? 'QR ኮድ በመተንተን እና በመቃኘት ላይ...' : 'Capturing & Processing QR Code...'}
                    </span>
                  </div>
                )}

                {/* Custom Live Scanner Overlay UI - Full screen viewfinder & bottom controls */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10">
                  {/* 1. TOP HEADER with Opaque Dark Background & Blur */}
                  <div className="w-full flex flex-col pt-3 px-4 sm:px-6 z-30 shrink-0">
                    <div className="pointer-events-auto bg-black/70 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xl">
                      {/* Back Button with Title */}
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center gap-1.5 sm:gap-2 text-white hover:text-white/80 active:scale-95 transition-all cursor-pointer drop-shadow-md select-none group"
                        title={isAmharic ? 'ተመለስ' : 'Back'}
                      >
                        <span className="material-symbols-outlined text-[28px] sm:text-[32px] leading-none text-white transition-transform group-hover:-translate-x-0.5">
                          chevron_left
                        </span>
                        <span className="text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-xs">
                          {isAmharic ? 'የQR ኮድ ስካነር' : 'Scan QR code'}
                        </span>
                      </button>
                    </div>

                    {/* Search Dropdown Card if active */}
                    {showTopMenu && (
                      <div className="pointer-events-auto w-full max-w-md mx-auto mt-3 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl p-3 text-white backdrop-blur-xl animate-in slide-in-from-top-3 duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px] text-primary">search</span>
                            <span>{isAmharic ? 'በሰሌዳ ቁጥር ወይም በስም ፈልግ' : 'Search by Plate No or Owner Name'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowTopMenu(false)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                        <form
                          onSubmit={(e) => {
                            handleSearchLookup(e);
                            setShowTopMenu(false);
                          }}
                          className="flex gap-2 items-center"
                        >
                          <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-3 flex items-center justify-center pointer-events-none text-slate-400">
                              <Search size={18} />
                            </div>
                            <input
                              type="text"
                              value={searchPlate}
                              onChange={(e) => setSearchPlate(e.target.value)}
                              placeholder={isAmharic ? 'የሰሌዳ ቁጥር ወይም ስም ያስገቡ...' : 'Enter Plate No or Name...'}
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                              autoFocus
                            />
                          </div>
                          <button
                            type="submit"
                            className="bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
                          >
                            <Search size={18} />
                            <span>{isAmharic ? 'ፈልግ' : 'Search'}</span>
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* 2. CENTER VIEWFINDER (Bigger Reticle Size) */}
                  <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
                    <div
                      className="relative w-72 h-72 sm:w-92 sm:h-92 max-w-[85vw] max-h-[75vh] border border-white/20 rounded-2xl flex-shrink-0"
                      style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)' }}
                    >
                      {/* 4 Vibrant Blue Corner Brackets */}
                      <div className="absolute -top-1 -left-1 w-7 h-7 border-t-[4px] border-l-[4px] border-[#3b82f6] rounded-tl-sm z-20" />
                      <div className="absolute -top-1 -right-1 w-7 h-7 border-t-[4px] border-r-[4px] border-[#3b82f6] rounded-tr-sm z-20" />
                      <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-[4px] border-l-[4px] border-[#3b82f6] rounded-bl-sm z-20" />
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-[4px] border-r-[4px] border-[#3b82f6] rounded-br-sm z-20" />

                      {/* Animated Red Laser Scanning Line */}
                      {!uploadedImageSrc && (
                        <div className="absolute left-2 right-2 h-[2.5px] bg-red-500 shadow-[0_0_14px_#ef4444] rounded-full z-20 animate-red-laser" />
                      )}
                    </div>
                  </div>

                  {/* 3. BOTTOM SECTION: Guide Text (No background, placed above bottom buttons) & ACTION BUTTONS */}
                  <div className="pointer-events-auto flex flex-col items-center w-full max-w-md mx-auto px-4 pb-6 z-30 shrink-0 gap-2 sm:gap-2.5">
                    {/* Guide Text without background, positioned just above action buttons */}
                    <div className="text-center pointer-events-none select-none">
                      <span className="text-xs sm:text-sm font-semibold text-white/90 drop-shadow-md">
                        {isAmharic ? 'የQR ኮዱን ሳጥኑ ውስጥ ያስገቡ' : 'Point camera at the QR permit code'}
                      </span>
                    </div>

                    {/* Bottom Action Buttons Row with Opaque Dark Background & Blur */}
                    <div className="w-full bg-black/70 backdrop-blur-md border border-white/15 rounded-2xl p-3 sm:p-4 flex items-center justify-evenly shadow-2xl">
                      {/* 1. Search Button */}
                      <button
                        type="button"
                        onClick={() => setShowTopMenu(!showTopMenu)}
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all active:scale-95 flex items-center justify-center shadow-lg cursor-pointer backdrop-blur-md ${
                          showTopMenu
                            ? 'bg-primary text-white shadow-primary/40 ring-2 ring-primary/50'
                            : 'bg-white/20 hover:bg-white/30 active:bg-white/40 text-white'
                        }`}
                        title={isAmharic ? 'ፈልግ' : 'Search'}
                      >
                        <span className="material-symbols-outlined text-[24px]">search</span>
                      </button>

                      {/* 2. Photo Gallery Upload */}
                      <button
                        type="button"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                            fileInputRef.current.click();
                          }
                        }}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 text-white backdrop-blur-md transition-all active:scale-95 flex items-center justify-center shadow-lg cursor-pointer"
                        title={isAmharic ? 'ምስል ስካን' : 'Select Photo'}
                      >
                        <span className="material-symbols-outlined text-[24px]">image</span>
                      </button>

                      {/* 3. Flashlight / Torch Toggle */}
                      <button
                        type="button"
                        onClick={handleToggleTorch}
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all active:scale-95 flex items-center justify-center shadow-lg cursor-pointer backdrop-blur-md ${
                          isTorchOn
                            ? 'bg-amber-400 text-amber-950 shadow-amber-400/40 ring-2 ring-amber-300/60'
                            : 'bg-white/20 hover:bg-white/30 active:bg-white/40 text-white'
                        }`}
                        title={isAmharic ? 'ፍላሽ' : 'Flashlight'}
                      >
                        <span className="material-symbols-outlined text-[24px]">
                          {isTorchOn ? 'flashlight_on' : 'flashlight_off'}
                        </span>
                      </button>

                      {/* 4. Switch Camera (Front/Rear) */}
                      <button
                        type="button"
                        onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 text-white backdrop-blur-md transition-all active:scale-95 flex items-center justify-center shadow-lg cursor-pointer"
                        title={isAmharic ? 'ካሜራ ቀይር' : 'Switch Camera'}
                      >
                        <span className="material-symbols-outlined text-[24px]">cameraswitch</span>
                      </button>
                    </div>
                  </div>
                </div>


                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center z-20 space-y-2">
                    <span className="material-symbols-outlined text-rose-400 text-[32px]">videocam_off</span>
                    <p className="text-rose-300 text-xs font-bold max-w-xs">{cameraError}</p>
                    <button
                      type="button"
                      onClick={handleStartCameraScan}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {isAmharic ? 'እንደገና ሞክር' : 'Retry Camera'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 p-3 w-full max-w-md mx-auto flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <span className="material-symbols-outlined text-[28px] animate-pulse">
                    qr_code_scanner
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-100">
                  {isAmharic ? 'የQR ኮድ ፍተሻ' : 'QR Verification'}
                </h4>
                <div className="grid grid-cols-2 gap-2 w-full pt-0.5">
                  <button
                    type="button"
                    onClick={handleStartCameraScan}
                    className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                    <span>{isAmharic ? 'ካሜራ' : 'Camera'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                        fileInputRef.current.click();
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <span className="material-symbols-outlined text-[18px]">image</span>
                    <span>{isAmharic ? 'ምስል ስካን' : 'Image Scan'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : scannedRegResult === 'not_found' ? (
        <div className="bg-transparent p-4 sm:p-6 m-0 rounded-none border-0 text-xs sm:text-sm shadow-none space-y-3 animate-in fade-in duration-150 flex flex-col h-full max-h-full overflow-hidden justify-center">
          {/* Top Status Header Bar inside the container */}
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-red-950 dark:text-red-300 rounded-xl px-3.5 py-1.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] select-none text-red-600 dark:text-red-400">
                  cancel
                </span>
                <span className="font-black text-sm sm:text-base">
                  {isAmharic ? 'ያልተፈቀደለት የሞተር ፈቃድ' : 'Motor Permit Status'}
                </span>
              </div>
              <div className="bg-red-200/60 dark:bg-red-900/60 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-700 text-xs px-2.5 py-0.5 rounded-lg uppercase tracking-wider font-extrabold shadow-2xs">
                {isAmharic ? 'ያልተመዘገበ (UNREGISTERED)' : 'UNREGISTERED'}
              </div>
            </div>
          </div>

          <div className="space-y-2 flex flex-col items-center justify-center py-4">
            <div className="w-12 h-12 rounded-full bg-error-container/30 border border-error/30 flex items-center justify-center text-error mb-1">
              <span className="material-symbols-outlined text-[28px]">
                error_outline
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-on-surface">
              {isAmharic ? 'መረጃው አልተገኘም' : 'Record Not Found'}
            </h4>
            <p className="text-[11px] text-secondary text-center max-w-sm">
              {isAmharic 
                ? 'የቃኙት QR ኮድ ወይም ያስገቡት መረጃ አልተገኘም። እባክዎ በድጋሚ ይሞክሩ።' 
                : 'Scanned record not found in system registry.'}
            </p>
            <button
               type="button"
               onClick={handleRescan}
               className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
             >
               <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
               <span>{isAmharic ? 'ድጋሚ ቃኝ' : 'Rescan'}</span>
             </button>
          </div>
        </div>
      ) : (
        <div className="bg-transparent p-0 m-0 text-xs sm:text-sm flex flex-col h-full max-h-full overflow-hidden shadow-none animate-in fade-in duration-150">
          {(() => {
            const statusLower = (scannedRegResult.status || '').toLowerCase();
            const isApproved = statusLower === 'approved' || statusLower === 'printed' || statusLower === 'ordered_print';
            const isRejected = statusLower === 'rejected';
            const isPending = !isApproved && !isRejected;

            const portraitUrl =
              scannedRegResult.userPortraitPhoto ||
              scannedRegResult.nationalIdPhoto ||
              scannedRegResult.drivingLicensePhoto ||
              scannedRegResult.drivingPermitPhoto ||
              (scannedRegResult as any).photoUrl ||
              (scannedRegResult as any).avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(scannedRegResult.fullName || 'User')}&size=256&background=0284c7&color=fff&bold=true`;

            return (
              <>
                {/* 1. FIXED TOP HEADER BAR WITH STATUS COLOR FILL & FORMATTED STATUS TEXT */}
                <div className={`flex flex-col border-b py-2 px-3.5 sm:px-4 shrink-0 gap-1.5 z-10 shadow-xs transition-colors ${
                  isApproved 
                    ? 'bg-emerald-500/15 border-emerald-500/30 dark:bg-emerald-950/70 dark:border-emerald-800/80' 
                    : isPending
                    ? 'bg-amber-500/15 border-amber-500/30 dark:bg-amber-950/70 dark:border-amber-800/80'
                    : 'bg-red-500/15 border-red-500/30 dark:bg-red-950/70 dark:border-red-800/80'
                }`}>
                  <div className="flex justify-between items-center w-full gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Rescan Button on Left as < button no text */}
                      <button
                        type="button"
                        onClick={handleRescan}
                        className="w-9 h-9 rounded-xl bg-black/10 hover:bg-black/20 text-on-surface transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                        title={isAmharic ? 'ድጋሚ ቃኝ (Rescan)' : 'Rescan'}
                      >
                        <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                      </button>

                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isApproved 
                          ? 'bg-emerald-600 text-white' 
                          : isPending
                          ? 'bg-amber-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        <span className="material-symbols-outlined text-[24px]">
                          {isApproved ? 'check_circle' : isPending ? 'warning' : 'cancel'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-sm sm:text-base font-black tracking-tight leading-tight ${
                          isApproved 
                            ? 'text-emerald-700 dark:text-emerald-300' 
                            : isPending 
                            ? 'text-amber-700 dark:text-amber-300' 
                            : 'text-red-700 dark:text-red-300'
                        }`}>
                          {isApproved
                            ? (isAmharic ? 'ፈቃድ የተሰጠው ነው' : 'Permit Granted / Approved')
                            : isPending
                            ? (isAmharic ? 'ፈቃድ አልተሰጠውም (በመጠባበቅ ላይ)' : 'Pending Approval / No Active Permit')
                            : (isAmharic ? 'ፈቃድ ተከልክሏል' : 'Permit Rejected')}
                        </span>
                      </div>
                    </div>

                    {/* Add Note Button Icon Only on Top Header Right Side */}
                    <button
                      type="button"
                      onClick={() => setShowNotesSection(!showNotesSection)}
                      className={`w-9 h-9 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs ${
                        showNotesSection
                          ? 'bg-primary text-on-primary'
                          : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20'
                      }`}
                      title={isAmharic ? 'ማስታወሻ ጨምር' : 'Add Inspection Note'}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showNotesSection ? 'edit_note' : 'note_add'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. MIDDLE SCROLLABLE BODY CONTENT */}
                <div className="flex-1 overflow-y-auto min-h-0 p-3.5 sm:p-4 space-y-3">
                  {/* Warning Alert Banner for Pending Registration Results */}
                  {isPending && (
                    <div className="bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-600/80 p-3 rounded-2xl text-xs flex items-start gap-2.5 shadow-2xs">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">warning</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-amber-900 dark:text-amber-100 text-xs sm:text-sm">
                          {isAmharic ? 'ማስጠንቀቂያ፡ ማረጋገጫ በመጠባበቅ ላይ ያለ (PENDING APPROVAL)' : 'WARNING: PENDING APPROVAL REGISTRATION'}
                        </p>
                        <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                          {isAmharic
                            ? 'ይህ ተሽከርካሪ በስርዓቱ ከተመዘገቡት መረጃዎች መካከል ቢገኝም በከተማው አስተዳደር ገና አልጸደቀም። የመንቀሳቀሻ ፍቃድ የለውም።'
                            : 'This vehicle record exists in the system but is PENDING ADMIN APPROVAL. No active movement permit has been issued yet.'}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Upper Profile Section with Portrait Photo & Owner Name (Hidden when specs expanded) */}
                  {!expandedVehicleSpecs && (
                  <div className="bg-surface border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2">
                    {/* Profile Header with Portrait Photo & Owner Name under it */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-3.5 pt-0.5">
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className="relative group cursor-pointer" onClick={() => setZoomedImage({
                          url: portraitUrl,
                          title: `${scannedRegResult.fullName} — ${isAmharic ? 'የባለቤት ፎቶ' : 'Owner Portrait Photo'}`
                        })}>
                          <SmartImage
                            src={portraitUrl}
                            alt={scannedRegResult.fullName || 'Owner Portrait'}
                            fallbackIcon="person"
                            className="w-40 h-48 sm:w-48 sm:h-56 object-cover rounded-2xl border border-outline-variant shadow-sm group-hover:opacity-95 transition-opacity bg-surface-container"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white text-xs font-bold">
                            <span className="material-symbols-outlined text-[24px]">zoom_in</span>
                          </div>
                        </div>
                        {/* Owner Name shown under portrait photo */}
                        <div className="text-center max-w-[200px] pt-1">
                          <span className="text-[10px] uppercase tracking-wider text-secondary font-bold block">
                            {isAmharic ? 'የባለቤት ስም' : 'Owner Name'}
                          </span>
                          <h4 className="font-extrabold text-sm sm:text-base text-on-surface leading-snug">
                            {scannedRegResult.fullName}
                          </h4>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-center gap-2.5 w-full">
                        {/* Registration No and Plate Number */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-surface-container/30 p-2 rounded-xl">
                            <span className="text-secondary block text-[10px] font-semibold">{isAmharic ? 'የምዝገባ ቁጥር' : 'Registration No'}</span>
                            <span className="font-mono font-black text-sm text-on-surface truncate block mt-0.5">{scannedRegResult.id}</span>
                          </div>
                          <div className="bg-surface-container/30 p-2 rounded-xl">
                            <span className="text-secondary block text-[10px] font-semibold">{isAmharic ? 'የሰሌዳ ቁጥር' : 'Plate Number'}</span>
                            <span className="font-mono font-black text-sm text-primary truncate block mt-0.5">{scannedRegResult.plateNumber}</span>
                          </div>
                        </div>

                        {/* Category and Motor Brand/Model */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-surface-container/30 p-2 rounded-xl">
                            <span className="text-secondary block text-[10px] font-semibold">{isAmharic ? 'ዓይነት' : 'Category'}</span>
                            <span className="font-bold text-xs text-on-surface truncate block mt-0.5">
                              {scannedRegResult.vehicleCategory === 'electric' 
                                ? (isAmharic ? 'ኤሌክትሪክ (EV)' : 'Electric EV') 
                                : (isAmharic ? 'ቤንዚን (Gasoline)' : 'Gasoline')}
                            </span>
                          </div>
                          <div className="bg-surface-container/30 p-2 rounded-xl">
                            <span className="text-secondary block text-[10px] font-semibold">{isAmharic ? 'ብራንድ / ሞዴል' : 'Brand / Model'}</span>
                            <span className="font-bold text-xs text-on-surface truncate block mt-0.5">
                              {[scannedRegResult.motorBrand, scannedRegResult.motorModel].filter(Boolean).join(' ') || '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* 1. SECTION: የተሽከርካሪ መረጃ እና ዝርዝር (Vehicle Specifications) */}
                  <div className="bg-surface border border-outline-variant rounded-2xl p-3.5 shadow-sm space-y-2 pt-2">
                    <div className="w-full flex items-center justify-between py-1">
                      <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">two_wheeler</span>
                        <span>{isAmharic ? 'የተሽከርካሪ መረጃ እና ዝርዝር' : 'Vehicle Specifications'}</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => setExpandedVehicleSpecs((prev) => !prev)}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer border border-primary/20 shadow-2xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {expandedVehicleSpecs ? 'expand_less' : 'info'}
                        </span>
                        <span>{isAmharic ? (expandedVehicleSpecs ? 'ዝጋ' : 'ተጨማሪ መረጃ') : (expandedVehicleSpecs ? 'Collapse' : 'More Info')}</span>
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {expandedVehicleSpecs && (
                        <motion.div
                          key="vehicle-specs-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.16, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                            {/* Category (Type) */}
                            <div className="bg-surface-container/30 p-2 rounded-lg">
                              <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'ዓይነት' : 'Category / Type'}</span>
                              <span className="font-bold text-on-surface capitalize block truncate">
                                {scannedRegResult.vehicleCategory === 'electric' 
                                  ? (isAmharic ? 'ኤሌክትሪክ (Electric)' : 'Electric') 
                                  : (isAmharic ? 'ቤንዚን (Gasoline)' : 'Gasoline')}
                              </span>
                            </div>

                            {/* Brand & Model */}
                            <div className="bg-surface-container/30 p-2 rounded-lg">
                              <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'ብራንድ እና ሞዴል' : 'Brand & Model'}</span>
                              <span className="font-bold text-on-surface block truncate">
                                {[scannedRegResult.motorBrand, scannedRegResult.motorModel].filter(Boolean).join(' ') || '-'}
                              </span>
                            </div>

                            {/* Plate Number */}
                            <div className="bg-surface-container/30 p-2 rounded-lg">
                              <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'የሰሌዳ ቁጥር' : 'Plate Number'}</span>
                              <span className="font-mono font-black text-xs sm:text-sm text-primary block truncate">{scannedRegResult.plateNumber}</span>
                            </div>

                            {/* Phone Number */}
                            <div className="bg-surface-container/30 p-2 rounded-lg">
                              <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'ስልክ ቁጥር' : 'Phone Number'}</span>
                              <a href={`tel:${scannedRegResult.phone}`} className="font-mono font-bold hover:underline text-primary block truncate">
                                {scannedRegResult.phone}
                              </a>
                            </div>

                            {/* Sub City */}
                            <div className="bg-surface-container/30 p-2 rounded-lg">
                              <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'ክፍለ ከተማ' : 'Sub-City'}</span>
                              <span className="font-semibold text-on-surface block truncate">
                                {scannedRegResult.subCity || (isAmharic ? 'በላይ ዘለቀ' : 'Belay Zeleke')}
                              </span>
                            </div>

                            {/* Registered By */}
                            <div className="bg-surface-container/30 p-2 rounded-lg">
                              <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'የተመዘገበበት ባጅ' : 'Registered By'}</span>
                              <span className="font-mono font-bold text-on-surface block truncate">{scannedRegResult.registeredBy || 'CLK-104'}</span>
                            </div>

                            {/* Registration Date */}
                            <div className="bg-surface-container/30 p-2 rounded-lg">
                              <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'የምዝገባ ቀን' : 'Registration Date'}</span>
                              <span className="font-mono text-on-surface block truncate">{scannedRegResult.registrationDate}</span>
                            </div>

                            {/* Permit Status */}
                            <div className="bg-surface-container/30 p-2 rounded-lg">
                              <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'የፈቃድ ሁኔታ' : 'Permit Status'}</span>
                              <span className={`font-black uppercase text-[11px] flex items-center gap-1 mt-0.5 truncate ${
                                isApproved ? 'text-emerald-600 dark:text-emerald-400' : isPending ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                                <span className="material-symbols-outlined text-[15px]">
                                  {isApproved ? 'check_circle' : isPending ? 'warning' : 'cancel'}
                                </span>
                                <span>
                                  {isApproved
                                    ? (isAmharic ? 'የተፈቀደ (APPROVED)' : 'APPROVED')
                                    : isRejected
                                    ? (isAmharic ? 'ውድቅ (REJECTED)' : 'REJECTED')
                                    : (isAmharic ? 'በማፅደቅ ላይ (PENDING)' : 'PENDING APPROVAL')}
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* 2. SECTION: የባለቤት ማስረጃዎች (Document Credentials) - Rendered statically inside Vehicle Specs collapsible */}
                          <div className="space-y-2 pt-4 border-t border-outline-variant/40 mt-4">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[18px]">folder_shared</span>
                                <span>{isAmharic ? 'የባለቤት ማስረጃዎች' : 'Document Credentials'}</span>
                              </h4>
                              <span className="text-[10px] text-secondary">{isAmharic ? 'ለማየት ይጫኑ' : 'Click to zoom'}</span>
                            </div>


                            
                            {/* Police Permit - First item with full width and no other items besides it */}
                            {scannedRegResult.drivingPermitPhoto && (
                              <div className="mb-4">
                                <span className="text-[10px] font-extrabold text-secondary block mb-1 uppercase tracking-wider">
                                  {isAmharic ? 'የፖሊስ የመንቀሳቀሻ ፈቃድ' : 'Police Permit'}
                                </span>
                                <div
                                  onClick={() => setZoomedImage({
                                    url: scannedRegResult.drivingPermitPhoto || '',
                                    title: `${scannedRegResult.fullName} — ${isAmharic ? 'የፖሊስ የመንቀሳቀሻ ፈቃድ (Police Permit)' : 'Police Permit'}`
                                  })}
                                  className="group cursor-pointer bg-primary/5 hover:bg-primary/10 border border-primary/20 p-2.5 rounded-2xl text-center space-y-1.5 transition-all shadow-2xs"
                                >
                                  <div className="relative h-44 sm:h-52 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-outline-variant/60">
                                    <SmartImage
                                      src={scannedRegResult.drivingPermitPhoto}
                                      alt="Police Permit"
                                      fallbackIcon="menu_book"
                                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <span className="material-symbols-outlined text-[28px] animate-in zoom-in-75 duration-200">zoom_in</span>
                                    </div>
                                  </div>
                                  <span className="text-xs font-black text-on-surface block">
                                    {isAmharic ? 'የፖሊስ ፈቃድ' : 'Police Permit'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Remaining Documents List */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                              {/* Document 1: National ID (Front) */}
                              <div
                                onClick={() => setZoomedImage({
                                  url: scannedRegResult.nationalIdPhoto || '',
                                  title: `${scannedRegResult.fullName} — National ID (Front)`
                                })}
                                className="group cursor-pointer bg-surface-container/30 p-1.5 rounded-xl text-center space-y-1 hover:bg-surface-container/60 transition-colors border border-outline-variant/40"
                              >
                                <div className="relative h-28 sm:h-32 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                                  <SmartImage
                                    src={scannedRegResult.nationalIdPhoto}
                                    alt="National ID Front"
                                    fallbackIcon="badge"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-on-surface block truncate">{isAmharic ? 'መታወቂያ (ፊት)' : 'ID Front'}</span>
                              </div>

                              {/* Document 1b: National ID (Back) */}
                              {scannedRegResult.nationalIdBackPhoto && (
                                <div
                                  onClick={() => setZoomedImage({
                                    url: scannedRegResult.nationalIdBackPhoto,
                                    title: `${scannedRegResult.fullName} — National ID (Back)`
                                  })}
                                  className="group cursor-pointer bg-surface-container/30 p-1.5 rounded-xl text-center space-y-1 hover:bg-surface-container/60 transition-colors border border-outline-variant/40"
                                >
                                  <div className="relative h-28 sm:h-32 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                                    <SmartImage
                                      src={scannedRegResult.nationalIdBackPhoto}
                                      alt="National ID Back"
                                      fallbackIcon="badge"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-on-surface block truncate">{isAmharic ? 'መታወቂያ (ጀርባ)' : 'ID Back'}</span>
                                </div>
                              )}

                              {/* Document 2: Driving License */}
                              <div
                                onClick={() => setZoomedImage({
                                  url: scannedRegResult.drivingLicensePhoto || '',
                                  title: `${scannedRegResult.fullName} — Driving License`
                                })}
                                className="group cursor-pointer bg-surface-container/30 p-1.5 rounded-xl text-center space-y-1 hover:bg-surface-container/60 transition-colors border border-outline-variant/40"
                              >
                                <div className="relative h-28 sm:h-32 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                                  <SmartImage
                                    src={scannedRegResult.drivingLicensePhoto}
                                    alt="Driving License"
                                    fallbackIcon="card_membership"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-on-surface block truncate">{isAmharic ? 'የመንጃ ፍቃድ' : 'Driving License'}</span>
                              </div>
                            </div>
                          </div>

                          {/* 3. SECTION: የዲጂታል መታወቂያ ካርድ (Digital ID Card) - Click to zoom style */}
                          <div className="space-y-2 pt-4 border-t border-outline-variant/40 mt-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                                <span>{isAmharic ? 'የዲጂታል መታወቂያ ካርድ' : 'Digital ID Card'}</span>
                              </h4>
                              <span className="text-[10px] text-secondary font-bold bg-primary/10 px-2 py-0.5 rounded-md">{isAmharic ? 'ለማየት ይጫኑ' : 'Click to zoom'}</span>
                            </div>
                            <div
                              onClick={() => setShowDigitalIdModal(true)}
                              className="group cursor-pointer bg-surface-container/30 hover:bg-surface-container/60 border border-outline-variant p-3.5 rounded-2xl text-center space-y-1.5 transition-all shadow-2xs"
                            >
                              <div className="relative rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-3 border border-outline-variant/60">
                                <QRCodeCard registration={scannedRegResult} lang={lang} />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-[28px] animate-in zoom-in-75 duration-200">zoom_in</span>
                                </div>
                              </div>
                              <span className="text-xs font-black text-on-surface block">
                                {isAmharic ? 'የዲጂታል መታወቂያ ካርድ' : 'Digital ID Card'}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                </div>

                {/* 3. FIXED BOTTOM SECTION WITH SLIDEOUT INSPECTION NOTES */}
                <div className="shrink-0 bg-surface-container-lowest border-t border-outline-variant/60 z-20 shadow-lg relative flex flex-col">
                  {/* Slideout Inspection Notes Form */}
                  <AnimatePresence>
                    {showNotesSection && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden bg-surface-container-low/70 border-b border-outline-variant/40"
                      >
                        <div className="p-3.5 sm:p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[18px] text-primary">edit_note</span>
                              <span>{isAmharic ? 'የተቆጣጣሪ ማስታወሻ' : 'Inspection Notes'}</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowNotesSection(false)}
                              className="text-secondary hover:text-on-surface p-1 rounded-lg hover:bg-surface-container text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                              <span>{isAmharic ? 'ደብቅ' : 'Hide'}</span>
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={verificationNotes}
                            onChange={(e) => handleNoteChange(e.target.value)}
                            placeholder={isAmharic ? 'ማስታወሻ ይጻፉ...' : 'Type inspection notes...'}
                            className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                            autoFocus
                          />
                          
                          {/* Record Button ('መዝግብ' / 'Record') inside inspection notes container */}
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (currentLog && onAddVerificationLog) {
                                  const finalLog: VerificationLog = {
                                    ...currentLog,
                                    officerNotes: verificationNotes || currentLog.officerNotes,
                                    scannedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                                  };
                                  onAddVerificationLog(finalLog, true);
                                }
                                onClose();
                                handleRescan();
                              }}
                              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
                              <span>{isAmharic ? 'መዝግብ' : 'Record'}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>


                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* DIGITAL ID LIGHTBOX MODAL */}
      {showDigitalIdModal && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setShowDigitalIdModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
            <ZoomableDocumentContainer
              lang={lang}
              title={isAmharic ? 'የዲጂታል መታወቂያ ካርድ' : 'Digital ID Card'}
              onClose={() => setShowDigitalIdModal(false)}
              requireClerkRequest={false}
            >
              <div className="p-4 bg-white dark:bg-slate-900 flex items-center justify-center">
                <QRCodeCard registration={scannedRegResult} lang={lang} />
              </div>
            </ZoomableDocumentContainer>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR EXPANDED DOCUMENT INSPECTION */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 overflow-y-auto"
          onClick={() => setZoomedImage(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-4xl">
            <ZoomableDocumentContainer
              lang={lang}
              title={zoomedImage.title}
              onClose={() => setZoomedImage(null)}
              requireClerkRequest={false}
            >
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </ZoomableDocumentContainer>
          </div>
        </div>
      )}
    </>
  );

  // Render as a standalone page component or full screen modal overlay
  if (isPage) {
    return (
      <div className="w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden bg-surface p-0 m-0 rounded-none">
        {mainCardContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-0 overflow-hidden transition-all duration-200">
      <div className="bg-surface rounded-none p-0 m-0 w-full max-w-full sm:max-w-6xl h-[100dvh] sm:h-[98vh] max-h-[100dvh] shadow-2xl flex flex-col overflow-hidden">
        {mainCardContent}
      </div>
    </div>
  );
};
