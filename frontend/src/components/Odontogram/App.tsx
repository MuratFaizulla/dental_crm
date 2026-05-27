import { useEffect, useRef, useState } from "react";
import { Button } from '../../components/ui';
import { destroyOdontogram, initOdontogram, setNumberingSystem, clearSelection, setOcclusalVisible, setWisdomVisible, setShowBase, setHealthyPulpVisible, registerPlugins, setPluginState, getPluginState, getToothStateSummary, setReadOnly, getReadOnly, setNotesEnabled, getNotesEnabled, getOdontogramState, loadOdontogramState } from "./odontogram";
export { clearSelection, setOcclusalVisible, setWisdomVisible, setShowBase, setHealthyPulpVisible, registerPlugins, setPluginState, getPluginState, getToothStateSummary, setReadOnly, getReadOnly, setNotesEnabled, getNotesEnabled, getOdontogramState, loadOdontogramState };
import { useI18n } from "./i18n/useI18n";
import type { Language } from "./i18n/translations";
import type { NumberingSystem } from "./utils/numbering";
import { applyThemeConfig, type OdontogramThemeConfig } from "./theme";
export type { OdontogramThemeConfig };
import type { OdontogramPlugin, PluginLayer } from "./plugin";
export type { OdontogramPlugin, PluginLayer };
import icon8Url from "./assets/icon-svgs/icon_8.svg";
import iconGumUrl from "./assets/icon-svgs/icon_gum.svg";
import iconNoSelectionUrl from "./assets/icon-svgs/icon_no_selection.svg";
import iconOcclUrl from "./assets/icon-svgs/icon_occl.svg";
import iconPulpUrl from "./assets/icon-svgs/icon_pulp.svg";

/**
 * Props for the main Odontogram application component.
 *
 * All props are optional — when omitted, the component operates in
 * **standalone** mode with internal state. When provided, the component
 * operates in **controlled** mode and delegates state to the parent.
 */
type AppProps = {
  /** Override the UI language (controlled mode). */
  language?: Language;
  /** Callback when the user changes the language. */
  onLanguageChange?: (lang: Language) => void;
  /** Override the tooth numbering system (controlled mode). */
  numberingSystem?: NumberingSystem;
  /** Callback when the user changes the numbering system. */
  onNumberingChange?: (system: NumberingSystem) => void;
  /** Override dark mode state (controlled mode). */
  darkMode?: boolean;
  /** Callback when the user toggles dark mode. */
  onDarkModeChange?: (dark: boolean) => void;
  /**
   * Custom theme configuration. Overrides the default color palette via
   * CSS custom properties (`--odon-*`). See {@link OdontogramThemeConfig}.
   */
  themeConfig?: OdontogramThemeConfig;
  /**
   * Custom SVG plugins for extending the odontogram with additional visual
   * overlays and per-tooth custom state. See {@link OdontogramPlugin}.
   */
  plugins?: OdontogramPlugin[];
  /**
   * When true, disables all interactions (click, touch, keyboard).
   * Useful for print/report/view modes.
   */
  readOnly?: boolean;
  /**
   * When true, enables per-tooth notes. Double-click a tooth to add/edit a note.
   * Notes are shown in hover tooltips and included in JSON export/import.
   */
  enableNotes?: boolean;
  onReady?: () => void;
};

const NUMBERING_OPTIONS: { value: NumberingSystem; labelKey: string }[] = [
  { value: "FDI", labelKey: "numbering.fdi" },
  { value: "UNIVERSAL", labelKey: "numbering.universal" },
  { value: "PALMER", labelKey: "numbering.palmer" },
];

const LANGUAGE_OPTIONS: { value: Language; labelKey: string }[] = [
  { value: "hu", labelKey: "language.hu" },
  { value: "en", labelKey: "language.en" },
  { value: "de", labelKey: "language.de" },
  { value: "es", labelKey: "language.es" },
  { value: "it", labelKey: "language.it" },
  { value: "sk", labelKey: "language.sk" },
  { value: "pl", labelKey: "language.pl" },
  { value: "ru", labelKey: "language.ru" },
];

/**
 * Root React component for the Odontogram Editor.
 *
 * Renders the full dental chart UI: top bar with language/numbering/dark-mode
 * controls, the SVG tooth grid, and the right-hand control panel for setting
 * tooth states (caries, fillings, crowns, endo, inflammation, etc.).
 *
 * @example
 * ```tsx
 * // Standalone usage
 * <App />
 *
 * // Controlled by a host application
 * <App
 *   language="en"
 *   onLanguageChange={setLang}
 *   numberingSystem="FDI"
 *   onNumberingChange={setNumbering}
 *   darkMode={isDark}
 *   onDarkModeChange={setDark}
 * />
 * ```
 */
export default function App({
  language,
  onLanguageChange,
  numberingSystem,
  onNumberingChange,
  darkMode,
  onDarkModeChange,
  themeConfig,
  plugins,
  readOnly: readOnlyProp,
  enableNotes,
  onReady,
}: AppProps){
  const { lang, setLang, t } = useI18n({ language, onLanguageChange });
  const [internalNumbering, setInternalNumbering] = useState<NumberingSystem>(numberingSystem ?? "FDI");
  const [occlVisible, setOcclVisible] = useState(true);
  const [wisdomVisible, setWisdomVisibleState] = useState(true);
  const [boneVisible, setBoneVisible] = useState(true);
  const [pulpVisible, setPulpVisible] = useState(true);
  const themeRootRef = useRef<HTMLDivElement | null>(null);
  const currentNumbering = numberingSystem ?? internalNumbering;
  const [languageOpen, setLanguageOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [numberingOpen, setNumberingOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement | null>(null);
  const numberingRef = useRef<HTMLDivElement | null>(null);

  // Dark mode: controlled via prop or standalone via internal state
  const [internalDark, setInternalDark] = useState<boolean>(() => {
    if (darkMode !== undefined) return darkMode;
    if (typeof document !== "undefined") return document.documentElement.classList.contains("dark");
    return false;
  });
  const isDark = darkMode !== undefined ? darkMode : internalDark;

  // Only manage the .dark class when standalone (no darkMode prop from parent)
  useEffect(() => {
    if (darkMode === undefined) {
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, [isDark, darkMode]);

  const toggleDark = () => {
    const next = !isDark;
    if (darkMode !== undefined) {
      onDarkModeChange?.(next);
    } else {
      setInternalDark(next);
      onDarkModeChange?.(next);
    }
  };

  const setNumbering = (next: NumberingSystem) => {
    if(numberingSystem){
      onNumberingChange?.(next);
      return;
    }
    setInternalNumbering(next);
    onNumberingChange?.(next);
  };

  useEffect(() => {
    initOdontogram().then(() => onReady?.());
    return () => {
      destroyOdontogram();
    };
  }, []);

  useEffect(() => {
    setNumberingSystem(currentNumbering);
  }, [currentNumbering]);

  // Apply custom theme config as CSS custom properties
  useEffect(() => {
    applyThemeConfig(themeRootRef.current, themeConfig);
  }, [themeConfig]);

  // Register plugins when provided or changed
  useEffect(() => {
    registerPlugins(plugins ?? []);
  }, [plugins]);

  // Sync read-only mode
  useEffect(() => {
    setReadOnly(readOnlyProp ?? false);
  }, [readOnlyProp]);

  // Sync notes enabled
  useEffect(() => {
    setNotesEnabled(enableNotes ?? false);
  }, [enableNotes]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      if(!languageRef.current?.contains(target)){
        setLanguageOpen(false);
      }
      if(!numberingRef.current?.contains(target)){
        setNumberingOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const numberingLabelKey = currentNumbering === "FDI"
    ? "numbering.fdi"
    : currentNumbering === "UNIVERSAL"
      ? "numbering.universal"
      : "numbering.palmer";

  return (
    <div ref={themeRootRef} className="odontogram-root">
      <header className="topbar">
        <div className="brand">
          <div className="dot"></div>
          <div>
            <div className="title">{t("app.title")}</div>
            <div className="subtitle">{t("app.subtitle")}</div>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="topbar-group dropdown" ref={languageRef}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setLanguageOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={languageOpen}
            >
              {t("language.label")}: {t(LANGUAGE_OPTIONS.find((opt) => opt.value === lang)?.labelKey ?? "language.hu")}
            </button>
            {languageOpen && (
              <div className="dropdown-menu" role="menu" aria-label={t("language.label")}>
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className="dropdown-item"
                    role="menuitemradio"
                    aria-checked={lang === opt.value}
                    onClick={() => {
                      setLang(opt.value);
                      setLanguageOpen(false);
                    }}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="btn-theme"
            onClick={toggleDark}
            title={isDark ? t("theme.light") : t("theme.dark")}
            aria-label={isDark ? t("theme.light") : t("theme.dark")}
          >
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>
          <div className="topbar-group dropdown" ref={numberingRef}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setNumberingOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={numberingOpen}
            >
              {t("numbering.label")}: {t(numberingLabelKey)}
            </button>
            {numberingOpen && (
              <div className="dropdown-menu" role="menu" aria-label={t("numbering.label")}>
                {NUMBERING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={"dropdown-item"}
                    role="menuitemradio"
                    aria-checked={currentNumbering === opt.value}
                    onClick={() => {
                      setNumbering(opt.value);
                      setNumberingOpen(false);
                    }}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button id="btnStatusExport" className="btn btn-ghost btn-sm">{t("topbar.exportStatus")}</button>
          <button id="btnStatusImport" className="btn btn-ghost btn-sm">{t("topbar.importStatus")}</button>
          <input id="statusImportInput" type="file" accept="application/json" hidden />
        </div>
      </header>

      <main className="layout">
        <section className="chart">
          <div className="chart-header">
            <div>
              <div className="chart-title">{t("chart.title")}</div>
              <div className="chart-hint">{t("chart.hint")}</div>
            </div>
            <div className="chart-actions">
              <button id="btnOcclView" className="btn btn-toggle btn-icon" aria-pressed={String(occlVisible) as "true"|"false"} title={t("chart.actions.occlusal")} aria-label={t("chart.actions.occlusal")} data-icon-src={iconOcclUrl} data-xline="1" onClick={() => { const next = !occlVisible; setOcclVisible(next); setOcclusalVisible(next); }}></button>
              <button id="btnWisdomVisible" className="btn btn-toggle btn-icon" aria-pressed={String(wisdomVisible) as "true"|"false"} title={t("chart.actions.wisdom")} aria-label={t("chart.actions.wisdom")} data-icon-src={icon8Url} data-xline="1" onClick={() => { const next = !wisdomVisible; setWisdomVisibleState(next); setWisdomVisible(next); }}></button>
              <button id="btnBoneVisible" className="btn btn-toggle btn-icon" aria-pressed={String(boneVisible) as "true"|"false"} title={t("chart.actions.bone")} aria-label={t("chart.actions.bone")} data-icon-src={iconGumUrl} data-xline="1" onClick={() => { const next = !boneVisible; setBoneVisible(next); setShowBase(next); }}></button>
              <button id="btnPulpVisible" className="btn btn-toggle btn-icon" aria-pressed={String(pulpVisible) as "true"|"false"} title={t("chart.actions.pulp")} aria-label={t("chart.actions.pulp")} data-icon-src={iconPulpUrl} data-xline="1" onClick={() => { const next = !pulpVisible; setPulpVisible(next); setHealthyPulpVisible(next); }}></button>
              <button id="btnSelectNoneChart" className="btn btn-ghost btn-icon" title={t("chart.actions.clearSelection")} aria-label={t("chart.actions.clearSelection")}>
                <img className="icon-img" src={iconNoSelectionUrl} alt="" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div id="toothGrid" className="tooth-grid" aria-label={t("chart.aria.toothGrid")}></div>
        </section>
        <aside className={`panel${!panelOpen ? " panel--closed" : ""}`}>
          <div className="panel-header">
            <div>
              <div className="panel-title-row">
                <span className="panel-title">{t("panel.controls")}</span>
                  <button
                    className="icon-btn panel-toggle-btn"
                    onClick={() => setPanelOpen(o => !o)}
                    title={panelOpen ? "Свернуть панель" : "Развернуть панель"}
                    aria-label={panelOpen ? "Свернуть панель" : "Развернуть панель"}
                  >
                    <span style={{ display: "inline-block", transition: "transform 0.25s", transform: panelOpen ? "rotate(0deg)" : "rotate(180deg)" }}>◀</span>
                  </button>
                <div className="panel-title-actions">
                  <Button id="btnSelectNone" variant="danger" size="sm" title={t("panel.clearSelection")} aria-label={t("panel.clearSelection")}>{t("panel.clearSelection")}</Button>
                  <button id="btnToggleControlsCard" className="icon-btn" title={t("actions.collapse", { label: t("panel.controls") })} aria-label={t("actions.collapse", { label: t("panel.controls") })}>
                    <span className="toggle-icon" aria-hidden="true">−</span>
                  </button>
                </div>
              </div>
              <div className="panel-subtitle">{t("panel.activeTooth")}: <span id="activeToothLabel" className="pill">{t("selection.none")}</span></div>
              <div id="controlsActions" className="panel-subtitle select-actions">
                <div className="select-actions-row">
                  <Button id="btnSelectAll" variant="ghost" size="sm">{t("panel.selectActions.all")}</Button>
                  <Button id="btnSelectAllPresent" variant="ghost" size="sm" className="fade-toggle">{t("panel.selectActions.present")}</Button>
                  <Button id="btnSelectPermanent" variant="ghost" size="sm" className="fade-toggle">{t("panel.selectActions.permanent")}</Button>
                  <Button id="btnSelectMilk" variant="ghost" size="sm" className="fade-toggle">{t("panel.selectActions.milk")}</Button>
                  <Button id="btnSelectImplants" variant="ghost" size="sm" className="fade-toggle">{t("panel.selectActions.implants")}</Button>
                  <Button id="btnSelectAllMissing" variant="ghost" size="sm" className="fade-toggle">{t("panel.selectActions.missing")}</Button>
                </div>
                <div className="select-actions-row">
                  <Button id="btnSelectUpper" variant="ghost" size="sm">{t("panel.selectActions.upper")}</Button>
                  <Button id="btnSelectUpperFront" variant="ghost" size="sm">{t("panel.selectActions.upperFront")}</Button>
                  <Button id="btnSelectUpperMolar" variant="ghost" size="sm">{t("panel.selectActions.upperMolar")}</Button>
                  <Button id="btnSelectLower" variant="ghost" size="sm">{t("panel.selectActions.lower")}</Button>
                  <Button id="btnSelectLowerFront" variant="ghost" size="sm">{t("panel.selectActions.lowerFront")}</Button>
                  <Button id="btnSelectLowerMolar" variant="ghost" size="sm">{t("panel.selectActions.lowerMolar")}</Button>
                </div>
              </div>
            </div>
            <div id="warnings" className="warnings"></div>
          </div>

          {panelOpen && <div className="panel-body">
            <section className="card" id="statusCard">
              <div className="card-title card-title-row">
                <span>{t("status.title")}</span>
                <button id="btnToggleStatusCard" className="icon-btn" title={t("actions.collapse", { label: t("status.title") })} aria-label={t("actions.collapse", { label: t("status.title") })}>
                  <span className="toggle-icon" aria-hidden="true">−</span>
                </button>
              </div>
              <div className="row status-actions" id="statusCardBody">
                <Button id="btnResetAll" variant="ghost" size="sm">{t("status.resetAll")}</Button>
                <Button id="btnPrimaryDentition" variant="ghost" size="sm">{t("status.primaryDentition")}</Button>
                <Button id="btnMixedDentition" variant="ghost" size="sm">{t("status.mixedDentition")}</Button>
                <button id="btnEdentulous" className="btn btn-toggle btn-sm" aria-pressed="false">{t("status.edentulous")}</button>
              </div>
              <div className="row status-extra-row">
                <span>{t("status.extraLabel")}</span>
                <div className="ui-select-wrap"><select id="statusExtraSelect"></select></div>
                <Button id="statusExtraApply" variant="primary" size="sm">{t("status.extraApply")}</Button>
              </div>
            </section>

            <section className="card">
              <div className="card-title card-title-row">
                <span>{t("tooth.title")}</span>
                <Button id="btnResetTooth" variant="ghost" size="sm" title={t("tooth.resetTitle")} aria-label={t("tooth.resetTitle")}>{t("tooth.reset")}</Button>
              </div>
              <div className="row">
                <span>{t("tooth.baseLabel")}</span>
                <div className="ui-select-wrap"><select id="toothSelect"></select></div>
              </div>
              <div id="bridgeUnitRow" className="row">
                <span>{t("tooth.bridgeLabel")}</span>
                <div className="ui-select-wrap"><select id="bridgeUnitSelect"></select></div>
              </div>
              <label id="extractionRow" className="row">
                <input type="checkbox" id="extractionWound" />
                <span>{t("tooth.extractionWound")}</span>
              </label>
              <label id="missingClosedRow" className="row">
                <input type="checkbox" id="missingClosed" />
                <span>{t("tooth.missingClosed")}</span>
              </label>
              <div id="crownRow" className="row">
                <span>{t("tooth.crownLabel")}</span>
                <div className="ui-select-wrap"><select id="crownSelect"></select></div>
              </div>
              <div id="brokenCrownRow" className="row inline-checks contact-row">
                <label>
                  <input type="checkbox" id="brokenMesial" />
                  <span>{t("tooth.broken.mesial")}</span>
                </label>
                <label>
                  <input type="checkbox" id="brokenIncisal" />
                  <span>{t("tooth.broken.incisal")}</span>
                </label>
                <label>
                  <input type="checkbox" id="brokenDistal" />
                  <span>{t("tooth.broken.distal")}</span>
                </label>
              </div>
              <div id="contactPointRow" className="row inline-checks contact-row">
                <label>
                  <input type="checkbox" id="contactMesial" />
                  <span>{t("tooth.contact.mesialMissing")}</span>
                </label>
                <label>
                  <input type="checkbox" id="contactDistal" />
                  <span>{t("tooth.contact.distalMissing")}</span>
                </label>
              </div>
              <div id="bruxismRow" className="row inline-checks bruxism-row">
                <label>
                  <input type="checkbox" id="bruxismWear" />
                  <span>{t("tooth.bruxism.edgeWear")}</span>
                </label>
                <label>
                  <input type="checkbox" id="bruxismNeckWear" />
                  <span>{t("tooth.bruxism.neckWear")}</span>
                </label>
              </div>
              <div id="crownActionsRow" className="row inline-checks bridge-actions-row">
                <label id="bridgePillarRow" className="inline-check">
                  <input type="checkbox" id="bridgePillar" />
                  <span>{t("tooth.bridgePillar")}</span>
                </label>
                <label id="extractionPlanRow" className="inline-check">
                  <input type="checkbox" id="extractionPlan" />
                  <span>{t("tooth.extractionPlan")}</span>
                </label>
              </div>
              <label id="crownReplaceRow" className="row">
                <input type="checkbox" id="crownReplace" />
                <span>{t("tooth.crownReplace")}</span>
              </label>
              <label id="crownNeededRow" className="row">
                <input type="checkbox" id="crownNeeded" />
                <span>{t("tooth.crownNeeded")}</span>
              </label>
            </section>

            <section id="cariesSection" className="card">
              <div className="card-title card-title-row">
                <span>{t("caries.title")}</span>
                <button id="btnToggleCariesCard" className="icon-btn" title={t("actions.collapse", { label: t("caries.title") })} aria-label={t("actions.collapse", { label: t("caries.title") })}>
                  <span className="toggle-icon" aria-hidden="true">−</span>
                </button>
              </div>
              <div className="hint">{t("caries.hint")}</div>
              <div id="cariesChecks" className="check-grid"></div>
            </section>

            <section id="fillingSection" className="card">
              <div className="card-title card-title-row">
                <span>{t("filling.title")}</span>
                <button id="btnToggleFillingCard" className="icon-btn" title={t("actions.collapse", { label: t("filling.title") })} aria-label={t("actions.collapse", { label: t("filling.title") })}>
                  <span className="toggle-icon" aria-hidden="true">−</span>
                </button>
              </div>
              <div className="row">
                <span>{t("filling.typeLabel")}</span>
                <div className="ui-select-wrap"><select id="fillingSelect"></select></div>
              </div>
              <div id="fillingSurfaceChecks" className="check-grid hidden"></div>
              <label id="fissureSealingRow" className="row fissure-row">
                <input type="checkbox" id="fissureSealing" />
                <span>{t("filling.fissureSealing")}</span>
              </label>
            </section>

            <section id="endoSection" className="card">
              <div className="card-title card-title-row">
                <span>{t("endo.title")}</span>
                <button id="btnToggleEndoCard" className="icon-btn" title={t("actions.collapse", { label: t("endo.title") })} aria-label={t("actions.collapse", { label: t("endo.title") })}>
                  <span className="toggle-icon" aria-hidden="true">−</span>
                </button>
              </div>
              <div className="hint">{t("endo.hint")}</div>
              <div className="row">
                <div className="ui-select-wrap"><select id="endoSelect"></select></div>
              </div>
              <div className="row inline-checks">
                <label>
                  <input type="checkbox" id="pulpInflam" />
                  <span>{t("endo.pulpitis")}</span>
                </label>
                <label>
                  <input type="checkbox" id="endoResection" />
                  <span>{t("endo.resection")}</span>
                </label>
                <label>
                  <input type="checkbox" id="parapulpalPin" />
                  <span>{t("endo.parapulpalPin")}</span>
                </label>
              </div>
            </section>

            <section id="inflammationSection" className="card">
              <div className="card-title card-title-row">
                <span>{t("inflammation.title")}</span>
                <button id="btnToggleInflammationCard" className="icon-btn" title={t("actions.collapse", { label: t("inflammation.title") })} aria-label={t("actions.collapse", { label: t("inflammation.title") })}>
                  <span className="toggle-icon" aria-hidden="true">−</span>
                </button>
              </div>
              <div id="mobilityRow" className="row">
                <span>{t("inflammation.mobilityLabel")}</span>
                <div className="ui-select-wrap"><select id="mobilitySelect"></select></div>
              </div>
              <div id="modsChecks" className="check-grid"></div>
            </section>

          </div>}
        </aside>
      </main>
    </div>
  );
}



