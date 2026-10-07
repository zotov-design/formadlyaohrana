import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const pagesPrefix = "/formadlyaohrana/v1-site";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1");
      const pathname = decodeURIComponent(url.pathname);
      const localPath = pathname === pagesPrefix
        ? "/"
        : pathname.startsWith(pagesPrefix + "/")
          ? pathname.slice(pagesPrefix.length)
          : pathname;
      const target = path.resolve(root, "." + localPath);
      if (target !== root && !target.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      let file = target;
      try {
        if ((await stat(file)).isDirectory()) {
          const index = path.join(file, "index.html");
          file = await stat(index)
            .then(() => index)
            .catch(() => file + ".html");
        }
      } catch {
        file += ".html";
      }
      const data = await readFile(file);
      const headers = {
        "X-Robots-Tag": "noindex, nofollow",
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Accept-Ranges": "bytes",
        "Content-Length": data.length,
      };
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        const start = match?.[1]
          ? Number(match[1])
          : match?.[2]
            ? Math.max(0, data.length - Number(match[2]))
            : NaN;
        const end =
          match?.[1] && match?.[2]
            ? Math.min(Number(match[2]), data.length - 1)
            : data.length - 1;
        if (
          !Number.isSafeInteger(start) ||
          start > end ||
          start >= data.length
        ) {
          res.writeHead(416, { "Content-Range": `bytes */${data.length}` });
          res.end();
          return;
        }
        res.writeHead(206, {
          ...headers,
          "Content-Range": `bytes ${start}-${end}/${data.length}`,
          "Content-Length": end - start + 1,
        });
        res.end(
          req.method === "HEAD" ? undefined : data.subarray(start, end + 1),
        );
        return;
      }
      res.writeHead(200, headers);
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" });
      res.end(
        await readFile(path.join(root, "404.html")).catch(() =>
          Buffer.from("Not found"),
        ),
      );
    }
  })
  .listen(3100, "127.0.0.1", () =>
    console.log("Форма для охраны: http://127.0.0.1:3100"),
  );

