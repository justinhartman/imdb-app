import fs from 'fs';
import path from 'path';

describe('view.ejs template', () => {
  const filePath = path.join(__dirname, '../../..', 'views', 'view.ejs');
  const template = fs.readFileSync(filePath, 'utf8');

  test('iframe is sandboxed to block popups', () => {
    expect(template).toMatch(/<iframe[^>]*sandbox="allow-same-origin allow-scripts allow-forms"[^>]*>/);
  });

  test('window.open is disabled', () => {
    expect(template).toMatch(/window\.open\s*=\s*\(\)\s*=>\s*null/);
  });
});
