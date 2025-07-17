# Reactive Query

A lightweight, reactive state management library for modern JavaScript/TypeScript applications with built-in caching, retry mechanisms, and RxJS integration.

## Features

- 🚀 **Reactive State Management** - Built on RxJS for real-time state updates
- 💾 **Smart Caching** - Automatic caching with configurable stale times
- 🔄 **Retry Mechanism** - Built-in retry logic for failed operations
- 🎯 **TypeScript Support** - Full TypeScript support with type safety
- 📦 **Lightweight** - Minimal bundle size with zero dependencies (except RxJS)
- 🔧 **Flexible** - Easy to integrate with any framework

## Installation

```bash
npm install reactive-query
# or
yarn add reactive-query
# or
pnpm add reactive-query
```

## Quick Start

### Basic Usage

```typescript
import { ReactiveQueryModel, createVault } from 'reactive-query';

// Define your data type
type UserData = {
  id: number;
  name: string;
  email: string;
};

// Create a query model
class UserQueryModel extends ReactiveQueryModel<UserData> {
  protected store = createVault<UserData>();
  protected store$ = this.store.store$;

  protected async refresh(params?: unknown): Promise<UserData> {
    // Your API call logic here
    const response = await fetch(`/api/users/${params}`);
    return response.json();
  }
}

// Use the model
const userModel = new UserQueryModel();
const userData$ = userModel.query(123); // Observable<UserData>
```

### Advanced Usage with Caching

```typescript
import { ReactiveQueryModel, createVault } from 'reactive-query';

class ProductQueryModel extends ReactiveQueryModel<Product[]> {
  protected store = createVault<Product[]>({
    initialValue: [],
    initalKey: 'products',
    initStaleTime: 5 * 60 * 1000, // 5 minutes
  });
  protected store$ = this.store.store$;

  protected configs = {
    maxRetryCall: 3, // Retry failed requests up to 3 times
  };

  protected async refresh(params?: ProductFilters): Promise<Product[]> {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`/api/products?${queryString}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    return response.json();
  }
}
```

## API Reference

### ReactiveQueryModel

The main class for creating reactive query models.

#### Constructor
```typescript
class MyQueryModel extends ReactiveQueryModel<DataType> {
  // Implementation
}
```

#### Methods

##### `query(params?: unknown): Observable<QueryResponse<DataType>>`
Executes a query with optional parameters and returns an observable of the result.

##### `storeHandler.invalidate()`
Invalidates all cached data, forcing fresh fetches on next queries.

#### Properties

##### `configs.maxRetryCall: number`
Number of retry attempts for failed operations (default: 1).

### createVault

Factory function to create a reactive store vault.

```typescript
const vault = createVault<DataType>({
  initialValue?: DataType;
  initalKey?: string;
  initStaleTime?: number;
});
```

### recursiveCallWithRetry

Utility function for retrying async operations.

```typescript
import { recursiveCallWithRetry } from 'reactive-query';

const result = await recursiveCallWithRetry(
  async () => {
    // Your async operation
    return await someAsyncOperation();
  },
  3 // max retries
);
```

## Types

### QueryResponse<DataType>
```typescript
type QueryResponse<DataType> = {
  data?: DataType;
  isLoading: boolean;
  isFetching: boolean;
  isFetched: boolean;
  error?: unknown;
  staled: boolean;
  staleTime?: number;
  lastFetchedTime?: number;
};
```

### BaseReactiveStore<DataType>
```typescript
type BaseReactiveStore<DataType> = {
  data: DataType;
  isLoading: boolean;
  isFetching: boolean;
  isFetched: boolean;
  error?: unknown;
  staled: boolean;
  staleTime?: number;
  lastFetchedTime?: number;
};
```

## Examples

### React Integration

```typescript
import React, { useEffect, useState } from 'react';
import { ReactiveQueryModel, createVault } from 'reactive-query';

class TodoQueryModel extends ReactiveQueryModel<Todo[]> {
  protected store = createVault<Todo[]>();
  protected store$ = this.store.store$;

  protected async refresh(): Promise<Todo[]> {
    const response = await fetch('/api/todos');
    return response.json();
  }
}

function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const todoModel = new TodoQueryModel();
    const subscription = todoModel.query().subscribe({
      next: (response) => {
        setTodos(response.data || []);
        setLoading(response.isLoading);
      },
      error: (error) => {
        console.error('Failed to fetch todos:', error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div>
      {loading ? <p>Loading...</p> : (
        <ul>
          {todos.map(todo => (
            <li key={todo.id}>{todo.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Vue Integration

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { ReactiveQueryModel, createVault } from 'reactive-query';

class UserQueryModel extends ReactiveQueryModel<User> {
  protected store = createVault<User>();
  protected store$ = this.store.store$;

  protected async refresh(userId: number): Promise<User> {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  }
}

export default {
  setup() {
    const user = ref<User | null>(null);
    const loading = ref(false);
    let subscription: Subscription;

    onMounted(() => {
      const userModel = new UserQueryModel();
      subscription = userModel.query(123).subscribe({
        next: (response) => {
          user.value = response.data || null;
          loading.value = response.isLoading;
        }
      });
    });

    onUnmounted(() => {
      subscription?.unsubscribe();
    });

    return { user, loading };
  }
};
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
