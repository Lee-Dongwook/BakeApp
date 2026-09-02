import type { Page } from "../store/usePageStore";

export interface PageMatch {
  page: Page;
  params: Record<string, string>;
}

const normalisePath = (path: string) => {
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  return withLeadingSlash.length > 1
    ? withLeadingSlash.replace(/\/+$/, "")
    : withLeadingSlash;
};

export const getHashRoute = () =>
  normalisePath(window.location.hash.slice(1) || "/");

export const pagePathForNavigation = (page: Page) =>
  normalisePath(page.path).replace(/:([A-Za-z0-9_]+)/g, "preview");

export const matchPageRoute = (
  pages: Page[],
  pathname: string,
): PageMatch | undefined => {
  const routeSegments = normalisePath(pathname).split("/").filter(Boolean);

  const page = pages.find((candidate) => {
    const pageSegments = normalisePath(candidate.path)
      .split("/")
      .filter(Boolean);
    if (pageSegments.length !== routeSegments.length) return false;

    return pageSegments.every(
      (segment, index) =>
        segment.startsWith(":") || segment === routeSegments[index],
    );
  });
  if (!page) return undefined;

  const params = normalisePath(page.path)
    .split("/")
    .filter(Boolean)
    .reduce<Record<string, string>>((result, segment, index) => {
      if (segment.startsWith(":")) {
        result[segment.slice(1)] = decodeURIComponent(routeSegments[index]);
      }
      return result;
    }, {});
  return { page, params };
};

export const navigateToPageRoute = (path: string) => {
  const nextHash = `#${normalisePath(path)}`;
  if (window.location.hash !== nextHash) window.location.hash = nextHash;
};
