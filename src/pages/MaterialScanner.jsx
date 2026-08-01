import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobileNet } from '../hooks/useMobileNet';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import { Select } from '../components/forms/Field';

/**
 * Material categories the library can be searched by.
 *
 * MobileNet returns ImageNet labels ("water bottle", "carton"), not material
 * types, so its output is mapped onto these — and the teacher can always
 * override the mapping, because it is frequently wrong.
 */
const CATEGORIES = ['Plastic', 'Cardboard', 'Paper', 'Metal', 'Glass', 'Fabric', 'Wood', 'Rubber', 'Other'];

const LABEL_MAP = [
  { category: 'Plastic', patterns: ['bottle', 'plastic', 'container', 'jug', 'bucket', 'straw', 'syringe'] },
  { category: 'Cardboard', patterns: ['carton', 'box', 'packet', 'cardboard'] },
  { category: 'Paper', patterns: ['paper', 'envelope', 'newspaper', 'book jacket', 'notebook'] },
  { category: 'Metal', patterns: ['can', 'tin', 'aluminum', 'aluminium', 'foil', 'nail', 'screw', 'wire', 'spoon'] },
  { category: 'Glass', patterns: ['glass', 'beaker', 'jar', 'bottle cap', 'goblet'] },
  { category: 'Fabric', patterns: ['cloth', 'fabric', 'towel', 'sock', 'wool', 'cotton'] },
  { category: 'Wood', patterns: ['wood', 'stick', 'pencil', 'spatula', 'broom'] },
  { category: 'Rubber', patterns: ['rubber', 'balloon', 'band', 'tyre', 'tire'] },
];

const guessCategory = (className = '') => {
  const name = className.toLowerCase();
  const match = LABEL_MAP.find((entry) => entry.patterns.some((p) => name.includes(p)));
  return match?.category || 'Other';
};

const cameraErrorMessage = (error) => {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera access was blocked. Allow camera permission in your browser settings, or upload a photo instead.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No camera was found on this device. You can upload a photo instead.';
    case 'NotReadableError':
      return 'The camera is already in use by another app. Close it and try again, or upload a photo.';
    default:
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        return 'Camera access needs a secure connection (HTTPS). Upload a photo instead.';
      }
      return 'The camera could not be started. You can upload a photo instead.';
  }
};

const MaterialScanner = () => {
  const navigate = useNavigate();
  const { status, error: modelError, load, classify } = useMobileNet();

  const [imageUrl, setImageUrl] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [category, setCategory] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const objectUrlRef = useRef(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  useEffect(
    () => () => {
      stopCamera();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [stopCamera]
  );

  /** Loads the model, then opens the camera. Both only on an explicit click. */
  const startCamera = async () => {
    setCameraError('');
    try {
      await load();
    } catch {
      return; // useMobileNet surfaces its own error state.
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraOn(true);
      setImageUrl(null);
      setPredictions([]);
    } catch (err) {
      setCameraError(cameraErrorMessage(err));
    }
  };

  // Attach the stream once React has actually rendered the <video>. The
  // previous implementation used setTimeout(50) and raced on slow devices.
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);

  const analyse = useCallback(
    async (element) => {
      setAnalysing(true);
      try {
        const results = await classify(element, 3);
        setPredictions(results);
        setCategory(guessCategory(results[0]?.className));
      } catch {
        setPredictions([]);
      } finally {
        setAnalysing(false);
      }
    },
    [classify]
  );

  const capture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    stopCamera();
    setImageUrl(dataUrl);
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCameraError('');
    try {
      await load();
    } catch {
      return;
    }

    stopCamera();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setImageUrl(url);
    setPredictions([]);
  };

  // Classify once the image element has actually decoded, rather than guessing
  // with a timer.
  const handleImageLoad = (event) => {
    if (predictions.length === 0) analyse(event.currentTarget);
  };

  const reset = () => {
    stopCamera();
    setImageUrl(null);
    setPredictions([]);
    setCategory('');
    setCameraError('');
  };

  return (
    <div className="container-page max-w-3xl py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Material scanner</h1>
        <p className="mt-2 text-ink-muted">
          Point your camera at something you have spare, and find project guides that use it.
        </p>
      </header>

      {/* Honest framing, stated up front rather than buried. */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-ink-muted">
        <p>
          <span className="font-semibold text-ink">How this works: </span>
          the scanner runs MobileNet, a general-purpose image classifier trained on everyday
          objects — not a purpose-built materials classifier. Treat its answer as a starting
          suggestion and correct it if it is wrong, which it often will be.
        </p>
        <p className="mt-2">
          Everything runs in your browser; no photo is uploaded. The model is about 17&nbsp;MB and
          downloads the first time you press start.
        </p>
      </div>

      <div className="overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
        <div className="relative aspect-[4/3] bg-slate-900">
          {cameraOn && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          )}

          {imageUrl && !cameraOn && (
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Captured material"
              onLoad={handleImageLoad}
              className="h-full w-full object-contain"
            />
          )}

          {!cameraOn && !imageUrl && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
              {status === 'loading' ? (
                <>
                  <Spinner size="lg" label="Loading the scanner model" />
                  <p className="text-sm">Downloading the model…</p>
                  <p className="text-xs">This happens once, then it is cached.</p>
                </>
              ) : (
                <>
                  <span className="text-5xl" aria-hidden="true">
                    📷
                  </span>
                  <p className="text-sm">Camera is off</p>
                </>
              )}
            </div>
          )}

          {analysing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/70">
              <Spinner size="lg" label="Analysing image" />
              <p className="text-sm text-white">Analysing…</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 p-4">
          {!cameraOn ? (
            <Button onClick={startCamera} loading={status === 'loading'}>
              {status === 'loading' ? 'Loading model…' : 'Start scanner'}
            </Button>
          ) : (
            <Button onClick={capture}>Capture &amp; analyse</Button>
          )}

          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Upload a photo
          </Button>

          {(cameraOn || imageUrl) && (
            <Button variant="ghost" onClick={reset}>
              Reset
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="sr-only"
            aria-label="Upload a photo to scan"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {(cameraError || modelError) && (
        <div role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">{cameraError || modelError}</p>
        </div>
      )}

      {predictions.length > 0 && (
        <div className="mt-6 rounded-card border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="font-bold text-ink">What the model saw</h2>

          <ul className="mt-3 space-y-2">
            {predictions.map((prediction) => (
              <li key={prediction.className} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate text-sm text-ink sm:w-40">
                  {prediction.className.split(',')[0]}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.round(prediction.probability * 100)}%` }}
                  />
                </span>
                <span className="w-11 shrink-0 text-right text-sm tabular-nums text-ink-muted">
                  {Math.round(prediction.probability * 100)}%
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-slate-200 pt-5">
            <Select
              label="Material category"
              hint="Correct this if the guess is wrong — it decides what gets searched."
              options={CATEGORIES}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <Button
              className="mt-4"
              fullWidth
              onClick={() => navigate(`/projects?material=${encodeURIComponent(category)}`)}
              disabled={!category}
            >
              Find projects using {category || 'this material'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialScanner;
