import { createRoot } from 'react-dom/client';
import { useEscape } from './useEscape';

function App() {
  const { inApp, app, outsideBrowser, caps, escape } = useEscape();
  return (
    <main>
      <h1>escape + React</h1>
      {inApp ? (
        <>
          <p>
            You are inside {app}. Google sign-in here: {caps.googleSignIn ? 'works' : 'blocked'}.
          </p>
          <button onClick={() => escape({ medium: 'react-demo' })}>Open in {outsideBrowser}</button>
        </>
      ) : (
        <p>Normal browser. Open this page from a social app on a phone to see the escape button.</p>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
