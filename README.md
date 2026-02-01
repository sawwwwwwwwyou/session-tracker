# 📊 Session Tracker

Локальный дашборд для трекинга сессий Clawdbot и sub-agents.

**UI:** http://localhost:3850
**API:** http://localhost:3850/api/sessions

## Запуск

```powershell
cd C:\Users\lskys\clawd\projects\session-tracker
node server.js
```

Или добавить в автозапуск системы.

---

## 🚨 ПРАВИЛА ДЛЯ КЛАВДИКА

### Когда добавлять сессию:
1. **В начале КАЖДОЙ задачи** — сразу POST с `status: "active"`
2. **При spawn sub-agent** — сразу POST для него
3. **Main session** — в начале рабочего дня

### Когда обновлять:
1. **Каждые 20k токенов** — PUT с обновлённым `totalTokens`
2. **При завершении** — PUT с `status: "completed"` и финальным `totalTokens`
3. **Weekly limit** — обновлять из `session_status` раз в день

### Выбор модели (ОБЯЗАТЕЛЬНО!):

| Сложность | Модель | Примеры |
|-----------|--------|---------|
| **Простая** | `haiku` | fetch, мониторинг, уведомления |
| **Средняя** | `sonnet` | анализ, решения, research |
| **Кодинг** | `opus` | любой код, рефакторинг |

⚠️ **Трейдинг = минимум Sonnet!** Haiku не умеет принимать решения.
⚠️ **НЕ СПАВНЬ OPUS НА МОНИТОРИНГ!**

---

## API Reference

### POST /api/sessions — Добавить сессию

```javascript
// Node.js (для кириллицы)
node -e "require('http').request({hostname:'localhost',port:3850,path:'/api/sessions',method:'POST',headers:{'Content-Type':'application/json'}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(d))}).end(JSON.stringify({label:'session-name',task:'описание',model:'opus',status:'active',totalTokens:0}))"
```

**Поля:**
- `label` — короткое имя (`fallas-opus`, `script-check`)
- `task` — описание задачи
- `model` — `opus` / `sonnet` / `haiku`
- `status` — `active` (начало) или `completed` (конец)
- `totalTokens` — сколько токенов потрачено

**Возвращает:** объект сессии с `id`

### PUT /api/sessions/:id — Обновить сессию

```javascript
node -e "require('http').request({hostname:'localhost',port:3850,path:'/api/sessions/<ID>',method:'PUT',headers:{'Content-Type':'application/json'}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(d))}).end(JSON.stringify({status:'completed',totalTokens:45000}))"
```

При `status: "completed"` автоматически ставится `completedAt`.

### GET /api/sessions — Все сессии

```powershell
Invoke-RestMethod -Uri "http://localhost:3850/api/sessions"
```

Возвращает массив, отсортированный по `startedAt` (новые первые).

### DELETE /api/sessions/:id — Удалить сессию

```powershell
Invoke-RestMethod -Uri "http://localhost:3850/api/sessions/<ID>" -Method DELETE
```

### GET /api/stats — Статистика

```powershell
Invoke-RestMethod -Uri "http://localhost:3850/api/stats"
```

**Возвращает:**
```json
{
  "total": 5,
  "active": 1,
  "completed": 4,
  "totalTokens": 125000,
  "todayCount": 3,
  "todayTokens": 45000,
  "weeklyLimit": 80
}
```

### GET/PUT /api/weekly — Weekly Limit

```powershell
# Получить
Invoke-RestMethod -Uri "http://localhost:3850/api/weekly"

# Установить
node -e "require('http').request({hostname:'localhost',port:3850,path:'/api/weekly',method:'PUT',headers:{'Content-Type':'application/json'}},r=>{}).end(JSON.stringify({weeklyLimit:75}))"
```

---

## UI Features

### Цвета токенов:
- 🟢 Зелёный: <20k — экономно
- 🟡 Жёлтый: 20k-80k — нормально  
- 🔴 Красный: >80k — много

### Weekly Limit индикатор:
- 🟢 >40% — ок
- 🟡 15-40% — внимание
- 🔴 <15% — СТОП, не спавнить агентов!

### Фильтры:
- По модели (Opus/Sonnet/Haiku)
- По статусу (Active/Completed)
- Текстовый поиск по label и task

---

## Файлы

| Файл | Описание |
|------|----------|
| `server.js` | Express сервер (порт 3850) |
| `index.html` | UI дашборд |
| `sessions.json` | Персистентное хранилище сессий |
| `state.json` | Weekly limit и настройки |

---

## Интеграция с Clawdbot

### В AGENTS.md:
- Общие правила когда добавлять/обновлять сессии
- Матрица выбора модели

### В TOOLS.md:
- API endpoints и примеры кода

### В HEARTBEAT.md:
- Периодическая проверка Session Tracker
- Обновление weekly limit из `session_status`

---

## Troubleshooting

**Сервер не запускается:**
```powershell
cd C:\Users\lskys\clawd\projects\session-tracker
npm install
node server.js
```

**Кириллица ломается:**
Используй Node.js one-liner вместо PowerShell Invoke-RestMethod.

**UI не обновляется:**
Нажми Refresh или подожди 30 секунд (авто-refresh).
