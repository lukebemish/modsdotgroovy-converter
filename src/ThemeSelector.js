import React from 'react';

const DarkTheme = React.lazy(() => import('./DarkTheme'));
const LightTheme = React.lazy(() => import('./LightTheme'));

const ThemeSelector = ({ children }) => (
  <>
    {/* Conditionally render theme, based on the current client context */}
    <React.Suspense fallback={() => null}>
      {window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && <DarkTheme />}
      {!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) && <LightTheme />}
    </React.Suspense>
    {/* Render children immediately! */}
    {children}
  </>
);
  
export default ThemeSelector;