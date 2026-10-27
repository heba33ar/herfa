"use client";

import { useMemo, useState } from "react";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState, Modal, Notice } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PageHeader, Tabs } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useHirfa } from "@/lib/store";
import { useLocale, useMyStore, useT } from "@/lib/store/hooks";
import { formatDate, todayIso } from "@/lib/format";
import { townName } from "@/lib/data/towns";
import type { AnnouncementCategory } from "@/lib/types";

const CATEGORIES: AnnouncementCategory[] = [
  "looking_for",
  "offering",
  "collaboration",
  "workshop",
];

const TONE: Record<AnnouncementCategory, React.ComponentProps<typeof Badge>["tone"]> = {
  looking_for: "info",
  offering: "success",
  collaboration: "plum",
  workshop: "gold",
};

export default function SellerBoardPage() {
  const t = useT();
  const locale = useLocale();
  const toast = useToast();
  const store = useMyStore();

  const announcements = useHirfa((s) => s.announcements);
  const publish = useHirfa((s) => s.publishAnnouncement);
  const remove = useHirfa((s) => s.deleteAnnouncement);

  const [tab, setTab] = useState<AnnouncementCategory | "all">("all");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    category: "looking_for" as AnnouncementCategory,
    body: "",
    expiresAt: "",
  });

  const visible = useMemo(
    () =>
      announcements
        .filter((a) => !a.hidden)
        .filter((a) => !a.expiresAt || a.expiresAt >= todayIso())
        .filter((a) => tab === "all" || a.category === tab)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [announcements, tab],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("board.title")}
        description={t("board.desc")}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            {t("board.newPost")}
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "all" as const, label: t("common.all"), count: announcements.filter((a) => !a.hidden).length },
          ...CATEGORIES.map((c) => ({
            value: c,
            label: t(`announcement.${c}`),
            count: announcements.filter((a) => !a.hidden && a.category === c).length,
          })),
        ]}
      />

      {visible.length === 0 ? (
        <EmptyState icon={Megaphone} title={t("board.empty")} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {visible.map((post) => (
            <li key={post.id}>
              <Card className="h-full">
                <CardBody className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Badge tone={TONE[post.category]}>{t(`announcement.${post.category}`)}</Badge>
                    {post.authorStoreId === store?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-sand-500"
                        onClick={() => {
                          remove(post.id);
                          toast(t("common.delete"), "info");
                        }}
                        aria-label={t("common.delete")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>

                  <h3 className="mt-3 text-base font-bold text-sand-900">{post.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-sand-700">{post.body}</p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-sand-200 pt-3 text-xs text-sand-600">
                    <span className="font-semibold text-sand-800">{post.authorName}</span>
                    <span>
                      {townName(post.townId, locale)} · {formatDate(post.createdAt, locale)}
                    </span>
                  </div>

                  {post.expiresAt && (
                    <p className="mt-1.5 text-xs text-sand-500">
                      {t("board.expiresAt")}: {formatDate(post.expiresAt, locale)}
                    </p>
                  )}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("board.newPost")}
        description={t("board.desc")}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!draft.title.trim() || !draft.body.trim()}
              onClick={() => {
                publish({
                  title: draft.title.trim(),
                  category: draft.category,
                  body: draft.body.trim(),
                  expiresAt: draft.expiresAt || undefined,
                });
                setOpen(false);
                setDraft({ title: "", category: "looking_for", body: "", expiresAt: "" });
                toast(t("board.publish"), "success");
              }}
            >
              {t("board.publish")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label={t("board.postTitle")} required>
            {(id) => (
              <Input
                id={id}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="مثلًا: بدور على مصوّرة منتجات"
              />
            )}
          </Field>

          <Field label={t("board.postCategory")}>
            {(id) => (
              <Select
                id={id}
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value as AnnouncementCategory })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`announcement.${c}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label={t("board.postBody")} required>
            {(id) => (
              <Textarea
                id={id}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
            )}
          </Field>

          <Field label={t("board.expiresAt")}>
            {(id) => (
              <Input
                id={id}
                type="date"
                value={draft.expiresAt}
                onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })}
              />
            )}
          </Field>

          <Notice tone="neutral">
            الإدارة بتراقب المحتوى وبتقدر تخفي أي إعلان مخالف للشروط.
          </Notice>
        </div>
      </Modal>
    </div>
  );
}
