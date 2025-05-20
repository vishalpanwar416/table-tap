import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import 'react-alice-carousel/lib/alice-carousel.css';
<<<<<<< HEAD

import reportWebVitals from './reportWebVitals';
=======
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react"
>>>>>>> 9c8bca8baaeafffc07b4d6e70921de234e163488

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
<<<<<<< HEAD
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
=======
      <BrowserRouter>
        <App />
      </BrowserRouter>
  </React.StrictMode>
);
>>>>>>> 9c8bca8baaeafffc07b4d6e70921de234e163488
