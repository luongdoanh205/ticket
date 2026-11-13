import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const tempRoot = path.join(process.env.TEMP ?? process.env.TMP ?? '', 'ticket2-docx-tools');
const require = createRequire(path.join(tempRoot, 'package.json'));
const htmlToDocx = require('html-to-docx');
const { unzipSync, zipSync, strFromU8, strToU8 } = require('fflate');
const sourcePath = path.join(root, 'BTL-CineTicket.html');
let html = fs.readFileSync(sourcePath, 'utf8');
html = html.replace(/<section class="page cover-page">([\s\S]*?)<\/section>/, '<div class="page cover-page">$1</div><div class="page-break" style="page-break-before: always;"></div>');
html = html.replace(/<section class="page chapter-page">/g, '<div class="page-break" style="page-break-before: always;"></div><section class="page chapter-page">');
html = html.replace(/<section class="page(?: ([^"]*))?">/g, (_tag, classes = '') => `<div class="page ${classes}">`);
html = html.replaceAll('</section>', '</div>');
html = html.replaceAll('section.page', '.page');
html = html.replace(/src="([^"]+\.png)"/g, (_match, relativePath) => {
  const imagePath = path.join(root, relativePath.replaceAll('/', path.sep));
  const base64 = fs.readFileSync(imagePath).toString('base64');
  return `src="data:image/png;base64,${base64}"`;
});

const documentOptions = {
  orientation: 'portrait',
  pageSize: { width: 11906, height: 16838 },
  margins: { top: 1134, right: 1134, bottom: 1190, left: 1361, header: 500, footer: 500, gutter: 0 },
  title: 'Báo cáo bài tập lớn CineTicket',
  subject: 'Xây dựng hệ thống website đặt vé xem phim trực tuyến',
  creator: 'Nhóm sinh viên',
  lastModifiedBy: 'Nhóm sinh viên',
  font: 'Cambria',
  fontSize: 21,
  complexScriptFontSize: 21,
  lang: 'vi-VN',
  footer: true,
  pageNumber: true,
  skipFirstHeaderFooter: true,
};
const footer = '<p style="text-align:center;color:#64748b;font-size:9pt">Báo cáo bài tập lớn · CineTicket</p>';
const buffer = await htmlToDocx(html, null, documentOptions, footer);
const outputPath = path.join(root, process.env.REPORT_OUTPUT_DOCX ?? 'BTL-CineTicket.docx');
fs.writeFileSync(outputPath, buffer);
const packageParts = unzipSync(fs.readFileSync(outputPath));
let documentXml = strFromU8(packageParts['word/document.xml']);
documentXml = documentXml.replace(/ w:gutter="undefined"/g, ' w:gutter="0"');
const sectionProperties = documentXml.match(/<w:sectPr>[\s\S]*?<\/w:sectPr>/)?.[0];
if (sectionProperties) {
  documentXml = documentXml.replace(sectionProperties, '');
  documentXml = documentXml.replace('</w:body>', `${sectionProperties}\n  </w:body>`);
}
packageParts['word/document.xml'] = strToU8(documentXml);
const fixedBuffer = zipSync(packageParts, { level: 6 });
fs.writeFileSync(outputPath, fixedBuffer);
console.log(`Created ${outputPath} (${fixedBuffer.byteLength} bytes); fixed Word section properties.`);
