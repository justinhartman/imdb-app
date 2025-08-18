import axios from 'axios';
import { fetchSanitized } from './proxyController';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('fetchSanitized', () => {
  it('returns inner player iframe when present', async () => {
    const html = `<html><body><div id="the_frame"><iframe id="player_iframe" src="//example.com/player" allow="autoplay; fullscreen" style="width:100%;height:100%"></iframe></div></body></html>`;
    mockedAxios.get.mockResolvedValue({ data: html } as any);

    const req: any = { query: { url: 'https://remote/site' } };
    const res: any = {
      setHeader: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await fetchSanitized(req, res);

    expect(mockedAxios.get).toHaveBeenCalledWith('https://remote/site');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    const output = res.send.mock.calls[0][0];
    expect(output).toContain('//example.com/player');
    expect(output).toContain('<iframe');
  });
});
