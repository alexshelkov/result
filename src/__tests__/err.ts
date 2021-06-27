/* eslint-disable @typescript-eslint/ban-types */

import { Err } from '../index';

type TestErr<T, A = {}> = {
  type: T;
  message?: string;
  level?: number;
  retry?: boolean;
  notify?: boolean;
  fatal?: boolean;
} & A;

describe('error utils', () => {
  it('string as type', () => {
    expect.assertions(1);

    const e1: TestErr<'e1'> = {
      type: 'e1',
    } as Err<'e1'>;

    expect(e1.type).toStrictEqual('e1');
  });

  it('object as type', () => {
    expect.assertions(2);

    const e1: TestErr<'e1'> = {
      type: 'e1',
    } as Err<{ type: 'e1' }>;

    expect(e1.type).toStrictEqual('e1');

    const e2 = {
      type: 'e1',
    } as Err<{}, { type: 'e1' }>;

    expect(e2.type).toStrictEqual('e1');
  });

  it('adds other parans to err', () => {
    expect.assertions(1);

    const e1: TestErr<'e1', { test: string }> = {
      type: 'e1',
    } as Err<'e1', { test: string }>;

    expect(e1.type).toStrictEqual('e1');
  });

  it('two objects', () => {
    expect.assertions(1);

    const e1: TestErr<'e1', { test1: number; test2: string }> = {
      type: 'e1',
    } as Err<{ type: 'e1'; test1: number }, { test2: string }>;

    expect(e1.type).toStrictEqual('e1');
  });
});
