import { useEffect, useState } from "react";
import "./App.css";
import HiraganaQuiz from "./components/HiraganaQuiz";

const LANDING_SEEN_KEY = "kanamuna-landing-seen";

function App() {
  const [showLanding, setShowLanding] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const hasSeenLanding = localStorage.getItem(LANDING_SEEN_KEY) === "true";
    if (!hasSeenLanding && isMobile) {
      setShowLanding(true);
    }
  }, [isMobile]);

  const handleStartLearning = () => {
    localStorage.setItem(LANDING_SEEN_KEY, "true");
    setShowLanding(false);
  };

  const handleShowLanding = () => {
    setShowLanding(true);
  };

  return (
    <div className="min-h-screen p-6">
      <header className="mb-8 flex items-center justify-between">
        <button
          type="button"
          onClick={handleShowLanding}
          className="text-4xl font-bold tracking-tight text-amber-900 transition hover:scale-[1.02] hover:text-amber-800"
        >
          Kanamuna
        </button>
        <p className="text-sm text-neutral-600">Click the title to revisit the intro</p>
      </header>

      <main className="mx-auto max-w-3xl">
        <HiraganaQuiz />
      </main>

      {showLanding && (
        <div
          className={`fixed z-20 flex items-center ${
            isMobile
              ? "inset-0 justify-center bg-black/50 backdrop-blur-sm px-4"
              : "inset-y-0 left-0 right-1/2 justify-center px-6"
          }`}
        >
          <div
            className={`w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl transition-shadow ${
              isMobile ? "h-full overflow-y-auto" : "pointer-events-auto"
            }`}
            style={{
              boxShadow: isMobile
                ? undefined
                : "0 24px 60px rgba(0,0,0,0.14), 0 12px 24px rgba(0,0,0,0.1)",
            }}
          >
            <div className="flex h-full flex-col gap-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Welcome to
                </p>
                <h1 className="mt-2 text-5xl font-extrabold text-amber-900">Kanamuna</h1>
                <p className="mt-4 text-lg leading-relaxed text-neutral-700">
                  Master hiragana through focused reps, growing your pool as you build
                  confidence. Track streaks, celebrate wins, and keep leveling up your
                  reading skills.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">Focused practice</p>
                  <p className="mt-2 text-sm text-amber-900">
                    Start with a small set of characters so you can respond fast and stay in
                    flow.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">Smart streaks</p>
                  <p className="mt-2 text-sm text-amber-900">
                    Keep an eye on your streaks and see which characters are ready to graduate
                    into mastery.
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">Grow as you go</p>
                  <p className="mt-2 text-sm text-amber-900">
                    Expand your pool as you succeed, adding new kana once you are comfortable
                    with the current set.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 rounded-2xl bg-neutral-900 p-6 text-center text-white">
                <p className="text-sm uppercase tracking-[0.2em] text-amber-200">Ready?</p>
                <p className="text-lg font-semibold text-amber-50">
                  Jump in and start learning. You can always return here by clicking the title.
                </p>
                <button
                  type="button"
                  onClick={handleStartLearning}
                  className="mt-2 rounded-full bg-amber-400 px-6 py-3 text-base font-semibold text-amber-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-amber-300"
                >
                  Start learning
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
