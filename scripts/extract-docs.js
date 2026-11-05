const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

async function extract(file) {
  const fullPath = path.resolve(file);
  if (!fs.existsSync(fullPath)) return;
  const result = await mammoth.extractRawText({ path: fullPath });
  const outPath = fullPath.replace(/\.docx$/, '.txt');
  fs.writeFileSync(outPath, result.value, 'utf8');
  console.log(`Extracted: ${file} -> ${result.value.length} chars`);
}

async function main() {
  const docs = [
    'docs/PRD/Miftah_360_Admin_Dashboard_PRD_V1_1.docx',
    'docs/PRD/Miftah_360_Workshop_OS_PRD_V1_1.docx',
    'docs/PRD/Miftah_360_User_App_PRD_V1_1.docx',
    'docs/IMPLEMENTATION READY V1/08_Implementation_Blueprint_and_Build_Plan_V1.docx',
    'docs/IMPLEMENTATION READY V1/01_Business_Rules_V1_2_PO_Decision_Register.docx',
  ];

  for (const doc of docs) {
    await extract(doc);
  }
}

main().catch(console.error);
