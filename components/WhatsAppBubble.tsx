import { useState } from "react";
import { useRouter } from "next/router";

export const WHATSAPP_NUMBER = "34641399645";
const MENSAJE_GENERICO = "Hola, quiero más información sobre Innovapp";

// Mensaje prellenado según la ruta del visitante -- centralizado aquí para que añadir
// una ruta/producto nuevo en el futuro sea solo una línea más, sin tocar el resto del
// componente. La clave es router.pathname (patrón de ruta, sin query string).
const mensajesPorRuta: Record<string, string> = {
  "/agentes-ia": "Hola! Quiero información sobre Agentes IA (agentes de WhatsApp con IA) para mi negocio.",
  "/servix": "Hola! Quiero información sobre Servix, el TPV para restaurantes.",
  "/gymstack": "Hola! Quiero información sobre GymStack, la gestión para gimnasios.",
  "/registro-news": "Hola! Quiero información sobre News.",
};

export default function WhatsAppBubble() {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  const mensaje = mensajesPorRuta[router.pathname] ?? MENSAJE_GENERICO;
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Chatear por WhatsApp"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: hovered ? "10px" : "0px",
        backgroundColor: "#25D366",
        color: "#fff",
        borderRadius: "999px",
        padding: hovered ? "12px 20px 12px 14px" : "14px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
        textDecoration: "none",
        fontFamily: "inherit",
        fontSize: "15px",
        fontWeight: 600,
        transition: "all 0.25s ease",
        cursor: "pointer",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="#fff"
        style={{ flexShrink: 0 }}
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.62 1.36 5.13L2 22l5.11-1.44a9.86 9.86 0 0 0 4.93 1.33c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.5 14.14c-.23.65-1.36 1.24-1.87 1.28-.5.05-.98.24-3.31-.72-2.8-1.16-4.6-4-4.74-4.19-.14-.19-1.13-1.5-1.13-2.86 0-1.36.71-2.02.96-2.3.24-.27.53-.34.71-.34.19 0 .38 0 .54.01.17.01.4-.06.63.48.23.55.79 1.9.86 2.04.07.14.11.3.02.49-.09.19-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.18-.27.36-.22.6-.13.24.09 1.55.73 1.81.87.27.13.45.19.51.3.06.11.06.65-.17 1.3z" />
      </svg>
      {hovered && <span style={{ whiteSpace: "nowrap" }}>Chatea con nosotros</span>}
    </a>
  );
}
