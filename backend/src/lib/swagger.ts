import type { FastifySchema, RouteOptions } from 'fastify'
import type { OpenAPIV3 } from 'openapi-types'

type Schema = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
type SchemaObject = OpenAPIV3.SchemaObject
type RouteDoc = FastifySchema & {
  operationId?: string
  tags?: string[]
  summary?: string
  description?: string
  security?: Array<Record<string, string[]>>
}

const ref = (name: string): OpenAPIV3.ReferenceObject => ({ $ref: `#/components/schemas/${name}` })
const arrayOf = (items: Schema): SchemaObject => ({ type: 'array', items })
const nullable = (schema: SchemaObject): SchemaObject => ({ ...schema, nullable: true })

const id = { type: 'string', example: 'clx123abc' } satisfies SchemaObject
const dateTime = { type: 'string', format: 'date-time' } satisfies SchemaObject
const paginationQuery = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  },
}

const withAuth = (doc: RouteDoc): RouteDoc => ({
  security: [{ bearerAuth: [] }],
  ...doc,
})

const response = (success: Schema, status = 200) => ({
  [status]: success,
  400: ref('ErrorResponse'),
  401: ref('ErrorResponse'),
  403: ref('ErrorResponse'),
  404: ref('ErrorResponse'),
  500: ref('ErrorResponse'),
})

const emptyResponse = {
  204: { description: 'No content' },
  400: ref('ErrorResponse'),
  401: ref('ErrorResponse'),
  403: ref('ErrorResponse'),
  404: ref('ErrorResponse'),
  500: ref('ErrorResponse'),
}

const params = (...names: string[]): Schema => ({
  type: 'object',
  required: names,
  properties: Object.fromEntries(names.map((name) => [name, id])),
})

const schemas = {
  ErrorResponse: {
    type: 'object',
    required: ['code', 'message'],
    properties: {
      code: { type: 'string' },
      message: { type: 'string' },
      details: {},
    },
  },
  HealthResponse: {
    type: 'object',
    required: ['status', 'uptime'],
    properties: {
      status: { type: 'string', example: 'ok' },
      db: { type: 'string', example: 'ok' },
      uptime: { type: 'integer' },
    },
  },
  Pagination: {
    type: 'object',
    required: ['page', 'limit', 'total', 'hasMore'],
    properties: {
      page: { type: 'integer' },
      limit: { type: 'integer' },
      total: { type: 'integer' },
      hasMore: { type: 'boolean' },
    },
  },
  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'name'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8, maxLength: 128 },
      name: { type: 'string', minLength: 1, maxLength: 100 },
    },
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 1 },
    },
  },
  RefreshTokenRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: { type: 'string' },
    },
  },
  AuthUser: {
    type: 'object',
    required: ['id', 'role'],
    properties: {
      id,
      role: { type: 'string', enum: ['TRAINER', 'CLIENT'] },
    },
  },
  AuthResponse: {
    type: 'object',
    required: ['accessToken', 'refreshToken', 'user'],
    properties: {
      accessToken: { type: 'string' },
      refreshToken: { type: 'string' },
      user: ref('AuthUser'),
    },
  },
  MeResponse: {
    type: 'object',
    required: ['id', 'email', 'role', 'createdAt'],
    properties: {
      id,
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['TRAINER', 'CLIENT'] },
      createdAt: dateTime,
      trainerProfile: nullable({ type: 'object', additionalProperties: true }),
      clientProfile: nullable({ type: 'object', additionalProperties: true }),
    },
  },
  CreateClientRequest: {
    type: 'object',
    required: ['name', 'email'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      email: { type: 'string', format: 'email', maxLength: 255 },
      age: { type: 'integer', minimum: 10, maximum: 100 },
      weight: { type: 'number', minimum: 20, maximum: 500 },
      height: { type: 'number', minimum: 50, maximum: 250 },
      goals: { type: 'string', maxLength: 500 },
    },
  },
  UpdateClientRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      age: { type: 'integer', minimum: 10, maximum: 100 },
      weight: { type: 'number', minimum: 20, maximum: 500 },
      height: { type: 'number', minimum: 50, maximum: 250 },
      goals: { type: 'string', maxLength: 500 },
    },
  },
  ClientSummary: {
    type: 'object',
    required: ['id', 'name', 'totalWorkouts'],
    properties: {
      id,
      name: { type: 'string' },
      avatarKey: nullable({ type: 'string' }),
      lastWorkoutAt: nullable(dateTime),
      totalWorkouts: { type: 'integer' },
      activeProgram: nullable({ type: 'string' }),
      activeProgramId: nullable({ type: 'string' }),
    },
  },
  ClientDetail: {
    type: 'object',
    required: ['id', 'userId', 'email', 'name', 'createdAt', 'updatedAt'],
    properties: {
      id,
      userId: id,
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      age: nullable({ type: 'integer' }),
      weight: nullable({ type: 'number' }),
      height: nullable({ type: 'number' }),
      goals: nullable({ type: 'string' }),
      avatarKey: nullable({ type: 'string' }),
      createdAt: dateTime,
      updatedAt: dateTime,
    },
  },
  ClientListResponse: {
    type: 'object',
    required: ['data', 'pagination'],
    properties: {
      data: arrayOf(ref('ClientSummary')),
      pagination: ref('Pagination'),
    },
  },
  ExerciseInput: {
    type: 'object',
    required: ['name', 'sets', 'order'],
    properties: {
      name: { type: 'string', minLength: 1, maxLength: 100 },
      sets: { type: 'integer', minimum: 1, maximum: 20 },
      reps: nullable({ type: 'integer', minimum: 1, maximum: 100 }),
      weight: nullable({ type: 'number', minimum: 0, maximum: 1000 }),
      duration: nullable({ type: 'integer', minimum: 1, maximum: 7200 }),
      notes: nullable({ type: 'string', maxLength: 500 }),
      order: { type: 'integer', minimum: 1, maximum: 50 },
    },
  },
  DayInput: {
    type: 'object',
    required: ['dayNumber', 'name', 'exercises'],
    properties: {
      dayNumber: { type: 'integer', minimum: 1, maximum: 365 },
      name: { type: 'string', minLength: 1, maxLength: 100 },
      exercises: arrayOf(ref('ExerciseInput')),
    },
  },
  CreateTemplateRequest: {
    type: 'object',
    required: ['name', 'days'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      description: nullable({ type: 'string', maxLength: 500 }),
      days: arrayOf(ref('DayInput')),
    },
  },
  UpdateTemplateRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      description: nullable({ type: 'string', maxLength: 500 }),
    },
  },
  UpdateDayRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      dayNumber: { type: 'integer', minimum: 1, maximum: 365 },
      name: { type: 'string', minLength: 1, maxLength: 100 },
      exercises: arrayOf(ref('ExerciseInput')),
    },
  },
  Exercise: {
    type: 'object',
    required: ['id', 'name', 'sets', 'order'],
    properties: {
      id,
      name: { type: 'string' },
      sets: { type: 'integer' },
      reps: nullable({ type: 'integer' }),
      weight: nullable({ type: 'number' }),
      duration: nullable({ type: 'integer' }),
      notes: nullable({ type: 'string' }),
      order: { type: 'integer' },
    },
  },
  WorkoutDay: {
    type: 'object',
    required: ['id', 'dayNumber', 'name', 'createdAt', 'exercises'],
    properties: {
      id,
      dayNumber: { type: 'integer' },
      name: { type: 'string' },
      createdAt: dateTime,
      exercises: arrayOf(ref('Exercise')),
    },
  },
  WorkoutTemplateSummary: {
    type: 'object',
    required: ['id', 'name', 'daysCount', 'createdAt', 'updatedAt'],
    properties: {
      id,
      name: { type: 'string' },
      description: nullable({ type: 'string' }),
      daysCount: { type: 'integer' },
      createdAt: dateTime,
      updatedAt: dateTime,
    },
  },
  WorkoutTemplateDetail: {
    allOf: [
      ref('WorkoutTemplateSummary'),
      {
        type: 'object',
        required: ['days'],
        properties: {
          days: arrayOf(ref('WorkoutDay')),
        },
      },
    ],
  },
  AssignProgramRequest: {
    type: 'object',
    required: ['templateId'],
    properties: {
      templateId: id,
      startDate: { type: 'string', format: 'date-time' },
    },
  },
  AssignedProgram: {
    type: 'object',
    required: ['id', 'templateId', 'clientId', 'startDate', 'createdAt', 'workoutLogsCount'],
    properties: {
      id,
      templateId: id,
      clientId: id,
      template: { type: 'object', additionalProperties: true },
      startDate: dateTime,
      createdAt: dateTime,
      workoutLogsCount: { type: 'integer' },
    },
  },
  WorkoutLogExercise: {
    type: 'object',
    required: ['id', 'exerciseId', 'name', 'sets', 'completedSets', 'order', 'createdAt', 'updatedAt'],
    properties: {
      id,
      exerciseId: id,
      name: { type: 'string' },
      sets: { type: 'integer' },
      reps: nullable({ type: 'integer' }),
      weight: nullable({ type: 'number' }),
      duration: nullable({ type: 'integer' }),
      targetNotes: nullable({ type: 'string' }),
      order: { type: 'integer' },
      completedSets: { type: 'integer' },
      actualReps: nullable({ type: 'integer' }),
      actualWeight: nullable({ type: 'number' }),
      notes: nullable({ type: 'string' }),
      createdAt: dateTime,
      updatedAt: dateTime,
    },
  },
  WorkoutLogDetail: {
    type: 'object',
    required: [
      'id',
      'assignedProgramId',
      'clientId',
      'status',
      'dueDate',
      'dayId',
      'dayNumber',
      'dayName',
      'templateId',
      'templateName',
      'createdAt',
      'updatedAt',
      'exercises',
    ],
    properties: {
      id,
      assignedProgramId: id,
      clientId: id,
      status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] },
      dueDate: dateTime,
      dayId: id,
      dayNumber: { type: 'integer' },
      dayName: { type: 'string' },
      templateId: id,
      templateName: { type: 'string' },
      templateDescription: nullable({ type: 'string' }),
      startedAt: nullable(dateTime),
      completedAt: nullable(dateTime),
      createdAt: dateTime,
      updatedAt: dateTime,
      exercises: arrayOf(ref('WorkoutLogExercise')),
    },
  },
  WorkoutLogListResponse: {
    type: 'object',
    required: ['data', 'pagination'],
    properties: {
      data: arrayOf(ref('WorkoutLogDetail')),
      pagination: ref('Pagination'),
    },
  },
  UpdateExerciseLogRequest: {
    type: 'object',
    minProperties: 1,
    properties: {
      completedSets: { type: 'integer', minimum: 0, maximum: 20 },
      actualReps: nullable({ type: 'integer', minimum: 0, maximum: 200 }),
      actualWeight: nullable({ type: 'number', minimum: 0, maximum: 1000 }),
      notes: nullable({ type: 'string', maxLength: 500 }),
    },
  },
  ExerciseLogUpdateResponse: {
    type: 'object',
    required: ['id', 'workoutLogId', 'exerciseId', 'name', 'sets', 'completedSets', 'updatedAt'],
    properties: {
      id,
      workoutLogId: id,
      exerciseId: id,
      name: { type: 'string' },
      sets: { type: 'integer' },
      completedSets: { type: 'integer' },
      actualReps: nullable({ type: 'integer' }),
      actualWeight: nullable({ type: 'number' }),
      notes: nullable({ type: 'string' }),
      updatedAt: dateTime,
    },
  },
  ProgressSummary: {
    type: 'object',
    required: ['totalWorkouts', 'workoutsThisWeek', 'completionRate', 'lastWorkoutAt', 'streak'],
    properties: {
      totalWorkouts: { type: 'integer' },
      workoutsThisWeek: { type: 'integer' },
      completionRate: { type: 'number' },
      lastWorkoutAt: nullable(dateTime),
      streak: { type: 'integer' },
    },
  },
  PresignUploadRequest: {
    type: 'object',
    required: ['filename', 'contentType', 'size'],
    properties: {
      filename: { type: 'string', minLength: 1, maxLength: 255 },
      contentType: { type: 'string', enum: ['image/jpeg', 'image/png', 'image/webp'] },
      size: { type: 'integer', minimum: 1, maximum: 10485760 },
      takenAt: { type: 'string', format: 'date-time' },
    },
  },
  PresignUploadResponse: {
    type: 'object',
    required: ['uploadUrl', 'photoId', 'key', 'expiresAt'],
    properties: {
      uploadUrl: { type: 'string', format: 'uri' },
      photoId: id,
      key: { type: 'string' },
      expiresAt: dateTime,
    },
  },
  Photo: {
    type: 'object',
    required: ['id', 'clientId', 'key', 'size', 'status', 'createdAt'],
    properties: {
      id,
      clientId: id,
      key: { type: 'string' },
      thumbnailKey: nullable({ type: 'string' }),
      size: { type: 'integer' },
      status: { type: 'string', enum: ['PENDING', 'UPLOADED', 'READY', 'FAILED'] },
      takenAt: nullable(dateTime),
      uploadedAt: nullable(dateTime),
      createdAt: dateTime,
    },
  },
  PhotoListResponse: {
    type: 'object',
    required: ['data', 'pagination'],
    properties: {
      data: arrayOf(ref('Photo')),
      pagination: ref('Pagination'),
    },
  },
  PhotoUrlResponse: {
    type: 'object',
    required: ['url', 'expiresAt'],
    properties: {
      url: { type: 'string', format: 'uri' },
      expiresAt: dateTime,
    },
  },
  DeviceTokenRequest: {
    type: 'object',
    required: ['token', 'platform'],
    properties: {
      token: { type: 'string', minLength: 1, maxLength: 500 },
      platform: { type: 'string', enum: ['ios', 'android', 'IOS', 'ANDROID'] },
    },
  },
  DeleteDeviceTokenRequest: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string', minLength: 1, maxLength: 500 },
    },
  },
  Notification: {
    type: 'object',
    required: ['id', 'userId', 'type', 'title', 'body', 'createdAt'],
    properties: {
      id,
      userId: id,
      type: {
        type: 'string',
        enum: ['WORKOUT_REMINDER', 'WORKOUT_COMPLETED', 'PHOTO_UPLOADED', 'SUBSCRIPTION_EXPIRING'],
      },
      title: { type: 'string' },
      body: { type: 'string' },
      data: nullable({ type: 'object', additionalProperties: true }),
      readAt: nullable(dateTime),
      createdAt: dateTime,
    },
  },
  NotificationListResponse: {
    type: 'object',
    required: ['data', 'pagination'],
    properties: {
      data: arrayOf(ref('Notification')),
      pagination: ref('Pagination'),
    },
  },
  SubscriptionSummary: {
    type: 'object',
    required: ['plan', 'status', 'clientsUsed', 'templatesUsed', 'storageMbLimit'],
    properties: {
      plan: { type: 'string', enum: ['FREE', 'PRO'] },
      status: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] },
      expiresAt: nullable(dateTime),
      clientsUsed: { type: 'integer' },
      clientsLimit: nullable({ type: 'integer' }),
      templatesUsed: { type: 'integer' },
      templatesLimit: nullable({ type: 'integer' }),
      storageMbLimit: { type: 'integer' },
    },
  },
  YoomoneyUrlResponse: {
    type: 'object',
    required: ['url'],
    properties: {
      url: { type: 'string', format: 'uri' },
    },
  },
  RevenuecatWebhookRequest: {
    type: 'object',
    additionalProperties: true,
    properties: {
      event: { type: 'object', additionalProperties: true },
      id: { type: 'string' },
      type: { type: 'string' },
      app_user_id: { type: 'string' },
      expiration_at_ms: nullable({ type: 'number' }),
    },
  },
  YoomoneyWebhookRequest: {
    type: 'object',
    required: ['operation_id', 'label'],
    additionalProperties: true,
    properties: {
      notification_type: { type: 'string' },
      operation_id: { type: 'string' },
      amount: { type: 'string' },
      currency: { type: 'string' },
      datetime: { type: 'string' },
      sender: { type: 'string' },
      codepro: { oneOf: [{ type: 'boolean' }, { type: 'string' }] },
      unaccepted: { oneOf: [{ type: 'boolean' }, { type: 'string' }] },
      label: { type: 'string' },
      sha1_hash: { type: 'string' },
    },
  },
  OkResponse: {
    type: 'object',
    required: ['ok'],
    properties: {
      ok: { type: 'boolean' },
    },
  },
} satisfies Record<string, Schema>

const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  schemas,
} satisfies OpenAPIV3.ComponentsObject

const routeDocs: Record<string, RouteDoc> = {
  'GET /health/live': {
    operationId: 'healthLive',
    tags: ['Health'],
    summary: 'Check process liveness',
    response: response(ref('HealthResponse')),
  },
  'GET /health/ready': {
    operationId: 'healthReady',
    tags: ['Health'],
    summary: 'Check database readiness',
    response: response(ref('HealthResponse')),
  },
  'GET /health': {
    operationId: 'health',
    tags: ['Health'],
    summary: 'Check service health',
    response: response(ref('HealthResponse')),
  },
  'POST /auth/register': {
    operationId: 'registerTrainer',
    tags: ['Auth'],
    summary: 'Register trainer',
    body: ref('RegisterRequest'),
    response: response(ref('AuthResponse'), 201),
  },
  'POST /auth/login': {
    operationId: 'login',
    tags: ['Auth'],
    summary: 'Login',
    body: ref('LoginRequest'),
    response: response(ref('AuthResponse')),
  },
  'POST /auth/refresh': {
    operationId: 'refreshToken',
    tags: ['Auth'],
    summary: 'Refresh access token',
    body: ref('RefreshTokenRequest'),
    response: response(ref('AuthResponse')),
  },
  'POST /auth/logout': withAuth({
    operationId: 'logout',
    tags: ['Auth'],
    summary: 'Logout',
    body: ref('RefreshTokenRequest'),
    response: emptyResponse,
  }),
  'GET /auth/me': withAuth({
    operationId: 'getMe',
    tags: ['Auth'],
    summary: 'Get current user',
    response: response(ref('MeResponse')),
  }),
  'GET /trainer/clients': withAuth({
    operationId: 'listClients',
    tags: ['Clients'],
    summary: 'List trainer clients',
    querystring: {
      ...paginationQuery,
      properties: {
        ...paginationQuery.properties,
        search: { type: 'string', minLength: 1, maxLength: 100 },
      },
    },
    response: response(ref('ClientListResponse')),
  }),
  'POST /trainer/clients': withAuth({
    operationId: 'createClient',
    tags: ['Clients'],
    summary: 'Create client',
    body: ref('CreateClientRequest'),
    response: response(ref('ClientDetail'), 201),
  }),
  'GET /trainer/clients/:clientId': withAuth({
    operationId: 'getClient',
    tags: ['Clients'],
    summary: 'Get client',
    params: params('clientId'),
    response: response(ref('ClientDetail')),
  }),
  'PUT /trainer/clients/:clientId': withAuth({
    operationId: 'updateClient',
    tags: ['Clients'],
    summary: 'Update client',
    params: params('clientId'),
    body: ref('UpdateClientRequest'),
    response: response(ref('ClientDetail')),
  }),
  'DELETE /trainer/clients/:clientId': withAuth({
    operationId: 'deleteClient',
    tags: ['Clients'],
    summary: 'Delete client',
    params: params('clientId'),
    response: emptyResponse,
  }),
  'POST /uploads/presign': withAuth({
    operationId: 'presignUpload',
    tags: ['Uploads'],
    summary: 'Create photo upload URL',
    body: ref('PresignUploadRequest'),
    response: response(ref('PresignUploadResponse')),
  }),
  'POST /uploads/:photoId/confirm': withAuth({
    operationId: 'confirmUpload',
    tags: ['Uploads'],
    summary: 'Confirm photo upload',
    params: params('photoId'),
    response: response(ref('Photo')),
  }),
  'GET /photos': withAuth({
    operationId: 'listMyPhotos',
    tags: ['Photos'],
    summary: 'List my photos',
    querystring: paginationQuery,
    response: response(ref('PhotoListResponse')),
  }),
  'DELETE /photos/:photoId': withAuth({
    operationId: 'deletePhoto',
    tags: ['Photos'],
    summary: 'Delete my photo',
    params: params('photoId'),
    response: emptyResponse,
  }),
  'GET /photos/:photoId/url': withAuth({
    operationId: 'getPhotoUrl',
    tags: ['Photos'],
    summary: 'Get photo view URL',
    params: params('photoId'),
    response: response(ref('PhotoUrlResponse')),
  }),
  'GET /clients/:clientId/photos': withAuth({
    operationId: 'listClientPhotos',
    tags: ['Photos'],
    summary: 'List client photos',
    params: params('clientId'),
    querystring: paginationQuery,
    response: response(ref('PhotoListResponse')),
  }),
  'POST /devices/token': withAuth({
    operationId: 'saveDeviceToken',
    tags: ['Notifications'],
    summary: 'Save push device token',
    body: ref('DeviceTokenRequest'),
    response: emptyResponse,
  }),
  'DELETE /devices/token': withAuth({
    operationId: 'deleteDeviceToken',
    tags: ['Notifications'],
    summary: 'Delete push device token',
    body: ref('DeleteDeviceTokenRequest'),
    response: emptyResponse,
  }),
  'GET /notifications': withAuth({
    operationId: 'listNotifications',
    tags: ['Notifications'],
    summary: 'List notifications',
    querystring: {
      ...paginationQuery,
      properties: {
        ...paginationQuery.properties,
        unreadOnly: { type: 'boolean', default: false },
      },
    },
    response: response(ref('NotificationListResponse')),
  }),
  'POST /notifications/:id/read': withAuth({
    operationId: 'markNotificationRead',
    tags: ['Notifications'],
    summary: 'Mark notification as read',
    params: params('id'),
    response: response(ref('Notification')),
  }),
  'POST /notifications/read-all': withAuth({
    operationId: 'markAllNotificationsRead',
    tags: ['Notifications'],
    summary: 'Mark all notifications as read',
    response: emptyResponse,
  }),
  'GET /sse': {
    operationId: 'openSse',
    tags: ['Notifications'],
    summary: 'Open SSE stream',
    description: 'Authorization can be sent as Bearer token or as token query parameter.',
    querystring: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        lastEventId: { type: 'string' },
      },
    },
    response: {
      200: { description: 'text/event-stream' },
      401: ref('ErrorResponse'),
    },
  },
  'GET /subscription': withAuth({
    operationId: 'getSubscription',
    tags: ['Subscriptions'],
    summary: 'Get subscription summary',
    response: response(ref('SubscriptionSummary')),
  }),
  'POST /subscription/yoomoney-url': withAuth({
    operationId: 'createYoomoneyUrl',
    tags: ['Subscriptions'],
    summary: 'Create YooMoney payment URL',
    response: response(ref('YoomoneyUrlResponse')),
  }),
  'POST /webhooks/revenuecat': {
    operationId: 'revenuecatWebhook',
    tags: ['Webhooks'],
    summary: 'Handle RevenueCat webhook',
    body: ref('RevenuecatWebhookRequest'),
    response: response(ref('OkResponse')),
  },
  'POST /webhooks/yoomoney': {
    operationId: 'yoomoneyWebhook',
    tags: ['Webhooks'],
    summary: 'Handle YooMoney webhook',
    body: ref('YoomoneyWebhookRequest'),
    response: response(ref('OkResponse')),
  },
  'GET /workout-templates': withAuth({
    operationId: 'listWorkoutTemplates',
    tags: ['Workout templates'],
    summary: 'List workout templates',
    response: response(arrayOf(ref('WorkoutTemplateSummary'))),
  }),
  'POST /workout-templates': withAuth({
    operationId: 'createWorkoutTemplate',
    tags: ['Workout templates'],
    summary: 'Create workout template',
    body: ref('CreateTemplateRequest'),
    response: response(ref('WorkoutTemplateDetail'), 201),
  }),
  'GET /workout-templates/:id': withAuth({
    operationId: 'getWorkoutTemplate',
    tags: ['Workout templates'],
    summary: 'Get workout template',
    params: params('id'),
    response: response(ref('WorkoutTemplateDetail')),
  }),
  'PUT /workout-templates/:id': withAuth({
    operationId: 'updateWorkoutTemplate',
    tags: ['Workout templates'],
    summary: 'Update workout template',
    params: params('id'),
    body: ref('UpdateTemplateRequest'),
    response: response(ref('WorkoutTemplateDetail')),
  }),
  'DELETE /workout-templates/:id': withAuth({
    operationId: 'deleteWorkoutTemplate',
    tags: ['Workout templates'],
    summary: 'Delete workout template',
    params: params('id'),
    response: emptyResponse,
  }),
  'POST /workout-templates/:id/days': withAuth({
    operationId: 'addWorkoutDay',
    tags: ['Workout templates'],
    summary: 'Add workout day',
    params: params('id'),
    body: ref('DayInput'),
    response: response(ref('WorkoutTemplateDetail'), 201),
  }),
  'PUT /workout-templates/:id/days/:dayId': withAuth({
    operationId: 'updateWorkoutDay',
    tags: ['Workout templates'],
    summary: 'Update workout day',
    params: params('id', 'dayId'),
    body: ref('UpdateDayRequest'),
    response: response(ref('WorkoutTemplateDetail')),
  }),
  'DELETE /workout-templates/:id/days/:dayId': withAuth({
    operationId: 'deleteWorkoutDay',
    tags: ['Workout templates'],
    summary: 'Delete workout day',
    params: params('id', 'dayId'),
    response: emptyResponse,
  }),
  'GET /trainer/clients/:clientId/programs': withAuth({
    operationId: 'listTrainerClientPrograms',
    tags: ['Programs'],
    summary: 'List client programs',
    params: params('clientId'),
    response: response(arrayOf(ref('AssignedProgram'))),
  }),
  'POST /trainer/clients/:clientId/programs': withAuth({
    operationId: 'assignTrainerClientProgram',
    tags: ['Programs'],
    summary: 'Assign program to client',
    params: params('clientId'),
    body: ref('AssignProgramRequest'),
    response: response(ref('AssignedProgram'), 201),
  }),
  'GET /clients/:clientId/programs': withAuth({
    operationId: 'listClientPrograms',
    tags: ['Programs'],
    summary: 'List client programs',
    params: params('clientId'),
    response: response(arrayOf(ref('AssignedProgram'))),
  }),
  'POST /clients/:clientId/programs': withAuth({
    operationId: 'assignClientProgram',
    tags: ['Programs'],
    summary: 'Assign program to client',
    params: params('clientId'),
    body: ref('AssignProgramRequest'),
    response: response(ref('AssignedProgram'), 201),
  }),
  'GET /clients/:clientId/progress': withAuth({
    operationId: 'getClientProgress',
    tags: ['Progress'],
    summary: 'Get client progress',
    params: params('clientId'),
    response: response(ref('ProgressSummary')),
  }),
  'GET /clients/:clientId/workout-logs': withAuth({
    operationId: 'listClientWorkoutLogs',
    tags: ['Workouts'],
    summary: 'List client workout logs',
    params: params('clientId'),
    querystring: {
      ...paginationQuery,
      properties: {
        ...paginationQuery.properties,
        status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] },
      },
    },
    response: response(ref('WorkoutLogListResponse')),
  }),
  'GET /workouts/today': withAuth({
    operationId: 'listTodayWorkouts',
    tags: ['Workouts'],
    summary: 'List today workouts',
    response: response(arrayOf(ref('WorkoutLogDetail'))),
  }),
  'GET /workouts/:logId': withAuth({
    operationId: 'getWorkoutLog',
    tags: ['Workouts'],
    summary: 'Get workout log',
    params: params('logId'),
    response: response(ref('WorkoutLogDetail')),
  }),
  'POST /workouts/:logId/start': withAuth({
    operationId: 'startWorkout',
    tags: ['Workouts'],
    summary: 'Start workout',
    params: params('logId'),
    response: response(ref('WorkoutLogDetail')),
  }),
  'POST /workouts/:logId/complete': withAuth({
    operationId: 'completeWorkout',
    tags: ['Workouts'],
    summary: 'Complete workout',
    params: params('logId'),
    response: response(ref('WorkoutLogDetail')),
  }),
  'PUT /workouts/:logId/exercises/:exerciseLogId': withAuth({
    operationId: 'updateExerciseLog',
    tags: ['Workouts'],
    summary: 'Update exercise log',
    params: params('logId', 'exerciseLogId'),
    body: ref('UpdateExerciseLogRequest'),
    response: response(ref('ExerciseLogUpdateResponse')),
  }),
  'GET /progress': withAuth({
    operationId: 'getMyProgress',
    tags: ['Progress'],
    summary: 'Get my progress',
    response: response(ref('ProgressSummary')),
  }),
  'GET /progress/workout-logs': withAuth({
    operationId: 'listMyWorkoutLogs',
    tags: ['Workouts'],
    summary: 'List my workout logs',
    querystring: {
      ...paginationQuery,
      properties: {
        ...paginationQuery.properties,
        status: { type: 'string', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] },
      },
    },
    response: response(ref('WorkoutLogListResponse')),
  }),
}

function normalizeUrl(url: string) {
  if (url.length > 1 && url.endsWith('/')) return url.slice(0, -1)
  return url
}

function getRouteDoc(route: RouteOptions, url: string) {
  const rawMethod = Array.isArray(route.method) ? route.method[0] : route.method
  const method = String(rawMethod).toUpperCase()
  return routeDocs[`${method} ${normalizeUrl(url)}`]
}

export const swaggerOptions = {
  openapi: {
    openapi: '3.0.3' as const,
    info: {
      title: 'FitTrack API',
      description: 'API for trainer and client fitness workflows.',
      version: '1.0.0',
    },
    servers: [
      {
        url: process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`,
        description: 'Current server',
      },
    ],
    tags: [
      { name: 'Health', description: 'Service checks' },
      { name: 'Auth', description: 'Authentication and sessions' },
      { name: 'Clients', description: 'Trainer client management' },
      { name: 'Workout templates', description: 'Workout template management' },
      { name: 'Programs', description: 'Program assignment' },
      { name: 'Workouts', description: 'Workout execution and logs' },
      { name: 'Progress', description: 'Progress summaries' },
      { name: 'Uploads', description: 'Photo upload flow' },
      { name: 'Photos', description: 'Progress photos' },
      { name: 'Notifications', description: 'Push notifications and SSE' },
      { name: 'Subscriptions', description: 'Subscription state and payments' },
      { name: 'Webhooks', description: 'External billing webhooks' },
    ],
    components,
  },
  transform: ({ schema, url, route }: { schema: FastifySchema; url: string; route: RouteOptions }) => {
    const normalizedUrl = normalizeUrl(url)
    if (normalizedUrl.startsWith('/docs')) {
      return { schema: { ...schema, hide: true }, url: normalizedUrl }
    }

    const doc = getRouteDoc(route, normalizedUrl)
    if (!doc) {
      return {
        schema: {
          ...schema,
          tags: ['Other'],
          summary: `${String(route.method).toUpperCase()} ${normalizedUrl}`,
        },
        url: normalizedUrl,
      }
    }

    return { schema: { ...schema, ...doc }, url: normalizedUrl }
  },
}

export const swaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list' as const,
    deepLinking: true,
    displayRequestDuration: true,
  },
  staticCSP: true,
  transformStaticCSP: (header: string) => header,
}
