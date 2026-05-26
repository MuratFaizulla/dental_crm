# Plan: М7 — Пациентский портал

**Source PRD**: `.claude/prds/dental-crm.prd.md`
**Selected Milestone**: М7 — Пациентский портал
**Complexity**: Medium

---

## Прогресс задач

| # | Задача | Статус |
|---|---|---|
| T1 | Backend — `gender` + модель `FamilyMember` + миграция | ✅ done |
| T2 | Backend — `GET/PATCH /users/me/`, `DELETE /users/me/` | ✅ done |
| T3 | Backend — `POST /users/me/change-password/` | ✅ done |
| T4 | Backend — `POST /auth/forgot-password/` + `POST /auth/reset-password/` (SMS stub) | ✅ done |
| T5 | Backend — FamilyMember CRUD `/api/v1/family/` | ✅ done |
| T6 | Frontend — `api/profile.ts` + `api/family.ts` | ✅ done |
| T7 | Frontend — Страница профиля (аватар-инициалы, просмотр) | ✅ done |
| T8 | Frontend — Форма редактирования профиля | ✅ done |
| T9 | Frontend — Смена пароля + удаление аккаунта | ✅ done |
| T10 | Frontend — Секция Отбасы (список + добавление/удаление) | ✅ done |
| T11 | Frontend — `/forgot-password` → SMS-код → новый пароль | ✅ done |
| T12 | Frontend — PortalLayout + роуты в App.tsx | ✅ done |

---

## Summary

Полноценный личный кабинет пациента: просмотр и редактирование профиля с аватаром (fallback — инициалы из имени и фамилии), управление членами семьи (7 типов родства), смена пароля, удаление аккаунта, восстановление пароля через SMS-код (stub: вывод кода в консоль сервера).

---

## Что уже реализовано (М1)

| Фича | Файл |
|---|---|
| Регистрация `POST /auth/register/` | `users/views.py`, `users/serializers.py` |
| Вход по логину + паролю | `users/jwt.py`, `api/urls.py` |
| User model: username, iin, father_name, oblast, address, language, avatar, mobile_phone, date_of_birth | `users/models.py` |
| `/register` страница | `frontend/src/pages/Register.tsx` |
| Login страница | `frontend/src/pages/Login.tsx` |

---

## Новые модели

### User — добавить поле `gender`
```python
gender = models.CharField('Жынысы', max_length=1,
    choices=[('M', 'Ер'), ('F', 'Әйел')], blank=True, default='')
```

### FamilyMember (в `users/models.py`)
```python
RELATION_CHOICES = [
    ('mother',          'Ана'),
    ('father',          'Әке'),
    ('son',             'Ұлы'),
    ('daughter',        'Қызы'),
    ('adoptive_parent', 'Асырап алушы'),
    ('grandparent',     'Ата ана'),
    ('adopted_child',   'Асырап алынған бала'),
]
# Поля: user(FK), relation_type, iin, last_name, first_name,
#        father_name, date_of_birth, gender, address, created_at, updated_at
```

---

## Backend API

| Метод | URL | Доступ |
|---|---|---|
| GET | `/api/v1/users/me/` | IsAuthenticated |
| PATCH | `/api/v1/users/me/` | IsAuthenticated |
| DELETE | `/api/v1/users/me/` | IsAuthenticated |
| POST | `/api/v1/users/me/change-password/` | IsAuthenticated |
| POST | `/api/v1/auth/forgot-password/` | AllowAny |
| POST | `/api/v1/auth/reset-password/` | AllowAny |
| GET | `/api/v1/family/` | IsAuthenticated |
| POST | `/api/v1/family/` | IsAuthenticated |
| PATCH | `/api/v1/family/<id>/` | IsAuthenticated (owner) |
| DELETE | `/api/v1/family/<id>/` | IsAuthenticated (owner) |

---

## Frontend — маршруты

| Путь | Компонент |
|---|---|
| `/portal/profile` | `portal/Profile.tsx` |
| `/portal/profile/edit` | `portal/EditProfile.tsx` |
| `/portal/profile/password` | `portal/ChangePassword.tsx` |
| `/portal/family` | `portal/Family.tsx` |
| `/forgot-password` | `ForgotPassword.tsx` |
| `/reset-password` | `ResetPassword.tsx` |

---

## Files to Change

| File | Action | Why |
|---|---|---|
| `backend/src/users/models.py` | UPDATE | `gender` + `FamilyMember` |
| `backend/src/users/migrations/0004_*.py` | CREATE | Миграция |
| `backend/src/users/otp.py` | CREATE | OTP: generate, save to cache, verify |
| `backend/src/users/serializers.py` | UPDATE | Profile, ChangePassword, ForgotPassword, ResetPassword, FamilyMember |
| `backend/src/users/views.py` | UPDATE | MeView, ChangePasswordView, ForgotPasswordView, ResetPasswordView, FamilyMemberViewSet |
| `backend/src/users/urls.py` | UPDATE | 10 новых маршрутов |
| `backend/src/users/jwt.py` | UPDATE | Добавить `first_name`, `last_name` в токен |
| `frontend/src/api/profile.ts` | CREATE | API профиля |
| `frontend/src/api/family.ts` | CREATE | API семьи |
| `frontend/src/pages/portal/PortalLayout.tsx` | CREATE | Layout пациента |
| `frontend/src/pages/portal/Profile.tsx` | CREATE | Страница профиля |
| `frontend/src/pages/portal/Profile.module.css` | CREATE | Стили |
| `frontend/src/pages/portal/EditProfile.tsx` | CREATE | Редактирование |
| `frontend/src/pages/portal/EditProfile.module.css` | CREATE | Стили |
| `frontend/src/pages/portal/ChangePassword.tsx` | CREATE | Смена пароля |
| `frontend/src/pages/portal/Family.tsx` | CREATE | Члены семьи |
| `frontend/src/pages/portal/Family.module.css` | CREATE | Стили |
| `frontend/src/pages/ForgotPassword.tsx` | CREATE | Сброс пароля |
| `frontend/src/App.tsx` | UPDATE | Роуты `/portal/*`, `/forgot-password`, `/reset-password` |
| `frontend/src/store/authStore.ts` | UPDATE | `firstName`, `lastName` из токена |

---

## Validation

```bash
# Backend
docker exec dental_crm-backend-1 python /DENTAL_CRM/backend/src/manage.py makemigrations users
docker exec dental_crm-backend-1 python /DENTAL_CRM/backend/src/manage.py migrate
docker exec dental_crm-backend-1 python /DENTAL_CRM/backend/src/manage.py check

# Frontend
docker exec dental_crm-frontend-1 sh -c "cd /app && npx tsc --noEmit"
```

---

## Risks

| Риск | Вероятность | Митигация |
|---|---|---|
| OTP в `LocMemCache` — не персистентен между рестартами | Medium | Для dev ок; prod — Redis (М5) |
| Загрузка аватара (multipart) | Medium | В этом плане не реализуется — только отображение |
| JWT не имеет `first_name`/`last_name` | Medium | Добавить в `CustomTokenObtainPairSerializer` |

---

## Acceptance

- [ ] T1: миграция `0004` применена без ошибок
- [ ] T2: `GET /users/me/` возвращает профиль
- [ ] T3: `PATCH /users/me/` сохраняет изменения
- [ ] T4: `POST /users/me/change-password/` меняет пароль
- [ ] T5: `POST /auth/forgot-password/` логирует OTP в консоль
- [ ] T6: `POST /auth/reset-password/` проверяет OTP и меняет пароль
- [ ] T7: CRUD `/family/` работает
- [ ] T8: `/portal/profile` — инициалы отображаются при отсутствии аватара
- [ ] T9: `/portal/profile/edit` — данные сохраняются
- [ ] T10: `/portal/family` — добавление и удаление работают
- [ ] T11: `/forgot-password` — полный флоу до смены пароля
- [ ] T12: `tsc --noEmit` — 0 ошибок
