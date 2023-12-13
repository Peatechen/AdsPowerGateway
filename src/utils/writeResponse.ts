import { ServerResponse } from 'http';
import { Duplex } from 'stream';

export const errorCodes = {
  400: {
    code: 400,
    description: `The request contains errors or didn't properly encode content.`,
    message: 'HTTP/1.1 400 Bad Request',
  },
  401: {
    code: 401,
    description: `The request is missing, or contains bad, authorization credentials.`,
    message: 'HTTP/1.1 401 Unauthorized',
  },
  404: {
    code: 404,
    description: `Resource couldn't be found.`,
    message: 'HTTP/1.1 404 Not Found',
  },
  408: {
    code: 408,
    description: `The request took has taken too long to process.`,
    message: 'HTTP/1.1 408 Request Timeout',
  },
  429: {
    code: 429,
    description: `Too many requests are currently being processed.`,
    message: 'HTTP/1.1 429 Too Many Requests',
  },
  500: {
    code: 500,
    description: `An internal error occurred when handling the request.`,
    message: 'HTTP/1.1 500 Internal Server Error',
  },
} as const;

export const okCodes = {
  200: {
    code: 200,
    description: `The request ran successfully and returned an OK response.`,
    message: 'HTTP/1.1 200 OK',
  },
  204: {
    code: 204,
    description: `The request ran successfully, but no response was necessary.`,
    message: 'HTTP/1.1 204 No Content',
  },
} as const;

export const codes = {
  ...errorCodes,
  ...okCodes,
} as const;

export enum contentTypes {
  any = '*/*',
  html = 'text/html',
  javascript = 'application/javascript',
  jpeg = 'image/jpeg',
  json = 'application/json',
  pdf = 'application/pdf',
  png = 'image/png',
  text = 'text/plain',
  zip = 'application/zip',
}

export enum encodings {
  utf8 = 'UTF-8',
}

const isHTTP = (
  writeable: ServerResponse | Duplex,
): writeable is ServerResponse => {
  return (writeable as ServerResponse).writeHead !== undefined;
};

export const isConnected = (connection: Duplex | ServerResponse): boolean =>
  isHTTP(connection) ? !!connection.socket?.writable : !!connection.writable;

export const writeResponse = (
  writeable: Duplex | ServerResponse,
  httpCode: keyof typeof codes,
  message: string,
  contentType: contentTypes = contentTypes.text,
): void => {
  if (!isConnected(writeable)) {
    return;
  }

  const httpMessage = codes[httpCode];
  const CTTHeader = `${contentType}; charset=${encodings.utf8}`;

  if (isHTTP(writeable)) {
    const response = writeable;
    if (!response.headersSent) {
      response.writeHead(httpMessage.code, { 'Content-Type': CTTHeader });
      response.end(message + '\n');
    }
    return;
  }

  const httpResponse = [
    httpMessage.message,
    `Content-Type: ${CTTHeader}`,
    'Content-Encoding: UTF-8',
    'Accept-Ranges: bytes',
    'Connection: keep-alive',
    '\r\n',
    message,
  ].join('\r\n');

  writeable.write(httpResponse);
  writeable.end();
  return;
};
