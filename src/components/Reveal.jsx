import { useReveal } from "../hooks.js";

/** Wrapper that fades/slides its content in the first time it enters the viewport. */
export default function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const [ref, inView] = useReveal();
  return (
    <Tag ref={ref} className={`${className} reveal${inView ? " in" : ""}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
