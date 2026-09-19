import Link from "next/link";

export type PolicySection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalPageProps = {
  title: string;
  eyebrow: string;
  lastUpdated: string;
  intro: string[];
  sections: PolicySection[];
};

export default function LegalPage({
  title,
  eyebrow,
  lastUpdated,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <div>
      <section className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            {" / "}
            {eyebrow}
          </p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-none">
            {title}
          </h1>
          <p className="text-gray-400 text-sm mt-6">Last Updated: {lastUpdated}</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="space-y-5 text-gray-600 leading-relaxed mb-12">
          {intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title} className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-black uppercase tracking-tight mb-4">
                {section.title}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="text-gray-600 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="list-disc pl-5 space-y-2 text-gray-600 leading-relaxed">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
