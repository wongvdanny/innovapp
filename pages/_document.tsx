import { Html, Head, Main, NextScript } from "next/document";
export default function Document() {
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
});`,
          }}
        />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-W97PXTN9');`,
          }}
        />
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
          .label { display: inline-block; background: rgba(238,117,40,.1); border: 1px solid rgba(238,117,40,.2); border-radius: 100px; padding: 5px 16px; font-size: 11px; font-weight: 700; color: #ee7528; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
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
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-W97PXTN9"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
