// Requests outside any locale (rare: the proxy normally adds one) get a minimal 404.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ background: "#0a0a0a", color: "#f3f5f2", fontFamily: "system-ui, sans-serif", padding: "4rem 1.25rem" }}>
        <h1>Page not found</h1>
        <p>
          <a href="/" style={{ color: "#72c04f" }}>Go to the homepage</a>
        </p>
      </body>
    </html>
  );
}
