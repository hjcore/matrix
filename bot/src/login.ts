import { MatrixAuth, LogService, LogLevel, RichConsoleLogger } from 'matrix-bot-sdk';
import { HOME_SERVER } from './env.js';

const config = {
  homeServer: HOME_SERVER,
};

LogService.setLogger(new RichConsoleLogger());
LogService.setLevel(LogLevel.ERROR);
LogService.muteModule('Metrics');
LogService.muteModule('MatrixHttpClient');
LogService.trace = LogService.error;

async function main() {
  const [username, password] = process.argv.slice(2);

  if (!username || !password) {
    console.error('Please provide a username and password.');
    process.exit(1);
  }

  const auth = new MatrixAuth(config.homeServer);
  try {
    const client = await auth.passwordLogin(username, password);
    console.log("Copy this access token to your bot's config: ", client.accessToken);
  } catch (err) {
    console.error('Error login account:', (err as any).error);
  }
}

main().catch(err => {
  console.error('Error in main:', err);
  process.exit(1);
});
