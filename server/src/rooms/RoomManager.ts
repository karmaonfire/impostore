import { RoomSettings } from '../../../shared/types.js';
import { generateRoomCode } from '../utils/id.js';
import { Room, RoomCallbacks } from './Room.js';

export class RoomManager {
  private rooms = new Map<string, Room>();

  constructor(private cb: RoomCallbacks) {}

  createRoom(settings?: Partial<RoomSettings>): Room {
    let code = generateRoomCode();
    let attempts = 0;
    while (this.rooms.has(code) && attempts < 10) {
      code = generateRoomCode();
      attempts += 1;
    }
    const room = new Room(code, settings, {
      ...this.cb,
      onEmpty: (r) => {
        this.rooms.delete(r.code);
        r.destroy();
      },
    });
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  roomCount(): number {
    return this.rooms.size;
  }
}
