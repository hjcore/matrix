import dotenv from "dotenv";

dotenv.config();

console.log("processenv", process.env);

export const OPENAI_TOKEN = process.env.OPENAI_TOKEN || "";
export const HOME_SERVER = process.env.HOME_SERVER || "";
export const MATRIX_USER_BLACK_LIST = process.env.MATRIX_USER_BLACK_LIST || [];
export const MATRIX_ROOM_BLACK_LIST = process.env.MATRIX_ROOM_BLACK_LIST || [];