# Examples (optional)

Referencias de dominio real para estudiar el patrón. **No son el default del framework.**

El flujo principal es siempre:

```text
templates/recipe → recipes/<tu-automatizacion>
```

| Example | Notes |
|---------|--------|
| [ig-dm-wipe](ig-dm-wipe/) | **Peligroso / destructivo.** Instagram DM wipe — solo con intención explícita. Nunca commitear labels reales de chats; usa `Example User` / `Sticky Group Chat`. |

Cuando copies ideas desde un example, **renombra** storage keys y globals al prefijo de tu recipe; no reutilices names `__ig*` en jobs nuevos.
