import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal.jsx";
import { useReveal } from "../hooks.js";
import { projects } from "../data/projects.js";
import { createViewer } from "../three/viewer.js";

export default function Work() {
  // `key` bumps on every click so re-clicking a card reloads its visual (as before)
  const [selection, setSelection] = useState({ index: 0, key: 0 });
  const select = (index) => setSelection((s) => ({ index, key: s.key + 1 }));

  return (
    <section id="work" className="section wide">
      <Reveal className="section-head">
        <p className="chapter mono">03 — Accretion Disk</p>
        <h2>Selected projects</h2>
        <p className="muted">Click a project to load its 3D visual. Drag to orbit, scroll to zoom.</p>
      </Reveal>

      <div className="work-layout">
        <ProjectViewer selection={selection} onFileDropped={() => select(-1)} />
        <div className="projects">
          {projects.map((p, i) => (
            <ProjectCard key={p.title} project={p} active={selection.index === i} onClick={() => select(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectCard({ project: p, active, onClick }) {
  const [ref, inView] = useReveal();
  const bg = `radial-gradient(circle at 50% 50%, hsl(${p.hue} 90% 70% / .9) 0%, hsl(${p.hue} 80% 35% / .6) 22%, #000 60%)`;
  return (
    <button
      ref={ref}
      className={`card reveal${inView ? " in" : ""}${active ? " active" : ""}`}
      style={{ "--thumb": bg }}
      onClick={onClick}
    >
      <div className="thumb"><div className="ring" /></div>
      <div>
        <div className="meta mono">{p.category} · {p.year}</div>
        <h3>{p.title}</h3>
        <p>{p.description}</p>
        <div className="tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
      </div>
    </button>
  );
}

function ProjectViewer({ selection, onFileDropped }) {
  const [ref, inView] = useReveal();
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const [title, setTitle] = useState("Loading…");
  const [stats, setStats] = useState("");
  const [link, setLink] = useState(null);
  const [wire, setWire] = useState(false);
  const [spin, setSpin] = useState(true);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const engine = createViewer({ canvas: canvasRef.current, wrap: ref.current, onTitle: setTitle, onStats: setStats });
    engineRef.current = engine;
    return () => { engine?.dispose(); engineRef.current = null; };
  }, [ref]);

  useEffect(() => { engineRef.current?.setWireframe(wire); }, [wire]);
  useEffect(() => { engineRef.current?.setAutoRotate(spin); }, [spin]);

  useEffect(() => {
    if (selection.index < 0) return;
    const p = projects[selection.index];
    engineRef.current?.showProject(p);
    setLink(p.link || null);
    setSpin(true);
  }, [selection]);

  const onDrag = (e) => { e.preventDefault(); setDragging(true); };
  const onLeave = (e) => { e.preventDefault(); setDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!/\.(glb|gltf)$/i.test(file.name)) { setTitle("Only .glb / .gltf files"); return; }
    onFileDropped();
    setLink(null);
    engineRef.current?.loadFile(file);
  };

  return (
    <div
      ref={ref}
      className={`viewer reveal${inView ? " in" : ""}${dragging ? " dragging" : ""}`}
      onDragEnter={onDrag}
      onDragOver={onDrag}
      onDragLeave={onLeave}
      onDrop={onDrop}
    >
      <canvas id="viewer-canvas" ref={canvasRef} />
      <div className="viewer-hud mono">
        <span>{title}</span>
        <div className="viewer-actions">
          <button title="Toggle wireframe" className={wire ? "on" : undefined} onClick={() => setWire((w) => !w)}>Wire</button>
          <button title="Toggle auto-rotate" className={spin ? "on" : undefined} onClick={() => setSpin((s) => !s)}>Spin</button>
          <button title="Reset camera" onClick={() => engineRef.current?.reset()}>Reset</button>
        </div>
      </div>
      <div className="drop-hint mono">Drop .glb here</div>
      <a className="viewer-link mono" href={link || "#"} target="_blank" rel="noopener" hidden={!link}>View code ↗</a>
      <div className="viewer-stats mono">{stats}</div>
    </div>
  );
}
