// jingshin-leave-public/src/App.tsx
import React, { useState } from 'react';
import LeaveForm from './components/LeaveForm';
import LanguageSelection from './components/LanguageSelection';
import { Language } from './locales';

function App() {
  const [lang, setLang] = useState<Language | null>(null);

  return (
    <>
      {!lang ? (
        <LanguageSelection onSelect={setLang} />
      ) : (
        <LeaveForm lang={lang} onBack={() => setLang(null)} />
      )}
    </>
  );
}

export default App;
