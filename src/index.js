/*
  Copyright (c) 2022 Luke Bemish.
  Licensed under the MIT License (MIT), see
  https://github.com/lukebemish/modsdotgroovy-converter
*/

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import ThemeSelector from './ThemeSelector';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ThemeSelector>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ThemeSelector>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
