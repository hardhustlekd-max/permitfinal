import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { MotorcycleRegistration, VerificationLog, Language } from '../types';
import { QRCodeCard } from './QRCodeCard';

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
  const [isScanning, setIsScanning] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannedRegResult, setScannedRegResult] = useState<MotorcycleRegistration | 'not_found' | null>(null);
  const [scanFlash, setScanFlash] = useState<'success' | 'not_found' | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [currentLog, setCurrentLog] = useState<VerificationLog | null>(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [capturedFrameSrc, setCapturedFrameSrc] = useState<string | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
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

  // Auto start camera scanner by default whenever modal/page is open
  useEffect(() => {
    if (isOpen) {
      setIsScanning(true);
      setCameraError('');
      setScannedRegResult(null);
      setCurrentLog(null);
      setVerificationNotes('');
      setUploadedImageSrc(null);
      setCapturedFrameSrc(null);
      setIsProcessingScan(false);
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

  const processQRData = (qrData: string, imageOverride?: string) => {
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

    const cleanLower = cleanData.toLowerCase();

    // Flexible matching across all registration fields
    let match = registrations.find((r) => {
      const q = (r.qrCodeData || '').toLowerCase();
      const p = (r.plateNumber || '').toLowerCase().replace(/\s+/g, '');
      const cleanPlate = cleanLower.replace(/\s+/g, '');
      const id = (r.id || '').toLowerCase();
      const e = (r.engineOrSerialNo || '').toLowerCase();
      const name = (r.fullName || '').toLowerCase();
      const phoneDigits = (r.phone || '').replace(/\D/g, '');
      const inputDigits = cleanLower.replace(/\D/g, '');

      return (
        (q && (cleanLower.includes(q) || q.includes(cleanLower))) ||
        (p && (cleanPlate.includes(p) || p.includes(cleanPlate))) ||
        (id && (cleanLower.includes(id) || id.includes(cleanLower))) ||
        (e && (cleanLower.includes(e) || e.includes(cleanLower))) ||
        (name && (cleanLower.includes(name) || name.includes(cleanLower))) ||
        (phoneDigits.length >= 6 && inputDigits.length >= 6 && (inputDigits.includes(phoneDigits) || phoneDigits.includes(inputDigits)))
      );
    });

    // Fallback token matching if no direct string match found
    if (!match) {
      const tokens = cleanLower.split(/[\s,:/._\-?=]+/).filter((t) => t.length >= 3);
      match = registrations.find((r) => {
        const id = (r.id || '').toLowerCase();
        const p = (r.plateNumber || '').toLowerCase();
        const q = (r.qrCodeData || '').toLowerCase();
        return tokens.some((t) => (id && id.includes(t)) || (p && p.includes(t)) || (q && q.includes(t)));
      });
    }

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

  const handleSearchLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPlate.trim()) return;

    const found = registrations.find(
      (r) =>
        (r.plateNumber || '').toLowerCase().includes(searchPlate.trim().toLowerCase()) ||
        (r.id || '').toLowerCase().includes(searchPlate.trim().toLowerCase()) ||
        (r.fullName || '').toLowerCase().includes(searchPlate.trim().toLowerCase())
    );

    if (found) {
      setScannedRegResult(found);
      autoSaveLog(found);
    } else {
      setScannedRegResult('not_found');
      setCurrentLog(null);
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

    // Put uploaded image immediately in camera view and trigger scanning animation
    isProcessingRef.current = true;
    setIsScanning(true);
    setScannedRegResult(null);
    setIsProcessingScan(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgDataUrl = event.target?.result as string;
      setUploadedImageSrc(imgDataUrl);

      const img = new Image();
      img.onload = async () => {
        const foundData = await decodeQRFromImage(img);
        
        // Brief delay so the user sees scanning animation over uploaded image in camera view
        setTimeout(() => {
          isProcessingRef.current = false;
          if (foundData) {
            processQRData(foundData, imgDataUrl);
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
      img.src = imgDataUrl;
    };
    reader.readAsDataURL(file);
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
    setShowDetail(false);
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

      {/* Header Bar */}
      <div className="flex justify-between items-center border-b border-outline-variant pb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
          </div>
          <h3 className="font-extrabold text-sm sm:text-base text-on-surface">
            {isAmharic ? 'የQR ኮድ እና ሰሌዳ ፍተሻ' : 'Scan & QR Permit Verification'}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-secondary hover:text-on-surface p-1.5 rounded-xl hover:bg-surface-container cursor-pointer transition-colors flex items-center gap-1 text-xs font-bold"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
          <span className="hidden sm:inline">{isAmharic ? 'ዝጋ' : 'Close'}</span>
        </button>
      </div>

      {!scannedRegResult ? (
        <div className="space-y-3 flex-1 flex flex-col">
          {/* Camera View Box */}
          <div className="relative bg-slate-950 rounded-3xl w-full h-[380px] sm:h-[440px] overflow-hidden flex flex-col items-center justify-center shadow-inner border border-slate-800">
            {isScanning ? (
              <div className="w-full h-full relative flex items-center justify-center bg-black overflow-hidden">
                {uploadedImageSrc ? (
                  <img
                    src={uploadedImageSrc}
                    alt="Uploaded QR Image"
                    className="w-full h-full object-contain bg-slate-950"
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
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Dark Vignette Overlay for Camera Feed */}
                <div className="absolute inset-0 bg-black/25 pointer-events-none z-0" />

                {/* Top Active Scanning Status Badge */}
                {(isProcessingScan || uploadedImageSrc) && (
                  <div className="absolute top-4 z-30 flex items-center gap-2 bg-sky-500/90 backdrop-blur-md px-4 py-1.5 rounded-full text-white font-extrabold text-xs sm:text-sm shadow-xl animate-pulse border border-sky-300">
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    <span>
                      {uploadedImageSrc
                        ? (isAmharic ? 'የተጫነውን ምስል በመተንተን እና በመቃኘት ላይ...' : 'Scanning Uploaded Image...')
                        : (isAmharic ? 'QR ኮድ በመተንተን እና በመቃኘት ላይ...' : 'Capturing & Processing QR Code...')}
                    </span>
                  </div>
                )}

                {/* Custom Live Scanner Overlay UI matching Reference Image */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-5 z-10">
                  {/* Top spacing */}
                  <div />

                  {/* Center Viewfinder Reticle */}
                  <div className="flex flex-col items-center justify-center my-auto">
                    {/* Viewfinder Reticle Box */}
                    <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-[28px] flex-shrink-0 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.6)]">
                      {/* Smooth Vector White Corner Brackets - 2.5 Stroke Width, Zero Margin */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 200 200" fill="none">
                        {/* Top-Left Corner */}
                        <path d="M 38 2 H 28 A 26 26 0 0 0 2 28 V 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Top-Right Corner */}
                        <path d="M 162 2 H 172 A 26 26 0 0 1 198 28 V 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Bottom-Left Corner */}
                        <path d="M 38 198 H 28 A 26 26 0 0 1 2 172 V 162" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Bottom-Right Corner */}
                        <path d="M 162 198 H 172 A 26 26 0 0 0 198 172 V 162" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>

                      {/* Animated Glowing Blue Scan Beam & Downward Gradient Sheen */}
                      <div className="absolute inset-x-0 h-28 pointer-events-none z-10 animate-scan-beam flex flex-col">
                        <div className="w-full h-[3px] bg-sky-400 shadow-[0_0_16px_#38bdf8]"></div>
                        <div className="w-full h-24 bg-gradient-to-b from-sky-400/50 via-sky-500/25 to-transparent"></div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Corner Separate Floating Buttons (Image Scan on Left, Flashlight on Right) */}
                  <div className="pointer-events-auto flex items-center justify-between w-full px-1 pb-1">
                    {/* Left Pill Image Scan Glass Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                          fileInputRef.current.click();
                        }
                      }}
                      title={isAmharic ? 'ምስል ስካን' : 'Image Scan'}
                      className="h-11 px-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/25 shadow-xl transition-all cursor-pointer flex items-center gap-2 text-xs sm:text-sm font-bold active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">image</span>
                      <span>{isAmharic ? 'ምስል ስካን' : 'Image Scan'}</span>
                    </button>

                    {/* Right Circular Flashlight Toggle Glass Button */}
                    <button
                      type="button"
                      onClick={handleToggleTorch}
                      title={isAmharic ? 'ፍላሽ አብራ/አጥፋ' : 'Toggle Flash'}
                      className={`w-11 h-11 rounded-full backdrop-blur-md text-white border transition-all cursor-pointer flex items-center justify-center shadow-xl active:scale-95 ${
                        isTorchOn 
                          ? 'bg-amber-400/40 border-amber-300 text-amber-200' 
                          : 'bg-white/20 hover:bg-white/30 border-white/25'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isTorchOn ? 'flashlight_on' : 'flashlight_off'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Visual Flash & Sound Feedback Overlay */}
                {scanFlash && (
                  <div
                    className={`absolute inset-0 z-30 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-150 ${
                      scanFlash === 'success'
                        ? 'bg-emerald-500/35 border-4 border-emerald-400'
                        : 'bg-rose-500/35 border-4 border-rose-400'
                    }`}
                  >
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white shadow-2xl animate-bounce ${
                      scanFlash === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}>
                      <span className="material-symbols-outlined text-[36px] sm:text-[48px]">
                        {scanFlash === 'success' ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                    <span className="mt-2.5 text-sm sm:text-base font-extrabold text-white drop-shadow-lg tracking-wider uppercase">
                      {scanFlash === 'success'
                        ? (isAmharic ? 'ተረጋግጧል!' : 'Permit Verified!')
                        : (isAmharic ? 'አልተገኘም' : 'Not Found')}
                    </span>
                  </div>
                )}

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

          {/* Manual Search Row at bottom */}
          <form onSubmit={handleSearchLookup} className="flex gap-2 items-center">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[18px]">search</span>
              <input
                type="text"
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                placeholder={isAmharic ? 'የሰሌዳ ቁጥር ወይም ስም ያስገቡ...' : 'Enter Plate No or Name...'}
                className="w-full bg-surface border border-outline-variant rounded-xl pl-9 pr-3 py-1.5 text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>{isAmharic ? 'ፈልግ' : 'Search'}</span>
            </button>
          </form>
        </div>
      ) : scannedRegResult === 'not_found' ? (
        <div className="space-y-3 flex flex-col items-center justify-center py-6">
           <div className="w-14 h-14 rounded-full bg-error-container/30 border border-error/30 flex items-center justify-center text-error mb-1">
             <span className="material-symbols-outlined text-[32px]">
               error_outline
             </span>
           </div>
           <h4 className="text-sm sm:text-base font-extrabold text-on-surface">
             {isAmharic ? 'መረጃው አልተገኘም' : 'Record Not Found'}
           </h4>
           <p className="text-xs text-secondary text-center max-w-sm">
             {isAmharic 
               ? 'የቃኙት QR ኮድ ወይም ያስገቡት መረጃ አልተገኘም። እባክዎ በድጋሚ ይሞክሩ።' 
               : 'Scanned record not found in system registry.'}
           </p>
           <button
              type="button"
              onClick={handleRescan}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              <span>{isAmharic ? 'ድጋሚ ቃኝ' : 'Rescan'}</span>
            </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* MERGED STATUS & OWNER SUMMARY CARD */}
          {!showDetail && (
            <div className="bg-surface-container/70 rounded-2xl p-3.5 border border-outline-variant shadow-2xs space-y-3 animate-in fade-in duration-150">
              {/* Header: Name, Plate, and Status Badge merged */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                  <h4 className="font-extrabold text-xs sm:text-sm text-on-surface">
                    {scannedRegResult.fullName}
                  </h4>
                  <span className="font-black font-mono text-primary text-xs bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                    {scannedRegResult.plateNumber}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase flex items-center gap-1 border ${
                  scannedRegResult.status === 'printed' || scannedRegResult.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-error-container/40 text-error border-error/30'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {scannedRegResult.status === 'printed' || scannedRegResult.status === 'approved' ? 'verified' : 'warning'}
                  </span>
                  <span>{(scannedRegResult.status || '').replace('_', ' ').toUpperCase()}</span>
                </span>
              </div>

              {/* Owner Photo & Quick Details */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                <div className="relative w-18 h-22 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 border-primary/30 shadow-xs shrink-0 bg-slate-200 dark:bg-slate-800">
                  <img
                    src={scannedRegResult.userPortraitPhoto || scannedRegResult.nationalIdPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'}
                    alt={scannedRegResult.fullName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 flex-1 text-xs sm:text-sm w-full">
                  <div>
                    <span className="text-secondary block text-[10px] sm:text-xs font-semibold">{isAmharic ? 'ስልክ' : 'Phone'}</span>
                    <span className="font-mono font-bold text-on-surface text-xs sm:text-sm block truncate">{scannedRegResult.phone}</span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[10px] sm:text-xs font-semibold">{isAmharic ? 'ዓይነት' : 'Category'}</span>
                    <span className="font-bold text-on-surface text-xs sm:text-sm capitalize">
                      {scannedRegResult.vehicleCategory === 'electric' ? 'EV' : 'Gasoline'}
                    </span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[10px] sm:text-xs font-semibold">Chassis / Serial</span>
                    <span className="font-mono font-bold text-on-surface text-xs block truncate">{scannedRegResult.engineOrSerialNo}</span>
                  </div>
                  <div>
                    <span className="text-secondary block text-[10px] sm:text-xs font-semibold">{isAmharic ? 'ቀን' : 'Date'}</span>
                    <span className="font-mono text-on-surface text-xs block truncate">{scannedRegResult.registrationDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* "VIEW DETAILS" BUTTON */}
          <button
            type="button"
            onClick={() => setShowDetail((prev) => !prev)}
            className="w-full bg-primary hover:bg-primary-hover text-white font-extrabold py-2 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">
              {showDetail ? 'unfold_less' : 'read_more'}
            </span>
            <span>
              {showDetail
                ? (isAmharic ? 'ዝርዝር ደብቅ' : 'Hide Details')
                : (isAmharic ? 'ሙሉ ዝርዝር እና ሰነዶች' : 'View Full Details & Docs')}
            </span>
          </button>

          {/* FULL OWNER DETAIL UI (Single Bordered Container) */}
          {showDetail && (
            <div className="bg-surface-container-lowest rounded-2xl p-4 text-xs sm:text-sm border border-outline-variant divide-y divide-outline-variant/60 space-y-3.5 shadow-2xs animate-in fade-in duration-150">
              {/* 1. Profile Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 pb-3">
                <div className="relative group cursor-pointer shrink-0" onClick={() => setZoomedImage({
                  url: scannedRegResult.userPortraitPhoto || scannedRegResult.nationalIdPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
                  title: `${scannedRegResult.fullName} — ${isAmharic ? 'የባለቤት ፎቶ' : 'Owner Portrait Photo'}`
                })}>
                  <img
                    src={scannedRegResult.userPortraitPhoto || scannedRegResult.nationalIdPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300'}
                    alt={scannedRegResult.fullName}
                    referrerPolicy="no-referrer"
                    className="w-20 h-24 object-cover rounded-xl border-2 border-primary/30 shadow-xs group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-bold">
                    <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1 w-full">
                  <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-on-surface">{scannedRegResult.fullName}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      scannedRegResult.status === 'printed' || scannedRegResult.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {scannedRegResult.status}
                    </span>
                  </div>

                  <p className="text-secondary text-xs flex items-center justify-center sm:justify-start gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                    <a href={`tel:${scannedRegResult.phone}`} className="font-mono font-bold hover:underline text-primary">
                      {scannedRegResult.phone}
                    </a>
                  </p>

                  <div className="pt-1.5 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-secondary block text-[10px]">{isAmharic ? 'የተመዘገበበት ባጅ' : 'Registered By'}</span>
                      <span className="font-mono font-bold text-on-surface">{scannedRegResult.registeredBy || 'CLK-104'}</span>
                    </div>
                    <div>
                      <span className="text-secondary block text-[10px]">{isAmharic ? 'የምዝገባ ቀን' : 'Registration Date'}</span>
                      <span className="font-mono text-on-surface">{scannedRegResult.registrationDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Complete Vehicle Specifications */}
              <div className="pt-3 space-y-2">
                <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">two_wheeler</span>
                  <span>{isAmharic ? 'የተሽከርካሪ መረጃ' : 'Vehicle Specifications'}</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div className="col-span-2 sm:col-span-1 bg-surface-container/30 p-2 rounded-lg">
                    <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'የሰሌዳ ቁጥር' : 'Plate Number'}</span>
                    <span className="font-mono font-black text-xs sm:text-sm text-primary">{scannedRegResult.plateNumber}</span>
                  </div>

                  <div className="bg-surface-container/30 p-2 rounded-lg">
                    <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'ብራንድ / ሞዴል' : 'Brand & Model'}</span>
                    <span className="font-bold text-on-surface">{scannedRegResult.motorBrand || 'Motorcycle'} {scannedRegResult.motorModel || ''}</span>
                  </div>

                  <div className="bg-surface-container/30 p-2 rounded-lg">
                    <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'ዓይነት' : 'Category'}</span>
                    <span className="font-bold text-on-surface">{scannedRegResult.vehicleCategory === 'electric' ? 'EV' : 'Gasoline'}</span>
                  </div>

                  <div className="col-span-2 bg-surface-container/30 p-2 rounded-lg">
                    <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'የሴሪያል / ሞተር ቁጥር' : 'Chassis / Serial No'}</span>
                    <span className="font-mono font-bold text-on-surface truncate block">{scannedRegResult.engineOrSerialNo}</span>
                  </div>

                  <div className="bg-surface-container/30 p-2 rounded-lg">
                    <span className="text-secondary text-[10px] block font-semibold">{isAmharic ? 'ክፍለ ከተማ' : 'Sub-City'}</span>
                    <span className="font-semibold text-on-surface">{scannedRegResult.subCity || 'Bole'}</span>
                  </div>
                </div>
              </div>

              {/* 3. Verified Identification Documents Gallery */}
              <div className="pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">folder_shared</span>
                    <span>{isAmharic ? 'የባለቤት ማስረጃዎች' : 'Document Credentials'}</span>
                  </h4>
                  <span className="text-[10px] text-secondary">{isAmharic ? 'ለማየት ይጫኑ' : 'Click to zoom'}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Document 1: National ID */}
                  <div
                    onClick={() => setZoomedImage({
                      url: scannedRegResult.nationalIdPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
                      title: `${scannedRegResult.fullName} — National ID`
                    })}
                    className="group cursor-pointer bg-surface-container/30 p-1.5 rounded-xl text-center space-y-1 hover:bg-surface-container/60 transition-colors"
                  >
                    <div className="relative h-18 sm:h-20 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                      <img
                        src={scannedRegResult.nationalIdPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400'}
                        alt="National ID"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-on-surface block truncate">{isAmharic ? 'ብሔራዊ መታወቂያ' : 'National ID'}</span>
                  </div>

                  {/* Document 2: Driving License */}
                  <div
                    onClick={() => setZoomedImage({
                      url: scannedRegResult.drivingLicensePhoto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800',
                      title: `${scannedRegResult.fullName} — Driving License`
                    })}
                    className="group cursor-pointer bg-surface-container/30 p-1.5 rounded-xl text-center space-y-1 hover:bg-surface-container/60 transition-colors"
                  >
                    <div className="relative h-18 sm:h-20 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                      <img
                        src={scannedRegResult.drivingLicensePhoto || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=400'}
                        alt="Driving License"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-on-surface block truncate">{isAmharic ? 'የመንጃ ፍቃድ' : 'Driving License'}</span>
                  </div>

                  {/* Document 3: Driving Permit */}
                  <div
                    onClick={() => setZoomedImage({
                      url: scannedRegResult.drivingPermitPhoto || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800',
                      title: `${scannedRegResult.fullName} — Movement Permit`
                    })}
                    className="group cursor-pointer bg-surface-container/30 p-1.5 rounded-xl text-center space-y-1 hover:bg-surface-container/60 transition-colors"
                  >
                    <div className="relative h-18 sm:h-20 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                      <img
                        src={scannedRegResult.drivingPermitPhoto || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400'}
                        alt="Movement Permit"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-on-surface block truncate">{isAmharic ? 'የመንቀሳቀሻ ፍቃድ' : 'Permit'}</span>
                  </div>

                  {/* Document 4: Owner Portrait */}
                  <div
                    onClick={() => setZoomedImage({
                      url: scannedRegResult.userPortraitPhoto || scannedRegResult.nationalIdPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
                      title: `${scannedRegResult.fullName} — Owner Portrait`
                    })}
                    className="group cursor-pointer bg-surface-container/30 p-1.5 rounded-xl text-center space-y-1 hover:bg-surface-container/60 transition-colors"
                  >
                    <div className="relative h-18 sm:h-20 rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                      <img
                        src={scannedRegResult.userPortraitPhoto || scannedRegResult.nationalIdPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'}
                        alt="User Portrait"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-on-surface block truncate">{isAmharic ? 'የባለቤት ፎቶ' : 'Portrait'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Digital Permit ID Card Display */}
              <div className="pt-3 space-y-1.5">
                <h4 className="font-bold text-xs sm:text-sm text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                  <span>{isAmharic ? 'የዲጂታል መታወቂያ ካርድ' : 'Digital ID Card'}</span>
                </h4>
                <div className="rounded-xl overflow-hidden shadow-2xs bg-surface border border-outline-variant">
                  <QRCodeCard registration={scannedRegResult} lang={lang} />
                </div>
              </div>
            </div>
          )}

          {/* Auto-Saved Confirmation Badge */}
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-bold shadow-2xs">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">check_circle</span>
              <span>{isAmharic ? 'በራስ-ሰር በዳታቤዝ ተመዝግቧል' : 'Scan Auto-Saved to Log'}</span>
            </div>
            {currentLog && (
              <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded font-extrabold text-emerald-800 dark:text-emerald-300">
                {currentLog.id}
              </span>
            )}
          </div>

          {/* Officer Notes Form */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
                <span>{isAmharic ? 'የተቆጣጣሪ ማስታወሻ (ከጻፉ መዝገቡ ይዘመናል)' : 'Inspection Notes (Updates Log)'}</span>
              </label>
              {verificationNotes.trim() && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">sync</span>
                  {isAmharic ? 'ተዘምኗል' : 'Log note synced'}
                </span>
              )}
            </div>
            <textarea
              rows={2}
              value={verificationNotes}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder={isAmharic ? 'ማስታወሻ ይጻፉ... (በራስ-ሰር ይዘመናል)' : 'Type inspection notes... (auto-updates log)'}
              className="w-full bg-surface border border-outline-variant rounded-xl px-3 py-1.5 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
            />
          </div>
          
          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleRescan}
              className="bg-surface-container hover:bg-surface-container-high text-secondary font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              <span>{isAmharic ? 'ድጋሚ ቃኝ' : 'Rescan'}</span>
            </button>
            
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
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{isAmharic ? 'ተጠናቋል (ዝጋ)' : 'Done / Finish'}</span>
            </button>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL FOR EXPANDED DOCUMENT INSPECTION */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center text-white border-b border-slate-800 pb-2">
              <h4 className="font-bold text-sm truncate pr-4">{zoomedImage.title}</h4>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white p-1.5 rounded-lg cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="max-h-[75vh] flex items-center justify-center overflow-auto rounded-xl bg-black">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
              <span>{isAmharic ? 'የከፍተኛ ጥራት ምስል ማረጋገጫ' : 'High Resolution Verified Document'}</span>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="px-4 py-1.5 bg-primary text-white font-bold rounded-lg cursor-pointer text-xs"
              >
                {isAmharic ? 'ዝጋ' : 'Close View'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Render as a standalone page component or full screen modal overlay
  if (isPage) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-surface-container-lowest border border-outline-variant rounded-2xl p-2 sm:p-3 shadow-sm space-y-3 flex flex-col">
        {mainCardContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-3 overflow-y-auto transition-all duration-200">
      <div className="bg-surface-container-lowest sm:border border-outline-variant rounded-2xl p-2 sm:p-3 w-full max-w-2xl max-h-[92vh] space-y-3 shadow-2xl flex flex-col overflow-y-auto">
        {mainCardContent}
      </div>
    </div>
  );
};
