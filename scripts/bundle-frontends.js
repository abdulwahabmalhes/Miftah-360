const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

async function bundle() {
  console.log('🚀 Starting frontends bundle with esbuild...');

  const apps = [
    {
      name: 'Admin Dashboard (admin-web)',
      entry: path.resolve('apps/admin-web/src/index.tsx'),
      outfile: path.resolve('apps/admin-web/public/bundle.js'),
    },
    {
      name: 'Workshop OS (workshop-web)',
      entry: path.resolve('apps/workshop-web/src/index.tsx'),
      outfile: path.resolve('apps/workshop-web/public/bundle.js'),
    },
    {
      name: 'Mobile UI Preview (mobile)',
      entry: path.resolve('apps/mobile/src/index.tsx'),
      outfile: path.resolve('apps/mobile/public/bundle.js'),
    },
  ];

  for (const app of apps) {
    const dir = path.dirname(app.outfile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    console.log(`Bundling ${app.name}...`);
    await esbuild.build({
      entryPoints: [app.entry],
      bundle: true,
      outfile: app.outfile,
      sourcemap: true,
      target: ['es2020'],
      define: {
        'process.env.NODE_ENV': '"development"',
        'global': 'window',
      },
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
      },
    });
    console.log(`✅ ${app.name} bundled successfully.`);
  }

  console.log('🎉 All frontends bundled successfully!');
}

bundle().catch((err) => {
  console.error('❌ Bundling failed:', err);
  process.exit(1);
});

