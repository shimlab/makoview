import { useState, useEffect } from "react";

function parseHash() {
  const hash = window.location.hash.slice(1); // remove '#'
  return { id: hash || null };
}

function setHash(state) {
  if (state.id === null) {
    window.location.hash = "";
    return;
  }
  window.location.hash = state.id;
}

export function useHashState(defaults) {
  const [state, setState] = useState(() => ({ ...defaults, ...parseHash() }));

  useEffect(() => {
    const handler = () => setState(prev => ({ ...prev, ...parseHash() }));
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const updateState = (updates) => {
    const next = { ...state, ...updates };
    setState(next);
    setHash(next);
  };

  return [state, updateState];
}