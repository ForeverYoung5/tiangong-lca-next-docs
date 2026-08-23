import Link from 'next/link';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

type Language = 'zh' | 'en' | 'de' | 'fr';

interface HomeCopy {
  eyebrow: string;
  title: string;
  description: string;
  primary: string;
  secondary: string;
  mapLabel: string;
  mapNodes: [string, string, string, string];
  pathsEyebrow: string;
  pathsTitle: string;
  pathsDescription: string;
  paths: Array<{ title: string; description: string; slug: string; accent: string }>;
  closingTitle: string;
  closingDescription: string;
  closingAction: string;
}

const copy: Record<Language, HomeCopy> = {
  zh: {
    eyebrow: 'TianGong Data Atlas · 生命周期评价知识入口',
    title: '从数据到决策，读懂 TianGong LCA',
    description:
      '围绕真实工作流组织的平台文档：快速上手数据检索与建模，理解 LCIA 分析、数据评审、团队协作与开放集成。',
    primary: '开始使用',
    secondary: '浏览用户指南',
    mapLabel: 'TianGong LCA 数据从采集、建模、评价到共享的循环',
    mapNodes: ['采集', '建模', '评价', '共享'],
    pathsEyebrow: '按任务探索',
    pathsTitle: '从你现在要完成的工作开始',
    pathsDescription: '不用先理解整套系统。选择一个入口，文档会带你走到可验证的结果。',
    paths: [
      { title: '认识平台', description: '了解 TianGong LCA 的定位、数据空间与核心能力。', slug: 'overview', accent: 'plum' },
      { title: '快速开始', description: '完成首次登录、查找数据并建立第一个工作流。', slug: 'quick-start', accent: 'violet' },
      { title: '完成 LCA 工作', description: '按真实任务学习数据、模型、LCIA、评审与团队协作。', slug: 'user-guide', accent: 'amber' },
      { title: '连接你的工具', description: '使用 MCP、CLI 与 OpenAPI 接入 TianGong 数据能力。', slug: 'integration', accent: 'plum' },
    ],
    closingTitle: '需要一个最短路径？',
    closingDescription: '从快速开始进入，十分钟内熟悉数据空间、搜索与核心操作。',
    closingAction: '打开快速开始',
  },
  en: {
    eyebrow: 'TianGong Data Atlas · Life cycle knowledge, mapped',
    title: 'Move from data to decisions with TianGong LCA',
    description:
      'Documentation organised around real work: discover and model data, interpret LCIA, review contributions, collaborate with teams, and connect open tools.',
    primary: 'Get started',
    secondary: 'Browse the user guide',
    mapLabel: 'The TianGong LCA data cycle from collection and modelling to assessment and sharing',
    mapNodes: ['Collect', 'Model', 'Assess', 'Share'],
    pathsEyebrow: 'Explore by task',
    pathsTitle: 'Start with the work in front of you',
    pathsDescription: 'You do not need to learn the whole platform first. Pick a path and reach a verifiable result.',
    paths: [
      { title: 'Understand the platform', description: 'Learn the purpose, data spaces, and core capabilities of TianGong LCA.', slug: 'overview', accent: 'plum' },
      { title: 'Get started', description: 'Sign in, find data, and complete your first platform workflow.', slug: 'quick-start', accent: 'violet' },
      { title: 'Do LCA work', description: 'Follow real tasks across data, models, LCIA, review, and teamwork.', slug: 'user-guide', accent: 'amber' },
      { title: 'Connect your tools', description: 'Use MCP, CLI, and OpenAPI to integrate TianGong data capabilities.', slug: 'integration', accent: 'plum' },
    ],
    closingTitle: 'Looking for the shortest path?',
    closingDescription: 'Use Quick Start to learn data spaces, search, and the essential controls in about ten minutes.',
    closingAction: 'Open Quick Start',
  },
  de: {
    eyebrow: 'TianGong Data Atlas · Lebenszykluswissen im Überblick',
    title: 'Mit TianGong LCA von Daten zu Entscheidungen',
    description:
      'Dokumentation entlang realer Aufgaben: Daten finden und modellieren, LCIA auswerten, Beiträge prüfen, im Team arbeiten und offene Werkzeuge anbinden.',
    primary: 'Erste Schritte',
    secondary: 'Benutzerhandbuch öffnen',
    mapLabel: 'Der TianGong-LCA-Datenkreislauf von Erfassung und Modellierung bis Bewertung und Austausch',
    mapNodes: ['Erfassen', 'Modellieren', 'Bewerten', 'Teilen'],
    pathsEyebrow: 'Nach Aufgabe erkunden',
    pathsTitle: 'Beginnen Sie mit Ihrer aktuellen Aufgabe',
    pathsDescription: 'Sie müssen nicht zuerst die gesamte Plattform lernen. Wählen Sie einen Weg zu einem prüfbaren Ergebnis.',
    paths: [
      { title: 'Plattform verstehen', description: 'Zweck, Datenräume und Kernfunktionen von TianGong LCA kennenlernen.', slug: 'overview', accent: 'plum' },
      { title: 'Schnell starten', description: 'Anmelden, Daten finden und den ersten Arbeitsablauf abschließen.', slug: 'quick-start', accent: 'violet' },
      { title: 'LCA-Aufgaben erledigen', description: 'Daten, Modelle, LCIA, Prüfung und Teamarbeit praxisnah nutzen.', slug: 'user-guide', accent: 'amber' },
      { title: 'Werkzeuge anbinden', description: 'TianGong-Funktionen über MCP, CLI und OpenAPI integrieren.', slug: 'integration', accent: 'plum' },
    ],
    closingTitle: 'Sie suchen den kürzesten Weg?',
    closingDescription: 'Der Schnellstart erklärt Datenräume, Suche und zentrale Bedienung in etwa zehn Minuten.',
    closingAction: 'Schnellstart öffnen',
  },
  fr: {
    eyebrow: 'TianGong Data Atlas · Les connaissances du cycle de vie, cartographiées',
    title: 'Passez des données aux décisions avec TianGong LCA',
    description:
      'Une documentation structurée autour du travail réel : trouver et modéliser des données, interpréter la LCIA, réviser les contributions, collaborer et connecter des outils ouverts.',
    primary: 'Bien démarrer',
    secondary: 'Parcourir le guide utilisateur',
    mapLabel: "Le cycle de données TianGong LCA, de la collecte et la modélisation à l'évaluation et au partage",
    mapNodes: ['Collecter', 'Modéliser', 'Évaluer', 'Partager'],
    pathsEyebrow: 'Explorer par tâche',
    pathsTitle: 'Commencez par le travail à accomplir',
    pathsDescription: "Nul besoin d'apprendre toute la plateforme. Choisissez un parcours vers un résultat vérifiable.",
    paths: [
      { title: 'Comprendre la plateforme', description: 'Découvrez le rôle, les espaces de données et les fonctions clés de TianGong LCA.', slug: 'overview', accent: 'plum' },
      { title: 'Démarrer rapidement', description: 'Connectez-vous, trouvez des données et terminez votre premier parcours.', slug: 'quick-start', accent: 'violet' },
      { title: 'Réaliser une ACV', description: "Suivez des tâches réelles sur les données, modèles, LCIA, révision et travail d'équipe.", slug: 'user-guide', accent: 'amber' },
      { title: 'Connecter vos outils', description: 'Intégrez les capacités TianGong avec MCP, la CLI et OpenAPI.', slug: 'integration', accent: 'plum' },
    ],
    closingTitle: 'Vous cherchez le chemin le plus court ?',
    closingDescription: 'Le démarrage rapide présente les espaces de données, la recherche et les commandes essentielles en dix minutes environ.',
    closingAction: 'Ouvrir le démarrage rapide',
  },
};

function Arrow() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DocsHome({ lang }: { lang: string }) {
  const language: Language = lang in copy ? (lang as Language) : 'en';
  const content = copy[language];

  return (
    <HomeLayout {...baseOptions(language)}>
      <main className="atlas-home">
        <section className="atlas-hero">
          <div className="atlas-shell atlas-hero-grid">
            <div className="atlas-hero-copy">
              <p className="atlas-eyebrow">{content.eyebrow}</p>
              <h1>{content.title}</h1>
              <p className="atlas-lede">{content.description}</p>
              <div className="atlas-actions">
                <Link className="atlas-button atlas-button-primary" href={`/${language}/docs/quick-start/`}>
                  {content.primary}
                  <Arrow />
                </Link>
                <Link className="atlas-button atlas-button-secondary" href={`/${language}/docs/user-guide/`}>
                  {content.secondary}
                </Link>
              </div>
            </div>

            <div className="atlas-map" role="img" aria-label={content.mapLabel}>
              <div className="atlas-map-grid" aria-hidden="true" />
              <div className="atlas-orbit atlas-orbit-one" aria-hidden="true" />
              <div className="atlas-orbit atlas-orbit-two" aria-hidden="true" />
              <div className="atlas-map-core" aria-hidden="true">
                <span>Data</span>
                <strong>Atlas</strong>
              </div>
              {content.mapNodes.map((node, index) => (
                <div className={`atlas-map-node atlas-map-node-${index + 1}`} key={node} aria-hidden="true">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {node}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="atlas-paths">
          <div className="atlas-shell">
            <div className="atlas-section-heading">
              <p className="atlas-eyebrow">{content.pathsEyebrow}</p>
              <h2>{content.pathsTitle}</h2>
              <p>{content.pathsDescription}</p>
            </div>
            <div className="atlas-path-grid">
              {content.paths.map((path) => (
                <Link className={`atlas-path-card atlas-accent-${path.accent}`} href={`/${language}/docs/${path.slug}/`} key={path.slug}>
                  <span className="atlas-card-kicker">{path.slug.replace('-', ' ')}</span>
                  <h3>{path.title}</h3>
                  <p>{path.description}</p>
                  <span className="atlas-card-arrow"><Arrow /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="atlas-closing">
          <div className="atlas-shell atlas-closing-card">
            <div>
              <h2>{content.closingTitle}</h2>
              <p>{content.closingDescription}</p>
            </div>
            <Link className="atlas-button atlas-button-primary" href={`/${language}/docs/quick-start/`}>
              {content.closingAction}
              <Arrow />
            </Link>
          </div>
        </section>
      </main>
    </HomeLayout>
  );
}
