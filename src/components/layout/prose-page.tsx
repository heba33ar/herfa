import { PageHeader } from "@/components/ui/misc";

export interface Section {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

/** Shared layout for the policy and information pages. */
export function ProsePage({
  title,
  description,
  updated,
  sections,
}: {
  title: string;
  description?: string;
  updated?: string;
  sections: Section[];
}) {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <PageHeader title={title} description={description} />
        {updated && <p className="mt-3 text-xs text-sand-500">آخر تحديث: {updated}</p>}

        <div className="mt-10 space-y-10">
          {sections.map((section, index) => (
            <section key={section.heading}>
              <div className="flex items-baseline gap-3">
                <span className="section-index">{String(index + 1).padStart(2, "0")}</span>
                <h2 className="text-lg font-bold tracking-tight text-sand-900">
                  {section.heading}
                </h2>
              </div>
              <div className="rule-diamond mt-3" />

              <div className="mt-4 space-y-3.5">
                {section.paragraphs.map((paragraph, i) => (
                  <p key={i} className="text-sm leading-[1.9] text-sand-700">
                    {paragraph}
                  </p>
                ))}
                {section.list && (
                  <ul className="mt-3 space-y-2">
                    {section.list.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-sand-700">
                        <span className="mt-2 size-1.5 shrink-0 rotate-45 bg-plum-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
