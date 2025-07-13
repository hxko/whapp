// pages/_document.js
import Document, { Html, Head, Main, NextScript } from "next/document";

// Custom Document class to augment the default HTML document structure
class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* 
            Preconnect to important origins
            The preconnect link allows the browser to establish early connections 
            to the specified origins. This includes DNS resolution, TCP handshake, 
            and TLS negotiation, which can significantly reduce the time it takes 
            to fetch resources from these origins.
          */}
          <link rel="preconnect" href="https://firestore.googleapis.com" />
          <link rel="preconnect" href="https://googleapis.com" />
          <link
            rel="preconnect"
            href="https://identitytoolkit.googleapis.com"
          />

          {/* 
            DNS Prefetch for better performance
            The dns-prefetch link allows the browser to perform DNS resolution 
            for the specified origins in advance. This means that when the 
            application needs to fetch resources from these origins, the DNS 
            lookup has already been completed, reducing latency.
          */}
          <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
          <link rel="dns-prefetch" href="https://googleapis.com" />
          <link
            rel="dns-prefetch"
            href="https://identitytoolkit.googleapis.com"
          />
        </Head>
        <body>
          {/* 
            Main component where the application will be rendered.
            This is where your Next.js pages will be injected.
          */}
          <Main />
          {/* 
            NextScript component that includes the necessary scripts for 
            Next.js to function properly. This includes the loading of 
            JavaScript bundles and any other scripts required for your app.
          */}
          <NextScript />
        </body>
      </Html>
    );
  }
}

// Export the custom Document class
export default MyDocument;
