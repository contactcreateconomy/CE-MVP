"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results are untyped at the client edge */

/**
 * Route: /admin/affiliate-inventory — SLICE-P4-12 (CAP-539/540/541/544/545).
 * Dense config panel (§12.4): the entity → relationship → link FK chain with
 * parent-gated creation (contract state B — UI side; the mutations reject
 * orphans server-side) and CAP-545 soft-deactivate confirm modals (never a
 * hard delete; cascades downward). Logo upload consumes P4-02's CAP-012
 * generateUploadUrl (forum/mutations — reuse, no fork).
 */

import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, Upload } from "lucide-react";

import { api } from "../../../../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SkeletonText } from "@/components/ui/skeleton";
import { Toast } from "@/components/ui/toast";

const ENTITY_TYPES = ["vendor", "brand", "publisher", "internal"] as const;
const COMMISSION_MODELS = ["cpa", "cps", "cpc", "revshare", "flat", "other"] as const;
const DISCLOSURE_CLASSES = ["sponsored", "affiliate", "paid"] as const;

const inputCls = "w-full rounded-lg border border-(--border-default) bg-(--bg-surface) px-3 py-2 text-sm text-(--text-primary) outline-hidden focus:border-(--border-active)";

export default function AdminAffiliateInventoryPage() {
  const inventory = useQuery(api.affiliateInventory.listInventory, {});
  const entityUpsert = useMutation(api.affiliateInventory.entityUpsert);
  const relationshipUpsert = useMutation(api.affiliateInventory.relationshipUpsert);
  const linkUpsert = useMutation(api.affiliateInventory.linkUpsert);
  const deactivate = useMutation(api.affiliateInventory.deactivate);
  const getUploadUrl = useMutation(api.forum.mutations.generateUploadUrl); // CAP-012 (P4-02 — reuse, no fork)

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);

  // entity dialog
  const [entityOpen, setEntityOpen] = useState(false);
  const [entityForm, setEntityForm] = useState<any>(null); // null = closed; {id?, name, entityType, websiteUrl, logoAssetId?}
  const logoInputRef = useRef<HTMLInputElement>(null);

  // relationship dialog
  const [relOpen, setRelOpen] = useState(false);
  const [relForm, setRelForm] = useState<any>(null); // {id?, commercialEntityId, toolId?, network, programName, relationshipStatus, commissionModel, cookieWindow}

  // link dialog
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkForm, setLinkForm] = useState<any>(null); // {id?, affiliateRelationshipId, toolId?, url, disclosureClass}

  // deactivate confirm
  const [deactTarget, setDeactTarget] = useState<any>(null); // {targetType, targetId, label}

  const run = async (fn: () => Promise<unknown>, message: string) => {
    setError(null);
    try {
      await fn();
      setToast({ message });
      setEntityOpen(false); setRelOpen(false); setLinkOpen(false); setDeactTarget(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const uploadLogo = async (file: File) => {
    // CAP-012 consume — P4-02's generateUploadUrl (no fork)
    const uploadUrl = await getUploadUrl({});
    const res = await fetch(uploadUrl, { method: "POST", body: file });
    if (!res.ok) throw new Error(`logo upload failed (${res.status})`);
    const { storageId } = (await res.json()) as { storageId: string };
    return storageId;
  };

  const rows = (inventory as any[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-(--text-primary)">Affiliate inventory</h1>
          <p className="text-xs text-(--text-muted)">
            Entity → relationship → link. Deactivation is soft and cascades downward; published posts keep their links (FUTURE-M2-01).
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setEntityForm({ name: "", entityType: "vendor", websiteUrl: "" }); setEntityOpen(true); }}>
          <Plus className="size-4" /> New entity
        </Button>
      </div>

      {error ? <Banner variant="error">{error}</Banner> : null}
      {toast ? <Toast variant="success" message={toast.message} onDismiss={() => setToast(null)} /> : null}

      {inventory === undefined ? (
        <SkeletonText className="w-full" />
      ) : rows.length === 0 ? (
        <Card><CardContent className="p-6 text-sm text-(--text-muted)">
          No commercial entities yet — create one to start the chain (relationships and links are parent-gated).
        </CardContent></Card>
      ) : (
        rows.map((e) => (
          <Card key={e._id}>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-(--text-primary)">{e.name}</span>
                <Badge tone="neutral">{e.entityType}</Badge>
                <Badge tone={e.status === "active" ? "success" : "error"}>{e.status}</Badge>
                <span className="text-xs text-(--text-muted)">{e.websiteUrl}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEntityForm({ id: e._id, name: e.name, entityType: e.entityType, websiteUrl: e.websiteUrl, logoAssetId: e.logoAssetId ?? undefined }); setEntityOpen(true); }}>Edit</Button>
                {e.status === "active" ? (
                  <Button variant="destructive" size="sm" onClick={() => setDeactTarget({ targetType: "entity", targetId: e._id, label: `${e.name} (+ its relationships and links)` })}>Deactivate</Button>
                ) : null}
                <Button variant="secondary" size="sm" disabled={e.status !== "active"} onClick={() => { setRelForm({ commercialEntityId: e._id, network: "", programName: "", relationshipStatus: "active", commissionModel: "cps", cookieWindow: 30 }); setRelOpen(true); }}>
                  <Plus className="size-4" /> Relationship
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {(e.relationships as any[]).length === 0 ? (
                <p className="text-xs text-(--text-muted)">No relationships.</p>
              ) : (
                (e.relationships as any[]).map((r: any) => (
                  <div key={r._id} className="rounded-lg border border-(--border-subtle) p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-(--text-primary)">{r.programName}</span>
                        <Badge tone="neutral">{r.network}</Badge>
                        <Badge tone={r.relationshipStatus === "active" ? "success" : r.relationshipStatus === "paused" ? "warning" : "error"}>{r.relationshipStatus}</Badge>
                        <span className="text-xs text-(--text-muted)">{r.commissionModel} · {r.cookieWindow}d{r.toolId ? ` · tool ${r.toolId}` : ""}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setRelForm({ id: r._id, commercialEntityId: e._id, toolId: r.toolId ?? "", network: r.network, programName: r.programName, relationshipStatus: r.relationshipStatus, commissionModel: r.commissionModel, cookieWindow: r.cookieWindow }); setRelOpen(true); }}>Edit</Button>
                        {r.relationshipStatus !== "terminated" ? (
                          <Button variant="destructive" size="sm" onClick={() => setDeactTarget({ targetType: "relationship", targetId: r._id, label: `${r.programName} (+ its links)` })}>Deactivate</Button>
                        ) : null}
                        <Button variant="secondary" size="sm" disabled={r.relationshipStatus !== "active"} onClick={() => { setLinkForm({ affiliateRelationshipId: r._id, toolId: r.toolId ?? "", url: "", disclosureClass: "affiliate" }); setLinkOpen(true); }}>
                          <Plus className="size-4" /> Link
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      {(r.links as any[]).map((l: any) => (
                        <div key={l._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-(--bg-surface) px-2 py-1.5">
                          <div className="flex min-w-0 items-center gap-2">
                            <Badge tone={l.status === "active" ? "success" : "error"}>{l.status}</Badge>
                            <Badge tone="neutral">{l.disclosureClass}</Badge>
                            <span className="truncate text-xs text-(--text-secondary)">{l.url}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setLinkForm({ id: l._id, affiliateRelationshipId: r._id, toolId: l.toolId ?? "", url: l.url, disclosureClass: l.disclosureClass }); setLinkOpen(true); }}>Edit</Button>
                            {l.status === "active" ? (
                              <Button variant="destructive" size="sm" onClick={() => setDeactTarget({ targetType: "link", targetId: l._id, label: l.url })}>Deactivate</Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* CAP-539 entity dialog (logo via CAP-012) */}
      <Dialog open={entityOpen} onOpenChange={setEntityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{entityForm?.id ? "Edit entity" : "New commercial entity"}</DialogTitle>
            <DialogDescription>Status changes go through Deactivate (CAP-545), never this form.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input placeholder="Name" value={entityForm?.name ?? ""} onChange={(ev) => setEntityForm({ ...entityForm, name: ev.target.value })} />
            <select className={inputCls} value={entityForm?.entityType ?? "vendor"} onChange={(ev) => setEntityForm({ ...entityForm, entityType: ev.target.value })}>
              {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <Input placeholder="https://website.example" value={entityForm?.websiteUrl ?? ""} onChange={(ev) => setEntityForm({ ...entityForm, websiteUrl: ev.target.value })} />
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (ev) => {
                const file = ev.target.files?.[0];
                if (!file) return;
                try {
                  const storageId = await uploadLogo(file);
                  setEntityForm({ ...entityForm, logoAssetId: storageId });
                  setToast({ message: "Logo uploaded" });
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            />
            <Button variant="ghost" size="sm" onClick={() => logoInputRef.current?.click()}>
              <Upload className="size-4" /> {entityForm?.logoAssetId ? "Replace logo" : "Upload logo (CAP-012)"}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEntityOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!entityForm?.name?.trim() || !entityForm?.websiteUrl?.trim()}
              onClick={() => void run(() => entityUpsert({
                entityId: entityForm.id ?? undefined,
                name: entityForm.name, entityType: entityForm.entityType, websiteUrl: entityForm.websiteUrl,
                logoAssetId: entityForm.logoAssetId ?? undefined,
              }), "Entity saved")}>
              Save entity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CAP-540 relationship dialog */}
      <Dialog open={relOpen} onOpenChange={setRelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{relForm?.id ? "Edit relationship" : "New relationship"}</DialogTitle>
            <DialogDescription>The parent entity must exist — child-without-parent is rejected server-side.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input placeholder="Network (e.g. PartnerStack)" value={relForm?.network ?? ""} onChange={(ev) => setRelForm({ ...relForm, network: ev.target.value })} />
            <Input placeholder="Program name" value={relForm?.programName ?? ""} onChange={(ev) => setRelForm({ ...relForm, programName: ev.target.value })} />
            <Input placeholder="Tool id (optional binding)" value={relForm?.toolId ?? ""} onChange={(ev) => setRelForm({ ...relForm, toolId: ev.target.value || undefined })} />
            <div className="grid grid-cols-2 gap-2">
              <select className={inputCls} value={relForm?.relationshipStatus ?? "active"} onChange={(ev) => setRelForm({ ...relForm, relationshipStatus: ev.target.value })}>
                {["active", "paused", "terminated"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className={inputCls} value={relForm?.commissionModel ?? "cps"} onChange={(ev) => setRelForm({ ...relForm, commissionModel: ev.target.value })}>
                {COMMISSION_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <Input type="number" placeholder="Cookie window (days)" value={relForm?.cookieWindow ?? 30} onChange={(ev) => setRelForm({ ...relForm, cookieWindow: Number(ev.target.value) })} />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setRelOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!relForm?.network?.trim() || !relForm?.programName?.trim()}
              onClick={() => void run(() => relationshipUpsert({
                relationshipId: relForm.id ?? undefined,
                commercialEntityId: relForm.commercialEntityId,
                toolId: relForm.toolId ?? undefined,
                network: relForm.network, programName: relForm.programName,
                relationshipStatus: relForm.relationshipStatus, commissionModel: relForm.commissionModel,
                cookieWindow: relForm.cookieWindow,
              }), "Relationship saved")}>
              Save relationship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CAP-541 link dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{linkForm?.id ? "Edit link" : "New affiliate link"}</DialogTitle>
            <DialogDescription>HTTPS-only, no credentials (E3 discipline). Injection verifies active status at inject time (CAP-049).</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input placeholder="https://affiliate.example/offer" value={linkForm?.url ?? ""} onChange={(ev) => setLinkForm({ ...linkForm, url: ev.target.value })} />
            <Input placeholder="Tool id (optional)" value={linkForm?.toolId ?? ""} onChange={(ev) => setLinkForm({ ...linkForm, toolId: ev.target.value || undefined })} />
            <select className={inputCls} value={linkForm?.disclosureClass ?? "affiliate"} onChange={(ev) => setLinkForm({ ...linkForm, disclosureClass: ev.target.value })}>
              {DISCLOSURE_CLASSES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setLinkOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={!linkForm?.url?.trim()}
              onClick={() => void run(() => linkUpsert({
                linkId: linkForm.id ?? undefined,
                affiliateRelationshipId: linkForm.affiliateRelationshipId,
                toolId: linkForm.toolId ?? undefined,
                url: linkForm.url, disclosureClass: linkForm.disclosureClass,
              }), "Link saved")}>
              Save link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CAP-545 confirm — soft, cascading, never a hard delete */}
      <Dialog open={deactTarget !== null} onOpenChange={(o) => !o && setDeactTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate {deactTarget?.targetType}?</DialogTitle>
            <DialogDescription>
              Soft status flip that cascades downward: {deactTarget?.label}. Already-published posts keep their links (FUTURE-M2-01).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDeactTarget(null)}>Cancel</Button>
            <Button variant="destructive" size="sm"
              onClick={() => void run(() => deactivate({ targetType: deactTarget.targetType, targetId: deactTarget.targetId }), "Deactivated (cascade applied)")}>
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
