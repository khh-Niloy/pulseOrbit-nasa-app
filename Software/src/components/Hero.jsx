import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/* ─── Vertical grid lines ─── */
const LINES = [6, 13.5, 21, 28.5, 50, 71.5, 79, 86.5, 94];

export default function Hero() {
  const heroRef = useRef(null);
  const headlineRef = useRef(null);
  const subHeadRef = useRef(null);
  const astronautWrapRef = useRef(null);
  const astronautRef = useRef(null);
  const glowRef = useRef(null);
  const rightHeadRef = useRef(null);
  const leftBottomRef = useRef(null);
  const rightBottomRef = useRef(null);
  const discoverRef = useRef(null);
  const navRef = useRef(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);

  // Live Counters — realistic monitor style
  const [displayBpm, setDisplayBpm] = useState(78);
  const bpmRef = useRef({ val: 78 });

  const [displayO2, setDisplayO2] = useState(99);
  const o2Ref = useRef({ val: 99 });

  const [displaySteps, setDisplaySteps] = useState(8423);
  const stepsRef = useRef({ val: 8423 });

  useEffect(() => {
    const tick = () => {
      // BPM
      const currentBpm = Math.round(bpmRef.current.val);
      const nextBpm = Math.min(84, Math.max(72, currentBpm + Math.floor(Math.random() * 4) - 1));
      
      gsap.to(bpmRef.current, {
        val: nextBpm,
        duration: 0.3,
        ease: "power1.inOut",
        onUpdate: () => setDisplayBpm(Math.round(bpmRef.current.val)),
      });

      // O2
      if (Math.random() > 0.6) {
        const currentO2 = Math.round(o2Ref.current.val);
        const nextO2 = Math.min(100, Math.max(96, currentO2 + (Math.random() > 0.5 ? 1 : -1)));
        gsap.to(o2Ref.current, {
          val: nextO2,
          duration: 0.3,
          ease: "power1.inOut",
          onUpdate: () => setDisplayO2(Math.round(o2Ref.current.val)),
        });
      }

      // Steps
      if (Math.random() > 0.85) { // Slower update frequency
        const currentSteps = Math.round(stepsRef.current.val);
        const nextSteps = currentSteps + Math.floor(Math.random() * 2) + 1; // Increase by 1 or 2 occasionally
        gsap.to(stepsRef.current, {
          val: nextSteps,
          duration: 0.3,
          ease: "power1.inOut",
          onUpdate: () => setDisplaySteps(Math.round(stepsRef.current.val)),
        });
      }
    };
    // Update every ~1 second like a real monitor
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Nav fade in
      gsap.fromTo(
        navRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      );

      // Headline lines stagger up
      const lines = headlineRef.current?.querySelectorAll(".headline-line");
      if (lines) {
        gsap.fromTo(
          lines,
          { opacity: 0, y: 40, skewY: 2 },
          {
            opacity: 1,
            y: 0,
            skewY: 0,
            duration: 1,
            stagger: 0.12,
            ease: "power3.out",
            delay: 0.2,
          },
        );
      }

      // Sub paragraph
      gsap.fromTo(
        subHeadRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power2.out", delay: 0.65 },
      );

      // Astronaut fade up
      gsap.fromTo(
        astronautWrapRef.current,
        { opacity: 0, scale: 0.97, y: 30 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1.4,
          ease: "power3.out",
          delay: 0.1,
        },
      );

      // Right heading
      gsap.fromTo(
        rightHeadRef.current?.querySelectorAll(".fade-in-item") || [],
        { opacity: 0, x: 30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.5,
        },
      );

      // Left bottom
      gsap.fromTo(
        leftBottomRef.current?.querySelectorAll(".fade-in-item") || [],
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.7,
        },
      );

      // Right bottom
      gsap.fromTo(
        rightBottomRef.current?.querySelectorAll(".fade-in-item") || [],
        { opacity: 0, x: 20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.8,
        },
      );

      // Discover circle
      gsap.fromTo(
        discoverRef.current,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: "back.out(1.4)",
          delay: 1.1,
        },
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // Mouse parallax on astronaut
  useEffect(() => {
    const hero = heroRef.current;
    let rafId;

    const onMouseMove = (e) => {
      const rect = hero.getBoundingClientRect();
      mouseX.current = (e.clientX - rect.left) / rect.width - 0.5;
      mouseY.current = (e.clientY - rect.top) / rect.height - 0.5;
    };

    const animate = () => {
      if (astronautRef.current) {
        const tx = mouseX.current * 18;
        const ty = mouseY.current * 10;
        gsap.to(astronautRef.current, {
          x: tx,
          y: ty,
          duration: 1.2,
          ease: "power1.out",
          overwrite: "auto",
        });
      }
      if (glowRef.current) {
        const tx = mouseX.current * 22;
        const ty = mouseY.current * 12;
        gsap.to(glowRef.current, {
          x: tx,
          y: ty,
          duration: 1.6,
          ease: "power1.out",
          overwrite: "auto",
        });
      }
      rafId = requestAnimationFrame(animate);
    };

    hero?.addEventListener("mousemove", onMouseMove);
    rafId = requestAnimationFrame(animate);

    return () => {
      hero?.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      id="hero"
      style={{
        background: "#000",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Vertical grid lines ── */}
      {LINES.map((pct, i) => (
        <div key={i} className="vert-line" style={{ left: `${pct}%` }} />
      ))}

      {/* ── Earth background — full page, behind astronaut ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          backgroundImage: "url(/19604.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 55%",
          backgroundRepeat: "no-repeat",
          opacity: 0.32,
          filter: "blur(0.5px) saturate(1.3) brightness(0.9)",
          /* Radial mask — bright at center, fades to pure black at edges */
          WebkitMaskImage: `radial-gradient(
            ellipse 90% 85% at 50% 52%,
            black 0%,
            rgba(0,0,0,0.85) 45%,
            rgba(0,0,0,0.3) 75%,
            transparent 100%
          )`,
          maskImage: `radial-gradient(
            ellipse 90% 85% at 50% 52%,
            black 0%,
            rgba(0,0,0,0.85) 45%,
            rgba(0,0,0,0.3) 75%,
            transparent 100%
          )`,
        }}
      />

      {/* ── Top Navigation Bar ── */}
      <header
        ref={navRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(20px, 2.5vw, 36px) clamp(40px, 8vw, 120px)",
        }}
      >
        {/* Logo only */}
        <div
          style={{
            fontFamily: "'Inter Tight', sans-serif",
            fontWeight: 600,
            fontSize: "clamp(13px, 1vw, 16px)",
            letterSpacing: "0.18em",
            color: "#fff",
          }}
        >
          PULSEORBIT
        </div>
      </header>

      {/* ── Hero Astronaut Image (center) ── */}
      <div
        ref={astronautWrapRef}
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "clamp(700px, 90vw, 1400px)",
          height: "100vh",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* Rim glow (blurred duplicate behind) */}
        <div
          ref={glowRef}
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "url(/Gemini_Generated_Image_7oco0a7oco0a7oco-Photoroom.png)",
            backgroundSize: "contain",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
            filter: "blur(28px) brightness(0.6)",
            opacity: 0.22,
            transform: "scale(0.98)",
          }}
        />

        {/* Main image — transparent PNG, no mask needed */}
        <div
          ref={astronautRef}
          className="astronaut-float"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "url(/Gemini_Generated_Image_7oco0a7oco0a7oco-Photoroom.png)",
            backgroundSize: "contain",
            backgroundPosition: "center top",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>

      {/* ── Content Grid ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateRows: "1fr 1fr",
          gridTemplateColumns: "42% 58%",
          padding:
            "clamp(90px, 9vw, 140px) clamp(40px, 8vw, 120px) clamp(32px, 4vw, 60px)",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        {/* ── Top Left: Main Headline ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            gap: "clamp(12px, 1.2vw, 20px)",
          }}
        >
          <h1
            ref={headlineRef}
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(48px, 5.6vw, 92px)",
              lineHeight: 0.87,
              letterSpacing: "-0.04em",
              color: "#fff",
              overflow: "hidden",
            }}
          >
            <span className="headline-line" style={{ display: "block" }}>
              Own your
            </span>
            <span
              className="headline-line gradient-text"
              style={{ display: "block" }}
            >
              health
            </span>
            <span className="headline-line" style={{ display: "block" }}>
              in orbit.
            </span>
          </h1>

          <p
            ref={subHeadRef}
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: "clamp(11px, 0.87vw, 14px)",
              fontWeight: 400,
              lineHeight: 1.6,
              color: "rgba(91,107,140,0.9)",
              maxWidth: "clamp(200px, 20vw, 300px)",
              letterSpacing: "0.01em",
            }}
          >
            Radiation. Isolation. Zero gravity.
            <br />
            Your body feels it all — now you can read it too.
          </p>
        </div>

        {/* ── Top Right: Secondary headline ── */}
        <div
          ref={rightHeadRef}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-end",
            gap: "clamp(10px, 1vw, 18px)",
            paddingTop: "clamp(4px, 0.4vw, 8px)",
            paddingLeft: "clamp(80px, 12vw, 200px)",
          }}
        >
          <h2
            className="fade-in-item"
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(20px, 2.6vw, 42px)",
              lineHeight: 0.92,
              letterSpacing: "-0.04em",
              color: "#fff",
              textAlign: "right",
              maxWidth: "clamp(140px, 16vw, 260px)",
            }}
          >
            Your Body,
            <br />
            Decoded
          </h2>

          <p
            className="fade-in-item"
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: "clamp(8px, 0.7vw, 11px)",
              fontWeight: 400,
              letterSpacing: "0.12em",
              lineHeight: 1.7,
              textAlign: "right",
              textTransform: "uppercase",
              maxWidth: "clamp(130px, 14vw, 220px)",
            }}
          >
            <span style={{ color: "#fff" }}>Gather the signs. </span>
            <span style={{ color: "#5B6B8C" }}>
              Understand the change. Act in time.
            </span>
          </p>
        </div>

        {/* ── Bottom Left: Expand Your Horizons ── */}
        <div
          ref={leftBottomRef}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            gap: "clamp(8px, 0.8vw, 14px)",
            alignSelf: "end",
          }}
        >
          <h3
            className="fade-in-item"
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontWeight: 500,
              fontSize: "clamp(16px, 1.5vw, 24px)",
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            Catch It Early
          </h3>
          <p
            className="fade-in-item"
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: "clamp(9px, 0.75vw, 12px)",
              fontWeight: 400,
              letterSpacing: "0.12em",
              lineHeight: 1.7,
              textTransform: "uppercase",
              maxWidth: "clamp(160px, 18vw, 280px)",
            }}
          >
            <span style={{ color: "#fff" }}>
              Every stress of deep space leaves a trace.{" "}
            </span>
            <span style={{ color: "#5B6B8C" }}>
              We turn those traces into signals you can act on.
            </span>
          </p>
        </div>

        {/* ── Bottom Right: Date ── */}
        <div
          ref={rightBottomRef}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            gap: "clamp(4px, 0.5vw, 8px)",
            alignSelf: "end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-end" }}>
            {/* BPM */}
            <div
              className="fade-in-item"
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 300,
                fontSize: "clamp(36px, 4vw, 56px)",
                letterSpacing: "-0.05em",
                lineHeight: 0.85,
                color: "#fff",
                display: "flex",
                alignItems: "baseline",
                gap: "0.25em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <svg style={{ width: "0.45em", height: "0.45em", color: "#F06071", opacity: 0.9 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {displayBpm}
              <span style={{ fontSize: "0.4em", fontWeight: 500, letterSpacing: "0.06em", color: "#A9B8E0", marginBottom: "0.1em" }}>
                BPM
              </span>
            </div>

            {/* O2 */}
            <div
              className="fade-in-item"
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 300,
                fontSize: "clamp(36px, 4vw, 56px)",
                letterSpacing: "-0.05em",
                lineHeight: 0.85,
                color: "#fff",
                display: "flex",
                alignItems: "baseline",
                gap: "0.25em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <svg style={{ width: "0.45em", height: "0.45em", color: "#4DA6FF", opacity: 0.9 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
              </svg>
              {displayO2}
              <span style={{ fontSize: "0.4em", fontWeight: 500, letterSpacing: "0.06em", color: "#A9B8E0", marginBottom: "0.1em" }}>
                % O₂
              </span>
            </div>

            {/* Steps */}
            <div
              className="fade-in-item"
              style={{
                fontFamily: "'Inter Tight', sans-serif",
                fontWeight: 300,
                fontSize: "clamp(36px, 4vw, 56px)",
                letterSpacing: "-0.05em",
                lineHeight: 0.85,
                color: "#fff",
                display: "flex",
                alignItems: "baseline",
                gap: "0.25em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <svg style={{ width: "0.45em", height: "0.45em", color: "#4ADE80", opacity: 0.9 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" />
                <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" />
                <path d="M16 17h4" />
                <path d="M4 13h4" />
              </svg>
              {displaySteps.toLocaleString()}
              <span style={{ fontSize: "0.4em", fontWeight: 500, letterSpacing: "0.06em", color: "#A9B8E0", marginBottom: "0.1em" }}>
                STEPS
              </span>
            </div>
          </div>
          <div
            className="fade-in-item"
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(9px, 0.72vw, 12px)",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {/* Pulsing live dot */}
            <span className="live-dot" />
            All systems steady · Simulated data
          </div>
        </div>
      </div>

      {/* ── Bottom Center: Discover button ── */}
      <div
        ref={discoverRef}
        style={{
          position: "absolute",
          bottom: "clamp(24px, 3.5vw, 50px)",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 30,
          pointerEvents: "all",
        }}
      >
        <button
          className="pulse-btn"
          style={{
            width: "clamp(110px, 9.2vw, 150px)",
            height: "clamp(110px, 9.2vw, 150px)",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.35)",
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            transition: "background 0.3s, border-color 0.3s",
          }}
          onClick={() => {
            document
              .getElementById("watch-section")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
          }}
        >
          <span
            style={{
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: "clamp(10px, 0.8vw, 13px)",
              fontWeight: 400,
              letterSpacing: "0.08em",
            }}
          >
            Feel the Pulse
          </span>
          <span style={{ fontSize: "clamp(14px, 1.1vw, 18px)", lineHeight: 1 }}>
            ↓
          </span>
        </button>
      </div>
    </section>
  );
}
