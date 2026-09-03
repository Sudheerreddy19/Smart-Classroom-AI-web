/**
 * VoiceAssistant.jsx
 * Core orchestrator for the "79" AI Voice Assistant.
 * Fully hands-free: activates immediately by saying "79" (no tapping needed).
 * If a command is spoken together with "79" (e.g. "79 open attendance"), executes immediately!
 * Silently ignores unknown phrases without chatting, keeping hands-free listening active.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";

import {
  SpeechRecognitionManager,
  isSpeechRecognitionSupported,
} from "../../services/speechRecognitionService";
import { speakText, stopSpeech } from "../../services/speechSynthesisService";
import {
  isWakeWord,
  stripWakeWord,
  processVoiceCommand,
} from "../../services/voiceCommandService";
import VoiceListeningIndicator from "./VoiceListeningIndicator";

const DEFAULT_INACTIVITY_TIMEOUT = 30000; // 30 seconds

export default function VoiceAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectUser);

  // States: "STANDBY" | "ACTIVATING" | "LISTENING" | "PROCESSING" | "SPEAKING" | "ERROR"
  const [state, setState] = useState("STANDBY");
  const [transcript, setTranscript] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const stateRef = useRef("STANDBY");
  stateRef.current = state;

  const recognitionMgrRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const isDestroyedRef = useRef(false);

  // Configurable timeout from environment or default 30s
  const timeoutMs = Number(import.meta.env.VITE_VOICE_ASSISTANT_TIMEOUT) || DEFAULT_INACTIVITY_TIMEOUT;

  const lastExecutedRef = useRef({ text: "", timestamp: 0 });

  // ── Reset or start inactivity timer ─────────────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    inactivityTimerRef.current = setTimeout(() => {
      if (stateRef.current === "LISTENING" && !isDestroyedRef.current) {
        setState("SPEAKING");
        setResponseMessage("I am going back to standby mode.");
        speakText("I am going back to standby mode.", {
          onEnd: () => {
            if (!isDestroyedRef.current) {
              setState("STANDBY");
              setTranscript("");
              setResponseMessage("");
            }
          },
        });
      }
    }, timeoutMs);
  }, [timeoutMs]);

  // ── Clear inactivity timer ──────────────────────────────────────────────────
  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  // ── Transition to Standby (Rest / Sleep Mode) ────────────────────────────────
  const goToStandby = useCallback(() => {
    clearInactivityTimer();
    stopSpeech();
    setState("STANDBY");
    setTranscript("");
    setResponseMessage("");
    if (recognitionMgrRef.current) {
      recognitionMgrRef.current.resume();
    }
  }, [clearInactivityTimer]);

  // ── Activate 79 Assistant ───────────────────────────────────────────────────
  const activateAssistant = useCallback((pendingCommand = "") => {
    clearInactivityTimer();

    // If an action was spoken with the wake word (e.g. "79 open timetable")
    if (pendingCommand && pendingCommand.trim().length > 1) {
      handleCommandExecution(pendingCommand.trim());
      return;
    }

    setState("ACTIVATING");
    setTranscript("");
    const greeting = "Hello! I am 79. How can I help you?";
    setResponseMessage(greeting);

    if (recognitionMgrRef.current) {
      recognitionMgrRef.current.pause();
    }

    speakText(greeting, {
      onStart: () => {
        setState("SPEAKING");
      },
      onEnd: () => {
        if (!isDestroyedRef.current) {
          setState("LISTENING");
          setTranscript("");
          setResponseMessage("");
          if (recognitionMgrRef.current) {
            recognitionMgrRef.current.resume();
          }
          resetInactivityTimer();
        }
      },
    });
  }, [clearInactivityTimer, resetInactivityTimer]);

  // ── Execute Spoken Command ─────────────────────────────────────────────────
  const handleCommandExecution = useCallback(
    async (speechText) => {
      clearInactivityTimer();
      setState("PROCESSING");
      setTranscript(speechText);

      if (recognitionMgrRef.current) {
        recognitionMgrRef.current.pause();
      }

      try {
        const result = await processVoiceCommand(speechText, {
          user,
          navigate,
          currentPath: location.pathname,
        });

        // 1. If command is to stop / sleep -> immediately go to rest/sleep mode
        if (result.intent === "STOP") {
          stopSpeech();
          goToStandby();
          return;
        }

        // 2. If command has no spoken output (e.g. quiet navigation or unknown)
        if (!result.responseText) {
          setState("LISTENING");
          setTranscript("");
          setResponseMessage("");
          if (recognitionMgrRef.current) {
            recognitionMgrRef.current.resume();
          }
          resetInactivityTimer();
          return;
        }

        // 3. Normal spoken response -> Then automatically continue listening
        setState("SPEAKING");
        setResponseMessage(result.responseText);

        speakText(result.responseText, {
          onEnd: () => {
            if (!isDestroyedRef.current) {
              setState("LISTENING");
              setTranscript("");
              setResponseMessage("");
              if (recognitionMgrRef.current) {
                recognitionMgrRef.current.resume();
              }
              resetInactivityTimer();
            }
          },
        });
      } catch (err) {
        console.error("Command execution error:", err);
        setState("LISTENING");
        if (recognitionMgrRef.current) {
          recognitionMgrRef.current.resume();
        }
        resetInactivityTimer();
      }
    },
    [clearInactivityTimer, user, navigate, location.pathname, goToStandby, resetInactivityTimer]
  );

  // ── Initialize Speech Recognition on Mount ─────────────────────────────────
  useEffect(() => {
    isDestroyedRef.current = false;

    if (!isSpeechRecognitionSupported()) {
      setState("ERROR");
      setErrorMessage("Speech recognition not supported in this browser. Please use Chrome.");
      return;
    }

    const isStopTrigger = (t) => {
      const clean = (t || "").toLowerCase().trim();
      return /^(?:(?:hey|ok|hello)?\s*79\s*)?(?:stop|stop\s+it|stop\s+this|stop\s+listening|go\s+to\s+sleep|sleep\s+mode|sleep|rest|pause)\b/i.test(clean);
    };

    const manager = new SpeechRecognitionManager({
      onResult: ({ interim, final }) => {
        const text = final || interim;
        if (!text) return;

        // A. If user says STOP at ANY time -> immediately halt and enter sleep/rest mode
        if (isStopTrigger(text)) {
          stopSpeech();
          clearInactivityTimer();
          goToStandby();
          return;
        }

        // B. In STANDBY: Watch for "79" wake word
        if (stateRef.current === "STANDBY") {
          if (isWakeWord(text)) {
            const extraCmd = stripWakeWord(text);
            activateAssistant(extraCmd);
          }
          return;
        }

        // C. In LISTENING mode: Process command with deduplication (prevents repeating completed task)
        if (stateRef.current === "LISTENING") {
          setTranscript(text);
          resetInactivityTimer();

          if (final) {
            const cleanFinal = final.toLowerCase().trim();
            const now = Date.now();

            // Ignore if task was already completed in the last 3.5 seconds
            if (
              cleanFinal === lastExecutedRef.current.text &&
              now - lastExecutedRef.current.timestamp < 3500
            ) {
              return;
            }

            lastExecutedRef.current = { text: cleanFinal, timestamp: now };
            handleCommandExecution(final);
          }
        }
      },
      onError: (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setState("ERROR");
          setErrorMessage("Microphone permission denied. Please allow mic access.");
        } else if (event.error === "network") {
          console.warn("Speech recognition network notice:", event.error);
        }
      },
    });


    recognitionMgrRef.current = manager;
    manager.init();
    manager.start();

    // ── Window / Tab Close Cleanup ───────────────────────────────────────────
    const handleUnload = () => {
      isDestroyedRef.current = true;
      stopSpeech();
      manager.destroy();
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      isDestroyedRef.current = true;
      window.removeEventListener("beforeunload", handleUnload);
      clearInactivityTimer();
      stopSpeech();
      manager.destroy();
    };
  }, [activateAssistant, handleCommandExecution, resetInactivityTimer, clearInactivityTimer]);

  // ── Microphone Permission Retry ────────────────────────────────────────────
  const handleRetryPermission = () => {
    setState("STANDBY");
    setErrorMessage("");
    if (recognitionMgrRef.current) {
      recognitionMgrRef.current.init();
      recognitionMgrRef.current.start();
    }
  };

  return (
    <VoiceListeningIndicator
      state={state}
      transcript={transcript}
      responseMessage={responseMessage}
      errorMessage={errorMessage}
      onActivate={() => activateAssistant()}
      onStop={goToStandby}
      onRetryPermission={handleRetryPermission}
    />
  );
}
