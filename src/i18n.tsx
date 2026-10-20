"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "fr";

const en = {
  banner: {
    line: "An open-source civic project by Nshipyard. Not affiliated with the Government of Canada or the City of Toronto.",
    badge: "Open source",
  },
  nav: { explorer: "Storms", chart: "Chart", developers: "Developers", data: "Data", back: "All projects" },
  hero: {
    title: "Toronto parking revenue lost to snowstorms, 2023-2025",
    lead: "13 snowstorms cost an estimated $7.9M over three winters. The largest, in February 2025, cost about $1.6M.",
    sub: "Toronto Parking Authority disclosed one storm in full: in February 2025, snow removal closed 47% of its on-street parking and cost 371,000 paid transactions. This project uses that disclosure to price every major snowfall from 2023 to 2025, with a confidence range on each estimate and a cross-check against parking ticket counts.",
    cta1: "See the storms ranked",
    cta2: "Read the methodology",
  },
  statsLabels: [
    "major storms priced, January 2023 to December 2025",
    "paid parking transactions lost across all 13 storms (estimate)",
    "in parking revenue lost across all 13 storms (estimate)",
    "range on the 3-year revenue total, from the low and high bands",
  ],
  labels: {
    fact: "Fact",
    estimate: "Estimate",
    crossCheck: "Cross-check",
    anchor: "Anchor",
  },
  explorer: {
    kicker: "Storms",
    title: "Every major storm, ranked by estimated cost.",
    body: "A major storm is a run of snow days (1 cm or more per day, one gap day allowed) totalling 5 cm or more. Each row shows the estimate, its low and high band, and what parking ticket counts did in the days around the storm. Rows marked as anchor rows are the two February 2025 waves that the 371,000 disclosed transactions were calibrated on.",
    colStorm: "Storm",
    colSnow: "Snowfall",
    colTransactions: "Transactions lost",
    colRevenue: "Revenue lost",
    colCheck: "Ticket check",
    band: "low to high",
  },
  chart: {
    kicker: "Chart",
    title: "Estimated revenue lost, by storm.",
    body: "Dollars are the midpoint estimate. The February 2025 waves are shown in red: they are the anchor the whole scale comes from. Every other bar is an estimate built from snowfall, not a disclosed figure.",
  },
  method: {
    kicker: "Methodology",
    title: "How a storm gets a price.",
    points: [
      "Step 1, the anchor (fact): Toronto Parking Authority's 2026 Operating Budget report (25 November 2025, page 1) says the lengthy February 2025 snow event closed 47% of on-street inventory for snow removal and caused 371,000 fewer transactions.",
      "Step 2, the snowfall: daily snowfall for Toronto comes from the Open-Meteo archive (ERA5 reanalysis at 43.65N, 79.38W). Environment Canada bulk downloads were unreachable from the build network, so Open-Meteo is the documented substitute. ERA5 is a model estimate, not a station gauge, and it can differ from what fell on a specific street.",
      "Step 3, the rate (inference): the February 2025 episode totals 41.9 cm across two waves (6 to 9 February, 12 to 18 February). Dividing 371,000 transactions by 41.9 cm gives 8,854 transactions lost per centimetre of snowfall. That rate is then applied to every other storm.",
      "Step 4, the money: each transaction is priced at $5.47, the blended rate from TPA's 2025 forecast of $177.3 million in revenue on 32.4 million transactions. The figure blends on-street and off-street parking because TPA does not publish a transactions split; storm losses are mostly on-street, so the true rate may differ.",
      "Step 5, the range: the transactions rate carries a band of plus or minus 30%, which also covers the alternative reading where the 371,000 covers only the larger February wave. The per-transaction price carries plus or minus 10%. Low and high revenue combine both.",
      "Step 6, the cross-check: the City publishes every parking ticket. Daily ticket counts around each storm are compared with a local baseline (28 days on each side, other storm windows removed). Tickets measure enforcement activity on the street. They are not a revenue measure, and where the ticket data disagrees with the estimator, the storm row says so.",
      "What this cannot do: it cannot price a storm whose snow fell but whose parking stayed open, and it assumes every centimetre of snow costs the same in January cold as in March slush. Treat each number as an estimate with a range, not a bill.",
    ],
  },
  developers: {
    kicker: "For developers",
    title: "Query it from code, or from an agent.",
    body: "Three consumption paths, same canonical data. REST for applications, OpenAPI for integration, MCP tools over streamable HTTP for AI agents.",
    endpoints: "Endpoints",
    tryIt: "Try it",
    openapi: "OpenAPI spec",
  },
  downloads: {
    kicker: "Data",
    title: "Take the files.",
    body: "Versioned releases, MIT licensed. The storms dataset, the full daily snowfall series, and the ticket counts used for the cross-check.",
    download: "Download",
  },
  footer: {
    line: "An open-source civic project by Nshipyard. Not affiliated with the Government of Canada or the City of Toronto.",
    sources: "Anchor and rates: Toronto Parking Authority 2026 Operating Budget report (toronto.ca). Snowfall: Open-Meteo archive, ERA5 reanalysis (fallback; Environment Canada bulk download unreachable from the build network). Tickets: City of Toronto Open Data (Parking Tickets).",
  },
  mcp: {
    kicker: "Connect your agent",
    title: "Put this data to work inside your AI tools.",
    body: "Pick your harness, copy the prompt, send it to your agent. Your agent runs the setup itself.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Other" },
    cardTitle: "Copy and send this to {tab}",
    copy: "Copy",
    copied: "Copied",
    chatgptNote: "ChatGPT connects through the documented REST API rather than MCP directly.",
    pChatgpt:
      "I want to use the {displayName} through its API.\n- OpenAPI spec: {origin}/api/openapi.json\n- REST base: {origin}/api/v1\nFirst tell me in two sentences what this API offers, then {exampleLower}, and show me the result.",
    pClaude:
      "In Claude (claude.ai), open Settings, then Connectors, and add a custom connector:\n- Name: {displayName}\n- URL: {origin}/mcp\nThen list the available tools, {exampleLower}, and show me the result.",
    pClaudeCode:
      "Set up the {displayName} MCP server so I can query it from here.\n1. Run: claude mcp add --transport http {slug} {origin}/mcp\n2. Run `claude mcp list` to confirm it connected.\n3. {example}, and show me the result.",
    pCli:
      "# MCP endpoint (streamable HTTP)\n{origin}/mcp\n\n# List the available tools\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Everything else",
    otherBody: "Any harness that speaks MCP over streamable HTTP, or plain REST.",
    mcpEndpoint: "MCP endpoint",
    openapiSpec: "OpenAPI spec",
    restBase: "REST base",
  },
};

type Dict = typeof en;

const fr: Dict = {
  banner: {
    line: "Un projet civique à code source ouvert par Nshipyard. Sans affiliation avec le gouvernement du Canada ni la Ville de Toronto.",
    badge: "Code source ouvert",
  },
  nav: { explorer: "Tempêtes", chart: "Graphique", developers: "Développeurs", data: "Données", back: "Tous les projets" },
  hero: {
    title: "Revenus de stationnement perdus à Toronto à cause des tempêtes de neige, 2023-2025",
    lead: "13 tempêtes de neige ont coûté environ 7,9 M$ sur trois hivers. La plus importante, en février 2025, a coûté environ 1,6 M$.",
    sub: "La Toronto Parking Authority a publié le bilan complet d'une seule tempête : en février 2025, le déneigement a fermé 47 % de son stationnement sur rue et coûté 371 000 transactions payées. Ce projet utilise ce chiffre pour chiffrer chaque chute de neige majeure de 2023 à 2025, avec une fourchette pour chaque estimation et une vérification à partir des contraventions de stationnement.",
    cta1: "Voir le classement des tempêtes",
    cta2: "Lire la méthodologie",
  },
  statsLabels: [
    "tempêtes majeures chiffrées, de janvier 2023 à décembre 2025",
    "transactions de stationnement payées perdues sur les 13 tempêtes (estimation)",
    "de revenus de stationnement perdus sur les 13 tempêtes (estimation)",
    "fourchette du total de revenus sur 3 ans, bornes basse et haute",
  ],
  labels: { fact: "Fait", estimate: "Estimation", crossCheck: "Vérification", anchor: "Ancrage" },
  explorer: {
    kicker: "Tempêtes",
    title: "Chaque tempête majeure, classée par coût estimé.",
    body: "Une tempête majeure est une suite de jours de neige (1 cm ou plus par jour, un jour d'écart permis) totalisant 5 cm ou plus. Chaque ligne donne l'estimation, sa fourchette basse et haute, et le comportement des contraventions autour de la tempête. Les lignes d'ancrage sont les deux vagues de février 2025 sur lesquelles les 371 000 transactions publiées ont été calibrées.",
    colStorm: "Tempête",
    colSnow: "Chute de neige",
    colTransactions: "Transactions perdues",
    colRevenue: "Revenus perdus",
    colCheck: "Vérification contraventions",
    band: "de bas à haut",
  },
  chart: {
    kicker: "Graphique",
    title: "Revenus estimés perdus, par tempête.",
    body: "Les montants sont l'estimation médiane. Les vagues de février 2025 sont en rouge : ce sont l'ancrage d'où vient toute l'échelle. Chaque autre barre est une estimation fondée sur la chute de neige, pas un chiffre publié.",
  },
  method: {
    kicker: "Méthodologie",
    title: "Comment une tempête reçoit un prix.",
    points: [
      "Étape 1, l'ancrage (fait) : le rapport sur le budget de fonctionnement 2026 de la Toronto Parking Authority (25 novembre 2025, page 1) indique que le long épisode de neige de février 2025 a fermé 47 % du stationnement sur rue pour le déneigement et causé 371 000 transactions de moins.",
      "Étape 2, la neige : la chute de neige quotidienne à Toronto provient des archives Open-Meteo (réanalyse ERA5 à 43,65 N, 79,38 O). Les téléchargements en bloc d'Environnement Canada étaient inaccessibles depuis le réseau de construction, donc Open-Meteo est le substitut documenté. ERA5 est une estimation de modèle, pas une mesure de station, et peut différer de ce qui est tombé sur une rue donnée.",
      "Étape 3, le taux (inférence) : l'épisode de février 2025 totalise 41,9 cm en deux vagues (6 au 9 février, 12 au 18 février). Diviser 371 000 transactions par 41,9 cm donne 8 854 transactions perdues par centimètre de neige. Ce taux est ensuite appliqué à chaque autre tempête.",
      "Étape 4, l'argent : chaque transaction est chiffrée à 5,47 $, le taux mixte tiré des prévisions 2025 de la TPA, soit 177,3 millions de dollars de revenus sur 32,4 millions de transactions. Le chiffre mélange le stationnement sur rue et hors rue parce que la TPA ne publie pas la répartition des transactions; les pertes de tempête sont surtout sur rue, donc le taux réel peut différer.",
      "Étape 5, la fourchette : le taux de transactions comporte une bande de plus ou moins 30 %, qui couvre aussi la lecture alternative où les 371 000 transactions ne visent que la plus grande vague de février. Le prix par transaction comporte plus ou moins 10 %. Les revenus bas et haut combinent les deux.",
      "Étape 6, la vérification : la Ville publie chaque contravention de stationnement. Les comptes quotidiens autour de chaque tempête sont comparés à une base locale (28 jours de chaque côté, autres fenêtres de tempête retirées). Les contraventions mesurent l'activité de contrôle au trottoir. Ce n'est pas une mesure de revenus, et quand les données de contraventions contredisent l'estimation, la ligne de la tempête le dit.",
      "Ce que cette méthode ne peut pas faire : elle ne peut pas chiffrer une tempête dont la neige est tombée mais dont le stationnement est resté ouvert, et elle suppose que chaque centimètre coûte pareil en janvier froid qu'en mars mouillé. Traitez chaque chiffre comme une estimation avec une fourchette, pas comme une facture.",
    ],
  },
  developers: {
    kicker: "Pour les développeurs",
    title: "Interrogez les données par le code, ou par un agent.",
    body: "Trois voies d'accès, les mêmes données canoniques. REST pour les applications, OpenAPI pour l'intégration, outils MCP en HTTP diffusable pour les agents IA.",
    endpoints: "Points d'accès",
    tryIt: "Essayer",
    openapi: "Spécification OpenAPI",
  },
  downloads: {
    kicker: "Données",
    title: "Prenez les fichiers.",
    body: "Versions publiées, licence MIT. Le jeu de données des tempêtes, la série complète des chutes de neige quotidiennes et les comptes de contraventions utilisés pour la vérification.",
    download: "Télécharger",
  },
  footer: {
    line: "Un projet civique à code source ouvert par Nshipyard. Sans affiliation avec le gouvernement du Canada ni la Ville de Toronto.",
    sources: "Ancrage et taux : rapport sur le budget de fonctionnement 2026 de la Toronto Parking Authority (toronto.ca). Neige : archives Open-Meteo, réanalyse ERA5 (solution de repli; téléchargement en bloc d'Environnement Canada inaccessible depuis le réseau de construction). Contraventions : données ouvertes de la Ville de Toronto (contraventions de stationnement).",
  },
  mcp: {
    kicker: "Connectez votre agent",
    title: "Utilisez ces données dans vos outils d'IA.",
    body: "Choisissez votre outil, copiez l'invite, envoyez-la à votre agent. Votre agent fait l'installation lui-même.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Autre" },
    cardTitle: "Copiez et envoyez ceci à {tab}",
    copy: "Copier",
    copied: "Copié",
    chatgptNote: "ChatGPT se connecte par l'API REST documentée plutôt que par MCP directement.",
    pChatgpt:
      "Je veux utiliser {displayName} par son API.\n- Spécification OpenAPI : {origin}/api/openapi.json\n- Base REST : {origin}/api/v1\nDis-moi d'abord en deux phrases ce que cette API offre, puis {exampleLower}, et montre-moi le résultat.",
    pClaude:
      "Dans Claude (claude.ai), ouvrez Réglages, puis Connecteurs, et ajoutez un connecteur personnalisé :\n- Nom : {displayName}\n- URL : {origin}/mcp\nEnsuite, liste les outils disponibles, {exampleLower}, et montre-moi le résultat.",
    pClaudeCode:
      "Configure le serveur MCP {displayName} pour que je puisse l'interroger d'ici.\n1. Exécute : claude mcp add --transport http {slug} {origin}/mcp\n2. Exécute `claude mcp list` pour confirmer la connexion.\n3. {example}, et montre-moi le résultat.",
    pCli:
      "# Point d'accès MCP (HTTP diffusable)\n{origin}/mcp\n\n# Lister les outils disponibles\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Tout le reste",
    otherBody: "Tout outil qui parle MCP en HTTP diffusable, ou le REST ordinaire.",
    mcpEndpoint: "Point d'accès MCP",
    openapiSpec: "Spécification OpenAPI",
    restBase: "Base REST",
  },
};

const dictionaries: Record<Lang, Dict> = { en, fr };

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const Ctx = createContext<LangCtx>({ lang: "en", setLang: () => {}, t: en });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    // SSR-safe one-time restore of the saved language after hydration.
    const saved = window.localStorage.getItem("storm-lang");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "fr" || saved === "en") setLang(saved);
  }, []);
  function apply(l: Lang) {
    setLang(l);
    window.localStorage.setItem("storm-lang", l);
    document.documentElement.lang = l === "fr" ? "fr" : "en";
  }
  return <Ctx.Provider value={{ lang, setLang: apply, t: dictionaries[lang] }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}
