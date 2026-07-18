// All Financial Wellness Checkup copy, in English and Korean.
// Plain language, educational only — no product, investment, insurance,
// tax, or legal recommendations anywhere.

export const checkupContent = {
  en: {
    intro: {
      eyebrow: 'Where you are today',
      title: "Let’s look at a few things together.",
      sub: 'You know more than enough to start. We’ll go through a few plain things about your money and see what they tell you. Nothing to study, nothing to get right.',
      time: '~2 minutes',
      privacy: 'Private. Stays on your device.',
      start: 'Take a look',
      assure: ['A rough estimate is always fine', 'Skip anything you\u2019re not sure of', 'Educational — never advice'],
      resumeTitle: 'You finished a checkup before.',
      resume: 'View your last checkup',
      fresh: 'Start a new one',
      clear: 'Clear it',
    },
    qReassure: 'No wrong answers · A rough number is fine · Your answers stay on this device',
    firstReflection: {
      aloud: 'Funny thing about money: we can usually recall what comes in far more clearly than where it goes. So we’ll start with the part you already know by heart.',
      response: 'Good. That’s the anchor; almost everything else hangs off this one number.',
    },
    between: {
      essentials: 'Money coming in is the easy half to picture. Now the half that counts: where it actually goes.',
      savings: 'Interesting. A shape is already starting to form. One more piece and we’ll see it.',
      retirement: 'Now we lift our eyes a little, past this month, toward the person you’ll be years from now.',
    },
    closing: 'Let’s see what all this quietly adds up to.',
    nav: { back: 'Back', next: 'Next', see: 'See my results', skip: 'Skip for now' },
    skipAck: 'That’s okay. We already have enough to begin understanding, and you can always come back to this later.',
    questions: [
      { id: 'income', type: 'number', label: "Roughly, what reaches you in a typical month?", help: 'Your take-home pay — the amount you actually get to spend. This is the one number you already carry in your head.' },
      { id: 'essentials', type: 'number', label: 'About how much goes to essentials each month?', help: 'The must-pays: housing, food, utilities, transport, minimum bills.' },
      { id: 'discretionary', type: 'number', label: 'And roughly how much on non-essentials?', help: 'The nice-to-haves: eating out, subscriptions, fun, extras. Enter 0 if none.' },
      { id: 'debt', type: 'number', label: 'How much do you pay toward debts each month?', help: 'Credit cards and loans — not counting rent or mortgage. Enter 0 if none.' },
      { id: 'savings', type: 'number', label: 'How much could you reach quickly if you needed it?', help: 'Cash and savings you could access within a few days. Enter 0 if none.' },
      {
        id: 'retirement', type: 'choice', label: 'Are you putting money toward retirement?', help: 'Through work, on your own, anywhere at all.',
        options: [
          { value: 'regularly', label: 'Yes, regularly' },
          { value: 'sometimes', label: 'Now and then' },
          { value: 'notyet', label: 'Not yet' },
          { value: 'notsure', label: "I'm not sure" },
        ],
      },
      {
        id: 'insurance', type: 'choice', label: 'How clear are you on your insurance coverage?', help: 'Health, auto, home or renter, and so on — how well you understand what you have.',
        options: [
          { value: 'notAtAll', label: 'Not clear at all' },
          { value: 'somewhat', label: 'Somewhat clear' },
          { value: 'mostly', label: 'Mostly clear' },
          { value: 'veryClear', label: 'Very clear' },
        ],
      },
      {
        id: 'risk', type: 'choice', label: 'How do you feel about taking financial risk for possible gain?', help: "There's no right answer here — just your honest comfort.",
        options: [
          { value: 0, label: 'Very uncomfortable' },
          { value: 1, label: 'Somewhat uncomfortable' },
          { value: 2, label: 'Neutral' },
          { value: 3, label: 'Somewhat comfortable' },
          { value: 4, label: 'Very comfortable' },
        ],
      },
      {
        id: 'stressWorry', type: 'choice', label: 'In the past month, how often did money feel stressful?',
        options: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Rarely' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Often' },
          { value: 4, label: 'Almost always' },
        ],
      },
      {
        id: 'stressControl', type: 'choice', label: 'How in control of your finances do you feel?',
        options: [
          { value: 0, label: 'Very in control' },
          { value: 1, label: 'Mostly' },
          { value: 2, label: 'Somewhat' },
          { value: 3, label: 'A little' },
          { value: 4, label: 'Not at all' },
        ],
      },
    ],
    results: {
      eyebrow: 'Your checkup',
      meaning: {
        reveal: 'When you’re ready',
        strength: {
          q: 'Sit with your steadiest piece for a moment. What does it quietly make possible for you?',
          a: 'Whatever came to mind, hold onto it. That’s the floor everything else stands on: easy to overlook, and worth more than it looks.',
        },
        priority: {
          q: 'And the one piece worth a little care. What would ease in your life if it eased?',
          a: 'That feeling is the point. Not because anything’s wrong, but because a small move here steadies a lot else.',
        },
        close: {
          q: 'One last thing. These pieces were never really separate; they’re one life, yours. What you take from seeing it whole is something only you can name. So we’ll leave it with you.',
        },
      },
      title: "Here's where you stand.",
      whatLabel: 'What this means',
      whyLabel: 'Why it matters',
      stepLabel: 'One small step',
      scoreOutOf: 'out of 100',
      restart: 'Start over',
      home: 'Back to home',
      learn: 'Explore the Learning Center',
      disclaimer:
        "FinE Companion is an educational tool. It doesn't give financial, investment, insurance, tax, or legal advice, and it never recommends products.",

      story: {
        thanksEyebrow: 'Well done',
        thanksTitle: 'Thank you for taking this time.',
        thanksBody:
          "Sitting with your finances honestly is something most people quietly avoid. You just did it — and that willingness to look clearly is where every good money decision begins.",

        todayLabel: 'Where you are today',
        todaySummaries: {
          strong:
            'Overall, your financial foundation looks steady and well cared for. You have built real habits and a real cushion — the kind of footing most people are still working toward.',
          stable:
            'Overall, your financial foundation appears reasonably stable, with clear strengths to build on and just a few areas that would reward a little attention.',
          mixed:
            'Overall, your picture is a genuine work in progress. Some solid pieces are already in place, and a few areas are ready for gentle, steady attention — nothing here needs to happen all at once.',
          stretched:
            "Overall, things feel a little stretched right now — and that is okay. Money gets tight for all kinds of reasons that aren't about you failing. What matters is that you are looking clearly, and small steps from here really do add up.",
        },

        cashflowRecognition: {
          short: 'You looked honestly at a tight month — that isn\u2019t always easy, and we heard it.',
          even: 'You looked honestly at a month that lands close to even — thank you for sharing it as it is.',
          healthy: 'You looked honestly at a month with a little room in it — good to see.',
          strong: 'You looked honestly at a month with real room in it — good to see.',
        },

        strengthsLabel: "What's going well",
        strengthsIntro:
          "First, what you’re already doing right.",
        strengthCopy: {
          emergency: "You've built real room to lean on — time and choice already protected if life interrupts.",
          cashflow: 'You keep a healthy margin each month, which is the quiet engine behind every other goal.',
          debt: "Debt isn't weighing heavily on your budget, so more of your income stays yours.",
          retirement: 'You are already putting money toward your future self — and time is on your side.',
          insurance: 'You understand your coverage well, which is a quiet but real kind of security.',
          stress: 'Money has not been a heavy weight lately, which frees you to think and plan clearly.',
          reflection: 'You took the time to reflect honestly on your finances — the hardest and most important first step.',
          clarity: 'You now have a clearer picture of where you stand, and clarity is something you can build on.',
        },

        priorityLabel: 'One thing worth focusing on first',
        connectLabel: 'How this fits together',
        connectBody:
          'These areas move together. Your cash flow feeds your savings, your savings soften a setback, and less worry makes every other choice easier. You don\u2019t have to fix them one by one. A small move in one place tends to help the others.',
        continuity:
          'And the room you keep doesn\u2019t disappear at month\u2019s end — kept a little at a time, it can quietly become something to lean on later: more breathing room, a gentler landing when life jolts, a little more say over what comes next.',
        revisitLabel: 'Why a fresh look helps',
        revisitBody:
          'Your life keeps moving, so it\u2019s worth coming back now and then. Each look tends to make a little more sense than the last. And one small step you\u2019ll actually take beats a big plan that overwhelms you.',
        priorityIntro:
          "You don't need to fix everything at once. If you change just one thing, let it be this.",
        priorityCopy: {
          cashflow: {
            title: 'Gently closing the gap between spending and income',
            means:
              "Right now a little more goes out than comes in each month. This isn't about blame — it's the most powerful lever you have, because a small monthly surplus is what everything else (savings, calm, choices) grows from. Free up a little breathing room first, and every other step gets easier.",
          },
          emergency: {
            title: 'Starting a small emergency cushion',
            means:
              'A modest cash buffer is the difference between a surprise being a hassle and a surprise becoming debt. It is the foundation that makes everything else feel less fragile — and it does not need to be big to start working. Even one week of must-pays changes how a hard month feels.',
          },
          debt: {
            title: 'Easing the pressure from monthly debt',
            means:
              'A large share of your income is going to debt payments, which quietly limits every other choice. Focusing on one debt at a time — while keeping the rest current — turns a heavy, vague weight into a series of small, satisfying wins, and slowly hands your income back to you.',
          },
          retirement: {
            title: 'Beginning something for your future self',
            means:
              "The biggest advantage in retirement saving isn't income — it's time. Starting small now, even a little, gives your money years to grow quietly in the background. The best day to begin is simply the day you begin, and starting is the whole trick.",
          },
          insurance: {
            title: 'Getting clear on the coverage you already have',
            means:
              "Your coverage feels a bit unclear right now, and understanding it is how you avoid a painful surprise at the worst moment. This isn't about buying more of anything — just knowing what you already have, so it can actually protect you when it counts.",
          },
          stress: {
            title: 'Easing the weight money has been carrying',
            means:
              "Money has been stressful lately, and that is a real thing to take seriously — not a personal failing. Lightening that load, even a little, isn't separate from your finances; it is part of them. A calmer mind makes clearer decisions, and you do not have to carry this alone.",
          },
          steady: {
            title: 'Choosing your next meaningful goal',
            means:
              "You are in a genuinely solid position — so the question shifts from 'what needs fixing' to 'what do I want to build?' Picking one goal that actually matters to you gives all this steadiness a direction, and turns good habits into a life you are deliberately shaping.",
          },
        },

        detailsIntro:
          "If you'd like the full picture, here is each area on its own. No need to read it all — it will be here whenever you want it.",
        detailsShow: 'Show the full breakdown',
        detailsHide: 'Hide the full breakdown',
        roadmapShow: 'See your roadmap',
        roadmapHide: 'Hide roadmap',
      },

      snapshots: {
        cashflow: {
          title: 'Cash flow', perMonth: 'left each month', planBridge: { lead: 'Curious what one change would do?', label: 'Explore your room' },
          states: {
            short: { headline: 'Spending a little more than comes in', what: 'Right now your monthly spending edges above your income.', why: 'Even a small monthly gap adds up over a year and makes everything else harder to build.', step: 'Pick one expense from this month and see whether it could be paused or trimmed.' },
            even: { headline: 'Just about breaking even', what: 'Your income and spending are close to balanced, with a little left over.', why: 'Breaking even is a real achievement — and a small surplus is what savings grow from.', step: 'Try setting aside one small fixed amount the day you are paid, before anything else.' },
            healthy: { headline: 'A healthy margin', what: 'You keep a comfortable share of your income each month.', why: 'That margin is your room to build savings, ease debt, and handle surprises.', step: 'Give your leftover a name — a buffer, a goal — so it has somewhere to go.' },
            strong: { headline: 'A strong margin', what: 'You hold on to a strong share of your income each month.', why: 'This is the kind of margin that turns goals into milestones over time.', step: "Decide ahead of time where this month's surplus goes, so it doesn't drift." },
          },
        },
        emergency: {
          title: 'Emergency fund', unit: 'months of must-pays covered',
          recognition: {
            none: 'Here’s your reachable room, as it stands right now.',
            building: 'Here’s the room you’ve been quietly setting aside.',
            solid: 'Here’s the room you’ve built so far.',
            cushioned: 'Here’s the room you’ve built.',
          },
          bridge: { lead: 'You might be wondering:', question: 'How much of a cushion is enough?' },
          states: {
            none: { headline: 'Just getting started', what: 'You have less than a month of must-pay costs set aside.', why: 'Even a small amount you can reach turns a surprise into a little time — and that time is what keeps a setback from forcing your hand.', step: 'Pick one savings spot and put a first small amount in this week.' },
            building: { headline: 'A cushion forming', what: 'You could cover your must-pays for one to three months.', why: 'The room you’re building is becoming time you can lean on when the month is interrupted. A common range can orient you, but what’s enough depends on your own life.', step: 'Add a little each month, on the same day, so it grows without thinking.' },
            solid: { headline: 'Solid footing', what: 'You have roughly three to six months of must-pays saved.', why: 'Room like this already buys you time when life shifts, and that time is what protects your choices — and enough is set by your own life, not a fixed number.', step: 'Keep it topped up, and let it quietly do its job in the background.' },
            cushioned: { headline: 'Well cushioned', what: 'You have six months or more of must-pays set aside.', why: 'You have real room to lean on — meaningful flexibility if life interrupts. There’s no single right amount and more isn’t automatically better; this already gives you time and choice.', step: 'Feel good about this — and consider what your next money goal might be.' },
          },
        },
        debt: {
          title: 'Debt pressure', ofIncome: 'of income goes to debt',
          states: {
            none: { headline: 'No monthly debt pressure', what: "You don't have monthly debt payments weighing on your budget.", why: 'Staying free of heavy payments keeps more of your income yours.', step: 'If you ever borrow, check the monthly payment against your income first.' },
            light: { headline: 'Light', what: 'A small slice of your income goes to debt each month.', why: 'A light load is usually very manageable and easy to stay ahead of.', step: 'Keep paying on time — that steady record quietly works in your favor.' },
            moderate: { headline: 'Moderate', what: 'A noticeable share of your income goes to debt payments.', why: "It's workable, but it does limit how much is free for saving and goals.", step: 'Try adding a little extra to your smallest debt while covering the rest.' },
            heavy: { headline: 'Heavy', what: 'A large share of your income goes to debt each month.', why: 'Many use around a third of income as a comfort line; above it, budgets feel tight.', step: 'Pick one debt to focus on first — a single point of progress helps a lot.' },
          },
        },
        insurance: {
          title: 'Insurance awareness',
          states: {
            notAtAll: { headline: 'Worth a closer look', what: 'Your coverage feels unclear to you right now.', why: 'Understanding your coverage is how you avoid nasty surprises when you need it.', step: 'Find one policy you already have and read what it actually covers.' },
            somewhat: { headline: 'Partly clear', what: 'You have a rough sense of your coverage, with some gaps.', why: 'Filling small knowledge gaps now saves confusion at the worst possible time.', step: "Pick the one policy you're least sure about and skim its summary page." },
            mostly: { headline: 'Mostly clear', what: 'You understand most of your coverage well.', why: 'Clarity here means fewer unknowns and steadier peace of mind.', step: 'Do a quick yearly glance to catch anything that has changed.' },
            veryClear: { headline: 'Clear and confident', what: 'You know your coverage well.', why: 'That confidence is a quiet, real form of financial security.', step: 'Keep a simple list of your policies somewhere easy to find.' },
          },
        },
        retirement: {
          title: 'Retirement readiness',
          states: {
            regularly: { headline: 'Actively building', what: "You're putting money toward retirement on a regular basis.", why: 'Steady contributions plus time are the biggest allies most people have.', step: "Once a year, check in on what you're setting aside and how it's going." },
            sometimes: { headline: 'Building now and then', what: 'You contribute toward retirement occasionally.', why: 'Even irregular saving helps — and a small steady rhythm helps more.', step: 'Pick one modest amount you could set aside on a regular schedule.' },
            notyet: { headline: 'Not started yet', what: "You're not putting money toward retirement right now.", why: 'Starting early gives your money the one thing it loves most: time.', step: 'Find out whether your workplace offers any retirement option, and what it is.' },
            notsure: { headline: 'Worth checking', what: "You're not certain whether anything is going toward retirement.", why: 'Knowing where you stand is the first, freeing step.', step: 'Check whether any money currently flows toward retirement for you.' },
          },
        },
        stress: {
          title: 'Financial stress (basic)',
          states: {
            low: { headline: 'Low', what: "Money hasn't felt like a heavy weight lately.", why: 'Lower stress makes it easier to think clearly and plan ahead.', step: "Notice what's working for you right now, and keep it." },
            moderate: { headline: 'Moderate', what: 'Money brings some stress, on and off.', why: 'A little stress is normal; naming it keeps it from running the show.', step: "Pick the one money worry that's loudest and give it ten minutes this week." },
            elevated: { headline: 'Elevated', what: 'Money has been weighing on you fairly often.', why: "Ongoing stress is real and tiring — and it's not a personal failing.", step: 'Choose one small money task and finish just that. Momentum eases worry.' },
            high: { headline: 'High', what: 'Money stress has been heavy lately.', why: "Carrying this alone is hard, and you don't have to.", step: 'Sharing it with someone you trust, or a free nonprofit financial counselor, can lighten the load.' },
          },
        },
        risk: {
          title: 'Risk comfort (basic)',
          note: 'This is about knowing yourself — not a nudge to take more or less risk.',
          states: {
            cautious: { headline: 'Cautious', what: 'You lean toward safety and steadiness with money.', why: 'Knowing this helps you choose paths you can stick with, calmly.', step: 'When a money choice feels stressful, trust that steadiness is a valid style.' },
            balanced: { headline: 'Balanced', what: "You're somewhere in the middle on financial risk.", why: 'A flexible comfort level lets you weigh choices case by case.', step: 'Notice which decisions feel easy and which feel tense — that\u2019s useful self-knowledge.' },
            comfortable: { headline: 'Comfortable', what: "You're relatively at ease with financial risk.", why: 'Comfort with uncertainty is fine — pairing it with a safety net keeps it grounded.', step: 'Make sure the basics (cushion, must-pays) feel secure alongside any bolder choices.' },
          },
        },
      },

      roadmap: {
        eyebrow: 'Your roadmap',
        title: 'A few steps, in your corner.',
        sub: "Not a to-do list to feel behind on — just a gentle path, from today to the life you're building. Take them one at a time.",
        whyLabel: 'Why it helps',
        supportsLabel: 'Builds toward',
        horizons: { today: 'Today', next30: 'Next 30 days', habits: 'Monthly habits', sixTwelve: 'Next 6–12 months', longterm: 'Long-term vision' },
        today: {
          cashflow: { action: 'Write down your three biggest expenses this month.', why: "You can't shift what you can't see, and this takes five minutes.", supports: 'The first step toward a monthly surplus.' },
          emergency: { action: 'Choose where your emergency cushion will live — even an empty account counts.', why: 'A named place makes saving feel real instead of abstract.', supports: 'The start of a little time between you and a surprise.' },
          debt: { action: 'List your debts with their monthly payments, smallest to largest.', why: 'Seeing them together turns a vague weight into something you can plan around.', supports: 'A clear starting point for easing debt pressure.' },
          retirement: { action: 'Write down one question you have about saving for retirement.', why: 'Curiosity is easier to act on than pressure — a question is a gentle start.', supports: 'Momentum toward beginning something for your future.' },
          insurance: { action: 'Find one policy you already have and locate what it covers.', why: 'Ten minutes now can save real confusion later.', supports: 'Growing confidence in the protection you already have.' },
          stress: { action: "Take a breath and name the single money worry that's loudest.", why: 'Naming a worry shrinks it from a fog into one thing you can hold.', supports: 'A little more calm, starting today.' },
          steady: { action: "Take a moment to notice how far you've already come.", why: 'Acknowledging progress is what makes it sustainable.', supports: 'The confidence to choose what comes next.' },
        },
        next30: {
          cashflow: { action: 'Pick one expense to gently trim, and move what you save somewhere on purpose.', why: "Small, deliberate cuts beat dramatic ones you can't sustain.", supports: 'A growing monthly margin you can feel.' },
          emergency: { action: 'Set up one small automatic transfer to savings on payday.', why: 'Automating it means you save without having to decide each time.', supports: 'Time you can lean on, growing quietly in the background.' },
          debt: { action: 'Put a little extra toward your smallest debt while paying the minimums on the rest.', why: 'Finishing one debt gives you a real win and frees up its payment.', supports: 'The first domino in easing debt pressure.' },
          retirement: { action: 'Find out what retirement option, if any, is available to you and how it works.', why: "You can't use a door you don't know is there.", supports: 'A confident, informed start on your future.' },
          insurance: { action: "Read one policy fully, so you know what it does and doesn't cover.", why: 'Understanding one at a time keeps it from feeling overwhelming.', supports: 'Real clarity about your safety net.' },
          stress: { action: "Choose one money task you've been avoiding and do just that one.", why: 'Avoidance feeds worry; a single finished task starves it.', supports: 'Momentum that makes the next step lighter.' },
          steady: { action: 'Pick one good habit and make it a little stronger.', why: 'Deepening what works often beats adding something new.', supports: 'A steadier foundation to build on.' },
        },
        sixTwelve: {
          cashflow: { action: 'Aim to keep a steady, named margin every month.', why: 'Consistency compounds — a small surplus kept every month beats a big one kept rarely.', supports: 'Lasting breathing room in your budget.' },
          emergency: { action: 'Build toward one month of must-pay costs, then keep going.', why: 'The first month is the hardest and the most protective; milestones keep it motivating.', supports: 'Room that turns a hard stretch into time and choice.' },
          debt: { action: 'Clear one debt completely, then roll its payment onto the next.', why: "This 'snowball' turns freed-up payments into accelerating progress.", supports: 'Momentum that steadily lightens your load.' },
          retirement: { action: 'Understand your options well enough to make one confident choice.', why: "One informed decision now beats years of 'I'll get to it.'", supports: "A future self who's quietly being looked after." },
          insurance: { action: 'Get clear on each main type of coverage, so none of it is a mystery.', why: 'Whole-picture clarity means no gaps hiding in the fine print.', supports: 'Steady, well-founded peace of mind.' },
          stress: { action: 'Build one or two money routines that quietly take worry off your plate.', why: 'Routines move decisions from your shoulders to your calendar.', supports: 'A calmer, more predictable relationship with money.' },
          steady: { action: 'Choose one goal that excites you and give it a finish line.', why: 'A deadline turns a wish into a plan.', supports: 'Direction for all the stability you have built.' },
        },
        habits: [
          { action: 'A ten-minute money check-in, the same day each week.', why: 'Regular, low-stakes attention keeps small issues from becoming big ones.', supports: 'A sense of being in control, not chasing.' },
          { action: 'Pay yourself first — move one small set amount to savings the day income arrives.', why: 'Saving before spending is what makes it actually happen.', supports: 'Steady, almost effortless growth in your cushion.' },
          { action: 'Sleep on any big purchase for one night before deciding.', why: 'A single night dissolves most impulse buys and keeps the ones that matter.', supports: 'Spending that reflects what you truly value.' },
        ],
        longterm: {
          building:
            "The financial life you're building isn't about being perfect with money. It's steady steps that add up to room to breathe, choices that are yours, and a little more calm each season. Each steady step is you quietly looking after the person you'll become, with time working alongside you, not against you. You've started, and that's the hard part.",
          strengthening:
            "You've built real footing. From here the work grows quieter: protecting what you've made, deepening your cushion, and letting your money serve the life you actually want. Keep going — you're doing this well.",
        },
      },
    },
  },

  ko: {
    intro: {
      eyebrow: '지금 나의 자리',
      title: '몇 가지를 같이 살펴봐요.',
      sub: '시작하기엔 이미 충분히 알고 있어요. 돈에 관한 단순한 몇 가지를 살펴보고, 그게 무엇을 말해 주는지 보는 거예요. 공부할 것도, 맞혀야 할 것도 없어요.',
      time: '약 2분',
      privacy: '비공개. 기기에만 저장돼요.',
      start: '한번 살펴보기',
      assure: ['대략적인 추정으로 충분해요', '잘 모르는 건 건너뛰어도 돼요', '교육 목적이에요 — 자문이 아니에요'],
      resumeTitle: '이전에 마친 체크업이 있어요.',
      resume: '지난 체크업 보기',
      fresh: '새로 시작하기',
      clear: '지우기',
    },
    qReassure: '틀린 답은 없어요 · 대략적인 숫자면 충분해요 · 답은 기기에만 저장돼요',
    firstReflection: {
      aloud: '돈에 관한 재미있는 점 하나. 우리는 들어오는 돈은 꽤 또렷하게 떠올리면서도, 그게 어디로 빠져나가는지는 잘 떠올리지 못해요. 그러니 이미 훤히 아는 부분부터 시작해요.',
      response: '좋아요. 이게 기준점이에요. 앞으로 볼 거의 모든 게 이 한 숫자에 매달려 있거든요.',
    },
    between: {
      essentials: '들어오는 돈은 그리기 쉬운 절반이에요. 이제 중요한 나머지 절반, 그게 실제로 어디로 가는지요.',
      savings: '흥미롭네요. 벌써 어떤 모양이 잡히기 시작해요. 한 조각만 더 놓으면 보일 거예요.',
      retirement: '이제 시선을 조금 들어 봐요. 이번 달을 지나, 몇 년 뒤의 당신에게로요.',
    },
    closing: '이 모든 게 조용히 무엇으로 모이는지 살펴봐요.',
    nav: { back: '이전', next: '다음', see: '결과 보기', skip: '지금은 건너뛰기' },
    skipAck: '괜찮아요. 이해를 시작하기엔 이미 충분하고, 이건 언제든 다시 돌아와도 돼요.',
    questions: [
      { id: 'income', type: 'number', label: '보통 한 달에, 대략 얼마가 들어오나요?', help: '실수령액 — 실제로 쓸 수 있는 돈이요. 이미 머릿속에 지니고 있는 바로 그 숫자예요.' },
      { id: 'essentials', type: 'number', label: '매달 꼭 필요한 지출은 대략 얼마인가요?', help: '반드시 나가는 돈: 주거, 식비, 공과금, 교통, 최소 청구액.' },
      { id: 'discretionary', type: 'number', label: '꼭 필요하지 않은 지출은 대략 얼마인가요?', help: '있으면 좋은 것들: 외식, 구독, 여가, 여윳돈. 없으면 0을 입력하세요.' },
      { id: 'debt', type: 'number', label: '매달 갚는 빚은 얼마인가요?', help: '신용카드와 대출 — 월세나 주택담보대출은 제외합니다. 없으면 0을 입력하세요.' },
      { id: 'savings', type: 'number', label: '필요할 때 빠르게 꺼낼 수 있는 돈은 얼마인가요?', help: '며칠 안에 쓸 수 있는 현금과 예적금. 없으면 0을 입력하세요.' },
      {
        id: 'retirement', type: 'choice', label: '노후를 위해 돈을 모으고 있나요?', help: '직장을 통해서든, 개인적으로든, 어디서든요.',
        options: [
          { value: 'regularly', label: '네, 꾸준히요' },
          { value: 'sometimes', label: '가끔씩요' },
          { value: 'notyet', label: '아직이요' },
          { value: 'notsure', label: '잘 모르겠어요' },
        ],
      },
      {
        id: 'insurance', type: 'choice', label: '내 보험 보장 내용을 얼마나 알고 있나요?', help: '건강, 자동차, 주택·임차 등 — 내가 가진 보장을 얼마나 이해하는지요.',
        options: [
          { value: 'notAtAll', label: '전혀 모르겠어요' },
          { value: 'somewhat', label: '조금 알아요' },
          { value: 'mostly', label: '대체로 알아요' },
          { value: 'veryClear', label: '아주 잘 알아요' },
        ],
      },
      {
        id: 'risk', type: 'choice', label: '이익을 위해 재정적 위험을 감수하는 것에 대해 어떻게 느끼나요?', help: '정답은 없어요 — 그저 솔직한 편안함의 정도면 됩니다.',
        options: [
          { value: 0, label: '매우 불편해요' },
          { value: 1, label: '조금 불편해요' },
          { value: 2, label: '보통이에요' },
          { value: 3, label: '조금 편해요' },
          { value: 4, label: '매우 편해요' },
        ],
      },
      {
        id: 'stressWorry', type: 'choice', label: '지난 한 달 동안 돈 때문에 스트레스를 느낀 적이 얼마나 되나요?',
        options: [
          { value: 0, label: '전혀 없어요' },
          { value: 1, label: '드물게요' },
          { value: 2, label: '가끔요' },
          { value: 3, label: '자주요' },
          { value: 4, label: '거의 항상요' },
        ],
      },
      {
        id: 'stressControl', type: 'choice', label: '내 재정을 얼마나 잘 통제하고 있다고 느끼나요?',
        options: [
          { value: 0, label: '아주 잘 통제해요' },
          { value: 1, label: '대체로요' },
          { value: 2, label: '어느 정도요' },
          { value: 3, label: '조금요' },
          { value: 4, label: '전혀요' },
        ],
      },
    ],
    results: {
      eyebrow: '나의 체크업',
      meaning: {
        reveal: '준비되면',
        strength: {
          q: '여기서 가장 든든한 조각에 잠시 머물러 봐요. 그게 당신에게 조용히 무엇을 가능하게 해 주나요?',
          a: '무엇이 떠올랐든 그걸 붙잡아요. 그게 나머지 모두가 딛고 서는 바닥이에요. 지나치기 쉽지만, 보이는 것보다 훨씬 값지죠.',
        },
        priority: {
          q: '그리고 조금 마음 써 볼 만한 한 조각이요. 그게 편해지면, 당신의 삶에서 무엇이 편해질까요?',
          a: '그 느낌이 핵심이에요. 뭔가 잘못돼서가 아니라, 여기서의 작은 움직임이 다른 많은 것을 함께 다독여 주기 때문이죠.',
        },
        close: {
          q: '마지막으로 하나. 이 조각들은 사실 한 번도 따로였던 적이 없어요. 하나의 삶, 당신의 삶이죠. 그걸 온전히 보고 무엇을 가져갈지는 오직 당신만이 이름 붙일 수 있어요. 그건 당신께 맡길게요.',
        },
      },
      title: '지금 당신은 여기에 있어요.',
      whatLabel: '무슨 뜻인가요',
      whyLabel: '왜 중요한가요',
      stepLabel: '작은 한 걸음',
      scoreOutOf: '100점 만점',
      restart: '다시 시작',
      home: '홈으로',
      learn: '러닝 센터 둘러보기',
      disclaimer: 'FinE Companion은 교육 도구입니다. 금융·투자·보험·세무·법률 자문을 제공하지 않으며, 어떤 상품도 추천하지 않습니다.',

      story: {
        thanksEyebrow: '잘하셨어요',
        thanksTitle: '시간 내어 살펴봐 주셔서 고마워요.',
        thanksBody:
          '자신의 재정을 솔직하게 마주하는 일은 많은 사람이 조용히 미루는 일이에요. 당신은 방금 그 일을 해냈어요 — 그리고 또렷이 바라보려는 그 마음이, 모든 좋은 돈 결정이 시작되는 자리입니다.',

        todayLabel: '지금 당신은 여기에',
        todaySummaries: {
          strong:
            '전반적으로, 당신의 재정 토대는 안정적이고 잘 돌봐진 모습이에요. 진짜 습관과 진짜 완충을 이미 쌓아 두었죠 — 많은 사람이 아직 향해 가고 있는 그 발판을요.',
          stable:
            '전반적으로, 당신의 재정 토대는 꽤 안정적으로 보여요. 이어 갈 분명한 강점들이 있고, 조금 더 살펴보면 좋을 영역이 몇 곳 있을 뿐이에요.',
          mixed:
            '전반적으로, 당신의 그림은 진행 중인 작품이에요. 단단한 조각들이 이미 자리 잡았고, 몇몇 영역은 부드럽고 꾸준한 관심을 기다리고 있어요 — 무엇도 한꺼번에 할 필요는 없습니다.',
          stretched:
            '전반적으로 지금은 조금 빠듯하게 느껴져요 — 그리고 그래도 괜찮아요. 돈은 당신의 잘못과는 무관한 여러 이유로 빠듯해집니다. 중요한 건 당신이 또렷이 바라보고 있다는 것이고, 여기서의 작은 걸음들은 정말로 쌓여 갑니다.',
        },

        cashflowRecognition: {
          short: '빠듯했던 한 달을 솔직하게 들여다보셨어요 — 쉽지 않은 일인데, 잘 보셨어요.',
          even: '수입과 지출이 엇비슷했던 한 달을 있는 그대로 나눠 주셨네요 — 고마워요.',
          healthy: '조금의 여유가 있던 한 달을 솔직하게 들여다보셨어요 — 보기 좋아요.',
          strong: '든든한 여유가 있던 한 달을 솔직하게 들여다보셨어요 — 보기 좋아요.',
        },

        strengthsLabel: '잘되고 있는 것',
        strengthsIntro:
          '먼저, 당신이 이미 잘하고 있는 것들이에요.',
        strengthCopy: {
          emergency: '기댈 수 있는 진짜 여유를 쌓았어요 — 삶이 흔들려도 시간과 선택이 이미 지켜지죠.',
          cashflow: '매달 건강한 여유를 지키고 있어요. 다른 모든 목표를 뒤에서 움직이는 조용한 엔진이에요.',
          debt: '빚이 예산을 크게 누르지 않아, 수입의 더 많은 부분이 온전히 당신 것으로 남아요.',
          retirement: '이미 미래의 자신을 위해 돈을 넣고 있어요 — 그리고 시간이 당신 편이에요.',
          insurance: '보장 내용을 잘 이해하고 있어요. 조용하지만 진짜인 안정의 한 형태죠.',
          stress: '요즘 돈이 큰 짐처럼 느껴지지 않아, 또렷이 생각하고 계획할 여유가 있어요.',
          reflection: '시간을 내어 자신의 재정을 솔직하게 돌아봤어요 — 가장 어렵고 가장 중요한 첫걸음이에요.',
          clarity: '이제 자신이 어디에 서 있는지 더 또렷이 알게 됐고, 그 또렷함 위에 쌓아 갈 수 있어요.',
        },

        priorityLabel: '먼저 집중하면 좋을 한 가지',
        connectLabel: '이것들이 어떻게 이어지는가',
        connectBody:
          '이 영역들은 서로 맞물려 움직여요. 현금 흐름이 저축을 채우고, 저축이 뜻밖의 일을 완화하고, 걱정이 줄면 다른 모든 선택이 쉬워져요. 하나씩 따로 고칠 필요는 없어요. 한 곳의 작은 변화가 다른 곳들을 돕는 경향이 있어요.',
        continuity:
          '그리고 지켜 둔 여유는 월말에 사라지지 않아요 — 조금씩 꾸준히 남겨 두면, 시간이 지나며 기댈 수 있는 무언가가 되어 줄 수 있어요: 조금 더 넉넉한 숨, 흔들릴 때 더 부드러운 착지, 다음을 고를 수 있는 조금 더 큰 여지로요.',
        revisitLabel: '다시 보는 것이 도움이 되는 이유',
        revisitBody:
          '삶은 계속 움직이니, 가끔 다시 돌아와 보면 좋아요. 볼 때마다 지난번보다 조금씩 더 또렷해지곤 해요. 그리고 압도하는 큰 계획보다, 실제로 밟을 작은 한 걸음이 나아요.',
        priorityIntro:
          '모든 걸 한 번에 고칠 필요는 없어요. 단 하나만 바꾼다면, 이걸로 하세요.',
        priorityCopy: {
          cashflow: {
            title: '지출과 수입 사이의 간격을 부드럽게 좁히기',
            means:
              '지금은 매달 들어오는 것보다 나가는 게 조금 더 많아요. 이건 탓하려는 게 아니라, 당신이 가진 가장 강력한 지렛대예요. 작은 월별 여유가 다른 모든 것(저축·평온·선택)이 자라는 씨앗이거든요. 숨 쉴 공간을 조금 먼저 만들면, 다음의 모든 걸음이 한결 쉬워집니다.',
          },
          emergency: {
            title: '작은 비상금부터 시작하기',
            means:
              '작은 현금 완충은, 예상 밖의 일이 성가심에 그치느냐 빚이 되느냐를 가르는 차이예요. 다른 모든 걸 덜 위태롭게 만드는 토대이고, 작동하기 시작하는 데 큰돈이 필요하지도 않아요. 단 일주일치 필수 지출만으로도 힘든 달의 느낌이 달라집니다.',
          },
          debt: {
            title: '매달의 빚 부담 덜어 내기',
            means:
              '수입의 큰 몫이 빚 상환으로 나가고 있고, 그것이 다른 모든 선택을 조용히 제약해요. 나머지를 제때 갚으면서 한 번에 하나의 빚에 집중하면, 무겁고 막연한 짐이 작고 뿌듯한 승리들로 바뀌고, 수입이 천천히 당신 손으로 돌아옵니다.',
          },
          retirement: {
            title: '미래의 자신을 위해 무언가 시작하기',
            means:
              '노후 저축에서 가장 큰 이점은 수입이 아니라 시간이에요. 지금 작게라도 시작하면, 돈이 뒤에서 조용히 자랄 여러 해를 얻게 됩니다. 시작하기 가장 좋은 날은 그저 시작하는 날이고, 시작하는 것 자체가 비결의 전부예요.',
          },
          insurance: {
            title: '이미 가진 보장부터 또렷이 알기',
            means:
              '지금은 보장 내용이 조금 흐릿하게 느껴져요. 그걸 이해해 두는 것이 가장 곤란한 순간의 낭패를 막는 길이에요. 무언가를 더 사라는 이야기가 아니라 — 이미 가진 것을 알아, 필요할 때 실제로 당신을 지키게 하자는 거예요.',
          },
          stress: {
            title: '돈이 지워 온 무게 덜어 내기',
            means:
              '요즘 돈이 스트레스였고, 그건 진지하게 받아들일 만한 일이에요 — 당신의 잘못이 아니라요. 그 짐을 조금 더는 일은 재정과 별개가 아니라 재정의 일부예요. 마음이 차분하면 더 또렷한 결정을 내릴 수 있고, 이걸 혼자 질 필요도 없어요.',
          },
          steady: {
            title: '다음의 의미 있는 목표 고르기',
            means:
              '당신은 정말로 단단한 자리에 있어요 — 그래서 질문이 “무엇을 고칠까”에서 “무엇을 만들까”로 바뀌죠. 진짜로 마음이 가는 목표 하나를 고르면, 이 모든 안정에 방향이 생기고, 좋은 습관이 당신이 의도적으로 빚어 가는 삶이 됩니다.',
          },
        },

        detailsIntro:
          '전체 그림을 보고 싶다면, 각 영역을 따로 정리해 두었어요. 다 읽을 필요는 없어요 — 원할 때 언제든 여기 있을 거예요.',
        detailsShow: '전체 상세 보기',
        detailsHide: '전체 상세 접기',
        roadmapShow: '내 로드맵 보기',
        roadmapHide: '로드맵 접기',
      },

      snapshots: {
        cashflow: {
          title: '현금 흐름', perMonth: '매달 남는 돈', planBridge: { lead: '한 가지를 바꾸면 어떻게 될지 궁금하세요?', label: '내 여유 살펴보기' },
          states: {
            short: { headline: '들어오는 것보다 조금 더 쓰고 있어요', what: '지금은 한 달 지출이 수입을 살짝 넘고 있어요.', why: '작은 차이도 1년이면 쌓여, 다른 모든 것을 쌓기 어렵게 만들어요.', step: '이번 달 지출 하나를 골라, 잠시 멈추거나 줄일 수 있는지 살펴보세요.' },
            even: { headline: '거의 수지가 맞아요', what: '수입과 지출이 균형에 가깝고, 조금 남아요.', why: '수지를 맞추는 건 진짜 성취예요 — 그리고 작은 여유가 저축의 씨앗이 됩니다.', step: '월급 받는 날, 무엇보다 먼저 작은 고정 금액을 따로 떼어 보세요.' },
            healthy: { headline: '건강한 여유', what: '매달 수입의 넉넉한 몫을 남기고 있어요.', why: '그 여유가 저축을 쌓고, 빚을 덜고, 예상 밖 일을 감당할 공간이 됩니다.', step: '남는 돈에 이름을 붙여 주세요 — 비상금, 목표 — 갈 곳이 생기도록요.' },
            strong: { headline: '든든한 여유', what: '매달 수입의 큰 몫을 지켜 내고 있어요.', why: '이런 여유가 시간이 지나며 목표를 이정표로 바꿔 줍니다.', step: '이번 달 남는 돈이 갈 곳을 미리 정해, 흩어지지 않게 하세요.' },
          },
        },
        emergency: {
          title: '비상금', unit: '개월치 필수 지출 감당 가능',
          recognition: {
            none: '지금 당신이 손닿을 수 있는 여유예요.',
            building: '그동안 조용히 모아 온 여유예요.',
            solid: '지금까지 쌓아 온 여유예요.',
            cushioned: '당신이 쌓아 온 여유예요.',
          },
          bridge: { lead: '이런 게 궁금할 수 있어요:', question: '완충 자금은 얼마쯤이 충분할까요?' },
          states: {
            none: { headline: '이제 막 시작', what: '필수 지출 한 달치도 채 모아 두지 못한 상태예요.', why: '손이 닿는 작은 돈도 예상 밖의 일을 약간의 시간으로 바꿔 줘요 — 그 시간이 갑작스러운 일에 떠밀리지 않게 해 주죠.', step: '저축할 곳 하나를 정하고, 이번 주에 첫 작은 금액을 넣어 보세요.' },
            building: { headline: '완충이 만들어지는 중', what: '필수 지출을 한 달에서 석 달 정도 감당할 수 있어요.', why: '쌓아 가는 여유가 달이 흔들릴 때 기댈 수 있는 시간이 되어 가고 있어요. 흔한 범위는 방향을 잡는 데 도움이 되지만, 얼마가 충분한지는 당신의 삶에 달려 있어요.', step: '매달 같은 날 조금씩 더해, 신경 쓰지 않아도 자라게 하세요.' },
            solid: { headline: '단단한 발판', what: '대략 3~6개월치 필수 지출을 모아 두었어요.', why: '이 정도 여유는 삶이 흔들릴 때 이미 시간을 벌어 주고, 그 시간이 당신의 선택을 지켜 줘요 — 충분함은 정해진 숫자가 아니라 당신의 삶이 정해요.', step: '조금씩 채워 두고, 뒤에서 조용히 제 역할을 하게 두세요.' },
            cushioned: { headline: '넉넉한 완충', what: '6개월치 이상의 필수 지출을 모아 두었어요.', why: '기댈 수 있는 진짜 여유가 있어요 — 삶이 흔들려도 실질적인 여유가 되죠. 모두에게 맞는 정답은 없고 많을수록 무조건 좋은 것도 아니에요; 이건 이미 시간과 선택을 당신에게 줘요.', step: '스스로를 칭찬해 주세요 — 그리고 다음 돈 목표가 무엇일지 그려 보세요.' },
          },
        },
        debt: {
          title: '부채 부담', ofIncome: '수입 중 빚으로',
          states: {
            none: { headline: '매달 갚는 빚 부담 없음', what: '예산을 누르는 월별 빚 상환이 없어요.', why: '무거운 상환에서 자유로울수록 수입의 더 많은 부분이 온전히 내 것이 됩니다.', step: '혹시 빌리게 된다면, 월 상환액을 수입과 먼저 비교해 보세요.' },
            light: { headline: '가벼움', what: '수입의 작은 몫이 매달 빚으로 나가요.', why: '가벼운 부담은 대체로 감당하기 쉽고 앞서 나가기도 좋아요.', step: '제때 갚아 나가세요 — 그 꾸준한 기록이 조용히 당신 편이 됩니다.' },
            moderate: { headline: '보통', what: '수입의 눈에 띄는 몫이 빚 상환으로 나가요.', why: '감당은 되지만, 저축과 목표에 쓸 여유는 줄어들어요.', step: '나머지를 갚으면서, 가장 작은 빚에 조금씩 더 얹어 보세요.' },
            heavy: { headline: '무거움', what: '수입의 큰 몫이 매달 빚으로 나가요.', why: '흔히 수입의 3분의 1쯤을 기준선으로 보는데, 그 위로는 예산이 빠듯해집니다.', step: '먼저 집중할 빚 하나를 정하세요 — 한 곳의 진전이 큰 힘이 됩니다.' },
          },
        },
        insurance: {
          title: '보험 이해도',
          states: {
            notAtAll: { headline: '좀 더 살펴볼 필요', what: '지금은 내 보장 내용이 잘 와닿지 않는 상태예요.', why: '보장을 이해해 두는 것이, 정작 필요할 때의 낭패를 막는 길입니다.', step: '이미 가진 보험 하나를 찾아, 무엇을 보장하는지 읽어 보세요.' },
            somewhat: { headline: '조금 알고 있음', what: '보장 내용을 대략 알지만, 빈틈이 좀 있어요.', why: '지금 작은 빈틈을 메워 두면, 가장 곤란한 순간의 혼란을 줄일 수 있어요.', step: '가장 불확실한 보험 하나를 골라 요약 페이지를 훑어보세요.' },
            mostly: { headline: '대체로 알고 있음', what: '보장 내용을 대부분 잘 이해하고 있어요.', why: '여기서의 또렷함은 불확실함을 줄이고 마음을 더 놓이게 해요.', step: '해마다 한 번 빠르게 훑어, 달라진 점이 있는지 확인하세요.' },
            veryClear: { headline: '또렷하고 자신 있음', what: '내 보장 내용을 잘 알고 있어요.', why: '그 자신감은 조용하지만 진짜인 재정적 안정의 한 형태예요.', step: '내 보험 목록을 찾기 쉬운 곳에 간단히 적어 두세요.' },
          },
        },
        retirement: {
          title: '노후 준비',
          states: {
            regularly: { headline: '적극적으로 쌓는 중', what: '노후를 위해 꾸준히 돈을 넣고 있어요.', why: '꾸준한 적립과 시간은 대부분의 사람에게 가장 든든한 아군입니다.', step: '해마다 한 번, 얼마를 넣고 있고 어떻게 되어 가는지 점검하세요.' },
            sometimes: { headline: '가끔씩 쌓는 중', what: '노후를 위해 이따금 돈을 넣고 있어요.', why: '불규칙한 저축도 도움이 돼요 — 작더라도 꾸준한 리듬이면 더 좋고요.', step: '정기적으로 떼어 둘 수 있는 적당한 금액 하나를 정해 보세요.' },
            notyet: { headline: '아직 시작 전', what: '지금은 노후를 위해 돈을 넣고 있지 않아요.', why: '일찍 시작하면, 돈이 가장 좋아하는 한 가지 — 시간 — 을 얻습니다.', step: '직장에 노후 관련 제도가 있는지, 있다면 무엇인지 알아보세요.' },
            notsure: { headline: '확인이 필요', what: '노후로 무언가 들어가고 있는지 확실치 않은 상태예요.', why: '어디에 서 있는지 아는 것이, 홀가분한 첫걸음이에요.', step: '지금 노후를 위해 흘러가는 돈이 있는지 확인해 보세요.' },
          },
        },
        stress: {
          title: '재정 스트레스 (기본)',
          states: {
            low: { headline: '낮음', what: '요즘 돈이 큰 짐처럼 느껴지지는 않았어요.', why: '스트레스가 낮으면 더 또렷하게 생각하고 앞을 내다보기 쉬워요.', step: '지금 나에게 잘 맞는 것이 무엇인지 살펴, 그대로 이어가세요.' },
            moderate: { headline: '보통', what: '돈이 이따금 스트레스를 주고 있어요.', why: '약간의 스트레스는 자연스러워요; 이름을 붙이면 휘둘리지 않게 됩니다.', step: '가장 큰 돈 걱정 하나를 골라, 이번 주에 10분만 들여 보세요.' },
            elevated: { headline: '다소 높음', what: '돈이 꽤 자주 마음을 눌러 왔어요.', why: '이어지는 스트레스는 실제로 힘든 일이고, 당신의 잘못이 아니에요.', step: '작은 돈 관련 일 하나를 골라 그것만 끝내 보세요. 흐름이 걱정을 덜어 줍니다.' },
            high: { headline: '높음', what: '요즘 돈 스트레스가 무거웠어요.', why: '이걸 혼자 지는 건 힘든 일이에요. 혼자 하지 않아도 됩니다.', step: '믿는 사람이나 무료 비영리 재정 상담과 나누면, 짐이 한결 가벼워질 수 있어요.' },
          },
        },
        risk: {
          title: '위험 감수 성향 (기본)',
          note: '이건 스스로를 아는 것에 대한 이야기예요 — 위험을 더 지라거나 덜 지라는 권유가 아닙니다.',
          states: {
            cautious: { headline: '신중한 편', what: '돈에 관해 안전과 안정 쪽으로 기울어 있어요.', why: '이를 알면, 차분하게 지켜 나갈 수 있는 길을 고를 수 있어요.', step: '돈 선택이 부담스러울 때, 신중함도 하나의 온전한 방식임을 믿어 주세요.' },
            balanced: { headline: '균형 잡힌 편', what: '재정적 위험에 대해 중간 어딘가에 있어요.', why: '유연한 편안함의 정도는, 사안마다 저울질할 여지를 줍니다.', step: '어떤 결정이 편하고 어떤 결정이 긴장되는지 살펴보세요 — 유용한 자기 이해예요.' },
            comfortable: { headline: '편안한 편', what: '재정적 위험에 비교적 편안한 편이에요.', why: '불확실함에 편안한 건 괜찮아요 — 안전망과 함께라면 더 단단해집니다.', step: '과감한 선택 곁에, 기본(완충·필수 지출)이 든든한지 꼭 확인하세요.' },
          },
        },
      },

      roadmap: {
        eyebrow: '나의 로드맵',
        title: '당신 편에 선 몇 걸음.',
        sub: '뒤처진 기분이 드는 할 일 목록이 아니라 — 오늘부터 당신이 만들어 가는 삶까지, 부드러운 길이에요. 한 번에 하나씩 밟아 보세요.',
        whyLabel: '왜 도움이 되나요',
        supportsLabel: '무엇을 향하나요',
        horizons: { today: '오늘', next30: '앞으로 30일', habits: '매달의 습관', sixTwelve: '앞으로 6~12개월', longterm: '장기적인 그림' },
        today: {
          cashflow: { action: '이번 달 가장 큰 지출 세 가지를 적어 보세요.', why: '보이지 않는 건 바꿀 수 없어요. 5분이면 됩니다.', supports: '월별 여유를 향한 첫걸음.' },
          emergency: { action: '비상금이 머물 곳을 정하세요 — 빈 계좌라도 괜찮아요.', why: '이름 붙은 자리는 저축을 막연함이 아닌 실제로 느끼게 해요.', supports: '예상 밖의 일과 당신 사이에 생기는 작은 시간의 시작.' },
          debt: { action: '빚을 월 상환액과 함께 작은 것부터 큰 것 순으로 적어 보세요.', why: '함께 보면, 막연한 무게가 계획할 수 있는 대상이 됩니다.', supports: '빚 부담을 더는 또렷한 출발점.' },
          retirement: { action: '노후 저축에 대해 궁금한 점 하나를 적어 두세요.', why: '호기심은 압박보다 움직이기 쉬워요 — 질문은 부드러운 시작이에요.', supports: '미래를 위해 무언가 시작하는 동력.' },
          insurance: { action: '이미 가진 보험 하나를 찾아, 무엇을 보장하는지 짚어 보세요.', why: '지금의 10분이 나중의 진짜 혼란을 아껴 줍니다.', supports: '이미 가진 보호에 대한 자신감.' },
          stress: { action: '천천히 숨 한 번 쉬고, 가장 큰 돈 걱정 하나에 이름을 붙여 보세요.', why: '이름을 붙이면 걱정이 안개에서 손에 쥘 수 있는 하나로 줄어들어요.', supports: '오늘부터 시작되는 조금의 평온.' },
          steady: { action: '지금까지 얼마나 왔는지 잠시 돌아보세요.', why: '진전을 알아차리는 일이 그것을 지속 가능하게 만들어요.', supports: '다음을 고를 수 있는 자신감.' },
        },
        next30: {
          cashflow: { action: '줄일 지출 하나를 정하고, 아낀 돈을 의도적으로 어딘가로 옮겨 보세요.', why: '지속하기 힘든 극단적 절약보다 작고 의도적인 절약이 이겨요.', supports: '느껴지는, 자라나는 월별 여유.' },
          emergency: { action: '월급날 작은 자동이체 하나를 저축으로 걸어 두세요.', why: '자동화하면 매번 결정하지 않아도 저축이 됩니다.', supports: '뒤에서 조용히 자라는, 기댈 수 있는 시간.' },
          debt: { action: '나머지는 최소 금액으로 갚으면서, 가장 작은 빚에 조금 더 얹어 보세요.', why: '빚 하나를 끝내면 진짜 승리가 되고, 그 상환액이 풀립니다.', supports: '빚 부담을 더는 첫 번째 도미노.' },
          retirement: { action: '나에게 어떤 노후 제도가 있는지, 어떻게 작동하는지 알아보세요.', why: '있는 줄 모르는 문은 쓸 수 없어요.', supports: '미래를 향한 자신 있고 아는 시작.' },
          insurance: { action: '보험 하나를 처음부터 끝까지 읽어, 무엇이 되고 안 되는지 알아 두세요.', why: '한 번에 하나씩 이해하면 부담스럽지 않아요.', supports: '내 안전망에 대한 진짜 또렷함.' },
          stress: { action: '미뤄 온 돈 관련 일 하나만 골라, 그것만 해보세요.', why: '회피는 걱정을 키우고, 끝낸 일 하나는 걱정을 굶겨요.', supports: '다음 걸음을 가볍게 하는 흐름.' },
          steady: { action: '좋은 습관 하나를 골라 조금 더 단단하게 만들어 보세요.', why: '잘되는 걸 깊게 하는 게 새로 더하는 것보다 힘있을 때가 많아요.', supports: '더 딛고 설 만한 단단한 토대.' },
        },
        sixTwelve: {
          cashflow: { action: '매달 이름 붙인 여유를 꾸준히 지키는 걸 목표로 하세요.', why: '꾸준함은 쌓여요 — 매달 지킨 작은 여유가 드물게 큰 것을 이깁니다.', supports: '예산 속 오래가는 숨 쉴 공간.' },
          emergency: { action: '먼저 한 달치 필수 지출을 목표로 쌓고, 거기서 계속 이어가세요.', why: '첫 달이 가장 어렵고 가장 든든해요; 이정표가 동기를 지켜 줍니다.', supports: '힘든 시기를 시간과 선택으로 바꿔 주는 여유.' },
          debt: { action: '빚 하나를 완전히 갚고, 그 상환액을 다음 빚으로 굴려 보세요.', why: '이 “눈덩이”가 풀린 상환액을 가속하는 진전으로 바꿔요.', supports: '짐을 꾸준히 덜어 가는 흐름.' },
          retirement: { action: '자신 있게 하나를 선택할 수 있을 만큼 제도를 이해해 두세요.', why: '지금의 아는 결정 하나가 “나중에 하지” 수년을 이깁니다.', supports: '조용히 돌봄받는 미래의 나.' },
          insurance: { action: '주요 보장 종류마다 또렷해져, 어느 것도 미스터리로 남지 않게 하세요.', why: '전체 그림이 또렷하면 깨알 글씨 속 빈틈이 숨지 못해요.', supports: '단단히 뿌리내린 마음의 평온.' },
          stress: { action: '걱정을 조용히 덜어 줄 돈 루틴 한두 가지를 만들어 보세요.', why: '루틴은 결정을 어깨에서 달력으로 옮겨 줍니다.', supports: '더 차분하고 예측 가능한 돈과의 관계.' },
          steady: { action: '설레는 목표 하나를 골라, 결승선을 그어 주세요.', why: '마감은 바람을 계획으로 바꿔요.', supports: '쌓아 온 모든 안정에 주어지는 방향.' },
        },
        habits: [
          { action: '매주 같은 날, 10분 돈 점검.', why: '규칙적이고 부담 없는 관심이 작은 문제가 커지는 걸 막아요.', supports: '쫓기지 않고 주도하는 감각.' },
          { action: '나에게 먼저 주기 — 수입이 들어오는 날 작은 고정 금액을 저축으로 옮기세요.', why: '쓰기 전에 저축해야 실제로 이뤄집니다.', supports: '거의 힘들이지 않는 꾸준한 완충의 성장.' },
          { action: '큰 지출은 하룻밤 자고 결정하세요.', why: '하룻밤이 충동구매 대부분을 녹이고, 중요한 것만 남겨요.', supports: '진짜 소중히 여기는 것을 담은 소비.' },
        ],
        longterm: {
          building:
            '당신이 만들어 가는 재정 생활은 돈을 완벽하게 다루는 일이 아니에요. 숨 쉴 공간, 온전히 내 것인 선택, 그리고 계절마다 조금씩 더 큰 평온으로 이어지는 꾸준한 걸음이죠. 그 작은 걸음 하나하나가, 언젠가의 당신을 조용히 돌보는 일이에요. 시간은 당신을 거스르지 않고 곁에서 함께 가고요. 당신은 이미 시작했고, 그게 가장 어려운 부분입니다.',
          strengthening:
            '이미 단단한 발판을 만들었어요. 여기서부터는 일이 더 조용해집니다: 이룬 것을 지키고, 완충을 두텁게 하고, 돈이 당신이 진짜 원하는 삶을 돕게 하는 거죠. 계속 가세요 — 아주 잘하고 있어요.',
        },
      },
    },
  },
}
