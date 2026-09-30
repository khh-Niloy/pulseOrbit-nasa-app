import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// --- Live Ticking Data Components ---
const LiveBpm = () => {
  const [bpm, setBpm] = useState(78);
  useEffect(() => {
    const id = setInterval(() => {
      setBpm((prev) => Math.min(85, Math.max(71, prev + Math.floor(Math.random() * 5) - 2)));
    }, 1100);
    return () => clearInterval(id);
  }, []);
  return <>{bpm}</>;
};

const LiveO2 = () => {
  const [o2, setO2] = useState(99);
  useEffect(() => {
    const id = setInterval(() => {
      setO2((prev) => (Math.random() > 0.7 ? (prev === 99 ? 100 : 99) : prev));
    }, 2000);
    return () => clearInterval(id);
  }, []);
  return <>{o2}</>;
};

const LiveSteps = () => {
  const [steps, setSteps] = useState(8423);
  useEffect(() => {
    const id = setInterval(() => {
      setSteps((prev) => prev + Math.floor(Math.random() * 3));
    }, 1500);
    return () => clearInterval(id);
  }, []);
  return <>{steps.toLocaleString()}</>;
};

// --- Main Section ---
export default function WatchSection() {
  const sectionRef = useRef(null);
  const pinnedRef = useRef(null);
  const imgRef = useRef(null);
  
  // Background Refs
  const bgIntroRef = useRef(null);
  const bgBpmRef = useRef(null);
  const bgO2Ref = useRef(null);
  const bgStepsRef = useRef(null);
  
  const textOverlayRef = useRef(null);
  const featuresRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(imgRef.current, { xPercent: -50, yPercent: -50, scale: 1, x: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=500%",
          pin: pinnedRef.current,
          scrub: 1.5, // Premium smooth interpolation
          anticipatePin: 1,
        },
      });

      // Intro text out
      tl.to(textOverlayRef.current, { opacity: 0, y: -20, duration: 0.1 }, 0);

      // --- Feature 1: BPM ---
      tl.to(
        imgRef.current,
        { x: "-22vw", scale: 1.2, duration: 0.3, ease: "power2.inOut" },
        0.05
      );
      // BG Transitions
      tl.to(bgIntroRef.current, { opacity: 0, duration: 0.3 }, 0.05);
      tl.to(bgBpmRef.current, { opacity: 1, duration: 0.3 }, 0.05);

      tl.fromTo(
        featuresRef.current[0],
        { opacity: 0, x: 40, y: 10 },
        { opacity: 1, x: 0, y: 0, duration: 0.25, ease: "power2.out" },
        0.15
      );
      tl.to(featuresRef.current[0], { opacity: 0, y: -30, duration: 0.15, ease: "power2.in" }, 0.4);

      // --- Feature 2: O2 ---
      tl.to(
        imgRef.current,
        { x: "22vw", scale: 1.2, duration: 0.3, ease: "power2.inOut" },
        0.4
      );
      // BG Transitions
      tl.to(bgBpmRef.current, { opacity: 0, duration: 0.3 }, 0.4);
      tl.to(bgO2Ref.current, { opacity: 1, duration: 0.3 }, 0.4);

      tl.fromTo(
        featuresRef.current[1],
        { opacity: 0, x: -40, y: 10 },
        { opacity: 1, x: 0, y: 0, duration: 0.25, ease: "power2.out" },
        0.5
      );
      tl.to(featuresRef.current[1], { opacity: 0, y: -30, duration: 0.15, ease: "power2.in" }, 0.75);

      // --- Feature 3: Steps ---
      tl.to(
        imgRef.current,
        { x: "-22vw", scale: 1.2, duration: 0.3, ease: "power2.inOut" },
        0.75
      );
      // BG Transitions
      tl.to(bgO2Ref.current, { opacity: 0, duration: 0.3 }, 0.75);
      tl.to(bgStepsRef.current, { opacity: 1, duration: 0.3 }, 0.75);

      tl.fromTo(
        featuresRef.current[2],
        { opacity: 0, x: 40, y: 10 },
        { opacity: 1, x: 0, y: 0, duration: 0.25, ease: "power2.out" },
        0.85
      );

      // Fade out slightly at the very end
      tl.to(featuresRef.current[2], { opacity: 0, duration: 0.1 }, 1.15);
      tl.to(bgStepsRef.current, { opacity: 0, duration: 0.2 }, 1.15);
      tl.to(imgRef.current, { scale: 1, x: 0, duration: 0.2, ease: "power2.inOut" }, 1.15);

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} id="watch-section" style={{ position: "relative", height: "600vh", background: "#000" }}>
      <style>{`
        .feature-block {
          position: absolute;
          top: 32%; /* Fixed top position so all blocks align perfectly horizontally without jumping up/down based on their individual heights */
          width: clamp(340px, 40vw, 550px);
          display: flex;
          flex-direction: column;
          opacity: 0;
        }
        .feature-right { left: 55%; align-items: flex-start; text-align: left; }
        .feature-left { right: 55%; align-items: flex-end; text-align: right; }
        
        .f-subtitle {
          font-family: 'Inter Tight', sans-serif;
          font-size: clamp(10px, 0.85vw, 13px);
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(169, 184, 224, 0.8);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .f-data-row {
          display: flex;
          align-items: baseline;
          gap: 16px;
          font-family: 'Inter Tight', sans-serif;
          font-variant-numeric: tabular-nums;
          margin-bottom: 16px;
          width: 100%;
        }
        
        .f-value {
          font-size: clamp(70px, 8vw, 120px);
          font-weight: 200;
          letter-spacing: -0.06em;
          line-height: 0.8;
          color: #fff;
        }

        .f-val-bpm { background: linear-gradient(180deg, #FFFFFF 0%, rgba(240,96,113,0.8) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .f-val-o2 { background: linear-gradient(180deg, #FFFFFF 0%, rgba(77,166,255,0.8) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .f-val-steps { background: linear-gradient(180deg, #FFFFFF 0%, rgba(74,222,128,0.8) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .f-unit {
          font-size: clamp(16px, 1.5vw, 24px);
          font-weight: 400;
          letter-spacing: 0.05em;
        }
        
        .f-desc {
          font-family: 'Inter Tight', sans-serif;
          font-size: clamp(14px, 1.2vw, 17px);
          font-weight: 300;
          letter-spacing: 0.02em;
          line-height: 1.6;
          color: rgba(255,255,255,0.65);
          max-width: 85%;
        }

        @keyframes draw-ekg {
          0% { stroke-dashoffset: 400; }
          100% { stroke-dashoffset: 0; }
        }
        .ekg-line {
          stroke-dasharray: 400;
          animation: draw-ekg 3s linear infinite;
        }
        
        @keyframes breath-wave {
          0%, 100% { transform: scaleY(1); opacity: 0.4; }
          50% { transform: scaleY(1.4); opacity: 1; filter: drop-shadow(0 0 8px rgba(77,166,255,0.5)); }
        }
        .wave-bar {
          transform-origin: center bottom;
          animation: breath-wave 4s ease-in-out infinite;
        }

        @keyframes progress-spin {
          0% { stroke-dashoffset: 283; }
          100% { stroke-dashoffset: 60; }
        }
        .progress-ring {
          stroke-dasharray: 283;
          animation: progress-spin 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          filter: drop-shadow(0 0 12px rgba(74, 222, 128, 0.4));
        }

        @keyframes pulse-dot {
          0% { transform: scale(0.95); opacity: 0.8; }
          70% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 6px rgba(255,255,255, 0); }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .hud-dot {
          width: 6px; height: 6px; border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }

        /* Ambient background movements */
        @keyframes bg-drift {
          0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          50% { transform: translate(-50%, -50%) rotate(5deg) scale(1.05); }
          100% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
        }
        @keyframes pulse-ring-bg {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
        }
        @keyframes organic-float {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes step-lines {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
      `}</style>

      <div ref={pinnedRef} style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        
        {/* Premium Tech Grid Background (Global base layer) */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.4,
          pointerEvents: "none", zIndex: 1,
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)"
        }} />

        {/* --- Background Layers --- */}
        
        {/* Intro Ambient Glow */}
        <div ref={bgIntroRef} style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: "120vw", height: "120vw", filter: "blur(70px)",
          background: "radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 60%)",
          mixBlendMode: "screen", animation: "bg-drift 20s ease-in-out infinite",
          pointerEvents: "none", zIndex: 2
        }} />

        {/* Feature 1: BPM Background */}
        <div ref={bgBpmRef} style={{ position: "absolute", inset: 0, opacity: 0, zIndex: 2, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: "140vw", height: "140vw", filter: "blur(90px)",
            background: "radial-gradient(circle, rgba(240,96,113,0.12) 0%, transparent 50%)",
            mixBlendMode: "screen", animation: "bg-drift 25s ease-in-out infinite"
          }} />
          {/* Radar/Pulse concentric circles */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", width: "50vw", height: "50vw",
            border: "1px solid rgba(240,96,113,0.15)", borderRadius: "50%",
            animation: "pulse-ring-bg 8s ease-in-out infinite"
          }} />
          <div style={{
            position: "absolute", top: "50%", left: "50%", width: "80vw", height: "80vw",
            border: "1px solid rgba(240,96,113,0.05)", borderRadius: "50%",
            animation: "pulse-ring-bg 12s ease-in-out infinite reverse"
          }} />
        </div>

        {/* Feature 2: O2 Background */}
        <div ref={bgO2Ref} style={{ position: "absolute", inset: 0, opacity: 0, zIndex: 2, pointerEvents: "none", overflow: "hidden" }}>
          {/* Deep fluid mesh base */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: "160vw", height: "100vw", filter: "blur(100px)",
            background: "radial-gradient(ellipse, rgba(77,166,255,0.15) 0%, transparent 60%)",
            mixBlendMode: "screen", animation: "organic-float 40s linear infinite"
          }} />
          {/* Secondary fluid orb */}
          <div style={{
            position: "absolute", top: "30%", left: "70%", transform: "translate(-50%, -50%)",
            width: "80vw", height: "80vw", filter: "blur(80px)",
            background: "radial-gradient(circle, rgba(77,166,255,0.1) 0%, transparent 70%)",
            mixBlendMode: "screen", animation: "bg-drift 15s ease-in-out infinite reverse"
          }} />
        </div>

        {/* Feature 3: Steps Background */}
        <div ref={bgStepsRef} style={{ position: "absolute", inset: 0, opacity: 0, zIndex: 2, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: "130vw", height: "130vw", filter: "blur(80px)",
            background: "radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 55%)",
            mixBlendMode: "screen", animation: "bg-drift 20s ease-in-out infinite"
          }} />
          {/* Energizing diagonal motion lines */}
          <div style={{
            position: "absolute", inset: "-20%", 
            backgroundImage: "repeating-linear-gradient(45deg, rgba(74,222,128,0.02) 0px, rgba(74,222,128,0.02) 1px, transparent 1px, transparent 40px)",
            animation: "step-lines 3s linear infinite"
          }} />
        </div>

        {/* --- End Background Layers --- */}


        {/* Hero image that smoothly shifts */}
        <div ref={imgRef} style={{
          position: "absolute", top: "50%", left: "50%", width: "clamp(450px, 55vw, 850px)", height: "80vh",
          backgroundImage: "url(/product.png)", backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat",
          willChange: "transform", zIndex: 10
        }} />

        {/* Intro text overlay */}
        <div ref={textOverlayRef} style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 20, pointerEvents: "none", paddingBottom: "10vh"
        }}>
          <p style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: "11px", fontWeight: 500, letterSpacing: "0.25em", color: "#5B6B8C", textTransform: "uppercase", marginBottom: "20px" }}>
            PULSEORBIT SENSOR SUITE
          </p>
          <h2 style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 300, fontSize: "clamp(36px, 4.5vw, 64px)", letterSpacing: "-0.04em", lineHeight: 0.9, color: "#fff", textAlign: "center", maxWidth: "800px" }}>
            The definitive truth.<br />
            <span className="gradient-text">Of your own biology.</span>
          </h2>
        </div>

        {/* --- Feature 1: BPM (Right) --- */}
        <div ref={(el) => (featuresRef.current[0] = el)} className="feature-block feature-right" style={{ zIndex: 30 }}>
          <div className="f-subtitle"><div className="hud-dot" style={{ background: "#F06071", boxShadow: "0 0 8px #F06071" }} /> CONTINUOUS ECG</div>
          <div className="f-data-row">
            <div className="f-value f-val-bpm"><LiveBpm /></div>
            <div className="f-unit" style={{ color: "#F06071" }}>BPM</div>
          </div>
          <svg width="240" height="60" viewBox="0 0 240 60" fill="none" stroke="#F06071" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 16, filter: "drop-shadow(0 0 6px rgba(240,96,113,0.4))" }}>
            <path className="ekg-line" d="M0 30h40l10-20 15 40 15-30 10 10h150" />
            <circle cx="4" cy="30" r="4" fill="#F06071" />
          </svg>
          <p className="f-desc">Medical grade optical sensors capture every micro fluctuation in your pulse. High fidelity tracking engineered for zero gravity environments.</p>
        </div>

        {/* --- Feature 2: Oxygen (Left) --- */}
        <div ref={(el) => (featuresRef.current[1] = el)} className="feature-block feature-left" style={{ zIndex: 30 }}>
          <div className="f-subtitle" style={{ justifyContent: "flex-end" }}>ATMOSPHERE ADAPTATION <div className="hud-dot" style={{ background: "#4DA6FF", boxShadow: "0 0 8px #4DA6FF" }} /></div>
          <div className="f-data-row" style={{ flexDirection: "row-reverse" }}>
            <div className="f-value f-val-o2"><LiveO2 /></div>
            <div className="f-unit" style={{ color: "#4DA6FF" }}>% SpO₂</div>
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "16px", height: "40px", alignItems: "flex-end" }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="wave-bar" style={{
                width: "6px", height: `${15 + Math.sin(i * 0.5) * 15}px`, background: "#4DA6FF", borderRadius: "3px",
                animationDelay: `${i * 0.15}s`
              }} />
            ))}
          </div>
          <p className="f-desc">Infrared spectroscopy continuously monitors your blood oxygenation alerting you to atmospheric changes before you feel them.</p>
        </div>

        {/* --- Feature 3: Steps (Right) --- */}
        <div ref={(el) => (featuresRef.current[2] = el)} className="feature-block feature-right" style={{ zIndex: 30 }}>
          <div className="f-subtitle"><div className="hud-dot" style={{ background: "#4ADE80", boxShadow: "0 0 8px #4ADE80" }} /> MISSION PROGRESS</div>
          <div className="f-data-row">
            <div className="f-value f-val-steps"><LiveSteps /></div>
            <div className="f-unit" style={{ color: "#4ADE80" }}>STEPS</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
            <svg width="60" height="60" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(74, 222, 128, 0.15)" strokeWidth="8" />
              <circle className="progress-ring" cx="50" cy="50" r="45" fill="none" stroke="#4ADE80" strokeWidth="8" strokeLinecap="round" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: "14px", color: "#fff", fontWeight: 500, letterSpacing: "0.05em" }}>80% TO DAILY GOAL</span>
              <span style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Active terrain mapping</span>
            </div>
          </div>
          <p className="f-desc">A 6 axis gyroscope and advanced accelerometers map your exact physical expenditure ensuring peak performance across any terrain.</p>
        </div>

      </div>
    </div>
  );
}
