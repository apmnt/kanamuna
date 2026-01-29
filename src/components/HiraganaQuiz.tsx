import { useState, useEffect, useRef, type KeyboardEvent } from "react";

interface KanaCharacter {
  char: string;
  romaji: string;
}

type KanaMode = "hiragana" | "katakana";

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

const kanaSets: Record<KanaMode, KanaCharacter[]> = {
  hiragana: [
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
  ],
  katakana: [
    { char: "ア", romaji: "a" },
    { char: "イ", romaji: "i" },
    { char: "ウ", romaji: "u" },
    { char: "エ", romaji: "e" },
    { char: "オ", romaji: "o" },
    { char: "カ", romaji: "ka" },
    { char: "キ", romaji: "ki" },
    { char: "ク", romaji: "ku" },
    { char: "ケ", romaji: "ke" },
    { char: "コ", romaji: "ko" },
    { char: "サ", romaji: "sa" },
    { char: "シ", romaji: "shi" },
    { char: "ス", romaji: "su" },
    { char: "セ", romaji: "se" },
    { char: "ソ", romaji: "so" },
    { char: "タ", romaji: "ta" },
    { char: "チ", romaji: "chi" },
    { char: "ツ", romaji: "tsu" },
    { char: "テ", romaji: "te" },
    { char: "ト", romaji: "to" },
    { char: "ナ", romaji: "na" },
    { char: "ニ", romaji: "ni" },
    { char: "ヌ", romaji: "nu" },
    { char: "ネ", romaji: "ne" },
    { char: "ノ", romaji: "no" },
    { char: "ハ", romaji: "ha" },
    { char: "ヒ", romaji: "hi" },
    { char: "フ", romaji: "fu" },
    { char: "ヘ", romaji: "he" },
    { char: "ホ", romaji: "ho" },
    { char: "マ", romaji: "ma" },
    { char: "ミ", romaji: "mi" },
    { char: "ム", romaji: "mu" },
    { char: "メ", romaji: "me" },
    { char: "モ", romaji: "mo" },
    { char: "ヤ", romaji: "ya" },
    { char: "ユ", romaji: "yu" },
    { char: "ヨ", romaji: "yo" },
    { char: "ラ", romaji: "ra" },
    { char: "リ", romaji: "ri" },
    { char: "ル", romaji: "ru" },
    { char: "レ", romaji: "re" },
    { char: "ロ", romaji: "ro" },
    { char: "ワ", romaji: "wa" },
    { char: "ヲ", romaji: "wo" },
    { char: "ン", romaji: "n" },
  ],
};

const getStatsStorageKey = (mode: KanaMode): string =>
  `${mode}-quiz-stats`;
const getPoolStorageKey = (mode: KanaMode): string => `${mode}-quiz-pool`;
const vowelOrder = ["a", "e", "i", "o", "u"];

const getUnlockOrder = (kanaList: KanaCharacter[]): number[] => {
  const consonantOrder: string[] = [];
  const parsed = kanaList.map((kana, index) => {
    const vowelMatch = kana.romaji.match(/[aeiou]$/);
    const vowel = vowelMatch ? vowelMatch[0] : null;
    const consonant = vowel ? kana.romaji.slice(0, -1) : kana.romaji;
    if (!consonantOrder.includes(consonant)) {
      consonantOrder.push(consonant);
    }
    return { index, consonant, vowel };
  });

  return parsed
    .sort((a, b) => {
      const consonantDiff =
        consonantOrder.indexOf(a.consonant) -
        consonantOrder.indexOf(b.consonant);
      if (consonantDiff !== 0) return consonantDiff;
      if (a.vowel === b.vowel) return 0;
      if (a.vowel === null) return 1;
      if (b.vowel === null) return -1;
      return vowelOrder.indexOf(a.vowel) - vowelOrder.indexOf(b.vowel);
    })
    .map((item) => item.index);
};

const loadStats = (storageKey: string): StatsMap => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load stats from localStorage:", error);
  }
  return {};
};

const saveStats = (storageKey: string, stats: StatsMap): void => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(stats));
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
  }
  return {
    ...stats,
    [char]: {
      successCount: currentStats.successCount,
      failCount: currentStats.failCount + 1,
      streak: 0, // Reset streak on failure
    },
  };
};

const calculateAverageStreak = (stats: StatsMap): number => {
  const entries = Object.values(stats);
  if (entries.length === 0) return 0;
  const total = entries.reduce((sum, stat) => sum + stat.streak, 0);
  return total / entries.length;
};

const calculateMedianStreak = (
  stats: StatsMap,
  pool: number[],
  kanaList: KanaCharacter[]
): number => {
  // Only calculate median for characters in the pool
  const poolChars = pool.map((index) => kanaList[index].char);
  const streaks = poolChars
    .map((char) => stats[char]?.streak ?? 0)
    .sort((a, b) => a - b);

  if (streaks.length === 0) return 0;

  const mid = Math.floor(streaks.length / 2);
  if (streaks.length % 2 === 0) {
    return (streaks[mid - 1] + streaks[mid]) / 2;
  }
  return streaks[mid];
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

const loadPool = (storageKey: string, kanaList: KanaCharacter[]): number[] => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load pool from localStorage:", error);
  }
  // Initialize with the first 5 characters in the unlock order
  return getUnlockOrder(kanaList).slice(0, 5);
};

const savePool = (storageKey: string, pool: number[]): void => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(pool));
  } catch (error) {
    console.error("Failed to save pool to localStorage:", error);
  }
};

const addNewCharacterToPool = (
  currentPool: number[],
  kanaList: KanaCharacter[]
): number[] => {
  const unlockOrder = getUnlockOrder(kanaList);
  const nextIndex = unlockOrder.find((index) => !currentPool.includes(index));

  if (nextIndex === undefined) return currentPool;

  return [...currentPool, nextIndex];
};

const removeWorstCharacterFromPool = (
  currentPool: number[],
  stats: StatsMap,
  kanaList: KanaCharacter[]
): number[] => {
  if (currentPool.length <= 5) return currentPool; // Don't remove if only 5 characters left

  // Find the worst character based on streak (lowest) and fail rate (highest)
  let worstIndex = currentPool[0];
  let worstScore = Infinity;

  for (const poolIndex of currentPool) {
    const char = kanaList[poolIndex].char;
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
  stats: StatsMap,
  kanaList: KanaCharacter[]
): number => {
  const availablePool = pool.filter((index) => index !== excludeIndex);
  if (availablePool.length === 0) return pool[0];

  // Calculate weights for each character
  const weights = availablePool.map((index) => {
    const char = kanaList[index].char;
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

export default function HiraganaQuiz({ mode }: { mode: KanaMode }) {
  const kanaList = kanaSets[mode];
  const statsStorageKey = getStatsStorageKey(mode);
  const poolStorageKey = getPoolStorageKey(mode);

  const [stats, setStats] = useState<StatsMap>(() =>
    loadStats(statsStorageKey)
  );
  const [pool, setPool] = useState<number[]>(() =>
    loadPool(poolStorageKey, kanaList)
  );

  const createQueueItem = (excludeIndex: number): QueueItem => ({
    hiraganaIndex: getWeightedRandomIndex(
      pool,
      excludeIndex,
      stats,
      kanaList
    ),
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
  const [autoCheckEnabled, setAutoCheckEnabled] = useState<boolean>(false);
  const [placeholderColor, setPlaceholderColor] = useState<string>("#9ca3af");
  const [_, setPreviousMedian] = useState<number>(() =>
    calculateMedianStreak(
      loadStats(statsStorageKey),
      loadPool(poolStorageKey, kanaList),
      kanaList
    )
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
  const pendingInputRef = useRef<string>("");
  const isTransitioningRef = useRef<boolean>(false);

  const activeIndex = queue.findIndex((item) => item.id === activeId);
  const currentKana = kanaList[queue[activeIndex].hiraganaIndex];

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset all progress? This cannot be undone."
      )
    ) {
      // Clear localStorage
      localStorage.removeItem(statsStorageKey);
      localStorage.removeItem(poolStorageKey);

      // Reset state
      const emptyStats = {};
      const newPool = loadPool(poolStorageKey, kanaList); // This will create a fresh pool with 5 random characters

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (isTransitioningRef.current) {
      // Buffer input during transition
      pendingInputRef.current = value;
    } else {
      setInput(value);
    }
  };

  const handleFirstAttempt = (isCorrect: boolean) => {
    setStatus(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      // Show the correct answer in the input box
      setInput(currentKana.romaji);

      // Flash animation
      setInputColor("#22c55e");
      setTimeout(() => setInputColor("#bbf7d0"), 150);

      // Reset consecutive wrongs for this character
      setConsecutiveWrongs((prev) => ({
        ...prev,
        [currentKana.char]: 0,
      }));

      // Auto-advance on correct answer after a brief delay
      setTimeout(() => {
        advanceToNextCharacter();
      }, 400); // Small delay to show the green flash
    } else {
      // Wrong answer - enter retry mode
      setIsRetrying(true);
      setInput("");
      setInputColor("#fecaca");

      // Increment consecutive wrongs for this character
      const newConsecutiveWrongs = {
        ...consecutiveWrongs,
        [currentKana.char]: (consecutiveWrongs[currentKana.char] || 0) + 1,
      };
      setConsecutiveWrongs(newConsecutiveWrongs);

      // Check if this character should be removed (3 wrongs in a row, only if more than 5 chars)
      if (newConsecutiveWrongs[currentKana.char] >= 3 && pool.length > 5) {
        const charIndexToRemove = queue[activeIndex].hiraganaIndex;
        const reducedPool = pool.filter((idx) => idx !== charIndexToRemove);

        setLostCharacterNotification({
          char: currentKana.char,
          romaji: currentKana.romaji,
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
        savePool(poolStorageKey, reducedPool);

        // Reset consecutive wrongs for this character
        setConsecutiveWrongs((prev) => ({
          ...prev,
          [currentKana.char]: 0,
        }));
      }
    }

    // Update stats
    const updatedStats = updateCharacterStats(
      stats,
      currentKana.char,
      isCorrect
    );
    setStats(updatedStats);
    saveStats(statsStorageKey, updatedStats);

    // Calculate new median
    const newMedian = calculateMedianStreak(updatedStats, pool, kanaList);

    // Check if median is below 1 - remove worst character
    if (newMedian < 1 && pool.length > 1) {
      const reducedPool = removeWorstCharacterFromPool(
        pool,
        updatedStats,
        kanaList
      );

      // Find which character was removed
      const removedIndex = pool.find((idx) => !reducedPool.includes(idx));
      if (removedIndex !== undefined) {
        const removedChar = kanaList[removedIndex];
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
      savePool(poolStorageKey, reducedPool);
    }

    setPreviousMedian(newMedian);

    // Check if we need to add a new character to the pool
    if (isCorrect && updatedStats[currentKana.char].streak === 5) {
      const newPool = addNewCharacterToPool(pool, kanaList);
      if (newPool.length > pool.length) {
        // Find the newly added character
        const newCharIndex = newPool.find((idx) => !pool.includes(idx));
        if (newCharIndex !== undefined) {
          const newChar = kanaList[newCharIndex];
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
        savePool(poolStorageKey, newPool);
      }
    }
  };

  const advanceToNextCharacter = (onComplete?: () => void) => {
    isTransitioningRef.current = true;
    const currentActiveIndex = queue.findIndex((item) => item.id === activeId);
    const nextActiveId = queue[currentActiveIndex + 1].id;

    setActiveId(nextActiveId);
    setInput("");
    setInputColor("#ffffff");
    setStatus(null);
    setIsRetrying(false);
    setPlaceholderColor("#9ca3af");

    // Apply any pending input immediately
    requestAnimationFrame(() => {
      if (pendingInputRef.current) {
        setInput(pendingInputRef.current);
        pendingInputRef.current = "";
      }
      isTransitioningRef.current = false;
      onComplete?.();
    });

    setTimeout(() => {
      setAnimate(false);
      setQueue((prev) => {
        const newItem = createQueueItem(prev[prev.length - 1].hiraganaIndex);
        return [...prev.slice(1), newItem];
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      });
    }, 300);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      if (e.key === " ") {
        e.preventDefault(); // Prevent space from being typed
      }

      // If user is retrying after a wrong answer
      if (isRetrying) {
        const isCorrectRetry = input.toLowerCase().trim() === currentKana.romaji;
        if (isCorrectRetry) {
          // Correct retry - move to next character
          advanceToNextCharacter();
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
        // Already judged, pressing enter/space to continue
        advanceToNextCharacter();
      } else {
        // First attempt at answering
        const isCorrect = input.toLowerCase().trim() === currentKana.romaji;
        handleFirstAttempt(isCorrect);
      }
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!autoCheckEnabled || isTransitioningRef.current) return;
    const normalizedInput = input.toLowerCase().trim();
    if (normalizedInput !== currentKana.romaji) return;

    if (isRetrying) {
      advanceToNextCharacter();
      return;
    }

    if (status === null) {
      handleFirstAttempt(true);
    }
  }, [
    autoCheckEnabled,
    currentKana.romaji,
    input,
    isRetrying,
    status,
    queue,
    activeId,
  ]);

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
  const medianStreak = calculateMedianStreak(stats, pool, kanaList);
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
          top: "76px",
          right: "20px",
          zIndex: 1000,
        }}
        className="text-gray-600 text-sm hover:text-gray-900 cursor-pointer transition-colors"
      >
        <span className="font-semibold">{pool.length}</span> / {kanaList.length} unlocked
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
            onChange={(e) => {
              e.target.value = e.target.value.toLowerCase();
              handleInputChange(e);
            }}
            onKeyDown={handleKeyDown}
            readOnly
            onFocus={(e) => {
              e.target.removeAttribute("readonly");
            }}
            placeholder={isRetrying ? currentKana.romaji : ""}
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
          <div className="text-gray-400 text-sm mt-2">press enter or space</div>
          <label className="flex items-center gap-2 text-xs text-gray-500 mt-3">
            <input
              type="checkbox"
              checked={autoCheckEnabled}
              onChange={(e) => setAutoCheckEnabled(e.target.checked)}
              className="accent-gray-800"
            />
            Auto-check correct answers
          </label>

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
              Total Streaks: <span className="font-semibold">{totalStreaks}</span>
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
                    {kanaList[item.hiraganaIndex].char}
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
                {mode === "hiragana" ? "Hiragana table" : "Katakana table"}
              </h2>
              <button
                onClick={() => setShowCharacterTable(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {kanaList.map((kana, index) => {
                const isUnlocked = pool.includes(index);
                const charStats = stats[kana.char];
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
                      {kana.char}
                    </div>
                    <div
                      className={`text-xs ${
                        isUnlocked ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      {kana.romaji}
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
