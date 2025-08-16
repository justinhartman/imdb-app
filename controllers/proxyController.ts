import { Request, Response } from 'express';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

/**
 * Fetches remote HTML and returns a sanitized version.
 * The remote content is sanitized using DOMPurify to remove scripts and
 * potentially malicious attributes before being served to the client.
 *
 * @param {Request} req Express request object containing the target URL in the `url` query parameter.
 * @param {Response} res Express response object used to send the sanitized HTML.
 */
export const fetchSanitized = async (req: Request, res: Response): Promise<void> => {
  const target = req.query.url as string;
  if (!target) {
    res.status(400).send('Missing url parameter');
    return;
  }

  try {
    const { data } = await axios.get<string>(target);
    const dom = new JSDOM(data);
    const DOMPurify = createDOMPurify(dom.window as any);

    const playerIframe = dom.window.document.querySelector(
      '#player_iframe'
    ) as HTMLIFrameElement | null;

    if (playerIframe) {
      const sanitizedIframe = DOMPurify.sanitize(playerIframe.outerHTML, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: [
          'allow',
          'allowfullscreen',
          'frameborder',
          'scrolling',
          'src',
          'style',
        ],
      });
      res.setHeader('Content-Type', 'text/html');
      res.send(`<!DOCTYPE html><html><head></head><body>${sanitizedIframe}</body></html>`);
      return;
    }

    const sanitized = DOMPurify.sanitize(dom.serialize(), {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: [
        'allow',
        'allowfullscreen',
        'frameborder',
        'scrolling',
        'src',
        'style',
      ],
    });
    res.setHeader('Content-Type', 'text/html');
    res.send(sanitized);
  } catch (err) {
    res.status(500).send('Unable to fetch content');
  }
};

export default { fetchSanitized };
