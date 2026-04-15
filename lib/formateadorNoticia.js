/**
 * Contenido almacenado en `news.content`:
 * - Nuevo: JSON { v: 1, raw, blocks }
 * - Legado: texto plano (se interpreta al vuelo)
 */

const NOTICIA_VERSION = 1;

function limpiarUrl(url) {
  const s = String(url).trim();
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (host.includes("youtube.com") && u.pathname.startsWith("/watch")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/watch?v=${v}`;
    }
    if (host === "youtu.be") {
      return `https://youtu.be${u.pathname}`.replace(/\/$/, "");
    }
    const base = u.origin + u.pathname;
    return base.replace(/\/$/, "");
  } catch {
    return s.split("?")[0];
  }
}

/** Detecta URLs incrustables (post/video públicos habituales) */
export function esURLRedSocial(url) {
  const u = limpiarUrl(url);
  const checks = [
    /instagram\.com\/(p|reel)\/[\w-]+/i,
    /facebook\.com\/.+\/posts\/[\w-]+/i,
    /facebook\.com\/share\/[pr]\/[\w-]+/i,
    /facebook\.com\/reel\/\d+/i,
    /(twitter\.com|x\.com)\/\w+\/status\/\d+/i,
    /tiktok\.com\/@[\w.]+\/video\/\d+/i,
    /youtube\.com\/watch\?v=[\w-]+/i,
    /youtu\.be\/[\w-]+/i,
  ];
  return checks.some((re) => re.test(u));
}

function splitLineWithEmbeds(line) {
  const segments = line.split(/(https?:\/\/\S+)/g);
  const out = [];
  let buf = "";

  const flushBuf = () => {
    const t = buf.trim();
    if (t) out.push({ t: "p", text: t });
    buf = "";
  };

  for (const seg of segments) {
    if (!seg) continue;
    if (/^https?:\/\//.test(seg)) {
      if (esURLRedSocial(seg)) {
        flushBuf();
        out.push({ t: "e", url: limpiarUrl(seg) });
      } else {
        buf += seg;
      }
    } else {
      buf += seg;
    }
  }
  flushBuf();
  return out.length ? out : [{ t: "p", text: line.trim() }];
}

/**
 * Convierte el texto del usuario en bloques: párrafos (sangría vía CSS), saltos y embeds.
 */
export function construirBloquesNoticia(textoUsuario) {
  if (!textoUsuario || !String(textoUsuario).trim()) return [];
  const lines = String(textoUsuario).split(/\r?\n/);
  const blocks = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (blocks.length && blocks[blocks.length - 1].t !== "gap") {
        blocks.push({ t: "gap" });
      }
      continue;
    }

    const soloUrl = trimmed.match(/^(https?:\/\/\S+)$/);
    if (soloUrl && esURLRedSocial(soloUrl[1])) {
      blocks.push({ t: "e", url: limpiarUrl(soloUrl[1]) });
      continue;
    }

    for (const part of splitLineWithEmbeds(trimmed)) {
      if (part.t === "p" && blocks.length && blocks[blocks.length - 1].t === "p") {
        blocks[blocks.length - 1].text += " " + part.text;
      } else {
        blocks.push(part);
      }
    }
  }

  while (blocks.length && blocks[blocks.length - 1].t === "gap") {
    blocks.pop();
  }
  return blocks;
}

export function serializarNoticia(raw, blocks) {
  return JSON.stringify({
    v: NOTICIA_VERSION,
    raw: String(raw ?? ""),
    blocks,
  });
}

export function parseContenidoNoticia(content) {
  if (content == null || content === "") {
    return { raw: "", blocks: [] };
  }
  const s = String(content).trim();
  if (s.startsWith("{")) {
    try {
      const o = JSON.parse(content);
      if (o && o.v === NOTICIA_VERSION && Array.isArray(o.blocks)) {
        return { raw: o.raw ?? "", blocks: o.blocks };
      }
    } catch {
      /* legado */
    }
  }
  const raw = String(content);
  return { raw, blocks: construirBloquesNoticia(raw) };
}

/** Texto original del usuario para el textarea al editar (JSON `raw` o legado completo). */
export function textoRawParaEdicion(content) {
  return parseContenidoNoticia(content).raw;
}

export function textoResumenNoticia(content, max = 220) {
  const { raw, blocks } = parseContenidoNoticia(content);
  let text = raw?.trim();
  if (!text) {
    text = blocks
      .filter((b) => b.t === "p")
      .map((b) => b.text)
      .join(" ")
      .trim();
  }
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + "…";
}
