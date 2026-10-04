import { createContext } from 'react';

export interface Developer {
  id?: number;
  email?: string;
  rol?: string;
  lenguage?: string;
  [key: string]: any;
}

export interface DeveloperContextType {
  getDeveloper: Developer | null;
  setDeveloper: (developer: Developer | null | any) => void;
}

const Context = createContext<DeveloperContextType>({
  getDeveloper: null,
  setDeveloper: () => {},
});

export default Context;
