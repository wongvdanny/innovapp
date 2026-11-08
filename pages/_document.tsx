import { Html, Head, Main, NextScript, DocumentProps } from "next/document";

// Sin GTM: el panel (/admin), ni analítica ni balizas de Ads; y /restablecer, cuya URL lleva el token
// de recuperación de contraseña (GA4 la enviaría entera a Google). El stub de consentimiento
// (dataLayer/gtag) se mantiene en todas las páginas para que lib/track.ts nunca falle.
const sinGtm = (pagina: string) => pagina === "/admin" || pagina.startsWith("/admin/") || pagina === "/restablecer";

export default function Document({ __NEXT_DATA__ }: DocumentProps) {
  const conGtm = !sinGtm(__NEXT_DATA__.page);
  return (
    <Html lang="es">
      <Head>
        {/* Google Consent Mode v2 -- debe ejecutarse ANTES que el script de GTM de abajo.
            Fija los valores por defecto en "denied" en cada carga de página; CookieBanner
            (components/CookieBanner.jsx) los actualiza a "granted" según la decisión del
            usuario, guardada en localStorage. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});
// Tráfico interno (lib/track.ts, INTERNAL_TRAFFIC_KEY): antes que GTM, para que el primer
// page_view ya lleve traffic_type. Lo marca el login de admin o el botón del panel.
try { if (localStorage.getItem('ia_internal') === '1') dataLayer.push({ traffic_type: 'internal' }); } catch (e) {}`,
          }}
        />
        {/* Google Tag Manager, retrasado hasta la primera interacción (toque, clic, tecla,
            scroll) o 4 s, lo que ocurra antes, para no ocupar el hilo principal en la carga.
            Lo que se envía antes (consent default, click_whatsapp, click_tel, generate_lead)
            queda en dataLayer y GTM lo procesa al cargar: por eso las conversiones de Ads
            van con disparadores de evento del dataLayer, no de Click URL. */}
        {conGtm && <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,i){var hecho=false,ev=['pointerdown','touchstart','keydown','scroll','wheel'],op={passive:true,capture:true};
function cargar(){if(hecho)return;hecho=true;ev.forEach(function(e){w.removeEventListener(e,cargar,op)});
w.dataLayer=w.dataLayer||[];w.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var j=d.createElement('script');j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;d.head.appendChild(j)}
ev.forEach(function(e){w.addEventListener(e,cargar,op)});setTimeout(cargar,4000)})(window,document,'GTM-W97PXTN9');`,
          }}
        />}
        {/* End Google Tag Manager */}
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: var(--font-gabarito), system-ui, sans-serif; }
          a { text-decoration: none; }
          .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
          .servix-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
          .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
          .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .section { padding: 80px 24px; }
          .label { display: inline-block; background: rgba(238,117,40,.1); border: 1px solid rgba(238,117,40,.2); border-radius: 100px; padding: 5px 16px; font-size: 11px; font-weight: 700; color: var(--color-brand-orange-texto); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
          @media (max-width: 900px) {
            .about-grid { grid-template-columns: 1fr; gap: 40px; }
            .servix-grid { grid-template-columns: 1fr; gap: 32px; }
            .features-grid { grid-template-columns: repeat(2,1fr); }
            .pricing-grid { grid-template-columns: 1fr; max-width: 440px; margin: 0 auto; }
          }
          @media (max-width: 600px) {
            .features-grid { grid-template-columns: 1fr; }
            .section { padding: 60px 20px; }
          }
        `}</style>
      </Head>
      <body>
        {/* Google Tag Manager (noscript) */}
        {conGtm && <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W97PXTN9"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>}
        {/* End Google Tag Manager (noscript) */}
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
