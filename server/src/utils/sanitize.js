const sanitizeHtml = require('sanitize-html');

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'blockquote',
  'pre',
  'code',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'a',
  'span',
  'mark',
  'hr',
];

function sanitizeContent(html) {
  return sanitizeHtml(String(html || ''), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'class'],
      code: ['class'],
      pre: ['class'],
      span: ['class', 'data-type', 'data-id', 'data-label'],
      mark: ['class'],
      p: ['style', 'class'],
      h2: ['style', 'class'],
      h3: ['style', 'class'],
      h4: ['style', 'class'],
    },
    allowedStyles: {
      '*': {
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
}

function htmlToText(html) {
  return sanitizeHtml(String(html || ''), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

function makeExcerpt(text, length = 240) {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.slice(0, length).trim()}…`;
}

module.exports = { sanitizeContent, htmlToText, makeExcerpt };
