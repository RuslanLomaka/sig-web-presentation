"use strict";

/*
 * Languages of the presentation: Ukrainian (source text in index.html), English and German.
 *
 * Choice order on load: the language saved after a click on the switcher, then the browser's
 * language settings (navigator.languages), then English.
 *
 * Static text: elements carry data-i18n (text), data-i18n-aria (aria-label), data-i18n-href
 * (href) or data-i18n-content (content). Ukrainian is read from index.html; English and German
 * come from `page` below. Interactive demo text lives in `content` for all three languages and
 * is rendered by demo.js.
 *
 * This script is loaded without `defer` so it can pick the language before the first paint.
 */
(() => {
  const STORAGE_KEY = "sig-presentation-language";
  const DEFAULT_LANGUAGE = "en";
  const locales = {
    ua: { lang: "uk", numbers: "uk-UA" },
    en: { lang: "en", numbers: "en-GB" },
    de: { lang: "de", numbers: "de-DE" }
  };

  const page = {
    en: {
      pageTitle: "Industrial AI assistant · Smart Industry Group",
      metaDescription: "The SIG industrial AI assistant helps you find resource losses, analyse downtime and keep your team's know-how.",
      skipLink: "Skip to content",
      brandHome: "Smart Industry Group — back to top",
      navLabel: "Presentation sections",
      navDemo: "How it works",
      navExamples: "Examples",
      navPilot: "Where to start",
      languageLabel: "Language",
      headerContact: "Contact SIG",
      contactsUrl: "https://sig-automation.com/en#contacts",
      heroTitle1: "Industrial",
      heroTitle2: "AI assistant",
      heroText: "Where can you save resources, cut downtime or remove manual work? The SIG assistant looks for the answer in your data, shows its sources and suggests the next step.",
      heroCta: "Watch the demo",
      heroAudiences: "Manufacturing · Food industry · Logistics · Medical facility equipment",
      demoTitle: "From question to answer",
      demoIntro: "Choose a situation. See which records the assistant reads and where it suggests you start.",
      walkthroughLabel: "Demo of a conversation between an engineer and the assistant",
      walkthroughTitle: "Conversation with the assistant",
      walkthroughNote: "Illustrative example",
      walkthroughCaseLabel: "Demo scenario",
      caseResources: "Resource consumption",
      caseIncident: "Line stoppage",
      walkthroughReplay: "Restart",
      roleEngineer: "Engineer",
      assistantName: "SIG assistant",
      sourcesHeading: "What the assistant checks",
      walkthroughProgress: "Demo progress",
      examplesTitle: "What else can you ask?",
      examplesIntro: "The same approach works for many tasks, from water used for cleaning to delays in the warehouse. Pick an example. The data is illustrative.",
      tabsLabel: "Assistant scenarios",
      tabTrends: "Pressure history",
      tabStable: "Process improvement",
      tabHandover: "Shift handover",
      resTitle: "Same output. Higher consumption.",
      resNote: "Two shifts, 1,200 units each.",
      resLegend: "What to compare?",
      resEnergy: "Electricity",
      resWater: "Water",
      shiftA: "Shift A",
      shiftB: "Shift B",
      perUnit: "Per unit",
      whatVisible: "What it shows",
      whatToCheck: "What to check",
      resMapNote: "This is an example of looking for losses. Savings can be estimated after checking and measuring again.",
      incKicker: "Line B log",
      tagStop: "Stopped",
      incTitle: "Events before the stoppage",
      incNote: "Select an event to see the details.",
      incEventsLabel: "Line B events",
      evLevel: "Low inlet level",
      evPressure: "Pressure drop",
      evStop: "Line stoppage",
      incQuestion: "What should be checked after the line B stoppage?",
      whatHappened: "What happened",
      incHappened: "Inlet level and pressure dropped before the stoppage.",
      possibleCause: "Possible cause",
      incCause: "The pump may not have been getting enough material.",
      incCheck: "Whether there was enough material when the pump started.",
      incMissingLabel: "What's missing.",
      incMissingText: "There is no flow data. The cause still has to be verified.",
      incSourcesLabel: "Sources of the answer",
      incSrc1Label: "SCADA log",
      incSrc1: "LT-101 at 10:42:16, PT-204 at 10:42:18 and the stoppage at 10:42:20.",
      incSrc2Label: "LT-101 history",
      incSrc2: "the level fell from 10:24 to 10:42.",
      incSrc3Label: "P-204 manual",
      incSrc3: "start-up and feed conditions for the engineer to check.",
      trKicker: "Signal archive · Three stoppages",
      trTitle: "Pressure before the stoppage",
      trLegend: "Choose an example date",
      trDate12: "12 April",
      trDate18: "18 April",
      trDate24: "24 April",
      trCaption: "PT-204 pressure, bar · 5 minutes before the stoppage",
      trQuestion: "Did pressure drop before the P-204 stoppages?",
      whatRepeated: "What repeated",
      trRepeated: "On 12 and 18 April the pressure dropped before the stoppage.",
      whatMissing: "What's missing",
      trMissing: "Only part of the records exist for 24 April.",
      trCheck: "Compare pressure, current and level over the last five minutes before each stoppage.",
      trBasisLabel: "Basis for comparison",
      trBasis1: "Three illustrative stoppage records from the event log.",
      trBasis2: "PT-204 history for the five minutes before each event. Gaps in the archive are left visible.",
      stKicker: "Line B · Steady operation",
      tagOk: "Running",
      stTitle: "Plan a test",
      st1Title: "Find comparable periods",
      st1Text: "Same material, load and line condition.",
      st2Title: "Choose the metrics",
      st2Text: "Feed stability, pressure and process deviations.",
      st3Title: "Agree on the test",
      st3Text: "The engineer sets the limits and the conditions for stopping the test.",
      st4Title: "Evaluate the result",
      st4Text: "The team compares the metrics after the test.",
      stQuestion: "How can a setting be evaluated without a breakdown?",
      stCompareLabel: "Compare",
      stCompare: "Start with periods of similar load and separate them from start-ups and shutdowns.",
      stPrepareLabel: "Prepare",
      stPrepare: "Agree with the engineer which parameter to test, by which metric and when to end the test.",
      stEvaluateLabel: "Evaluate",
      stEvaluate: "The team runs the agreed test under the plant's procedures and decides whether to keep the setting.",
      hoKicker: "Shift log · Line B",
      hoTitle: "Hand the context over to the team",
      hoStateLabel: "Line status",
      hoState: "Stopped at 10:42:20",
      hoBeforeLabel: "Before the stoppage",
      hoBefore: "Low level and pressure drop",
      hoSettingsLabel: "Settings history",
      hoSettings: "P-204 start threshold was changed",
      hoActionsLabel: "Team actions",
      hoActions: "Check result not yet recorded",
      hoQuestion: "What should be handed over about this stoppage?",
      hoLegend: "Draft for",
      hoEngineer: "Engineer",
      hoManager: "Manager",
      hoNote: "The person in charge reviews the draft before handing it over.",
      ctxTitle: "Where does the assistant look for answers?",
      ctxIntro: "It can search documents, equipment data and cases your team has already investigated.",
      ctxSourcesLabel: "Context sources",
      srcScada: "Equipment data",
      srcPlc: "Controller program",
      srcDocs: "Diagrams and manuals",
      srcTeam: "Team experience",
      ctxResult: "An explanation with sources for the engineer",
      ctxNote: "Before connecting, you choose which sources the assistant may read.",
      intTitle: "Works with your equipment and systems",
      intIntro: "The assistant connects to equipment from any manufacturer, industrial networks, databases and business systems. The model can run locally on a server at your company.",
      intBrandsTitle: "Equipment from any manufacturer",
      intBrandsText: "Controllers, drives, sensors and operator panels, both new ones and those already running on the line.",
      intMore: "and more",
      intProtocolsTitle: "Industrial interfaces",
      intProtocolsText: "The industrial networks and protocols most widely used in Germany. Others connect through gateways.",
      intDbTitle: "Databases",
      intDbText: "SQL, document and time-series databases: process archives, MES data and data historians.",
      intErpTitle: "ERP, accounting and warehouse",
      intErpText: "SAP ERP and other accounting, warehouse, maintenance and production systems, via API, database or file exchange.",
      intMes: "Production",
      intWms: "Warehouse",
      intCmms: "Maintenance",
      intAiTitle: "AI on your own server",
      intAiText: "Open models run locally on a server at your company, without sending data to the cloud. Through MCP the assistant reaches only the systems you allow.",
      intTrademarks: "Names and logos belong to their respective owners and are shown only to indicate compatibility.",
      ctlTitle: "You decide what to do",
      ctlIntro: "In the first phase the assistant reads the data it is allowed to and gives a hint. The engineer checks it and decides what to do with the equipment.",
      flow1: "You choose the sources",
      flow1Note: "Documents, logs, equipment data",
      flow2: "You grant read access",
      flow2Note: "Access to approved material only",
      flow3: "The assistant explains",
      flow3Note: "Answers and shows its sources",
      flow4: "The engineer checks",
      flow4Note: "The decision stays with the team",
      modelTitle: "The model can be upgraded",
      modelText: "We design the assistant so that documents and team know-how are stored separately. When a better model comes along, that knowledge can still be used.",
      deployLegend: "Deployment option",
      deployLocal: "On-premises",
      deployCloud: "In the cloud",
      deployModelLabel: "Model",
      deployDataLabel: "Context",
      deployTermsLabel: "Resources and policies",
      pilotTitle: "Let's start with your task",
      pilotIntro: "Let's pick one task. Together we'll check whether the assistant helps save time, reduce losses or keep the team's know-how.",
      pilot1Title: "Find the answer",
      pilot1Text: "We start with one question and the documents it needs. The team checks the answer and its sources.",
      pilot2Title: "Keep the know-how",
      pilot2Text: "Confirmed cases can be recorded so the next shift can find them.",
      pilot3Title: "Add what you need",
      pilot3Text: "Next you can add analysis of water and energy use, downtime tracking or reports for the team.",
      ctaTitle: "Would you like to see a demo?",
      ctaText: "Tell us about one situation that costs your team time.",
      ctaButton: "Request a demo from SIG",
      footerNote: "Presentation demo · Illustrative scenarios and data",
      footerNavLabel: "Company information",
      footerContacts: "Contact on the SIG website",
      footerImprint: "Legal notice",
      footerPrivacy: "Privacy policy"
    },
    de: {
      pageTitle: "Industrieller KI-Assistent · Smart Industry Group",
      metaDescription: "Der industrielle KI-Assistent von SIG hilft, Ressourcenverluste zu finden, Stillstände zu analysieren und das Wissen des Teams zu bewahren.",
      skipLink: "Zum Inhalt springen",
      brandHome: "Smart Industry Group — zum Seitenanfang",
      navLabel: "Abschnitte der Präsentation",
      navDemo: "So funktioniert es",
      navExamples: "Beispiele",
      navPilot: "Erste Schritte",
      languageLabel: "Sprache",
      headerContact: "Kontakt SIG",
      contactsUrl: "https://sig-automation.com/de#contacts",
      heroTitle1: "Industrieller",
      heroTitle2: "KI-Assistent",
      heroText: "Wo lassen sich Ressourcen sparen, Stillstände verkürzen oder manuelle Arbeit vermeiden? Der SIG-Assistent sucht die Antwort in Ihren Daten, zeigt die Quellen und schlägt den nächsten Schritt vor.",
      heroCta: "Demo ansehen",
      heroAudiences: "Fertigung · Lebensmittelindustrie · Logistik · Technik für medizinische Einrichtungen",
      demoTitle: "Von der Frage zur Antwort",
      demoIntro: "Wählen Sie eine Situation. Sehen Sie, welche Aufzeichnungen der Assistent liest und womit er zu beginnen empfiehlt.",
      walkthroughLabel: "Demo eines Gesprächs zwischen Ingenieur und Assistent",
      walkthroughTitle: "Gespräch mit dem Assistenten",
      walkthroughNote: "Fiktives Beispiel",
      walkthroughCaseLabel: "Demo-Szenario",
      caseResources: "Ressourcenverbrauch",
      caseIncident: "Linienstillstand",
      walkthroughReplay: "Neu starten",
      roleEngineer: "Ingenieur",
      assistantName: "SIG-Assistent",
      sourcesHeading: "Was der Assistent prüft",
      walkthroughProgress: "Fortschritt der Demo",
      examplesTitle: "Was können Sie noch fragen?",
      examplesIntro: "Derselbe Ansatz passt zu vielen Aufgaben – vom Wasserverbrauch bei der Reinigung bis zu Verzögerungen im Lager. Wählen Sie ein Beispiel. Die Daten sind fiktiv.",
      tabsLabel: "Szenarien des Assistenten",
      tabTrends: "Druckverlauf",
      tabStable: "Prozessverbesserung",
      tabHandover: "Schichtübergabe",
      resTitle: "Gleiche Menge. Höherer Verbrauch.",
      resNote: "Zwei Schichten mit je 1.200 Einheiten.",
      resLegend: "Was vergleichen?",
      resEnergy: "Strom",
      resWater: "Wasser",
      shiftA: "Schicht A",
      shiftB: "Schicht B",
      perUnit: "Pro Einheit",
      whatVisible: "Was zu sehen ist",
      whatToCheck: "Was zu prüfen ist",
      resMapNote: "Dies ist ein Beispiel für die Suche nach Verlusten. Einsparungen lassen sich nach Prüfung und erneuter Messung abschätzen.",
      incKicker: "Protokoll Linie B",
      tagStop: "Stillstand",
      incTitle: "Ereignisse vor dem Stillstand",
      incNote: "Wählen Sie ein Ereignis, um Details zu sehen.",
      incEventsLabel: "Ereignisse Linie B",
      evLevel: "Niedriger Füllstand am Eingang",
      evPressure: "Druckabfall",
      evStop: "Linienstillstand",
      incQuestion: "Was ist nach dem Stillstand von Linie B zu prüfen?",
      whatHappened: "Was passiert ist",
      incHappened: "Vor dem Stillstand sanken Eingangsfüllstand und Druck.",
      possibleCause: "Mögliche Ursache",
      incCause: "Die Pumpe hat möglicherweise zu wenig Material erhalten.",
      incCheck: "Ob beim Anlaufen der Pumpe genug Material vorhanden war.",
      incMissingLabel: "Was fehlt.",
      incMissingText: "Es gibt keine Durchflussdaten. Die Ursache muss noch geprüft werden.",
      incSourcesLabel: "Quellen der Antwort",
      incSrc1Label: "SCADA-Protokoll",
      incSrc1: "LT-101 um 10:42:16, PT-204 um 10:42:18 und Stillstand um 10:42:20.",
      incSrc2Label: "Verlauf LT-101",
      incSrc2: "der Füllstand sank von 10:24 bis 10:42.",
      incSrc3Label: "Anleitung P-204",
      incSrc3: "Anlauf- und Zufuhrbedingungen zur Prüfung durch den Ingenieur.",
      trKicker: "Signalarchiv · Drei Stillstände",
      trTitle: "Druck vor dem Stillstand",
      trLegend: "Beispieldatum wählen",
      trDate12: "12. April",
      trDate18: "18. April",
      trDate24: "24. April",
      trCaption: "Druck PT-204, bar · 5 Minuten vor dem Stillstand",
      trQuestion: "Fiel der Druck vor den Stillständen von P-204?",
      whatRepeated: "Was sich wiederholte",
      trRepeated: "Am 12. und 18. April fiel der Druck vor dem Stillstand.",
      whatMissing: "Was fehlt",
      trMissing: "Für den 24. April liegen nur Teile der Aufzeichnungen vor.",
      trCheck: "Druck, Strom und Füllstand in den letzten fünf Minuten vor jedem Stillstand vergleichen.",
      trBasisLabel: "Vergleichsgrundlage",
      trBasis1: "Drei fiktive Stillstandseinträge aus dem Ereignisprotokoll.",
      trBasis2: "Verlauf von PT-204 in den fünf Minuten vor jedem Ereignis. Lücken im Archiv bleiben sichtbar.",
      stKicker: "Linie B · Stabiler Betrieb",
      tagOk: "In Betrieb",
      stTitle: "Test planen",
      st1Title: "Vergleichbare Zeiträume finden",
      st1Text: "Gleiches Material, gleiche Last, gleicher Linienzustand.",
      st2Title: "Kennzahlen wählen",
      st2Text: "Zufuhrstabilität, Druck und Prozessabweichungen.",
      st3Title: "Test abstimmen",
      st3Text: "Der Ingenieur legt Grenzen und Abbruchbedingungen des Tests fest.",
      st4Title: "Ergebnis bewerten",
      st4Text: "Das Team vergleicht die Kennzahlen nach dem Test.",
      stQuestion: "Wie lässt sich eine Einstellung ohne Störfall bewerten?",
      stCompareLabel: "Vergleichen",
      stCompare: "Mit Zeiträumen ähnlicher Last beginnen und sie von An- und Abfahrvorgängen trennen.",
      stPrepareLabel: "Vorbereiten",
      stPrepare: "Mit dem Ingenieur abstimmen, welcher Parameter geprüft wird, anhand welcher Kennzahl und wann der Test endet.",
      stEvaluateLabel: "Bewerten",
      stEvaluate: "Das Team führt den abgestimmten Test nach den Verfahren des Unternehmens durch und entscheidet, ob die Einstellung bleibt.",
      hoKicker: "Schichtbuch · Linie B",
      hoTitle: "Kontext an das Team übergeben",
      hoStateLabel: "Linienstatus",
      hoState: "Stillstand um 10:42:20",
      hoBeforeLabel: "Vor dem Stillstand",
      hoBefore: "Niedriger Füllstand und Druckabfall",
      hoSettingsLabel: "Einstellungsverlauf",
      hoSettings: "Anlaufschwelle von P-204 geändert",
      hoActionsLabel: "Maßnahmen des Teams",
      hoActions: "Prüfergebnis noch nicht eingetragen",
      hoQuestion: "Was ist zu diesem Stillstand zu übergeben?",
      hoLegend: "Entwurf für",
      hoEngineer: "Ingenieur",
      hoManager: "Leitung",
      hoNote: "Die verantwortliche Person prüft den Entwurf vor der Übergabe.",
      ctxTitle: "Wo sucht der Assistent nach Antworten?",
      ctxIntro: "Er kann in Dokumenten, Anlagendaten und Fällen suchen, die Ihr Team bereits geprüft hat.",
      ctxSourcesLabel: "Kontextquellen",
      srcScada: "Anlagendaten",
      srcPlc: "Steuerungsprogramm",
      srcDocs: "Schaltpläne und Anleitungen",
      srcTeam: "Erfahrung des Teams",
      ctxResult: "Erklärung mit Quellen für den Ingenieur",
      ctxNote: "Vor der Anbindung legen Sie fest, welche Quellen der Assistent lesen darf.",
      intTitle: "Arbeitet mit Ihren Anlagen und Systemen",
      intIntro: "Der Assistent verbindet sich mit Anlagen jedes Herstellers, Industrienetzwerken, Datenbanken und Geschäftssystemen. Das Modell kann lokal auf einem Server in Ihrem Unternehmen laufen.",
      intBrandsTitle: "Anlagen jedes Herstellers",
      intBrandsText: "Steuerungen, Antriebe, Sensoren und Bedienpanels – neue ebenso wie solche, die bereits an der Linie laufen.",
      intMore: "und weitere",
      intProtocolsTitle: "Industrielle Schnittstellen",
      intProtocolsText: "Die in Deutschland am weitesten verbreiteten Industrienetzwerke und Protokolle. Weitere binden wir über Gateways an.",
      intDbTitle: "Datenbanken",
      intDbText: "SQL-, Dokumenten- und Zeitreihendatenbanken: Prozessarchive, MES-Daten und Historian-Systeme.",
      intErpTitle: "ERP, Buchhaltung und Lager",
      intErpText: "SAP ERP und weitere Systeme für Buchhaltung, Lager, Instandhaltung und Produktion – per API, Datenbank oder Dateiaustausch.",
      intMes: "Produktion",
      intWms: "Lager",
      intCmms: "Instandhaltung",
      intAiTitle: "KI auf Ihrem eigenen Server",
      intAiText: "Offene Modelle laufen lokal auf einem Server in Ihrem Unternehmen, ohne Daten in die Cloud zu senden. Über MCP erreicht der Assistent nur die freigegebenen Systeme.",
      intTrademarks: "Namen und Logos gehören ihren jeweiligen Inhabern und dienen nur als Hinweis auf die Kompatibilität.",
      ctlTitle: "Sie entscheiden, was zu tun ist",
      ctlIntro: "In der ersten Phase liest der Assistent die freigegebenen Daten und gibt einen Hinweis. Der Ingenieur prüft ihn und entscheidet, was mit der Anlage geschieht.",
      flow1: "Sie wählen die Quellen",
      flow1Note: "Dokumente, Protokolle, Anlagendaten",
      flow2: "Sie erteilen Lesezugriff",
      flow2Note: "Zugriff nur auf freigegebene Inhalte",
      flow3: "Der Assistent erklärt",
      flow3Note: "Antwortet und zeigt die Quellen",
      flow4: "Der Ingenieur prüft",
      flow4Note: "Die Entscheidung bleibt beim Team",
      modelTitle: "Das Modell lässt sich austauschen",
      modelText: "Wir gestalten den Assistenten so, dass Dokumente und Teamwissen getrennt gespeichert werden. Kommt ein besseres Modell, lässt sich dieses Wissen weiter nutzen.",
      deployLegend: "Bereitstellungsvariante",
      deployLocal: "Lokal",
      deployCloud: "In der Cloud",
      deployModelLabel: "Modell",
      deployDataLabel: "Kontext",
      deployTermsLabel: "Ressourcen und Richtlinien",
      pilotTitle: "Beginnen wir mit Ihrer Aufgabe",
      pilotIntro: "Wählen wir eine Aufgabe. Gemeinsam prüfen wir, ob der Assistent hilft, Zeit zu sparen, Verluste zu senken oder das Wissen des Teams zu bewahren.",
      pilot1Title: "Antwort finden",
      pilot1Text: "Wir beginnen mit einer Frage und den nötigen Dokumenten. Das Team prüft Antwort und Quellen.",
      pilot2Title: "Wissen bewahren",
      pilot2Text: "Bestätigte Fälle können festgehalten werden, damit die nächste Schicht sie findet.",
      pilot3Title: "Nach Bedarf erweitern",
      pilot3Text: "Danach lassen sich Analysen des Wasser- und Energieverbrauchs, Stillstandserfassung oder Berichte für das Team ergänzen.",
      ctaTitle: "Möchten Sie eine Demo sehen?",
      ctaText: "Erzählen Sie uns von einer Situation, die Ihr Team Zeit kostet.",
      ctaButton: "Demo bei SIG anfragen",
      footerNote: "Präsentationsdemo · Fiktive Szenarien und Daten",
      footerNavLabel: "Unternehmensinformationen",
      footerContacts: "Kontakt auf der SIG-Website",
      footerImprint: "Impressum",
      footerPrivacy: "Datenschutz"
    }
  };

  // Text that demo.js writes into the interactive parts of the page.
  const content = {
    ua: {
      trends: {
        "12": "12 квітня тиск знизився з 2,9 до 1,4 бар.",
        "18": "18 квітня тиск знизився з 2,8 до 1,6 бар.",
        "24": "24 квітня частина записів відсутня. Тиск у момент зупинки невідомий."
      },
      axisLabels: ["−5 хв", "−4", "−3", "−2", "−1", "Зупинка"],
      events: {
        level: ["LT-101 · Низький рівень", "Рівень у приймальному бункері був низьким за 4 секунди до зупинки лінії."],
        pressure: ["PT-204 · Падіння тиску", "Тиск знизився через 2 секунди після спрацювання сигналу низького рівня."],
        stop: ["Лінія B · Зупинка", "Журнал зафіксував зупинку о 10:42:20. Для визначення причини потрібна перевірка подачі."]
      },
      sources: {
        scada: ["Події й вимірювання", "Записи показують, що сталося першим: падіння рівня, зміна тиску чи зупинка.", "Приклад — журнал подій і графік рівня."],
        plc: ["Умови запуску", "З програми контролера видно, за яких умов обладнання може запуститися.", "Приклад — які сигнали потрібні для запуску насоса."],
        docs: ["Як має працювати обладнання", "Інструкції та схеми допомагають звірити умови роботи й знайти, що переглянути.", "Приклад — розділ інструкції про запуск насоса."],
        team: ["Що вже перевіряли", "Інженер записує підтверджений випадок. Наступна зміна може знайти його, якщо проблема повториться.", "Приклад — що перевірили минулого разу й що це показало."]
      },
      reports: {
        engineer: ["Передача зміни", "Перед зупинкою лінії B зафіксовано низький рівень LT-101 і падіння тиску PT-204. О 10:24:10 поріг запуску P-204 змінили з 35 % до 15 %. Перевірити фактичну подачу та умови запуску. Результат перевірки ще не внесено."],
        manager: ["Огляд для керівника", "Пріоритет зміни — розібратися з повторними зупинками лінії B. Команді потрібно перевірити подачу та оцінити можливий вплив зміни порога. Підтвердженої причини поки немає."]
      },
      resources: {
        energy: [
          "144 кВт·год", "168 кВт·год", "0,12 → 0,14 кВт·год",
          "Де шукати перевитрату електроенергії?",
          "За того самого обсягу зміна B витратила на 24 кВт·год більше.",
          "Зіставте покази лічильника з графіком роботи. Окремо перегляньте споживання, коли випуску не було."
        ],
        water: [
          "4 200 л", "4 800 л", "3,5 → 4,0 л",
          "Де шукати перевитрату води?",
          "За того самого обсягу зміна B витратила на 600 л більше.",
          "Звірте покази лічильника із записами промивання. Перевірте, чи відрізнялися тривалість або кількість циклів."
        ]
      },
      deployments: {
        local: ["В інфраструктурі підприємства", "Залишається у визначеному периметрі", "Обчислення та обробка за політиками підприємства"],
        cloud: ["У погодженому хмарному середовищі", "До моделі надходить погоджений контекст", "Хмарні ресурси, передавання та зберігання за угодою"]
      },
      walkthrough: {
        pause: "Пауза",
        play: "Відтворити",
        steps: ["Інженер ставить запитання", null, null, null, "Асистент зіставляє записи", "Інженер отримує підказку"],
        cases: {
          resources: {
            question: "Чому на той самий обсяг пішло більше електроенергії?",
            answerTitle: "Почніть із періодів без роботи.",
            answer: "Лічильник показує витрати навіть тоді, коли ділянка нічого не випускала.",
            limit: "Спершу з’ясуйте, яке споживання в цей час потрібне за регламентом.",
            sources: [
              ["Лічильник", "Витрати зросли зі 144 до 168 кВт·год.", "Асистент читає покази лічильника"],
              ["Обсяг роботи", "Обидві зміни випустили по 1 200 одиниць.", "Асистент порівнює випуск"],
              ["Графік роботи", "Частина витрат припала на час без випуску.", "Асистент перевіряє графік роботи"]
            ]
          },
          incident: {
            question: "Лінія B зупинилася. Що перевірити першим?",
            answerTitle: "Перевірте подачу до насоса.",
            answer: "Перед зупинкою впали рівень на вході й тиск. Нестача подачі може це пояснити.",
            limit: "Даних про витрату немає. Причину ще треба перевірити.",
            sources: [
              ["Журнал подій", "Рівень і тиск впали перед зупинкою.", "Асистент читає журнал подій"],
              ["Історія рівня", "Рівень падав ще до сигналу про зупинку.", "Асистент дивиться історію рівня"],
              ["Інструкція насоса", "В інструкції є умови запуску й подачі.", "Асистент звіряється з інструкцією"]
            ]
          }
        }
      }
    },
    en: {
      trends: {
        "12": "On 12 April the pressure fell from 2.9 to 1.4 bar.",
        "18": "On 18 April the pressure fell from 2.8 to 1.6 bar.",
        "24": "On 24 April some records are missing. The pressure at the moment of the stoppage is unknown."
      },
      axisLabels: ["−5 min", "−4", "−3", "−2", "−1", "Stop"],
      events: {
        level: ["LT-101 · Low level", "The level in the feed hopper was low 4 seconds before the line stopped."],
        pressure: ["PT-204 · Pressure drop", "Pressure fell 2 seconds after the low-level alarm was triggered."],
        stop: ["Line B · Stoppage", "The log recorded the stoppage at 10:42:20. The feed needs to be checked to find the cause."]
      },
      sources: {
        scada: ["Events and measurements", "The records show what happened first: the level drop, the pressure change or the stoppage.", "Example: event log and level chart."],
        plc: ["Start-up conditions", "The controller program shows under which conditions the equipment can start.", "Example: which signals the pump needs to start."],
        docs: ["How the equipment should work", "Manuals and diagrams help compare operating conditions and find what to review.", "Example: the manual section on starting the pump."],
        team: ["What has already been checked", "An engineer records a confirmed case. The next shift can find it if the problem comes back.", "Example: what was checked last time and what it showed."]
      },
      reports: {
        engineer: ["Shift handover", "Before line B stopped, a low level at LT-101 and a pressure drop at PT-204 were recorded. At 10:24:10 the P-204 start threshold was changed from 35% to 15%. Check the actual feed and the start-up conditions. The check result has not been recorded yet."],
        manager: ["Summary for the manager", "The shift's priority is to deal with the repeated stoppages of line B. The team needs to check the feed and assess the possible impact of the threshold change. There is no confirmed cause yet."]
      },
      resources: {
        energy: [
          "144 kWh", "168 kWh", "0.12 → 0.14 kWh",
          "Where should we look for the excess electricity use?",
          "For the same output, shift B used 24 kWh more.",
          "Compare the meter readings with the work schedule. Look separately at consumption while nothing was produced."
        ],
        water: [
          "4,200 L", "4,800 L", "3.5 → 4.0 L",
          "Where should we look for the excess water use?",
          "For the same output, shift B used 600 L more.",
          "Compare the meter readings with the cleaning records. Check whether the duration or the number of cycles differed."
        ]
      },
      deployments: {
        local: ["In the company's own infrastructure", "Stays within the defined perimeter", "Computing and processing under company policies"],
        cloud: ["In an approved cloud environment", "Only approved context reaches the model", "Cloud resources, transfer and storage as agreed by contract"]
      },
      walkthrough: {
        pause: "Pause",
        play: "Play",
        steps: ["The engineer asks a question", null, null, null, "The assistant compares the records", "The engineer gets a hint"],
        cases: {
          resources: {
            question: "Why did the same output take more electricity?",
            answerTitle: "Start with the idle periods.",
            answer: "The meter shows consumption even when the area produced nothing.",
            limit: "First find out what consumption the operating rules require at those times.",
            sources: [
              ["Meter", "Consumption rose from 144 to 168 kWh.", "The assistant reads the meter"],
              ["Output", "Both shifts produced 1,200 units each.", "The assistant compares the output"],
              ["Work schedule", "Part of the consumption fell in periods without production.", "The assistant checks the work schedule"]
            ]
          },
          incident: {
            question: "Line B has stopped. What should I check first?",
            answerTitle: "Check the feed to the pump.",
            answer: "Inlet level and pressure dropped before the stoppage. A feed shortage could explain this.",
            limit: "There is no flow data. The cause still has to be verified.",
            sources: [
              ["Event log", "Level and pressure dropped before the stoppage.", "The assistant reads the event log"],
              ["Level history", "The level was falling even before the stop signal.", "The assistant looks at the level history"],
              ["Pump manual", "The manual lists the start-up and feed conditions.", "The assistant checks the manual"]
            ]
          }
        }
      }
    },
    de: {
      trends: {
        "12": "Am 12. April fiel der Druck von 2,9 auf 1,4 bar.",
        "18": "Am 18. April fiel der Druck von 2,8 auf 1,6 bar.",
        "24": "Am 24. April fehlen Teile der Aufzeichnungen. Der Druck im Moment des Stillstands ist unbekannt."
      },
      axisLabels: ["−5 min", "−4", "−3", "−2", "−1", "Stopp"],
      events: {
        level: ["LT-101 · Niedriger Füllstand", "Der Füllstand im Aufgabebunker war 4 Sekunden vor dem Linienstillstand niedrig."],
        pressure: ["PT-204 · Druckabfall", "Der Druck sank 2 Sekunden nach Auslösen des Niedrigstand-Signals."],
        stop: ["Linie B · Stillstand", "Das Protokoll verzeichnete den Stillstand um 10:42:20. Um die Ursache zu klären, muss die Zufuhr geprüft werden."]
      },
      sources: {
        scada: ["Ereignisse und Messwerte", "Die Aufzeichnungen zeigen, was zuerst geschah: Füllstandsabfall, Druckänderung oder Stillstand.", "Beispiel: Ereignisprotokoll und Füllstandsverlauf."],
        plc: ["Anlaufbedingungen", "Das Steuerungsprogramm zeigt, unter welchen Bedingungen die Anlage anlaufen kann.", "Beispiel: welche Signale die Pumpe zum Anlaufen braucht."],
        docs: ["Wie die Anlage arbeiten soll", "Anleitungen und Schaltpläne helfen, Betriebsbedingungen abzugleichen und zu finden, was zu prüfen ist.", "Beispiel: der Abschnitt der Anleitung zum Anlauf der Pumpe."],
        team: ["Was bereits geprüft wurde", "Ein Ingenieur hält einen bestätigten Fall fest. Die nächste Schicht findet ihn, wenn das Problem wieder auftritt.", "Beispiel: was beim letzten Mal geprüft wurde und was sich zeigte."]
      },
      reports: {
        engineer: ["Schichtübergabe", "Vor dem Stillstand von Linie B wurden ein niedriger Füllstand an LT-101 und ein Druckabfall an PT-204 erfasst. Um 10:24:10 wurde die Anlaufschwelle von P-204 von 35 % auf 15 % geändert. Tatsächliche Zufuhr und Anlaufbedingungen prüfen. Das Prüfergebnis ist noch nicht eingetragen."],
        manager: ["Überblick für die Leitung", "Priorität der Schicht ist es, die wiederholten Stillstände von Linie B zu klären. Das Team muss die Zufuhr prüfen und die mögliche Auswirkung der Schwellenänderung bewerten. Eine bestätigte Ursache gibt es noch nicht."]
      },
      resources: {
        energy: [
          "144 kWh", "168 kWh", "0,12 → 0,14 kWh",
          "Wo liegt der Mehrverbrauch an Strom?",
          "Bei gleicher Menge verbrauchte Schicht B 24 kWh mehr.",
          "Gleichen Sie die Zählerstände mit dem Arbeitsplan ab. Prüfen Sie gesondert den Verbrauch in Zeiten ohne Produktion."
        ],
        water: [
          "4.200 l", "4.800 l", "3,5 → 4,0 l",
          "Wo liegt der Mehrverbrauch an Wasser?",
          "Bei gleicher Menge verbrauchte Schicht B 600 l mehr.",
          "Gleichen Sie die Zählerstände mit den Spülprotokollen ab. Prüfen Sie, ob sich Dauer oder Anzahl der Zyklen unterschieden."
        ]
      },
      deployments: {
        local: ["In der eigenen Infrastruktur des Unternehmens", "Bleibt im festgelegten Perimeter", "Rechenleistung und Verarbeitung nach Unternehmensrichtlinien"],
        cloud: ["In einer freigegebenen Cloud-Umgebung", "Nur freigegebener Kontext gelangt zum Modell", "Cloud-Ressourcen, Übertragung und Speicherung laut Vereinbarung"]
      },
      walkthrough: {
        pause: "Pause",
        play: "Abspielen",
        steps: ["Der Ingenieur stellt eine Frage", null, null, null, "Der Assistent gleicht die Aufzeichnungen ab", "Der Ingenieur erhält einen Hinweis"],
        cases: {
          resources: {
            question: "Warum wurde für dieselbe Menge mehr Strom verbraucht?",
            answerTitle: "Beginnen Sie mit den Zeiten ohne Produktion.",
            answer: "Der Zähler zeigt Verbrauch, auch wenn der Bereich nichts produziert hat.",
            limit: "Klären Sie zuerst, welcher Verbrauch in dieser Zeit laut Vorgabe nötig ist.",
            sources: [
              ["Zähler", "Der Verbrauch stieg von 144 auf 168 kWh.", "Der Assistent liest den Zähler"],
              ["Produktionsmenge", "Beide Schichten produzierten je 1.200 Einheiten.", "Der Assistent vergleicht die Produktionsmenge"],
              ["Arbeitsplan", "Ein Teil des Verbrauchs fiel in Zeiten ohne Produktion.", "Der Assistent prüft den Arbeitsplan"]
            ]
          },
          incident: {
            question: "Linie B steht. Was prüfe ich zuerst?",
            answerTitle: "Prüfen Sie die Zufuhr zur Pumpe.",
            answer: "Vor dem Stillstand sanken Eingangsfüllstand und Druck. Eine zu geringe Zufuhr könnte das erklären.",
            limit: "Es gibt keine Durchflussdaten. Die Ursache muss noch geprüft werden.",
            sources: [
              ["Ereignisprotokoll", "Füllstand und Druck sanken vor dem Stillstand.", "Der Assistent liest das Ereignisprotokoll"],
              ["Füllstandsverlauf", "Der Füllstand sank schon vor dem Stillstandssignal.", "Der Assistent sieht sich den Füllstandsverlauf an"],
              ["Pumpenanleitung", "Die Anleitung nennt Anlauf- und Zufuhrbedingungen.", "Der Assistent gleicht mit der Anleitung ab"]
            ]
          }
        }
      }
    }
  };

  // Attribute → how to read and write the translated value.
  const bindings = [
    ["data-i18n", el => el.textContent, (el, value) => { el.textContent = value; }],
    ["data-i18n-aria", el => el.getAttribute("aria-label"), (el, value) => el.setAttribute("aria-label", value)],
    ["data-i18n-href", el => el.getAttribute("href"), (el, value) => el.setAttribute("href", value)],
    ["data-i18n-content", el => el.getAttribute("content"), (el, value) => el.setAttribute("content", value)]
  ];
  const sourceText = {};
  let sourceCaptured = false;

  function savedLanguage() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } // Storage can be blocked.
  }

  function browserLanguage() {
    const preferences = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
    for (const preference of preferences) {
      const code = String(preference).toLowerCase();
      if (code.startsWith("uk")) return "ua";
      if (code.startsWith("de")) return "de";
      if (code.startsWith("en")) return "en";
    }
    return DEFAULT_LANGUAGE;
  }

  function captureSourceText() {
    if (sourceCaptured) return;
    bindings.forEach(([attribute, read]) => {
      document.querySelectorAll(`[${attribute}]`).forEach(el => {
        sourceText[`${attribute}:${el.getAttribute(attribute)}`] = read(el);
      });
    });
    sourceCaptured = true;
  }

  function applyPage(language) {
    captureSourceText();
    bindings.forEach(([attribute, , write]) => {
      document.querySelectorAll(`[${attribute}]`).forEach(el => {
        const key = el.getAttribute(attribute);
        const value = language === "ua" ? sourceText[`${attribute}:${key}`] : page[language][key];
        if (value === undefined) console.warn(`Missing ${language} translation for ${attribute}="${key}"`);
        else write(el, value);
      });
    });
  }

  function updateSwitcher() {
    document.querySelectorAll(".lang-btns [data-lang]").forEach(button => {
      const active = button.dataset.lang === api.language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setLanguage(language, { save = false } = {}) {
    if (!Object.hasOwn(locales, language)) language = DEFAULT_LANGUAGE;
    api.language = language;
    document.documentElement.lang = locales[language].lang;
    applyPage(language);
    updateSwitcher();
    if (save) {
      try { localStorage.setItem(STORAGE_KEY, language); } catch { /* Storage can be blocked. */ }
    }
    document.dispatchEvent(new CustomEvent("sig:languagechange", { detail: { language } }));
  }

  const initial = savedLanguage();
  const api = {
    language: Object.hasOwn(locales, initial) ? initial : browserLanguage(),
    get content() { return content[api.language]; },
    get numberLocale() { return locales[api.language].numbers; },
    setLanguage
  };
  window.SIG_I18N = api;

  // Pick the language before the first paint; hide the Ukrainian source text until it is replaced.
  const root = document.documentElement;
  root.lang = locales[api.language].lang;
  const reveal = () => {
    void root.offsetWidth; // Apply the translated state first, so the switcher does not animate into it.
    root.classList.remove("lang-pending");
  };
  if (api.language !== "ua") {
    root.classList.add("lang-pending");
    window.setTimeout(reveal, 2500); // Never leave the page hidden if something goes wrong.
  }

  document.addEventListener("DOMContentLoaded", () => {
    try {
      captureSourceText();
      if (api.language !== "ua") applyPage(api.language);
      updateSwitcher();
      document.querySelectorAll(".lang-btns [data-lang]").forEach(button => {
        button.addEventListener("click", () => setLanguage(button.dataset.lang, { save: true }));
      });
    } finally {
      reveal();
    }
  });
})();
