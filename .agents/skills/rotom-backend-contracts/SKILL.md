---
name: rotom-backend-contracts
description: How to create oRPC contracts, Zod schemas, NestJS controllers, services, and modules in the Rotom backend. ALWAYS use this skill when creating, modifying, or reviewing any backend endpoint, API route, contract, controller, service, module, or schema in apps/backend/. This includes when you autonomously generate new features, add CRUD endpoints, wire up oRPC contracts, write Zod validation schemas, or scaffold NestJS modules — even if the user does not explicitly mention contracts or oRPC. If you are touching any file under apps/backend/src/ that involves routing, request handling, or data validation, use this skill.
---

# Rotom Backend Contracts

This skill defines the exact patterns for creating feature modules in the Rotom backend. The stack is **NestJS + oRPC (`@orpc/contract`, `@orpc/nest`, `@orpc/server`) + Zod v4 + Prisma**.

All patterns below follow [nestjs-best-practices] rules. Key principles enforced:
- **`arch-module-sharing`**: Import `PrismaModule` — NEVER provide `PrismaService` directly in a module's `providers`
- **`arch-single-responsibility`**: Controllers only delegate; services own all business logic
- **`di-prefer-constructor-injection`**: Always use constructor injection
- **`error-handle-async-errors`**: Catch Prisma error codes and translate to `ORPCError`
- **`devops-use-logging`**: Use NestJS `Logger`, not `console.log`/`console.error`

## Architecture

Each feature lives in `apps/backend/src/<feature>/` with 5 files:

| File | Purpose |
|------|---------|
| `<feature>.schema.ts` | Zod input/output schemas |
| `<feature>.contract.ts` | oRPC contract definitions (route, method, tags, input/output) |
| `<feature>.controller.ts` | Wires contracts to handlers via `@Implement` / `implement` |
| `<feature>.service.ts` | Business logic with `PrismaService` |
| `<feature>.module.ts` | NestJS module registering controller, service, imports |

Two central registration files:
- `src/contract.ts` — aggregates all feature contracts into one `contract` object
- `src/app.module.ts` — imports all feature modules

## Step-by-Step: Creating a New Feature

### 1. Zod Schemas (`<feature>.schema.ts`)

Define all input and output schemas. Import `z` from `'zod'` (Zod v4).

```typescript
import z from 'zod';

export const createThingInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
});

export const thingOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.date(),
});
```

**Cursor pagination output pattern** (used across the codebase):

```typescript
export const getAllThingsInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

export const getAllThingsOutputSchema = z.object({
  items: z.array(thingOutputSchema),
  nextCursor: z.string().nullable(),
  hasNextPage: z.boolean(),
});
```

**Common Zod types used**: `z.cuid()`, `z.uuid()`, `z.emoji()`, `z.date()`, `z.file()`, `z.string().nullable()`, `z.number()`, `z.boolean()`.

### 2. oRPC Contract (`<feature>.contract.ts`)

Import `oc` from `'@orpc/contract'`. Each endpoint gets `.route()` (path, method, tags) and optionally `.input()` / `.output()`.

```typescript
import { oc } from '@orpc/contract';
import {
  createThingInputSchema,
  thingOutputSchema,
  getAllThingsInputSchema,
  getAllThingsOutputSchema,
} from './<feature>.schema';

const createThing = oc
  .route({ path: '/things', method: 'POST', tags: ['Things'] })
  .input(createThingInputSchema)
  .output(thingOutputSchema);

const getAllThings = oc
  .route({ path: '/things', method: 'GET', tags: ['Things'] })
  .input(getAllThingsInputSchema)
  .output(getAllThingsOutputSchema);

const deleteThing = oc
  .route({ path: '/things/{id}', method: 'DELETE', tags: ['Things'] })
  .input(z.object({ id: z.cuid() }));

export const thingsContract = {
  createThing,
  getAllThings,
  deleteThing,
};
```

**Route param convention**: use `{paramName}` in the path, and include the matching field in the Zod input schema.

### 3. Register in Root Contract (`src/contract.ts`)

```typescript
import { thingsContract } from './<feature>/<feature>.contract';

export const contract = {
  // ... existing contracts
  things: thingsContract,
};
```

### 4. Controller (`<feature>.controller.ts`)

Use `@Implement(contract.<feature>.<endpoint>)` decorator and `implement(...)` builder. **ALWAYS chain `.use(protectedRoute)` by default** for safety. Use `.use(role([...]))` only when stricter access is needed.

```typescript
import { Controller } from '@nestjs/common';
import { implement, Implement } from '@orpc/nest';
import { contract } from 'src/contract';
import { protectedRoute } from 'src/common/middleware/protectedRoute';
import { ThingsService } from './<feature>.service';

@Controller()
export class ThingsController {
  constructor(public readonly thingsService: ThingsService) {}

  @Implement(contract.things.createThing)
  createThing() {
    return implement(contract.things.createThing)
      .use(protectedRoute)
      .handler(async ({ input, context }) => {
        return this.thingsService.create({
          ...input,
          userId: context.session?.user.id ?? '',
        });
      });
  }

  @Implement(contract.things.getAllThings)
  getAllThings() {
    return implement(contract.things.getAllThings)
      .use(protectedRoute)
      .handler(async ({ input }) => {
        return this.thingsService.getAll(input);
      });
  }

  @Implement(contract.things.deleteThing)
  deleteThing() {
    return implement(contract.things.deleteThing)
      .use(protectedRoute)
      .handler(async ({ input }) => {
        await this.thingsService.delete(input.id);
      });
  }
}
```

**Handler parameters**:
- `input` — validated Zod input
- `context.session` — authenticated user session (available after `protectedRoute` or `role()`)
- `context.session.user.id` — current user's ID
- `context.session.user.role` — current user's role

### 5. Service (`<feature>.service.ts`)

Standard NestJS `@Injectable()` with `PrismaService` for DB access. Each service should have a **single responsibility** (`arch-single-responsibility`) — keep it focused on one domain entity.

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ORPCError } from '@orpc/contract';
import { Prisma } from 'src/@generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ThingsService {
  private readonly logger = new Logger(ThingsService.name);

  constructor(public readonly prismaService: PrismaService) {}

  async create(input: { title: string; description: string | null; userId: string }) {
    try {
      return await this.prismaService.thing.create({
        data: input,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ORPCError('CONFLICT', { message: 'Already exists' });
      }
      throw err;
    }
  }

  async delete(id: string) {
    try {
      await this.prismaService.thing.delete({ where: { id } });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new ORPCError('NOT_FOUND');
      }
      throw err;
    }
  }
}
```

**Error handling** (`error-handle-async-errors`): Always catch Prisma errors by code and translate to `ORPCError`. Common Prisma error codes:
- **`P2002`** — unique constraint violation → `ORPCError('CONFLICT')`
- **`P2025`** — record not found → `ORPCError('NOT_FOUND')`
- **`P2003`** — foreign key constraint → `ORPCError('NOT_FOUND', { message: 'Related record not found' })`

Available `ORPCError` codes: `BAD_REQUEST`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `CONFLICT`.

**Cursor pagination** (for list endpoints):

```typescript
import {
  buildCursorPagination,
  buildPrismaCursorPaginationArgs,
} from 'src/common/utils/cursorPagination';

async getAll({ cursor, limit = 20 }: { cursor?: string; limit?: number }) {
  const items = await this.prismaService.thing.findMany({
    take: limit + 1,
    ...buildPrismaCursorPaginationArgs(cursor),
    orderBy: { createdAt: 'desc' },
  });
  return buildCursorPagination(items, limit, (item) => item.id);
}
```

### 6. Module (`<feature>.module.ts`)

**CRITICAL (`arch-module-sharing`)**: Import `PrismaModule` to get the shared `PrismaService` singleton. **NEVER add `PrismaService` to `providers`** — that creates a duplicate instance with separate state and DB connections.

```typescript
import { Module } from '@nestjs/common';
import { ThingsController } from './<feature>.controller';
import { ThingsService } from './<feature>.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [ThingsController],
  providers: [ThingsService],
  imports: [PrismaModule],  // provides PrismaService — do NOT add PrismaService to providers
})
export class ThingsModule {}
```

If the feature depends on another feature's service, import that feature's module (not the service directly):
```typescript
imports: [PrismaModule, StorageModule],  // StorageModule exports StorageService
```

Only `exports` a service if other modules need it. Keep the dependency graph explicit.

### 7. Import in AppModule (`src/app.module.ts`)

Add `ThingsModule` to the `imports` array.

## Middleware Reference

**IMPORTANT: Default to `protectedRoute` on every endpoint.** Only use `role()` when stricter access control is needed.

| Middleware | Import | Usage | Effect |
|------------|--------|-------|--------|
| `protectedRoute` | `src/common/middleware/protectedRoute` | `.use(protectedRoute)` | Checks auth session, sets `context.session` |
| `role([...])` | `src/common/middleware/role` | `.use(role([ROLES.ADMIN, ROLES.MAINTAINER]))` | Checks auth + verifies user role |

Available roles (from `src/common/enum.ts`): `ADMIN`, `MAINTAINER`, `MENTOR`, `USER`.

## Conventions

- **Naming**: feature directory and files use the plural form (e.g., `funds/`, `assignments/`)
- **Contract export**: always a plain object, e.g., `export const thingsContract = { ... }`
- **Route paths**: kebab-case, nested under feature prefix (e.g., `/funds/contributions`)
- **Route params**: `{id}`, `{postId}` — matching field must exist in input schema
- **Tags**: PascalCase plural matching the feature (e.g., `['Funds']`, `['Gallery']`)
- **Errors**: catch Prisma error codes, translate to `ORPCError` — never let raw Prisma errors leak
- **Transactions** (`db-use-transactions`): use `this.prismaService.$transaction(async (tx) => { ... })` for multi-step writes. Use `tx` (not `this.prismaService`) inside the callback
- **Logging** (`devops-use-logging`): use `private readonly logger = new Logger(ClassName.name)` — never `console.log`/`console.error`
- **Module sharing** (`arch-module-sharing`): import modules, not services. Never put `PrismaService` in a module's `providers`
- **Single responsibility** (`arch-single-responsibility`): one service per domain entity. Controllers only delegate to services
- **DB indexes** (`perf-optimize-database`): add `@@index` on foreign key columns used in queries/JOINs in `prisma/schema.prisma`
- **Select only what you need** (`db-avoid-n-plus-one`): use Prisma `select` or `include` with specific fields — avoid fetching entire records when you only need a few columns. Avoid making DB/API calls inside `.map()` loops

## Checklist

When creating a new feature, verify:

- [ ] Zod schemas defined in `<feature>.schema.ts`
- [ ] Contract defined in `<feature>.contract.ts` using `oc`
- [ ] Contract registered in `src/contract.ts`
- [ ] Controller uses `@Implement` + `implement()` + `.use(protectedRoute)`
- [ ] Controller only delegates — no business logic in handlers
- [ ] Service is `@Injectable()` with `PrismaService` via constructor injection
- [ ] Service uses `Logger` (not console) and catches Prisma error codes
- [ ] Module imports `PrismaModule` (not `PrismaService` in providers)
- [ ] Module imported in `src/app.module.ts`
- [ ] Prisma model exists in `prisma/schema.prisma` with `@@index` on FK columns
- [ ] Run migration after schema changes (`npx prisma migrate dev`)
- [ ] Multi-step writes wrapped in `$transaction`
