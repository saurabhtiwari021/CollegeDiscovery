export default function Home() {
  const endpoints: [string, string][] = [
    ["GET", "/api/goals"],
    ["GET", "/api/goals/[slug]/programs"],
    ["GET", "/api/programs/[slug]/exams"],
    ["GET", "/api/colleges"],
    ["GET", "/api/colleges/[slug]"],
    ["GET", "/api/colleges/[slug]/programs"],
    ["GET", "/api/colleges/[slug]/reviews"],
    ["GET", "/api/exams"],
    ["GET / POST", "/api/compare"],
    ["GET / POST / DELETE", "/api/saved-colleges"],
    ["POST", "/api/auth/signup"],
    ["POST", "/api/auth/login"],
    ["POST", "/api/auth/logout"],
    ["GET", "/api/auth/me"],
  ];

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">College Discovery MVP — API</h1>
      <p className="mt-2 text-sm text-neutral-600">
        This build covers Phases 0–3 of the implementation roadmap: database, seed pipeline, and
        core APIs. There is no discovery UI yet — hit the endpoints below directly.
      </p>
      <ul className="mt-8 divide-y divide-neutral-200 rounded-lg border border-neutral-200 text-sm">
        {endpoints.map(([method, path]) => (
          <li key={path} className="flex gap-3 px-4 py-2 font-mono">
            <span className="w-40 shrink-0 text-neutral-500">{method}</span>
            <span>{path}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
