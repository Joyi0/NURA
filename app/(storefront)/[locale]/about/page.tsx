import Link from "next/link";
import { notFound } from "next/navigation";
import { assetUrl } from "@/lib/shared/catalog";
import { aboutCopy, aboutImages } from "@/lib/storefront/about";
import { isLocale } from "@/lib/storefront/i18n";

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = aboutCopy(locale);

  return (
    <div className="about-page">
      <header className="about-hero">
        <img src={assetUrl(aboutImages.founder)} alt={copy.founder.title} />
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.intro}</p>
        </div>
      </header>

      <section className="about-band about-founder">
        <div>
          <span className="eyebrow">{copy.founder.kicker}</span>
          <h2>{copy.founder.title}</h2>
          <p>{copy.founder.text}</p>
          <p className="about-disclosure">{copy.founder.disclosure}</p>
        </div>
        <div className="about-portrait">
          <img src={assetUrl(aboutImages.founder)} alt={copy.founder.title} />
          <span>{copy.founder.disclosure}</span>
        </div>
      </section>

      <section className="about-band about-uae">
        <h2>{copy.uae.title}</h2>
        <p>{copy.uae.text}</p>
      </section>

      <section className="about-band">
        <div className="about-section-head">
          <h2>{copy.manufacturing.title}</h2>
          <p>{copy.manufacturing.text}</p>
        </div>
        <div className="process-grid">
          {copy.manufacturing.steps.map((step, index) => (
            <article key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step}</h3>
            </article>
          ))}
        </div>
        <div className="about-split">
          <img src={assetUrl(aboutImages.craft)} alt={copy.manufacturing.title} />
          <div>
            <h3>{copy.manufacturing.priceTitle}</h3>
            <p>{copy.manufacturing.priceText}</p>
            <small>{locale === "ar" ? "صورة فنية توضيحية لأسلوب العلامة" : "Art-directed brand process illustration"}</small>
          </div>
        </div>
      </section>

      <section className="about-band stone-education">
        <div className="about-section-head">
          <h2>{copy.stones.title}</h2>
        </div>
        <div className="stone-grid">
          <article><span className="stone-swatch diamond" /><h3>{copy.stones.labTitle}</h3><p>{copy.stones.labText}</p></article>
          <article><span className="stone-swatch moissanite" /><h3>{copy.stones.moissaniteTitle}</h3><p>{copy.stones.moissaniteText}</p></article>
          <article><span className="stone-swatch colored" /><h3>{copy.stones.coloredTitle}</h3><p>{copy.stones.coloredText}</p></article>
        </div>
      </section>

      <section className="about-band certificate-section">
        <div>
          <h2>{copy.certificate.title}</h2>
          <p>{copy.certificate.text}</p>
          <p className="muted">{copy.certificate.note}</p>
          <a className="btn secondary" href="https://www.igi.org/reports/lab-grown-diamond-report/" target="_blank" rel="noreferrer">
            {copy.certificate.verify}
          </a>
        </div>
        <div className="certificate-sample" aria-label={copy.certificate.sample}>
          <div className="certificate-watermark">{copy.certificate.sample}</div>
          <strong>NURA GEMSTONE EDUCATION</strong>
          <span>Report fields overview</span>
          <dl>
            <div><dt>Material</dt><dd>Laboratory-grown diamond</dd></div>
            <div><dt>Measurements</dt><dd>Example only</dd></div>
            <div><dt>Cut / Polish</dt><dd>Example only</dd></div>
            <div><dt>Report number</dt><dd>NOT ISSUED</dd></div>
          </dl>
        </div>
      </section>

      <section className="about-band impact-section">
        <img src={assetUrl(aboutImages.impact)} alt={copy.impact.title} />
        <div>
          <h2>{copy.impact.title}</h2>
          <p>{copy.impact.text}</p>
          <span className="impact-status">{copy.impact.status}</span>
        </div>
      </section>

      <section className="about-band reference-section">
        <h2>{copy.sources}</h2>
        <p>{copy.sourceNote}</p>
        <div className="reference-links">
          <Link href="https://www.gia.edu/gia-news-research/difference-between-natural-laboratory-grown-diamonds" target="_blank">GIA: Natural and laboratory-grown diamonds</Link>
          <Link href="https://www.igi.org/reports/lab-grown-diamond-report/" target="_blank">IGI: Laboratory-grown diamond reports</Link>
        </div>
      </section>
    </div>
  );
}
