import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "./AIIntroGenerator.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const makeEntryId = () =>
  (globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.floor(Math.random() * 10000)}`);

function AIIntroGenerator({ dish }) {
  const { t } = useTranslation("ai_generator");
  const [context, setContext] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [copiedKey, setCopiedKey] = useState(null);

  const dishTitle =
    dish?.name_japanese || dish?.name_vietnamese || dish?.name_romaji || "";

  const toneConfig = useMemo(
    () => [
      {
        id: "formal",
        keywords: ["フォーマル", "formal", "thuyết trình", "ビジネス"],
      },
      {
        id: "casual",
        keywords: ["casual", "カジュアル", "bạn bè", "友達", "friend"],
      },
      {
        id: "homestay",
        keywords: ["home", "ホームステイ", "gia đình", "family"],
      },
      {
        id: "presentation",
        keywords: ["発表", "練習", "school", "học", "luyện nói"],
      },
    ],
    []
  );

  const deriveToneMeta = (text) => {
    const value = (text || "").toLowerCase();
    const matched = toneConfig.find((config) =>
      config.keywords.some((keyword) =>
        value.includes(keyword.toLowerCase())
      )
    );
    const toneKey = matched?.id ?? "default";
    if (toneKey === "default") {
      return null;
    }
    const chips = t(`tone.${toneKey}.chips`, { returnObjects: true }) || [];
    return {
      primary: t(`tone.${toneKey}.primary`),
      chips,
    };
  };

  const handleGenerate = async () => {
    if (!dish?.id) {
      setError(t("errors.dishMissing"));
      return;
    }
    if (!context.trim()) {
      setError(t("errors.contextMissing"));
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError(t("errors.needLogin"));
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/templates/generate-introduction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            dishId: Number(dish.id),
            context: context.trim(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(t("errors.generic"));
      }

      const data = await response.json();
      const nextEntry = {
        id: makeEntryId(),
        created_at: new Date().toISOString(),
        context: context.trim(),
        ...data,
      };

      setResults((prev) => [nextEntry, ...prev].slice(0, 6));
    } catch (err) {
      setError(err.message ?? t("errors.generic"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (value, key) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 800);
    } catch (err) {
      console.error("Clipboard error", err);
    }
  };

  const flattenedResults = useMemo(
    () =>
      results.flatMap((entry) =>
        [
          { ...entry, lang: "ja", text: entry.generated_text_ja },
          { ...entry, lang: "vi", text: entry.generated_text_vi },
        ].filter((item) => !!item.text?.trim())
      ),
    [results]
  );

  return (
    <div className="ai-generator-card">
      <header className="ai-generator-header">
        <div>
          <p className="ai-generator-eyebrow">{t("eyebrow")}</p>
          <h2>{dishTitle || t("defaultDishTitle")}</h2>
        </div>
        <p className="ai-generator-subtitle">{t("subtitle")}</p>
      </header>

      <section className="ai-generator-section">
        <label className="ai-label">
          {t("contextLabel")}
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t("contextPlaceholder")}
            rows={4}
          />
        </label>
        {error && <p className="ai-error">{error}</p>}
        <button
          type="button"
          className="ai-generate-btn"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? t("generating") : t("generateButton")}
        </button>
      </section>

      {results.length > 0 && (
        <section className="ai-results">
          <div className="ai-results-header">
            <h3>{t("resultsHeader")}</h3>
            <span>{t("resultCount", { count: flattenedResults.length })}</span>
          </div>
          <div className="ai-results-list">
            {flattenedResults.map((entry) => (
              <article
                key={`${entry.id}-${entry.lang}`}
                className="ai-result-card"
              >
                {(() => {
                  const toneMeta = deriveToneMeta(entry.context);
                  return (
                    <>
                      <div className="ai-result-top">
                        <p className="ai-result-title">
            
                        </p>
                        {toneMeta && (
                          <div className="ai-result-tags">
                            <span className="tone-chip tone-chip-primary">
                              {toneMeta.primary}
                            </span>
                            {toneMeta.chips?.map((chip) => (
                              <span key={chip} className="tone-chip">
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="ai-result-content">
                        <span className="ai-result-lang-pill">
                          {entry.lang === "ja"
                            ? t("language.ja")
                            : t("language.vi")}
                        </span>
                        <p
                          className={`ai-result-text ${
                            entry.lang === "vi" ? "vi" : ""
                          }`}
                        >
                          {entry.text}
                        </p>
                      </div>
                    </>
                  );
                })()}
                {entry.lang === "ja" && entry.audio_url && (
                  <audio
                    className="ai-audio-player"
                    controls
                    src={entry.audio_url}
                  >
                    {t("audioFallback")}
                  </audio>
                )}
                <button
                  type="button"
                  className={`ai-copy-card ${
                    copiedKey === `${entry.id}-${entry.lang}` ? "copied" : ""
                  }`}
                  onClick={() =>
                    handleCopy(entry.text, `${entry.id}-${entry.lang}`)
                  }
                >
                  {entry.lang === "ja"
                    ? t("actions.copyJa")
                    : t("actions.copyVi")}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default AIIntroGenerator;
