$ErrorActionPreference = 'Stop'
node report/build-report.mjs
if ($LASTEXITCODE -ne 0) { throw 'Report HTML generation failed.' }
node report/export-docx.mjs
if ($LASTEXITCODE -ne 0) { throw 'DOCX export failed.' }
