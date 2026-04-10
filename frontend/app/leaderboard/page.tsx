"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/nakama";
import { Session, LeaderboardRecord } from "@heroiclabs/nakama-js";
import { v4 as uuidv4 } from "uuid";

export default function Leaderboard() {
  const router = useRouter();
  const [records, setRecords] = useState<LeaderboardRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchLeaderboard = async () => {
      try {
        let token = localStorage.getItem("sessionToken");
        let session;

        if (token) {
          session = Session.restore(token, "");
          if (session.isexpired(Math.floor(Date.now() / 1000))) {
            token = null;
          }
        }

        if (!token || !session) {
          let deviceId = localStorage.getItem("deviceId");
          if (!deviceId) {
            deviceId = uuidv4();
            localStorage.setItem("deviceId", deviceId);
          }
          session = await client.authenticateDevice(deviceId, true, "Player");
          localStorage.setItem("sessionToken", session.token);
        }

        const result = await client.listLeaderboardRecords(session, "tictactoe_wins", undefined, 10);
        
        if (active) {
            setRecords(result.records || []);
            setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load leaderboard", err);
        if (active) setLoading(false);
      }
    };

    fetchLeaderboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans">
      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-8 drop-shadow-lg">
        Top Players
      </h1>

      <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No records found. Be the first to win!
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider">Rank</th>
                <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider">Player</th>
                <th className="p-4 font-semibold text-gray-400 uppercase text-xs tracking-wider text-right">Wins</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, idx) => (
                <tr key={r.owner_id} className="border-b border-gray-700/50 hover:bg-gray-750 transition-colors">
                   <td className="p-4 text-center w-16">
                     {idx === 0 && <span className="text-2xl">🥇</span>}
                     {idx === 1 && <span className="text-2xl">🥈</span>}
                     {idx === 2 && <span className="text-2xl">🥉</span>}
                     {idx > 2 && <span className="text-gray-500 font-bold">#{idx + 1}</span>}
                   </td>
                   <td className="p-4 font-medium">{r.username || `Player_${r.owner_id?.substring(0, 4)}`}</td>
                   <td className="p-4 text-right font-bold text-yellow-400">{r.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button onClick={() => router.push("/")} className="mt-12 px-8 py-3 bg-gray-800 border border-gray-600 hover:bg-gray-700 rounded-xl transition shadow-lg font-bold">
        Back to Menu
      </button>
    </div>
  );
}
