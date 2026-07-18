// All user-facing copy lives here, in both English and Korean.
// Components read the dictionary for the active language via the Language context.
// Keep keys identical across `en` and `ko`.

export const translations = {
  en: {
    meta: { title: 'FinE Companion — a calmer way to understand your money' },
    nav: {
      brand: 'FinE Companion',
      tagline: 'An educational companion',
      promise: 'Our promise',
      how: 'How it works',
      learning: 'Learning',
      plans: 'My plans',
      begin: 'Take a look',
      menu: 'Menu',
    },
    hero: {
      eyebrow: 'Evidence-based financial education',
      headline: 'Understand your money, one honest step at a time.',
      sub: 'FinE Companion helps you understand your financial life, make better decisions, and build healthier habits. It works like an experienced educator sitting beside you — patient, honest, and entirely on your side. We educate. We never sell.',
      primary: 'Begin your checkup',
      secondary: 'Explore the Learning Center',
      horizonTitle: 'A companion across your horizons',
      horizon: {
        today: { label: 'Today', note: 'Notice one expense, mindfully.' },
        month: { label: 'This month', note: 'Build one small money check-in.' },
        year: { label: 'This year', note: 'Grow a starter safety fund.' },
        life: { label: 'Your financial life', note: 'Build something steady and your own.' },
      },
      horizonFoot: 'Each step teaches as you go.',
    },
    promise: {
      eyebrow: 'Trust, by design',
      heading: 'A companion that has no reason to mislead you.',
      sub: 'Most financial tools earn money when you buy something. FinE Companion does not. That single decision shapes everything here.',
      neverTitle: 'We will never',
      never: [
        'sell financial products',
        'recommend investments',
        'recommend insurance companies',
        'recommend tax strategies',
        'recommend legal strategies',
        'push commercial products',
      ],
      alwaysTitle: 'We will always',
      always: [
        'help you understand',
        'build your confidence',
        'improve your habits',
        'sharpen your decisions',
        'stay completely trustworthy',
      ],
    },
    pillars: {
      eyebrow: 'What every experience gives you',
      heading: 'Four things, every time you visit.',
      items: [
        { k: '01', title: 'Understanding', body: 'You leave knowing what is going on and why it matters to you.' },
        { k: '02', title: 'Learning', body: 'Every result, every module, every step teaches you something real.' },
        { k: '03', title: 'Action', body: 'You always know the next honest step — small enough to actually take.' },
        { k: '04', title: 'A reason to return', body: 'Your roadmap keeps growing with you, so coming back is worth it.' },
      ],
    },
    experiences: {
      eyebrow: 'Where you spend your time',
      heading: 'Three places. One companion.',
      roadmap: {
        tag: 'The heart',
        title: 'The Roadmap',
        body: 'Your living plan — not a report. It tells you what to do today, what to focus on this month, and the financial life you are building over time.',
        cta: 'Open the Roadmap',
      },
      checkup: {
        tag: 'Start here',
        title: 'The Checkup',
        body: 'A gentle, guided look at where you stand right now. No judgement, no jargon — just a clear picture and a place to begin.',
        cta: 'Begin your checkup',
      },
      learning: {
        tag: 'The library',
        title: 'The Learning Center',
        body: 'Short, evidence-based lessons you can trust. The modules are your classroom; this is the library you return to.',
        cta: 'Visit the Learning Center',
      },
    },
    companion: {
      eyebrow: 'A companion, not a report',
      heading: 'Five questions it helps you answer.',
      sub: 'These are the questions a good financial educator would sit with you and work through. Your roadmap holds them, and revisits them as life changes.',
      questions: [
        'What should I do today?',
        'What should I focus on this month?',
        'What habit should I build?',
        'What should I review regularly?',
        'What long-term financial life am I building?',
      ],
    },
    educator: {
      quote:
        'Every interaction is designed to feel like an experienced financial educator sitting beside you — patient, honest, and entirely on your side.',
      attribution: 'The FinE Companion philosophy',
    },
    cta: {
      heading: 'Ready when you are.',
      sub: 'Free to use. Private by default. Always educational, never commercial.',
      button: 'Begin your checkup',
      reassure: 'No products. No pressure. Just a clearer view of your money.',
    },
    footer: {
      mission:
        'An educational platform from FinE Lab — Financial Intelligence for Consumer Well-being.',
      colExplore: 'Explore',
      colTrust: 'Trust',
      links: {
        roadmap: 'Roadmap',
        checkup: 'Checkup',
        learning: 'Learning Center',
        promise: 'Our promise',
      },
      disclaimerTitle: 'A note on what this is',
      disclaimer:
        'FinE Companion is an educational tool. It does not provide financial, investment, insurance, tax, or legal advice, and it does not sell or recommend any product.',
      rights: '© 2026 FinE Companion. Built to be useful first.',
      lang: 'Language',
    },
    shell: {
      back: 'Back to home',
      soonLabel: 'In this Release Candidate',
      roadmap: {
        eyebrow: 'The heart',
        title: 'The Roadmap',
        body: 'Your living plan lives here — today, this month, this year, and the financial life you are building. This redesign focused on the Landing Page; the Roadmap module plugs in at this route with no change to the entrance you just came through.',
      },
      checkup: {
        eyebrow: 'Start here',
        title: 'The Checkup',
        body: 'A gentle, guided look at where you stand will live here, then hand you straight to your roadmap. This redesign focused on the Landing Page; the Checkup module plugs in at this route.',
      },
      learning: {
        eyebrow: 'The library',
        title: 'The Learning Center',
        body: 'Short, trustworthy, evidence-based lessons will live here. The modules are the classroom; this is the library. This redesign focused on the Landing Page; the Learning module plugs in at this route.',
      },
    },
  },

  ko: {
    meta: { title: 'FinE Companion — 내 돈을 더 차분하게 이해하는 법' },
    nav: {
      brand: 'FinE Companion',
      tagline: '금융 교육 동반자',
      promise: '우리의 약속',
      how: '이용 방법',
      learning: '러닝 센터',
      plans: '내 계획',
      begin: '한번 살펴보기',
      menu: '메뉴',
    },
    hero: {
      eyebrow: '근거 기반 금융 교육',
      headline: '당신의 돈을, 정직한 한 걸음씩 이해하세요.',
      sub: 'FinE Companion은 당신이 재정 생활을 이해하고, 더 나은 결정을 내리고, 더 건강한 습관을 만들도록 돕습니다. 경험 많은 교육자가 곁에 앉아 함께하는 것처럼 — 차분하고, 정직하며, 온전히 당신의 편입니다. 우리는 가르칩니다. 우리는 절대 팔지 않습니다.',
      primary: '체크업 시작하기',
      secondary: '러닝 센터 둘러보기',
      horizonTitle: '시간의 지평을 함께 걷는 동반자',
      horizon: {
        today: { label: '오늘', note: '지출 하나를 차분히 살펴보세요.' },
        month: { label: '이번 달', note: '작은 돈 점검 습관을 만드세요.' },
        year: { label: '올해', note: '기초 비상금을 키우세요.' },
        life: { label: '나의 재정 생활', note: '나만의 단단한 토대를 쌓으세요.' },
      },
      horizonFoot: '걸음마다 배움이 함께합니다.',
    },
    promise: {
      eyebrow: '신뢰를 설계합니다',
      heading: '당신을 호도할 이유가 전혀 없는 동반자.',
      sub: '대부분의 금융 도구는 당신이 무언가를 살 때 수익을 얻습니다. FinE Companion은 그렇지 않습니다. 이 하나의 결정이 이곳의 모든 것을 만듭니다.',
      neverTitle: '우리는 절대',
      never: [
        '금융 상품을 팔지 않습니다',
        '투자를 추천하지 않습니다',
        '보험 회사를 추천하지 않습니다',
        '세무 전략을 추천하지 않습니다',
        '법률 전략을 추천하지 않습니다',
        '상업적 상품을 권하지 않습니다',
      ],
      alwaysTitle: '우리는 언제나',
      always: [
        '이해를 돕습니다',
        '자신감을 키웁니다',
        '습관을 개선합니다',
        '결정을 더 또렷하게 합니다',
        '온전히 신뢰할 수 있습니다',
      ],
    },
    pillars: {
      eyebrow: '모든 경험이 드리는 것',
      heading: '방문할 때마다, 네 가지.',
      items: [
        { k: '01', title: '이해', body: '무슨 일이 일어나고 있는지, 왜 당신에게 중요한지 알고 떠납니다.' },
        { k: '02', title: '배움', body: '모든 결과, 모든 모듈, 모든 걸음이 실제로 무언가를 가르칩니다.' },
        { k: '03', title: '실천', body: '언제나 다음의 정직한 한 걸음을 압니다 — 실제로 해낼 만큼 작은 걸음.' },
        { k: '04', title: '다시 올 이유', body: '당신의 로드맵은 함께 자라기에, 다시 찾는 일이 가치가 됩니다.' },
      ],
    },
    experiences: {
      eyebrow: '당신이 머무는 곳',
      heading: '세 곳. 하나의 동반자.',
      roadmap: {
        tag: '심장',
        title: '로드맵',
        body: '보고서가 아니라 살아 있는 계획. 오늘 무엇을 할지, 이번 달 무엇에 집중할지, 그리고 당신이 시간을 들여 만들어 가는 재정 생활을 보여줍니다.',
        cta: '로드맵 열기',
      },
      checkup: {
        tag: '여기서 시작',
        title: '체크업',
        body: '지금 당신이 어디에 서 있는지 차분히 안내하며 살펴봅니다. 평가도, 어려운 용어도 없이 — 또렷한 그림과 시작할 자리를 드립니다.',
        cta: '체크업 시작하기',
      },
      learning: {
        tag: '도서관',
        title: '러닝 센터',
        body: '신뢰할 수 있는 짧은 근거 기반 학습. 모듈이 교실이라면, 이곳은 당신이 다시 찾는 도서관입니다.',
        cta: '러닝 센터 방문하기',
      },
    },
    companion: {
      eyebrow: '보고서가 아니라 동반자',
      heading: '함께 답을 찾는 다섯 가지 질문.',
      sub: '좋은 금융 교육자라면 당신과 마주 앉아 함께 풀어 갈 질문들입니다. 로드맵이 이 질문들을 품고, 삶이 변할 때마다 다시 살펴봅니다.',
      questions: [
        '오늘 나는 무엇을 해야 할까?',
        '이번 달 무엇에 집중해야 할까?',
        '어떤 습관을 만들어야 할까?',
        '무엇을 꾸준히 점검해야 할까?',
        '나는 어떤 장기적 재정 생활을 만들고 있을까?',
      ],
    },
    educator: {
      quote:
        '모든 상호작용은 경험 많은 금융 교육자가 곁에 앉아 함께하는 것처럼 느껴지도록 설계되었습니다 — 차분하고, 정직하며, 온전히 당신의 편으로.',
      attribution: 'FinE Companion의 철학',
    },
    cta: {
      heading: '준비되면, 언제든.',
      sub: '무료로 사용하세요. 기본적으로 비공개입니다. 언제나 교육적이며, 결코 상업적이지 않습니다.',
      button: '체크업 시작하기',
      reassure: '상품 없음. 압박 없음. 그저 당신의 돈을 더 또렷이.',
    },
    footer: {
      mission:
        'FinE Lab의 교육 플랫폼 — 소비자 웰빙을 위한 금융 인텔리전스.',
      colExplore: '둘러보기',
      colTrust: '신뢰',
      links: {
        roadmap: '로드맵',
        checkup: '체크업',
        learning: '러닝 센터',
        promise: '우리의 약속',
      },
      disclaimerTitle: '이것이 무엇인지에 대하여',
      disclaimer:
        'FinE Companion은 교육 도구입니다. 금융·투자·보험·세무·법률 자문을 제공하지 않으며, 어떤 상품도 판매하거나 추천하지 않습니다.',
      rights: '© 2026 FinE Companion. 무엇보다 먼저, 쓸모 있도록.',
      lang: '언어',
    },
    shell: {
      back: '홈으로 돌아가기',
      soonLabel: '이번 릴리스 후보에서',
      roadmap: {
        eyebrow: '심장',
        title: '로드맵',
        body: '살아 있는 계획이 이곳에 자리합니다 — 오늘, 이번 달, 올해, 그리고 당신이 만들어 가는 재정 생활. 이번 작업은 랜딩 페이지에 집중했으며, 로드맵 모듈은 방금 들어온 입구를 바꾸지 않고 이 경로에 연결됩니다.',
      },
      checkup: {
        eyebrow: '여기서 시작',
        title: '체크업',
        body: '지금 당신이 어디에 서 있는지 차분히 안내하는 화면이 이곳에 자리하고, 곧바로 로드맵으로 이어집니다. 이번 작업은 랜딩 페이지에 집중했으며, 체크업 모듈은 이 경로에 연결됩니다.',
      },
      learning: {
        eyebrow: '도서관',
        title: '러닝 센터',
        body: '신뢰할 수 있는 짧은 근거 기반 학습이 이곳에 자리합니다. 모듈이 교실이라면, 이곳은 도서관입니다. 이번 작업은 랜딩 페이지에 집중했으며, 러닝 모듈은 이 경로에 연결됩니다.',
      },
    },
  },
}

export const LANGUAGES = [
  { code: 'en', label: 'EN', full: 'English' },
  { code: 'ko', label: 'KO', full: '한국어' },
]
