import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { data } from "../utils/data";

const notRecognizedTriggers = [
  "simple",
  "item",
  "describe",
  "provide",
  "strong",
];

const notRecognizedResponse = {
  fileName: "N/A",
  prediction: "not recognized",
  confidence: 0,
  disease: "N/A",
  recommendation: "Unable to analyze. Please upload a valid leaf image.",
  notes: "The system could not recognize the provided input.",
};

const UploadComponent: React.FC = () => {
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);

    const imagePreviews = acceptedFiles.map((file) =>
      URL.createObjectURL(file)
    );
    setPreviews(imagePreviews);
    setResult(null);
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  const handleCheck = () => {
    if (files.length === 0) {
      alert("Please upload an image first.");
      return;
    }

    setIsLoading(true);
    setResult(null);

    setTimeout(() => {
      let response;

      const lowerDesc = description.toLowerCase();
      if (notRecognizedTriggers.some((word) => lowerDesc.includes(word))) {
        response = notRecognizedResponse;
      } else {
        const randomIndex = Math.floor(Math.random() * data.length);
        response = data[randomIndex];
      }

      setResult(response);
      setIsLoading(false);
      setDescription("");
    }, 3000);
  };

  return (
    <div className="px-4 md:px-[5%] flex items-center justify-center py-6 mt-24">
      <div className="p-6 bg-white shadow-lg rounded w-full max-w-5xl">
        <h2 className="text-lg md:text-xl font-semibold mb-6 text-center md:text-left">
          Upload image
        </h2>

        {/* Layout wrapper */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Uploader - Left Side */}
          <div className="md:w-1/2 w-full flex flex-col relative">
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded p-4 text-center cursor-pointer transition h-64 md:h-80 flex items-center justify-center overflow-hidden ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              <input {...getInputProps()} />

              {previews.length > 0 ? (
                <img
                  src={previews[0]}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              ) : (
                <p className="text-gray-500 text-sm md:text-base px-2">
                  {isDragActive
                    ? "Drop the files here..."
                    : "Drag & Drop image files here, or click to browse"}
                </p>
              )}

              {/* Analyzing overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg overflow-hidden">
                  <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 animate-[scan_2s_linear_infinite]" />
                  </div>
                  <span className="absolute bottom-2 text-white font-medium bg-black/50 px-3 py-1 rounded text-sm md:text-base">
                    Analyzing...
                  </span>
                </div>
              )}
            </div>

            {files.length > 0 && (
              <ul className="mt-4 space-y-1 md:space-y-2">
                {files.map((file) => (
                  <li
                    key={file.name}
                    className="text-xs md:text-sm text-gray-700"
                  >
                    {file.name} - {(file.size / 1024).toFixed(2)} KB
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Form Inputs - Right Side */}
          <div className="md:w-1/2 w-full flex flex-col gap-3">
            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm md:text-base">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a detailed description"
                rows={6}
                disabled={isLoading}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm md:text-base focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
              />
            </div>

            <button
              onClick={handleCheck}
              disabled={isLoading}
              className={`px-4 py-2 rounded text-white transition text-sm md:text-base ${
                isLoading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isLoading ? "Analyzing..." : "Check"}
            </button>
          </div>
        </div>

        {/* Result Section */}
        {result && !isLoading && (
          <div className="mt-8 p-4 border rounded bg-gray-50">
            <h3 className="text-base md:text-lg font-semibold mb-3">
              Analysis Result for{" "}
              <span className="italic">{files[0]?.name}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm md:text-base">
              <p>
                <strong>Prediction:</strong> {result.prediction}
              </p>
              <p>
                <strong>Confidence:</strong>{" "}
                {(result.confidence * 100).toFixed(1)}%
              </p>
              <p>
                <strong>Disease:</strong> {result.disease}
              </p>
              <p>
                <strong>Recommendation:</strong> {result.recommendation}
              </p>
            </div>
            <p className="text-gray-600 mt-3 text-sm md:text-base">
              <strong>Notes:</strong> {result.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadComponent;
