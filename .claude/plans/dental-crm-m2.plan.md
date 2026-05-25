# Plan: М2 — Расписание (Calendar)

**Source PRD**: `.claude/prds/dental-crm.prd.md`
**Selected Milestone**: М2 — Расписание (Calendar)
**Complexity**: Large

## Summary

Заменить текущий список-расписание на визуальный календарь с колонками по врачам/кабинетам, drag-and-drop для переноса записей и проверкой конфликтов. На бэкенде добавить три новых эндпоинта (диапазон дат, свободные слоты, проверка конфликта) и исправить поля `record_start`/`record_end` с `DateField` на `TimeField`. На фронтенде реализовать CSS Grid-календарь без сторонних calendar-библиотек с `@dnd-kit/core` для drag-and-drop.

## Patterns to Mirror

| Category | Source | Pattern |
|---|---|---|
| Naming (backend) | `backend/src/records/views.py:10` | ViewSet + `@action` для дополнительных эндпоинтов |
| Naming (frontend) | `frontend/src/api/files.ts:1` | Отдельный файл `api/<domain>.ts` на каждый домен |
| Permissions | `backend/src/records/views.py:31` | `get_permissions()` по action |
| Serializer | `backend/src/records/serializers.py:35` | `SerializerMethodField` для вычисляемых полей |
| Query filtering | `backend/src/records/views.py:15` | `get_queryset()` с `request.query_params` |
| Frontend data | `frontend/src/pages/admin/Schedule.tsx:22` | `useQuery` с `queryKey: ['records', date]` |
| Frontend mutation | `frontend/src/pages/admin/PatientFiles.tsx:109` | `useMutation` + `qc.invalidateQueries` |
| CSS Modules | `frontend/src/pages/admin/Schedule.module.css` | CSS Module рядом с компонентом |

## Known Data Model Issue

`record_start` и `record_end` в `backend/src/records/models.py:96-97` объявлены как `DateField("Время начала")` — семантически они должны быть `TimeField`. Без этого исправления невозможно строить временную сетку. Миграция обязательна перед UI-работой. Нужна `RunPython` миграция с `null=True` чтобы не сломать существующие данные.

## Files to Change

| File | Action | Why |
|---|---|---|
| `backend/src/records/models.py` | UPDATE | Изменить `record_start`/`record_end` на `TimeField(null=True, blank=True)` |
| `backend/src/records/migrations/0XXX_record_time_fields.py` | CREATE | Миграция смены типа полей |
| `backend/src/records/views.py` | UPDATE | Добавить `@action` для `calendar`, `slots`, `check-conflict` |
| `backend/src/records/serializers.py` | UPDATE | Добавить `CalendarRecordSerializer` |
| `frontend/package.json` | UPDATE | Добавить `@dnd-kit/core`, `@dnd-kit/utilities` |
| `frontend/src/api/records.ts` | UPDATE | Добавить `getCalendarRecords`, `getSlots`, `checkConflict`, `updateRecord` |
| `frontend/src/components/calendar/CalendarGrid.tsx` | CREATE | CSS Grid-календарь (день/неделя, колонки врач/кабинет) |
| `frontend/src/components/calendar/CalendarGrid.module.css` | CREATE | Стили временной сетки |
| `frontend/src/components/calendar/AppointmentCard.tsx` | CREATE | Карточка записи с цветом по статусу и DnD |
| `frontend/src/components/calendar/AppointmentCard.module.css` | CREATE | Стили карточки |
| `frontend/src/pages/admin/Schedule.tsx` | UPDATE | Подключить CalendarGrid, toolbar с toggles и фильтрами |
| `frontend/src/pages/admin/Schedule.module.css` | UPDATE | Стили toolbar, toggles |

## Tasks

### Task 1: Исправить типы полей time в модели Record

- **Action**: В `backend/src/records/models.py` изменить `record_start = models.DateField(...)` и `record_end = models.DateField(...)` на `models.TimeField(null=True, blank=True)`. Запустить `makemigrations records` — сгенерировать миграцию с `RunPython(forwards_func, elidable=True)` для обнуления некорректных дат. Затем `migrate`.
- **Mirror**: Поля `created_at`/`updated_at` как образец nullable-полей.
- **Validate**: `python manage.py migrate` завершается без ошибок.

### Task 2: Backend — эндпоинт `calendar`

- **Action**: В `RecordViewSet` добавить `@action(detail=False, methods=['get'], url_path='calendar')`. Фильтрация по `date_from`, `date_to`, `doctor`, `chair`. Использовать `CalendarRecordSerializer` с полями `id, client, client_first_name, client_last_name, doctor, doctor_name, chair, chair_title, record_start, record_end, reception_day, status, status_title`.
- **Mirror**: `get_queryset()` pattern в `views.py:15`.
- **Validate**: `GET /api/v1/records/calendar/?date_from=2026-05-25&date_to=2026-05-31` возвращает список.

### Task 3: Backend — эндпоинт `slots`

- **Action**: Добавить `@action(detail=False, methods=['get'], url_path='slots')`. Параметры: `doctor`, `date`. Возвращает `[{id, record_start, record_end}]` — занятые интервалы врача на дату.
- **Mirror**: Pattern `@action` из Task 2.
- **Validate**: `GET /api/v1/records/slots/?doctor=1&date=2026-05-25` → список интервалов.

### Task 4: Backend — эндпоинт `check-conflict`

- **Action**: Добавить `@action(detail=False, methods=['post'], url_path='check-conflict', permission_classes=[IsAdmin])`. Входные данные: `{doctor, date, record_start, record_end, exclude_id?}`. Логика: `Record.objects.filter(doctor_id=doctor, reception_day=date, record_start__lt=end, record_end__gt=start).exclude(id=exclude_id).exists()`. Вернуть `{"conflict": bool}`.
- **Mirror**: DRF `@action` с POST.
- **Validate**: POST с пересекающимися временами → `{"conflict": true}`.

### Task 5: Frontend — API-функции

- **Action**: Обновить `frontend/src/api/records.ts`:
  - Расширить `AppointmentRecord`: добавить `record_start: string | null`, `record_end: string | null`, `chair: number | null`, `doctor: number`, `status: number`
  - Добавить `getCalendarRecords(params: {date_from, date_to, doctor?, chair?})` → `GET /records/calendar/`
  - Добавить `getSlots(doctor: number, date: string)` → `GET /records/slots/`
  - Добавить `checkConflict(payload)` → `POST /records/check-conflict/`
  - Добавить `updateRecord(id: number, payload)` → `PATCH /records/{id}/`
- **Mirror**: `frontend/src/api/files.ts` — именование и axios pattern.
- **Validate**: `npm run build` — 0 TypeScript-ошибок.

### Task 6: Frontend — компонент `CalendarGrid`

- **Action**: Создать `frontend/src/components/calendar/CalendarGrid.tsx`. CSS Grid: строки = 30-минутные слоты 08:00–20:00 (24 строки), колонки = врачи или кабинеты. Пропсы: `records`, `viewMode: 'day'|'week'`, `groupBy: 'doctor'|'chair'`, `currentDate`, `onSlotClick`, `onRecordMove`. Позиционирование карточек через `grid-row` вычисленный из `record_start`. `DndContext` из `@dnd-kit/core` обёртывает сетку. При drop: `checkConflict` → если нет конфликта → `updateRecord` + `invalidateQueries`. Индикатор загрузки врача в заголовке колонки.
- **Mirror**: CSS Grid без сторонних calendar-библиотек (требование ТЗ).
- **Validate**: Визуально отображает записи на правильных временных позициях.

### Task 7: Frontend — компонент `AppointmentCard`

- **Action**: Создать `frontend/src/components/calendar/AppointmentCard.tsx`. Цветовая кодировка по `status_title` (Ожидает=синий, На приёме=зелёный, Завершён=серый, Отменён=красный). Контент: время, ФИО пациента, имя врача. `useDraggable` из `@dnd-kit/core`. Клик → `navigate('/admin/patients/{client}')`.
- **Mirror**: `Schedule.tsx:9` — существующий `cardClass` для цветов статуса.
- **Validate**: Карточки рендерятся и перетаскиваются.

### Task 8: Frontend — переработка `Schedule.tsx`

- **Action**: Обновить `frontend/src/pages/admin/Schedule.tsx`. Заменить список на `<CalendarGrid>`. Toolbar: переключатель день/неделя, переключатель врач/кабинет, select фильтра по врачу. `useQuery` с `getCalendarRecords`. Сохранить кнопку «+ Новая запись» и навигацию по датам.
- **Mirror**: `Schedule.tsx:22` — `useQuery` pattern.
- **Validate**: Страница `/admin/schedule` показывает визуальную сетку.

## Validation

```bash
# Backend
python manage.py makemigrations records
python manage.py migrate
python manage.py runserver   # запускается без ошибок

# Frontend
cd frontend && npm install   # после добавления @dnd-kit
cd frontend && npm run build # 0 TypeScript-ошибок
```

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Существующие данные в `record_start`/`record_end` некорректны после DateField→TimeField | High | `RunPython` миграция с обнулением; поля `null=True` |
| `@dnd-kit` совместимость с React 19 | Medium | `@dnd-kit/core` v6+ поддерживает React 19; проверить перед установкой |
| CSS Grid позиционирование при `record_start=null` | Medium | Показывать карточку в нулевой строке с предупреждением |
| Конфликты должны проверяться на бэкенде | Low | UI показывает предупреждение, финальная проверка только через API |

## Acceptance

- [ ] `GET /api/v1/records/calendar/` возвращает записи за диапазон дат
- [ ] `GET /api/v1/records/slots/` возвращает занятые интервалы врача
- [ ] `POST /api/v1/records/check-conflict/` корректно определяет пересечение
- [ ] Страница `/admin/schedule` показывает CSS Grid-календарь (не список)
- [ ] Переключатель день/неделя работает
- [ ] Переключатель врач/кабинет меняет колонки
- [ ] Drag-and-drop переносит запись и сохраняет через API
- [ ] Конфликт блокирует drop с сообщением пользователю
- [ ] All tasks complete
- [ ] Validation passes
- [ ] Patterns mirrored, not reinvented
