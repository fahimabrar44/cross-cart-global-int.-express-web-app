import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

type DebugInfo = {
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  platform: string;
};

type BasePayload = {
  success: boolean;
  status: string;
  message: string;
  timestamp: string;
  path?: string;
  method?: string;
  requestId?: string;
  env?: string;
  debugInfo?: DebugInfo;
  data?: unknown;
  error?: unknown;
  meta?: Record<string, unknown>;
};

type SuccessOptions = {
  req?: NextRequest;
  status?: number;
  message: string;
  data?: unknown;
  debug?: boolean;
  meta?: Record<string, unknown>;
};

type ErrorOptions = {
  req?: NextRequest;
  status?: number;
  message: string;
  error?: unknown;
  debug?: boolean;
  meta?: Record<string, unknown>;
};

function buildPayload(options: {
  req?: NextRequest;
  status: number;
  message: string;
  data?: unknown;
  error?: unknown;
  debug?: boolean;
  meta?: Record<string, unknown>;
}): BasePayload {
  const { req, status, message, data, error, debug, meta } = options;
  const now = Date.now();
  // Debug payloads expose environment details, so never enable them in
  // production even if a route explicitly asks for debug: true.
  const debugEnabled = Boolean(debug) && process.env.NODE_ENV !== "production";
  
  const payload: BasePayload = {
    success: status >= 200 && status < 300,
    status: status.toString(),
    message,
    timestamp: new Date(now).toISOString(),
  };
  
  if (data !== undefined) payload.data = data;
  if (debugEnabled && error !== undefined && error !== null) {
    payload.error = error;
  }
  if (meta !== undefined) payload.meta = meta;
  
  if (req) {
    payload.path = req.nextUrl.pathname;
    payload.method = req.method;
    payload.requestId = uuidv4();
  }
  
  if (debugEnabled) {
    payload.env = process.env.NODE_ENV;
    payload.debugInfo = {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
    };
  }
  
  return payload; 
}

export function successResponse(options: SuccessOptions) {
  const { status = 200, message, data = {}, req, debug = false, meta } = options;
  const payload = buildPayload({ status, message, data, req, debug, meta });
  return NextResponse.json(payload, { status });
}

export function errorResponse(options: ErrorOptions) {
  const { status = 500, message, error, req, debug = false, meta } = options;
  const payload = buildPayload({ status, message, error, req, debug, meta });
  return NextResponse.json(payload, { status });
}