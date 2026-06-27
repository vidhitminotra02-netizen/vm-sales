import { useState, useRef, useEffect } from "react";

// ─── AGENT DEFINITIONS ────────────────────────────────────────────────────────
const AGENTS = [
  {
    id: "icp",
    emoji: "🎯",
    name: "ICP Builder",
    sub: "Define your perfect customer",
    badge: "Profiling",
    clr: "#60A5FA",
    bg: "rgba(96,165,250,0.07)",
    hints: [
      "Build my ICP from scratch",
      "Refine my existing ICP",
      "Which segment should I target first?",
      "Create account list criteria",
    ]
  },
  {
    id: "leads",
    emoji: "📡",
    name: "Lead Finder",
    sub: "Build your target pipeline",
    badge: "Prospecting",
    clr: "#34D399",
    bg: "rgba(52,211,153,0.07)",
    hints: [
      "Build a LinkedIn lead gen strategy",
      "Design a cold email campaign",
      "Plan a trade show campaign",
      "Create a lead scoring model",
    ]
  },
  {
    id: "write",
    emoji: "✉️",
    name: "Outreach Writer",
    sub: "Copy that gets replies",
    badge: "Copywriting",
    clr: "#A78BFA",
    bg: "rgba(167,139,250,0.07)",
    hints: [
      "Write a 5-touch cold email sequence",
      "Create LinkedIn connection + follow-ups",
      "Build a cold call script with objections",
      "Write re-engagement for cold leads",
    ]
  },
  {
    id: "deals",
    emoji: "📊",
    name: "Pipeline Coach",
    sub: "Qualify, track & close deals",
    badge: "Deal Coach",
    clr: "#FBBF24",
    bg: "rgba(251,191,36,0.07)",
    hints: [
      "Help me qualify this deal",
      "My deal has gone cold — help me",
      "Review my full pipeline",
      "Prep me for a closing meeting",
    ]
  },
  {
    id: "strategy",
    emoji: "🏆",
    name: "Strategy Advisor",
    sub: "Audit & scale your revenue",
    badge: "Consulting",
    clr: "#F87171",
    bg: "rgba(248,113,113,0.07)",
    hints: [
      "Audit my current sales process",
      "Build a complete sales playbook",
      "Design my KPI dashboard",
      "Create a 90-day revenue growth plan",
    ]
  },
];

// ─── MARKDOWN RENDERER ────────────────────────────────────────────────────────
function RenderMsg({ text }) {
  const lines = text.split("\n");
  return (
    <div>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 4 }} />;

        const inline = (str) =>
          str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((p, j) => {
            if (/^\*\*/.test(p) && /\*\*$/.test(p))
              return (
                <strong key={j} style={{ fontWeight: 650, color: "#F8FAFC" }}>
                  {p.slice(2, -2)}
                </strong>
              );
            if (/^`/.test(p) && /`$/.test(p))
              return (
                <code
                  key={j}
                  style={{
                    background: "#1A2337",
                    color: "#6EE7B7",
                    padding: "1px 5px",
                    borderRadius: 3,
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                >
                  {p.slice(1, -1)}
                </code>
              );
            return p;
          });

        const base = { fontSize: 13, lineHeight: "1.58", margin: "2px 0" };

        if (/^### /.test(line))
          return (
            <div key={i} style={{ ...base, fontWeight: 600, color: "#CBD5E1", marginTop: 8 }}>
              {inline(line.slice(4))}
            </div>
          );
        if (/^## /.test(line))
          return (
            <div key={i} style={{ ...base, fontWeight: 700, fontSize: 14, color: "#E2E8F0", marginTop: 10 }}>
              {inline(line.slice(3))}
            </div>
          );
        if (/^# /.test(line))
          return (
            <div key={i} style={{ ...base, fontWeight: 700, fontSize: 15, color: "#F1F5F9", marginTop: 12 }}>
              {inline(line.slice(2))}
            </div>
          );
        if (/^[-•] /.test(line))
          return (
            <div key={i} style={{ ...base, display: "flex", gap: 7 }}>
              <span style={{ color: "#374151", flexShrink: 0, marginTop: 1 }}>•</span>
              <span>{inline(line.slice(2))}</span>
            </div>
          );
        if (/^\d+\. /.test(line)) {
          const di = line.indexOf(". ");
          return (
            <div key={i} style={{ ...base, display: "flex", gap: 7 }}>
              <span style={{ color: "#374151", flexShrink: 0, minWidth: 14 }}>
                {line.slice(0, di)}.
              </span>
              <span>{inline(line.slice(di + 2))}</span>
            </div>
          );
        }
        return (
          <p key={i} style={base}>
            {inline(line)}
          </p>
        );
      })}
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("icp");
  const [convos, setConvos] = useState({});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [stream, setStream] = useState("");
  const [streaming, setStreaming] = useState(false);

  const bottomRef = useRef(null);
  const taRef = useRef(null);

  const agent = AGENTS.find((a) => a.id === tab);
  const msgs = convos[tab] || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, stream]);

  const send = async (text) => {
    const t = (text ?? input).trim();
    if (!t || busy) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";

    const history = [...msgs, { role: "user", content: t }];
    setConvos((p) => ({ ...p, [tab]: history }));
    setBusy(true);
    setStream("");
    setStreaming(false);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          messages: history,
        }),
      });
      const data = await res.json();
      const reply =
        data.reply ||
        "I couldn't generate a response. Please try again.";

      // Typewriter animation
      setStreaming(true);
      let shown = "";
      for (let i = 0; i < reply.length; i += 4) {
        shown += reply.slice(i, i + 4);
        setStream(shown);
        await new Promise((r) => setTimeout(r, 11));
      }

      setConvos((p) => ({
        ...p,
        [tab]: [...history, { role: "assistant", content: reply }],
      }));
    } catch {
      setConvos((p) => ({
        ...p,
        [tab]: [
          ...history,
          {
            role: "assistant",
            content: "⚠️ Connection error. Please try again.",
          },
        ],
      }));
    } finally {
      setStream("");
      setStreaming(false);
      setBusy(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const canSend = input.trim().length > 0 && !busy;
  const BG = "#050810";
  const SURF = "#0A0D1A";
  const BORD = "#141F35";

  return (
    <div
      style={{
        background: BG,
        color: "#CBD5E1",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ── HEADER ── */}
      <header
        style={{
          background: SURF,
          borderBottom: `1px solid ${BORD}`,
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #2563EB 0%, #D97706 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-0.3px",
            flexShrink: 0,
          }}
        >
          VM
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#F1F5F9",
              letterSpacing: "-0.2px",
            }}
          >
            VM Sales AI
          </div>
          <div
            style={{
              fontSize: 9,
              color: "#374151",
              letterSpacing: "0.9px",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            B2B Sales Intelligence Platform
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22C55E",
              boxShadow: "0 0 8px #22C55E80",
            }}
          />
          <span style={{ fontSize: 11, color: "#22C55E", fontWeight: 600 }}>
            Live
          </span>
          <span
            style={{
              marginLeft: 10,
              fontSize: 10,
              color: "#1F2D44",
              padding: "2px 7px",
              border: "1px solid #1F2D44",
              borderRadius: 20,
            }}
          >
            5 Agents
          </span>
        </div>
      </header>

      {/* ── AGENT TABS ── */}
      <div
        style={{
          background: SURF,
          borderBottom: `1px solid ${BORD}`,
          display: "flex",
          overflowX: "auto",
          flexShrink: 0,
          scrollbarWidth: "none",
        }}
      >
        {AGENTS.map((a) => {
          const active = a.id === tab;
          const msgCount = Math.ceil((convos[a.id]?.length || 0) / 2);
          return (
            <button
              key={a.id}
              onClick={() => setTab(a.id)}
              style={{
                background: active ? `${a.clr}10` : "none",
                border: "none",
                cursor: "pointer",
                padding: "9px 14px",
                color: active ? a.clr : "#4B5563",
                fontWeight: active ? 600 : 400,
                fontSize: 12,
                borderBottom: `2px solid ${active ? a.clr : "transparent"}`,
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 13 }}>{a.emoji}</span>
              <span>{a.name}</span>
              {msgCount > 0 && (
                <span
                  style={{
                    background: a.clr,
                    color: "#000",
                    borderRadius: 10,
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "1px 5px",
                    lineHeight: 1.5,
                  }}
                >
                  {msgCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── CONTEXT BAR ── */}
      <div
        style={{
          background: agent.bg,
          borderBottom: `1px solid ${BORD}`,
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 16 }}>{agent.emoji}</span>
        <div>
          <div
            style={{ fontSize: 12, fontWeight: 700, color: agent.clr, lineHeight: 1.3 }}
          >
            {agent.name}
          </div>
          <div style={{ fontSize: 10, color: "#4B5563" }}>{agent.sub}</div>
        </div>
        <div
          style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}
        >
          <span
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${agent.clr}25`,
              borderRadius: 20,
              padding: "2px 8px",
              fontSize: 9,
              color: agent.clr,
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {agent.badge}
          </span>
          {msgs.length > 0 && (
            <button
              onClick={() => setConvos((p) => ({ ...p, [tab]: [] }))}
              style={{
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.18)",
                borderRadius: 6,
                padding: "2px 8px",
                fontSize: 10,
                color: "#F87171",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px 13px 6px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Empty state */}
        {msgs.length === 0 && !streaming && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px 12px",
              gap: 14,
            }}
          >
            <div style={{ fontSize: 38 }}>{agent.emoji}</div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#E2E8F0",
                  marginBottom: 4,
                }}
              >
                {agent.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#4B5563",
                  maxWidth: 240,
                  lineHeight: 1.5,
                }}
              >
                {agent.sub}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 7,
                width: "100%",
                maxWidth: 360,
              }}
            >
              {agent.hints.map((h, i) => (
                <button
                  key={i}
                  onClick={() => send(h)}
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: `1px solid ${agent.clr}20`,
                    borderRadius: 9,
                    padding: "9px 11px",
                    fontSize: 11,
                    color: "#94A3B8",
                    cursor: "pointer",
                    textAlign: "left",
                    lineHeight: 1.4,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = agent.clr + "50";
                    e.currentTarget.style.color = "#CBD5E1";
                    e.currentTarget.style.background = `${agent.clr}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = agent.clr + "20";
                    e.currentTarget.style.color = "#94A3B8";
                    e.currentTarget.style.background = "rgba(255,255,255,0.025)";
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#1E2D44",
                marginTop: 4,
                textAlign: "center",
              }}
            >
              Trained on India B2B
            </div>
          </div>
        )}

        {/* Message list */}
        {msgs.map((m, i) => {
          const isU = m.role === "user";
          return (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 10,
                flexDirection: isU ? "row-reverse" : "row",
                alignItems: "flex-start",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: isU
                    ? "linear-gradient(135deg, #1D4ED8, #6D28D9)"
                    : agent.bg,
                  border: `1px solid ${isU ? "#2563EB" : agent.clr}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isU ? 9 : 12,
                  fontWeight: isU ? 700 : 400,
                  color: isU ? "#93C5FD" : "inherit",
                  marginTop: 1,
                }}
              >
                {isU ? "U" : agent.emoji}
              </div>

              {/* Bubble */}
              <div
                style={{
                  maxWidth: "80%",
                  background: isU ? "#0D1D38" : "#0C1525",
                  border: `1px solid ${isU ? "#1E3A6A" : "#16253A"}`,
                  borderRadius: isU
                    ? "10px 3px 10px 10px"
                    : "3px 10px 10px 10px",
                  padding: "9px 12px",
                  color: isU ? "#BFDBFE" : "#BDC9DB",
                }}
              >
                {isU ? (
                  <p
                    style={{ fontSize: 13, lineHeight: "1.52", margin: 0 }}
                  >
                    {m.content}
                  </p>
                ) : (
                  <RenderMsg text={m.content} />
                )}
              </div>
            </div>
          );
        })}

        {/* Streaming message */}
        {streaming && stream && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 10,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: agent.bg,
                border: `1px solid ${agent.clr}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {agent.emoji}
            </div>
            <div
              style={{
                maxWidth: "80%",
                background: "#0C1525",
                border: "1px solid #16253A",
                borderRadius: "3px 10px 10px 10px",
                padding: "9px 12px",
                color: "#BDC9DB",
              }}
            >
              <RenderMsg text={stream} />
              <span
                style={{
                  display: "inline-block",
                  width: 2,
                  height: 12,
                  background: agent.clr,
                  marginLeft: 2,
                  verticalAlign: "middle",
                  animation: "blink 0.65s step-end infinite",
                }}
              />
            </div>
          </div>
        )}

        {/* Loading dots */}
        {busy && !streaming && (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 10,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: agent.bg,
                border: `1px solid ${agent.clr}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              {agent.emoji}
            </div>
            <div
              style={{
                background: "#0C1525",
                border: "1px solid #16253A",
                borderRadius: "3px 10px 10px 10px",
                padding: "11px 14px",
                display: "flex",
                gap: 5,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((k) => (
                <div
                  key={k}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: agent.clr,
                    animation: `bounce 1.1s ease-in-out ${k * 0.18}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── QUICK HINTS (in-chat) ── */}
      {msgs.length > 0 && msgs.length < 6 && (
        <div
          style={{
            padding: "3px 13px",
            display: "flex",
            gap: 5,
            overflowX: "auto",
            flexShrink: 0,
            scrollbarWidth: "none",
          }}
        >
          {agent.hints.slice(0, 3).map((h, i) => (
            <button
              key={i}
              onClick={() => send(h)}
              disabled={busy}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid #141F35",
                borderRadius: 20,
                padding: "3px 10px",
                fontSize: 10,
                color: "#374151",
                cursor: busy ? "default" : "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {/* ── INPUT ── */}
      <div
        style={{
          background: SURF,
          borderTop: `1px solid ${BORD}`,
          padding: "10px 13px 12px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 7,
            alignItems: "flex-end",
            background: "#0C1525",
            border: `1px solid ${busy ? agent.clr + "40" : BORD}`,
            borderRadius: 10,
            padding: "7px 7px 7px 12px",
            transition: "border-color 0.2s",
          }}
        >
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={`Ask ${agent.name}...`}
            rows={1}
            disabled={busy}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "#E2E8F0",
              fontSize: 13,
              resize: "none",
              lineHeight: "1.5",
              maxHeight: 96,
              overflowY: "auto",
              fontFamily: "inherit",
              opacity: busy ? 0.4 : 1,
            }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height =
                Math.min(e.target.scrollHeight, 96) + "px";
            }}
          />
          <button
            onClick={() => send()}
            disabled={!canSend}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: canSend ? agent.clr : "#101828",
              border: "none",
              cursor: canSend ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.15s",
              transform: canSend ? "scale(1.0)" : "scale(0.93)",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke={canSend ? "#000" : "#1E293B"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22,2 15,22 11,13 2,9" />
            </svg>
          </button>
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: 5,
            fontSize: 9,
            color: "#1A2840",
            letterSpacing: "0.4px",
            fontWeight: 500,
          }}
        >
          VM SALES AI · INDIA'S B2B SALES INTELLIGENCE PLATFORM
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.7; }
          40% { transform: translateY(-7px); opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #141F35; border-radius: 3px; }
        textarea::placeholder { color: #1F2D44; }
        button:active { opacity: 0.7; }
      `}</style>
    </div>
  );
}
