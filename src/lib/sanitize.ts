import DOMPurify from "isomorphic-dompurify";

export function sanitizeLessonHtml(html: string): string {
  if (!html) return "";

  const ALLOWED_IFRAME_HOSTS = [
    "www.youtube.com",
    "youtube.com",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
    "player.vimeo.com",
    "docs.google.com",
  ];

  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName === "iframe") {
      const src = (node as Element).getAttribute("src") || "";
      try {
        const url = new URL(src);
        if (url.protocol !== "https:" || !ALLOWED_IFRAME_HOSTS.includes(url.hostname)) {
          (node as Element).remove();
        }
      } catch {
        (node as Element).remove();
      }
    }
  });

  const clean = DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "src"],
    FORBID_TAGS: ["script", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });

  DOMPurify.removeHook("uponSanitizeElement");
  return clean;
}
