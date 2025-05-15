document.getElementById('loadBtn').addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile();
  if (filePath) {
    document.getElementById('status').innerText = 'Обработка файла...';
    const result = await window.electronAPI.processExcel(filePath);
    document.getElementById('status').innerText = result;
  }
});
