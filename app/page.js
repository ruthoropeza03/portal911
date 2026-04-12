import Link from "next/link";
import Image from "next/image";
import sql from "@/lib/neon";
import { Newspaper, FileDown, ShieldAlert, Phone, ChevronRight } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch visible news and formats
  let newsList = [];
  let formatsList = [];
  try {
    newsList = await sql`SELECT * FROM news WHERE visible = true ORDER BY published_at DESC LIMIT 3`;
    formatsList = await sql`SELECT * FROM formats ORDER BY name ASC LIMIT 6`;
  } catch (error) {
    console.error("Error fetching landing data", error);
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <Image src="/logo.svg" alt="VEN 911 Logo" width={50} height={50} className="w-12 h-12" />
              <div>
                <h1 className="font-bold text-xl text-gray-900 leading-tight">Portal VEN 911</h1>
                <p className="text-xs font-semibold tracking-wider text-red-600 uppercase">Comando Nacional</p>
              </div>
            </div>
            <div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 hover:shadow-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Acceso Personal
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-gray-900 overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/fondo2.jpg"
              alt="Fondo VEN 911"
              fill
              className="w-full h-full object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40" />
          </div>
          <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <Image src="/logo.svg" alt="logo" width={50} height={50} className="mx-auto mb-3" />
            <h1 className="text-4xl ext-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl max-w-4xl font-black drop-shadow-md">
              Atención Inmediata a Nivel Nacional
            </h1>
            <p className="mt-6 text-xl text-gray-300 max-w-2xl drop-shadow">
              El Sistema de Respuesta Integrada articulando funciones de Seguridad Ciudadana, Salud y Gestión de Riesgos.
            </p>
            <div className="mt-10 flex space-x-4">
              <div className="bg-red-600/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 flex flex-col items-center justify-center shadow-2xl">
                <Phone className="h-10 w-10 text-white mb-2" />
                <span className="text-3xl font-black text-white">9-1-1</span>
                <span className="text-red-200 text-sm font-medium uppercase tracking-widest mt-1">Línea Única</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Noticias */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Newspaper className="h-8 w-8 text-red-600 mr-3" />
                  Noticias Destacadas
                </h2>
                <p className="mt-2 text-gray-600">Entérate de las últimas acciones y comunicados oficiales.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {newsList.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  No hay noticias publicadas en este momento.
                </div>
              ) : (
                newsList.map(noticia => (
                  <div key={noticia.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
                    {noticia.image_url ? (
                      <div className="h-48 relative w-full bg-gray-200">
                        <img
                          src={noticia.image_url}
                          alt={noticia.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-r from-red-50 to-gray-50 border-b border-gray-100 flex items-center justify-center">
                        <Newspaper className="h-10 w-10 text-red-200" />
                      </div>
                    )}
                    <div className="p-6 flex-grow flex flex-col">
                      <span className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wider">
                        {new Date(noticia.published_at).toLocaleDateString("es-VE", { year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug">{noticia.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">{noticia.content}</p>
                      <button className="text-red-600 font-semibold hover:text-red-800 transition-colors inline-flex items-center text-sm">
                        Leer más <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Sección de Formatos Institucionales */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center">
                <FileDown className="h-8 w-8 text-red-600 mr-3" />
                Formatos Institucionales
              </h2>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Descarga los documentos oficiales y planillas necesarias para trámites y reportes internos.
              </p>
            </div>

            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              {formatsList.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No hay formatos disponibles en este momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {formatsList.map(format => (
                    <div key={format.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-red-200 hover:shadow-md transition-all group flex items-start">
                      <div className="bg-red-50 p-3 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors mr-4 flex-shrink-0">
                        <FileDown className="h-6 w-6" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="text-md font-bold text-gray-900 truncate">{format.name}</h3>
                        {format.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{format.description}</p>
                        )}
                        <a
                          href={`/api/drive/download?fileId=${format.file_drive_id}&public=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block text-sm font-semibold text-red-600 hover:text-red-800"
                        >
                          Descargar Documento
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Image src="/logo.svg" alt="VEN 911 Logo" width={40} height={40} className="w-10 h-10 grayscale brightness-200" />
              <span className="font-bold text-lg text-white">VEN 911</span>
            </div>
            <p className="text-sm text-gray-400">
              Centro de Comando, Control y Telecomunicaciones. Al servicio del pueblo venezolano garantizando respuesta inmediata.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase text-sm tracking-wider">Enlaces Rápidos</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Portal de Empleados</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4 uppercase text-sm tracking-wider">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>Emergencias: <span className="text-red-400 font-bold">9-1-1</span></li>
              <li>Lara - Venezuela.</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Comando Nacional VEN 911. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
