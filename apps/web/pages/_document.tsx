import Document, { Head, Html, Main, NextScript, type DocumentContext, type DocumentInitialProps } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    const data = (this.props as any)?.__NEXT_DATA__;
    const page: string | undefined = data?.page;
    const includeStoreStyles = page === '/' || page === '/index';

    return (
      <Html lang="zh-CN">
        <Head>{includeStoreStyles ? <link rel="stylesheet" href="/assets/css/store.css" /> : null}</Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
