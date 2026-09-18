import DOMPurify from 'dompurify';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isSafeHttpUrl(href) {
  return /^https?:\/\//i.test(href);
}

function linkifyUrls(text) {
  return text.replace(/\b((?:https?:\/\/|www\.)[^\s<]+)/gi, (raw) => {
    const punctuation = raw.match(/[),.;!?]+$/);
    const suffix = punctuation ? punctuation[0] : '';
    const url = suffix ? raw.slice(0, -suffix.length) : raw;
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    if (!isSafeHttpUrl(href)) return raw;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>${suffix}`;
  });
}

function linkifySocial(text) {
  return text
    .replace(/(^|[\s>])@([a-zA-Z0-9_]{2,30})/g, '$1<a class="mention" href="/u/$2">@$2</a>')
    .replace(/(^|[\s>])#([a-zA-Z0-9_]{1,40})/g, '$1<a class="hashtag" href="/hashtag/$2">#$2</a>');
}

function decorateAnchors(html) {
  return html.replace(/<a\s+([^>]*?)>/gi, (full, attrs) => {
    const hrefMatch = attrs.match(/href="([^"]*)"/i);
    const href = hrefMatch ? hrefMatch[1] : '';
    if (!href || href.startsWith('/') || href.startsWith('#') || href.startsWith('mailto:')) return full;
    if (/target=/i.test(attrs)) return full;
    return `<a ${attrs} target="_blank" rel="noopener noreferrer">`;
  });
}

export function renderContent(html) {
  const clean = DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'pre', 'code', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'span', 'mark', 'hr'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'data-type', 'data-id', 'data-label', 'style'],
  });
  const withNodes = clean
    .replace(
      /<span[^>]*data-type="mention"[^>]*data-id="([^"]+)"[^>]*>.*?<\/span>/gi,
      '<a class="mention" href="/u/$1">@$1</a>'
    )
    .replace(
      /<span[^>]*data-type="hashtag"[^>]*data-id="([^"]+)"[^>]*>.*?<\/span>/gi,
      '<a class="hashtag" href="/hashtag/$1">#$1</a>'
    );
  return decorateAnchors(linkifySocial(withNodes));
}

export function renderPlainText(text) {
  return DOMPurify.sanitize(linkifySocial(linkifyUrls(escapeHtml(text))).replace(/\n/g, '<br>'), {
    ALLOWED_TAGS: ['a', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  });
}

export function extractHashtags(text) {
  return [...new Set((String(text || '').match(/#([a-zA-Z0-9_]+)/g) || []).map((item) => item.slice(1)))];
}
