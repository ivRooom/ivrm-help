const rawBaseUrl = import.meta.env.BASE_URL;
const baseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl : `${rawBaseUrl}/`;

export const withBasePath = (pathname = '') => {
  const normalizedPath = pathname.replace(/^\/+/, '');
  return `${baseUrl}${normalizedPath}`;
};
