import { Record } from '@anupheaus/common';
import { ClientStoreAsyncResponse, ClientStoreResponse, StoreControllerFunctions } from '../../createUseController';
import { SocketAPIError, StoreRequest } from '../../../common';
import { useAsync } from '@anupheaus/react-ui';
import { ClientControllerCommonProps } from './ClientControllerModels';
import { ClientStoreController } from '../createClientStores';

function createRequest({ getSocket, controllerName, store }: CreateClientStoreControllerFunctionsProps) {
  return async <T extends Record>(request?: StoreRequest<T>): Promise<ClientStoreResponse<T>> => {
    const socket = await getSocket();
    const response = await socket.emitWithAck(`${controllerName}.storeRequest`, request) as ClientStoreResponse<string>;
    if (!(response.data instanceof Array)) return response as unknown as ClientStoreResponse<T>;
    const records = await store.getRecords<T>(response.data);
    return {
      ...response,
      data: records ?? [],
    };
  };
}

interface CreateUseRequestProps { request: ReturnType<typeof createRequest>; }
function createUseRequest({ request: asyncRequest }: CreateUseRequestProps) {
  return <T extends Record>(request?: StoreRequest<T>): ClientStoreAsyncResponse<T> => {
    const { response, isLoading, error } = useAsync(() => asyncRequest(request), [request]);
    return {
      data: response?.data ?? [],
      total: response?.total ?? 0,
      isLoading,
      error: error != null ? SocketAPIError.from(error) : undefined,
      page: response?.page,
      pageSize: response?.pageSize,
    };
  };
}

interface CreateClientStoreControllerFunctionsProps extends ClientControllerCommonProps { controllerName: string; store: ClientStoreController; }
export function createClientStoreControllerFunctions(props: CreateClientStoreControllerFunctionsProps): StoreControllerFunctions {

  const request = createRequest(props);
  const useRequest = createUseRequest({ request });
  return {
    request,
    useRequest,
    get: () => Promise.resolve() as Promise<Record | undefined>,
    useGet: () => ({ response: undefined, isLoading: false, error: undefined }),
    remove: () => Promise.resolve(),
    upsert: () => Promise.resolve() as unknown as Promise<Record>,
  };
}
