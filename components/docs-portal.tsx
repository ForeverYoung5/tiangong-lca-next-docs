import Link from 'next/link';
import { Card, Cards } from 'fumadocs-ui/components/card';

type Language = 'zh' | 'en' | 'de' | 'fr';

interface PortalLink {
  code: string;
  title: string;
  description: string;
  slug: string;
}

interface PortalCopy {
  startEyebrow: string;
  startTitle: string;
  startDescription: string;
  openLabel: string;
  starts: [PortalLink, PortalLink, PortalLink, PortalLink];
  routeEyebrow: string;
  routeTitle: string;
  routeDescription: string;
  routeAriaLabel: string;
  route: [PortalLink, PortalLink, PortalLink, PortalLink, PortalLink];
  exploreEyebrow: string;
  exploreTitle: string;
  exploreDescription: string;
  explore: [PortalLink, PortalLink, PortalLink, PortalLink];
}

const copy: Record<Language, PortalCopy> = {
  zh: {
    startEyebrow: '推荐入口',
    startTitle: '从你现在要完成的任务开始',
    startDescription: '无需按目录顺序阅读。选择一个目标，直接进入对应操作和检查步骤。',
    openLabel: '打开指南',
    starts: [
      { code: 'START', title: '首次使用 TianGong LCA', description: '完成注册、登录和核心操作演示，建立对平台的基本认识。', slug: 'quick-start' },
      { code: 'DATA', title: '查找并使用数据', description: '搜索数据空间，查看数据集，并引用或复制所需记录。', slug: 'user-guide/data' },
      { code: 'MODEL', title: '创建数据与模型', description: '创建流和过程、连接交换，并准备可计算的产品系统。', slug: 'user-guide/create-my-data' },
      { code: 'LCIA', title: '计算并解读结果', description: '运行影响评价，检查过程或模型的 LCIA 结果。', slug: 'user-guide/lcia' },
    ],
    routeEyebrow: '任务路线',
    routeTitle: '一项生命周期评价如何在平台中推进',
    routeDescription: '这是一张文档导航图，而非固定流程。可从任一步进入，并按项目需要返回前一步修订。',
    routeAriaLabel: 'TianGong LCA 文档任务路线：快速上手、找到数据、建立模型、计算 LCIA、评审协作。',
    route: [
      { code: '01', title: '快速上手', description: '账号与界面', slug: 'quick-start' },
      { code: '02', title: '找到数据', description: '检索与引用', slug: 'user-guide/data' },
      { code: '03', title: '建立模型', description: '过程与交换', slug: 'user-guide/create-my-data' },
      { code: '04', title: '计算 LCIA', description: '影响与结果', slug: 'user-guide/lcia' },
      { code: '05', title: '评审协作', description: '提交与反馈', slug: 'user-guide/data-review' },
    ],
    exploreEyebrow: '继续深入',
    exploreTitle: '按专业主题浏览',
    exploreDescription: '面向数据生产、系统集成和私有化部署的参考资料。',
    explore: [
      { code: 'METHOD', title: '数据收集与建模方法', description: '规范、案例与质量检查', slug: 'data-collection' },
      { code: 'CONNECT', title: '集成与扩展', description: 'MCP、CLI 与外部工具', slug: 'integration' },
      { code: 'API', title: 'OpenAPI', description: '接口约定与调用示例', slug: 'openapi' },
      { code: 'OPERATE', title: '部署与开发', description: '私有化部署和开发环境', slug: 'deploy-and-dev' },
    ],
  },
  en: {
    startEyebrow: 'Recommended entry points',
    startTitle: 'Begin with the task in front of you',
    startDescription: 'You do not need to read the documentation in order. Choose an outcome and open the relevant actions and checks.',
    openLabel: 'Open guide',
    starts: [
      { code: 'START', title: 'Use TianGong LCA for the first time', description: 'Complete registration, sign-in, and the core demonstrations to learn the platform.', slug: 'quick-start' },
      { code: 'DATA', title: 'Find and use data', description: 'Search data spaces, inspect datasets, and reference or copy the records you need.', slug: 'user-guide/data' },
      { code: 'MODEL', title: 'Create data and models', description: 'Create flows and processes, connect exchanges, and prepare a calculable product system.', slug: 'user-guide/create-my-data' },
      { code: 'LCIA', title: 'Calculate and interpret results', description: 'Run impact assessment and inspect LCIA results for a process or model.', slug: 'user-guide/lcia' },
    ],
    routeEyebrow: 'Task route',
    routeTitle: 'How an assessment moves through the platform',
    routeDescription: 'This is a documentation map, not a rigid workflow. Enter at any step and return to earlier steps as the project changes.',
    routeAriaLabel: 'TianGong LCA documentation task route: get started, find data, build a model, calculate LCIA, review and collaborate.',
    route: [
      { code: '01', title: 'Get started', description: 'Account and interface', slug: 'quick-start' },
      { code: '02', title: 'Find data', description: 'Search and reference', slug: 'user-guide/data' },
      { code: '03', title: 'Build a model', description: 'Processes and exchanges', slug: 'user-guide/create-my-data' },
      { code: '04', title: 'Calculate LCIA', description: 'Impacts and results', slug: 'user-guide/lcia' },
      { code: '05', title: 'Review together', description: 'Submit and respond', slug: 'user-guide/data-review' },
    ],
    exploreEyebrow: 'Explore further',
    exploreTitle: 'Browse by technical subject',
    exploreDescription: 'References for data production, system integration, and self-hosted operation.',
    explore: [
      { code: 'METHOD', title: 'Data collection and modelling', description: 'Rules, cases, and quality checks', slug: 'data-collection' },
      { code: 'CONNECT', title: 'Integrations and extensions', description: 'MCP, CLI, and external tools', slug: 'integration' },
      { code: 'API', title: 'OpenAPI', description: 'Interface conventions and examples', slug: 'openapi' },
      { code: 'OPERATE', title: 'Deployment and development', description: 'Self-hosting and development setup', slug: 'deploy-and-dev' },
    ],
  },
  de: {
    startEyebrow: 'Empfohlene Einstiege',
    startTitle: 'Beginnen Sie mit Ihrer aktuellen Aufgabe',
    startDescription: 'Sie müssen die Dokumentation nicht der Reihe nach lesen. Wählen Sie ein Ziel und öffnen Sie die passenden Schritte und Prüfungen.',
    openLabel: 'Guide öffnen',
    starts: [
      { code: 'START', title: 'TianGong LCA erstmals verwenden', description: 'Registrierung, Anmeldung und zentrale Demos vermitteln die Grundlagen der Plattform.', slug: 'quick-start' },
      { code: 'DATA', title: 'Daten finden und verwenden', description: 'Datenräume durchsuchen, Datensätze prüfen und benötigte Einträge referenzieren oder kopieren.', slug: 'user-guide/data' },
      { code: 'MODEL', title: 'Daten und Modelle erstellen', description: 'Flüsse und Prozesse anlegen, Austausche verbinden und ein berechenbares Produktsystem vorbereiten.', slug: 'user-guide/create-my-data' },
      { code: 'LCIA', title: 'Ergebnisse berechnen und auswerten', description: 'Wirkungsabschätzungen ausführen und LCIA-Ergebnisse für Prozesse oder Modelle prüfen.', slug: 'user-guide/lcia' },
    ],
    routeEyebrow: 'Aufgabenroute',
    routeTitle: 'Wie eine Ökobilanz durch die Plattform geführt wird',
    routeDescription: 'Dies ist eine Navigationskarte, kein starrer Ablauf. Steigen Sie bei jedem Schritt ein und gehen Sie bei Änderungen zurück.',
    routeAriaLabel: 'Dokumentationsroute für TianGong LCA: Einstieg, Daten finden, Modell erstellen, LCIA berechnen, prüfen und zusammenarbeiten.',
    route: [
      { code: '01', title: 'Einstieg', description: 'Konto und Oberfläche', slug: 'quick-start' },
      { code: '02', title: 'Daten finden', description: 'Suchen und referenzieren', slug: 'user-guide/data' },
      { code: '03', title: 'Modell erstellen', description: 'Prozesse und Austausche', slug: 'user-guide/create-my-data' },
      { code: '04', title: 'LCIA berechnen', description: 'Wirkungen und Ergebnisse', slug: 'user-guide/lcia' },
      { code: '05', title: 'Gemeinsam prüfen', description: 'Einreichen und reagieren', slug: 'user-guide/data-review' },
    ],
    exploreEyebrow: 'Weiterführende Themen',
    exploreTitle: 'Nach Fachthema durchsuchen',
    exploreDescription: 'Referenzen für Datenproduktion, Systemintegration und eigenen Betrieb.',
    explore: [
      { code: 'METHOD', title: 'Datensammlung und Modellierung', description: 'Regeln, Fälle und Qualitätsprüfungen', slug: 'data-collection' },
      { code: 'CONNECT', title: 'Integrationen und Erweiterungen', description: 'MCP, CLI und externe Werkzeuge', slug: 'integration' },
      { code: 'API', title: 'OpenAPI', description: 'Schnittstellenregeln und Beispiele', slug: 'openapi' },
      { code: 'OPERATE', title: 'Bereitstellung und Entwicklung', description: 'Self-Hosting und Entwicklungsumgebung', slug: 'deploy-and-dev' },
    ],
  },
  fr: {
    startEyebrow: 'Entrées recommandées',
    startTitle: 'Commencez par la tâche à accomplir',
    startDescription: 'Il n’est pas nécessaire de lire la documentation dans l’ordre. Choisissez un objectif et ouvrez les actions et contrôles correspondants.',
    openLabel: 'Ouvrir le guide',
    starts: [
      { code: 'START', title: 'Utiliser TianGong LCA pour la première fois', description: 'Terminez l’inscription, la connexion et les démonstrations essentielles pour découvrir la plateforme.', slug: 'quick-start' },
      { code: 'DATA', title: 'Trouver et utiliser des données', description: 'Recherchez dans les espaces de données, examinez les jeux et référencez ou copiez les enregistrements utiles.', slug: 'user-guide/data' },
      { code: 'MODEL', title: 'Créer des données et des modèles', description: 'Créez des flux et procédés, reliez les échanges et préparez un système de produit calculable.', slug: 'user-guide/create-my-data' },
      { code: 'LCIA', title: 'Calculer et interpréter les résultats', description: 'Lancez l’évaluation des impacts et examinez les résultats d’ACVI d’un procédé ou modèle.', slug: 'user-guide/lcia' },
    ],
    routeEyebrow: 'Parcours par tâche',
    routeTitle: 'Comment une évaluation progresse dans la plateforme',
    routeDescription: 'Il s’agit d’une carte de navigation, pas d’un processus figé. Entrez à n’importe quelle étape et revenez en arrière si le projet évolue.',
    routeAriaLabel: 'Parcours documentaire TianGong LCA : démarrer, trouver des données, construire un modèle, calculer l’ACVI, réviser et collaborer.',
    route: [
      { code: '01', title: 'Démarrer', description: 'Compte et interface', slug: 'quick-start' },
      { code: '02', title: 'Trouver les données', description: 'Recherche et référence', slug: 'user-guide/data' },
      { code: '03', title: 'Construire le modèle', description: 'Procédés et échanges', slug: 'user-guide/create-my-data' },
      { code: '04', title: 'Calculer l’ACVI', description: 'Impacts et résultats', slug: 'user-guide/lcia' },
      { code: '05', title: 'Réviser ensemble', description: 'Soumission et retours', slug: 'user-guide/data-review' },
    ],
    exploreEyebrow: 'Pour aller plus loin',
    exploreTitle: 'Parcourir par sujet technique',
    exploreDescription: 'Références pour la production de données, l’intégration de systèmes et l’auto-hébergement.',
    explore: [
      { code: 'METHOD', title: 'Collecte et modélisation', description: 'Règles, cas et contrôles qualité', slug: 'data-collection' },
      { code: 'CONNECT', title: 'Intégrations et extensions', description: 'MCP, CLI et outils externes', slug: 'integration' },
      { code: 'API', title: 'OpenAPI', description: 'Conventions d’interface et exemples', slug: 'openapi' },
      { code: 'OPERATE', title: 'Déploiement et développement', description: 'Auto-hébergement et environnement', slug: 'deploy-and-dev' },
    ],
  },
};

function Arrow() {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 20 20" width="16">
      <path d="M4 10h11m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function routeHref(language: Language, slug: string) {
  return `/${language}/docs/${slug}/`;
}

export function DocsPortal({ lang }: { lang: string }) {
  const language: Language = lang in copy ? (lang as Language) : 'en';
  const content = copy[language];

  return (
    <div className="not-prose mt-8 grid gap-12 pb-3" data-docs-portal="lca-task-hub">
      <section aria-labelledby="docs-portal-start">
        <div className="mb-5 grid max-w-[42rem] gap-2">
          <p className="m-0 text-xs font-semibold tracking-[0.08em] text-fd-primary uppercase">{content.startEyebrow}</p>
          <h2 className="m-0 text-2xl leading-tight font-semibold tracking-[-0.025em]" id="docs-portal-start">{content.startTitle}</h2>
          <p className="m-0 text-sm leading-6 text-fd-muted-foreground">{content.startDescription}</p>
        </div>
        <Cards className="grid-cols-2 gap-3 max-[40rem]:grid-cols-1">
          {content.starts.map((item) => (
            <Card
              className="grid min-h-44 content-start gap-3 rounded-[2px] border-fd-border bg-fd-card p-4 text-inherit transition-colors duration-100 hover:border-fd-primary hover:bg-fd-accent [&>div:last-child]:self-end [&_h3]:m-0 [&_h3]:text-base [&_h3]:leading-snug [&_h3]:font-semibold [&_p]:m-0! [&_p]:text-sm [&_p]:leading-6 [&_p]:text-fd-muted-foreground"
              description={item.description}
              href={routeHref(language, item.slug)}
              key={item.slug}
              title={item.title}
            >
              <span className="inline-flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.05em] text-fd-primary uppercase">
                {item.code}
                <span className="inline-flex items-center gap-1 font-medium tracking-normal normal-case">
                  {content.openLabel}
                  <Arrow />
                </span>
              </span>
            </Card>
          ))}
        </Cards>
      </section>

      <section aria-labelledby="docs-portal-route" className="rounded-[2px] border border-fd-border bg-fd-muted/30 p-5 max-[40rem]:p-4" data-docs-portal-map="lca-task-route">
        <div className="mb-5 grid max-w-[42rem] gap-2">
          <p className="m-0 text-xs font-semibold tracking-[0.08em] text-fd-primary uppercase">{content.routeEyebrow}</p>
          <h2 className="m-0 text-xl leading-tight font-semibold tracking-[-0.02em]" id="docs-portal-route">{content.routeTitle}</h2>
          <p className="m-0 text-sm leading-6 text-fd-muted-foreground">{content.routeDescription}</p>
        </div>
        <ol aria-label={content.routeAriaLabel} className="m-0 grid list-none grid-cols-5 gap-[2px] overflow-hidden rounded-[2px] border-2 border-fd-border bg-fd-border p-0 max-[52rem]:grid-cols-1">
          {content.route.map((step) => (
            <li className="m-0 min-w-0 bg-fd-background p-0" key={step.code}>
              <Link className="group grid min-h-36 content-between gap-5 p-3.5 text-fd-foreground no-underline transition-colors duration-100 hover:bg-fd-accent" href={routeHref(language, step.slug)}>
                <span className="flex items-center justify-between gap-2 text-xs font-semibold text-fd-primary">
                  {step.code}
                  <Arrow />
                </span>
                <span className="grid gap-1">
                  <strong className="text-sm leading-snug font-semibold">{step.title}</strong>
                  <span className="text-xs leading-5 text-fd-muted-foreground">{step.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="docs-portal-explore">
        <div className="mb-5 grid max-w-[42rem] gap-2">
          <p className="m-0 text-xs font-semibold tracking-[0.08em] text-fd-primary uppercase">{content.exploreEyebrow}</p>
          <h2 className="m-0 text-xl leading-tight font-semibold tracking-[-0.02em]" id="docs-portal-explore">{content.exploreTitle}</h2>
          <p className="m-0 text-sm leading-6 text-fd-muted-foreground">{content.exploreDescription}</p>
        </div>
        <div className="grid grid-cols-2 gap-[2px] overflow-hidden rounded-[2px] border-2 border-fd-border bg-fd-border max-[40rem]:grid-cols-1">
          {content.explore.map((item) => (
            <Link className="group grid min-h-28 content-between gap-4 bg-fd-background p-4 text-fd-foreground no-underline transition-colors duration-100 hover:bg-fd-accent" href={routeHref(language, item.slug)} key={item.slug}>
              <span className="flex items-center justify-between gap-3 text-xs font-semibold tracking-[0.05em] text-fd-primary uppercase">
                {item.code}
                <Arrow />
              </span>
              <span className="grid gap-1">
                <strong className="text-sm font-semibold">{item.title}</strong>
                <span className="text-xs leading-5 text-fd-muted-foreground">{item.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
