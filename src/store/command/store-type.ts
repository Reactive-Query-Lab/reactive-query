import { Observable } from "rxjs";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type BaseReactiveCommandStoreEmit<DATA> = (
  partial:
    | BaseReactiveCommandStore<DATA>
    | Partial<BaseReactiveCommandStore<DATA>>
    | ((
        state: BaseReactiveCommandStore<DATA>,
      ) => BaseReactiveCommandStore<DATA>),
  replace?: boolean | undefined,
) => void;

export type BaseReactiveCommandStore<DATA> = {
  isLoading: boolean;
  params: Partial<DATA>;
  [key: string]: any;
};

export type BaseReactiveCommandEvents<DATA> = {
  setIsLoading(isLoading: boolean): void;
  reset(): void;
  updateParams(updatedParam: Partial<DATA>): void;
};

export type ReactiveCommandStore<DATA> = {
  store$: Observable<BaseReactiveCommandStore<DATA>>;
} & BaseReactiveCommandEvents<DATA>;
