import PusherServer from "pusher";
import PusherClient from "pusher-js";

let pusherServerInstance: PusherServer | null = null;

export function getPusherServer(): PusherServer | null {
  if (pusherServerInstance) return pusherServerInstance;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || "ap1";

  if (!appId || !key || !secret) {
    return null;
  }

  pusherServerInstance = new PusherServer({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherServerInstance;
}

export async function triggerChatEvent(channel: string, event: string, data: unknown): Promise<boolean> {
  const server = getPusherServer();
  if (!server) {
    // Graceful fallback: Polling di client akan mengambil pesan baru dari database
    return false;
  }

  try {
    await server.trigger(channel, event, data);
    return true;
  } catch (error) {
    console.error("Pusher trigger error:", error);
    return false;
  }
}

let pusherClientInstance: PusherClient | null = null;

export function getPusherClient(): PusherClient | null {
  if (typeof window === "undefined") return null;
  if (pusherClientInstance) return pusherClientInstance;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1";

  if (!key) return null;

  pusherClientInstance = new PusherClient(key, {
    cluster,
  });

  return pusherClientInstance;
}
