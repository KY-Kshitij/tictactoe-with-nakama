import { Client } from '@heroiclabs/nakama-js';

const host = process.env.NEXT_PUBLIC_NAKAMA_HOST || "127.0.0.1";
const port = process.env.NEXT_PUBLIC_NAKAMA_PORT || "7350";
const secure = process.env.NEXT_PUBLIC_NAKAMA_SECURE === "true";

export const client = new Client("defaultkey", host, port, secure);
