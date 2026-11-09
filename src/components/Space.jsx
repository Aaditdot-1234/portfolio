import { useEffect, useRef } from "react";
import { createBlackHole } from "../three/blackHole.js";

/** Fixed full-screen black hole + the HUD read-outs its render loop drives. */
export default function Space({ onReady }) {
  const canvasRef = useRef(null);
  const sideRef = useRef(null);
  const rRef = useRef(null);
  const dilationRef = useRef(null);
  const localRef = useRef(null);
  const earthRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    return createBlackHole({
      canvas: canvasRef.current,
      hud: {
        side: sideRef.current,
        r: rRef.current,
        dilation: dilationRef.current,
        local: localRef.current,
        earth: earthRef.current,
        progress: progressRef.current,
      },
      onReady,
    });
  }, [onReady]);

  return (
    <>
      <canvas id="space" ref={canvasRef} />
      <div className="vignette" />
      <div className="grain" />

      <aside className="hud-side mono" aria-hidden="true" ref={sideRef}>
        <div><span className="label">R</span><span ref={rRef}>—</span><span className="unit">r<sub>s</sub></span></div>
        <div><span className="label">γ</span><span ref={dilationRef}>—</span><span className="unit">dilation</span></div>
        <div><span className="label">T<sub>local</sub></span><span ref={localRef}>00:00:00</span></div>
        <div><span className="label">T<sub>earth</sub></span><span ref={earthRef}>00:00:00</span></div>
      </aside>

      <div className="progress" aria-hidden="true"><div id="progress-bar" ref={progressRef} /></div>
    </>
  );
}
