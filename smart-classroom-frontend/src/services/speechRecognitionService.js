/**
 * speechRecognitionService.js
 * Browser SpeechRecognition wrapper.
 * Manages microphone lifecycle, tab lock synchronization, error handling,
 * and speech detection callbacks.
 */

const TAB_ID = Math.random().toString(36).substring(2, 9);
const TAB_LOCK_KEY = "ai79_active_mic_tab";

export const isSpeechRecognitionSupported = () => {
  return (
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
};

export const claimTabMicLock = () => {
  try {
    localStorage.setItem(TAB_LOCK_KEY, TAB_ID);
  } catch {}
};

export const releaseTabMicLock = () => {
  try {
    if (localStorage.getItem(TAB_LOCK_KEY) === TAB_ID) {
      localStorage.removeItem(TAB_LOCK_KEY);
    }
  } catch {}
};

export const isTabMicOwner = () => {
  try {
    const owner = localStorage.getItem(TAB_LOCK_KEY);
    return !owner || owner === TAB_ID;
  } catch {
    return true;
  }
};

/**
 * Creates and manages a SpeechRecognition session.
 */
export class SpeechRecognitionManager {
  constructor({ onResult, onError, onEnd, onStart }) {
    this.onResult = onResult;
    this.onError = onError;
    this.onEnd = onEnd;
    this.onStart = onStart;
    this.recognition = null;
    this.isListening = false;
    this.isPaused = false; // When 79 is speaking
    this.isDestroyed = false;
  }

  init() {
    if (!isSpeechRecognitionSupported()) return false;

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRec();
    this.recognition.lang = "en-US";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStart) this.onStart();
    };

    this.recognition.onresult = (event) => {
      if (this.isPaused || this.isDestroyed) return;

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (this.onResult) {
        this.onResult({
          interim: interimTranscript.trim(),
          final: finalTranscript.trim(),
          rawEvent: event,
        });
      }
    };

    this.recognition.onerror = (event) => {
      if (this.isDestroyed) return;
      if (this.onError) this.onError(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) this.onEnd();

      // Auto-restart if not manually stopped or destroyed
      if (!this.isDestroyed && !this.isPaused && isTabMicOwner()) {
        setTimeout(() => {
          this.start();
        }, 150);
      }
    };

    return true;
  }

  start() {
    if (this.isDestroyed || !this.recognition || this.isListening) return;
    claimTabMicLock();
    try {
      this.recognition.start();
    } catch (err) {
      // If already started or browser state glitch
      if (err.name !== "InvalidStateError") {
        console.warn("SpeechRecognition start warning:", err);
      }
    }
  }

  pause() {
    this.isPaused = true;
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
    }
  }

  resume() {
    this.isPaused = false;
    if (!this.isListening) {
      this.start();
    }
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {}
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.stop();
    releaseTabMicLock();
    this.recognition = null;
  }
}
