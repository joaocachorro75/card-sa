import { useEffect } from 'react';

export interface SeoMetaOptions {
  title: string;
  description: string;
  canonicalPath?: string;
  robots?: string;
  ogType?: 'website' | 'restaurant' | 'article';
  image?: string;
  jsonLd?: Record<string, any> | null;
}

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.head.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function toAbsoluteUrl(pathOrUrl: string): string {
  if (typeof window === 'undefined') return pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const cleanPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${window.location.origin}${cleanPath}`;
}

export function useSeoMeta(options: SeoMetaOptions) {
  const {
    title,
    description,
    canonicalPath,
    robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    ogType = 'website',
    image = '/og-image.jpg',
    jsonLd = null,
  } = options;

  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const currentPath = canonicalPath ?? window.location.pathname;
    const canonicalUrl = `${window.location.origin}${currentPath === '/' ? '/' : currentPath.replace(/\/+$/, '')}`;
    const absoluteImage = toAbsoluteUrl(image || '/og-image.jpg');

    document.title = title;
    upsertCanonical(canonicalUrl);
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', robots);

    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', absoluteImage);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', absoluteImage);

    const routeLdId = 'mqc-jsonld-route';
    const existingRouteScript = document.getElementById(routeLdId);
    if (jsonLdString) {
      const scriptEl = existingRouteScript || document.createElement('script');
      scriptEl.id = routeLdId;
      scriptEl.setAttribute('type', 'application/ld+json');
      scriptEl.textContent = jsonLdString;
      if (!existingRouteScript) {
        document.head.appendChild(scriptEl);
      }
    } else if (existingRouteScript) {
      existingRouteScript.remove();
    }
  }, [title, description, canonicalPath, robots, ogType, image, jsonLdString]);
}
