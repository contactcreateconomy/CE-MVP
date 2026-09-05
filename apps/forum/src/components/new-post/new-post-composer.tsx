"use client";

import { useMutation } from "convex/react";
import type { ComponentType, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Briefcase,
  GitCompare,
  Heading2,
  HelpCircle,
  Italic,
  LayoutList,
  Link2,
  List,
  Lock,
  Newspaper,
  Quote,
  Rocket,
  Save,
  Send,
  Sparkles,
  Star,
  Swords,
  Underline as UnderlineIcon,
} from "lucide-react";

import { COMPOSE_PUBLISH_BTN_ID } from "@/components/compose/compose-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ImageUploader } from "@/components/ui/image-uploader";
import { api } from "@/lib/convex";
import {
  NEW_POST_DRAFT_STORAGE_KEY,
  categoryEditorPlaceholders,
  categoryScaffoldHtml,
  categoryWritingHints,
  isEditorDocumentBare,
  type NewPostDraftPayload,
} from "@/lib/new-post/category-composer-fields";
import { cn } from "@/lib/utils";
import { signalNavigationStart } from "@/providers/navigation-progress-provider";
import { MEMBER_COMPOSABLE_CATEGORY_KEYS, type Category, type CategoryKey } from "@/types";
import { useAuth } from "@cemvp/auth-ui";
import { isConvexConfigured } from "@cemvp/convex-client";

const categoryIconMap: Record<CategoryKey, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  news: Newspaper,
  review: Star,
  compare: GitCompare,
  "launch-pad": Rocket,
  debate: Swords,
  qa: HelpCircle,
  spark: Sparkles,
  list: LayoutList,
  showcase: Sparkles,
  gigs: Briefcase,
};

function CategoryLucideIcon({
  categoryKey,
  className,
  strokeWidth = 2.5,
}: {
  categoryKey: CategoryKey;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = categoryIconMap[categoryKey] ?? LayoutList;
  return <Icon className={className} strokeWidth={strokeWidth} />;
}

interface NewPostComposerProps {
  categories: Category[];
}

function MenuBtn({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md text-(--text-secondary) transition-colors hover:bg-(--bg-overlay) hover:text-(--text-primary)",
        active && "bg-(--bg-overlay) text-(--text-primary)",
      )}
    >
      {children}
    </button>
  );
}

function setTipTapPlaceholder(editor: NonNullable<ReturnType<typeof useEditor>>, text: string) {
  const ext = editor.extensionManager.extensions.find((e) => e.name === "placeholder");
  if (ext && typeof ext === "object" && "options" in ext && ext.options && typeof ext.options === "object") {
    (ext.options as { placeholder: string }).placeholder = text;
  }
  editor.view.dispatch(editor.state.tr);
}

export function NewPostComposer({ categories }: NewPostComposerProps) {
  const router = useRouter();
  const { authStatus, openAuthModal } = useAuth();
  const createPost = useMutation(api.forum.mutations.createPost);
  // Member-composable types only: news is platform-injected (CAP-086/W2-E1);
  // launch-pad/gigs hidden until the admin DAU flip (CAP-104).
  const composableCategories = useMemo(
    () => categories.filter((c) => MEMBER_COMPOSABLE_CATEGORY_KEYS.includes(c.key)),
    [categories],
  );
  const defaultCategory = useMemo(
    () => composableCategories.find((c) => !c.lockedByDefault)?.key ?? composableCategories[0]?.key ?? "review",
    [composableCategories],
  );
  const [categoryKey, setCategoryKey] = useState<CategoryKey>(defaultCategory);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [categoryFields, setCategoryFields] = useState<Record<string, unknown>>({});
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  const draftRestoredRef = useRef(false);
  const publishingRef = useRef(false);
  const titleRef = useRef(title);
  titleRef.current = title;
  const prevCategoryForScaffoldRef = useRef<CategoryKey | null>(null);
  const categoryRowRef = useRef<HTMLDivElement>(null);
  const categoryBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [categoryIndicator, setCategoryIndicator] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 40,
    visible: false,
  });

  const updateCategoryIndicator = useCallback(() => {
    const row = categoryRowRef.current;
    if (!row) return;
    const btn = categoryBtnRefs.current.get(categoryKey);
    if (!btn) return;
    setCategoryIndicator({
      left: btn.offsetLeft,
      top: btn.offsetTop,
      width: btn.offsetWidth,
      height: btn.offsetHeight,
      visible: true,
    });
  }, [categoryKey]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { HTMLAttributes: { class: "list-disc pl-6 my-3" } },
        orderedList: { HTMLAttributes: { class: "list-decimal pl-6 my-3" } },
        blockquote: {
          HTMLAttributes: {
            class: "border-l-2 border-(--border-prominent) pl-4 my-4 italic text-(--text-secondary)",
          },
        },
      }),
      Underline,
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "text-(--brand-primary) underline underline-offset-2" },
      }),
      Placeholder.configure({
        placeholder: categoryEditorPlaceholders[defaultCategory],
      }),
    ],
    content: "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "new-post-prose tiptap focus:outline-hidden min-h-[50vh] max-w-none text-lg leading-[1.8] text-(--text-primary)",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    setTipTapPlaceholder(editor, categoryEditorPlaceholders[categoryKey] ?? "");
  }, [categoryKey, editor]);

  useEffect(() => {
    if (!editor) return;
    const prev = prevCategoryForScaffoldRef.current;
    if (prev !== null && prev !== categoryKey && isEditorDocumentBare(editor.getHTML(), editor.getText())) {
      editor.commands.setContent(categoryScaffoldHtml(categoryKey));
    }
    prevCategoryForScaffoldRef.current = categoryKey;
  }, [categoryKey, editor]);

  useEffect(() => {
    if (!editor || draftRestoredRef.current) return;
    try {
      const raw = localStorage.getItem(NEW_POST_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as NewPostDraftPayload & { categoryFields?: Record<string, unknown>; coverImage?: string };
      if (!parsed || typeof parsed.editorHtml !== "string") return;
      if (titleRef.current.trim() !== "" || editor.getText().trim() !== "") return;
      draftRestoredRef.current = true;
      if (parsed.categoryKey && composableCategories.some((c) => c.key === parsed.categoryKey)) {
        setCategoryKey(parsed.categoryKey);
      }
      setTitle(typeof parsed.title === "string" ? parsed.title : "");
      setSummary(typeof parsed.summary === "string" ? parsed.summary : "");
      if (parsed.coverImage) setCoverImage(parsed.coverImage);
      if (parsed.categoryFields && typeof parsed.categoryFields === "object") {
        setCategoryFields(parsed.categoryFields);
      }
      editor.commands.setContent(parsed.editorHtml || "<p></p>");
      showToast("Draft restored");
    } catch {
      /* ignore corrupt draft */
    }
  }, [composableCategories, editor, showToast]);

  useLayoutEffect(() => {
    if (!editor) return;
    updateCategoryIndicator();
  }, [updateCategoryIndicator, composableCategories, editor]);

  useEffect(() => {
    if (!editor) return;
    const row = categoryRowRef.current;
    if (!row) return;
    const ro = new ResizeObserver(() => {
      updateCategoryIndicator();
    });
    ro.observe(row);
    window.addEventListener("resize", updateCategoryIndicator);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateCategoryIndicator);
    };
  }, [updateCategoryIndicator, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const saveDraft = useCallback(() => {
    if (!editor) return;
    const payload = {
      categoryKey,
      title,
      summary,
      editorHtml: editor.getHTML(),
      updatedAt: Date.now(),
      categoryFields,
      coverImage,
    };
    try {
      localStorage.setItem(NEW_POST_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      showToast("Draft saved");
    } catch {
      showToast("Could not save draft.");
    }
  }, [categoryKey, categoryFields, coverImage, editor, showToast, summary, title]);

  const handlePublish = useCallback(async () => {
    if (publishingRef.current) return;
    if (!isConvexConfigured()) {
      showToast("Convex is not configured.");
      return;
    }
    if (authStatus !== "authenticated") {
      openAuthModal();
      return;
    }
    if (!title.trim()) {
      showToast("Add a title before publishing.");
      return;
    }
    const bodyText = editor?.getText().trim() ?? "";
    if (!bodyText) {
      showToast("Write something in the body before publishing.");
      return;
    }
    const bodyHtml = editor?.getHTML().trim() ?? "";
    const body = bodyHtml || `<p>${bodyText}</p>`;
    publishingRef.current = true;
    try {
      await createPost({
        title: title.trim(),
        summary: summary.trim() || title.trim().slice(0, 160),
        body,
        category: categoryKey,
        categoryFields,
        coverImage,
      });
      try {
        localStorage.removeItem(NEW_POST_DRAFT_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      showToast("Published.");
      signalNavigationStart();
      router.push("/feed");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not publish.");
    } finally {
      publishingRef.current = false;
    }
  }, [
    authStatus,
    categoryFields,
    categoryKey,
    createPost,
    coverImage,
    editor,
    openAuthModal,
    router,
    showToast,
    summary,
    title,
  ]);

  const writingHint = categoryWritingHints[categoryKey];

  return (
    <>
      <button
        id={COMPOSE_PUBLISH_BTN_ID}
        type="button"
        tabIndex={-1}
        className="sr-only"
        aria-hidden
        onClick={() => void handlePublish()}
      >
        Publish
      </button>

      {!editor ? (
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-(--text-muted)">Loading editor…</div>
      ) : (
        <div className="animate-route-emerge w-full pb-8">
          <Card className="mb-6 animate-soft-float">
            <CardHeader className="p-3 pb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Category</h2>
            </CardHeader>
            <CardContent className="relative p-3 pt-0">
              <div className="-mx-1 pb-0.5" aria-label="Post category">
                <div ref={categoryRowRef} className="relative flex flex-wrap gap-1 rounded-menu p-1">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute z-0 rounded-full border border-(--border-active)/70 bg-(--bg-overlay)/55 transition-[left,width,top,height,opacity] duration-slow ease-out dark:shadow-glow-primary-sm"
                    style={{
                      left: categoryIndicator.left,
                      top: categoryIndicator.top,
                      width: categoryIndicator.width,
                      height: categoryIndicator.height,
                      opacity: categoryIndicator.visible ? 1 : 0,
                    }}
                  />
                  {composableCategories.map((cat) => {
                    const selected = cat.key === categoryKey;
                    const locked = cat.lockedByDefault;
                    return (
                      <button
                        key={cat.key}
                        ref={(el) => {
                          if (el) categoryBtnRefs.current.set(cat.key, el);
                          else categoryBtnRefs.current.delete(cat.key);
                        }}
                        type="button"
                        disabled={locked}
                        title={
                          locked && cat.pointsToUnlock != null
                            ? `Unlock at ${cat.pointsToUnlock} reputation points`
                            : cat.description
                        }
                        onClick={() => {
                          if (!locked) {
                            setCategoryKey(cat.key);
                          }
                        }}
                        className={cn(
                          "relative z-10 inline-flex h-10 shrink-0 items-center gap-2.5 rounded-full px-3 text-sm font-semibold transition-colors duration-normal outline-offset-2 focus-visible:ring-2 focus-visible:ring-(--border-active) focus-visible:ring-offset-2 focus-visible:ring-offset-(--bg-surface)",
                          locked && "cursor-not-allowed opacity-40",
                          !locked && "hover:bg-(--bg-overlay)/55",
                        )}
                        style={{
                          color: selected ? "var(--brand-primary)" : "var(--text-primary)",
                        }}
                      >
                        <CategoryLucideIcon
                          categoryKey={cat.key}
                          className={cn("h-4 w-4 shrink-0", selected && "scale-105")}
                          strokeWidth={2.5}
                        />
                        <span>{cat.name}</span>
                        {locked ? <Lock className="h-3.5 w-3.5 text-(--text-muted)" aria-hidden /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <input
            aria-label="Post title"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-3 w-full border-0 bg-transparent text-4xl font-bold leading-[1.15] tracking-tight text-(--text-primary) outline-hidden placeholder:text-(--text-muted)/70 md:text-[2.75rem]"
          />

          <input
            aria-label="Subtitle or summary"
            placeholder="Optional subtitle"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="mb-6 w-full border-0 bg-transparent text-xl font-normal leading-snug text-(--text-secondary) outline-hidden placeholder:text-(--text-muted)/65 md:text-2xl"
          />

          <div className="mb-6">
            <ImageUploader
              onUploadComplete={setCoverImage}
              onClear={() => setCoverImage(undefined)}
              value={coverImage}
              aspectRatio="16/9"
              className="mb-2"
            />
            <details className="text-xs text-(--text-muted)">
              <summary className="cursor-pointer hover:text-(--text-secondary)">Or paste a URL</summary>
              <input
                type="url"
                placeholder="https://example.com/image.png"
                value={coverImage ?? ""}
                onChange={(e) => setCoverImage(e.target.value || undefined)}
                className="mt-1.5 w-full rounded-lg border border-(--border-default) bg-(--bg-surface) px-3 py-1.5 text-sm text-(--text-primary) outline-hidden focus:border-(--border-active)"
              />
            </details>
          </div>

          <div className="mb-8 border-b border-(--border-subtle)" />

          <p className="mb-3 text-sm leading-relaxed text-(--text-muted)">{writingHint}</p>

          <div className="relative">
            <BubbleMenu
              editor={editor}
              className="flex items-center gap-0.5 rounded-lg border border-(--border-default) bg-(--bg-surface-elevated) px-1 py-1 shadow-(--shadow-md)"
            >
              <MenuBtn
                label="Bold"
                active={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
              >
                <Bold className="h-4 w-4" />
              </MenuBtn>
              <MenuBtn
                label="Italic"
                active={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
              >
                <Italic className="h-4 w-4" />
              </MenuBtn>
              <MenuBtn
                label="Underline"
                active={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
              >
                <UnderlineIcon className="h-4 w-4" />
              </MenuBtn>
              <span className="mx-1 h-5 w-px bg-(--border-default)" aria-hidden />
              <MenuBtn
                label="Heading"
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <Heading2 className="h-4 w-4" />
              </MenuBtn>
              <MenuBtn
                label="Bullet list"
                active={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List className="h-4 w-4" />
              </MenuBtn>
              <MenuBtn
                label="Quote"
                active={editor.isActive("blockquote")}
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <Quote className="h-4 w-4" />
              </MenuBtn>
              <MenuBtn label="Link" active={editor.isActive("link")} onClick={setLink}>
                <Link2 className="h-4 w-4" />
              </MenuBtn>
            </BubbleMenu>
            <EditorContent editor={editor} />
          </div>

          {(() => {
            // Typed compose forms archived 2026-08-31 — per-type extension fields
            // are specified at /compose/[type] (CONTRACT-2), not the legacy inline flow.
            void categoryFields;
            return null;
          })()}
        </div>
      )}

      {editor ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-(--border-subtle) bg-(--bg-canvas)/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-sm"
          role="toolbar"
          aria-label="Draft and publish"
        >
          <div className="mx-auto flex h-12 w-full max-w-[720px] items-center justify-end gap-2 px-4 md:px-6">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 rounded-full px-3 text-(--text-secondary) hover:text-(--text-primary)"
              onClick={saveDraft}
              aria-label="Save draft"
            >
              <Save className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="h-10 rounded-full px-4 font-semibold"
              onClick={() => void handlePublish()}
              aria-label="Publish"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-full border border-(--border-default) bg-(--bg-surface-elevated) px-4 py-2 text-center text-sm text-(--text-primary) shadow-(--shadow-lg)"
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
