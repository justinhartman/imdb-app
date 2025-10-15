export type RouteMethod = 'get' | 'post';

export interface InvokeOptions {
  body?: any;
  headers?: Record<string, string>;
  prefix?: string;
  query?: Record<string, any>;
}

export interface RouterResponse {
  statusCode: number;
  headers: Record<string, any>;
  locals: Record<string, any>;
  body: any;
  finished: boolean;
}

const createMockRes = (): RouterResponse & {
  status: (code: number) => any;
  json: (payload: any) => any;
  send: (payload: any) => any;
  render: (view: string, data?: any) => any;
  redirect: (arg1: number | string, arg2?: string) => any;
  setHeader: (name: string, value: any) => void;
  getHeader: (name: string) => any;
  end: (payload?: any) => any;
} => {
  const headers: Record<string, any> = {};
  const res: any = {
    statusCode: 200,
    headers,
    locals: {},
    body: undefined,
    finished: false,
  };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: any) => {
    res.body = payload;
    res.finished = true;
    return res;
  };
  res.send = res.json;
  res.render = (view: string, data?: any) => {
    res.body = { view, data };
    res.finished = true;
    return res;
  };
  res.redirect = (arg1: number | string, arg2?: string) => {
    if (typeof arg1 === 'number') {
      res.statusCode = arg1;
      if (arg2) headers['location'] = arg2;
    } else {
      res.statusCode = res.statusCode === 200 ? 302 : res.statusCode;
      headers['location'] = arg1;
    }
    res.finished = true;
    return res;
  };
  res.setHeader = (name: string, value: any) => {
    headers[name.toLowerCase()] = value;
  };
  res.getHeader = (name: string) => headers[name.toLowerCase()];
  res.end = (payload?: any) => {
    res.body = payload;
    res.finished = true;
    return res;
  };
  return res;
};

const callHandler = (handler: any, req: any, res: any): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const next = (err?: any) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve();
    };
    try {
      if (handler.length >= 3) {
        const maybePromise = handler(req, res, next);
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.then(() => next(), reject);
        } else if (!settled && res.finished) {
          settled = true;
          resolve();
        }
      } else {
        Promise.resolve(handler(req, res)).then(() => next(), reject);
      }
    } catch (err) {
      reject(err);
    }
    if (!settled && res.finished) {
      settled = true;
      resolve();
    }
  });
};

const trimPrefix = (fullPath: string, prefix = ''): string => {
  if (!prefix) return fullPath || '/';
  if (!fullPath.startsWith(prefix)) return fullPath || '/';
  const sliced = fullPath.slice(prefix.length);
  return sliced === '' ? '/' : sliced;
};

export const runRouter = async (
  router: any,
  method: RouteMethod,
  fullPath: string,
  options: InvokeOptions = {}
): Promise<RouterResponse> => {
  const prefix = options.prefix || '';
  const path = trimPrefix(fullPath, prefix);
  const req: any = {
    method: method.toUpperCase(),
    url: path,
    originalUrl: fullPath,
    baseUrl: prefix,
    path,
    params: {},
    query: options.query || {},
    body: options.body || {},
    headers: {},
    flash: jest.fn(),
    get(name: string) {
      return this.headers[name.toLowerCase()];
    },
  };
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      req.headers[key.toLowerCase()] = value;
    }
  }
  const res = createMockRes();
  const stack: any[] = (router as any).stack || [];
  for (const layer of stack) {
    if (res.finished) break;
    if (!layer.match(path)) continue;
    if (layer.route) {
      if (!layer.route.methods[method]) continue;
      const routeStack = layer.route.stack || [];
      for (const subLayer of routeStack) {
        if (res.finished) break;
        await callHandler(subLayer.handle, req, res);
      }
    } else {
      await callHandler(layer.handle, req, res);
    }
  }
  return res;
};

export const createRouterAgent = (router: any, prefix = '') => {
  let cookie: string | undefined;
  const invoke = async (method: RouteMethod, path: string, body?: any) => {
    const headers: Record<string, string> = {};
    if (cookie) headers.cookie = cookie;
    const res = await runRouter(router, method, path, { body, headers, prefix });
    const setCookie = res.headers['set-cookie'];
    if (setCookie) {
      cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    }
    return res;
  };
  return {
    get: (path: string) => invoke('get', path),
    post: (path: string, body?: any) => invoke('post', path, body),
    request: invoke,
    clearCookies: () => {
      cookie = undefined;
    },
  };
};
