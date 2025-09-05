import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtmlClient(input: string): string {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}