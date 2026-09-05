/* eslint-disable @typescript-eslint/no-explicit-any -- schema/validator introspection + pure-fixture tests */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/* SLICE-P4-08 acceptance tests. R-SSRF is the security boundary — the pure
 * ingress validators are tested exactly; the fetch paths themselves need a
 * deployment push (DEV-HANDOFF #4). Pollers/extract/cluster surfaces +
 * eligibility math are pure or asserted by shape.
 *
 * Sources: CAP-031-037 + CAP-061-063 Notes; CONTRACT-4-sources §1-§6;
 * bible l.146-156. */

import schemaDefault from "../../../../../../convex/schema";
import * as sourcesModule from "../../../../../../convex/sources";
import * as pollers from "../../../../../../convex/ingest/pollers";
import * as extract from "../../../../../../convex/ingest/extract";
import * as safeFetchModule from "../../../../../../convex/lib/safeFetch";

const schema = schemaDefault as any;
const fieldsOf = (t: any) => t.validator.fields;
const hasField = (t: any, f: string) => Boolean(fieldsOf(t)?.[f]);
const literalValues = (field: any): string[] => {
  if (!field) return [];
  if (field.kind === "union") return field.members.map((l: any) => l.value);
  if (field.kind === "literal") return [field.value];
  return [];
};

describe("SLICE-P4-08 — M2 schema (bible l.146-156)", () => {
  it("sources: trustLevel enum + CAP-059 takedown fields present but untouched by this slice", () => {
    const t = schema.tables.sources;
    expect(literalValues(fieldsOf(t).trustLevel).sort()).toEqual(["approved", "blocked", "conditional"]);
    expect(hasField(t, "takedownReason")).toBe(true);
    expect(hasField(t, "takedownAt")).toBe(true);
  });

  it("ingestionConfigs: 5-literal method enum + poll/budget/health fields", () => {
    const t = schema.tables.ingestionConfigs;
    expect(literalValues(fieldsOf(t).method).sort()).toEqual(
      ["newsletter", "operator_paste", "raw_scrape", "rss", "youtube_api"].sort(),
    );
    for (const f of ["sourceId", "pollIntervalMinutes", "nextPollAt", "lastPolledAt", "lastSuccessAt", "consecutiveFailures", "robotsStatus", "rightsBasis", "termsReviewStatus", "maxRequestsPerDay"]) {
      expect(hasField(t, f), `ingestionConfigs.${f}`).toBe(true);
    }
    expect(fieldsOf(t).sourceId.tableName).toBe("sources");
  });

  it("sourceItems + contentExtractions carry contentHash (the dedup idempotency key, CAP-062)", () => {
    for (const table of ["sourceItems", "contentExtractions"]) {
      expect(hasField(schema.tables[table], "contentHash")).toBe(true);
    }
  });

  it("sourceClaims: 6-literal claimType enum + the anti-hallucination field set", () => {
    const t = schema.tables.sourceClaims;
    expect(literalValues(fieldsOf(t).claimType).sort()).toEqual(
      ["data_point", "fact", "opinion", "prediction", "quote", "stat"].sort(),
    );
    for (const f of ["contentExtractionId", "sourceId", "claimText", "evidenceText", "attributionRequired", "verificationStatus", "confidence", "clusterId"]) {
      expect(hasField(t, f), `sourceClaims.${f}`).toBe(true);
    }
  });

  it("claimClusters: status enum + sourceDomainCount (the CAP-037 counter)", () => {
    const t = schema.tables.claimClusters;
    expect(literalValues(fieldsOf(t).status).sort()).toEqual(["drafted", "exhausted", "pending", "ready"].sort());
    expect(hasField(t, "sourceDomainCount")).toBe(true);
  });

  it("generationRuns: contentCandidateId OPTIONAL (P4-08 bible-fix — CAP-036 writes pre-candidate runs)", () => {
    const f = fieldsOf(schema.tables.generationRuns);
    expect(f.contentCandidateId.isOptional).toBe("optional");
    for (const required of ["runType", "provider", "model", "promptVersion", "attemptNumber", "startedAt", "completedAt"]) {
      expect(hasField(schema.tables.generationRuns, required)).toBe(true);
    }
  });
});

describe("SLICE-P4-08 — R-SSRF ingress (CAP-061, pure: validateUrlSyntax)", () => {
  const { validateUrlSyntax } = safeFetchModule;

  it("accepts clean HTTPS URLs on the implied port", () => {
    expect(validateUrlSyntax("https://example.com/feed.xml")).toEqual({ ok: true, hostname: "example.com" });
  });

  it("rejects non-HTTPS, embedded credentials, and nonstandard ports (quoted rule)", () => {
    expect(validateUrlSyntax("http://example.com").ok).toBe(false);
    expect(validateUrlSyntax("ftp://example.com").ok).toBe(false);
    expect(validateUrlSyntax("https://user:pass@example.com").ok).toBe(false);
    expect(validateUrlSyntax("https://example.com:8443/feed").ok).toBe(false);
  });

  it("rejects garbage", () => {
    expect(validateUrlSyntax("not a url").ok).toBe(false);
  });
});

describe("SLICE-P4-08 — RSS parse + dedup (CAP-032, pure)", () => {
  it("parseFeedItems: RSS <item> and Atom <entry>, CDATA-safe, link-preferring", () => {
    const rss = `<?xml version="1.0"?><rss><channel>
      <item><title><![CDATA[Alpha]]></title><link>https://a.example/1</link><pubDate>Mon, 01 Sep 2026 00:00:00 GMT</pubDate><description>First story.</description></item>
      <item><title>Beta</title><link>https://b.example/2</link></item>
    </channel></rss>`;
    const items = pollers.parseFeedItems(rss);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ title: "Alpha", link: "https://a.example/1", description: "First story." });

    const atom = `<feed><entry><title>Gamma</title><link href="https://c.example/3" rel="alternate"/></entry></feed>`;
    expect(pollers.parseFeedItems(atom)[0]?.link).toBe("https://c.example/3");
  });

  it("items without a link are skipped; fan-out ceiling respected", () => {
    const many = `<rss>${Array.from({ length: 40 }, (_, i) => `<item><title>t${i}</title><link>https://x.example/${i}</link></item>`).join("")}</rss>`;
    expect(pollers.parseFeedItems(many)).toHaveLength(pollers.MAX_ITEMS_PER_POLL);
  });

  it("hashContent: stable, collision-different, order-sensitive", () => {
    expect(pollers.hashContent("abc")).toBe(pollers.hashContent("abc"));
    expect(pollers.hashContent("abc")).not.toBe(pollers.hashContent("abd"));
    expect(pollers.hashContent("a b")).not.toBe(pollers.hashContent("b a"));
  });

  it("withinDailyBudget: R-COST per-source cap", () => {
    expect(pollers.withinDailyBudget(49, 50)).toBe(true);
    expect(pollers.withinDailyBudget(50, 50)).toBe(false);
  });
});

describe("SLICE-P4-08 — claims.extract parsing (CAP-036, pure)", () => {
  it("parses a strict-JSON claims payload", () => {
    const raw = JSON.stringify({
      claims: [
        { claimText: "Revenue doubled.", claimType: "stat", evidenceText: "revenue doubled year over year", attributionRequired: false, confidence: 0.9 },
        { claimText: "\"We ship weekly.\"", claimType: "quote", evidenceText: "We ship weekly", confidence: 0.8 },
      ],
    });
    const claims = extract.parseClaimsResponse(raw);
    expect(claims).toHaveLength(2);
    expect(claims[1].attributionRequired).toBe(true); // quotes force attribution
  });

  it("rejects over-cap payloads (R-LIMIT) and malformed claims", () => {
    const over = JSON.stringify({ claims: Array.from({ length: 13 }, () => ({ claimText: "x", claimType: "fact", evidenceText: "y" })) });
    expect(() => extract.parseClaimsResponse(over)).toThrow(/cap/);
    const malformed = JSON.stringify({ claims: [{ claimType: "fact" }] });
    expect(() => extract.parseClaimsResponse(malformed)).toThrow(/malformed/);
  });
});

describe("SLICE-P4-08 — cluster.build eligibility (CAP-037, pure — the precision item)", () => {
  const claim = (id: string, domain: string, evidence = "the tool shipped version two with new pricing", extra: Partial<extract.ClusterInputClaim> = {}): extract.ClusterInputClaim => ({
    claimId: id,
    sourceDomain: domain,
    claimText: "Tool shipped v2",
    evidenceText: evidence,
    firstPartyAcknowledged: false,
    ...extra,
  });

  it("≥2 claims from ≥2 independent domains → eligible", () => {
    const d = extract.decideClusterEligibility([claim("a", "one.com"), claim("b", "two.org", "totally different wording about the same release")]);
    expect(d.eligible).toBe(true);
    expect(d.independentDomains.sort()).toEqual(["one.com", "two.org"].sort());
  });

  it("syndication collapse: near-identical evidence from two domains counts as ONE independent domain", () => {
    const d = extract.decideClusterEligibility([
      claim("a", "one.com"),
      claim("b", "syndicated.net", "the tool shipped version two with new pricing"), // identical evidence
    ]);
    expect(d.eligible).toBe(false);
    expect(d.independentDomains).toEqual(["one.com"]);
  });

  it("single-source clusters need first-party + operator ack", () => {
    const no = extract.decideClusterEligibility([claim("a", "one.com"), claim("b", "one.com", "different evidence text entirely here")]);
    expect(no.eligible).toBe(false);
    // the ack is source-level — the loader flags every claim of an acked source
    const yes = extract.decideClusterEligibility([
      claim("a", "one.com", "the tool shipped version two with new pricing", { firstPartyAcknowledged: true }),
      claim("b", "one.com", "different evidence text entirely here", { firstPartyAcknowledged: true }),
    ]);
    expect(yes.eligible).toBe(true);
    expect(yes.reason).toContain("first-party");
  });

  it("fewer than 2 claims never clusters", () => {
    expect(extract.decideClusterEligibility([claim("a", "one.com")]).eligible).toBe(false);
  });
});

describe("SLICE-P4-08 — module surface + api registration", () => {
  it("sources: listSources query, sourceUpsert + setTrustLevel mutations, validateSourceUrl action (Publisher per CAP-031)", () => {
    expect((sourcesModule.listSources as any).isQuery).toBe(true);
    expect((sourcesModule.sourceUpsert as any).isMutation).toBe(true);
    expect((sourcesModule.sourceUpsert as any).isPublic).toBe(true);
    expect((sourcesModule.setTrustLevel as any).isMutation).toBe(true);
    expect((sourcesModule.validateSourceUrl as any).isAction).toBe(true);
  });

  it("pollers: all three cron pollers + inbound webhook action are internal", () => {
    for (const fn of [pollers.pollRss, pollers.pollYouTube, pollers.pollRawFetch, pollers.ingestInboundEmail]) {
      expect((fn as any).isAction).toBe(true);
      expect((fn as any).isInternal).toBe(true);
    }
  });

  it("extract: claims.extract + cluster.build are internal actions", () => {
    for (const fn of [extract.extractClaims, extract.buildClusters]) {
      expect((fn as any).isAction).toBe(true);
      expect((fn as any).isInternal).toBe(true);
    }
  });

  it("no poller bypasses safeFetch: every URL fetch goes through the module (source-level guard)", () => {
    const pollersSrc = readFileSync(resolve(__dirname, "../../../../../../convex/ingest/pollers.ts"), "utf8");
    expect(pollersSrc).toContain("safeFetchText(");
    // the ONLY raw fetch is the YouTube Data API host — a named exception
    // (fixed API host, api-key scoped, still https); its URL literal sits
    // on the line after the call, so guard on the segment, not the line
    const segments = pollersSrc.split("await fetch(").slice(1);
    expect(segments).toHaveLength(1);
    expect(segments[0].slice(0, 300)).toContain("googleapis.com");
  });

  it("api.d.ts maps sources + ingest modules", () => {
    const apiDts = readFileSync(resolve(__dirname, "../../../../../../convex/_generated/api.d.ts"), "utf8");
    expect(apiDts).toContain("sources: typeof sources;");
    expect(apiDts).toContain('"ingest/pollers": typeof ingest_pollers;');
    expect(apiDts).toContain('"ingest/extract": typeof ingest_extract;');
  });
});
