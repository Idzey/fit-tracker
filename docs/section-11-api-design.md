# Раздел 11 — API Design (OpenAPI 3.1)

Файл `backend/openapi.yaml` — источник истины. Orval генерирует из него TypeScript-клиент.

```yaml
openapi: "3.1.0"

info:
  title: FitTrack API
  version: "1.0.0"

servers:
  - url: http://localhost:3000
    description: Local dev

security:
  - BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    # ── Auth ──────────────────────────────────────────────────────────────────
    RegisterRequest:
      type: object
      required: [email, password, role, name]
      properties:
        email:    { type: string, format: email }
        password: { type: string, minLength: 8, maxLength: 72 }
        role:     { type: string, enum: [TRAINER, CLIENT] }
        name:     { type: string, minLength: 2, maxLength: 100 }

    LoginRequest:
      type: object
      required: [email, password]
      properties:
        email:    { type: string, format: email }
        password: { type: string }

    AuthResponse:
      type: object
      properties:
        accessToken:  { type: string }
        refreshToken: { type: string }
        user:
          type: object
          properties:
            id:    { type: string }
            email: { type: string }
            role:  { type: string, enum: [TRAINER, CLIENT] }

    # ── Common ────────────────────────────────────────────────────────────────
    Error:
      type: object
      required: [code, message]
      properties:
        code:    { type: string }
        message: { type: string }

    Pagination:
      type: object
      properties:
        page:    { type: integer }
        limit:   { type: integer }
        total:   { type: integer }
        hasMore: { type: boolean }

    # ── Clients ───────────────────────────────────────────────────────────────
    ClientListItem:
      type: object
      properties:
        id:             { type: string }
        name:           { type: string }
        avatarUrl:      { type: string, nullable: true }
        lastWorkoutAt:  { type: string, format: date-time, nullable: true }
        totalWorkouts:  { type: integer }
        activeProgram:  { type: string, nullable: true }

    ClientDetail:
      type: object
      properties:
        id:         { type: string }
        name:       { type: string }
        email:      { type: string }
        age:        { type: integer, nullable: true }
        weight:     { type: number, nullable: true }
        height:     { type: number, nullable: true }
        goals:      { type: string, nullable: true }
        avatarUrl:  { type: string, nullable: true }
        createdAt:  { type: string, format: date-time }

    CreateClientRequest:
      type: object
      required: [name, email]
      properties:
        name:   { type: string, minLength: 2, maxLength: 100 }
        email:  { type: string, format: email }
        age:    { type: integer, minimum: 10, maximum: 100 }
        weight: { type: number, minimum: 20, maximum: 500 }
        height: { type: number, minimum: 50, maximum: 250 }
        goals:  { type: string, maxLength: 500 }

    # ── Workout Templates ─────────────────────────────────────────────────────
    WorkoutTemplate:
      type: object
      properties:
        id:          { type: string }
        name:        { type: string }
        description: { type: string, nullable: true }
        daysCount:   { type: integer }
        createdAt:   { type: string, format: date-time }

    WorkoutTemplateDetail:
      allOf:
        - $ref: '#/components/schemas/WorkoutTemplate'
        - type: object
          properties:
            days:
              type: array
              items:
                $ref: '#/components/schemas/WorkoutDay'

    WorkoutDay:
      type: object
      properties:
        id:        { type: string }
        dayNumber: { type: integer }
        name:      { type: string }
        exercises:
          type: array
          items:
            $ref: '#/components/schemas/Exercise'

    Exercise:
      type: object
      properties:
        id:       { type: string }
        name:     { type: string }
        sets:     { type: integer }
        reps:     { type: integer, nullable: true }
        weight:   { type: number, nullable: true }
        duration: { type: integer, nullable: true }
        notes:    { type: string, nullable: true }
        order:    { type: integer }

    # ── Workout Logs ──────────────────────────────────────────────────────────
    WorkoutLog:
      type: object
      properties:
        id:          { type: string }
        status:      { type: string, enum: [PENDING, IN_PROGRESS, COMPLETED, SKIPPED] }
        dayName:     { type: string }
        templateName:{ type: string }
        startedAt:   { type: string, format: date-time, nullable: true }
        completedAt: { type: string, format: date-time, nullable: true }
        exercises:
          type: array
          items:
            $ref: '#/components/schemas/ExerciseLog'

    ExerciseLog:
      type: object
      properties:
        id:            { type: string }
        exerciseId:    { type: string }
        name:          { type: string }
        sets:          { type: integer }
        completedSets: { type: integer }
        actualReps:    { type: integer, nullable: true }
        actualWeight:  { type: number, nullable: true }
        notes:         { type: string, nullable: true }

    # ── Progress ──────────────────────────────────────────────────────────────
    ProgressSummary:
      type: object
      properties:
        totalWorkouts:    { type: integer }
        workoutsThisWeek: { type: integer }
        completionRate:   { type: number }
        lastWorkoutAt:    { type: string, format: date-time, nullable: true }
        streak:           { type: integer }

    # ── Photos ────────────────────────────────────────────────────────────────
    ProgressPhoto:
      type: object
      properties:
        id:           { type: string }
        thumbnailUrl: { type: string, nullable: true }
        status:       { type: string, enum: [PENDING, UPLOADED, READY, FAILED] }
        takenAt:      { type: string, format: date-time, nullable: true }
        uploadedAt:   { type: string, format: date-time, nullable: true }

    PresignRequest:
      type: object
      required: [filename, contentType, size]
      properties:
        filename:    { type: string }
        contentType: { type: string, enum: [image/jpeg, image/png, image/webp] }
        size:        { type: integer, maximum: 10485760 }
        takenAt:     { type: string, format: date-time }

    PresignResponse:
      type: object
      properties:
        uploadUrl: { type: string }
        photoId:   { type: string }
        expiresAt: { type: string, format: date-time }

    # ── Notifications ─────────────────────────────────────────────────────────
    Notification:
      type: object
      properties:
        id:        { type: string }
        type:      { type: string }
        title:     { type: string }
        body:      { type: string }
        readAt:    { type: string, format: date-time, nullable: true }
        createdAt: { type: string, format: date-time }

    # ── Subscription ──────────────────────────────────────────────────────────
    Subscription:
      type: object
      properties:
        plan:      { type: string, enum: [FREE, PRO] }
        status:    { type: string, enum: [ACTIVE, EXPIRED, CANCELLED] }
        expiresAt: { type: string, format: date-time, nullable: true }
        clientsUsed:  { type: integer }
        clientsLimit: { type: integer, nullable: true }

paths:
  # ── Auth ──────────────────────────────────────────────────────────────────
  /auth/register:
    post:
      tags: [Auth]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/RegisterRequest' }
            example:
              email: trainer@example.com
              password: secret123
              role: TRAINER
              name: Ivan Petrov
      responses:
        "201":
          description: Registered
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AuthResponse' }
        "409":
          description: Email taken
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }
              example: { code: EMAIL_TAKEN, message: Email already registered }

  /auth/login:
    post:
      tags: [Auth]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/LoginRequest' }
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AuthResponse' }
        "401":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }
              example: { code: INVALID_CREDENTIALS, message: Invalid email or password }

  /auth/refresh:
    post:
      tags: [Auth]
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [refreshToken]
              properties:
                refreshToken: { type: string }
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/AuthResponse' }
        "401":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }

  /auth/logout:
    post:
      tags: [Auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [refreshToken]
              properties:
                refreshToken: { type: string }
      responses:
        "204": { description: Logged out }

  # ── Users ─────────────────────────────────────────────────────────────────
  /users/me:
    get:
      tags: [Users]
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ClientDetail' }
    put:
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:           { type: string }
                bio:            { type: string }
                specialization: { type: string }
                age:            { type: integer }
                weight:         { type: number }
                height:         { type: number }
                goals:          { type: string }
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ClientDetail' }

  /devices/token:
    post:
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [token, platform]
              properties:
                token:    { type: string }
                platform: { type: string, enum: [ios, android] }
      responses:
        "204": { description: Token saved }

  # ── Clients ───────────────────────────────────────────────────────────────
  /trainer/clients:
    get:
      tags: [Clients]
      parameters:
        - in: query
          name: page
          schema: { type: integer, default: 1 }
        - in: query
          name: limit
          schema: { type: integer, default: 20 }
        - in: query
          name: search
          schema: { type: string }
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/ClientListItem' }
                  pagination: { $ref: '#/components/schemas/Pagination' }
    post:
      tags: [Clients]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/CreateClientRequest' }
      responses:
        "201":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ClientDetail' }
        "403":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }
              example: { code: PLAN_LIMIT_REACHED, message: Upgrade to Pro to add more clients }

  /trainer/clients/{clientId}:
    get:
      tags: [Clients]
      parameters:
        - in: path
          name: clientId
          required: true
          schema: { type: string }
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ClientDetail' }
        "404":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }

  # ── Workout Templates ─────────────────────────────────────────────────────
  /workout-templates:
    get:
      tags: [Workouts]
      responses:
        "200":
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/WorkoutTemplate' }
    post:
      tags: [Workouts]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name]
              properties:
                name:        { type: string }
                description: { type: string }
      responses:
        "201":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/WorkoutTemplate' }

  /workout-templates/{id}:
    get:
      tags: [Workouts]
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/WorkoutTemplateDetail' }

  # ── Workout Execution (Client) ────────────────────────────────────────────
  /workouts/today:
    get:
      tags: [Workouts]
      responses:
        "200":
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/WorkoutLog' }

  /workouts/{logId}/complete:
    post:
      tags: [Workouts]
      parameters:
        - in: path
          name: logId
          required: true
          schema: { type: string }
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/WorkoutLog' }

  /workouts/{logId}/exercises/{exerciseLogId}:
    put:
      tags: [Workouts]
      parameters:
        - in: path
          name: logId
          required: true
          schema: { type: string }
        - in: path
          name: exerciseLogId
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                completedSets: { type: integer }
                actualReps:    { type: integer }
                actualWeight:  { type: number }
                notes:         { type: string }
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ExerciseLog' }

  # ── Photos ────────────────────────────────────────────────────────────────
  /uploads/presign:
    post:
      tags: [Photos]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/PresignRequest' }
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/PresignResponse' }

  /uploads/{photoId}/confirm:
    post:
      tags: [Photos]
      parameters:
        - in: path
          name: photoId
          required: true
          schema: { type: string }
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/ProgressPhoto' }

  /photos:
    get:
      tags: [Photos]
      parameters:
        - in: query
          name: page
          schema: { type: integer, default: 1 }
        - in: query
          name: limit
          schema: { type: integer, default: 20 }
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/ProgressPhoto' }
                  pagination: { $ref: '#/components/schemas/Pagination' }

  /photos/{photoId}/url:
    get:
      tags: [Photos]
      parameters:
        - in: path
          name: photoId
          required: true
          schema: { type: string }
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  url:       { type: string }
                  expiresAt: { type: string, format: date-time }

  # ── Notifications ─────────────────────────────────────────────────────────
  /notifications:
    get:
      tags: [Notifications]
      parameters:
        - in: query
          name: page
          schema: { type: integer, default: 1 }
        - in: query
          name: unreadOnly
          schema: { type: boolean }
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/Notification' }
                  pagination: { $ref: '#/components/schemas/Pagination' }

  /sse:
    get:
      tags: [Realtime]
      parameters:
        - in: query
          name: token
          description: JWT access token (EventSource не поддерживает headers)
          schema: { type: string }
      responses:
        "200":
          description: Server-Sent Events stream
          content:
            text/event-stream:
              schema: { type: string }

  # ── Subscription ──────────────────────────────────────────────────────────
  /subscription:
    get:
      tags: [Subscription]
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Subscription' }

  /webhooks/revenuecat:
    post:
      tags: [Webhooks]
      security: []
      responses:
        "200": { description: OK }

  /webhooks/yoomoney:
    post:
      tags: [Webhooks]
      security: []
      responses:
        "200": { description: OK }

  # ── Health ────────────────────────────────────────────────────────────────
  /health:
    get:
      tags: [System]
      security: []
      responses:
        "200":
          content:
            application/json:
              schema:
                type: object
                properties:
                  status: { type: string, example: ok }
                  db:     { type: string, example: ok }
```

## Единый формат ошибок

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

| HTTP | Коды ошибок |
|---|---|
| 400 | `VALIDATION_ERROR`, `INVALID_REQUEST` |
| 401 | `UNAUTHORIZED`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`, `TOKEN_REUSE_DETECTED` |
| 403 | `FORBIDDEN`, `PLAN_LIMIT_REACHED` |
| 404 | `NOT_FOUND` |
| 409 | `EMAIL_TAKEN`, `ALREADY_EXISTS` |
| 500 | `INTERNAL_ERROR` |
