export interface HandlerEvent {
  body: string | null;
  headers: Record<string, string | undefined>;
  queryStringParameters: Record<string, string | undefined> | null;
  httpMethod?: string;
  path?: string;
}

export interface HandlerResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export type Handler = (event: HandlerEvent, context?: any) => Promise<HandlerResponse>;
