"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { CompareCollege } from "@/lib/api-client";
import { formatInr, formatLpa, formatRank, formatRating } from "@/lib/utils";
import { useCompare } from "@/context/CompareContext";

type Row = {
  label: string;
  render: (c: CompareCollege) => React.ReactNode;
};

const ROWS: Row[] = [
  { label: "Location", render: (c) => [c.city, c.state].filter(Boolean).join(", ") || "Not available" },
  { label: "Institution type", render: (c) => c.institutionType ?? "Not available" },
  { label: "Ownership", render: (c) => c.ownership ?? "Not available" },
  { label: "Rating", render: (c) => formatRating(c.rating) },
  { label: "NIRF rank", render: (c) => formatRank(c.nirfRank) },
  { label: "UG fees", render: (c) => formatInr(c.feesUgInr) },
  { label: "Avg. placement", render: (c) => formatLpa(c.placementAvgLpa) },
  {
    label: "Programs",
    render: (c) =>
      c.programs.length > 0 ? (
        <ul className="space-y-1">
          {c.programs.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : (
        "Not available"
      ),
  },
];

export function CompareTable({ colleges }: { colleges: CompareCollege[] }) {
  const { remove } = useCompare();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-40 border-b border-line py-3 text-left align-bottom text-xs uppercase tracking-wide text-ink-faint">
              &nbsp;
            </th>
            {colleges.map((c) => (
              <th key={c.id} className="border-b border-line px-4 py-3 text-left align-bottom">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/colleges/${c.slug}`}
                    className="font-serif text-lg leading-snug text-ink hover:text-navy-800"
                  >
                    {c.name}
                  </Link>
                  <button
                    onClick={() => remove(c.id)}
                    aria-label={`Remove ${c.name} from compare`}
                    className="mt-1 shrink-0 text-ink-faint hover:text-rose"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-b border-line/60">
              <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {row.label}
              </th>
              {colleges.map((c) => (
                <td key={c.id} className="px-4 py-3 align-top text-ink">
                  {row.render(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
