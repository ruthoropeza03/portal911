import sql from "@/lib/neon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseContenidoNoticia } from "@/lib/formateadorNoticia";
import NoticiaContenido from "@/components/NoticiaContenido";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const rows = await sql`SELECT title FROM news WHERE id = ${id} AND visible = true`;
  if (rows.length === 0) return { title: "Noticia | Portal VEN 911" };
  return { title: `${rows[0].title} | Portal VEN 911` };
}

export default async function NoticiaPublicaPage({ params }) {
  const { id } = await params;
  const rows = await sql`SELECT * FROM news WHERE id = ${id} AND visible = true`;
  if (rows.length === 0) notFound();

  const n = rows[0];
  const { blocks } = parseContenidoNoticia(n.content);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800 py-2 -my-1 touch-manipulation min-h-[44px] sm:min-h-0"
          >
            <ChevronLeft className="h-4 w-4 mr-1 shrink-0" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-3 sm:px-4 py-6 sm:py-10 w-full min-w-0">
        <p className="text-center text-sm font-semibold text-red-600 uppercase tracking-wider mb-3">
          {new Date(n.published_at).toLocaleDateString("es-VE", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-6 sm:mb-8 leading-tight px-1 break-words">
          {n.title}
        </h1>

        {n.image_url ? (
          <div className="w-full mb-6 sm:mb-10 rounded-xl overflow-hidden bg-gray-200 border border-gray-100">
            <img
              src={n.image_url}
              alt=""
              className="w-full max-h-[240px] sm:max-h-[420px] object-cover"
            />
          </div>
        ) : null}

        <NoticiaContenido blocks={blocks} />
      </article>
    </div>
  );
}
