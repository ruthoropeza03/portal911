"use client";

import SocialEmbed from "./SocialEmbed";

const parrafoClasses =
  "noticia-parrafo mb-3 text-justify indent-4 sm:indent-8 px-1 sm:px-0 leading-[1.5] text-gray-800 text-[0.9375rem] sm:text-base";

/**
 * @param {{ blocks: Array<{ t: string, text?: string, url?: string }> }} props
 */
export default function NoticiaContenido({ blocks }) {
  if (!blocks?.length) {
    return null;
  }

  return (
    <div className="noticia-cuerpo w-full max-w-3xl mx-auto leading-[1.5] min-w-0">
      {blocks.map((b, i) => {
        if (b.t === "p") {
          return (
            <p key={i} className={parrafoClasses}>
              {b.text}
            </p>
          );
        }
        if (b.t === "e" && b.url) {
          return <SocialEmbed key={i} url={b.url} />;
        }
        if (b.t === "gap") {
          return <div key={i} className="h-3" aria-hidden />;
        }
        return null;
      })}
    </div>
  );
}
