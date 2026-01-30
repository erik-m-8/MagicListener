import "dotenv/config";
import StreamListener from "./StreamListener.js";
console.log("🚀 Starting MagicListener...");
const listener = new StreamListener(process.env.API_STREAM_URL + "live/stream");

listener.start();

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("🛑 Shutting down ingestor...");
  listener.stop();
  process.exit(0);
}
