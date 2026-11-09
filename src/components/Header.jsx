import { useEffect, useState } from "react";

const NAV = [
  { id: "about", label: "01 Horizon", short: "About" },
  { id: "experience", label: "02 Trajectory", short: "Exp" },
  { id: "work", label: "03 Accretion", short: "Work" },
  { id: "skills", label: "04 Orbit", short: "Skills" },
  { id: "contact", label: "05 Singularity", short: "Contact" },
];

export default function Header() {
  const [active, setActive] = useState(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    document.querySelectorAll("main > section").forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <header className="hud-top">
      <a href="#hero" className="logo mono">AC<span>/</span>DEV</a>
      <nav>
        {NAV.map((n) => (
          <a key={n.id} href={`#${n.id}`} data-short={n.short} className={active === n.id ? "active" : undefined}>
            {n.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
