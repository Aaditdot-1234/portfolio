import Reveal from "./Reveal.jsx";
import CountUp from "./CountUp.jsx";
import { useReveal } from "../hooks.js";
import { skillGroups, certifications } from "../data/projects.js";

export function Hero() {
  return (
    <section id="hero" className="section hero">
      <p className="eyebrow mono">// SOFTWARE DEVELOPER · AI &amp; DATA SCIENCE · MUMBAI</p>
      <h1 className="title">
        <span className="line">AADIT</span>
        <span className="line outline">CHAURASIA</span>
      </h1>
      <p className="lede">
        I build scalable backends, responsive interfaces and AI systems that find signal in noisy data.
      </p>
      <a href="#about" className="scroll-cue mono">
        <span>Cross the horizon</span>
        <span className="cue-line" />
      </a>
    </section>
  );
}

export function About() {
  const [ref, inView] = useReveal();
  return (
    <section id="about" className="section left">
      <div ref={ref} className={`panel reveal${inView ? " in" : ""}`}>
        <p className="chapter mono">01 — Event Horizon</p>
        <h2>Engineer by trade, data scientist by training.</h2>
        <p>
          I'm a <strong>Junior Software Developer at a company</strong>, where I work on shipping ERP software:{" "}
          <strong>Node.js</strong> and <strong>MongoDB</strong> services, <strong>RabbitMQ</strong> messaging, REST
          APIs and an <strong>Angular</strong> frontend.
        </p>
        <p>
          I'm finishing a B.Tech in Computer Science, majoring in AI &amp; Data Science, at Ramrao Adik Institute of
          Technology. Outside work I research how chatbots and psychometrics can help detect mental-health risk earlier.
        </p>
        <p className="aside mono">Off-screen: sudoku, sports, gaming, mathematics, teaching.</p>
        <div className="stats">
          <div><CountUp to={9.5} decimals={1} run={inView} /><span className="mono">CGPA</span></div>
          <div><CountUp to={28000} suffix="+" run={inView} /><span className="mono">records analysed</span></div>
          <div><CountUp to={500} suffix="+" run={inView} /><span className="mono">hackathon sessions</span></div>
        </div>
      </div>
    </section>
  );
}

export function Experience() {
  return (
    <section id="experience" className="section right">
      <Reveal className="panel">
        <p className="chapter mono">02 — Trajectory</p>
        <h2>Experience</h2>
        <ol className="timeline">
          <li>
            <div className="when mono">Aug 2025 — Present</div>
            <h3>Junior Software Developer <span>· Development Services</span></h3>
            <p className="where mono">Shipping ERP · Juinagar · On-site · Intern → Full-time</p>
            <ul>
              <li>Build and maintain scalable backend services with Node.js and MongoDB.</li>
              <li>Introduced RabbitMQ for asynchronous inter-service messaging, improving reliability.</li>
              <li>Design and optimise RESTful APIs between frontend and backend.</li>
              <li>Build responsive, mobile-first Angular interfaces.</li>
            </ul>
          </li>
          <li>
            <div className="when mono">Aug 2024 — Present</div>
            <h3>Researcher <span>· Chatbot + Psychometrics</span></h3>
            <p className="where mono">MindFirst project</p>
            <ul>
              <li>Designed the statistical analysis that showed triage accuracy gains were real, not chance (p ≈ 0.000089).</li>
            </ul>
          </li>
          <li>
            <div className="when mono">Oct 2024</div>
            <h3>Team Lead <span>· Appwrite Hackathon</span></h3>
            <ul>
              <li>Led a team of four to ship a carbon-footprint calculator that handled 500+ sessions in 2 days.</li>
            </ul>
          </li>
          <li>
            <div className="when mono">2022 — 2026</div>
            <h3>B.Tech, Computer Science <span>· RAIT, D. Y. Patil University</span></h3>
            <p className="where mono">Major: AI &amp; Data Science · CGPA 9.5</p>
          </li>
        </ol>
      </Reveal>
    </section>
  );
}

export function Skills() {
  return (
    <section id="skills" className="section left">
      <Reveal className="panel panel-wide">
        <p className="chapter mono">04 — Stable Orbit</p>
        <h2>Toolkit</h2>
        <div className="skill-groups">
          {skillGroups.map((g) => (
            <div className="skill-group" key={g.name}>
              <span className="group-name mono">{g.name}</span>
              <div className="chips">
                {g.items.map((s) => <span key={s}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
        <h3 className="sub mono">Certifications</h3>
        <ul className="certs">
          {certifications.map(([by, what]) => (
            <li key={by + what}><span className="mono">{by}</span>{what}</li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contact" className="section contact">
      <Reveal>
        <p className="chapter mono">05 — Singularity</p>
        <h2 className="big">Let's build something<br /><span className="outline">massive.</span></h2>
        <a className="email" href="mailto:kumud2196@gmail.com">kumud2196@gmail.com</a>
        <div className="socials mono">
          <a href="https://github.com/Aaditdot-1234" target="_blank" rel="noopener">GitHub</a>
          <a href="https://www.linkedin.com/in/aadit-chaurasia" target="_blank" rel="noopener">LinkedIn</a>
          <a href="/assets/Aadit-Chaurasia-Resume.pdf" target="_blank" rel="noopener">Résumé</a>
        </div>
      </Reveal>
      <footer className="mono">© {new Date().getFullYear()} Aadit Chaurasia. Black hole ray-traced in real time.</footer>
    </section>
  );
}
