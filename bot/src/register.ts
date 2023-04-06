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
    const client = await auth.passwordRegister(username, password);
    console.log("Success registering account: ", username, password, client.accessToken);
  } catch (err) {
    console.error('Error registering account:', err);
  }
}

main().catch(err => {
  console.error('Error in main:', err);
  process.exit(1);
});
