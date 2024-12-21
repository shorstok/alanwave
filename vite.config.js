import { defineConfig } from 'vite';
import { minify } from 'html-minifier-terser';
import fs from 'fs';

export default defineConfig({
  build: {
    assetsInlineLimit: Infinity,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: true
      },
      plugins: [
        {
          name: 'inline-script',
          enforce: 'post',
          async generateBundle(options, bundle) {
            const jsEntry = Object.values(bundle).find(
              file => file.type === 'chunk' && file.isEntry
            );

            if (jsEntry) {
              const html = fs.readFileSync('index.html', 'utf-8');
              const minifiedHtml = await minify(
                html.replace('<script type="module" src="/src/main.ts"></script>', 
                           `<script>${jsEntry.code}</script>`),
                {
                  collapseWhitespace: true,
                  removeComments: true,
                  minifyJS: true
                }
              );

              Object.keys(bundle).forEach(fileName => {
                delete bundle[fileName];
              });

              this.emitFile({
                type: 'asset',
                fileName: 'index.html',
                source: minifiedHtml
              });
            }
          }
        }
      ]
    }
  }
});