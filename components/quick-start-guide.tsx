import Link from 'next/link';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';

type Language = 'zh' | 'en' | 'de' | 'fr';

interface GuideLink {
  code: string;
  title: string;
  description: string;
  slug: string;
}

interface GuideStep extends GuideLink {
  outcome: string;
}

interface QuickStartCopy {
  eyebrow: string;
  title: string;
  description: string;
  openApp: string;
  openStep: string;
  outcomeLabel: string;
  routeAriaLabel: string;
  steps: [GuideStep, GuideStep];
  branchCode: string;
  branchTitle: string;
  branchDescription: string;
  openTask: string;
  tasks: [GuideLink, GuideLink, GuideLink];
  supportEyebrow: string;
  supportTitle: string;
  supportDescription: string;
  support: [GuideLink, GuideLink, GuideLink];
}

const copy: Record<Language, QuickStartCopy> = {
  zh: {
    eyebrow: '第一次使用路线',
    title: '用两步熟悉平台，再完成一个真实任务',
    description: '已有账号可直接从第二步开始；熟悉界面后，选择一项与你当前目标最接近的任务。',
    openApp: '打开 TianGong LCA',
    openStep: '查看步骤',
    outcomeLabel: '完成标志',
    routeAriaLabel: 'TianGong LCA 快速开始路线：注册或登录、跟随操作演示、选择第一次任务。',
    steps: [
      {
        code: '01',
        title: '注册或登录',
        description: '创建账号、完成邮箱验证，或使用已有账号进入系统。',
        outcome: '能够进入 TianGong LCA 首页',
        slug: 'quick-start/first-login',
      },
      {
        code: '02',
        title: '跟随操作演示',
        description: '用示例数据认识页面入口、数据对象和基本操作顺序。',
        outcome: '知道从哪里开始一项数据任务',
        slug: 'quick-start/demonstrations',
      },
    ],
    branchCode: '03',
    branchTitle: '选择第一次任务',
    branchDescription: '不必一次掌握所有模块。完成其中一项，就算走完快速开始。',
    openTask: '开始任务',
    tasks: [
      { code: 'DATA', title: '先查找数据', description: '认识数据模块，搜索并引用已有记录。', slug: 'user-guide/data' },
      { code: 'BUILD', title: '先创建数据', description: '从流和过程开始建立自己的数据。', slug: 'user-guide/create-my-data' },
      { code: 'LCIA', title: '先查看结果', description: '理解过程或模型的 LCIA 结果入口。', slug: 'user-guide/lcia' },
    ],
    supportEyebrow: '按需查阅',
    supportTitle: '遇到问题时从这里继续',
    supportDescription: '账户设置、常见问题和项目资源保留为补充入口，不打断首次使用路线。',
    support: [
      { code: 'ACCOUNT', title: '账户设置', description: '修改个人信息与偏好', slug: 'user-guide/account-profile' },
      { code: 'FAQ', title: '常见问题', description: '认证、建模与数据使用', slug: 'faq' },
      { code: 'SUPPORT', title: '资源与支持', description: '项目资源和联系入口', slug: 'overview/resources-and-support' },
    ],
  },
  en: {
    eyebrow: 'First-session route',
    title: 'Learn the platform in two steps, then complete one real task',
    description: 'Already have an account? Start at step two. Once the interface feels familiar, choose the task closest to your goal.',
    openApp: 'Open TianGong LCA',
    openStep: 'View step',
    outcomeLabel: 'You are done when',
    routeAriaLabel: 'TianGong LCA quick-start route: sign up or sign in, follow the operation walkthrough, and choose a first task.',
    steps: [
      {
        code: '01',
        title: 'Sign up or sign in',
        description: 'Create an account, complete email verification, or enter with an existing account.',
        outcome: 'You can reach the TianGong LCA home page',
        slug: 'quick-start/first-login',
      },
      {
        code: '02',
        title: 'Follow the operation walkthrough',
        description: 'Use the example dataset to recognise entry points, data objects, and the basic order of work.',
        outcome: 'You know where to begin a data task',
        slug: 'quick-start/demonstrations',
      },
    ],
    branchCode: '03',
    branchTitle: 'Choose your first task',
    branchDescription: 'You do not need to learn every module at once. Completing any one of these finishes the quick start.',
    openTask: 'Start task',
    tasks: [
      { code: 'DATA', title: 'Find data first', description: 'Learn the data modules, then search and reference existing records.', slug: 'user-guide/data' },
      { code: 'BUILD', title: 'Create data first', description: 'Begin with flows and processes to build your own data.', slug: 'user-guide/create-my-data' },
      { code: 'LCIA', title: 'Inspect results first', description: 'Learn where LCIA results appear for a process or model.', slug: 'user-guide/lcia' },
    ],
    supportEyebrow: 'Use when needed',
    supportTitle: 'Continue here if you get stuck',
    supportDescription: 'Account settings, common questions, and project resources stay available without interrupting the first-session route.',
    support: [
      { code: 'ACCOUNT', title: 'Account settings', description: 'Update profile details and preferences', slug: 'user-guide/account-profile' },
      { code: 'FAQ', title: 'Frequently asked questions', description: 'Authentication, modelling, and data use', slug: 'faq' },
      { code: 'SUPPORT', title: 'Resources and support', description: 'Project resources and contact points', slug: 'overview/resources-and-support' },
    ],
  },
  de: {
    eyebrow: 'Route für die erste Sitzung',
    title: 'Lernen Sie die Plattform in zwei Schritten kennen und erledigen Sie dann eine echte Aufgabe',
    description: 'Sie haben bereits ein Konto? Beginnen Sie mit Schritt zwei. Wählen Sie danach die Aufgabe, die Ihrem Ziel am nächsten kommt.',
    openApp: 'TianGong LCA öffnen',
    openStep: 'Schritt ansehen',
    outcomeLabel: 'Abgeschlossen, wenn',
    routeAriaLabel: 'Schnellstartroute für TianGong LCA: registrieren oder anmelden, der Bedienungsdemonstration folgen und eine erste Aufgabe wählen.',
    steps: [
      {
        code: '01',
        title: 'Registrieren oder anmelden',
        description: 'Erstellen Sie ein Konto, bestätigen Sie Ihre E-Mail oder melden Sie sich mit einem bestehenden Konto an.',
        outcome: 'Sie erreichen die Startseite von TianGong LCA',
        slug: 'quick-start/first-login',
      },
      {
        code: '02',
        title: 'Der Bedienungsdemonstration folgen',
        description: 'Lernen Sie mit dem Beispieldatensatz Einstiege, Datenobjekte und die grundlegende Arbeitsreihenfolge kennen.',
        outcome: 'Sie wissen, wo eine Datenaufgabe beginnt',
        slug: 'quick-start/demonstrations',
      },
    ],
    branchCode: '03',
    branchTitle: 'Wählen Sie Ihre erste Aufgabe',
    branchDescription: 'Sie müssen nicht alle Module auf einmal lernen. Mit einer dieser Aufgaben ist der Schnellstart abgeschlossen.',
    openTask: 'Aufgabe starten',
    tasks: [
      { code: 'DATA', title: 'Zuerst Daten finden', description: 'Datenmodule kennenlernen und vorhandene Einträge suchen und referenzieren.', slug: 'user-guide/data' },
      { code: 'BUILD', title: 'Zuerst Daten erstellen', description: 'Mit Flüssen und Prozessen eigene Daten aufbauen.', slug: 'user-guide/create-my-data' },
      { code: 'LCIA', title: 'Zuerst Ergebnisse ansehen', description: 'Erfahren, wo LCIA-Ergebnisse für Prozesse und Modelle erscheinen.', slug: 'user-guide/lcia' },
    ],
    supportEyebrow: 'Bei Bedarf',
    supportTitle: 'Wenn Sie nicht weiterkommen',
    supportDescription: 'Kontoeinstellungen, häufige Fragen und Projektressourcen bleiben erreichbar, ohne die erste Route zu unterbrechen.',
    support: [
      { code: 'ACCOUNT', title: 'Kontoeinstellungen', description: 'Profildaten und Einstellungen ändern', slug: 'user-guide/account-profile' },
      { code: 'FAQ', title: 'Häufige Fragen', description: 'Anmeldung, Modellierung und Datennutzung', slug: 'faq' },
      { code: 'SUPPORT', title: 'Ressourcen und Support', description: 'Projektressourcen und Kontaktmöglichkeiten', slug: 'overview/resources-and-support' },
    ],
  },
  fr: {
    eyebrow: 'Parcours de première session',
    title: 'Découvrez la plateforme en deux étapes, puis réalisez une tâche concrète',
    description: 'Vous avez déjà un compte ? Commencez à la deuxième étape. Une fois l’interface familière, choisissez la tâche la plus proche de votre objectif.',
    openApp: 'Ouvrir TianGong LCA',
    openStep: 'Voir l’étape',
    outcomeLabel: 'Étape terminée lorsque',
    routeAriaLabel: 'Parcours de démarrage TianGong LCA : créer un compte ou se connecter, suivre la démonstration et choisir une première tâche.',
    steps: [
      {
        code: '01',
        title: 'Créer un compte ou se connecter',
        description: 'Créez un compte, confirmez votre adresse e-mail ou connectez-vous avec un compte existant.',
        outcome: 'Vous accédez à la page d’accueil de TianGong LCA',
        slug: 'quick-start/first-login',
      },
      {
        code: '02',
        title: 'Suivre la démonstration',
        description: 'Utilisez le jeu d’exemple pour repérer les entrées, les objets de données et l’ordre général des opérations.',
        outcome: 'Vous savez où commencer une tâche de données',
        slug: 'quick-start/demonstrations',
      },
    ],
    branchCode: '03',
    branchTitle: 'Choisissez votre première tâche',
    branchDescription: 'Il n’est pas nécessaire de maîtriser tous les modules. Terminer l’une de ces tâches suffit pour achever le démarrage.',
    openTask: 'Commencer la tâche',
    tasks: [
      { code: 'DATA', title: 'Trouver des données', description: 'Découvrez les modules, puis recherchez et référencez des enregistrements.', slug: 'user-guide/data' },
      { code: 'BUILD', title: 'Créer des données', description: 'Commencez par les flux et les procédés pour construire vos données.', slug: 'user-guide/create-my-data' },
      { code: 'LCIA', title: 'Consulter les résultats', description: 'Repérez les résultats d’ACVI d’un procédé ou d’un modèle.', slug: 'user-guide/lcia' },
    ],
    supportEyebrow: 'Selon vos besoins',
    supportTitle: 'Continuez ici en cas de blocage',
    supportDescription: 'Les réglages du compte, les questions fréquentes et les ressources restent disponibles sans interrompre le parcours initial.',
    support: [
      { code: 'ACCOUNT', title: 'Réglages du compte', description: 'Modifier le profil et les préférences', slug: 'user-guide/account-profile' },
      { code: 'FAQ', title: 'Questions fréquentes', description: 'Authentification, modélisation et données', slug: 'faq' },
      { code: 'SUPPORT', title: 'Ressources et assistance', description: 'Ressources du projet et points de contact', slug: 'overview/resources-and-support' },
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

export function QuickStartGuide({ lang }: { lang: string }) {
  const language: Language = lang in copy ? (lang as Language) : 'en';
  const content = copy[language];

  return (
    <div className="not-prose mt-8 grid gap-10 pb-3" data-quick-start-guide="first-session-route">
      <section aria-labelledby="quick-start-route">
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-5 max-[40rem]:grid-cols-1 max-[40rem]:items-stretch">
          <div className="grid max-w-[43rem] gap-2">
            <p className="m-0 text-xs font-semibold tracking-[0.08em] text-fd-primary uppercase">{content.eyebrow}</p>
            <h2 className="m-0 text-2xl leading-tight font-semibold tracking-[-0.025em]" id="quick-start-route">{content.title}</h2>
            <p className="m-0 text-sm leading-6 text-fd-muted-foreground">{content.description}</p>
          </div>
          <Link
            className={`${buttonVariants({ variant: 'primary' })} min-h-11 shrink-0 rounded-[2px] px-4 text-sm font-medium max-[40rem]:w-full`}
            data-quick-start-primary
            href="https://lca.tiangong.earth/"
            rel="noreferrer"
            target="_blank"
          >
            {content.openApp}
            <Arrow />
          </Link>
        </div>

        <ol aria-label={content.routeAriaLabel} className="m-0 grid list-none gap-[2px] overflow-hidden rounded-[2px] border-2 border-fd-border bg-fd-border p-0" data-quick-start-map="three-stage-onboarding">
          {content.steps.map((step) => (
            <li className="m-0 bg-fd-background p-0" key={step.code}>
              <Link
                className="group grid min-h-36 grid-cols-[3rem_minmax(0,1fr)_minmax(10rem,auto)] items-center gap-4 p-4 text-fd-foreground no-underline transition-colors duration-100 hover:bg-fd-accent max-[48rem]:grid-cols-[3rem_minmax(0,1fr)] max-[48rem]:items-start"
                href={routeHref(language, step.slug)}
              >
                <span className="self-start pt-0.5 text-sm font-semibold text-fd-primary">{step.code}</span>
                <span className="grid gap-1.5">
                  <strong className="text-base leading-snug font-semibold">{step.title}</strong>
                  <span className="text-sm leading-6 text-fd-muted-foreground">{step.description}</span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-fd-primary">
                    {content.openStep}
                    <Arrow />
                  </span>
                </span>
                <span className="grid gap-1 border-l border-fd-border pl-4 max-[48rem]:col-start-2 max-[48rem]:border-t max-[48rem]:border-l-0 max-[48rem]:pt-3 max-[48rem]:pl-0">
                  <span className="text-xs font-semibold tracking-[0.04em] text-fd-muted-foreground uppercase">{content.outcomeLabel}</span>
                  <strong className="text-sm leading-5 font-medium">{step.outcome}</strong>
                </span>
              </Link>
            </li>
          ))}

          <li className="m-0 bg-fd-background p-4" data-quick-start-branch="choose-first-task">
            <div className="mb-4 grid grid-cols-[3rem_minmax(0,1fr)] gap-4">
              <span className="pt-0.5 text-sm font-semibold text-fd-primary">{content.branchCode}</span>
              <span className="grid gap-1.5">
                <strong className="text-base leading-snug font-semibold">{content.branchTitle}</strong>
                <span className="text-sm leading-6 text-fd-muted-foreground">{content.branchDescription}</span>
              </span>
            </div>
            <Cards className="ml-16 grid-cols-3 gap-2 max-[52rem]:ml-0 max-[46rem]:grid-cols-1">
              {content.tasks.map((task) => (
                <Card
                  className="grid min-h-40 content-start gap-2.5 rounded-[2px] border-fd-border bg-fd-card p-4 text-inherit transition-colors duration-100 hover:border-fd-primary hover:bg-fd-accent [&>div:last-child]:self-end [&_h3]:m-0 [&_h3]:text-sm [&_h3]:leading-snug [&_h3]:font-semibold [&_p]:m-0! [&_p]:text-xs [&_p]:leading-5 [&_p]:text-fd-muted-foreground"
                  description={task.description}
                  href={routeHref(language, task.slug)}
                  key={task.slug}
                  title={task.title}
                >
                  <span className="inline-flex items-center justify-between gap-2 text-xs font-semibold tracking-[0.04em] text-fd-primary uppercase">
                    {task.code}
                    <span className="inline-flex items-center gap-1 font-medium tracking-normal normal-case">
                      {content.openTask}
                      <Arrow />
                    </span>
                  </span>
                </Card>
              ))}
            </Cards>
          </li>
        </ol>
      </section>

      <section aria-labelledby="quick-start-support" className="border-t border-fd-border pt-5">
        <div className="mb-4 grid max-w-[43rem] gap-2">
          <p className="m-0 text-xs font-semibold tracking-[0.08em] text-fd-primary uppercase">{content.supportEyebrow}</p>
          <h2 className="m-0 text-xl leading-tight font-semibold tracking-[-0.02em]" id="quick-start-support">{content.supportTitle}</h2>
          <p className="m-0 text-sm leading-6 text-fd-muted-foreground">{content.supportDescription}</p>
        </div>
        <div className="grid grid-cols-3 gap-[2px] overflow-hidden rounded-[2px] border-2 border-fd-border bg-fd-border max-[46rem]:grid-cols-1">
          {content.support.map((item) => (
            <Link className="group grid min-h-24 content-between gap-3 bg-fd-background p-3.5 text-fd-foreground no-underline transition-colors duration-100 hover:bg-fd-accent" href={routeHref(language, item.slug)} key={item.slug}>
              <span className="flex items-center justify-between gap-2 text-xs font-semibold tracking-[0.04em] text-fd-primary uppercase">
                {item.code}
                <Arrow />
              </span>
              <span className="grid gap-0.5">
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
