import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type PredictionResponse = {
  best_class: string;
  confidence: number;
  disease?: string;
  description?: string | null;
  cause?: string | null;
  treatment?: string[] | null;
  severity?: string | null;
};

const DEFAULT_ERROR_MESSAGE =
  "Prediction failed. Please try again with a clear leaf image.";

const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_PREDICT_TIMEOUT_MS ?? 180_000);
const PREDICT_ENDPOINT = `${API_BASE_URL}/api/predict`;

const getCorsDebugContext = (): string => {
  if (typeof window === "undefined") {
    return `Frontend origin: unknown. API endpoint: ${PREDICT_ENDPOINT}.`;
  }
  return `Frontend origin: ${window.location.origin}. API endpoint: ${PREDICT_ENDPOINT}.`;
};

const getFriendlyApiError = (raw: string): string => {
  try {
    const parsed = JSON.parse(raw) as
      | { detail?: unknown; message?: unknown; error?: unknown; errors?: unknown }
      | string;

    if (typeof parsed === "string" && parsed.trim()) {
      return parsed.trim();
    }

    if (parsed && typeof parsed === "object") {
      if (typeof parsed.detail === "string" && parsed.detail.trim()) {
        return parsed.detail.trim();
      }
      if (Array.isArray(parsed.detail) && parsed.detail.length > 0) {
        const first = parsed.detail[0];
        if (typeof first === "string" && first.trim()) {
          return first.trim();
        }
        if (
          first &&
          typeof first === "object" &&
          "msg" in first &&
          typeof (first as { msg?: unknown }).msg === "string"
        ) {
          return ((first as { msg: string }).msg || "").trim();
        }
      }
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        return parsed.message.trim();
      }
      if (typeof parsed.error === "string" && parsed.error.trim()) {
        return parsed.error.trim();
      }
      if (Array.isArray(parsed.errors) && parsed.errors.length > 0) {
        const firstError = parsed.errors[0];
        if (typeof firstError === "string" && firstError.trim()) {
          return firstError.trim();
        }
      }
    }
  } catch {
    const plain = raw.trim();
    if (plain) {
      return plain;
    }
  }
  return DEFAULT_ERROR_MESSAGE;
};

const getHttpErrorMessage = (status: number, body: string): string => {
  const fromBody = getFriendlyApiError(body);
  if (fromBody !== DEFAULT_ERROR_MESSAGE) {
    return fromBody;
  }

  if (status === 400) return "Invalid image input. Please upload a JPG or PNG leaf image.";
  if (status === 413) return "Image is too large. Please upload a smaller image.";
  if (status === 415) return "Unsupported file type. Please upload a valid image.";
  if (status === 422) return "Image validation failed. Please upload a valid leaf image.";
  if (status === 429) return "Too many requests. Please wait a bit and try again.";
  if (status >= 500) return "Server error during prediction. Please try again shortly.";
  return DEFAULT_ERROR_MESSAGE;
};

const getRequestErrorMessage = (err: unknown): string => {
  if (err instanceof DOMException && err.name === "AbortError") {
    return "Prediction timed out. Please try again with a smaller or clearer image.";
  }
  if (err instanceof TypeError) {
    return `Cannot reach prediction server. This is often a CORS block or backend outage. ${getCorsDebugContext()}`;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message.trim();
  }
  return DEFAULT_ERROR_MESSAGE;
};

const normalizePredictionErrorMessage = (message: string): string => {
  const raw = message.trim();
  const cleaned = raw.replace(/^Prediction process failed:\s*/i, "");
  const lower = cleaned.toLowerCase();

  if (
    lower.includes("unknown image file format") ||
    lower.includes("decodeimage") ||
    lower.includes("one of jpeg, png, gif, bmp required")
  ) {
    return "Invalid image format. Please upload a valid JPG, PNG, GIF, or BMP leaf image.";
  }

  if (lower.includes("image not found")) {
    return "Uploaded image could not be read. Please upload the image again.";
  }

  return cleaned || DEFAULT_ERROR_MESSAGE;
};

const UploadComponent: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [result, setResult] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const processSelectedFiles = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);

    const imagePreviews = acceptedFiles.map((file) =>
      URL.createObjectURL(file)
    );
    setPreviews(imagePreviews);
    setResult(null);
    setErrorMessage(null);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      processSelectedFiles(acceptedFiles);
    },
    [processSelectedFiles]
  );

  const stopCameraStream = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  const handleCameraClick = async () => {
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      stopCameraStream();
      cameraStreamRef.current = stream;
      setIsCameraOpen(true);
    } catch {
      // Fallback for browsers/devices that block direct camera stream.
      setCameraError("Unable to access camera directly. Opening file picker instead.");
      cameraInputRef.current?.click();
    }
  };

  const handleCameraFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files ? Array.from(event.target.files) : [];
    if (selected.length > 0) {
      processSelectedFiles(selected);
    }
    // Allow selecting the same file again.
    event.target.value = "";
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [isCameraOpen]);

  const closeCamera = useCallback(() => {
    setIsCameraOpen(false);
    stopCameraStream();
  }, [stopCameraStream]);

  const captureFromCamera = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera is not ready yet. Please wait a second and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Unable to capture image from camera.");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Unable to capture image from camera.");
          return;
        }
        const capturedFile = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        processSelectedFiles([capturedFile]);
        closeCamera();
      },
      "image/jpeg",
      0.95
    );
  }, [closeCamera, processSelectedFiles]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
      stopCameraStream();
    };
  }, [previews, stopCameraStream]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  const handleCheck = async () => {
    if (files.length === 0) {
      alert("Please upload an image first.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("image", files[0]);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_BASE_URL}/api/predict`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(getHttpErrorMessage(res.status, text));
      }

      let apiResult: PredictionResponse;
      try {
        apiResult = (await res.json()) as PredictionResponse;
      } catch {
        throw new Error("Server returned invalid prediction data.");
      }

      setResult({
        fileName: files[0]?.name ?? "N/A",
        prediction: apiResult.best_class,
        confidence: apiResult.confidence,
        disease: apiResult.disease ?? apiResult.best_class,
        description: apiResult.description ?? "No description available.",
        cause: apiResult.cause ?? "No cause information available.",
        treatment:
          apiResult.treatment && apiResult.treatment.length > 0
            ? apiResult.treatment
            : ["No treatment guidance available."],
        severity: apiResult.severity ?? "Unknown",
      });
    } catch (err: unknown) {
      const message = normalizePredictionErrorMessage(getRequestErrorMessage(err));
      setResult(null);
      setErrorMessage(message);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  return (
    <section className="relative px-4 md:px-10 pt-28 pb-12">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-28 left-10 h-72 w-72 bg-emerald-700/25 blur-3xl rounded-full" />
        <div className="absolute top-20 right-10 h-72 w-72 bg-green-900/30 blur-3xl rounded-full" />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-10">
          <p className="text-emerald-300 uppercase tracking-[0.25em] text-xs mb-3">
            Intelligent Plant Diagnostics
          </p>
          <h1 className="text-3xl md:text-5xl font-semibold text-white leading-tight">
            Diagnose leaf diseases in seconds.
          </h1>
          <p className="text-slate-300 mt-4 max-w-3xl">
            Upload one leaf photo to get prediction confidence, disease context,
            and practical treatment guidance from your model knowledge base.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-5 md:p-7 backdrop-blur-xl shadow-2xl">
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition h-72 md:h-[24rem] flex items-center justify-center overflow-hidden ${
                isDragActive
                  ? "border-emerald-400 bg-emerald-700/15"
                  : "border-slate-500/40 bg-black/50"
              }`}
            >
              <input {...getInputProps()} />
              {previews.length > 0 ? (
                <img
                  src={previews[0]}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
                />
              ) : (
                <div className="text-slate-300 px-2">
                  <p className="text-sm md:text-base">
                    {isDragActive
                      ? "Drop the leaf image here..."
                      : "Drag and drop a leaf image, or click to browse"}
                  </p>
                  <p className="text-xs md:text-sm text-slate-400 mt-3">
                    Best quality: clear single-leaf photos in JPG or PNG format.
                  </p>
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 bg-slate-950/55 flex items-center justify-center rounded-xl overflow-hidden">
                  <div className="absolute inset-0">
                    <div className="scan-beam-down absolute top-0 left-0 w-full h-14 bg-gradient-to-b from-emerald-300/35 via-emerald-400/20 to-transparent" />
                    <div className="scan-line-down absolute top-0 left-0 w-full h-0.5 bg-emerald-200" />
                    <div className="scan-beam-up absolute top-0 left-0 w-full h-14 bg-gradient-to-b from-green-300/25 via-green-400/20 to-transparent" />
                    <div className="scan-line-up absolute top-0 left-0 w-full h-0.5 bg-green-200/90" />
                    <div className="absolute inset-0 border border-emerald-300/30" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.12),transparent_55%)] animate-pulse" />
                  </div>
                  <span className="text-white font-medium bg-black/75 border border-emerald-400/50 px-4 py-2 rounded-full text-sm md:text-base shadow-lg shadow-emerald-500/20">
                    Analyzing leaf image...
                  </span>
                </div>
              )}
            </div>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCameraFileChange}
            />
            <div className="mt-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-600/60" />
              <span className="text-xs font-semibold tracking-[0.25em] text-slate-400">
                OR
              </span>
              <div className="h-px flex-1 bg-slate-600/60" />
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleCameraClick}
                disabled={isLoading}
                className={`w-full px-4 py-3 rounded-xl text-white font-medium transition ${
                  isLoading
                    ? "bg-slate-500/60 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500"
                }`}
              >
                {files.length > 0 ? "Re-upload from Camera" : "Use Camera"}
              </button>
            </div>
            {cameraError && (
              <p className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2">
                {cameraError}
              </p>
            )}
            {files.length > 0 && (
              <div className="mt-4 text-sm text-slate-300 bg-slate-900/40 border border-slate-700/60 rounded-xl p-3">
                <p className="font-medium text-emerald-200 mb-1">Uploaded file</p>
                <p>
                  {files[0].name} · {(files[0].size / 1024).toFixed(2)} KB
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Use "Re-upload from Camera" to replace this image.
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl">
              <h2 className="text-white text-lg md:text-xl font-semibold">
                Run AI Analysis
              </h2>
              <p className="text-slate-300 text-sm mt-2">
                We combine classifier output with disease knowledge to provide
                concise recommendations.
              </p>
              <button
                onClick={handleCheck}
                disabled={isLoading}
                className={`mt-5 w-full px-4 py-3 rounded-xl text-white font-medium transition ${
                  isLoading
                    ? "bg-slate-500/60 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500"
                }`}
              >
                {isLoading ? "Analyzing..." : "Analyze Leaf"}
              </button>
            </div>

            {errorMessage && !isLoading && (
              <div className="bg-rose-50 text-rose-900 border border-rose-200 rounded-3xl p-5 md:p-6 shadow-2xl">
                <h3 className="text-lg md:text-xl font-semibold mb-3">
                  Prediction Error
                </h3>
                <p className="text-sm leading-relaxed">{errorMessage}</p>
                <p className="text-xs text-rose-700 mt-3">
                  Try uploading a clear leaf image (JPG/PNG), then run analysis again.
                </p>
              </div>
            )}

            {result && !isLoading && !errorMessage && (
              <div className="relative overflow-hidden rounded-3xl border border-emerald-300/30 bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 p-5 md:p-6 shadow-[0_20px_70px_-30px_rgba(5,150,105,0.5)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_30px_90px_-35px_rgba(5,150,105,0.6)]">
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-300/25 blur-3xl" />
                <div className="pointer-events-none absolute -left-14 -bottom-16 h-40 w-40 rounded-full bg-green-300/20 blur-3xl" />

                {String(result.prediction).toLowerCase() === "unknown" ? (
                  <div className="relative text-center py-8">
                    <h3 className="text-xl md:text-2xl font-semibold text-slate-900 mb-3">
                      Analysis Result
                    </h3>
                    <p className="text-base md:text-lg font-medium text-slate-800">
                      Unknown, Please upload a clear cassava or maize leaf image.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="relative flex items-start justify-between gap-3 mb-5">
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold text-slate-900">
                          Analysis Result
                        </h3>
                        <p className="text-xs md:text-sm text-slate-500 mt-1">
                          AI classification with disease knowledge guidance
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100/80 px-3 py-1 text-xs font-medium text-emerald-800">
                        Ready
                      </span>
                    </div>

                    <div className="relative grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-2xl border border-slate-200 bg-white/75 p-3 backdrop-blur-sm">
                        <p className="text-slate-500">Prediction</p>
                        <p className="mt-1 font-semibold text-slate-900 break-words">
                          {result.prediction}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white/75 p-3 backdrop-blur-sm">
                        <p className="text-slate-500">Confidence</p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {(result.confidence * 100).toFixed(1)}%
                        </p>
                        <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-green-500 to-lime-500 transition-all duration-700 ease-out"
                            style={{ width: `${Math.max(0, Math.min(100, result.confidence * 100))}%` }}
                          />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white/75 p-3 backdrop-blur-sm">
                        <p className="text-slate-500">Disease</p>
                        <p className="mt-1 font-semibold text-slate-900 break-words">{result.disease}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white/75 p-3 backdrop-blur-sm">
                        <p className="text-slate-500">Severity</p>
                        <p className="mt-1 font-semibold text-slate-900">{result.severity}</p>
                      </div>
                    </div>

                    <div className="relative mt-5 space-y-3 text-sm text-slate-700">
                      <p className="leading-relaxed">
                        <span className="font-semibold text-slate-900">Description:</span>{" "}
                        {result.description}
                      </p>
                      <p className="leading-relaxed">
                        <span className="font-semibold text-slate-900">Cause:</span> {result.cause}
                      </p>
                    </div>

                    <div className="relative mt-5 rounded-2xl border border-slate-200 bg-white/70 p-4">
                      <p className="font-semibold text-sm text-slate-900 mb-2">Treatment</p>
                      <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700 marker:text-emerald-600">
                        {(result.treatment ?? []).map((item: string) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 shadow-2xl overflow-hidden animate-[fadeIn_220ms_ease-out]">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Capture Leaf Photo</h3>
              <button
                type="button"
                onClick={closeCamera}
                className="text-slate-300 hover:text-white transition"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[65vh] object-contain"
                />
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={captureFromCamera}
                  className="flex-1 px-4 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 transition"
                >
                  Capture Photo
                </button>
                <button
                  type="button"
                  onClick={closeCamera}
                  className="px-4 py-3 rounded-xl text-slate-200 bg-slate-700/70 hover:bg-slate-600/70 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default UploadComponent;
