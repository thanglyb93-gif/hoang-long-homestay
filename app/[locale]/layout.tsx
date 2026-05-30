import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Cormorant_Garamond, Be_Vietnam_Pro, Noto_Sans_SC, Noto_Sans_JP, Noto_Sans_KR } from 'next/font/google';
import WhatsAppButton from '@/components/WhatsAppButton';
import '../globals.css';

const locales = ['vi', 'en', 'zh', 'ko', 'ja'];

// ── Heading font ──────────────────────────────────────────────────────────────
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

// ── Body font (Latin + Vietnamese) ───────────────────────────────────────────
const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

// ── CJK fonts — loaded per unicode-range; browser only downloads what's needed ─
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sc',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-jp',
  display: 'swap',
});

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-kr',
  display: 'swap',
});

// ── Per-locale metadata ───────────────────────────────────────────────────────
const META: Record<string, { title: string; description: string }> = {
  vi: {
    title: 'Hoàng Long Homestay | Nhơn Trạch, Đồng Nai',
    description:
      'Homestay boutique yên tĩnh tại Nhơn Trạch, Đồng Nai — cách TP.HCM chỉ 35 km. Không gian xanh mát, bữa sáng tự nấu và trải nghiệm địa phương chân thật.',
  },
  en: {
    title: 'Hoang Long Homestay | Nhon Trach, Dong Nai',
    description:
      'A boutique homestay in Nhơn Trạch, Đồng Nai — just 35 km from Ho Chi Minh City. Lush gardens, homemade breakfast, and authentic local experiences await.',
  },
  zh: {
    title: '皇龙民宿 | 同奈省宁镇郡',
    description:
      '坐落于同奈省宁镇郡的精品民宿，距胡志明市仅35公里。绿意盎然、手工早餐与原汁原味的本地体验。',
  },
  ko: {
    title: '황룡 홈스테이 | 동나이성 년짝',
    description:
      '동나이성 년짝에 자리한 부티크 홈스테이. 호치민 시내에서 35km. 푸른 정원, 수제 조식, 진정한 로컬 체험이 기다립니다.',
  },
  ja: {
    title: '皇龍ホームステイ | ドンナイ省ニョントラック',
    description:
      'ドンナイ省ニョントラックのブティックホームステイ。ホーチミン市から35km。緑の庭、手作り朝食、本物のローカル体験をお届けします。',
  },
};

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const m = META[locale] ?? META.en;

  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.title,
      description: m.description,
      locale: locale,
      type: 'website',
      siteName: 'Hoang Long Homestay',
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.description,
    },
    alternates: {
      languages: {
        vi: '/vi',
        en: '/en',
        zh: '/zh',
        ko: '/ko',
        ja: '/ja',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  const fontVars = [
    cormorant.variable,
    beVietnam.variable,
    notoSansSC.variable,
    notoSansJP.variable,
    notoSansKR.variable,
  ].join(' ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: 'Hoang Long Homestay',
    url: 'https://hoanglonghomestay.vn',
    telephone: '+84000000000',
    email: 'info@hoanglonghomestay.vn',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Phước Kiểng',
      addressLocality: 'Nhơn Trạch',
      addressRegion: 'Đồng Nai',
      postalCode: '76206',
      addressCountry: 'VN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 10.736805,
      longitude: 106.9541541,
    },
    priceRange: '$$',
    numberOfRooms: 4,
  };

  return (
    <html lang={locale} className={fontVars}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased">
        <NextIntlClientProvider messages={messages}>
          <div className="page-transition">
            {children}
          </div>
          <WhatsAppButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
