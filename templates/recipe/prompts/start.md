# Prompt: start `<name>`

```text
Lee AGENTS.md y recipes/<name>/AGENT.md.
Sesión ya abierta en el browser de Cursor en <url>.
Arranca recipes/<name>: inyecta scripts/main.js por CDP, persiste source b64,
monta guardians, deja RUNNING.
Si el job es largo, arma /loop 15s con sentinel AGENT_LOOP_TICK_<id>.
No pidas secretos.
Reporta: done / alive / phase.
```
