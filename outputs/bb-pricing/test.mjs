import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const wb=Workbook.create();
const sh=wb.worksheets.add('Test');
console.log(typeof sh.getRange);
sh.getRange('A1:B2').values = [['A','B'],[1,2]];
console.log(await wb.inspect({kind:'table', range:'Test!A1:B2', include:'values'}));
