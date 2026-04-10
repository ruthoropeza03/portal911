import { AppProvider } from "@/context/AppContext";
import "./globals.css";

export const metadata = {
  title: "VEN 911 - Centro de Comando",
  description: "Plataforma de gestión del Centro de Comando, Control y Telecomunicaciones VEN 911",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 min-h-screen font-sans antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
