import { MatrixClient } from "matrix-bot-sdk";

export async function sendError(client: MatrixClient, text: string, roomId: string, eventId: string): Promise<void> {
  Promise.all([client.setTyping(roomId, false, 500), client.sendText(roomId, text), client.sendReadReceipt(roomId, eventId)]);
}