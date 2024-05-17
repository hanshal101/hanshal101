import { allPosts } from "contentlayer/generated";

const Sitemap = () => {
  const posts = allPosts.map((post) => ({
    // post.slub is like "/blog/xyz"
    url: `https://hanshal101.github.io/hanshal101${post.slug}`,
    lastModified: post.published,
  }));

  const routes = [
    "",
    "/",
    "/bharat",
    "/blog",
    "/k9",
    "/papers",
    "/system",
    "/work",
  ].map((route) => ({
    url: `https://hanshal101.github.io/hanshal101${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...posts];
};

export default Sitemap;
