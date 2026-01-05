import "./App.css";
import { Analytics } from "@vercel/analytics/react";
import HiraganaQuiz from "./components/HiraganaQuiz";

function App() {
  return (
    <>
      <div>
        <h1 className="text-3xl">Kanamuna</h1>
        <HiraganaQuiz />
      </div>
      <Analytics />
    </>
  );
}

export default App;
