import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';
import { createApp } from './app.js';
import { createCbtAdapter } from './adapter/index.js';

const app = createApp();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(message) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) client.send(payload);
  });
}

const cbt = createCbtAdapter(broadcast);

wss.on('connection', (socket) => {
  socket.send(JSON.stringify({ type: 'state', state: cbt.getState(), running: cbt.isRunning() }));

  socket.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === 'start') {
      cbt.start(msg.hoofdstuk);
      return;
    }

    if (msg.type === 'reset') {
      const ok = cbt.reset();
      if (ok) broadcast({ type: 'reset' });
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`showcase-cbt server luistert op poort ${PORT}`);
});
