import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GroveProvider } from './context/GroveContext';
import { useGrove } from './context/useGrove';
import { Layout } from './components/Layout';
import { LoadingScreen } from './components/LoadingScreen';
import { Today } from './pages/Today';
import { Calendar } from './pages/Calendar';
import { List } from './pages/List';
import { TaskDetail } from './pages/TaskDetail';
import { Projects } from './pages/Projects';

function AppRoutes() {
  const { ready } = useGrove();
  const [showLoader, setShowLoader] = useState(true);
  const fading = ready && showLoader;

  useEffect(() => {
    if (!ready) return;
    const t = window.setTimeout(() => setShowLoader(false), 380);
    return () => window.clearTimeout(t);
  }, [ready]);

  return (
    <>
      {showLoader && <LoadingScreen fading={fading} />}
      {!showLoader && (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Today />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="list" element={<List />} />
              <Route path="projects" element={<Projects />} />
              <Route path="task/:id" element={<TaskDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
}

export default function App() {
  return (
    <GroveProvider>
      <AppRoutes />
    </GroveProvider>
  );
}
