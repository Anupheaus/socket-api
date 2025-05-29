export const actionPrefix = 'socket-api.actions';
export const eventPrefix = 'socket-api.events';
export const subscriptionPrefix = 'socket-api.subscriptions';

export type SocketAPISubscriptionRequest<Request = unknown> = {
  request: Request;
  action: 'subscribe';
  subscriptionId: string;
} | {
  action: 'unsubscribe';
  subscriptionId: string;
};

export interface SocketAPISubscriptionResponse<Response = unknown> {
  subscriptionId: string;
  response: Response | undefined;
}
