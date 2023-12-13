import { NestFactory } from '@nestjs/core';
import 'dotenv/config';
import { asyncWsHandler } from './utils/asyncWsHandler';
import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { createProxyServer } from 'http-proxy';
import { ServerResponse } from 'http';
import { Logger } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from './app/app.module';
import { AppService } from './app/app.service';
import { writeResponse } from './utils/writeResponse';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appService = app.get(AppService);
  const logger = app.get(Logger);

  await app.listen(process.env.PORT || 8080, async () => {
    const server = app.getHttpServer();

    const proxy = createProxyServer();

    proxy.on('error', (err, _req, res) => {
      if (res instanceof ServerResponse) {
        res.writeHead && res.writeHead(500, { 'Content-Type': 'text/plain' });

        logger.error(`Issue communicating with Chrome: "${err.message}"`);
        res.end(`Issue communicating with Chrome`);
      }

      if (res instanceof Socket) {
        logger.warn('代理连接失败', { socketId: _req.headers?.socketId, err });
      }
    });

    server.on(
      'upgrade',
      asyncWsHandler(
        async (req: IncomingMessage, socket: Socket, head: Buffer) => {
          try {
            const socketId = uuidv4();

            socket.on('error', (error) => {
              logger.error(`socket 连接错误 ${error}\n${error.stack}`, {
                socketId,
              });
            });

            socket.once('close', (hadError) => {
              logger.log('socket 连接关闭', { socketId, hadError });
              socket.removeAllListeners();
            });

            req.headers.socketId = socketId;

            let targetPort;

            try {
              targetPort = await appService.searchBrowserEndpointPort(req.url);
            } catch (err) {
              const error = new Error('未找到存活目标浏览器');
              writeResponse(socket, 429, error.message);
              throw error;
            }

            if (targetPort === undefined) {
              const error = new Error('未找到存活目标浏览器');

              writeResponse(socket, 404, error.message);
              throw error;
            } else {
              proxy.ws(req, socket, head, {
                target: `ws://127.0.0.1:${targetPort}`,
                changeOrigin: true,
                toProxy: true,
              });
            }
          } catch (err) {
            logger.error('连接失败浏览器失败', { stack: err?.stack });
            throw err;
          }
        },
      ),
    );
  });
}
bootstrap();
