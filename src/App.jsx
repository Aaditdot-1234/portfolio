import { useCallback, useEffect, useState } from "react";
import Space from "./components/Space.jsx";
import Header from "./components/Header.jsx";
import Work from "./components/Work.jsx";
import { Hero, About, Experience, Skills, Contact } from "./components/Sections.jsx";

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const onReady = useCallback(() => setTimeout(() => setLoaded(true), 400), []);

  // The browser tries to jump to #hash before React has rendered the sections,
  // so do it ourselves once they exist (keeps links like /#contact working).
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
  }, []);

  return (
    <>
      <div id="loader" className={loaded ? "done" : undefined}>
        <div className="loader-ring" />
        <p className="mono">Computing geodesics<span className="dots" /></p>
      </div>

      <Space onReady={onReady} />
      <Header />

      <main>
        <Hero />
        <About />
        <Experience />
        <Work />
        <Skills />
        <Contact />
      </main>
    </>
  );
}
