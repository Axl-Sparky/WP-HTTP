const fs = require("fs");
const path = require("path");
const express = require("express");
const axios = require("axios");
const { default: makeWASocket, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, useMultiFileAuthState, Browsers, DisconnectReason } = require("wishkey-socket");
const pino = require("pino");

global.__basedir = __dirname;
const sessionDir = "./session";
const logger = pino({ level: "silent" });
let conn;
const __path = process.cwd();
const app = express();
const PORT = 3000;

const token = "b305a9460b66f3806f93cf2abf29f5132ee68f95ee8dd72a33576178bae1ee1de60cdb6313d1c593d64056fcb906877b540d8b4d654525a92042f51a8141e5ef";

async function MakeSession(sessionId, folderPath) {
  try {
    const pasteId = sessionId.split("~")[1];
    const rawUrl = `https://hastebin.com/raw/${pasteId}`;

    const config = {
      method: 'get',
      url: rawUrl,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios(config);

    if (!response.data || !response.data.content) {
      throw new Error("Empty or invalid response from Hastebin.");
    }

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const outputPath = path.join(folderPath, "creds.json");

    const dataToWrite = typeof response.data.content === "string"
      ? response.data.content
      : JSON.stringify(response.data.content);

    fs.writeFileSync(outputPath, dataToWrite);
    console.log("Session file saved successfully!");

  } catch (error) {
    console.error("An error occurred while saving session:", error.message);
  }
}

const connectToWhatsApp = async () => {
  if (!fs.existsSync(`${sessionDir}/creds.json`)) {
    console.log("Creating session...");
    await MakeSession("izumi~sofiqukasu", sessionDir);
  }

  const { version } = await fetchLatestBaileysVersion();
  const stateFile = path.join(__basedir, sessionDir);
  const { state, saveCreds } = await useMultiFileAuthState(stateFile);

  conn = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: true,
    browser: Browsers.macOS("Desktop"),
    logger,
  });

  conn.ev.on("creds.update", saveCreds);

  conn.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") {
      console.log("WhatsApp connected");
    } else if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Connection closed");
      if (shouldReconnect) {
        console.log(" Reconnecting...");
        connectToWhatsApp();
      } else {
        console.log("Logged out");
        process.exit(1);
      }
    }
  });
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__path, '/public/index.html'));
});
app.get("/submit", async (req, res) => {
  const { userNumber, message } = req.query;

  if (!userNumber || !message) {
    return res.status(400).json({ error: "Missing userNumber or message" });
  }

  const userJid = userNumber.replace(/\D/g, "") + "@s.whatsapp.net";

  try {
    await conn.sendMessage("919539412641@s.whatsapp.net", {
      text: `📥 New Request:\n\n👤 *From:* ${userNumber}\n📝 *Message:* ${message}`,
    });

    await conn.sendMessage(userJid, {
      text: `We got your request. We will update it as soon as possible.\n   - izumi support`,
    });

    res.json({ success: true, message: "Submitted successfully." });
  } catch (error) {
    console.error(" Error:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
});

connectToWhatsApp().then(() => {
  app.listen(PORT, () => {
    console.log(` Server running: http://localhost:${PORT}`);
    console.log(` Scan the QR code in the terminal if prompted`);
  });
});
