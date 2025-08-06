/* eslint-disable @typescript-eslint/no-explicit-any */
import { BehaviorSubject, Observable } from "rxjs";

/**
 * Base store with extended store without any events
 */
export type BaseReactiveCommandStore<
  DATA,
  EXTENDED_STORE extends Record<string, unknown> | undefined = undefined,
> = {
  isLoading: boolean;
  params: Partial<DATA>;
} & (EXTENDED_STORE extends undefined ? Record<string, never> : EXTENDED_STORE);

/**
 * Base events with extended store
 */
export type BaseReactiveCommandEvents<
  DATA,
  EXTENDED_STORE extends Record<string, unknown> | undefined = undefined,
> = {
  setIsLoading(isLoading: boolean): void;
  reset(): void;
  getStore(): BaseReactiveCommandStore<DATA, EXTENDED_STORE>;
  getParams(): Partial<DATA>;
  updateParams(updatedParam: Partial<DATA>): void;
};

export type ExtendedEvents = Record<
  string,
  (...args: any[]) => void | undefined
>;

/**
 * Observable version of store with extended store
 */
export type ObservableStore<
  DATA,
  EXTENDED_STORE extends Record<string, unknown> | undefined = undefined,
> = Observable<
  EXTENDED_STORE extends undefined
    ? BaseReactiveCommandStore<DATA>
    : BaseReactiveCommandStore<DATA> & EXTENDED_STORE
>;

/**
 * Whole store with extended events and extended store
 */
export type ReactiveCommandStore<
  DATA,
  EXTENDED_STORE extends Record<string, unknown> | undefined = undefined,
  EXTENDED_EVENTS extends ExtendedEvents | undefined = undefined,
> = {
  store$: BehaviorSubject<BaseReactiveCommandStore<DATA, EXTENDED_STORE>>;
} & BaseReactiveCommandEvents<DATA, EXTENDED_STORE> &
  (EXTENDED_EVENTS extends undefined ? Record<string, never> : EXTENDED_EVENTS);
