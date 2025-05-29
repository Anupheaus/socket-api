/* eslint-disable max-classes-per-file */
import type { Logger } from '@anupheaus/common';
import { is } from '@anupheaus/common';
import type { Packet } from 'socket.io-parser';
import { Decoder, Encoder } from 'socket.io-parser';
import { deconstruct } from './deconstruct';
import { reconstruct } from './reconstruct';

export interface SocketIOParserProps {
  logger: Logger;
}

// const reportingHistory = new Map<number, Set<AnyObject>>();

// const reportToConsole = (packet: any, direction: 'send' | 'receive') => {
//   if (!is.browser()) return;
//   const socketApiDebug = (window.localStorage.getItem('socket-api-debug') ?? 'false').toLowerCase();
//   const isReporting = ['true', '1'].includes(socketApiDebug);
//   window.localStorage.setItem('socket-api-debug', isReporting.toString());
//   if (!isReporting) return;
//   const history = reportingHistory.getOrSet(packet.id, () => new Set<AnyObject>());
//   if (direction === 'send') {
//     history.add(packet);
//     // console.log('[Socket-API] 🔺', packet);
//   } else {
//     history.add(packet);
//     console.log('[Socket-API] 🔻', history.toArray().reverse());
//   }
// };

export class SocketIOParser {
  constructor(props: SocketIOParserProps) {
    const { logger } = props;

    this.Encoder = class CustomEncoder extends Encoder {
      encode(packet: Packet): any[] {
        try {
          if (packet.type === 2 && is.array(packet.data)) {
            if (packet.data[1] instanceof ArrayBuffer || (is.browser() && packet.data[1] instanceof File) || (is.node() && packet.data[1] instanceof Buffer)) {
              // do nothing
            } else {
              packet.data[1] = deconstruct(packet.data[1]);
            }
          } else if (packet.type === 3 && is.array(packet.data)) {
            packet.data = deconstruct(packet.data);
          }
        } catch (error) {
          logger.error('Error occurred while deconstructing', { error });
        }
        // reportToConsole(packet, 'send');
        return super.encode(packet);
      }
    };

    this.Decoder = class CustomDecoder extends Decoder {
      on(event: 'decoded', callback: (packet: any) => void) {
        return super.on(event, packet => {
          try {
            if (packet.type === 2 && is.array(packet.data)) {
              if (packet.data[1] instanceof ArrayBuffer || (is.browser() && packet.data[1] instanceof File) || (is.node() && packet.data[1] instanceof Buffer)) {
                // do nothing
              } else {
                packet.data[1] = reconstruct(packet.data[1]);
              }
            } else if (packet.type === 3 && is.array(packet.data)) {
              packet.data = [reconstruct(packet.data[0])];
            }
          } catch (error) {
            logger.error('Error occurred while reconstructing', { error });
          }
          // reportToConsole(packet, 'receive');
          callback(packet);
        });
      }
    };
  }

  public Encoder: typeof Encoder;
  public Decoder: typeof Decoder;
}
