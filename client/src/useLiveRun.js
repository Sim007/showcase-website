import { useEffect, useRef, useState } from 'react';
import { WS_URL } from './api.js';

function gestopteDeelsystemenUit(stappen) {
  const set = new Set();
  for (const s of stappen) if (s.uitkomst === 'rood') set.add(s.deelsysteem);
  return set;
}

// Tracks live events for one pipeline run over a shared websocket.
// `stappen` is keyed by stap-nr so start/finish updates upsert in place.
// `gestopteDeelsystemen` komt uit het expliciete stopsignaal van de stream
// (deelsysteem-gestopt), niet uit eigen kleur-interpretatie — bij een
// resync (state-bericht) wordt het wel afgeleid uit de laatst bekende
// uitkomsten, omdat losse stopsignalen dan niet meer te herhalen zijn.
export function useLiveRun() {
  const [connected, setConnected] = useState(false);
  const [running, setRunning] = useState(false);
  const [hoofdstuk, setHoofdstuk] = useState(null);
  const [stappen, setStappen] = useState({});
  const [gestopteDeelsystemen, setGestopteDeelsystemen] = useState(new Set());
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    socketRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);

    socket.onmessage = (raw) => {
      const msg = JSON.parse(raw.data);
      if (msg.type === 'state') {
        setRunning(msg.running);
        setHoofdstuk(msg.state.hoofdstuk);
        const map = {};
        for (const s of msg.state.stappen) map[s.nr] = s;
        setStappen(map);
        setGestopteDeelsystemen(gestopteDeelsystemenUit(msg.state.stappen));
      } else if (msg.type === 'run-gestart') {
        setRunning(true);
        setHoofdstuk(msg.hoofdstuk);
        setStappen({});
        setGestopteDeelsystemen(new Set());
      } else if (msg.type === 'stap-gestart' || msg.type === 'stap-beeindigd') {
        setStappen((prev) => ({ ...prev, [msg.stap.nr]: msg.stap }));
      } else if (msg.type === 'deelsysteem-gestopt') {
        setGestopteDeelsystemen((prev) => new Set(prev).add(msg.deelsysteem));
      } else if (msg.type === 'run-beeindigd') {
        setRunning(false);
      } else if (msg.type === 'reset') {
        setRunning(false);
        setHoofdstuk(null);
        setStappen({});
        setGestopteDeelsystemen(new Set());
      }
    };

    return () => socket.close();
  }, []);

  function start(id) {
    socketRef.current?.send(JSON.stringify({ type: 'start', hoofdstuk: id }));
  }

  function reset() {
    socketRef.current?.send(JSON.stringify({ type: 'reset' }));
  }

  return { connected, running, hoofdstuk, stappen, gestopteDeelsystemen, start, reset };
}
