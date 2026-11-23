import { guides } from '../content/guides.js';
import { parseRoute } from './routes.js';

export const siteOrigin = 'https://vexroboticsprogramming.com';
export const pagePaths = ['/', '/guides/', '/sources/', '/forum/', '/forum/welcome/', ...guides.map(guide => `/guides/${guide.slug}/`)];

export function pageMetadata(pathname) {
  const route = parseRoute(pathname);
  const guide = guides.find(item => item.slug === route.slug);
  const found = route.page !== 'not-found' && (!route.slug || guide);
  if (!found) return { title: 'Page not found | VEX Robotics Programming', description: 'This page could not be found. Browse the VEXcode C++ programming guides.', canonical: null, robots: 'noindex, follow' };
  const path = route.slug ? `/guides/${route.slug}/` : route.welcome ? '/forum/welcome/' : route.page === 'home' ? '/' : `/${route.page}/`;
  const title = guide ? `${guide.title} in VEXcode C++ | VEX Robotics Programming`
    : route.page === 'guides' ? 'VEXcode C++ Programming Guides | VEX Robotics Programming'
    : route.page === 'sources' ? 'Sources & References | VEX Robotics Programming'
    : route.welcome ? 'Forum Welcome & Rules | VEX Robotics Programming'
    : route.page === 'forum' ? 'Community Forum | VEX Robotics Programming'
    : 'VEX Robotics Programming | VEXcode C++ Tutorials';
  const description = guide ? `${guide.description} VEXcode C++ examples, diagrams, and cited references.`
    : route.page === 'guides' ? 'Browse VEX V5 programming guides covering VS Code setup, sensors, autonomous movement, color sorting, PID, odometry, and wall resets.'
    : route.page === 'sources' ? 'VEX, PROS, Purdue SIGBots, and LemLib documentation referenced in these independent VEXcode C++ programming guides.'
    : route.welcome ? 'Read the community rules and find out what to include when posting in the VEX Programming Forum.'
    : route.page === 'forum' ? 'Ask VEX V5 programming questions, share C++ snippets, and troubleshoot autonomous routines with other teams.'
    : 'Learn VEX V5 robotics programming with VEXcode C++ tutorials: VS Code setup, autonomous functions, PID, tracking-wheel odometry, color sorting, and wall resets.';
  return { title, description, canonical: siteOrigin + path, robots: 'index, follow' };
}
