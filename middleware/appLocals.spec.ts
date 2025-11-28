describe('middleware/appLocals', () => {
  const configMock = {
    APP_NAME: 'Test App',
    APP_SUBTITLE: 'Subtitle',
    APP_DESCRIPTION: 'Description',
    APP_URL: 'https://example.test',
  };

  const loadMiddleware = (authEnabled: boolean) => {
    let middleware: any;
    jest.isolateModules(() => {
      jest.doMock('../config/app', () => ({
        __esModule: true,
        default: configMock,
      }));
      jest.doMock('../helpers/appHelper', () => ({
        useAuth: authEnabled,
      }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      middleware = require('./appLocals').default;
    });
    return middleware as (req: any, res: any, next: () => void) => void;
  };

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('sets locals when authentication is disabled', () => {
    const appLocals = loadMiddleware(false);
    const res: any = { locals: {} };
    const next = jest.fn();

    appLocals({}, res, next);

    expect(res.locals).toEqual({
      APP_NAME: configMock.APP_NAME,
      APP_SUBTITLE: configMock.APP_SUBTITLE,
      APP_DESCRIPTION: configMock.APP_DESCRIPTION,
      APP_URL: configMock.APP_URL,
      CARD_TYPE: 'card',
    });
    expect(next).toHaveBeenCalled();
  });

  test('sets card type to card-add when authentication is enabled', () => {
    const appLocals = loadMiddleware(true);
    const res: any = { locals: {} };
    const next = jest.fn();

    appLocals({}, res, next);

    expect(res.locals.CARD_TYPE).toBe('card-add');
    expect(next).toHaveBeenCalled();
  });
});
