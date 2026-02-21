# Next.js App Router – Routing Fundamentals

## 1. What is Routing?

Routing is how URLs map to files in a Next.js project.

Example:

/contact

The important part is the path after the domain.

---

## 2. What Does "/" Mean?

"/" represents the root of the website.

These are the same:

http://localhost:3000
http://localhost:3000/

The root route is controlled by:

app/page.tsx → /

---

## 3. Core Rule of the App Router

Inside the app/ directory:

- Folder name = URL segment
- page.tsx = the actual page rendered

---

## 4. Static Routes

Example:

app/contact/page.tsx → /contact

app/about/page.tsx → /about

app/dashboard/settings/page.tsx → /dashboard/settings

Each folder becomes part of the URL structure.

---

## 5. Dynamic Routes

Dynamic segments use square brackets.

Example:

app/game/[roomId]/page.tsx

This controls:

/game/123
/game/abc
/game/anything

[roomId] means the value is dynamic.

---

## 6. Mental Model

If the URL is:

/a/b/c

The folder structure should be:

app/a/b/c/page.tsx

Think of the URL like nested folders.

---

## Summary

- "/" = homepage
- Every folder inside app/ becomes a URL segment
- page.tsx defines the page
- [param] creates a dynamic route