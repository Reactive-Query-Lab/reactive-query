# Reactive Query

A framework-agnostic library for model part in MVVM architectural pattern, automating querying, storing, and caching data in frontend applications based on MVVM or any MV*, CQS, and reactive programming paradigms.

## Table of Contents

- [Reactive Query](#reactive-query)
  - [Table of Contents](#table-of-contents)
  - [Description](#description)
  - [Motivation](#motivation)
    - [Bridge Between Push and Pull Strategies](#bridge-between-push-and-pull-strategies)
    - [CQS Pattern Implementation](#cqs-pattern-implementation)
    - [Reactive Programming with RxJS](#reactive-programming-with-rxjs)
  - [Features](#features)
  - [Installation](#installation)
  - [Architecture Overview](#architecture-overview)
  - [Query Models](#query-models)
    - [Thinking with Query Models](#thinking-with-query-models)
    - [Vault and Store](#vault-and-store)
    - [Query and Refresh](#query-and-refresh)
    - [Key Hashing and Parameters](#key-hashing-and-parameters)
    - [Configuration](#configuration)
    - [Query API Reference](#query-api-reference)
      - [Exported Types](#exported-types)
      - [Protected Methods (Can be overridden)](#protected-methods-can-be-overridden)
      - [Public Methods](#public-methods)
      - [Configuration Options](#configuration-options)
  - [Command Models](#command-models)
    - [Understanding Mutate](#understanding-mutate)
    - [Store Architecture](#store-architecture)
    - [Parameter Management](#parameter-management)
    - [Store Extension](#store-extension)
    - [Command API Reference](#command-api-reference)
      - [Exported Types](#exported-types-1)
      - [Protected Methods (Can be overridden)](#protected-methods-can-be-overridden-1)
      - [Public Methods](#public-methods-1)
  - [Adapters](#adapters)
    - [React Integration](#react-integration)
      - [Using the React Adapter (Recommended)](#using-the-react-adapter-recommended)
  - [Contributing](#contributing)
  - [License](#license)

## Description

Reactive Query is a framework-agnostic library designed specifically for the **Model** part in the **MVVM (Model-View-ViewModel)** or any MV* architectural pattern. It automates the process of querying, storing, and managing data in frontend applications by implementing **CQS (Command Query Separation)** and **reactive programming** paradigms.

The library provides a bridge between **push-based** and **pull-based** rendering strategies, enabling granular control over re-rendering in pull-based frameworks like React and Vue while maintaining the efficiency of push-based frameworks like Angular.

## Motivation

In modern frontend development, there's a significant gap in libraries that can effectively manage data and automate the processes of managing, caching, and invalidating data in frontend applications while fitting seamlessly into the MVVM architectural pattern. Most existing solutions either:

- Don't follow any software architectural patterns principles
- Lack proper single responsibility 
- Don't provide granular control over re-rendering
- Are framework-specific rather than framework-independent

We created Reactive Query to address these challenges by providing a specialized library that handles all logic related to data manipulation in the Model part of MVVM or any MV*.

### Bridge Between Push and Pull Strategies

Modern frontend frameworks use different rendering strategies:

**Push-based (Angular):** The framework automatically detects changes and re-renders components when data changes.

**Pull-based (React/Vue):** Components must explicitly request re-renders when their state changes.

Reactive Query bridges this gap by providing reactive observables that can be easily connected to pull-based frameworks. For example, in React, you can pipe and map changes to specific object keys, triggering `setState` only when relevant data changes:

```typescript
// Instead of re-rendering on any data change
userModel.query().subscribe(setUserData);

// You can be granular and only re-render when specific fields change
userModel.query().pipe(
  distinctUntilChanged((prev, next) => prev.places.length === next.places.length)
).subscribe(setPlaces);
```

### CQS Pattern Implementation

We implemented the **Command Query Separation (CQS)** pattern to handle different types of data operations:

- **Queries**: Read operations that don't modify state of the software and just need to be cached and refresh the data in some scenarios.
- **Commands**: Write operations that modify software state

This separation allows for better performance, caching strategies, and state management. For more information about CQS, see [Command Query Separation](https://martinfowler.com/bliki/CommandQuerySeparation.html).

### Reactive Programming with RxJS

To provide subscribing capabilities and maintain framework agnosticism, we use the reactive programming paradigm with RxJS. This enables:

- Automatic subscription management
- Powerful data transformation operators
- Framework-independent state management
- Efficient change detection and propagation

## Features

- 🏗️ **MVVM Architecture** - Designed specifically for the Model part of MVVM
- 🔄 **CQS Pattern** - Clear separation between Commands and Queries
- ⚡ **Reactive Programming** - Built on RxJS for real-time state updates
- 💾 **Smart Caching** - Automatic caching with configurable stale times
- 🔄 **Retry Mechanism** - Built-in retry logic for failed operations
- 🎯 **TypeScript Support** - Full TypeScript support with type safety
- 📦 **Lightweight** - Minimal bundle size with zero dependencies (except RxJS)
- 🔧 **Framework Agnostic** - Works with any frontend framework
- 🎛️ **Granular Control** - Fine-grained control over re-rendering
- 🔌 **Extensible** - Easy to extend with custom stores and events

## Installation

```bash
npm install reactive-query
# or
yarn add reactive-query
# or
pnpm add reactive-query
```

## Architecture Overview

Reactive Query follows a clear architectural pattern:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Query Models  │    │  Command Models │    │     Stores      │
│                 │    │                 │    │                 │
│ • ReactiveQuery │    │ • ReactiveCmd   │    │ • Query Vault   │
│ • Caching       │    │ • Mutations     │    │ • Command Store │
│ • Parameters    │    │ • Parameters    │    │ • Events        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   RxJS Streams  │
                    │                 │
                    │ • Observables   │
                    │ • Subscriptions │
                    │ • Operators     │
                    └─────────────────┘
```

## Query Models

Query Models handle read operations and implement intelligent caching strategies.

### Thinking with Query Models

Query Models are designed around the concept of **parameterized queries** that return cached results. Think of them as smart data fetchers that:

1. **Cache by parameters** - Different parameters create different cache entries
2. **Auto-refresh stale data** - Automatically fetch fresh data when cache expires
3. **Handle loading states** - Provide loading, error, and success states
4. **Retry on failure** - Automatically retry failed requests

### Vault and Store

**Vault**: A collection of stores indexed by hashed parameters. Think of it as a cache container.

**Store**: Individual cache entries containing data, loading states, and metadata.

```typescript
// Vault structure
{
  "user_123": { data: User, isLoading: false, isFetched: true, ... },
  "user_456": { data: User, isLoading: true, isFetched: false, ... },
  "products_filters": { data: Product[], isLoading: false, isFetched: true, ... }
}
```

### Query and Refresh

**Query**: The public method that returns an observable of query results.

**Refresh**: The protected method you implement to fetch data from your API.

```typescript
class UserQueryModel extends ReactiveQueryModel<User> {
  protected async refresh(userId: number): Promise<User> {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  }
}

// Usage
const userModel = new UserQueryModel();
const user$ = userModel.query(123); // Observable<User>
```

### Key Hashing and Parameters

Parameters are automatically hashed to create cache keys. The library provides intelligent hashing that:

- Handles primitive values (strings, numbers, booleans)
- Sorts object keys for consistent hashing (Just one layer to avoid heavy time complexity. You can overwrite hashing logics for custom algorithms)
- Handles arrays and nested objects
- Supports custom hashing algorithms

```typescript
// These all create the same hash key
userModel.query({ id: 123, include: 'profile' });
userModel.query({ include: 'profile', id: 123 });

// Different parameters create different cache entries
userModel.query(123);        // Key: "123"
userModel.query(456);        // Key: "456"
userModel.query({ id: 123 }); // Key: '{"id":123}'
```

### Configuration

Query Models support various configuration options:

```typescript
class UserQueryModel extends ReactiveQueryModel<User> {
  protected get configs() {
    return {
      maxRetryCall: 3,           // Retry failed requests 3 times
      cachTime: 5 * 60 * 1000,   // Cache for 5 minutes
      emptyVaultOnNewValue: false, // Keep old cache when new data arrives
      initStore: {
        key: 'default',
        value: { id: 0, name: 'Loading...' },
        staleTime: 60 * 1000
      }
    };
  }
}
```

### Query API Reference

#### Exported Types

```typescript
// Main response type for queries
type QueryResponse<DATA> = {
  data?: DATA;
  isLoading: boolean;
  isFetching: boolean;
  isFetched: boolean;
  error?: unknown;
  staled: boolean;
  staleTime?: number;
  lastFetchedTime?: number;
};

// Base store type
type BaseReactiveStore<DATA> = {
  data: DATA;
  isLoading: boolean;
  isFetching: boolean;
  isFetched: boolean;
  error?: unknown;
  staled: boolean;
  staleTime?: number;
  lastFetchedTime?: number;
};

// Vault type for multiple stores
type ReactiveQueryVault<DATA, EVENTS = undefined> = {
  store$: Observable<{ [key: string]: BaseReactiveStore<DATA> }>;
} & QueryVaultEvents<DATA> & EVENTS;
```

#### Protected Methods (Can be overridden)

```typescript
// Override to implement your data fetching logic
protected abstract refresh(params?: unknown): Promise<DATA>;

// Override for custom parameter hashing
protected getHashedKey(params?: unknown): string;

// Override for custom configuration
protected get configs(): {
  maxRetryCall: number;
  cachTime: number;
  emptyVaultOnNewValue: boolean;
  initStore?: {
    key: string;
    value: DATA;
    staleTime?: number;
  };
};
```

#### Public Methods

```typescript
// Main query method
query(params?: unknown, configs?: { staleTime?: number }): Observable<QueryResponse<DATA>>

// Store management
get storeHandler(): {
  invalidate(): void;
  invalidateByKey(params?: unknown): void;
  resetStore(params?: unknown): void;
}

// Utility methods
isSameBaseData(prev: QueryResponse<DATA>, curr: QueryResponse<DATA>): boolean;
```

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxRetryCall` | `number` | `1` | Maximum retry attempts for failed requests |
| `cachTime` | `number` | `3 * 60 * 1000` | Default cache time in milliseconds |
| `emptyVaultOnNewValue` | `boolean` | `false` | Clear vault when new data arrives |
| `initStore` | `object` | `undefined` | Initial store configuration |

## Command Models

Command Models handle write operations (create, update, delete) and manage parameter state.

### Understanding Mutate

The `mutate` method is the core of Command Models. It handles write operations and manages the command lifecycle:

```typescript
class CreateUserCommandModel extends ReactiveCommandModel<CreateUserParams, User> {
  async mutate(params: CreateUserParams): Promise<User> {
    const response = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return response.json();
  }
}
```

### Store Architecture

Unlike Query Models, Command Models use a single store instead of a vault because:

- **No parameter-based caching** - Commands don't need to cache by parameters
- **Single state management** - One set of parameters per command
- **Immediate execution** - Commands execute immediately, not on demand

```typescript
// Command store structure
{
  isLoading: boolean;
  params: Partial<PARAMS>;
  // ... extended store properties
}
```

### Parameter Management

Command Models provide built-in parameter management:

```typescript
// Get current parameters
const params = commandModel.getParams();

// Update parameters
commandModel.updateModificationStore({ name: 'John', email: 'john@example.com' });

// Get specific parameter
const name = commandModel.getModificationValueByKey('name');

// Subscribe to parameter changes
commandModel.subscribeToParam().subscribe(({ params, isLoading }) => {
  console.log('Parameters changed:', params);
});
```

### Store Extension

Command Models support extended stores and custom events:

```typescript
class ExtendedCommandModel extends ReactiveCommandModel<
  UserParams,
  User,
  { validationErrors: string[] },
  { onValidationError: (errors: string[]) => void }
> {
  protected initExtendedStore() {
    return {
      initExtendedStore: { validationErrors: [] },
      extendedEvents: (store$) => ({
        onValidationError: (errors: string[]) => {
          store$.next({
            ...store$.value,
            validationErrors: errors
          });
        }
      })
    };
  }
}
```

### Command API Reference

#### Exported Types

```typescript
// Command response type
type CommandModelSubscribeResponse<PARAMS> = {
  params: Partial<PARAMS>;
  isLoading: boolean;
};

// Base command store
type BaseReactiveCommandStore<PARAMS, EXTENDED_STORE> = {
  isLoading: boolean;
  params: Partial<PARAMS>;
} & EXTENDED_STORE;

// Command store with events
type ReactiveCommandStore<PARAMS, EXTENDED_STORE, EXTENDED_EVENTS> = {
  store$: BehaviorSubject<BaseReactiveCommandStore<PARAMS, EXTENDED_STORE>>;
} & BaseReactiveCommandEvents<PARAMS, EXTENDED_STORE> & EXTENDED_EVENTS;
```

#### Protected Methods (Can be overridden)

```typescript
// Override to implement your mutation logic
abstract mutate(...args: any[]): Promise<RESPONSE>;

// Override for initial parameters
getInitialParams(): PARAMS;

// Override for extended store and events
protected initExtendedStore(): {
  initExtendedStore?: EXTENDED_STORE;
  extendedEvents?: (store$: BehaviorSubject<BaseReactiveCommandStore<PARAMS, EXTENDED_STORE>>) => EXTENDED_EVENTS;
};
```

#### Public Methods

```typescript
// Subscribe to store changes
subscribeToParam(): Observable<CommandModelSubscribeResponse<PARAMS>>;

// Parameter management
getModificationValueByKey<T extends keyof PARAMS>(key: T): PARAMS[T] | undefined;
updateModificationStore(params: Partial<PARAMS>): void;
getParams(): PARAMS;
getStore(): BaseReactiveCommandStore<PARAMS, EXTENDED_STORE>;

// State management
updateIsLoading(isLoading: boolean): void;
resetStore(): void;
```

## Adapters

### React Integration

For seamless React integration, we provide a dedicated React adapter library: [reactive-query-react](https://github.com/behnamrhp/reactive-query-react)

#### Using the React Adapter (Recommended)

```bash
npm install reactive-query-react
```

```tsx
import React, { useRef } from 'react';
import { useRXQuery } from 'reactive-query-react';
import { ReactiveQueryModel } from 'reactive-query';

class TodoQueryModel extends ReactiveQueryModel<Todo[]> {
  protected async refresh(): Promise<Todo[]> {
    const response = await fetch('/api/todos');
    return response.json();
  }
}

function TodoList() {
  const todoModel = useRef(new TodoQueryModel()).current;
  const queryData = useRXQuery(todoModel.query);

  if (queryData.loading) {
    return <p>Loading...</p>;
  }

  if (queryData.error) {
    return <p>Error: {queryData.error.message}</p>;
  }

  return (
    <ul>
      {queryData.data?.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.