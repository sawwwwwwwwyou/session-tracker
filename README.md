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
| `sessions.json` | Хранилище сессий |
| `state.json` | Weekly limit и настройки |

---

## 🤖 Интеграция с агентом (чтобы не забывать)

Проблема: агент может забыть добавлять сессии в трекер при `sessions_spawn`.

Решение: добавить жёсткое правило в SOUL.md (или AGENTS.md):

```markdown
## 📊 Session Tracker (ОБЯЗАТЕЛЬНО)

**При КАЖДОМ `sessions_spawn` → СРАЗУ POST в Session Tracker!**

\`\`\`javascript
node -e "require('http').request({hostname:'localhost',port:3850,path:'/api/sessions',method:'POST',headers:{'Content-Type':'application/json'}},r=>{}).end(JSON.stringify({label:'...',task:'...',model:'haiku|sonnet|opus',status:'active'}))"
\`\`\`

**Порядок:**
1. `sessions_spawn` → получил childSessionKey
2. СРАЗУ POST в трекер (status: active)
3. Когда sub-agent завершится → PUT status: completed + totalTokens

**Не забывай. Это твоя память о работе.**
```

Это правило читается агентом каждую сессию и служит напоминанием.
