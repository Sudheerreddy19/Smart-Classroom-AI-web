/**
 * speechSynthesisService.js
 * Encapsulates the Web Speech Synthesis API.
 * Ensures utterances are cleanly spoken, tracks active speaking state,
 * and handles voice selection and cleanup.
 */

let activeUtterance = null;

export const isSpeechSynthesisSupported = () => {
  return typeof window !== "undefined" && "speechSynthesis" in window;
};

export const getPreferredVoice = () => {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha"))) ||
    voices.find((v) => v.lang.startsWith("en-US")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0] ||
    null
  );
};

/**
 * Speak the provided text using speech synthesis.
 * @param {string} text - The sentence to speak
 * @param {Object} options - { onStart, onEnd, onError }
 */
export const speakText = (text, { onStart, onEnd, onError } = {}) => {
  if (!isSpeechSynthesisSupported() || !text) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing speech
  stopSpeech();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  utterance.lang = "en-US";

  const voice = getPreferredVoice();
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onstart = () => {
    activeUtterance = utterance;
    if (onStart) onStart();
  };

  utterance.onend = () => {
    activeUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    activeUtterance = null;
    if (onError) onError(e);
    else if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  } catch {}
};

export const isSpeaking = () => {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.speaking || activeUtterance !== null;
};
