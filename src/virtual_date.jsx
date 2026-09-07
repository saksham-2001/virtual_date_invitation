import React, { useState, useRef, useCallback, useEffect } from "react";

const COPY = {
  vi: {
    toggleLabel: "Ngôn ngữ",
    eyebrow: "Một lời mời nhỏ",
    question: "Em có muốn đi hẹn hò (ảo) với anh không?",
    subtitle: "Chỉ cần em đồng ý, khoảng cách không còn là vấn đề.",
    yes: "Có, em đồng ý",
    no: "Không",
    successTitle: "Tuyệt vời!",
    successMsg: "Hẹn gặp em lúc 2:30 chiều nhé.",
    successSub: "Anh sẽ đợi em ở đó.",
    close: "Đóng lại",
    teases: [
      "Bấm lại thử xem nào?",
      "Chậm hơn một chút thôi mà…",
      "Nút này nhát lắm đó.",
      "Thôi mà, bấm Có đi!",
      "Nó cứ chạy hoài à…",
      "Anh nghĩ em nên chọn Có đó.",
    ],
  },
  en: {
    toggleLabel: "Language",
    eyebrow: "A small invitation",
    question: "Will you go on a virtual date with me?",
    subtitle: "Just say yes - distance won't matter tonight.",
    yes: "Yes, I'd love to",
    no: "No",
    successTitle: "Wonderful!",
    successMsg: "See you at 2:30 p.m.",
    successSub: "I'll be waiting.",
    close: "Close",
    teases: [
      "Try clicking it again?",
      "A little slower this time…",
      "This button's a bit shy.",
      "Come on, pick Yes!",
      "It just keeps running…",
      "I think Yes suits you better.",
    ],
  },
};

const PALETTE = ["#d9a86c", "#e8637a", "#f2b6c6", "#f7ece2", "#a13d5a"];

function Petal({ style }) {
  return <div className="vd-petal" style={style} />;
}

function ConfettiPiece({ style }) {
  return <div className="vd-confetti" style={style} />;
}

export default function VirtualDate() {
  const [lang, setLang] = useState("vi");
  const [accepted, setAccepted] = useState(false);
  const [dodgeCount, setDodgeCount] = useState(0);
  const [noPos, setNoPos] = useState(null);
  const [hovered, setHovered] = useState(null); // "yes" | "no" | null
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const noBtnRef = useRef(null);
  const yesBtnRef = useRef(null);
  const t = COPY[lang];

  const petals = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 14,
      duration: 12 + Math.random() * 10,
      size: 6 + Math.random() * 10,
      color: PALETTE[i % PALETTE.length],
      drift: (Math.random() - 0.5) * 80,
    }))
  ).current;

  const confetti = useRef(
    Array.from({ length: 70 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.4 + Math.random() * 1.6,
      size: 6 + Math.random() * 8,
      color: PALETTE[i % PALETTE.length],
      rotate: Math.random() * 360,
      drift: (Math.random() - 0.5) * 200,
    }))
  ).current;

  const dodge = useCallback(() => {
    const container = containerRef.current;
    const btn = noBtnRef.current;
    const yesBtn = yesBtnRef.current;
    if (!container || !btn) return;

    const containerRect = container.getBoundingClientRect();
    const padding = 16;
    const bw = btn.offsetWidth || 120;
    const bh = btn.offsetHeight || 48;
    // Bounds are the container's own size, so the button can never leave the frame.
    const maxX = Math.max(padding, containerRect.width - bw - padding);
    const maxY = Math.max(padding, containerRect.height - bh - padding);

    // Exclusion zone around the Yes button (in container-relative coords) so No can never land on/near it.
    const yesRectAbs = yesBtn ? yesBtn.getBoundingClientRect() : null;
    const yesRect = yesRectAbs
      ? {
          left: yesRectAbs.left - containerRect.left,
          right: yesRectAbs.right - containerRect.left,
          top: yesRectAbs.top - containerRect.top,
          bottom: yesRectAbs.bottom - containerRect.top,
          width: yesRectAbs.width,
          height: yesRectAbs.height,
        }
      : null;
    const margin = 28; // extra breathing room beyond a plain overlap check
    const exclude = yesRect
      ? {
          left: yesRect.left - margin,
          right: yesRect.right + margin,
          top: yesRect.top - margin,
          bottom: yesRect.bottom + margin,
        }
      : null;

    const overlapsYes = (x, y) => {
      if (!exclude) return false;
      return (
        x < exclude.right &&
        x + bw > exclude.left &&
        y < exclude.bottom &&
        y + bh > exclude.top
      );
    };

    const yesCx = yesRect
      ? yesRect.left + yesRect.width / 2
      : containerRect.width / 2;
    const yesCy = yesRect
      ? yesRect.top + yesRect.height / 2
      : containerRect.height / 2;

    // Sample candidate spots, drop any that overlap Yes, then favor the ones
    // farthest from Yes so the button visibly runs away rather than teleporting randomly.
    const candidates = [];
    for (let i = 0; i < 30; i++) {
      const x = padding + Math.random() * (maxX - padding);
      const y = padding + Math.random() * (maxY - padding);
      if (overlapsYes(x, y)) continue;
      const cx = x + bw / 2;
      const cy = y + bh / 2;
      const dist = Math.hypot(cx - yesCx, cy - yesCy);
      candidates.push({ x, y, dist });
    }

    if (candidates.length === 0) {
      // Fallback: corner farthest from Yes, still clamped on screen.
      const corners = [
        { x: padding, y: padding },
        { x: maxX, y: padding },
        { x: padding, y: maxY },
        { x: maxX, y: maxY },
      ].filter((c) => !overlapsYes(c.x, c.y));
      const pick = corners[0] || { x: padding, y: padding };
      setNoPos(pick);
      setDodgeCount((c) => c + 1);
      return;
    }

    candidates.sort((a, b) => b.dist - a.dist);
    // Pick among the farthest few, for a touch of natural variety without ever landing near Yes.
    const top = candidates.slice(0, Math.min(4, candidates.length));
    const choice = top[Math.floor(Math.random() * top.length)];
    setNoPos({ x: choice.x, y: choice.y });
    setDodgeCount((c) => c + 1);
  }, []);

  const handleYes = () => setAccepted(true);

  const resetAll = () => {
    setAccepted(false);
    setNoPos(null);
    setDodgeCount(0);
  };

  useEffect(() => {
    if (accepted) {
      const onKey = (e) => {
        if (e.key === "Escape") resetAll();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [accepted]);

  const teaseIndex = Math.min(dodgeCount - 1, t.teases.length - 1);

  return (
    <div className="vd-root" ref={containerRef}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Inter:wght@400;500;600&display=swap');

        * { box-sizing: border-box; }

        .vd-root {
          position: relative;
          isolation: isolate;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          background:
            radial-gradient(ellipse 120% 80% at 50% -10%, #4a1930 0%, transparent 55%),
            radial-gradient(ellipse 100% 60% at 85% 110%, #3a1428 0%, transparent 60%),
            linear-gradient(160deg, #1f0a17 0%, #26091b 45%, #180712 100%);
          font-family: 'Inter', sans-serif;
          color: #f7ece2;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .vd-petal {
          position: absolute;
          bottom: -20px;
          border-radius: 50%;
          filter: blur(0.3px);
          opacity: 0.55;
          animation: vd-rise linear infinite;
          pointer-events: none;
        }

        @keyframes vd-rise {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.5; }
          100% { transform: translate(var(--drift, 40px), -110vh) rotate(200deg); opacity: 0; }
        }

        .vd-card {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 480px;
          padding: 48px 40px 40px;
          border-radius: 22px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
          border: 1px solid rgba(217, 168, 108, 0.35);
          box-shadow: 0 30px 80px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06);
          backdrop-filter: blur(6px);
          text-align: center;
        }

        .vd-toggle {
          position: absolute;
          top: 18px;
          right: 18px;
          display: flex;
          gap: 2px;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(217,168,108,0.3);
          border-radius: 999px;
          padding: 3px;
        }

        .vd-toggle button {
          border: none;
          background: transparent;
          color: rgba(247,236,226,0.6);
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.25s ease, color 0.25s ease;
          letter-spacing: 0.02em;
        }

        .vd-toggle button.active {
          background: linear-gradient(135deg, #d9a86c, #b97a4f);
          color: #241009;
        }

        .vd-eyebrow {
          font-size: 12.5px;
          letter-spacing: 0.08em;
          color: #d9a86c;
          margin: 6px 0 18px;
          font-weight: 500;
        }

        .vd-question {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: clamp(28px, 5vw, 38px);
          line-height: 1.2;
          margin: 0 0 14px;
          color: #fff6ee;
        }

        .vd-subtitle {
          font-size: 15px;
          color: rgba(247,236,226,0.65);
          line-height: 1.55;
          max-width: 340px;
          margin: 0 auto 34px;
        }

        .vd-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .vd-yes {
          border: none;
          background: linear-gradient(135deg, #e8637a, #a13d5a);
          color: #fff6ee;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          padding: 15px 28px;
          border-radius: 14px;
          cursor: pointer;
          box-shadow: 0 12px 30px -8px rgba(232, 99, 122, 0.55);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .vd-yes:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 16px 36px -8px rgba(232, 99, 122, 0.7);
        }

        .vd-no {
          border: 1px solid rgba(247,236,226,0.25);
          background: rgba(255,255,255,0.04);
          color: rgba(247,236,226,0.8);
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 15px;
          padding: 15px 24px;
          border-radius: 14px;
          cursor: pointer;
          transition: left 0.28s cubic-bezier(.2,.9,.3,1.3), top 0.28s cubic-bezier(.2,.9,.3,1.3);
        }

        .vd-no.roaming {
          position: absolute;
          z-index: 5;
        }

        .vd-tease {
          margin-top: 18px;
          font-size: 13px;
          color: rgba(217,168,108,0.85);
          font-style: italic;
          min-height: 18px;
          font-family: 'Cormorant Garamond', serif;
        }

        .vd-overlay {
          position: absolute;
          inset: 0;
          z-index: 20;
          background: rgba(15, 4, 10, 0.72);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: vd-fade-in 0.35s ease;
        }

        @keyframes vd-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .vd-confetti {
          position: absolute;
          top: -20px;
          border-radius: 2px;
          animation: vd-fall linear forwards;
          pointer-events: none;
          z-index: 21;
        }

        @keyframes vd-fall {
          to {
            transform: translate(var(--drift, 0px), 105vh) rotate(var(--rot, 180deg));
            opacity: 0.9;
          }
        }

        .vd-modal {
          position: relative;
          z-index: 22;
          width: 100%;
          max-width: 380px;
          text-align: center;
          background: linear-gradient(180deg, rgba(38,15,28,0.95), rgba(24,7,18,0.98));
          border: 1px solid rgba(217,168,108,0.4);
          border-radius: 20px;
          padding: 40px 32px 32px;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.8);
          animation: vd-pop 0.4s cubic-bezier(.2,.9,.3,1.3);
        }

        @keyframes vd-pop {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .vd-modal-heart {
          font-size: 34px;
          margin-bottom: 10px;
        }

        .vd-modal-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: 28px;
          color: #fff6ee;
          margin: 0 0 10px;
        }

        .vd-modal-msg {
          font-size: 17px;
          color: #f2b6c6;
          margin: 0 0 6px;
          font-weight: 600;
        }

        .vd-modal-sub {
          font-size: 14px;
          color: rgba(247,236,226,0.6);
          margin: 0 0 26px;
        }

        .vd-modal-close {
          border: 1px solid rgba(217,168,108,0.5);
          background: transparent;
          color: #d9a86c;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          font-size: 14px;
          padding: 11px 22px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .vd-modal-close:hover {
          background: rgba(217,168,108,0.12);
        }

        @media (prefers-reduced-motion: reduce) {
          .vd-petal, .vd-confetti { animation: none; display: none; }
          .vd-yes:hover { transform: none; }
        }
      `}</style>

      {petals.map((p, i) => (
        <Petal
          key={i}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            ["--drift"]: `${p.drift}px`,
          }}
        />
      ))}

      <div className="vd-card">
        <div className="vd-toggle" role="group" aria-label={t.toggleLabel}>
          <button
            className={lang === "vi" ? "active" : ""}
            onClick={() => setLang("vi")}
          >
            Tiếng Việt
          </button>
          <button
            className={lang === "en" ? "active" : ""}
            onClick={() => setLang("en")}
          >
            English
          </button>
        </div>

        <div className="vd-eyebrow">{t.eyebrow}</div>
        <h1 className="vd-question">{t.question}</h1>
        <p className="vd-subtitle">{t.subtitle}</p>

        <div className="vd-actions">
          <button className="vd-yes" ref={yesBtnRef} onClick={handleYes}>
            {t.yes}
          </button>

          <button
            ref={noBtnRef}
            className={"vd-no" + (noPos ? " roaming" : "")}
            style={
              noPos
                ? { left: `${noPos.x}px`, top: `${noPos.y}px` }
                : undefined
            }
            onMouseEnter={dodge}
            onClick={dodge}
            onTouchStart={dodge}
          >
            {t.no}
          </button>
        </div>

        <div className="vd-tease">
          {dodgeCount > 0 ? t.teases[teaseIndex] : ""}
        </div>
      </div>

      {accepted && (
        <div className="vd-overlay" onClick={resetAll}>
          {confetti.map((c, i) => (
            <ConfettiPiece
              key={i}
              style={{
                left: `${c.left}%`,
                width: c.size,
                height: c.size * 0.4,
                background: c.color,
                animationDuration: `${c.duration}s`,
                animationDelay: `${c.delay}s`,
                ["--drift"]: `${c.drift}px`,
                ["--rot"]: `${c.rotate}deg`,
              }}
            />
          ))}

          <div className="vd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vd-modal-heart">💕</div>
            <h2 className="vd-modal-title">{t.successTitle}</h2>
            <p className="vd-modal-msg">{t.successMsg}</p>
            <p className="vd-modal-sub">{t.successSub}</p>
            <button className="vd-modal-close" onClick={resetAll}>
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
