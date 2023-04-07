import Keyv from "keyv";
import { KeyvFile } from "keyv-file";
import path from "path";
import { KEYV_STORAGE_TYPE, KEYV_STORAGE_PATH } from "../env.js";
import { ConversationGraph } from "./types.js";

export let db: Keyv | null = null;

export function createDB(namespace: string) {
  if (KEYV_STORAGE_TYPE === "file") {
    // all the data will be storaged with json file 
    db = new Keyv({ store: new KeyvFile({ filename: path.join(KEYV_STORAGE_PATH, `${namespace}.json`) }) })
  } else {
    // all the data will be storaged in the mem
    db = new Keyv()
  }
}

export function storeValue(key: string, value: string) {
  db?.set(key, value);
}

export function readValue(key: string) {
  return db?.get(key);
}

export function storeConversationToDB(conversation: ConversationGraph) {
  const { roomId, ...rest } = conversation;
  storeValue(roomId, JSON.stringify(rest));
}

export async function readConversationFromDB(roomId: string) {
  const result = await readValue(roomId);
  if (result) return JSON.parse(result);
  return null;
}