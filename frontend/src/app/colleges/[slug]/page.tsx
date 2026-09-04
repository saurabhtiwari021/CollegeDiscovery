import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Landmark, Star, ExternalLink, GraduationCap } from "lucide-react";
import { CollegeActions } from "@/components/colleges/CollegeActions";
import { Badge } from "@/components/ui/Badge";
import { formatInr, formatLpa, formatRank, formatRating } from "@/lib/utils";
import { backendFetch, BackendApiError } from "@/lib/server-api";
import { adaptCollegeDetail, type RawCollegeDetailResponse } from "@/lib/adapters";
import type { CollegeDetailResponse } from "@/lib/types";

async function getCollegeDetail(slug: string): Promise<CollegeDetailResponse | null> {
  try {
    const raw = await backendFetch<RawCollegeDetailResponse>(`/api/colleges/${slug}`);
    return adaptCollegeDetail(raw);
  } catch (err) {
    if (err instanceof BackendApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getCollegeDetail(slug);
  if (!detail) return { title: "College not found" };
  return {
    title: `${detail.college.name} | College Discovery`,
    description: detail.detail?.overview ?? undefined,
  };
}

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "programs", label: "Programs" },
  { id: "placements", label: "Placements" },
  { id: "reviews", label: "Reviews" },
  { id: "location", label: "Location" },
] as const;

export default async function CollegeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getCollegeDetail(slug);
  if (!detail) notFound();

  const { college, detail: rich, programs, placements, reviews } = detail;

  return (
    <div>
      <div className="border-b border-line bg-white">
        <div className="container-content py-10">
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
            <Link href="/discover" className="hover:text-navy-800">
              Discover
            </Link>
            <span>/</span>
            <span className="text-ink">{college.name}</span>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <h1 className="font-serif text-3xl text-ink md:text-4xl">{college.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted">
                {(college.city || college.state) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {[college.city, college.state].filter(Boolean).join(", ")}
                  </span>
                )}
                {college.institutionType && (
                  <span className="inline-flex items-center gap-1.5">
                    <Landmark className="h-4 w-4" />
                    {college.institutionType}
                  </span>
                )}
                {college.ownership && <Badge tone="outline">{college.ownership}</Badge>}
              </div>
              <div className="mt-4">
                <CollegeActions college={college} />
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-4 rounded border border-line bg-paper p-5 sm:grid-cols-5 lg:w-auto">
              <Metric label="Rating" value={formatRating(college.rating)} icon={<Star className="h-3.5 w-3.5 fill-marigold-dark text-marigold-dark" />} />
              <Metric label="NIRF rank" value={formatRank(college.nirfRank)} />
              <Metric label="UG fees" value={formatInr(college.feesUgInr)} />
              <Metric label="Avg. placement" value={formatLpa(college.placementAvgLpa)} />
              <Metric
                label="Website"
                value={
                  college.websiteUrl ? (
                    <a
                      href={college.websiteUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-navy-800 hover:underline"
                    >
                      Visit <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    "Not available"
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-16 z-20 border-b border-line bg-paper/95 backdrop-blur">
        <div className="container-content flex gap-6 overflow-x-auto py-3 text-sm">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="whitespace-nowrap text-ink-muted hover:text-navy-900"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <div className="container-content grid grid-cols-1 gap-12 py-10 lg:grid-cols-[1fr_280px]">
        <div className="space-y-14">
          <section id="overview" className="scroll-mt-32">
            <h2 className="font-serif text-2xl text-ink">Overview</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted">
              {rich?.overview ?? "Not available"}
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <InfoItem label="Established" value={rich?.establishedYear ? String(rich.establishedYear) : "Not available"} />
              <InfoItem label="Accreditation" value={rich?.accreditation ?? "Not available"} />
              <InfoItem label="Hostel" value={rich?.hostelInfo ?? "Not available"} />
            </dl>
            {rich?.isDemo && (
              <p className="mt-4 text-xs text-ink-faint">
                Rich profile content for this college is demo/placeholder data pending verified
                sourcing.
              </p>
            )}
          </section>

          <section id="programs" className="scroll-mt-32">
            <h2 className="font-serif text-2xl text-ink">Programs offered</h2>
            {programs.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">
                No active program mappings for this college yet.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line border-y border-line">
                {programs.map((p) => (
                  <li key={p.programId} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-navy-800" />
                      <span className="font-medium text-ink">{p.name}</span>
                      {p.degreeLevel && <Badge tone="outline">{p.degreeLevel}</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                      <span>{formatInr(p.annualFeeInr)}</span>
                      {p.durationYears && <span>{p.durationYears} yrs</span>}
                      {p.exams.length > 0 && (
                        <span className="flex flex-wrap gap-1">
                          {p.exams.map((e) => (
                            <Badge key={e.id} tone="marigold">
                              {e.name}
                            </Badge>
                          ))}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="placements" className="scroll-mt-32">
            <h2 className="font-serif text-2xl text-ink">Placements</h2>
            {placements.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No placement records available.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-faint">
                      <th className="py-2 pr-4">Year</th>
                      <th className="py-2 pr-4">Average</th>
                      <th className="py-2 pr-4">Median</th>
                      <th className="py-2 pr-4">Highest</th>
                      <th className="py-2 pr-4">Placement rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placements
                      .slice()
                      .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
                      .map((row, i) => (
                        <tr key={i} className="border-b border-line/60">
                          <td className="py-2 pr-4 tabular-nums">{row.year ?? "Not available"}</td>
                          <td className="py-2 pr-4 tabular-nums">{formatLpa(row.averagePackageLpa)}</td>
                          <td className="py-2 pr-4 tabular-nums">{formatLpa(row.medianPackageLpa)}</td>
                          <td className="py-2 pr-4 tabular-nums">{formatLpa(row.highestPackageLpa)}</td>
                          <td className="py-2 pr-4 tabular-nums">
                            {row.placementRatePct !== null ? `${row.placementRatePct}%` : "Not available"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section id="reviews" className="scroll-mt-32">
            <h2 className="font-serif text-2xl text-ink">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No reviews yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="rounded border border-line p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-ink">{r.title ?? "Student review"}</p>
                      {r.rating !== null && (
                        <span className="inline-flex items-center gap-1 text-sm text-marigold-dark">
                          <Star className="h-3.5 w-3.5 fill-marigold-dark" /> {r.rating}
                        </span>
                      )}
                    </div>
                    {r.body && <p className="mt-2 text-sm text-ink-muted">{r.body}</p>}
                    {r.isDemo && (
                      <p className="mt-2 text-xs text-ink-faint">Demo review content</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="location" className="scroll-mt-32">
            <h2 className="font-serif text-2xl text-ink">Location</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem label="Address" value={college.address ?? "Not available"} />
              <InfoItem label="Pincode" value={college.pincode ?? "Not available"} />
              <InfoItem label="City" value={college.city ?? "Not available"} />
              <InfoItem label="State" value={college.state ?? "Not available"} />
            </dl>
          </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-32 space-y-4 rounded border border-line bg-white p-5">
            <p className="font-serif text-lg text-ink">Quick facts</p>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Type</dt>
                <dd className="text-ink">{college.institutionType ?? "Not available"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Ownership</dt>
                <dd className="text-ink">{college.ownership ?? "Not available"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">NIRF rank</dt>
                <dd className="tabular-nums text-ink">{formatRank(college.nirfRank)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">UG fees</dt>
                <dd className="tabular-nums text-ink">{formatInr(college.feesUgInr)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs text-ink-faint">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}
