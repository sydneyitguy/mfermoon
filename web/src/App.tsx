import { useState } from "react";
import moonferImage from "/moonfer.png";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={moonferImage} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>
        One small <span className="highlight">burn</span> for moonfer
        <br />
        One giant
        <span className="highlight"> leap</span> for mfer-kind
      </h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>Burned records:</p>
      </div>
    </>
  );
}

export default App;
