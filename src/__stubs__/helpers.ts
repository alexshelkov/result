import { Err } from '../index';

export type E1 = Err<'e1'>;

export type E2 = Err<'e2', { stringAdded: 'e2data' }>;

export interface E3<T> extends Err {
  type: 'e3';
  numberAdded: T;
}

export type AppErr = E1 | E2 | E3<number>;

export type Assert<A extends boolean, T extends A> = T;

export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false;
