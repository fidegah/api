import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

export function setupNeonConfig(): void {
  if (process.env.NODE_ENV === 'development') {
    neonConfig.fetchEndpoint = (host: string): string => {
      const [protocol, port] =
        host === 'db.localtest.me' ? ['http', 4444] : ['https', 443];
      return `${protocol}://${host}:${port}/sql`;
    };

    neonConfig.useSecureWebSocket = false;

    neonConfig.wsProxy = (host: string): string => {
      return host === 'db.localtest.me' ? `${host}:4444/v2` : `${host}/v2`;
    };
  }

  neonConfig.webSocketConstructor = ws;
}
