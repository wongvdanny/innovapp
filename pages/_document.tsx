import { Html, Head, Main, NextScript } from "next/document";
export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
          a { text-decoration: none; }
          .about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; }
          .servix-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
          .features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
          .pricing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .section { padding: 80px 24px; }
          .label { display: inline-block; background: rgba(42,179,170,.1); border: 1px solid rgba(42,179,170,.2); border-radius: 100px; padding: 5px 16px; font-size: 11px; font-weight: 700; color: #2ab3aa; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
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
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
