const baseUrl = import.meta.env.BASE_URL;

export const withBasePath = (pathname = '') => {
  const normalizedPath = pathname.replace(/^\/+/, '');
  return `${baseUrl}${normalizedPath}`;
};
