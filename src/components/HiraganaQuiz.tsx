import { useState, useEffect, useRef, type KeyboardEvent } from "react";

interface Hiragana {
  char: string;
  romaji: string;
}

interface QueueItem {
  hiraganaIndex: number;
  id: number;
}

interface CharacterStats {
  successCount: number;
  failCount: number;
  streak: number;
}

type StatsMap = Record<string, CharacterStats>;

const hiraganaList: Hiragana[] = [
  { char: "あ", romaji: "a" },
  { char: "い", romaji: "i" },
  { char: "う", romaji: "u" },
  { char: "え", romaji: "e" },
  { char: "お", romaji: "o" },
  { char: "か", romaji: "ka" },
  { char: "き", romaji: "ki" },
  { char: "く", romaji: "ku" },
  { char: "け", romaji: "ke" },
  { char: "こ", romaji: "ko" },
  { char: "さ", romaji: "sa" },
  { char: "し", romaji: "shi" },
  { char: "す", romaji: "su" },
  { char: "せ", romaji: "se" },
  { char: "そ", romaji: "so" },
  { char: "た", romaji: "ta" },
  { char: "ち", romaji: "chi" },
  { char: "つ", romaji: "tsu" },
  { char: "て", romaji: "te" },
  { char: "と", romaji: "to" },
  { char: "な", romaji: "na" },
  { char: "に", romaji: "ni" },
  { char: "ぬ", romaji: "nu" },
  { char: "ね", romaji: "ne" },
  { char: "の", romaji: "no" },
  { char: "は", romaji: "ha" },
  { char: "ひ", romaji: "hi" },
  { char: "ふ", romaji: "fu" },
  { char: "へ", romaji: "he" },
  { char: "ほ", romaji: "ho" },
  { char: "ま", romaji: "ma" },
  { char: "み", romaji: "mi" },
  { char: "む", romaji: "mu" },
  { char: "め", romaji: "me" },
  { char: "も", romaji: "mo" },
  { char: "や", romaji: "ya" },
  { char: "ゆ", romaji: "yu" },
  { char: "よ", romaji: "yo" },
  { char: "ら", romaji: "ra" },
  { char: "り", romaji: "ri" },
  { char: "る", romaji: "ru" },
  { char: "れ", romaji: "re" },
  { char: "ろ", romaji: "ro" },
  { char: "わ", romaji: "wa" },
  { char: "を", romaji: "wo" },
  { char: "ん", romaji: "n" },
];

// Local Storage functions
const STORAGE_KEY = "hiragana-quiz-stats";
const POOL_STORAGE_KEY = "hiragana-quiz-pool";

const loadStats = (): StatsMap => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load stats from localStorage:", error);
  }
  return {};
};

const saveStats = (stats: StatsMap): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error("Failed to save stats to localStorage:", error);
  }
};

const updateCharacterStats = (
  stats: StatsMap,
  char: string,
  isCorrect: boolean
): StatsMap => {
  const currentStats = stats[char] || {
    successCount: 0,
    failCount: 0,
    streak: 0,
  };

  if (isCorrect) {
    return {
      ...stats,
      [char]: {
        successCount: currentStats.successCount + 1,
        failCount: currentStats.failCount,
        streak: currentStats.streak + 1,
      },
    };
  } else {
    return {
      ...stats,
      [char]: {
        successCount: currentStats.successCount,
        failCount: currentStats.failCount + 1,
        streak: 0, // Reset streak on failure
      },
    };
  }
};

const calculateAverageStreak = (stats: StatsMap): number => {
  const entries = Object.values(stats);
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, stat) => sum + stat.streak, 0);
  return total / entries.length;
};

const calculateMedianStreak = (stats: StatsMap, pool: number[]): number => {
  // Only calculate median for characters in the pool
  const poolChars = pool.map((index) => hiraganaList[index].char);
  const streaks = poolChars
    .map((char) => stats[char]?.streak ?? 0)
    .sort((a, b) => a - b);

  if (streaks.length === 0) return 0;

  const mid = Math.floor(streaks.length / 2);
  if (streaks.length % 2 === 0) {
    return (streaks[mid - 1] + streaks[mid]) / 2;
  } else {
    return streaks[mid];
  }
};

const getStreakLeaderboard = (
  stats: StatsMap
): Array<{ char: string; streak: number }> => {
  return Object.entries(stats)
    .map(([char, stat]) => ({ char, streak: stat.streak }))
    .filter((item) => item.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5); // Top 5
};

// Character pool functions
const loadPool = (): number[] => {
  try {
    const stored = localStorage.getItem(POOL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load pool from localStorage:", error);
  }
  // Initialize with 5 random characters
  const pool: number[] = [];
  while (pool.length < 5) {
    const randomIndex = Math.floor(Math.random() * hiraganaList.length);
    if (!pool.includes(randomIndex)) {
      pool.push(randomIndex);
    }
  }
  return pool;
};

const savePool = (pool: number[]): void => {
  try {
    localStorage.setItem(POOL_STORAGE_KEY, JSON.stringify(pool));
  } catch (error) {
    console.error("Failed to save pool to localStorage:", error);
  }
};

const addNewCharacterToPool = (currentPool: number[]): number[] => {
  const availableIndices = hiraganaList
    .map((_, index) => index)
    .filter((index) => !currentPool.includes(index));

  if (availableIndices.length === 0) return currentPool;

  const randomIndex =
    availableIndices[Math.floor(Math.random() * availableIndices.length)];
  return [...currentPool, randomIndex];
};

const removeWorstCharacterFromPool = (
  currentPool: number[],
  stats: StatsMap
): number[] => {
  if (currentPool.length <= 5) return currentPool; // Don't remove if only 5 characters left

  // Find the worst character based on streak (lowest) and fail rate (highest)
  let worstIndex = currentPool[0];
  let worstScore = Infinity;

  for (const poolIndex of currentPool) {
    const char = hiraganaList[poolIndex].char;
    const charStats = stats[char];

    if (!charStats) continue;

    const { successCount, failCount, streak } = charStats;
    const totalAttempts = successCount + failCount;

    if (totalAttempts === 0) continue;

    // Lower score = worse performance (low streak, high fail rate)
    const failRate = failCount / totalAttempts;
    const score = streak - failRate * 10; // Penalize high fail rate

    if (score < worstScore) {
      worstScore = score;
      worstIndex = poolIndex;
    }
  }

  return currentPool.filter((index) => index !== worstIndex);
};

const calculateCharacterWeight = (char: string, stats: StatsMap): number => {
  const charStats = stats[char];
  if (!charStats) return 1; // New characters get base weight

  const { streak } = charStats;

  // Lower streak = higher weight (more practice needed)
  // Inverse relationship: streak of 0 gets weight of 1, higher streaks get lower weight
  // Add 1 to avoid division by zero, and invert it
  const weight = 1 / (streak + 1);
  return weight;
};

const getWeightedRandomIndex = (
  pool: number[],
  excludeIndex: number,
  stats: StatsMap
): number => {
  const availablePool = pool.filter((index) => index !== excludeIndex);
  if (availablePool.length === 0) return pool[0];

  // Calculate weights for each character
  const weights = availablePool.map((index) => {
    const char = hiraganaList[index].char;
    return calculateCharacterWeight(char, stats);
  });

  // Normalize weights
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = weights.map((w) => w / totalWeight);

  // Select based on weighted probability
  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < availablePool.length; i++) {
    cumulative += normalizedWeights[i];
    if (random <= cumulative) {
      return availablePool[i];
    }
  }

  return availablePool[availablePool.length - 1];
};

const charHeight = 144;
const visibleChars = 11;
const activePosition = 6;

let nextId = 0;

export default function HiraganaQuiz() {
  const [stats, setStats] = useState<StatsMap>(() => loadStats());
  const [pool, setPool] = useState<number[]>(() => loadPool());

  const createQueueItem = (excludeIndex: number): QueueItem => ({
    hiraganaIndex: getWeightedRandomIndex(pool, excludeIndex, stats),
    id: nextId++,
  });

  const [queue, setQueue] = useState<QueueItem[]>(() => {
    const items: QueueItem[] = [createQueueItem(-1)];
    for (let i = 1; i < visibleChars + 2; i++) {
      items.push(createQueueItem(items[i - 1].hiraganaIndex));
    }
    return items;
  });
  const [activeId, setActiveId] = useState<number>(
    () => queue[activePosition].id
  );
  const [input, setInput] = useState<string>("");
  const [status, setStatus] = useState<"correct" | "wrong" | null>(null);
  const [inputColor, setInputColor] = useState<string>("#ffffff");
  const [animate, setAnimate] = useState<boolean>(true);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [placeholderColor, setPlaceholderColor] = useState<string>("#9ca3af");
  const [_, setPreviousMedian] = useState<number>(() =>
    calculateMedianStreak(loadStats(), loadPool())
  );
  const [newCharacterNotification, setNewCharacterNotification] = useState<{
    char: string;
    romaji: string;
  } | null>(null);
  const [notificationOpacity, setNotificationOpacity] = useState<number>(0);
  const [lostCharacterNotification, setLostCharacterNotification] = useState<{
    char: string;
    romaji: string;
  } | null>(null);
  const [lostNotificationOpacity, setLostNotificationOpacity] =
    useState<number>(0);
  const [consecutiveWrongs, setConsecutiveWrongs] = useState<
    Record<string, number>
  >({});
  const [showCharacterTable, setShowCharacterTable] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeIndex = queue.findIndex((item) => item.id === activeId);
  const currentHiragana = hiraganaList[queue[activeIndex].hiraganaIndex];

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset all progress? This cannot be undone."
      )
    ) {
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(POOL_STORAGE_KEY);

      // Reset state
      const emptyStats = {};
      const newPool = loadPool(); // This will create a fresh pool with 5 random characters

      setStats(emptyStats);
      setPool(newPool);
      setPreviousMedian(0);
      setInput("");
      setStatus(null);
      setInputColor("#ffffff");
      setIsRetrying(false);
      setPlaceholderColor("#9ca3af");
      setConsecutiveWrongs({});

      // Recreate the queue
      const items: QueueItem[] = [createQueueItem(-1)];
      for (let i = 1; i < visibleChars + 2; i++) {
        items.push(createQueueItem(items[i - 1].hiraganaIndex));
      }
      setQueue(items);
      setActiveId(items[activePosition].id);

      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // If user is retrying after a wrong answer
      if (isRetrying) {
        const isCorrectRetry =
          input.toLowerCase().trim() === currentHiragana.romaji;
        if (isCorrectRetry) {
          // Correct retry - move to next character
          const nextActiveId = queue[activeIndex + 1].id;
          setActiveId(nextActiveId);
          setInput("");
          setInputColor("#ffffff");
          setStatus(null);
          setIsRetrying(false);
          setPlaceholderColor("#9ca3af");

          setTimeout(() => {
            setAnimate(false);
            setQueue((prev) => {
              const newItem = createQueueItem(
                prev[prev.length - 1].hiraganaIndex
              );
              return [...prev.slice(1), newItem];
            });
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setAnimate(true);
              });
            });
          }, 300);
        } else {
          // Still wrong - flash red (both background and placeholder) and clear input to show placeholder
          setInput("");
          setInputColor("#ef4444");
          setPlaceholderColor("#ef4444");
          setTimeout(() => {
            setInputColor("#fecaca");
            setPlaceholderColor("#9ca3af");
          }, 150);
        }
      } else if (status !== null) {
        // Already judged, pressing enter to continue
        const nextActiveId = queue[activeIndex + 1].id;
        setActiveId(nextActiveId);
        setInput("");
        setInputColor("#ffffff");
        setStatus(null);

        setTimeout(() => {
          setAnimate(false);
          setQueue((prev) => {
            const newItem = createQueueItem(
              prev[prev.length - 1].hiraganaIndex
            );
            return [...prev.slice(1), newItem];
          });
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setAnimate(true);
            });
          });
        }, 300);
      } else {
        // First attempt at answering
        const isCorrect = input.toLowerCase().trim() === currentHiragana.romaji;
        setStatus(isCorrect ? "correct" : "wrong");

        if (isCorrect) {
          // Show the correct answer in the input box
          setInput(currentHiragana.romaji);

          // Flash animation
          setInputColor("#22c55e");
          setTimeout(() => setInputColor("#bbf7d0"), 150);

          // Reset consecutive wrongs for this character
          setConsecutiveWrongs((prev) => ({
            ...prev,
            [currentHiragana.char]: 0,
          }));
        } else {
          // Wrong answer - enter retry mode
          setIsRetrying(true);
          setInput("");
          setInputColor("#fecaca");

          // Increment consecutive wrongs for this character
          const newConsecutiveWrongs = {
            ...consecutiveWrongs,
            [currentHiragana.char]:
              (consecutiveWrongs[currentHiragana.char] || 0) + 1,
          };
          setConsecutiveWrongs(newConsecutiveWrongs);

          // Check if this character should be removed (3 wrongs in a row, only if more than 5 chars)
          if (
            newConsecutiveWrongs[currentHiragana.char] >= 3 &&
            pool.length > 5
          ) {
            const charIndexToRemove = queue[activeIndex].hiraganaIndex;
            const reducedPool = pool.filter((idx) => idx !== charIndexToRemove);

            setLostCharacterNotification({
              char: currentHiragana.char,
              romaji: currentHiragana.romaji,
            });
            setLostNotificationOpacity(0);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setLostNotificationOpacity(1);
              });
            });

            setTimeout(() => {
              setLostNotificationOpacity(0);
              setTimeout(() => {
                setLostCharacterNotification(null);
              }, 300);
            }, 3000);

            setPool(reducedPool);
            savePool(reducedPool);

            // Reset consecutive wrongs for this character
            setConsecutiveWrongs((prev) => ({
              ...prev,
              [currentHiragana.char]: 0,
            }));
          }
        }

        // Update stats
        const updatedStats = updateCharacterStats(
          stats,
          currentHiragana.char,
          isCorrect
        );
        setStats(updatedStats);
        saveStats(updatedStats);

        // Calculate new median
        const newMedian = calculateMedianStreak(updatedStats, pool);

        // Check if median is below 1 - remove worst character
        if (newMedian < 1 && pool.length > 1) {
          const reducedPool = removeWorstCharacterFromPool(pool, updatedStats);

          // Find which character was removed
          const removedIndex = pool.find((idx) => !reducedPool.includes(idx));
          if (removedIndex !== undefined) {
            const removedChar = hiraganaList[removedIndex];
            setLostCharacterNotification({
              char: removedChar.char,
              romaji: removedChar.romaji,
            });
            setLostNotificationOpacity(0);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setLostNotificationOpacity(1);
              });
            });

            setTimeout(() => {
              setLostNotificationOpacity(0);
              setTimeout(() => {
                setLostCharacterNotification(null);
              }, 300);
            }, 3000);
          }

          setPool(reducedPool);
          savePool(reducedPool);
        }

        setPreviousMedian(newMedian);

        // Check if we need to add a new character to the pool
        if (isCorrect && updatedStats[currentHiragana.char].streak === 5) {
          const newPool = addNewCharacterToPool(pool);
          if (newPool.length > pool.length) {
            // Find the newly added character
            const newCharIndex = newPool.find((idx) => !pool.includes(idx));
            if (newCharIndex !== undefined) {
              const newChar = hiraganaList[newCharIndex];
              setNewCharacterNotification({
                char: newChar.char,
                romaji: newChar.romaji,
              });
              // Start with opacity 0, then fade in
              setNotificationOpacity(0);
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  setNotificationOpacity(1);
                });
              });

              // Fade out after 3 seconds
              setTimeout(() => {
                setNotificationOpacity(0);
                setTimeout(() => {
                  setNewCharacterNotification(null);
                }, 300); // Wait for fade out animation
              }, 3000);
            }

            setPool(newPool);
            savePool(newPool);
          }
        }
      }
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getPositionFromActive = (index: number): number => {
    return index - activeIndex;
  };

  const getOpacity = (posFromActive: number): number => {
    const distance = Math.abs(posFromActive);
    if (distance === 0) return 1;
    if (distance === 1) return 0.85;
    if (distance === 2) return 0.6;
    if (distance === 3) return 0.4;
    return 0.2;
  };

  const translateY = -activeIndex * charHeight + activePosition * charHeight;
  const averageStreak = calculateAverageStreak(stats);
  const medianStreak = calculateMedianStreak(stats, pool);
  const totalStreaks = Object.values(stats).reduce(
    (sum, stat) => sum + stat.streak,
    0
  );
  const leaderboard = getStreakLeaderboard(stats);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {/* New character notification - banner at top */}
      {newCharacterNotification && (
        <div
          style={{
            position: "fixed",
            top: "15%",
            left: "0",
            right: "0",
            opacity: notificationOpacity,
            transition: "opacity 300ms ease-in-out",
            zIndex: 9999,
          }}
          className="text-center"
        >
          <div className="bg-white border-b-2 border-t-2 border-gray-300 py-4 px-6 shadow-md">
            <div className="flex items-center justify-center gap-4">
              <div className="text-5xl">{newCharacterNotification.char}</div>
              <div className="text-green-600 font-semibold text-lg">
                New Character "{newCharacterNotification.romaji}"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lost character notification - banner at top */}
      {lostCharacterNotification && (
        <div
          style={{
            position: "fixed",
            top: "15%",
            left: "0",
            right: "0",
            opacity: lostNotificationOpacity,
            transition: "opacity 300ms ease-in-out",
            zIndex: 9999,
          }}
          className="text-center"
        >
          <div className="bg-white border-b-2 border-t-2 border-gray-300 py-4 px-6 shadow-md">
            <div className="flex items-center justify-center gap-4">
              <div className="text-5xl">{lostCharacterNotification.char}</div>
              <div className="text-red-600 font-semibold text-lg">
                Character Lost "{lostCharacterNotification.romaji}"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unlocked characters counter at top right */}
      <button
        onClick={() => setShowCharacterTable(true)}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
        }}
        className="text-gray-600 text-sm hover:text-gray-900 cursor-pointer transition-colors"
      >
        <span className="font-semibold">{pool.length}</span> /{" "}
        {hiraganaList.length} unlocked
      </button>

      {/* Reset button at bottom left */}
      <button
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleReset();
        }}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "20px",
          touchAction: "manipulation",
          zIndex: 1000,
        }}
        className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer"
      >
        Reset Progress
      </button>

      {/* Unified view: Input on left, characters on right */}
      <div
        className="flex items-center justify-center gap-8 ml-4"
        style={{
          position: "fixed",
          top: "20vh",
          left: 0,
          right: 0,
          touchAction: "none",
          transform: "translateY(-50%)",
        }}
      >
        {/* Input box on the left */}
        <div
          className="flex flex-col items-center justify-center"
          style={{ position: "relative" }}
        >
          {/* Leaderboard display above input - positioned absolutely so it doesn't move the input */}
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              marginBottom: "16px",
            }}
            className="text-center"
          >
            {leaderboard.length > 0 && (
              <div className="text-left">
                <div className="text-gray-500 text-xs mb-2 text-center">
                  Longest Streaks
                </div>
                <div className="space-y-1">
                  {leaderboard.map((item, index) => (
                    <div
                      key={item.char}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-gray-400 w-4">{index + 1}.</span>
                      <span className="text-xl">{item.char}</span>
                      <span className="text-gray-600 font-semibold">
                        {item.streak}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toLowerCase())}
            onKeyDown={handleKeyDown}
            readOnly
            onFocus={(e) => {
              e.target.removeAttribute("readonly");
            }}
            placeholder={isRetrying ? currentHiragana.romaji : ""}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            style={{
              backgroundColor: inputColor,
              transition: "background-color 200ms ease-out",
              fontSize: "32px",
              marginTop: "320px",
              width: "148px",
              // @ts-ignore - CSS custom property for placeholder color
              "--placeholder-color": placeholderColor,
            }}
            className="border border-gray-400 p-2 text-center outline-none placeholder:text-(--placeholder-color) placeholder:transition-colors placeholder:duration-200"
          />
          <div className="text-gray-400 text-sm mt-2">press enter</div>

          {/* Average streak display below input - positioned absolutely so it doesn't move the input */}
          <div
            style={{ position: "absolute", top: "100%", marginTop: "32px" }}
            className="text-center"
          >
            <div className="text-gray-600 text-sm">
              Average Streak:{" "}
              <span className="font-semibold">{averageStreak.toFixed(1)}</span>
            </div>
            <div className="text-gray-600 text-sm mt-1">
              Median Streak:{" "}
              <span className="font-semibold">{medianStreak.toFixed(1)}</span>
            </div>
            <div className="text-gray-600 text-sm mt-1">
              Total Streaks:{" "}
              <span className="font-semibold">{totalStreaks}</span>
            </div>
          </div>
        </div>

        {/* Character on the right */}
        <div
          style={{
            width: "200px",
            height: charHeight * visibleChars,
            position: "relative",
          }}
        >
          <div
            style={{
              transform: `translateY(${translateY}px)`,
              transition: animate ? "transform 300ms ease-out" : "none",
              overflow: "hidden",
              height: charHeight * visibleChars,
            }}
          >
            {queue.map((item) => {
              const actualIndex = queue.indexOf(item);
              const posFromActive = getPositionFromActive(actualIndex);
              const isActive = item.id === activeId;
              const opacity = getOpacity(posFromActive);

              return (
                <div
                  key={item.id}
                  style={{
                    height: charHeight,
                    opacity,
                    transition: "opacity 300ms ease-out",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    className="text-9xl leading-none"
                    style={{
                      color: isActive ? "#000000" : "#d1d5db",
                      transition: "color 300ms ease-out",
                    }}
                  >
                    {hiraganaList[item.hiraganaIndex].char}
                  </span>
                </div>
              );
            })}{" "}
          </div>
        </div>
      </div>

      {/* Character table modal */}
      {showCharacterTable && (
        <div
          onClick={() => setShowCharacterTable(false)}
          className="fixed top-0 left-0 right-0 bottom-0 z-10000 flex items-center justify-center p-0 md:p-5"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white overflow-auto shadow-2xl w-full h-full md:max-w-200 md:max-h-[80vh] md:rounded-lg p-4 md:p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Hiragana table
              </h2>
              <button
                onClick={() => setShowCharacterTable(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {hiraganaList.map((hiragana, index) => {
                const isUnlocked = pool.includes(index);
                const charStats = stats[hiragana.char];
                const streak = charStats?.streak ?? 0;

                // Calculate color intensity based on streak (0-10 scale)
                const greenIntensity = Math.min(streak / 10, 1);
                const streakColor =
                  greenIntensity === 0
                    ? "rgb(0, 0, 0)"
                    : `rgb(${Math.round(
                        34 * (1 - greenIntensity)
                      )}, ${Math.round(
                        197 * greenIntensity + 0 * (1 - greenIntensity)
                      )}, ${Math.round(94 * greenIntensity)})`;
                const hasBorder = streak >= 10;

                return (
                  <div
                    key={index}
                    className={`border rounded p-3 text-center ${
                      isUnlocked ? "bg-white" : "border-gray-200 bg-gray-100"
                    }`}
                    style={{
                      opacity: isUnlocked ? 1 : 0.4,
                      borderColor:
                        isUnlocked && hasBorder ? streakColor : "#d1d5db",
                      borderWidth: isUnlocked && hasBorder ? "2px" : "1px",
                    }}
                  >
                    <div
                      className={`text-4xl mb-1 ${
                        isUnlocked ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {hiragana.char}
                    </div>
                    <div
                      className={`text-xs ${
                        isUnlocked ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      {hiragana.romaji}
                    </div>
                    {isUnlocked && (
                      <div className="mt-1 flex justify-center">
                        <div
                          className="text-xs font-semibold rounded px-2 py-0.5"
                          style={{
                            color: streakColor,
                          }}
                        >
                          Streak: {streak}
                        </div>
                      </div>
                    )}
                    {!isUnlocked && (
                      <div className="text-xs text-gray-400 mt-1 text-center">
                        Locked
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
