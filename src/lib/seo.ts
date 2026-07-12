import { useEffect } from 'react';

type SEOOptions = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
};

export function useSEO({ title, description, image, url, type = 'website' }: SEOOptions) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
      meta.setAttribute('content', description);
    }
    if (title) {
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
      ogTitle.setAttribute('content', title);
    }
    if (description) {
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) { ogDesc = document.createElement('meta'); ogDesc.setAttribute('property', 'og:description'); document.head.appendChild(ogDesc); }
      ogDesc.setAttribute('content', description);
    }
    if (image) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) { ogImage = document.createElement('meta'); ogImage.setAttribute('property', 'og:image'); document.head.appendChild(ogImage); }
      ogImage.setAttribute('content', image);
    }
    if (url) {
      let ogUrl = document.querySelector('meta[property="og:url"]');
      if (!ogUrl) { ogUrl = document.createElement('meta'); ogUrl.setAttribute('property', 'og:url'); document.head.appendChild(ogUrl); }
      ogUrl.setAttribute('content', url);
    }
    if (type) {
      let ogType = document.querySelector('meta[property="og:type"]');
      if (!ogType) { ogType = document.createElement('meta'); ogType.setAttribute('property', 'og:type'); document.head.appendChild(ogType); }
      ogType.setAttribute('content', type);
    }
  }, [title, description, image, url, type]);
}
