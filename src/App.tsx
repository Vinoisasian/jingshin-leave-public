// jingshin-leave-public/src/App.tsx
import { useState } from 'react';
import LeaveForm from './components/LeaveForm';
import { Language } from './locales';

function App() {
  const [lang, setLang] = useState<Language>('zh');

  return (
    <div className="app-container">
      {/* Wave Background Layers */}
      <div className="wave-bg"></div>
      <div className="wave-bg-2"></div>
      
      {/* Main Content */}
      <div className="content-layer">
        <LeaveForm lang={lang} onBack={() => {}} setLang={setLang} />
      </div>
    </div>
  );
}

export default App;
