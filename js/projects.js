// ============================================================
//  EDIT THIS FILE to update projects, skills and certifications.
//
//  link        : URL for the "View code" button (repo, demo, etc.)
//  placeholder : which procedural 3D visual the viewer shows
//                (neural | voice | network | planet)
//  model       : optional path to a .glb that replaces the visual
// ============================================================

const GITHUB = "https://github.com/Aaditdot-1234";

export const projects = [
  {
    title: "MindFirst",
    category: "AI · Mental health",
    year: 2025,
    description:
      "Mental-health screening platform combining a chatbot with psychometric tests. Used by 100+ students; 99% diagnostic precision; analysis of 28,000 survey records cut user effort by 50%.",
    tags: ["Python", "Next.js", "Flask", "Prisma", "NextAuth", "Tailwind"],
    hue: 280,
    link: GITHUB, // ← replace with the repo URL
    model: "",
    placeholder: "neural",
  },
  {
    title: "Sim Sim",
    category: "Desktop AI assistant",
    year: 2024,
    description:
      "Voice-driven desktop assistant with a conversational GUI for web search, reminders and app launches. Tasks run 70% faster than doing them by hand.",
    tags: ["Python", "PySide6", "Speech"],
    hue: 190,
    link: GITHUB,
    model: "",
    placeholder: "voice",
  },
  {
    title: "Committee Connect",
    category: "Android app",
    year: 2023,
    description:
      "Workflow app for 8+ college committees and 50+ members: real-time tasks, meetings and digital attendance. Cut scheduling conflicts by 40%.",
    tags: ["Android Studio", "XML", "JavaScript"],
    hue: 28,
    link: GITHUB,
    model: "",
    placeholder: "network",
  },
  {
    title: "Carbon Footprint Calculator",
    category: "Hackathon · Team lead",
    year: 2024,
    description:
      "Built in 2 days at the Appwrite Hackathon with a team of four. Secure per-user emissions tracking with Appwrite auth and databases; 500+ sessions.",
    tags: ["Appwrite", "JavaScript", "Web"],
    hue: 140,
    link: GITHUB,
    model: "",
    placeholder: "planet",
  },
];

export const skillGroups = [
  { name: "Languages", items: ["Python", "TypeScript", "JavaScript", "Java", "C", "C++", "R", "SQL (Postgres)", "HTML/CSS"] },
  { name: "Frameworks", items: ["Node.js", "Angular", "React", "Next.js", "Flask", "TypeORM"] },
  { name: "Data & Infra", items: ["MongoDB", "PostgreSQL", "RabbitMQ", "Git"] },
  { name: "ML & AI", items: ["TensorFlow", "Scikit-learn", "Deep Learning", "Prompt Engineering"] },
  { name: "Analysis & Viz", items: ["Pandas", "NumPy", "Matplotlib", "Seaborn", "Power BI", "Excel"] },
];

export const certifications = [
  ["AWS Academy", "Graduate: Machine Learning"],
  ["edX", "UX/UI Design Fundamentals"],
  ["edX", "Soft Skills: Collaborate Effectively"],
  ["CSI RAIT", "Java Programming"],
  ["Wayspire", "Prompt Engineering"],
  ["RAIT ACM", "AI meets Quantum Seminar"],
];

// ---------- render cards, skills, certifications ----------
const grid = document.getElementById("projects");
if (grid) {
  grid.innerHTML = projects
    .map((p, i) => {
      const bg = `radial-gradient(circle at 50% 50%, hsl(${p.hue} 90% 70% / .9) 0%, hsl(${p.hue} 80% 35% / .6) 22%, #000 60%)`;
      return `
      <button class="card reveal" data-index="${i}" style="--thumb:${bg}">
        <div class="thumb"><div class="ring"></div></div>
        <div>
          <div class="meta mono">${p.category} · ${p.year}</div>
          <h3>${p.title}</h3>
          <p>${p.description}</p>
          <div class="tags">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div>
        </div>
      </button>`;
    })
    .join("");
}

const skillsEl = document.getElementById("skills-list");
if (skillsEl) {
  skillsEl.innerHTML = skillGroups
    .map(
      (g) => `
      <div class="skill-group">
        <span class="group-name mono">${g.name}</span>
        <div class="chips">${g.items.map((s) => `<span>${s}</span>`).join("")}</div>
      </div>`
    )
    .join("");
}

const certsEl = document.getElementById("certs-list");
if (certsEl) {
  certsEl.innerHTML = certifications
    .map(([by, what]) => `<li><span class="mono">${by}</span>${what}</li>`)
    .join("");
}
