/**
 * GET /robots.txt — Desencoraja indexacao de uma ferramenta de segredos.
 */

const ROBOTS = `User-agent: *
Disallow: /
`;

export function handleRobots(): Response {
  return new Response(ROBOTS, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
    },
  });
}
