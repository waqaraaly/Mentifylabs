import type { Practitioner } from "@/types/practitioner";
import { siteConfig } from "@/lib/site";

export function StructuredData({ practitioner }: { practitioner: Practitioner }) {
  const profileUrl = `${siteConfig.url}/${practitioner.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${profileUrl}#person`,
        name: practitioner.fullName,
        jobTitle: practitioner.professionalTitle,
        description: practitioner.bio,
        url: profileUrl,
        image: practitioner.photoUrl,
        knowsLanguage: practitioner.languages,
        sameAs: [
          ...practitioner.socialLinks.map((link) => link.url),
          ...(practitioner.websiteUrl ? [practitioner.websiteUrl] : []),
        ],
        address: practitioner.location
          ? { "@type": "PostalAddress", addressLocality: practitioner.location }
          : undefined,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: practitioner.fullName,
            item: profileUrl,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Escape "<" so no embedded content can break out of the script tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
