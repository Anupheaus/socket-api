import { AnyFunction, AnyObject, DataRequest, DataResponse, InternalError, PromiseMaybe, Record, UnPromise, Upsertable, is } from '@anupheaus/common';
import { SocketAPIError, StoreControllerUpdate } from '../common';
import { ControllerProps, MakeAsyncResponse } from './ClientModels';
import { useAsync, useBatchUpdates, useBound, useForceUpdate, useId, useUpdatableState } from '@anupheaus/react-ui';
import { useLayoutEffect, useMemo, useRef } from 'react';

type AddRequestTo<ResponseType, RequestDelegate extends AnyFunction> = ResponseType & {
  request: RequestDelegate;
};

interface UseRequestProps {
  manuallyTriggered?: boolean;
}

function saveStore(name: string, records: Map<string, Record>) {
  const anyWindow = window as AnyObject;
  if (anyWindow == null) return;
  anyWindow.stores = (anyWindow.stores ?? {});
  anyWindow.stores[name] = records;
}

const hydrateRecord = <T extends Record>(record: T) => record;

interface UseStoreControllerProps {
  name: string;
  onHydrateRecord?<T extends Record>(record: T, storeName: string): T;
}

type TypedEntitiesOf<RecordEntities extends globalThis.Record<string, (ids: string[]) => PromiseMaybe<Record[]>>> = {
  [K in keyof RecordEntities]: UnPromise<ReturnType<RecordEntities[K]>>;
};

interface UseCreateStoreControllerProps extends Pick<ControllerProps, 'getSocket' | 'useSocket'> { }

export function useCreateStoreController({ getSocket, useSocket }: UseCreateStoreControllerProps) {
  const globalListeners = new Map<string, (updates: StoreControllerUpdate<Record>[]) => void>();

  useSocket(socket => {
    socket.onAny((eventName: string, updates: StoreControllerUpdate<Record>[]) => {
      if (!eventName.endsWith('.storeUpdate')) return;
      const controllerName = eventName.split('.')[0];
      const storeListener = globalListeners.get(controllerName);
      if (storeListener == null) return;
      storeListener(updates);
    });
  });

  return <T extends Record = Record>({ name: controllerName, onHydrateRecord = hydrateRecord }: UseStoreControllerProps) => {
    const store = new Map<string, T>();
    saveStore(controllerName, store);
    const listeners = new Map<string, (updates: StoreControllerUpdate<T>[]) => void | boolean>();

    globalListeners.set(controllerName, updates => {
      updates.forEach(update => {
        const { action, record } = update;
        if (is.plainObject(record)) update.record = onHydrateRecord(record as T, controllerName);
        switch (action) {
          case 'remove': store.delete(record); return;
        }
      });
      listeners.forEach(listener => listener(updates as StoreControllerUpdate<T>[]));
    });

    const useListener = (delegate?: (updates: StoreControllerUpdate<T>[]) => void | boolean) => {
      const id = useId();
      const update = useForceUpdate();

      const boundDelegate = useBound((updates: StoreControllerUpdate<T>[]) => {
        if (delegate == null) return update();
        const result = delegate(updates);
        if (result === true) update();
      });

      useLayoutEffect(() => {
        listeners.set(id, boundDelegate);
        return () => { listeners.delete(id); };
      }, []);
    };

    const invoke = async <R>(name: string, ...args: unknown[]): Promise<R> => {
      const socket = await getSocket();
      const result = await socket.emitWithAck(`${controllerName}.${name}`, ...args);
      if (is.plainObject(result) && Reflect.has(result, 'error')) throw SocketAPIError.from(result.error);
      return result;
    };

    const updateRecordsInStore = async (records: T[]): Promise<void> => records.forEach(record => store.set(record.id, record));

    const getRecords = (ids: string[]) => {
      const loadMissingRecords = async (missingRecordIds: string[]) => {
        let records = await invoke<T[]>('storeGetRecords', missingRecordIds);
        records = records.map(record => onHydrateRecord(record, controllerName));
        const retrievedRecordIds = records.ids();
        if (retrievedRecordIds.length !== missingRecordIds.length) {
          const notRetrievedRecordIds = missingRecordIds.filter(id => !retrievedRecordIds.includes(id));
          throw new SocketAPIError({ message: `Failed to get records for ids: ${notRetrievedRecordIds.join(', ')}` });
        }
        await updateRecordsInStore(records!);
      };
      const returnRecords = () => ids.map(id => store.get(id)).removeNull() as T[];
      const missingRecordIds = ids.filter(id => !store.has(id));
      return missingRecordIds.length > 0 ? loadMissingRecords(missingRecordIds).then(returnRecords) : returnRecords();
    };

    const request = async (requestParams: DataRequest<T> = {}): Promise<DataResponse<T>> => {
      if (Object.keys(requestParams).length > 0 && DataRequest.isEmpty(requestParams)) { return { data: [], total: 0, ...requestParams.pagination }; }
      const response = await invoke<DataResponse<string | T>>('storeRequest', requestParams);
      if (!(response.data instanceof Array)) throw new SocketAPIError({ message: 'Response from server was not in the expected format.', meta: { response } });
      const data = response.data;
      const newRecords = new Map<string, T>();
      const ids: string[] = [];
      data.forEach(record => typeof (record) === 'string' ? ids.push(record) : newRecords.set(record.id, onHydrateRecord(record, controllerName)));
      await updateRecordsInStore(newRecords.toValuesArray());
      const existingRecords = new Map((await getRecords(ids))?.map(record => [record.id, record]));
      const records = data.map(record => typeof (record) === 'string' ? existingRecords.get(record) : newRecords.get(record.id)).removeNull();
      return {
        ...response,
        data: records,
      };
    };

    // eslint-disable-next-line max-len
    const useRequest = (requestParams?: DataRequest<T>, { manuallyTriggered = false }: UseRequestProps = {}): MakeAsyncResponse<AddRequestTo<DataResponse<T>, (request?: DataRequest<T>) => Promise<void>>> => {
      const lastRequestParamsRef = useRef<DataRequest<T>>();
      const { response, isLoading, error, trigger: remakeRequest } = useAsync((innerRequestParams?: DataRequest<T>) => {
        lastRequestParamsRef.current = innerRequestParams;
        return request(innerRequestParams);
      }, [Object.hash({ requestParams })], { manuallyTriggered });
      const batchUpdate = useBatchUpdates();
      const [data, setData] = useUpdatableState(() => response?.data ?? [], [response?.data]);

      const trigger = useBound(async (newRequestParams?: DataRequest<T>) => { await remakeRequest(newRequestParams); });

      useListener(updates => batchUpdate(() => {
        const updatedRecords: T[] = [];
        const removeRecords: T[] = [];
        let triggerNewRequest = false;
        const currentIds = data.ids();

        updates.forEach(({ action, record }) => {
          switch (action) {
            case 'create': {
              triggerNewRequest = true;
              break;
            }
            case 'update': {
              if (currentIds.includes(record.id)) {
                updatedRecords.push(record);
              } else {
                triggerNewRequest = true;
              }
              break;
            }
            case 'remove': {
              const existingRecord = data.findById(record);
              if (existingRecord != null) removeRecords.push(existingRecord);
              break;
            }
          }
        });
        if (removeRecords.length > 0) setData(innerData => innerData.removeMany(removeRecords));
        if (updatedRecords.length > 0) setData(innerData => innerData.replaceMany(updatedRecords));
        if (triggerNewRequest) trigger(lastRequestParamsRef.current);
      }));

      useMemo(() => {
        trigger(requestParams);
      }, [Object.hash(requestParams ?? {})]);

      return {
        total: data.length,
        ...response,
        data,
        isLoading,
        error: error != null ? SocketAPIError.from(error) : undefined,
        request: trigger,
      };
    };

    function get(id: string): PromiseMaybe<T | undefined>;
    function get(ids: string[]): PromiseMaybe<T[]>;
    function get(ids: string | string[]) {
      let isArray = true;
      if (!is.array(ids)) { ids = [ids]; isArray = false; }
      ids = ids.distinct().removeNull();
      const result = ids.length === 0 ? undefined : getRecords(ids);
      const parseResult = (records: T[] | undefined) => isArray ? records ?? [] : records?.[0];
      return is.promise(result) ? result.then(parseResult) : parseResult(result);
    }

    function useGet(id: string | undefined, props?: UseRequestProps): MakeAsyncResponse<AddRequestTo<{ record?: T; }, (id: string) => Promise<void>>>;
    function useGet(ids: string[], props?: UseRequestProps): MakeAsyncResponse<AddRequestTo<{ records: T[]; }, (ids: string) => Promise<void>>>;
    function useGet(idOrIds: string | string[] | undefined, props?: UseRequestProps): unknown {
      const singleIdRef = useRef(typeof (idOrIds) === 'string');
      const emptyResult = useRef<T[]>([]);
      const { response: records = emptyResult.current, isLoading, error, trigger } = useAsync((innerIds: string | string[] | undefined) => {
        let idsToUse = innerIds ?? idOrIds;
        if (typeof (idsToUse) === 'string') { singleIdRef.current = true; idsToUse = [idsToUse]; }
        const ids = idsToUse?.distinct().removeNull();
        if (!(ids instanceof Array) || ids.length === 0) return undefined;
        return get(ids);
      }, [Object.hash({ idOrIds })], props);

      return {
        ...(singleIdRef.current ? { record: records[0] } : { records }),
        isLoading,
        error: error != null ? SocketAPIError.from(error) : undefined,
        request: trigger,
      };
    }

    const upsert = async (record: Upsertable<T>): Promise<T> => {
      const newRecord = await invoke<T>('storeUpsert', record);
      await updateRecordsInStore([newRecord]);
      return newRecord;
    };

    const remove = async (id: string): Promise<void> => {
      await invoke('storeRemove', id);
      store.delete(id);
    };

    const preloadRecords = <RecordIds extends globalThis.Record<string, string | string[] | undefined>>(records: T[], delegate: (record: T) => RecordIds) => {
      const mergeIds = (newIdOrIds: string | string[] | undefined, existingIds: string[] | undefined) => {
        if (!is.array(newIdOrIds) && is.empty(newIdOrIds)) return existingIds ?? [];
        const newIds = is.array(newIdOrIds) ? newIdOrIds : [newIdOrIds];
        if (existingIds == null) return newIds;
        return [...existingIds, ...newIds];
      };
      const mapOfIds = records.reduce((map, record) => {
        const idMap = delegate(record);
        Object.keys(idMap).forEach(key => {
          map[key] = mergeIds(idMap[key], map[key]).distinct();
        });
        return map;
      }, {} as AnyObject);
      return {
        async using<RecordEntities extends globalThis.Record<keyof RecordIds, (ids: string[]) => PromiseMaybe<Record[]>>>(sources: RecordEntities): Promise<TypedEntitiesOf<RecordEntities>> {
          const results: AnyObject = {};
          const promises = Object.keys(mapOfIds).map(async key => {
            try {
              results[key] = await sources[key](mapOfIds[key]);
            } catch (error) {
              throw new InternalError({ message: `Failed to preload records for "${key}"`, meta: { error } });
            }
          });
          await Promise.allSettled(promises);
          return results as any;
        },
      };
    };

    return {
      request,
      useRequest,
      useListener,
      get,
      useGet,
      upsert,
      remove,
      updateStoreWith: updateRecordsInStore,
      preloadRecords,
    };
  };
}