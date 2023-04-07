import {
  MatrixClient,
  AutojoinRoomsMixin,
  LogService,
  LogLevel,
  MessageEvent,
  RichConsoleLogger,
  SimpleFsStorageProvider,
  RustSdkCryptoStorageProvider,
} from 'matrix-bot-sdk';
import messageObserver from "./messageObserver/index.js";
import { HOME_SERVER } from "./env.js";
import { createDB } from "./database/index.js";

let CLIENT: MatrixClient | null = null;

let roomJoinedAt: { [roomId: string]: number } = {};

const storage = new SimpleFsStorageProvider('./data/bot.json');
const crypto = new RustSdkCryptoStorageProvider('./data/bot_sled');

console.log("home server", HOME_SERVER);

const config = {
  homeServer: HOME_SERVER,
  accessToken: 'ro2s0ZI6P0kI1l5NrG7fhbn5tjxpvo26',
};

LogService.setLogger(new RichConsoleLogger());
LogService.setLevel(LogLevel.INFO);
LogService.muteModule('Metrics');
LogService.muteModule('MatrixHttpClient');
LogService.trace = LogService.error;

const client = new MatrixClient(config.homeServer, config.accessToken, storage, crypto);

createDB("chatgpt-bot-storage");

AutojoinRoomsMixin.setupOnClient(client);

async function main() {
  await client.dms.update();

  const joinedRooms = await client.getJoinedRooms();
  console.log('joined rooms:', joinedRooms);

  await client.crypto.prepare(joinedRooms);

  client.on('room.event', (roomId, event) => {
    LogService.info(
      'index',
      `Received event ${event['event_id']} (${event['type']}) from ${event['sender']} in Room: ${roomId}` 
    );
  });

  client.on('room.failed_decryption', async (roomId: string, event: any, e: Error) => {
    LogService.error('index', `Failed to decrypt ${roomId} ${event['event_id']} because `, e);
  });

  client.on('room.join', (roomId: string) => {
    roomJoinedAt[roomId] = Date.now();
    console.log('joined room', roomId, 'at', roomJoinedAt[roomId]);
  });

  client.on('room.message', async (roomId: string, event: any) => {
    client.sendReadReceipt(roomId, event.event_id)

    const message = new MessageEvent(event);

    const data = {
      roomId,
      message,
      content: message.content,
    };

    messageObserver(roomId, event, client);

    // check is command
    // const messageText: string = data.content.body;
    // const processGetOver = commandObserver(messageText, client);
    // if (processGetOver) return;

    // const chatGPTResponse = await sendMessage(data.roomId, messageText);
    // console.log("gpt回复了", chatGPTResponse)
    // await client.replyNotice(roomId, event, chatGPTResponse);

    // if (event['content']?.['msgtype'] !== 'm.text') return;

    // const body = event['content']['body'];
    // if (!body?.startsWith('!hello')) return;

    // // Now that we've passed all the checks, we can actually act upon the command
    // await client.replyNotice(roomId, event, 'Hello world!');
  });

  await client.start();

  console.log('Client started!');

  CLIENT = client;
  await client.setPresenceStatus('online', 'bot has been started');
}

// No top-level await, alright.
main().catch(err => {
  console.error('Error in main:', err.toJSON ? err.toJSON().body : err);
});

function wait(ms: number) {
  return new Promise(ok => {
    setTimeout(ok, ms);
  });
}

async function exitHandler(options = {}) {
  if (CLIENT === null) {
    return;
  }

  let _client = CLIENT;
  CLIENT = null;

  console.log('setting bot presence to offline...');

  _client.stop();

  await wait(1000);

  process.exit(0);
}

// Misc signals (Ctrl+C, kill, etc.).
process.on('SIGINT', exitHandler);
process.on('SIGHUP', exitHandler);
process.on('SIGQUIT', exitHandler);
process.on('SIGTERM', exitHandler);
