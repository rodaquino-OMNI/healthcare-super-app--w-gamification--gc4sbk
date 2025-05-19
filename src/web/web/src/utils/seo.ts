import { NextSeo } from 'next-seo'; // next-seo 5.15.0
import { env } from '@web/shared/config/env';

// Define interfaces for SEO metadata
interface OpenGraphImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

interface TwitterConfig {
  handle: string;
  site: string;
  cardType: string;
}

interface OpenGraphConfig {
  title: string;
  description: string;
  type: string;
  url: string;
  images: OpenGraphImage[];
  siteName: string;
}

interface MetaTag {
  name: string;
  content: string;
}

/**
 * Generates SEO metadata for a given page, including title, description, and Open Graph properties.
 * 
 * @param title - The title of the page
 * @param description - The description of the page
 * @param imageUrl - The URL of the image to use for Open Graph
 * @param route - The route of the page
 * @returns The NextSeo component with the generated metadata
 */
export const generateSeoMetadata = (
  title: string,
  description: string,
  imageUrl: string,
  route: string
): JSX.Element => {
  // Ensure the route has a leading slash
  const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
  
  // Construct the full URL using standardized environment variable access
  const baseUrl = env.API_URL || 'https://app.austa.com.br';
  const fullUrl = `${baseUrl}${normalizedRoute}`;
  
  // Define the Open Graph metadata with proper typing
  const openGraphImage: OpenGraphImage = {
    url: imageUrl,
    width: 1200,
    height: 630,
    alt: title,
  };
  
  // Define the Open Graph configuration
  const openGraph: OpenGraphConfig = {
    title,
    description,
    type: 'website',
    url: fullUrl,
    images: [openGraphImage],
    siteName: 'AUSTA SuperApp',
  };
  
  // Define Twitter configuration
  const twitter: TwitterConfig = {
    handle: '@AUSTAapp',
    site: '@AUSTAapp',
    cardType: 'summary_large_image',
  };
  
  // Define additional meta tags
  const additionalMetaTags: MetaTag[] = [
    {
      name: 'application-name',
      content: 'AUSTA SuperApp',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'theme-color',
      content: '#0066CC',
    },
  ];
  
  // Return the NextSeo component with the generated metadata
  return (
    <NextSeo
      title={title}
      description={description}
      openGraph={openGraph}
      canonical={fullUrl}
      twitter={twitter}
      additionalMetaTags={additionalMetaTags}
    />
  );
};