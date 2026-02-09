# Translation File Comparison: English, Russian, and Romanian

## Summary

This document details the missing keys across the three translation files.

---

## MISSING IN ROMANIAN

These keys are present in both English and Russian but missing from Romanian:

### 1. Entire Section Missing: `auth`
The entire authentication section is completely missing in Romanian. This includes:
- signIn, signUp, signOut, email, password, confirmPassword, forgotPassword, resetPassword
- rememberMe, noAccount, hasAccount, loginSuccess, loginError, registerSuccess, registerError
- invalidCredentials, emailRequired, passwordRequired, passwordTooShort, passwordsDoNotMatch

### 2. Entire Section Missing: `errors`
The entire errors section is completely missing in Romanian. This includes:
- networkError, serverError, unauthorized, forbidden, notFound, validationError, unknownError

### 3. `common` section - Missing keys:
- `dark` (English: "Dark", Russian: "Тёмная")
- `light` (English: "Light", Russian: "Светлая")

**English values for missing auth section:**
```
signIn: "Sign In"
signUp: "Sign Up"
signOut: "Sign Out"
email: "Email"
password: "Password"
confirmPassword: "Confirm Password"
forgotPassword: "Forgot Password?"
resetPassword: "Reset Password"
rememberMe: "Remember Me"
noAccount: "Don't have an account?"
hasAccount: "Already have an account?"
loginSuccess: "Successfully logged in"
loginError: "Login failed"
registerSuccess: "Account created successfully"
registerError: "Registration failed"
invalidCredentials: "Invalid email or password"
emailRequired: "Email is required"
passwordRequired: "Password is required"
passwordTooShort: "Password must be at least 6 characters"
passwordsDoNotMatch: "Passwords do not match"
```

**English values for missing errors section:**
```
networkError: "Network error. Please check your connection."
serverError: "Server error. Please try again later."
unauthorized: "Please log in to continue."
forbidden: "You don't have permission to do this."
notFound: "Not found."
validationError: "Please check your input."
unknownError: "Something went wrong."
```

**English values for missing common keys:**
```
dark: "Dark"
light: "Light"
```

---

## MISSING IN RUSSIAN

These keys are present in both English and Romanian but missing from Russian:

**None identified.** Russian file appears to be complete with all sections and keys present.

---

## MISSING IN ENGLISH

These keys are present in both Russian and Romanian but missing from English:

**None identified.** English file appears to be complete with all sections and keys present that are in Russian and Romanian.

---

## Summary Statistics

| Language | Total Sections | Missing Sections | Missing Individual Keys | Status |
|----------|---|---|---|---|
| English | 23 | 0 | 0 | ✅ Complete |
| Russian | 23 | 0 | 0 | ✅ Complete |
| Romanian | 21 | 2 (`auth`, `errors`) | 2 (`common.dark`, `common.light`) | ⚠️ Incomplete |

---

## Recommendations

### Priority 1: Add Missing Sections to Romanian
1. **Add `auth` section** with 19 keys (authentication-related translations)
2. **Add `errors` section** with 7 keys (error message translations)

### Priority 2: Add Missing Keys to Romanian
1. Add `dark` and `light` to the `common` section

### Translation Guide (Russian translations can be used as reference)

#### For `auth` section (Romanian translations needed):
- signIn → "Autentificare" (Russian: "Вход")
- signUp → "Înregistrare" (Russian: "Регистрация")
- signOut → "Ieșire" (Russian: "Выход")
- email → "E-mail" (Russian: "Email")
- password → "Parolă" (Russian: "Пароль")
- confirmPassword → "Confirmă parola" (Russian: "Подтвердите пароль")
- forgotPassword → "Ai uitat parola?" (Russian: "Забыли пароль?")
- resetPassword → "Resetează parola" (Russian: "Сбросить пароль")
- rememberMe → "Ține-mă minte" (Russian: "Запомнить меня")
- noAccount → "Nu ai cont?" (Russian: "Нет аккаунта?")
- hasAccount → "Deja ai cont?" (Russian: "Уже есть аккаунт?")
- loginSuccess → "Te-ai autentificat cu succes" (Russian: "Вход выполнен успешно")
- loginError → "Autentificarea a eșuat" (Russian: "Ошибка входа")
- registerSuccess → "Cont creat cu succes" (Russian: "Аккаунт успешно создан")
- registerError → "Înregistrarea a eșuat" (Russian: "Ошибка регистрации")
- invalidCredentials → "Email sau parolă incorectă" (Russian: "Неверный email или пароль")
- emailRequired → "Email este obligatoriu" (Russian: "Введите email")
- passwordRequired → "Parola este obligatorie" (Russian: "Введите пароль")
- passwordTooShort → "Parola trebuie să aibă cel puțin 6 caractere" (Russian: "Пароль должен быть не менее 6 символов")
- passwordsDoNotMatch → "Parolele nu se potrivesc" (Russian: "Пароли не совпадают")

#### For `errors` section (Romanian translations needed):
- networkError → "Eroare de rețea. Verifică conexiunea." (Russian: "Ошибка сети. Проверьте подключение.")
- serverError → "Eroare de server. Încearcă mai târziu." (Russian: "Ошибка сервера. Попробуйте позже.")
- unauthorized → "Autentifică-te pentru a continua." (Russian: "Войдите в систему для продолжения.")
- forbidden → "Nu ai permisiunea pentru aceasta." (Russian: "У вас нет прав для этого действия.")
- notFound → "Nu a fost găsit." (Russian: "Не найдено.")
- validationError → "Verifică informațiile introduse." (Russian: "Проверьте введённые данные.")
- unknownError → "Ceva a mers rău." (Russian: "Что-то пошло не так.")

#### For `common` section additions:
- dark → "Închis" (Romanian pattern) or "Negru" (Russian: "Тёмная")
- light → "Deschis" (Romanian pattern) or "Alb" (Russian: "Светлая")

