import { Server as SocketIOServer, type Socket } from "socket.io";
import { logger } from "./logger";

interface QueuedUser {
  socketId: string;
  userId: string;
  gender: string;
  country: string | null;
  interests: string[];
  language: string;
  mode: string;
  filters: {
    genderPreference: string;
    countryFilter: string;
    interestMatch: boolean;
  };
}

const queue: QueuedUser[] = [];
const activePairs = new Map<string, string>(); // socketId → partnerSocketId
const socketUserMap = new Map<string, string>(); // socketId → userId

function calcInterestScore(a: string[], b: string[]): number {
  const setB = new Set(b.map((i) => i.toLowerCase().trim()));
  return a.filter((i) => setB.has(i.toLowerCase().trim())).length;
}

function isCompatible(seeker: QueuedUser, candidate: QueuedUser): boolean {
  // Gender filter — frontend sends "any", "male", or "female"
  if (seeker.filters.genderPreference !== "any") {
    if (candidate.gender !== seeker.filters.genderPreference) return false;
  }
  if (candidate.filters.genderPreference !== "any") {
    if (seeker.gender !== candidate.filters.genderPreference) return false;
  }

  // Country filter — frontend sends "any" or a specific country name
  if (seeker.filters.countryFilter !== "any") {
    if (candidate.country !== seeker.filters.countryFilter) return false;
  }
  if (candidate.filters.countryFilter !== "any") {
    if (seeker.country !== candidate.filters.countryFilter) return false;
  }

  return true;
}

function findBestMatch(seeker: QueuedUser): QueuedUser | null {
  const candidates = queue.filter(
    (u) => u.socketId !== seeker.socketId && isCompatible(seeker, u),
  );

  if (candidates.length === 0) return null;

  if (seeker.filters.interestMatch) {
    candidates.sort(
      (a, b) =>
        calcInterestScore(seeker.interests, b.interests) -
        calcInterestScore(seeker.interests, a.interests),
    );
  }

  return candidates[0] ?? null;
}

export function setupSocketIO(io: SocketIOServer): void {
  io.on("connection", (socket: Socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    socket.on(
      "join_queue",
      (data: {
        userId: string;
        gender: string;
        country: string | null;
        interests: string[];
        language: string;
        mode?: string;
        filters: {
          genderPreference: string;
          countryFilter: string;
          interestMatch: boolean;
        };
      }) => {
        socketUserMap.set(socket.id, data.userId);

        // Remove any existing queue entry for this socket (prevents duplicates)
        const existingIdx = queue.findIndex((u) => u.socketId === socket.id);
        if (existingIdx !== -1) queue.splice(existingIdx, 1);

        const queued: QueuedUser = {
          socketId: socket.id,
          userId: data.userId,
          gender: data.gender || "other",
          country: data.country || null,
          interests: data.interests || [],
          language: data.language || "en",
          mode: data.mode || "video",
          filters: {
            genderPreference: data.filters?.genderPreference || "any",
            countryFilter: data.filters?.countryFilter || "any",
            interestMatch: data.filters?.interestMatch || false,
          },
        };

        queue.push(queued);
        logger.info(
          { socketId: socket.id, userId: data.userId, queueSize: queue.length },
          "User joined queue",
        );

        attemptMatch(io, queued);
      },
    );

    socket.on("offer", (data: { to: string; offer: { type: string; sdp?: string } }) => {
      socket.to(data.to).emit("offer", { from: socket.id, offer: data.offer });
    });

    socket.on("answer", (data: { to: string; answer: { type: string; sdp?: string } }) => {
      socket.to(data.to).emit("answer", { from: socket.id, answer: data.answer });
    });

    socket.on("ice_candidate", (data: { to: string; candidate: { candidate?: string; sdpMid?: string | null; sdpMLineIndex?: number | null } }) => {
      socket.to(data.to).emit("ice_candidate", { from: socket.id, candidate: data.candidate });
    });

    socket.on(
      "chat_message",
      (data: { to: string; message: string; originalLang: string }) => {
        socket.to(data.to).emit("chat_message", {
          from: socket.id,
          message: data.message,
          originalLang: data.originalLang,
        });
      },
    );

    socket.on("next", () => {
      disconnectPeer(io, socket.id);
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
      disconnectPeer(io, socket.id);
      socketUserMap.delete(socket.id);
    });
  });
}

function attemptMatch(io: SocketIOServer, seeker: QueuedUser): void {
  const match = findBestMatch(seeker);
  if (!match) {
    logger.info(
      { socketId: seeker.socketId, queueSize: queue.length },
      "No match found yet, waiting in queue",
    );
    return;
  }

  // Remove both from queue
  const seekerIdx = queue.findIndex((u) => u.socketId === seeker.socketId);
  if (seekerIdx !== -1) queue.splice(seekerIdx, 1);
  const matchIdx = queue.findIndex((u) => u.socketId === match.socketId);
  if (matchIdx !== -1) queue.splice(matchIdx, 1);

  // Register active pair
  activePairs.set(seeker.socketId, match.socketId);
  activePairs.set(match.socketId, seeker.socketId);

  logger.info(
    { seeker: seeker.socketId, match: match.socketId, queueSize: queue.length },
    "Match found — emitting match_found to both",
  );

  // NOTE: frontend checks data.initiator (not isInitiator)
  io.to(seeker.socketId).emit("match_found", {
    partnerId: match.socketId,
    partnerLanguage: match.language,
    initiator: true,
  });
  io.to(match.socketId).emit("match_found", {
    partnerId: seeker.socketId,
    partnerLanguage: seeker.language,
    initiator: false,
  });
}

function disconnectPeer(io: SocketIOServer, socketId: string): void {
  // Remove from queue
  const queueIdx = queue.findIndex((u) => u.socketId === socketId);
  if (queueIdx !== -1) queue.splice(queueIdx, 1);

  // Notify partner — frontend listens for "disconnect_peer"
  const partnerId = activePairs.get(socketId);
  if (partnerId) {
    activePairs.delete(socketId);
    activePairs.delete(partnerId);
    io.to(partnerId).emit("disconnect_peer");
    logger.info({ socketId, partnerId }, "Peer disconnected from pair");
  }
}
