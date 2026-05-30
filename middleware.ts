import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['vi', 'en', 'zh', 'ko', 'ja'],
  defaultLocale: 'vi',
  localePrefix: 'always',
});

export const config = {
  // Exclude /admin/* routes from locale middleware — served directly without locale prefix
  matcher: ['/((?!api|_next|_vercel|admin|.*\\..*).*)'],
};
