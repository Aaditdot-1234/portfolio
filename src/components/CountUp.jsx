import { useEffect, useState } from "react";

export default function CountUp({ to, decimals = 0, suffix = "", run, duration = 1600 }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;
    let raf;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, to, duration]);

  return (
    <span className="num">
      {value.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {run && suffix && <em>{suffix}</em>}
    </span>
  );
}
