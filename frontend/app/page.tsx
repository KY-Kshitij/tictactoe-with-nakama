"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { client } from "@/lib/nakama";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const authenticate = async () => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("deviceId", deviceId);
    }
    const session = await client.authenticateDevice(deviceId, true, nickname || "Player");
    localStorage.setItem("sessionToken", session.token);
    return session;
  };

  const playRandom = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await authenticate();
      router.push("/matchmaking");
    } catch (e: any) {
      setError("Failed to connect to matchmaking server. Is the backend running?");
      setIsLoading(false);
    }
  };

  const createRoom = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const session = await authenticate();
      const result = await client.rpc(session, "createMatch", {});
      if (result.payload) {
          const data = result.payload as any;
          if (data.matchId) {
             router.push(`/game/${encodeURIComponent(data.matchId)}`);
          }
      }
    } catch (e: any) {
      setError("Failed to create room. Server unreachable.");
      setIsLoading(false);
    }
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;
    setError(null);
    setIsLoading(true);
    try {
      await authenticate();
      router.push(`/game/${encodeURIComponent(roomId)}`);
    } catch (e: any) {
       setError("Failed to join room. Server unreachable.");
       setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen font-sans p-4">
      <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-12 drop-shadow-lg">
        Tic-Tac-Toe
      </h1>
      
      <div className="flex flex-col w-full max-w-sm bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Nickname</label>
          <input 
            type="text" 
            value={nickname} 
            onChange={e => setNickname(e.target.value)} 
            placeholder="Who are you?" 
            disabled={isLoading}
            className="w-full bg-gray-900 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow disabled:opacity-50" 
          />
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}
        
        <div className="flex flex-col space-y-4 pt-4 border-t border-gray-700">
          <button disabled={isLoading} onClick={playRandom} className="w-full bg-blue-600 hover:bg-blue-700 transition shadow-lg px-4 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Loading...' : 'Play Random'}
          </button>
          <button disabled={isLoading} onClick={createRoom} className="w-full bg-green-600 hover:bg-green-700 transition shadow-lg px-4 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
            Create Private Room
          </button>
          <button disabled={isLoading} onClick={() => router.push("/leaderboard")} className="w-full bg-yellow-600 hover:bg-yellow-700 transition shadow-lg px-4 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
            View Leaderboard
          </button>
        </div>

        <form onSubmit={joinRoom} className="flex flex-col space-y-3 pt-4 border-t border-gray-700">
            <label className="block text-sm font-medium text-gray-400">Join Existing Match</label>
            <input 
              type="text" 
              value={roomId} 
              onChange={e => setRoomId(e.target.value)} 
              placeholder="Enter Room ID"
              disabled={isLoading} 
              className="w-full bg-gray-900 border border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow disabled:opacity-50" 
            />
            <button disabled={isLoading} type="submit" className="w-full bg-purple-600 hover:bg-purple-700 transition shadow-lg px-4 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed">
              Join Room
            </button>
        </form>
      </div>
    </div>
  );
}
