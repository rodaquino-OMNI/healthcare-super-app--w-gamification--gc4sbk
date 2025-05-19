import React from 'react';
import { useRouter } from 'next/router'; // next/router 13.0+
import Link from 'next/link'; // next/link 13.0+
import { Journey } from '@austa/interfaces/common';
import { useJourney } from '@austa/journey-context/hooks/useJourney';
import { Box } from '@design-system/primitives/Box';
import { i18n } from 'src/web/web/src/i18n/index.ts';

interface BreadcrumbsProps {}

/**
 * A component that renders breadcrumbs for navigation, dynamically generating
 * links based on the current route and available journey information.
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = () => {
  // Retrieves the current journey and the Next.js router object.
  const { journey } = useJourney();
  const router = useRouter();

  // Defines a base URL.
  const baseUrl = '/';

  // Creates an array of breadcrumb items, starting with a link to the home page.
  const breadcrumbItems = [
    {
      label: i18n.t('navigation.home'),
      href: baseUrl,
    },
  ];

  // Adds a breadcrumb item for the current journey, if a journey is active.
  if (journey) {
    breadcrumbItems.push({
      label: journey.name,
      href: `/${journey.id}`,
    });
  }

  // Parses the current route to generate breadcrumb items for each segment of the path.
  const pathSegments = router.asPath.split('/').filter(Boolean);
  let currentPath = '';

  for (const segment of pathSegments) {
    currentPath += `/${segment}`;
    const routeName = segment.charAt(0).toUpperCase() + segment.slice(1); // Capitalize the first letter

    breadcrumbItems.push({
      label: routeName,
      href: currentPath,
    });
  }

  // Renders the breadcrumb items as a series of links, separated by a forward slash.
  return (
    <Box as="nav" aria-label="breadcrumbs">
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex' }}>
        {breadcrumbItems.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center' }}>
            <Link href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
              {item.label}
            </Link>
            {index < breadcrumbItems.length - 1 && (
              <span style={{ margin: '0 8px', color: '#999' }}>/</span>
            )}
          </li>
        ))}
      </ol>
    </Box>
  );
};