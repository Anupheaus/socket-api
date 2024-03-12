import { AnyObject, Record, is } from '@anupheaus/common';
import { useCreateStoreController } from './ClientStoreController';
import { test, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';

interface Props {
  onEmit(eventName: string, ...args: unknown[]): unknown;
}

function createMock({ onEmit }: Props) {
  return useCreateStoreController({
    getSocket: (async () => ({
      emitWithAck: (eventName: string, ...args: unknown[]) => onEmit(eventName, ...args),
    } as any)),
    useSocket: () => void 0,
  })({
    name: 'testStore',
    onHydrateRecord: <T extends Record>(record: T) => record,
  });
}

test.skip('get: getSocket is only called once', async () => {
  let called = 0;
  const { get } = createMock({
    onEmit: async () => {
      called++;
      return [{ id: '1', name: 'test' }];
    },
  });

  const record = await get('1');
  expect(record).toEqual({ id: '1', name: 'test' });
  expect(called).toBe(1);
  const record2 = await get('1');
  expect(record2).toEqual({ id: '1', name: 'test' });
  expect(called).toBe(1);
  const record3 = await get('2');
  expect(record3).toEqual(undefined);
  expect(called).toBe(2);
});

test.skip('get: should be synchronous once already loaded', async () => {
  const { get } = createMock({
    onEmit: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [{ id: '1', name: 'test' }];
    },
  });

  const steps = [];

  const getRecord = async () => {
    steps.push('2');
    const result = get('1');
    const record = is.promise(result) ? await result : result;
    steps.push('3');
    return record;
  };


  steps.push('1');
  let result = getRecord();
  steps.push('4');
  await result;

  expect(steps).toEqual(['1', '2', '4', '3']);
  steps.length = 0;

  steps.push('1');
  result = getRecord();
  steps.push('4');
  await result;

  expect(steps).toEqual(['1', '2', '3', '4']);
});

test('useGet: should be synchronous once already loaded', async () => {
  const { useGet } = createMock({
    onEmit: async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return [{ id: '1', name: 'test' }];
    },
  });

  const renderResults: AnyObject[] = [];
  const TestApp = () => {
    const { record, isLoading, error } = useGet('1');
    renderResults.push({ record, isLoading, error });
    return null;
  };

  const component = render(<TestApp key="1" />);
  await waitFor(() => expect(renderResults.length).toBe(2));
  expect(renderResults).toEqual([
    { record: undefined, isLoading: true, error: undefined },
    { record: { id: '1', name: 'test' }, isLoading: false, error: undefined },
  ]);
  renderResults.length = 0;
  component.rerender(<TestApp key="2" />);
  expect(renderResults).toEqual([
    { record: { id: '1', name: 'test' }, isLoading: false, error: undefined },
  ]);
});