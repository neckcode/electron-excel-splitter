const { ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

function sanitize(name) {
  return String(name).replace(/[\\/*?:"<>|]/g, "_").trim();
}

ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Excel', extensions: ['xlsx', 'xlsm', 'xls'] }]
  });
  return canceled ? null : filePaths[0];
});

ipcMain.handle('excel:process', async (event, filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (!data.length || Object.keys(data[0]).length < 4)
      return 'Файл должен содержать хотя бы 4 столбца.';

    const col2 = Object.keys(data[0])[1];
    const col4 = Object.keys(data[0])[3];

    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));
    const outDir = path.join(dir, `выборка_${base}`);

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

    const log = [];

    const combinations = [...new Set(data.map(row => `${row[col2]}|||${row[col4]}`))];
    for (const combo of combinations) {
      const [v2, v4] = combo.split('|||');
      const filtered = data.filter(r => r[col2] === v2 && r[col4] === v4);
      const name = `${sanitize(v2)}_${sanitize(v4)}`.replace(/^_+|_+$/g, '') || 'пустой_фильтр';

      const ws = xlsx.utils.json_to_sheet(filtered);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
      const output = path.join(outDir, `${name}.xlsx`);
      xlsx.writeFile(wb, output);
      log.push(`${name}.xlsx`);
    }

    fs.writeFileSync(path.join(outDir, 'log.txt'), log.join('\n'), 'utf8');
    shell.openPath(outDir);
    return `Готово. Создано файлов: ${log.length}`;
  } catch (err) {
    return `Ошибка: ${err.message}`;
  }
});
