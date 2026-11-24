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
      pageTitle: "Sintelligence · Industrial AI assistant by Smart Industry Group",
      metaDescription: "Sintelligence, the industrial AI assistant by Smart Industry Group, helps you find resource losses, analyse downtime and keep your team's know-how.",
      skipLink: "Skip to content",
      brandHome: "Sintelligence — back to top",
      brandBy: "by Smart Industry Group",
      companyUrl: "https://sig-automation.com/en",
      navLabel: "Presentation sections",
      navDemo: "How it works",
      navExamples: "Examples",
      navPilot: "Where to start",
      languageLabel: "Language",
      headerContact: "Contact SIG",
      contactsUrl: "https://sig-automation.com/en#contacts",
      heroTitle1: "Industrial",
      heroTitle2: "AI assistant",
      heroText: "Where can you save resources, cut downtime or remove manual work? Sintelligence looks for the answer in your data, shows its sources and suggests the next step.",
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
      assistantName: "Sintelligence",
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
      intHint: "Hover over or tap a logo to discover a fact about it.",
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
      footerNote: "Sintelligence is a product of Smart Industry Group · Illustrative scenarios and data",
      footerNavLabel: "Company information",
      footerContacts: "Contact on the SIG website",
      footerImprint: "Legal notice",
      footerPrivacy: "Privacy policy"
    },
    de: {
      pageTitle: "Sintelligence · Industrieller KI-Assistent von Smart Industry Group",
      metaDescription: "Sintelligence, der industrielle KI-Assistent der Smart Industry Group, hilft, Ressourcenverluste zu finden, Stillstände zu analysieren und das Wissen des Teams zu bewahren.",
      skipLink: "Zum Inhalt springen",
      brandHome: "Sintelligence — zum Seitenanfang",
      brandBy: "von Smart Industry Group",
      companyUrl: "https://sig-automation.com/de",
      navLabel: "Abschnitte der Präsentation",
      navDemo: "So funktioniert es",
      navExamples: "Beispiele",
      navPilot: "Erste Schritte",
      languageLabel: "Sprache",
      headerContact: "Kontakt SIG",
      contactsUrl: "https://sig-automation.com/de#contacts",
      heroTitle1: "Industrieller",
      heroTitle2: "KI-Assistent",
      heroText: "Wo lassen sich Ressourcen sparen, Stillstände verkürzen oder manuelle Arbeit vermeiden? Sintelligence sucht die Antwort in Ihren Daten, zeigt die Quellen und schlägt den nächsten Schritt vor.",
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
      assistantName: "Sintelligence",
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
      intHint: "Bewegen Sie die Maus über ein Logo oder tippen Sie darauf, um einen spannenden Fakt zu entdecken.",
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
      footerNote: "Sintelligence ist ein Produkt der Smart Industry Group · Fiktive Szenarien und Daten",
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
      facts: {
        siemens: "Заснована в Берліні 1847 року Вернером фон Сіменсом. Бренд автоматизації SIMATIC існує з 1958 року, а контролери SIMATIC — одні з найпоширеніших на європейських заводах.",
        schneider: "Французька група з історією від 1836 року. Її бренд Modicon створив один із перших ПЛК у 1968 році, а 1979-го — протокол Modbus.",
        rockwell: "Allen-Bradley заснована в Мілвокі 1903 року і є головним брендом Rockwell Automation. Контролери Logix «розмовляють» EtherNet/IP без додаткових модулів.",
        beckhoff: "Сімейна компанія з Ферля (Вестфалія), заснована 1980 року. Beckhoff винайшла EtherCAT у 2003 році й відома керуванням на базі ПК — TwinCAT.",
        abb: "Утворена 1988 року злиттям шведської ASEA та швейцарської Brown, Boveri & Cie. 1974 року ASEA випустила IRB 6 — один із перших повністю електричних промислових роботів із мікропроцесорним керуванням.",
        mitsubishi: "Заснована в Токіо 1921 року. Контролери MELSEC і мережа CC-Link (1996) поширені на азійських та автомобільних заводах.",
        bnr: "Bernecker + Rainer з австрійського Еггельсберга, заснована 1979 року, з 2017-го — частина ABB. B&R створила відкритий Ethernet реального часу POWERLINK.",
        bosch: "Історія починається 1795 року з кузні родини Рексрот у Шпессарті. Сьогодні ця дочірня компанія Bosch із Лора-на-Майні виробляє гідравліку, приводи й системи керування.",
        omron: "Заснована в Японії 1933 року; назва походить від району Омуро в Кіото, де був її ранній завод. 1967 року Omron допомогла створити першу у світі безлюдну залізничну станцію з автоматичними турнікетами.",
        phoenix: "Заснована в Ессені 1923 року, нині розташована в Бломберзі. 1928 року Phoenix Contact представила модульну клемну колодку — сьогодні вона є майже в кожній шафі керування.",
        wago: "Сімейна компанія з Міндена, заснована 1951 року. WAGO зробила популярними безгвинтові пружинні з'єднання; її CAGE CLAMP з'явилася 1977 року.",
        festo: "Назва поєднує прізвища засновників Фецера і Штолля (Есслінген, 1925). Festo — лідер пневматики, що створює роботів, натхненних природою, як-от літаючого SmartBird.",
        more: "Старі машини без мережевого порту можна підключити через шлюзи або додаткові датчики, тож працююче обладнання не треба замінювати.",
        opcua: "Опублікований 2008 року і стандартизований як IEC 62541. На відміну від класичних польових шин, передає не лише значення, а й їхній зміст, і має вбудоване шифрування та автентифікацію.",
        profinet: "Стандарт промислового Ethernet від PROFIBUS & PROFINET International з Карлсруе. За даними HMS Networks, на нього припадає близько 30% нових вузлів промислових мереж — більше, ніж на будь-яку іншу мережу.",
        profibus: "Запущена в Німеччині 1989 року — одна з найпоширеніших польових шин в історії. На ній досі працюють десятки мільйонів пристроїв.",
        ethercat: "Розроблена Beckhoff 2003 року. Кожен пристрій читає й записує дані, поки кадр проходить крізь нього «на льоту», тому цикл може бути коротшим за 100 мкс.",
        ethernetip: "«IP» тут означає Industrial Protocol, а не Internet Protocol. З 2001 року стандартом опікується ODVA; це друга за поширеністю промислова мережа у світі.",
        modbus: "Створений Modicon 1979 року і безкоштовний для використання. Modbus старший за IBM PC і досі є спільною мовою лічильників, приводів і датчиків.",
        iolink: "Перший міжнародно стандартизований інтерфейс «точка-точка» для датчиків і виконавчих пристроїв (IEC 61131-9). Працює зі звичайним неекранованим кабелем і дозволяє змінювати налаштування датчика дистанційно.",
        canopen: "Побудований на шині CAN, яку Bosch розробила для автомобілів у 1980-х, і підтримується CAN in Automation з Нюрнберга. Поширений у мобільних машинах, медичній техніці та ліфтах.",
        mqtt: "Винайдений 1999 року для моніторингу нафтопроводів через дорогий супутниковий зв'язок, тому надзвичайно легкий. Сьогодні це стандарт OASIS та ISO й основа багатьох IIoT-платформ.",
        s7: "Контролери SIMATIC S7 обмінюються даними за протоколом S7 через TCP-порт 102. Серія S7-300, випущена в середині 1990-х, досі працює на багатьох заводах.",
        postgresql: "Виросла з проєкту POSTGRES в Університеті Каліфорнії в Берклі (1986) і повністю відкрита. З 2023 року — найпопулярніша база даних серед розробників за опитуванням Stack Overflow.",
        mssql: "Перша версія вийшла 1989 року разом із Sybase. Часто є основою MES, систем архівування даних та ERP на заводах із Windows.",
        oracle: "Oracle Version 2 (1979) стала першою комерційно доступною SQL-базою даних. Версії 1 ніколи не було: засновники вважали, що другій версії клієнти довірятимуть більше.",
        mysql: "Випущена 1995 року шведською компанією MySQL AB. Названа на честь Мю (My), доньки співзасновника Міхаеля «Монті» Віденіуса.",
        mariadb: "Відгалуження MySQL, яке 2009 року започаткував сам автор MySQL. Назване на честь його молодшої доньки Марії й повністю відкрите.",
        mongodb: "Назва походить від англійського «humongous» — величезний. Випущена 2009 року, зберігає гнучкі JSON-подібні документи замість жорстких таблиць.",
        influxdb: "Відкрита база часових рядів із 2013 року, створена для нескінченних потоків показів датчиків із мітками часу.",
        timescale: "Розширення, яке перетворює PostgreSQL на базу часових рядів, тож дані процесу можна аналізувати звичайним SQL.",
        sqlite: "Імовірно, найпоширеніша база даних у світі: вона працює в кожному смартфоні й браузері. Її вихідний код є суспільним надбанням.",
        hana: "Колонкова база даних SAP, що працює в оперативній пам'яті, випущена 2010 року. SAP S/4HANA працює тільки на ній.",
        sap: "Заснована 1972 року п'ятьма колишніми працівниками IBM; найбільша софтверна компанія Європи. S/4HANA (2015) — її нинішнє покоління ERP.",
        dynamics: "ERP- і CRM-пакет Microsoft з 2016 року. Редакція Business Central походить від данської ERP Navision, популярної серед німецьких середніх підприємств.",
        datev: "Кооператив податкових консультантів, заснований у Нюрнберзі 1966 року. DATEV — стандартна програма німецьких податкових консультантів, тож облікові дані часто потрапляють саме туди.",
        odoo: "Відкрита ERP з Бельгії, що почалася 2005 року як TinyERP. Модульні застосунки охоплюють склад, виробництво й бухгалтерію.",
        sage: "Заснована 1981 року в Ньюкаслі (Велика Британія). Облікові та ERP-програми Sage широко використовують малі й середні компанії, зокрема в Німеччині.",
        mes: "Системи керування виробництвом (MES) поєднують ERP і цех. Стандарт ISA-95 (IEC 62264) описує, як між ними передаються замовлення й виробничі дані.",
        wms: "Системи керування складом відстежують кожну палету й комірку. Разом із виробничими даними вони показують, через нестачу якого матеріалу насправді стоїть лінія.",
        cmms: "Системи техобслуговування зберігають наряди й історію ремонтів — саме той досвід команди, який асистент може знайти, коли несправність повториться.",
        mcp: "Відкритий стандарт, який Anthropic представила в листопаді 2024 року; його вже підтримують OpenAI, Google і Microsoft. Його називають «USB-C для AI»: один інтерфейс з'єднує моделі з інструментами й даними.",
        llama: "Сімейство моделей Meta з відкритими вагами, перший випуск — лютий 2023 року. Ваги можна завантажити й запускати на власних серверах.",
        mistral: "Заснована в Парижі 2023 року. Першу модель, Mistral 7B, опублікували за ліцензією Apache 2.0 через торент-посилання — європейський варіант для локального AI.",
        qwen: "Сімейство моделей Alibaba Cloud. Багато версій мають відкриті ваги за ліцензією Apache 2.0 і належать до найпопулярніших основ для донавчання на Hugging Face.",
        deepseek: "DeepSeek-R1 вийшла в січні 2025 року з відкритими вагами за ліцензією MIT. Через низьку заявлену вартість навчання ринкова вартість NVIDIA за день упала на сотні мільярдів доларів.",
        gemma: "Відкриті моделі Google, створені на основі тих самих досліджень, що й Gemini; перший випуск — лютий 2024 року. Малі версії працюють на одному GPU чи навіть на ноутбуці.",
        gptoss: "Перші моделі OpenAI з відкритими вагами після GPT-2 (2019), випущені в серпні 2025 року за ліцензією Apache 2.0. Менша модель працює на комп'ютері з 16 ГБ пам'яті.",
        ollama: "Відкритий інструмент (ліцензія MIT), що завантажує й запускає локальні мовні моделі однією командою, — зручно для першого пілоту на власному сервері.",
        vllm: "Відкритий рушій для запуску моделей з Університету Каліфорнії в Берклі (2023). Техніка PagedAttention керує пам'яттю GPU як віртуальною пам'яттю операційної системи, тож одночасно обслуговує багатьох користувачів.",
        nvidia: "Відтоді як CUDA (2007) зробила відеокарти придатними для загальних обчислень, GPU NVIDIA стали стандартним обладнанням для AI. Для локальних моделей вистачає однієї карти в робочій станції."
      },
      walkthrough: {
        pause: "Пауза",
        play: "Відтворити",
        thinking: "Думає · {s} с",
        thought: "Думав {s} с",
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
      facts: {
        siemens: "Founded in Berlin in 1847 by Werner von Siemens. Its SIMATIC automation brand dates back to 1958, and SIMATIC controllers are among the most common in European factories.",
        schneider: "A French group with roots in 1836. Its Modicon brand built one of the very first PLCs in 1968 and invented the Modbus protocol in 1979.",
        rockwell: "Allen-Bradley was founded in Milwaukee in 1903 and is Rockwell Automation's main brand. Its Logix controllers speak EtherNet/IP natively.",
        beckhoff: "Family company from Verl in Westphalia, founded in 1980. Beckhoff invented EtherCAT in 2003 and is known for PC-based control with TwinCAT.",
        abb: "Formed in 1988 from Sweden's ASEA and Switzerland's Brown, Boveri & Cie. In 1974 ASEA launched the IRB 6, one of the first all-electric, microprocessor-controlled industrial robots.",
        mitsubishi: "Founded in Tokyo in 1921. Its MELSEC controllers and the CC-Link network, introduced in 1996, are widespread in Asian and automotive plants.",
        bnr: "Bernecker + Rainer from Eggelsberg, Austria, founded in 1979 and part of ABB since 2017. B&R created the open real-time Ethernet POWERLINK.",
        bosch: "Its roots go back to a hammer mill run by the Rexroth family in the Spessart from 1795. Today the Bosch subsidiary from Lohr am Main builds hydraulics, drives and controls.",
        omron: "Founded in Japan in 1933; the name comes from Omuro, the Kyoto district of its early factory. In 1967 Omron helped build the world's first unmanned railway station with automatic ticket gates.",
        phoenix: "Founded in Essen in 1923 and now based in Blomberg. Phoenix Contact introduced the modular terminal block in 1928; today it sits in almost every control cabinet.",
        wago: "Family company from Minden, founded in 1951. WAGO made screwless spring-clamp connections popular; its CAGE CLAMP dates from 1977.",
        festo: "The name combines the founders Fezer and Stoll (Esslingen, 1925). Festo is a leader in pneumatics and builds robots inspired by nature, such as the flying SmartBird.",
        more: "Older machines without a network port can be connected through gateways or retrofitted sensors, so working equipment does not have to be replaced.",
        opcua: "Published in 2008 and standardised as IEC 62541. Unlike a classic fieldbus it carries meaning, not just values, and has encryption and user authentication built in.",
        profinet: "Industrial Ethernet standard from PROFIBUS & PROFINET International in Karlsruhe. According to HMS Networks it accounts for about 30% of new industrial network nodes, more than any other network.",
        profibus: "Launched in Germany in 1989 and one of the most widely installed fieldbuses ever. Tens of millions of devices still run on it.",
        ethercat: "Developed by Beckhoff in 2003. Each device reads and writes its data while the frame passes through it “on the fly”, which allows cycle times below 100 µs.",
        ethernetip: "The “IP” stands for Industrial Protocol, not Internet Protocol. Managed by ODVA since 2001, it is the second most common industrial network in the world.",
        modbus: "Created by Modicon in 1979 and free of licence fees. Modbus is older than the IBM PC and is still the common language of meters, drives and sensors.",
        iolink: "The first internationally standardised point-to-point link for sensors and actuators (IEC 61131-9). It uses ordinary unshielded cables and lets you change sensor settings remotely.",
        canopen: "Built on the CAN bus that Bosch developed for cars in the 1980s and maintained by CAN in Automation in Nuremberg. Common in mobile machines, medical devices and lifts.",
        mqtt: "Invented in 1999 to monitor oil pipelines over expensive satellite links, so it is extremely lightweight. Today an OASIS and ISO standard and the backbone of many IIoT platforms.",
        s7: "SIMATIC S7 controllers exchange data over the S7 protocol on TCP port 102. The S7-300 series, introduced in the mid-1990s, still runs in many plants.",
        postgresql: "Grew out of the POSTGRES project at UC Berkeley (1986) and is fully open source. Since 2023 it has been the most used database among developers in the Stack Overflow survey.",
        mssql: "First released in 1989 together with Sybase. A frequent foundation of MES, historian and ERP systems in Windows-based plants.",
        oracle: "Oracle Version 2 (1979) was the first commercially available SQL database. There never was a Version 1: the founders thought customers would trust a second version more.",
        mysql: "Released in 1995 by the Swedish company MySQL AB. It is named after My, the daughter of co-founder Michael “Monty” Widenius.",
        mariadb: "A community fork of MySQL started in 2009 by MySQL's original author. It is named after Maria, his younger daughter, and is fully open source.",
        mongodb: "The name comes from “humongous”. Released in 2009, it stores flexible JSON-like documents instead of fixed tables.",
        influxdb: "Open-source time-series database from 2013, built for endless streams of timestamped sensor values.",
        timescale: "An extension that turns PostgreSQL into a time-series database, so process data can be queried with plain SQL.",
        sqlite: "Probably the most widely deployed database in the world: it runs inside every smartphone and web browser. Its source code is in the public domain.",
        hana: "SAP's in-memory, column-oriented database, launched in 2010. SAP S/4HANA runs exclusively on it.",
        sap: "Founded in 1972 by five former IBM employees, SAP is Europe's largest software company. S/4HANA, launched in 2015, is its current ERP generation.",
        dynamics: "Microsoft's ERP and CRM suite since 2016. Its Business Central edition descends from Navision, a Danish ERP that is popular in the German Mittelstand.",
        datev: "A cooperative founded by tax advisors in Nuremberg in 1966. DATEV is the standard software of German tax advisors, so accounting data often ends up there.",
        odoo: "Open-source ERP from Belgium, started in 2005 as TinyERP. Its modular apps cover inventory, manufacturing and accounting.",
        sage: "Founded in 1981 in Newcastle upon Tyne, UK. Sage accounting and ERP software is widely used by small and mid-sized companies, also in Germany.",
        mes: "Manufacturing Execution Systems connect ERP and the shop floor. The ISA-95 standard (IEC 62264) defines how orders and production data flow between them.",
        wms: "Warehouse Management Systems track every pallet and storage location. Combined with production data they show which missing material really stops a line.",
        cmms: "Maintenance systems store work orders and repair history: exactly the team experience the assistant can search when a fault comes back.",
        mcp: "An open standard introduced by Anthropic in November 2024 and since adopted by OpenAI, Google and Microsoft. Often called the “USB-C port for AI”: one interface connects models to tools and data.",
        llama: "Meta's open-weight model family, first released in February 2023. The weights can be downloaded and run on your own servers.",
        mistral: "Founded in Paris in 2023. Its first model, Mistral 7B, was published under the Apache 2.0 licence via a torrent link: a European option for local AI.",
        qwen: "Alibaba Cloud's model family. Many versions are open-weight under Apache 2.0 and are among the most popular bases for fine-tuning on Hugging Face.",
        deepseek: "DeepSeek-R1 was released in January 2025 with open weights under the MIT licence. Its low reported training cost briefly wiped hundreds of billions of dollars off NVIDIA's market value.",
        gemma: "Google's open models, built from the same research as Gemini and first released in February 2024. Small versions run on a single GPU or even a laptop.",
        gptoss: "OpenAI's first open-weight language models since GPT-2 (2019), released in August 2025 under Apache 2.0. The smaller model runs on a machine with 16 GB of memory.",
        ollama: "Open-source tool (MIT licence) that downloads and runs local language models with a single command, handy for a first on-premise pilot.",
        vllm: "Open-source inference engine from UC Berkeley (2023). Its PagedAttention technique manages GPU memory like an operating system's virtual memory, so many users can be served at once.",
        nvidia: "Since CUDA (2007) made graphics cards programmable for general computing, NVIDIA GPUs have become the standard hardware for AI. One workstation card is enough for local models."
      },
      walkthrough: {
        pause: "Pause",
        play: "Play",
        thinking: "Thinking · {s} s",
        thought: "Thought for {s} s",
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
      facts: {
        siemens: "1847 in Berlin von Werner von Siemens gegründet. Die Automatisierungsmarke SIMATIC gibt es seit 1958, und SIMATIC-Steuerungen gehören zu den häufigsten in europäischen Fabriken.",
        schneider: "Französischer Konzern mit Wurzeln im Jahr 1836. Seine Marke Modicon baute 1968 eine der allerersten SPS und erfand 1979 das Modbus-Protokoll.",
        rockwell: "Allen-Bradley wurde 1903 in Milwaukee gegründet und ist die Hauptmarke von Rockwell Automation. Die Logix-Steuerungen sprechen EtherNet/IP von Haus aus.",
        beckhoff: "Familienunternehmen aus Verl in Westfalen, gegründet 1980. Beckhoff erfand 2003 EtherCAT und ist für PC-basierte Steuerungstechnik mit TwinCAT bekannt.",
        abb: "1988 aus der schwedischen ASEA und der Schweizer Brown, Boveri & Cie entstanden. 1974 brachte ASEA mit dem IRB 6 einen der ersten vollelektrischen, mikroprozessorgesteuerten Industrieroboter auf den Markt.",
        mitsubishi: "1921 in Tokio gegründet. Die MELSEC-Steuerungen und das 1996 eingeführte CC-Link-Netzwerk sind in asiatischen Werken und in der Autoindustrie weit verbreitet.",
        bnr: "Bernecker + Rainer aus Eggelsberg in Österreich, gegründet 1979, seit 2017 Teil von ABB. B&R entwickelte das offene Echtzeit-Ethernet POWERLINK.",
        bosch: "Die Wurzeln reichen bis zu einem Hammerwerk der Familie Rexroth im Spessart im Jahr 1795. Heute baut die Bosch-Tochter aus Lohr am Main Hydraulik, Antriebe und Steuerungen.",
        omron: "1933 in Japan gegründet; der Name stammt von Omuro, dem Kyotoer Stadtteil des frühen Werks. 1967 half Omron, den weltweit ersten unbemannten Bahnhof mit automatischen Fahrkartensperren zu bauen.",
        phoenix: "1923 in Essen gegründet, heute in Blomberg ansässig. Phoenix Contact stellte 1928 die modulare Reihenklemme vor – heute steckt sie in fast jedem Schaltschrank.",
        wago: "Familienunternehmen aus Minden, gegründet 1951. WAGO machte die schraubenlose Federklemmtechnik populär; die CAGE CLAMP stammt aus dem Jahr 1977.",
        festo: "Der Name verbindet die Gründer Fezer und Stoll (Esslingen, 1925). Festo ist führend in der Pneumatik und baut von der Natur inspirierte Roboter wie den fliegenden SmartBird.",
        more: "Ältere Maschinen ohne Netzwerkanschluss lassen sich über Gateways oder nachgerüstete Sensoren anbinden – funktionierende Anlagen müssen nicht ersetzt werden.",
        opcua: "2008 veröffentlicht und als IEC 62541 genormt. Anders als ein klassischer Feldbus überträgt OPC UA nicht nur Werte, sondern auch ihre Bedeutung, und hat Verschlüsselung und Benutzerauthentifizierung eingebaut.",
        profinet: "Industrial-Ethernet-Standard von PROFIBUS & PROFINET International aus Karlsruhe. Laut HMS Networks entfallen etwa 30 % aller neuen Industrienetzwerk-Knoten darauf – mehr als auf jedes andere Netzwerk.",
        profibus: "1989 in Deutschland eingeführt und einer der meistinstallierten Feldbusse überhaupt. Noch heute laufen Dutzende Millionen Geräte damit.",
        ethercat: "2003 von Beckhoff entwickelt. Jedes Gerät liest und schreibt seine Daten, während der Frame „on the fly“ durchläuft – das ermöglicht Zykluszeiten unter 100 µs.",
        ethernetip: "Das „IP“ steht für Industrial Protocol, nicht für Internet Protocol. Seit 2001 von der ODVA betreut, ist es das weltweit zweithäufigste Industrienetzwerk.",
        modbus: "1979 von Modicon entwickelt und lizenzgebührenfrei. Modbus ist älter als der IBM-PC und bis heute die gemeinsame Sprache von Zählern, Antrieben und Sensoren.",
        iolink: "Die erste international genormte Punkt-zu-Punkt-Schnittstelle für Sensoren und Aktoren (IEC 61131-9). Sie nutzt einfache ungeschirmte Kabel und erlaubt es, Sensoreinstellungen aus der Ferne zu ändern.",
        canopen: "Basiert auf dem CAN-Bus, den Bosch in den 1980er-Jahren für Autos entwickelte, und wird von CAN in Automation in Nürnberg gepflegt. Verbreitet in mobilen Maschinen, Medizintechnik und Aufzügen.",
        mqtt: "1999 erfunden, um Ölpipelines über teure Satellitenverbindungen zu überwachen – deshalb extrem schlank. Heute OASIS- und ISO-Standard und Rückgrat vieler IIoT-Plattformen.",
        s7: "SIMATIC-S7-Steuerungen tauschen Daten über das S7-Protokoll auf TCP-Port 102 aus. Die Mitte der 1990er-Jahre eingeführte S7-300 läuft noch in vielen Werken.",
        postgresql: "Entstand aus dem POSTGRES-Projekt der UC Berkeley (1986) und ist vollständig Open Source. Seit 2023 ist es laut Stack-Overflow-Umfrage die meistgenutzte Datenbank unter Entwicklern.",
        mssql: "Erstmals 1989 zusammen mit Sybase veröffentlicht. Häufige Grundlage für MES-, Historian- und ERP-Systeme in Windows-basierten Werken.",
        oracle: "Oracle Version 2 (1979) war die erste kommerziell erhältliche SQL-Datenbank. Eine Version 1 gab es nie – die Gründer glaubten, Kunden würden einer zweiten Version eher vertrauen.",
        mysql: "1995 von der schwedischen Firma MySQL AB veröffentlicht. Benannt nach My, der Tochter von Mitgründer Michael „Monty“ Widenius.",
        mariadb: "Ein Community-Fork von MySQL, 2009 vom ursprünglichen MySQL-Autor gestartet. Benannt nach seiner jüngeren Tochter Maria und vollständig Open Source.",
        mongodb: "Der Name kommt vom englischen „humongous“ – riesig. Seit 2009 speichert MongoDB flexible JSON-ähnliche Dokumente statt starrer Tabellen.",
        influxdb: "Open-Source-Zeitreihendatenbank aus dem Jahr 2013, gebaut für endlose Ströme von Sensorwerten mit Zeitstempel.",
        timescale: "Eine Erweiterung, die PostgreSQL zur Zeitreihendatenbank macht – Prozessdaten lassen sich mit normalem SQL abfragen.",
        sqlite: "Wahrscheinlich die meistverbreitete Datenbank der Welt: Sie steckt in jedem Smartphone und jedem Webbrowser. Ihr Quellcode ist gemeinfrei.",
        hana: "SAPs spaltenorientierte In-Memory-Datenbank, 2010 eingeführt. SAP S/4HANA läuft ausschließlich darauf.",
        sap: "1972 von fünf ehemaligen IBM-Mitarbeitern gegründet; SAP ist Europas größtes Softwareunternehmen. S/4HANA (2015) ist die aktuelle ERP-Generation.",
        dynamics: "Microsofts ERP- und CRM-Suite seit 2016. Die Edition Business Central stammt von Navision ab, einem dänischen ERP, das im deutschen Mittelstand sehr beliebt ist.",
        datev: "1966 in Nürnberg von Steuerberatern als Genossenschaft gegründet. DATEV ist die Standardsoftware deutscher Steuerberater – Buchhaltungsdaten landen daher oft dort.",
        odoo: "Open-Source-ERP aus Belgien, 2005 als TinyERP gestartet. Modulare Apps decken Lager, Fertigung und Buchhaltung ab.",
        sage: "1981 in Newcastle upon Tyne (Großbritannien) gegründet. Buchhaltungs- und ERP-Software von Sage ist bei kleinen und mittleren Unternehmen verbreitet, auch in Deutschland.",
        mes: "Manufacturing Execution Systems verbinden ERP und Werkhalle. Die Norm ISA-95 (IEC 62264) beschreibt, wie Aufträge und Produktionsdaten zwischen ihnen fließen.",
        wms: "Lagerverwaltungssysteme verfolgen jede Palette und jeden Lagerplatz. Zusammen mit Produktionsdaten zeigen sie, welches fehlende Material eine Linie wirklich stoppt.",
        cmms: "Instandhaltungssysteme speichern Arbeitsaufträge und Reparaturhistorie – genau das Teamwissen, das der Assistent durchsuchen kann, wenn ein Fehler wiederkommt.",
        mcp: "Ein offener Standard, den Anthropic im November 2024 vorstellte und den inzwischen auch OpenAI, Google und Microsoft unterstützen. Oft „USB-C für KI“ genannt: eine Schnittstelle verbindet Modelle mit Werkzeugen und Daten.",
        llama: "Metas Modellfamilie mit offenen Gewichten, erstmals im Februar 2023 veröffentlicht. Die Gewichte lassen sich herunterladen und auf eigenen Servern betreiben.",
        mistral: "2023 in Paris gegründet. Das erste Modell, Mistral 7B, wurde unter der Apache-2.0-Lizenz per Torrent-Link veröffentlicht – eine europäische Option für lokale KI.",
        qwen: "Die Modellfamilie von Alibaba Cloud. Viele Versionen haben offene Gewichte unter Apache 2.0 und gehören zu den beliebtesten Grundlagen für das Feintuning auf Hugging Face.",
        deepseek: "DeepSeek-R1 erschien im Januar 2025 mit offenen Gewichten unter MIT-Lizenz. Die niedrigen angegebenen Trainingskosten ließen den Börsenwert von NVIDIA an einem Tag um Hunderte Milliarden Dollar fallen.",
        gemma: "Googles offene Modelle, aus derselben Forschung wie Gemini entstanden und erstmals im Februar 2024 veröffentlicht. Kleine Versionen laufen auf einer einzelnen GPU oder sogar auf einem Laptop.",
        gptoss: "OpenAIs erste Sprachmodelle mit offenen Gewichten seit GPT-2 (2019), im August 2025 unter Apache 2.0 veröffentlicht. Das kleinere Modell läuft auf einem Rechner mit 16 GB Speicher.",
        ollama: "Open-Source-Werkzeug (MIT-Lizenz), das lokale Sprachmodelle mit einem einzigen Befehl herunterlädt und startet – praktisch für einen ersten On-Premise-Pilot.",
        vllm: "Open-Source-Inferenz-Engine der UC Berkeley (2023). Die Technik PagedAttention verwaltet GPU-Speicher wie den virtuellen Speicher eines Betriebssystems und bedient so viele Nutzer gleichzeitig.",
        nvidia: "Seit CUDA (2007) Grafikkarten für allgemeine Berechnungen programmierbar machte, sind NVIDIA-GPUs die Standardhardware für KI. Für lokale Modelle genügt eine Karte in einer Workstation."
      },
      walkthrough: {
        pause: "Pause",
        play: "Abspielen",
        thinking: "Denkt nach · {s} s",
        thought: "Hat {s} s nachgedacht",
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
    // Static page text by data-i18n key in the current language.
    text(key) {
      if (api.language !== "ua") return page[api.language][key];
      return sourceText[`data-i18n:${key}`] ?? document.querySelector(`[data-i18n="${key}"]`)?.textContent;
    },
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
