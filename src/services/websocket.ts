import { Platform } from "react-native";

type Listener = (msg: any) => void;

const listeners = new Set<Listener>();
let socket: WebSocket | null = null;
let connecting = false;

function candidateHosts(): string[] {
  if (Platform.OS === "android") {
    return ["10.0.2.2", "10.0.3.2", "localhost"];
  }
  return ["localhost"];
}

export function connectWebSocket(): void {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }
  if (connecting) return;
  connecting = true;

  const hosts = candidateHosts();
  let index = 0;

  function tryNext() {
    if (index >= hosts.length) {
      connecting = false;
      return;
    }
    const host = hosts[index++];
    const ws = new WebSocket(`ws://${host}:8001/ws`);
    let opened = false;

    ws.onopen = () => {
      opened = true;
      connecting = false;
      socket = ws;
    };
    ws.onmessage = (event) => {
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        data = { type: "message", message: event.data };
      }
      listeners.forEach((l) => l(data));
    };
    ws.onclose = () => {
      if (socket === ws) socket = null;
      if (!opened) tryNext();
    };
    ws.onerror = () => {
      if (!opened) {
        try {
          ws.close();
        } catch {
          // ignore
        }
      }
    };
  }

  tryNext();
}

export function sendWebSocket(payload: any): void {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

export function onWebSocketMessage(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function isWebSocketConnected(): boolean {
  return !!socket && socket.readyState === WebSocket.OPEN;
}
