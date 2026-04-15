"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/nakama";
import { Session, Socket } from "@heroiclabs/nakama-js";

export default function Matchmaking() {
  const router = useRouter();
  const [status, setStatus] = useState("Finding an opponent...");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let active = true;

    const findMatch = async () => {
      const token = localStorage.getItem("sessionToken");
      if (!token) return router.push("/");
      
      try {
          const session = Session.restore(token, "");
          const socket = client.createSocket(client.useSSL, false);
          socketRef.current = socket;
          await socket.connect(session, true);

          socket.onmatchmakermatched = async (matched) => {
          if (!active) return;

          try {
            setStatus("Match found! Joining...");

            const match = await socket.joinMatch(matched.token);

            router.push(`/game/${encodeURIComponent(match.match_id)}`);
          } catch (err) {
            console.error("Failed to join matched game:", err);
            setStatus("Failed to join match.");

            setTimeout(() => {
              if (active) router.push("/");
            }, 2000);
          }
        };

          await socket.addMatchmaker("+engine:nakama", 2, 2, { engine: "nakama" });
      } catch (e) {
          console.error(e);
          if (active) setStatus("Error during matchmaking.");
          setTimeout(() => active && router.push("/"), 2000);
      }
    };

    findMatch();

    return () => {
        active = false;
        if (socketRef.current) {
            socketRef.current.disconnect(false);
        }
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
       <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-8 shadow-lg shadow-blue-500/50"></div>
       <p className="text-2xl font-light tracking-wide">{status}</p>
       <p className="text-sm text-gray-500 mt-2">This usually takes a few seconds.</p>
       <button onClick={() => router.push("/")} className="mt-12 px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition border border-gray-700 shadow-sm font-semibold">
           Cancel
       </button>
    </div>
  );
}
