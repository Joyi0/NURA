import fs from "node:fs/promises";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

const workDir = "/Users/sujiayi/Desktop/NURA独立站/outputs/bb-pricing";
const products = JSON.parse(await fs.readFile(`${workDir}/products.json`, "utf8"));
const outPath = `${workDir}/NURA-BB产品定价测算表.xlsx`;

function colName(n) {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function rangeAddress(row1, col1, row2, col2) {
  return `${colName(col1)}${row1}:${colName(col2)}${row2}`;
}

const wb = Workbook.create();
const detail = wb.worksheets.add("定价明细");
const summary = wb.worksheets.add("品类汇总");
const notes = wb.worksheets.add("定价说明");

const headers = [
  "款号",
  "产品名称",
  "原表零售价",
  "成本价",
  "运费",
  "包装",
  "汇率",
  "50%利润价",
  "75%利润价",
  "100%利润价",
  "推荐定价",
  "目标区间",
  "与原零售价差异",
  "原产品图公式"
];

detail.getRange("A1:N1").merge();
detail.getRange("A1").values = [["NURA BB 产品定价测算表"]];
detail.getRange("A3:B9").values = [
  ["参数", "默认值"],
  ["运费", 120],
  ["包装", 30],
  ["汇率", 1],
  ["推荐利润率", 1],
  ["目标最低价", 600],
  ["目标最高价", 1200],
];
detail.getRange("D3:H7").values = [
  ["口径", "公式", "", "", ""],
  ["50%利润价", "(成本价 + 运费 + 包装) * (1 + 50%) * 汇率", "", "", ""],
  ["75%利润价", "(成本价 + 运费 + 包装) * (1 + 75%) * 汇率", "", "", ""],
  ["100%利润价", "(成本价 + 运费 + 包装) * (1 + 100%) * 汇率", "", "", ""],
  ["推荐定价", "按100%利润价取整，并限制在600-1200人民币目标区间", "", "", ""],
];

detail.getRange("A10:N10").values = [headers];

const dataStart = 11;
const valueRows = products.map((p) => [
  p["款号"],
  p["产品名称"],
  Number(p["零售价"] ?? 0),
  Number(p["成本价"] ?? 0),
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  p["产品图"] ? `'${p["产品图"]}` : ""
]);
detail.getRange(rangeAddress(dataStart, 1, dataStart + valueRows.length - 1, headers.length)).values = valueRows;

const formulas = products.map((_, i) => {
  const r = dataStart + i;
  return [
    "=$B$4",
    "=$B$5",
    "=$B$6",
    `=ROUND(($D${r}+$E${r}+$F${r})*(1+50%)*$G${r},0)`,
    `=ROUND(($D${r}+$E${r}+$F${r})*(1+75%)*$G${r},0)`,
    `=ROUND(($D${r}+$E${r}+$F${r})*(1+100%)*$G${r},0)`,
    `=MIN($B$9,MAX($B$8,CEILING(J${r},10)))`,
    `=IF(AND(K${r}>=$B$8,K${r}<=$B$9),"目标内","需复核")`,
    `=K${r}-C${r}`,
  ];
});
detail.getRange(rangeAddress(dataStart, 5, dataStart + products.length - 1, 13)).formulas = formulas;

detail.getRange("A1:N1").format = {
  fill: "#1A1A1A",
  font: { color: "#FFFFFF", bold: true, size: 16 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
detail.getRange("A3:B3").format = {
  fill: "#C8A96A",
  font: { color: "#1A1A1A", bold: true },
  horizontalAlignment: "center",
};
detail.getRange("D3:H3").format = {
  fill: "#C8A96A",
  font: { color: "#1A1A1A", bold: true },
  horizontalAlignment: "center",
};
detail.getRange("A10:N10").format = {
  fill: "#FAFAF7",
  font: { bold: true, color: "#1A1A1A" },
  borders: { preset: "outside", style: "thin", color: "#D8D2C4" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};
detail.getRange(rangeAddress(dataStart, 1, dataStart + products.length - 1, headers.length)).format = {
  borders: { preset: "outside", style: "thin", color: "#E6E0D2" },
  verticalAlignment: "center",
};
detail.getRange(rangeAddress(dataStart, 3, dataStart + products.length - 1, 13)).format.numberFormat = "¥#,##0";
detail.getRange(rangeAddress(dataStart, 4, dataStart + products.length - 1, 4)).format.numberFormat = "¥#,##0.00";
detail.getRange("A:A").format.columnWidthPx = 70;
detail.getRange("B:B").format.columnWidthPx = 155;
detail.getRange("C:M").format.columnWidthPx = 95;
detail.getRange("N:N").format.columnWidthPx = 250;
detail.getRange("A10:N10").format.rowHeightPx = 34;

const grouped = new Map();
for (const p of products) {
  const name = p["产品名称"] || "未命名";
  if (!grouped.has(name)) grouped.set(name, []);
  grouped.get(name).push(Number(p["成本价"] || 0));
}
const summaryHeaders = ["产品名称", "款数", "平均成本价", "最低成本价", "最高成本价", "按100%利润推荐价范围"];
const summaryRows = [...grouped.entries()].map(([name, costs]) => {
  const avg = costs.reduce((a, b) => a + b, 0) / costs.length;
  const min = Math.min(...costs);
  const max = Math.max(...costs);
  const low = Math.min(1200, Math.max(600, Math.ceil(((min + 120 + 30) * 2) / 10) * 10));
  const high = Math.min(1200, Math.max(600, Math.ceil(((max + 120 + 30) * 2) / 10) * 10));
  return [name, costs.length, avg, min, max, `${low}-${high}`];
});
summary.getRange("A1:F1").merge();
summary.getRange("A1").values = [["NURA 产品名称汇总"]];
summary.getRange("A3:F3").values = [summaryHeaders];
summary.getRange(rangeAddress(4, 1, 3 + summaryRows.length, summaryHeaders.length)).values = summaryRows;
summary.getRange("A1:F1").format = {
  fill: "#1A1A1A",
  font: { color: "#FFFFFF", bold: true, size: 16 },
  horizontalAlignment: "center",
};
summary.getRange("A3:F3").format = {
  fill: "#FAFAF7",
  font: { bold: true },
  horizontalAlignment: "center",
  borders: { preset: "outside", style: "thin", color: "#D8D2C4" },
};
summary.getRange(rangeAddress(4, 3, 3 + summaryRows.length, 5)).format.numberFormat = "¥#,##0.00";
summary.getRange("A:A").format.columnWidthPx = 180;
summary.getRange("B:F").format.columnWidthPx = 120;

notes.getRange("A1:D1").merge();
notes.getRange("A1").values = [["定价说明"]];
notes.getRange("A3:D11").values = [
  ["项目", "说明", "", ""],
  ["数据来源", "NURA珠宝部分信息.xlsx / Sheet1", "", ""],
  ["收录字段", "款号、产品名称、成本价、原表零售价、产品图公式文本", "", ""],
  ["默认公式", "建议定价 = (成本价 + 运费 + 包装) * (1 + 利润率) * 汇率", "", ""],
  ["利润率", "保留 50%、75%、100% 三档；推荐定价默认用 100% 档", "", ""],
  ["人民币区间", "推荐定价用 600 元下限和 1200 元上限控制", "", ""],
  ["默认运费", "120，可在“定价明细”B4 修改", "", ""],
  ["默认包装", "30，可在“定价明细”B5 修改", "", ""],
  ["默认汇率", "1，可在“定价明细”B6 修改", "", ""],
];
notes.getRange("A1:D1").format = {
  fill: "#1A1A1A",
  font: { color: "#FFFFFF", bold: true, size: 16 },
  horizontalAlignment: "center",
};
notes.getRange("A3:D3").format = {
  fill: "#C8A96A",
  font: { bold: true },
};
notes.getRange("A:D").format.columnWidthPx = 180;
notes.getRange("B:B").format.columnWidthPx = 520;
notes.getRange("A3:D11").format.wrapText = true;

for (const sheet of [detail, summary, notes]) {
  sheet.getRange("A1:Z200").format.font = { name: "Arial", size: 10, color: "#1A1A1A" };
}
detail.getRange("A1").format.font = { name: "Arial", size: 16, bold: true, color: "#FFFFFF" };
summary.getRange("A1").format.font = { name: "Arial", size: 16, bold: true, color: "#FFFFFF" };
notes.getRange("A1").format.font = { name: "Arial", size: 16, bold: true, color: "#FFFFFF" };

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

const sample = await wb.inspect({
  kind: "table",
  range: "定价明细!A10:M18",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 14,
});
console.log(sample.ndjson);

await wb.render({ sheetName: "定价明细", range: "A1:N24", scale: 1 });
await wb.render({ sheetName: "品类汇总", range: "A1:F20", scale: 1 });
await wb.render({ sheetName: "定价说明", range: "A1:D12", scale: 1 });

await fs.mkdir(workDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(wb);
await output.save(outPath);
console.log(outPath);
