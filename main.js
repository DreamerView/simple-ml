function renderMiniML(input) {
  let html = input;

  // 0) ссылки
  html = html.replace(
    /\[ссылка\]\s*\[путь\]([\s\S]*?)\[\/путь\]\s*\[текст\]([\s\S]*?)\[\/текст\]\s*\[\/ссылка\]/g,
    (_, url, text) => `<a href="${url.trim()}">${text.trim()}</a>`
  );

  // 1) картинка
  html = html.replace(
    /\[картинка\]\s*\[файл\](.*?)\[\/файл\](?:\s*\[описание\](.*?)\[\/описание\])?\s*\[\/картинка\]/gs,
    (_, file, caption) => {
      const src = file.trim(), alt = caption?caption.trim():'';
      return `
<figure>
  <img class="rounded-4 w-50" src="${src}" alt="${alt}">
  ${alt?`<figcaption>${alt}</figcaption>`:''}
</figure>`.trim();
    }
  );

  // 2) заголовок
  html = html.replace(/\[заголовок\](.*?)\[\/заголовок\]/g, '<h1>$1</h1>');

  // 3) текст
  html = html.replace(/\[текст\](.*?)\[\/текст\]/g, '<p>$1</p>');

  // 4) таблица
  html = html.replace(
    /\[таблица\]\s*\[шапка\]([\s\S]*?)\[\/шапка\]\s*\[тело\]([\s\S]*?)\[\/тело\]\s*\[\/таблица\]/g,
    (_, headerBlock, bodyBlock) => {
        // для шапки: каждую ячейку прогоняем через renderMiniML
        const headers = [...headerBlock.matchAll(/\[ячейка\]([\s\S]*?)\[\/ячейка\]/g)]
        .map(m => renderMiniML(m[1].trim()));
    
        // для тела: для каждой строки — для каждой ячейки тоже рекурсивно
        const rows = [...bodyBlock.matchAll(/\[строка\]([\s\S]*?)\[\/строка\]/g)]
        .map(m => [...m[1].matchAll(/\[ячейка\]([\s\S]*?)\[\/ячейка\]/g)]
            .map(n => renderMiniML(n[1].trim())));

        const thead = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
        const tbody = `<tbody>${rows.map(
        row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`
        ).join('')}</tbody>`;

        return `<table class="table table-bordered">\n${thead}\n${tbody}\n</table>`;
    }
    );


  // 5) обёртка страницы
  html = html.replace(/\[страница\]([\s\S]*?)\[\/страница\]/g,
                      '<div class="container">$1</div>');

  return html.trim();
}

function formatCodeInput() {
  const textarea = document.getElementById("code-input");
  const lines = textarea.value.split("\n");

  let indentLevel = 0;
  const formatted = lines.map(rawLine => {
    const line = rawLine.trim();

    // если это закрывающий тег, уменьшаем уровень отступа до вывода
    if (/^\[\/[^\]]+\]/.test(line)) {
      indentLevel = Math.max(indentLevel - 1, 0);
    }

    // 4 пробела на уровень, как в VS Code
    const indented = "    ".repeat(indentLevel) + line;

    // если это открывающий тег (не самозакрывающийся и не строка-контейнер)
    if (/^\[[^\]\/][^\]]*\](?!.*\[\/)/.test(line)) {
      indentLevel++;
    }

    return indented;
  }).join("\n");

  textarea.value = formatted;
}

const code = document.getElementById("code-input");
const start = document.getElementById("start-code");
const format = document.getElementById("format-code");

format.addEventListener("click", formatCodeInput);

start.addEventListener("click", () => {
    const input = code.value.trim();
    document.getElementById('app').innerHTML = renderMiniML(input);
})