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

## API Reference

### POST /api/sessions — Добавить сессию

```javascript
node -e "require('http').request({hostname:'localhost',port:3850,path:'/api/sessions',method:'POST',headers:{'Content-Type':'application/json'}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(d))}).end(JSON.stringify({label:'session-name',task:'описание',model:'opus',status:'active',totalTokens:0}))"
```

**Поля:**
- `label` — короткое имя сессии
- `task` — описание задачи
- `model` — `opus` / `sonnet` / `haiku`
- `status` — `active` или `completed`
- `totalTokens` — сколько токенов потрачено

### PUT /api/sessions/:id — Обновить сессию

```javascript
node -e "require('http').request({hostname:'localhost',port:3850,path:'/api/sessions/<ID>',method:'PUT',headers:{'Content-Type':'application/json'}},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log(d))}).end(JSON.stringify({status:'completed',totalTokens:45000}))"
```

### GET /api/sessions — Все сессии

```powershell
Invoke-RestMethod -Uri "http://localhost:3850/api/sessions"
```

### DELETE /api/sessions/:id — Удалить сессию

```powershell
Invoke-RestMethod -Uri "http://localhost:3850/api/sessions/<ID>" -Method DELETE
```

### GET /api/stats — Статистика

```powershell
Invoke-RestMethod -Uri "http://localhost:3850/api/stats"
```

### GET/PUT /api/weekly — Weekly Limit

```powershell
# Получить
Invoke-RestMethod -Uri "http://localhost:3850/api/weekly"

# Установить (weeklyLimit = %, daysLeft = дней до ресета)
node -e "require('http').request({hostname:'localhost',port:3850,path:'/api/weekly',method:'PUT',headers:{'Content-Type':'application/json'}},r=>{}).end(JSON.stringify({weeklyLimit:75,daysLeft:5}))"
```

---

## UI Features

### Цвета токенов сессий:
- 🟢 Зелёный: <20k — экономно
- 🟡 Жёлтый: 20k-80k — нормально  
- 🔴 Красный: >80k — много

### Weekly Limit индикатор:

Цвет зависит от % токенов на оставшийся день:
- 🟢 Зелёный: ≥14.3% на день (норма)
- 🟡 Жёлтый: 10-14.3% на день (экономить!)
- 🔴 Красный: <10% на день (СТОП!)

**Формула:** `perDay = weeklyLimit / daysLeft`

### Фильтры:
- По модели (Opus/Sonnet/Haiku)
- По статусу (Active/Completed)
- Текстовый поиск

---

## Файлы

| Файл | Описание |
|------|----------|
| `server.js` | Express сервер (порт 3850) |
| `index.html` | UI дашборд |
| `sessions.example.json` | Пример структуры сессий |
| `state.example.json` | Пример state файла |

### Хранение данных

Данные хранятся **вне проекта** (чтобы не попадали в git):

```
~/.clawdbot/session-tracker/
├── sessions.json    ← реальные сессии
└── state.json       ← weekly limit и настройки
```

Папка создаётся автоматически при первом запуске сервера.

---

## 🤖 Интеграция с агентом

Чтобы агент не забывал обновлять трекер, добавьте правило в системный промпт (SOUL.md, AGENTS.md или аналог):

```markdown
## 📊 Session Tracker (ОБЯЗАТЕЛЬНО)

**При КАЖДОМ `sessions_spawn` → СРАЗУ POST в Session Tracker!**
**После КАЖДОГО tool call → обновить weekly limit!**

# Добавить сессию
node -e "require('http').request({hostname:'localhost',port:3850,path:'/api/sessions',method:'POST',headers:{'Content-Type':'application/json'}},r=>{}).end(JSON.stringify({label:'...',task:'...',model:'haiku|sonnet|opus',status:'active'}))"

# Обновить weekly (после session_status)
node -e "require('http').request({hostname:'localhost',port:3850,path:'/api/weekly',method:'PUT',headers:{'Content-Type':'application/json'}},r=>{}).end(JSON.stringify({weeklyLimit:XX}))"

**Порядок:**
1. `sessions_spawn` → СРАЗУ POST в трекер (status: active)
2. Когда sub-agent завершится → PUT status: completed + totalTokens
3. После любой работы → проверить usage → обновить weekly в трекере

**Это бесплатно (localhost HTTP). Не экономь на этом.**
```

### Почему это важно

- HTTP запросы к localhost = 0 токенов
- Без правила агент забывает обновлять
- Weekly limit показывает актуальное состояние API лимитов
- Сессии показывают куда уходят токены
