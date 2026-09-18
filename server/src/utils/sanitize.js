const xss = require('xss');

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'blockquote', 'pre', 'code', 'h2', 'h3', 'h4',
  'ul', 'ol', 'li', 'a', 'span', 'mark', 'hr',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'class', 'style',
  'data-type', 'data-id', 'data-label',
];

const filter = new xss.FilterXSS({
  whiteList: Object.fromEntries(ALLOWED_TAGS.map((tag) => [tag, ALLOWED_ATTR])),
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
  css: false,
  onTagAttr(tag, name, value) {
    if (tag === 'a' && name === 'href') {
      const href = xss.friendlyAttrValue(value);
      if (!/^(https?:|mailto:)/i.test(href)) return '';
      return `href="${href}"`;
    }
    if (name === 'style') {
      const align = String(value || '').match(/text-align\s*:\s*(left|right|center|justify)/i);
      return align ? `style="text-align:${align[1].toLowerCase()}"` : '';
    }
    return undefined;
  },
  onTag(tag, html, options) {
    if (tag === 'a' && !options.isClosing) {
      return html.replace(/<a\b/i, '<a rel="noopener noreferrer" target="_blank"');
    }
    return undefined;
  },
});

function sanitizeContent(html) {
  return filter.process(String(html || ''));
}

function htmlToText(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeExcerpt(text, length = 240) {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}…`;
}

module.exports = { sanitizeContent, htmlToText, makeExcerpt };
