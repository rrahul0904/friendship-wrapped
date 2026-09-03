# PulseAtlas portfolio observability

PulseAtlas is an optional downstream observability sink. It is not a product database and cannot become a requirement for ThreadTales, MyYear.World, or PetLife to work.

The integration reuses `sanitizeProductEvent()`. The only fields sent are the registered event name, product identifier, and an allowlisted story mode when present. No raw WhatsApp messages, imported files, participant names, top words, photo bytes, captions, pet memories, share content, or derived story text are sent.

Delivery is server-side, capped at a short timeout, and fail-open. Configure only when a PulseAtlas ingestion endpoint and Friendship Wrapped project write key exist:

- `PULSEATLAS_ENDPOINT`
- `PULSEATLAS_WRITE_KEY`
- `PULSEATLAS_ENVIRONMENT`

The existing generic telemetry/Supabase paths remain independent; PulseAtlas does not replace application persistence.
