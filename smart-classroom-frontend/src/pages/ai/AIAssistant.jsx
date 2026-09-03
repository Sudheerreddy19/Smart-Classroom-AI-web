import { useState, useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import {
  Send, Mic, MicOff, Volume2, VolumeX, Sparkles,
  MessageSquare, Trash2, Plus, Bot, User, Loader2, Copy, Check
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { selectUser } from "../../store/slices/authSlice";
import toast from "react-hot-toast";

/* ─── Role-based quick questions ─────────────────────────────────────── */
const QUICK = {
  STUDENT:     ["What is Java?","Explain data structures","What is machine learning?","How does TCP/IP work?","Explain DBMS normalisation","What is the OSI model?","Explain OOP concepts","What is recursion?"],
  TEACHER:     ["Which students need attention?","Summarise exam results","Generate a quiz on Data Structures","Show class attendance trend","What topics should I revise?","Explain a concept I can teach"],
  HOD:         ["Show department attendance","Which teachers have low engagement?","Department performance summary","Subject-wise pass rates","Identify at-risk students","Compare semester performance"],
  ADMIN:       ["Show overall attendance","Which students are at risk?","Exam performance by class","How many devices are online?","Show environment status","Generate weekly report"],
  SUPER_ADMIN: ["Show system statistics","Which departments need attention?","List active users by role","Device health summary","Attendance trend across institution","Generate full report"],
};

/* ─── Built-in knowledge base (fallback when backend is unreachable) ─── */
const KB = {
  java:        "Java is a high-level, class-based, object-oriented programming language that follows the 'write once, run anywhere' principle using the JVM. Key features: strong typing, garbage collection, platform independence. Core OOP concepts: encapsulation, inheritance, polymorphism, abstraction.",
  python:      "Python is a high-level, interpreted, dynamically-typed language known for simplicity. Used in AI/ML, data science, web dev. Key libraries: NumPy, Pandas, TensorFlow, Django/Flask.",
  "data structure": "Data structures organise data for efficient access. Types: Arrays, Linked Lists, Stacks (LIFO), Queues (FIFO), Trees (BST, AVL), Graphs, Hash Tables. Understanding Big-O notation is essential.",
  algorithm:   "An algorithm is a step-by-step procedure to solve a problem. Categories: Sorting (Merge O(n log n), Quick), Searching (Binary O(log n)), Dynamic Programming, Graph algorithms (BFS, DFS, Dijkstra).",
  dbms:        "DBMS manages structured data. Key concepts: Relational model, SQL, ACID properties, Normalisation (1NF–BCNF), Indexing, Transactions. Popular: PostgreSQL, MySQL, MongoDB.",
  database:    "Databases store and retrieve data. Types: Relational (SQL), NoSQL (document, key-value, graph). Key: schemas, queries, joins, indexes, normalisation.",
  "operating system": "OS manages hardware/software resources. Core: Process scheduling (Round Robin, FCFS), Memory management (paging, virtual memory), File system, Deadlock (Coffman conditions), Semaphores.",
  network:     "Computer Networks connect devices. Key: OSI Model (7 layers), TCP/IP, IP addressing, DNS, HTTP/HTTPS, routing (OSPF, BGP), firewalls, VLANs.",
  "machine learning": "ML enables computers to learn from data. Types: Supervised, Unsupervised, Reinforcement. Key algorithms: Linear Regression, Decision Trees, SVM, Neural Networks. Libraries: Scikit-learn, TensorFlow.",
  "artificial intelligence": "AI simulates human intelligence. Branches: ML, Deep Learning, NLP, Computer Vision. Core: search algorithms, knowledge representation, neural networks, transformers (GPT, BERT).",
  "cloud": "Cloud Computing delivers IT services over internet. Models: IaaS, PaaS, SaaS. Providers: AWS, Azure, GCP. Key: virtualisation, containerisation (Docker, Kubernetes), microservices, serverless.",
  web:         "Web Development: Frontend (HTML, CSS, JavaScript, React), Backend (Spring Boot, Node.js, Django). REST APIs, HTTP/HTTPS, JWT auth, CI/CD.",
  "discrete math": "Discrete Maths: Sets, Logic, Graph Theory, Combinatorics, Probability, Boolean Algebra, Number Theory, Proof techniques. Foundation of CS algorithms and compiler design.",
  recursion:   "Recursion is when a function calls itself to solve smaller sub-problems. It has a base case (stopping condition) and recursive case. Example: factorial(n) = n × factorial(n-1). Used in trees, graphs, divide-and-conquer.",
  oop:         "Object-Oriented Programming: Encapsulation (hiding data), Inheritance (reusing code), Polymorphism (one interface, many forms), Abstraction (hiding complexity). Languages: Java, Python, C++.",
  sql:         "SQL (Structured Query Language) manages relational databases. Key commands: SELECT, INSERT, UPDATE, DELETE, JOIN, GROUP BY, ORDER BY. Concepts: primary key, foreign key, indexes, transactions.",
  c:           "C is a low-level, compiled programming language. Key features: pointers, memory management (malloc/free), structs. Foundation for OS development. C++ extends C with OOP features.",
  default:     "I am your Smart Classroom AI Assistant powered by Ollama (llama3.2). I can explain any academic topic — programming languages, algorithms, databases, networking, AI/ML, mathematics and more. What would you like to learn?",
};

function getBuiltInResponse(prompt, role) {
  const p = prompt.toLowerCase();
  for (const [key, val] of Object.entries(KB)) {
    if (key !== "default" && p.includes(key)) return val;
  }
  if (role === "STUDENT") {
    if (p.includes("hello") || p.includes("hi")) return "Hello! I am your AI study assistant. Ask me about Java, algorithms, DBMS, networking, machine learning, or any academic topic!";
    return "Ask me any academic question — Java, Python, algorithms, DBMS, networking, AI/ML, OOP, or maths. I will explain it clearly!";
  }
  return "I can help with attendance analytics, student performance, device status, exam results, and academic topics. What would you like to know?";
}

/* ─── Text-to-Speech ─────────────────────────────────────────────────── */
function speak(text, onEnd) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.95; utt.pitch = 1.0; utt.volume = 1.0;
  const voices = window.speechSynthesis.getVoices();
  const best = voices.find(v => v.lang.startsWith("en") &&
    (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha")))
    || voices.find(v => v.lang.startsWith("en")) || voices[0];
  if (best) utt.voice = best;
  utt.onend = onEnd || null;
  window.speechSynthesis.speak(utt);
}

function getGreeting(role, firstName) {
  const n = firstName || "there";
  if (role === "STUDENT") return `Hello ${n}! I am your AI study assistant powered by Ollama. Ask me about Java, algorithms, DBMS, networking, AI/ML, or any academic topic. I will explain everything clearly!`;
  if (role === "TEACHER") return `Hello ${n}! I can help with class analytics, student performance, quiz generation, and academic topics. What do you need?`;
  if (role === "HOD")     return `Hello ${n}! I can provide department analytics, performance trends, and academic insights. What would you like to know?`;
  return `Hello ${n}! I can provide system analytics, performance reports, device status, and answer academic questions. What would you like to know?`;
}

const ROLE_LABEL = { SUPER_ADMIN:"Super Admin", ADMIN:"Admin", HOD:"HOD", TEACHER:"Teacher", STUDENT:"Student" };
const ROLE_COLOR = { SUPER_ADMIN:"bg-red-100 text-red-700", ADMIN:"bg-blue-100 text-blue-700", HOD:"bg-purple-100 text-purple-700", TEACHER:"bg-green-100 text-green-700", STUDENT:"bg-orange-100 text-orange-700" };

/* ─── Component ──────────────────────────────────────────────────────── */
export default function AIAssistant() {
  const user   = useSelector(selectUser);
  const role   = user?.role || "STUDENT";
  // Resolve userId from multiple possible field names
  const userId = user?.userId || user?.id || null;

  const quickQ = QUICK[role] || QUICK.STUDENT;

  const [messages,  setMessages]  = useState([{ id:1, role:"assistant", text:getGreeting(role, user?.firstName), time:new Date() }]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [listening, setListening] = useState(false);
  const [speaking,  setSpeaking]  = useState(false);
  const [voiceOn,   setVoiceOn]   = useState(true);
  const [copiedId,  setCopiedId]  = useState(null);

  const bottomRef      = useRef(null);
  const inputRef       = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);
  useEffect(() => { window.speechSynthesis?.getVoices(); }, []);
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  const sendMessage = useCallback(async (text) => {
    const prompt = (text || input).trim();
    if (!prompt || loading) return;
    setInput(""); setLoading(true);
    setMessages(prev => [...prev, { id:Date.now(), role:"user", text:prompt, time:new Date() }]);

    let aiText = "";
    const uid = userId || 1; // fallback to 1 if userId not resolved

    try {
      const payload = { prompt, queryType:"GENERAL", ...(sessionId && { sessionId }) };
      const { data } = await axiosClient.post(
          `/ai/query/${uid}`,
          payload
      );

      console.log("Backend Response:", data);

      aiText = data?.response?.trim() || "";
      if (data?.sessionId && !sessionId) setSessionId(data.sessionId);
    } catch(err){

         if(err.code==="ECONNABORTED"){
            addMessage({
               role:"assistant",
               content:"The AI is taking longer than expected. Please wait..."
            });
         }

         console.error(err);
      }

    // If response is empty or backend failed, use built-in fallback
    if (!aiText) {
      aiText = getBuiltInResponse(prompt, role);
    }

    setMessages(prev => [...prev, { id:Date.now()+1, role:"assistant", text:aiText, time:new Date() }]);
    setLoading(false);
    if (voiceOn) { setSpeaking(true); speak(aiText, () => setSpeaking(false)); }
  }, [input, loading, sessionId, userId, role, voiceOn]);

  const handleKeyDown = (e) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const toggleListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition not supported. Try Chrome."); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.continuous=false; rec.interimResults=true; rec.lang="en-US";
    rec.onstart  = () => setListening(true);
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r=>r[0].transcript).join("");
      setInput(t);
      if (e.results[e.results.length-1].isFinal) { setListening(false); sendMessage(t); }
    };
    rec.onerror = (e) => { toast.error(`Mic error: ${e.error}`); setListening(false); };
    rec.onend   = () => setListening(false);
    recognitionRef.current = rec; rec.start();
  }, [listening, sendMessage]);

  const stopSpeaking = () => { window.speechSynthesis?.cancel(); setSpeaking(false); };
  const speakMsg     = (t)  => { setSpeaking(true); speak(t, () => setSpeaking(false)); };
  const copyText     = (id,t) => { navigator.clipboard.writeText(t).then(() => { setCopiedId(id); setTimeout(()=>setCopiedId(null),2000); }); };
  const clearChat    = ()   => { setMessages([{ id:Date.now(), role:"assistant", text:getGreeting(role, user?.firstName), time:new Date() }]); setSessionId(null); stopSpeaking(); };
  const fmt          = (d)  => d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });

  return (
    <div className="flex flex-col p-6 gap-5" style={{ height:"calc(100vh - 64px)", overflow:"hidden" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">AI Assistant <Sparkles size={20} className="text-blue-500" /></h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_COLOR[role]||"bg-gray-100 text-gray-600"}`}>{ROLE_LABEL[role]||role} Mode</span>
            <span className="text-xs text-gray-400">{role==="STUDENT" ? "Subject explanations & study help" : "Institutional analytics + subject help"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={()=>{setVoiceOn(!voiceOn); if(!voiceOn)stopSpeaking();}} className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition ${voiceOn?"bg-blue-50 border-blue-200 text-blue-700":"bg-gray-50 border-gray-200 text-gray-500"}`}>
            {voiceOn?<Volume2 size={15}/>:<VolumeX size={15}/>}<span className="hidden sm:inline">{voiceOn?"Voice ON":"Voice OFF"}</span>
          </button>
          {speaking && <button onClick={stopSpeaking} className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 animate-pulse"><VolumeX size={15}/> Stop</button>}
          <button onClick={clearChat} className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"><Trash2 size={14}/> Clear</button>
          <button onClick={clearChat} className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"><Plus size={14}/> New</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5 flex-1 min-h-0 overflow-hidden">
        {/* Chat */}
        <div className="xl:col-span-3 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role==="user"?"flex-row-reverse":""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white ${msg.role==="assistant"?"bg-blue-600":"bg-gray-600"}`}>
                  {msg.role==="assistant"?<Bot size={15}/>:<User size={15}/>}
                </div>
                <div className={`group relative max-w-[80%] flex flex-col ${msg.role==="user"?"items-end":"items-start"}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${msg.role==="user"?"bg-blue-600 text-white rounded-tr-sm":"bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm"}`}>{msg.text}</div>
                  <div className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${msg.role==="user"?"flex-row-reverse":""}`}>
                    <span>{fmt(msg.time)}</span>
                    {msg.role==="assistant" && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={()=>speakMsg(msg.text)} className="p-1 hover:text-blue-600 rounded" title="Read aloud"><Volume2 size={12}/></button>
                        <button onClick={()=>copyText(msg.id,msg.text)} className="p-1 hover:text-blue-600 rounded" title="Copy">
                          {copiedId===msg.id?<Check size={12} className="text-green-500"/>:<Copy size={12}/>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"><Bot size={15} className="text-white"/></div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">{[0,150,300].map(d=><div key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}></div>)}</div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-4 flex-shrink-0">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {quickQ.slice(0,6).map(q=>(
                <button key={q} onClick={()=>sendMessage(q)} className="text-xs bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-600 hover:text-blue-700 rounded-full px-3 py-1.5 whitespace-nowrap transition flex-shrink-0">{q}</button>
              ))}
            </div>
            {listening && <div className="flex items-center gap-2 mb-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Listening…</div>}
            <div className="flex items-end gap-2">
              <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1}
                placeholder={role==="STUDENT"?"Ask any subject question… e.g. 'What is Java?' (Enter to send)":"Ask about attendance, students, devices… (Enter to send)"}
                className="flex-1 resize-none text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                style={{minHeight:"48px",maxHeight:"120px"}}
                onInput={e=>{e.target.style.height="48px";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}}
              />
              <button onClick={toggleListening} className={`p-3 rounded-xl border transition flex-shrink-0 ${listening?"bg-red-600 border-red-600 text-white animate-pulse":"bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"}`} title={listening?"Stop":"Voice input"}>
                {listening?<MicOff size={18}/>:<Mic size={18}/>}
              </button>
              <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-xl transition flex-shrink-0">
                {loading?<Loader2 size={18} className="animate-spin"/>:<Send size={18}/>}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">Enter to send · 🎤 voice input · hover message to 🔊 re-hear or copy</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex-shrink-0">
            <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-1.5"><Sparkles size={14} className="text-blue-500"/> AI Status</h3>
            <div className="space-y-2 text-xs">
              {[
                {l:"Text Responses",    ok:true,   v:"Active"},
                {l:"Ollama (llama3.2)", ok:true,   v:"Connected"},
                {l:"Voice Input",       ok:!!(window.SpeechRecognition||window.webkitSpeechRecognition), v:(window.SpeechRecognition||window.webkitSpeechRecognition)?"Ready":"Chrome only"},
                {l:"Voice Output",      ok:voiceOn, v:voiceOn?"Enabled":"Disabled"},
              ].map(s=>(
                <div key={s.l} className="flex items-center justify-between">
                  <span className="text-gray-500">{s.l}</span>
                  <span className={`flex items-center gap-1 font-medium ${s.ok?"text-green-600":"text-orange-500"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.ok?"bg-green-500":"bg-orange-400"}`}></span>{s.v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex-shrink-0">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Suggested Questions</h3>
            <div className="space-y-1">
              {quickQ.map(q=>(
                <button key={q} onClick={()=>sendMessage(q)} className="w-full text-left text-xs text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg px-3 py-2 transition border border-transparent hover:border-blue-100">{q}</button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800 text-sm">Session</h3>
              <span className="text-xs text-gray-400">{messages.filter(m=>m.role==="user").length} questions</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {messages.filter(m=>m.role==="user").map(m=>(
                <div key={m.id} className="flex items-start gap-2 text-xs text-gray-600 p-1.5">
                  <MessageSquare size={11} className="text-gray-400 flex-shrink-0 mt-0.5"/>
                  <span className="truncate">{m.text}</span>
                </div>
              ))}
              {messages.filter(m=>m.role==="user").length===0 && <p className="text-xs text-gray-400 text-center py-2">No questions yet</p>}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4 flex-shrink-0">
            <h3 className="font-semibold text-gray-800 text-sm mb-1.5 flex items-center gap-1"><Bot size={13} className="text-blue-600"/> Tips</h3>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li>• Type or click 🎤 to speak</li>
              <li>• Responses read aloud automatically</li>
              <li>• Hover messages to 🔊 re-hear or copy</li>
              {role==="STUDENT"&&<li>• Ask any subject — Java, DBMS, Networks, AI...</li>}
              {role!=="STUDENT"&&<li>• Ask about students, attendance, devices...</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
