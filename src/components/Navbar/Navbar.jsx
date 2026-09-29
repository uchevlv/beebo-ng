import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const header = useRef(null);
  const toggle = useRef(null);
  useEffect(() => {
    if (!open) return;
    function dismiss(event) {
      if (event.type === "keydown" && event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
      if (
        event.type === "pointerdown" &&
        !header.current?.contains(event.target)
      )
        setOpen(false);
    }
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", dismiss);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [open]);
  return (
    <header
      className="navbar"
      ref={header}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <Link className="logo" to="/" onClick={() => setOpen(false)}>
        beebo ng
      </Link>
      <button
        className="menu-toggle"
        ref={toggle}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="explore-menu"
        onClick={() => setOpen(!open)}
      >
        <span>{open ? "Close" : "Menu"}</span>
        <span
          className={"menu-mark" + (open ? " is-open" : "")}
          aria-hidden="true"
        >
          <i />
          <i />
        </span>
      </button>
      {open && (
        <nav
          id="explore-menu"
          className="explore-menu"
          aria-label="Main navigation"
        >
          <Link to="/#collections" onClick={() => setOpen(false)}>
            Explore <span aria-hidden="true">↗</span>
          </Link>
        </nav>
      )}
    </header>
  );
}
