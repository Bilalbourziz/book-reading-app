import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'https://lumen-book.click';

async function generateSitemap() {
  const { data: books, error } = await supabase
    .from('books')
    .select('id, updated_at, title')
    .order('title');

  if (error) {
    console.error('Error fetching books:', error);
    process.exit(1);
  }

  const staticEntries = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/auth', changefreq: 'monthly', priority: '0.3' },
  ];

  const bookEntries = (books ?? []).map((b) => ({
    path: `/book/${b.id}`,
    lastmod: b.updated_at ?? undefined,
    changefreq: 'weekly',
    priority: '0.8',
  }));

  const allEntries = [...staticEntries, ...bookEntries];

  const urlEntries = allEntries
    .map((e) => {
      const lastmod = e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${BASE_URL}${e.path}</loc>${lastmod}\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlEntries}\n</urlset>`;

  writeFileSync('public/sitemap.xml', xml);
  console.log(`Generated sitemap.xml with ${allEntries.length} URLs`);
}

generateSitemap().catch((err) => {
  console.error('Failed to generate sitemap:', err);
  process.exit(1);
});