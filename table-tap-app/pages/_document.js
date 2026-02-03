import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Remove Grammarly attributes that cause hydration issues
              document.addEventListener('DOMContentLoaded', () => {
                document.body.removeAttribute('data-new-gr-c-s-check-loaded');
                document.body.removeAttribute('data-gr-ext-installed');
              });
            `,
          }}
        />
      </Head>
      <body className="league_spartan_5cbd999f-module__pz_whW__variable font-sans antialiased bg-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
