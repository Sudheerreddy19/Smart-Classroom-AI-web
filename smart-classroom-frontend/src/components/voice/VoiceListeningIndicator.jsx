/**
 * VoiceListeningIndicator.jsx
 * Floating visual indicator showing 79's real-time assistant state:
 * - 😴 Standby: "Say '79' to activate"
 * - 🧒👂 Listening: Animated sound wave bars + speech transcript
 * - 🤔 Processing: Spinner
 * - 🔊 Speaking: Response text
 * - ⚠️ Error: Permission alert
 */

import React from "react";

export default function VoiceListeningIndicator({
  state, // "STANDBY" | "ACTIVATING" | "LISTENING" | "PROCESSING" | "SPEAKING" | "ERROR"
  transcript,
  responseMessage,
  errorMessage,
  onActivate,
  onStop,
  onRetryPermission,
}) {
  const isListening = state === "LISTENING";
  const isProcessing = state === "PROCESSING";
  const isSpeaking = state === "SPEAKING";
  const isStandby = state === "STANDBY" || state === "SLEEPING";
  const isError = state === "ERROR";

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2 select-none font-sans">
      <div
        className={`flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg border transition-all duration-300 max-w-sm ${
          isStandby
            ? "bg-white/95 border-gray-200 shadow-sm"
            : isListening
            ? "bg-blue-50/95 border-blue-300 shadow-blue-500/10 ring-2 ring-blue-400/20"
            : isProcessing
            ? "bg-amber-50/95 border-amber-300 shadow-amber-500/10"
            : isSpeaking
            ? "bg-emerald-50/95 border-emerald-300 shadow-emerald-500/10"
            : isError
            ? "bg-red-50/95 border-red-300 text-red-700"
            : "bg-white border-gray-200"
        }`}
      >
        {/* State Avatar */}
        <div className="relative flex items-center justify-center flex-shrink-0">
          {isStandby && (
            <span className="text-2xl filter drop-shadow-sm" title="Voice active: Say '79' to speak">
              😴
            </span>
          )}

          {isListening && (
            <div className="flex items-center text-2xl animate-pulse">
              <span>🧒</span>
              <span className="text-lg -ml-1">👂</span>
            </div>
          )}

          {isProcessing && (
            <span className="text-2xl animate-bounce">
              🤔
            </span>
          )}

          {isSpeaking && (
            <span className="text-2xl animate-pulse">
              🔊
            </span>
          )}

          {isError && (
            <span className="text-2xl">
              ⚠️
            </span>
          )}
        </div>

        {/* Text and Wave Section */}
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wide uppercase text-gray-700 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                isStandby ? "bg-gray-400" :
                isListening ? "bg-blue-600 animate-ping" :
                isProcessing ? "bg-amber-500" :
                isSpeaking ? "bg-emerald-600" :
                "bg-red-500"
              }`} />
              79 {isStandby ? "Standby" : state}
            </span>

            {/* Sound Wave Animation (When Listening) */}
            {isListening && (
              <div className="flex items-center gap-0.5 ml-1">
                {[0.5, 1.2, 0.7, 1.5, 0.9, 1.3, 0.6].map((scale, i) => (
                  <span
                    key={i}
                    className="w-1 bg-blue-600 rounded-full"
                    style={{
                      height: `${scale * 10}px`,
                      animation: `waveBars 0.7s ease-in-out infinite ${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Subtext info */}
          <div className="text-[11px] text-gray-600 truncate max-w-[210px] mt-0.5">
            {isStandby && "Say '79' to activate"}
            {isListening && (transcript ? `"${transcript}"` : "I am listening... speak command")}
            {isProcessing && "Executing command..."}
            {isSpeaking && (responseMessage || "79 is speaking...")}
            {isError && (errorMessage || "Microphone access required")}
          </div>
        </div>

        {/* Standby button while active */}
        {!isStandby && !isError && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onStop) onStop();
            }}
            title="Return to Standby"
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/50 transition-colors ml-1"
          >
            ✕
          </button>
        )}

        {/* Retry button on error */}
        {isError && onRetryPermission && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetryPermission();
            }}
            className="text-[10px] px-2 py-1 bg-red-600 text-white font-medium rounded hover:bg-red-700 ml-1"
          >
            Retry
          </button>
        )}
      </div>

      <style>{`
        @keyframes waveBars {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.3); }
        }
      `}</style>
    </div>
  );
}
