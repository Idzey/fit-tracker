# Frontend

Expo Router app for FitTrack.

## Run

```bash
cp .env.example .env
npx expo start
```

## Notes

- Query cache is persisted with AsyncStorage.
- Workout mutations are queued offline and replayed when connection returns.
- Sentry is optional and enabled when `EXPO_PUBLIC_SENTRY_DSN` is set.
