import { useState } from 'react';
import { Developer } from '../contexts/Context';

const useDeveloper = () => {
  const [user, setUser] = useState<Developer | null>(null);

  const setDeveloper = (develop: Developer | null | any) => setUser(develop);

  return { getDeveloper: user, setDeveloper };
};

export default useDeveloper;
