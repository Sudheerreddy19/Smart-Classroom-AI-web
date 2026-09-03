import { useState, useRef } from "react";

export default function VoiceTest() {
  const [lines,    setLines]    = useState([]);
  const [live,     setLive]     = useState("");
  const [running,  setRunning]  = useState(false);
  const [error,    setError]    = useState("");
  const recogRef = useRef(null);

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("SpeechRecognition not supported — use Chrome!"); return; }

    setError(""); setLines([]); setLive(""); setRunning(true);

    const r = new SR();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 5;

    r.onresult = (e) => {
      const result = e.results[e.results.length - 1];
      // Show all alternatives
      const alts = [];
      for (let i = 0; i < result.length; i++) {
        alts.push(`[${Math.round(result[i].confidence * 100)}%] "${result[i].transcript}"`);
      }
      const text = result[0].transcript;
      if (result.isFinal) {
        setLines(prev => [
          { id: Date.now(), final: true, text, alts, ts: new Date().toLocaleTimeString() },
          ...prev.slice(0, 49)
        ]);
        setLive("");
      } else {
        setLive(text);
      }
    };

    r.onerror = (e) => {
      setError("Error: " + e.error + (e.error === "not-allowed" ? " — Allow mic in browser!" : ""));
      if (e.error !== "not-allowed") {
        setTimeout(start, 1000);
      } else {
        setRunning(false);
      }
    };

    r.onend = () => {
      // Restart to keep going
      if (recogRef.current === r) {
        setTimeout(start, 200);
      }
    };

    recogRef.current = r;
    try { r.start(); }
    catch (e) { setError("Could not start: " + e.message); setRunning(false); }
  };

  const stop = () => {
    setRunning(false);
    const r = recogRef.current;
    if (r) { r.onend = null; try { r.stop(); } catch {} recogRef.current = null; }
    setLive("");
  };

  return (
    <div style={{ padding: 32, maxWidth: 760, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
        🎙 Voice-to-Text Diagnostic
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>
        This shows EXACTLY what Chrome hears. Speak anything — especially try saying "79", "hey 79", "seven nine".
      </p>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
        <button onClick={running ? stop : start} style={{
          padding: "12px 28px", borderRadius: 10, border: "none",
          background: running ? "#dc2626" : "#2563eb",
          color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
        }}>
          {running ? "⏹ Stop" : "▶ Start Listening"}
        </button>
        {running && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%", background: "#16a34a",
              animation: "blink 1s infinite",
            }}/>
            <span style={{ color: "#16a34a", fontWeight: 600, fontSize: 13 }}>Listening…</span>
          </div>
        )}
        {error && <span style={{ color: "#dc2626", fontSize: 13, fontWeight: 600 }}>{error}</span>}
      </div>

      {/* Live partial result */}
      {live && (
        <div style={{
          background: "#fffbeb", border: "2px dashed #fbbf24",
          borderRadius: 12, padding: "12px 18px", marginBottom: 16,
          fontSize: 18, color: "#92400e", fontStyle: "italic",
        }}>
          🎙 {live}
        </div>
      )}

      {/* Final results */}
      <div style={{
        background: "#f8fafc", borderRadius: 14, border: "1px solid #e5e7eb",
        minHeight: 200, maxHeight: 500, overflowY: "auto", padding: 16,
      }}>
        {lines.length === 0 && !live && (
          <div style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", marginTop: 40 }}>
            Press Start then speak — results appear here instantly
          </div>
        )}
        {lines.map(line => (
          <div key={line.id} style={{
            marginBottom: 14, padding: "10px 14px",
            background: "#fff", borderRadius: 10,
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
                ✅ "{line.text}"
              </span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{line.ts}</span>
            </div>
            {line.alts.length > 1 && (
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                <strong>All alternatives:</strong><br/>
                {line.alts.map((a, i) => <span key={i} style={{ display: "block" }}>{a}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: "#9ca3af" }}>
        Tip: Say <strong>"79"</strong>, <strong>"hey 79"</strong>, <strong>"seven nine"</strong> and see what Chrome transcribes.
        That tells us the exact phrase to use as the wake word.
      </p>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}