import Dexie, { type Table } from 'dexie';

// Define the shape of a task and a connection, reusing from stores
// In a real app, these would be in a shared 'types' file.
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inProgress' | 'done' | 'blocked';
  position: { x: number; y: number };
}

export interface Connection {
  id: string;
  from: string; // Task ID
  to: string;   // Task ID
  type: 'strong' | 'weak' | 'related';
}

export interface Settings {
    id?: number; // Primary key for settings table (singleton)
    theme: 'dark' | 'light' | 'system';
    aiConfig: {
        baseUrl: string;
        apiKey: string;
    };
}


class EntropyZeroDB extends Dexie {
  // We need to declare the tables in the database.
  // The '!' is a non-null assertion, telling TypeScript that these properties will be initialized.
  tasks!: Table<Task>;
  connections!: Table<Connection>;
  settings!: Table<Settings>;

  constructor() {
    super('entropyZero');
    this.version(1).stores({
      // The 'id' is the primary key.
      // '++id' would mean auto-incrementing primary key.
      tasks: 'id, title, status', // Primary key and indexed properties
      connections: 'id, from, to',
      settings: '++id', // Auto-incrementing, for a singleton settings object
    });
  }
}

export const db = new EntropyZeroDB();

// --- CRUD Operations for Tasks ---

export const getTasks = async () => await db.tasks.toArray();
export const addTask = async (task: Task) => await db.tasks.add(task);
export const updateTask = async (id: string, updates: Partial<Task>) => await db.tasks.update(id, updates);
export const deleteTask = async (id: string) => await db.tasks.delete(id);

// --- CRUD Operations for Connections ---

export const getConnections = async () => await db.connections.toArray();
export const addConnection = async (connection: Connection) => await db.connections.add(connection);
export const deleteConnection = async (id: string) => await db.connections.delete(id);

// --- Operations for Settings (usually a singleton) ---

export const getSettings = async () => {
    const settings = await db.settings.toCollection().first();
    return settings || { id: 1, theme: 'system', aiConfig: { baseUrl: '', apiKey: '' } }; // Default settings
};

export const saveSettings = async (settings: Settings) => {
    // Since it's a singleton, we can use a fixed ID or just put/update the first record.
    return await db.settings.put(settings, settings.id || 1);
};
