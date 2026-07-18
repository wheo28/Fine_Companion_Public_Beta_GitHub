// The Learning Center as a Question Inventory.
// Real, first-person questions come first; each question's natural SHAPE
// (discovery / story / experiment / reflection / example / myth) is chosen by
// the question itself; the educational source is invisible. The page is a
// projection of this inventory, ordered by curiosity — not a fixed layout.
//
// Entry schema:
//   { id, door: 'question'|'discovery'|'story', open, shape, content, notice?, more? }
// `door` and `shape` are internal only and never shown to the user.

export const learningContent = {
  en: {
    header: {
      eyebrow: 'Follow a question',
      title: 'What are you wondering about?',
      sub: 'Small questions people actually ask about money. Each one opens into something worth seeing — follow whichever pulls at you. There’s no order, and nothing to finish.',
    },
    ui: {
      mythPrompt: 'Does that hold up?',
      guessYes: 'Sounds right',
      guessNo: 'Not so sure',
      guessPrompt: 'Take a guess —',
      reveal: 'See what most people miss',
      truthLabel: 'What’s really going on',
      noticeLabel: 'Worth keeping an eye on',
      more: 'A little more, if you’re curious',
    },
    entries: [
      {
        id: 'where-money-goes', door: 'question', shape: 'discovery',
        open: 'Where does my money actually go?',
        content: {
          discovery: 'Most people can name maybe half of last month’s spending from memory. The rest is small, forgettable buys.',
          understanding: 'The money that slips away usually isn’t reckless — it’s just invisible. And once you can see it, it turns out to be surprisingly easy to steer.',
        },
        notice: 'For a few days, the buys you’d forget by dinner. Those are the ones worth seeing.',
      },
      {
        id: 'budget-cage', door: 'question', shape: 'myth',
        open: 'Isn’t a budget just about restricting myself?',
        content: {
          truth: 'A budget isn’t a cage; it’s a mirror. It doesn’t hand you a list of things you can’t have — it shows you what you’re already choosing, so the choosing can be yours on purpose.',
        },
        more: 'The kind that lasts isn’t strict at all. It’s just honest: a rough sense of what comes in and where it tends to go, glanced at now and then.',
      },
      {
        id: 'loss-sting', door: 'discovery', shape: 'discovery',
        open: 'Losing $50 tends to sting about twice as hard as finding $50 feels good.',
        content: {
          understanding: 'We’re simply built to feel a loss more than an equal gain. It quietly tips choices we’d swear were perfectly logical — holding a fading thing too long, or backing away from a fair chance. Just knowing the tilt is there loosens its pull.',
        },
        notice: 'When a choice feels driven by not losing, it’s worth a second, calmer look.',
      },
      {
        id: 'too-late', door: 'question', shape: 'experiment',
        open: 'Is it too late for me to start?',
        content: {
          guess: { choices: ['Probably, a little', 'Not really'] },
          reveal: 'Almost never. Someone who begins small and simply never stops often ends up ahead of someone who started bigger but later. Time does patient work that size can’t — and the one day you can’t get back is the one you spend waiting.',
        },
        notice: 'The urge to wait until you have more is the thing to catch. Beginning small, now, is usually the stronger move.',
      },
      {
        id: 'raise-vanished', door: 'story', shape: 'story',
        open: 'The raise that quietly disappeared.',
        content: {
          story: 'Someone finally gets the raise they’d hoped for. A few months on, the extra is simply gone — no splurge they can point to, just a life that expanded to fit. They’re earning more and feeling exactly the same.',
          understanding: 'Spending tends to rise to meet income, without anyone deciding it should. The answer isn’t guilt; it’s noticing the drift early, so a little of the “more” can be pointed somewhere on purpose.',
        },
      },
      {
        id: 'earning-more', door: 'question', shape: 'discovery',
        open: 'Would earning more actually fix it?',
        content: {
          discovery: 'Often, not on its own. When more comes in, life quietly grows to meet it, and the squeeze can feel much the same at a bigger number.',
          understanding: 'What you’re really after isn’t a larger paycheck — it’s room. Room to breathe, to say yes or no on your own terms, to not brace for the end of the month. That room comes from the space you keep, and it’s yours to shape at any income.',
        },
        notice: 'Next time you catch yourself thinking “if I just earned a bit more,” notice what you’d actually want it to buy. Usually it’s room, not things.',
      },
      {
        id: 'cushion-enough', door: 'question', shape: 'reflection',
        open: 'How much of a cushion is “enough”?',
        content: {
          prompt: 'Picture the smallest surprise that would genuinely unsettle you — the appliance, the car, a thin month. Not the disaster; the ordinary jolt. How many of those could you absorb right now?',
          line: 'There’s no single number that fits everyone. A common range can help you get your bearings, but it’s a starting point, not a grade — someone else’s number isn’t yours to pass or fail. What counts as enough really depends on the shape of your own life: what must keep being paid, how steady things are, who you could lean on. And wherever you start, keeping a little reachable room still matters.',
        },
      },
      {
        id: 'money-in-jars', door: 'question', shape: 'discovery',
        open: 'Why does the same money feel so different in different places?',
        content: {
          discovery: 'A $100 bonus feels spendable. $100 in savings feels untouchable. $100 already owed feels gone. Same hundred dollars, three completely different feelings.',
          understanding: 'We quietly sort money into mental jars and treat each jar by its own rule — even though the money itself doesn’t care which jar it’s in. Seeing the jars for what they are lets you move money by choice instead of by mood.',
        },
      },
      {
        id: 'small-amounts', door: 'question', shape: 'example',
        open: 'Do small amounts really add up?',
        content: {
          example: 'Say you set aside the cost of one coffee, a few times a week. On its own it feels almost pointless. But left alone and given years, small-and-steady quietly outgrows large-and-occasional — not by magic, but because time keeps working while you’re not watching.',
          understanding: 'Consistency beats size more often than we expect. The amount matters less than the fact that it keeps happening.',
        },
        notice: 'The one you’d call “too small to bother with” is usually the one that matters most, repeated.',
      },
      {
        id: 'debt-shame', door: 'question', shape: 'myth',
        open: 'Isn’t debt just something to feel bad about?',
        content: {
          truth: 'Debt isn’t a verdict on your character; it’s a tool with a price tag. Some of it quietly builds a life — a home, a skill. Some of it quietly drains one. The useful question isn’t “should I feel ashamed?” but “which kind is this, and what is it costing me?”',
        },
        more: 'Shame tends to make people look away from debt — which is exactly when it grows. Plain attention, just seeing the shape of it, is what starts to shrink it.',
      },
      {
        id: 'people-okay', door: 'question', shape: 'story',
        open: 'Would the people I love be okay?',
        content: {
          story: 'When something goes wrong for a family, the hardest part is rarely the size of what was left behind. Far more often it’s that no one was clearly set up to step in and decide — so love got tangled in logistics at the worst possible moment.',
          understanding: 'Protecting people is mostly arranging, not amount. A few clear arrangements — who decides, who’s told, where things are kept — carry more than a large sum left in confusion.',
        },
      },
      {
        id: 'why-avoid', door: 'question', shape: 'reflection',
        open: 'Why do I avoid looking at my money?',
        content: {
          prompt: 'Think of the last time you meant to check and quietly didn’t. What did you expect to feel if you looked?',
          line: 'Avoidance usually isn’t laziness; it’s a way of not feeling something. But money left unlooked-at rarely improves on its own — and the looking is almost always lighter than the bracing for it.',
        },
      },
      {
        id: 'remember-in-not-out', door: 'discovery', shape: 'discovery',
        open: 'You can picture what comes in far more clearly than where it goes back out.',
        content: {
          understanding: 'Income is a few big, memorable numbers. Spending is a hundred small, forgettable ones. That’s why the “out” side feels foggy — not because you’re careless, but because it’s genuinely harder to hold in mind. Writing down a few days of it turns fog into something you can actually see.',
        },
      },
      {
        id: 'check-how-often', door: 'question', shape: 'experiment',
        open: 'Does checking my money more often actually help?',
        content: {
          guess: { choices: ['It just adds stress', 'It helps, gently'] },
          reveal: 'Gently, yes — up to a point. A calm, regular glance keeps small things from becoming surprises and slowly dissolves the dread of not-knowing. Checking constantly does the opposite. The sweet spot is often enough to feel oriented, not so often that you feel anxious.',
        },
        notice: 'If a look leaves you calmer, it’s the right amount. If it leaves you wound up, it’s too much.',
      },
      {
        id: 'one-small-thing', door: 'question', shape: 'reflection',
        open: 'What’s the one small thing that changes the most?',
        content: {
          prompt: 'Of everything you could do with your money, which single small step — if it quietly became a habit — would make the rest feel easier?',
          line: 'There’s rarely a grand fix. There’s usually one modest, repeatable thing that steadies everything around it — and the one you’d name first is usually the right place to begin.',
        },
      },
    ],
  },

  ko: {
    header: {
      eyebrow: '질문을 따라가 보세요',
      title: '무엇이 궁금하세요?',
      sub: '사람들이 돈에 대해 실제로 던지는 작은 질문들이에요. 하나하나가 볼만한 무언가로 열려요. 끌리는 걸 따라가면 돼요. 순서도, 끝내야 할 것도 없어요.',
    },
    ui: {
      mythPrompt: '정말 그럴까요?',
      guessYes: '맞는 것 같아요',
      guessNo: '글쎄요',
      guessPrompt: '한번 맞혀 볼까요 —',
      reveal: '많은 사람이 놓치는 것 보기',
      truthLabel: '실제로는 이래요',
      noticeLabel: '눈여겨볼 것 하나',
      more: '조금 더, 궁금하다면',
    },
    entries: [
      {
        id: 'where-money-goes', door: 'question', shape: 'discovery',
        open: '내 돈은 대체 어디로 가는 걸까요?',
        content: {
          discovery: '대부분은 지난달 지출의 절반쯤만 기억으로 짚어낼 수 있어요. 나머지는 작고 잊기 쉬운 소비들이죠.',
          understanding: '새어 나가는 돈은 대개 무모해서가 아니라, 그저 보이지 않아서예요. 그리고 일단 보이기 시작하면, 방향을 바꾸는 건 뜻밖에 쉬워요.',
        },
        notice: '며칠만, 저녁이면 잊어버릴 작은 소비들을요. 그게 바로 볼만한 것들이에요.',
      },
      {
        id: 'budget-cage', door: 'question', shape: 'myth',
        open: '예산은 결국 나를 옥죄는 것 아닌가요?',
        content: {
          truth: '예산은 우리가 아니라 거울이에요. 가질 수 없는 것들의 목록을 건네는 게 아니라, 이미 내가 하고 있는 선택을 보여 줘서, 그 선택을 의식적으로 내 것으로 만들게 해 줘요.',
        },
        more: '오래가는 예산은 엄격하지 않아요. 그저 솔직할 뿐이죠. 무엇이 들어오고 어디로 가는지 대략 감을 잡고, 가끔 다시 들여다보는 정도예요.',
      },
      {
        id: 'loss-sting', door: 'discovery', shape: 'discovery',
        open: '5만 원을 잃는 아픔은, 5만 원을 얻는 기쁨보다 약 두 배로 크게 느껴져요.',
        content: {
          understanding: '우리는 같은 크기의 이득보다 손실을 더 크게 느끼도록 만들어졌어요. 완벽히 논리적이라 믿는 선택을 조용히 기울이죠 — 시드는 것을 너무 오래 붙들거나, 괜찮은 기회에서 물러서거나요. 그 기울어짐이 있다는 걸 아는 것만으로도 힘이 조금 풀려요.',
        },
        notice: '어떤 선택이 “잃지 않기 위해서”라는 느낌이 들면, 한 번 더 차분히 볼 만해요.',
      },
      {
        id: 'too-late', door: 'question', shape: 'experiment',
        open: '이제 시작하기엔 너무 늦은 걸까요?',
        content: {
          guess: { choices: ['조금 늦은 편', '그렇지 않아요'] },
          reveal: '거의 그렇지 않아요. 작게 시작해 그저 멈추지 않은 사람이, 더 크게 하지만 늦게 시작한 사람을 앞서는 경우가 많아요. 시간은 금액이 할 수 없는 일을 꾸준히 해내거든요. 그리고 되돌릴 수 없는 유일한 하루는, 기다리며 흘려보낸 그 하루예요.',
        },
        notice: '“더 모으면 그때”라는 마음이 바로 붙잡을 지점이에요. 지금 작게 시작하는 편이 대개 더 강한 한 수예요.',
      },
      {
        id: 'raise-vanished', door: 'story', shape: 'story',
        open: '조용히 사라진 월급 인상분.',
        content: {
          story: '누군가 바라던 월급 인상을 드디어 받아요. 몇 달 뒤, 늘어난 돈은 그냥 사라졌어요 — 딱히 크게 쓴 것도 없는데, 삶이 그만큼 부풀어 딱 맞아 버린 거죠. 더 벌면서도 느낌은 예전과 똑같아요.',
          understanding: '지출은 아무도 그러기로 정하지 않았는데도 수입에 맞춰 늘어나곤 해요. 답은 죄책감이 아니라, 그 흐름을 일찍 알아차려서 늘어난 것의 일부를 의식적으로 어딘가로 향하게 하는 거예요.',
        },
      },
      {
        id: 'earning-more', door: 'question', shape: 'discovery',
        open: '더 벌면 정말 해결될까요?',
        content: {
          discovery: '혼자서는, 대개 그렇지 않아요. 더 들어오면 삶이 조용히 거기에 맞춰 커지고, 쪼들리는 느낌은 더 큰 숫자에서도 비슷하게 남곤 해요.',
          understanding: '사실 당신이 바라는 건 더 큰 월급이 아니라 여유예요. 숨 쉴 여유, 내 뜻대로 예 혹은 아니오를 말할 여유, 월말을 조마조마 기다리지 않을 여유요. 그 여유는 당신이 남겨 두는 공간에서 나오고, 어떤 소득에서든 당신이 빚어낼 수 있어요.',
        },
        notice: '다음에 “조금만 더 벌면” 하는 생각이 들거든, 그게 실제로 무엇을 사 주길 바라는지 살펴보세요. 대개는 물건이 아니라 여유예요.',
      },
      {
        id: 'cushion-enough', door: 'question', shape: 'reflection',
        open: '완충 자금은 얼마쯤이 “충분한” 걸까요?',
        content: {
          prompt: '당신을 정말로 흔들 만한 가장 작은 예기치 못한 일을 떠올려 보세요 — 고장 난 가전, 자동차, 빠듯한 한 달. 재난이 아니라, 흔한 충격이요. 지금 그 정도를 몇 번이나 감당할 수 있나요?',
          line: '모두에게 맞는 하나의 숫자는 없어요. 흔한 범위는 방향을 잡는 데 도움이 되지만, 그건 출발점일 뿐 점수가 아니에요 — 다른 사람의 숫자는 당신이 통과하거나 실패할 대상이 아니에요. 무엇이 충분한지는 당신 삶의 모양에 달려 있어요: 무엇이 계속 나가야 하는지, 얼마나 안정적인지, 누구에게 기댈 수 있는지. 그리고 어디서 시작하든, 손 닿는 여유를 조금씩 지켜 두는 건 여전히 중요해요.',
        },
      },
      {
        id: 'money-in-jars', door: 'question', shape: 'discovery',
        open: '같은 돈인데 왜 놓인 자리에 따라 느낌이 다를까요?',
        content: {
          discovery: '보너스 10만 원은 써도 될 것 같고, 저축의 10만 원은 못 건드릴 것 같고, 이미 갚아야 할 10만 원은 사라진 것 같아요. 같은 십만 원인데, 느낌은 셋 다 완전히 달라요.',
          understanding: '우리는 돈을 마음속 여러 항아리에 조용히 나눠 담고, 정작 돈은 어느 항아리에 있든 상관하지 않는데도 항아리마다 다른 규칙으로 대해요. 그 항아리를 있는 그대로 보면, 기분이 아니라 선택으로 돈을 옮길 수 있어요.',
        },
      },
      {
        id: 'small-amounts', door: 'question', shape: 'example',
        open: '작은 돈이 정말 쌓일까요?',
        content: {
          example: '커피 한 잔 값을, 일주일에 몇 번 떼어 둔다고 해 봐요. 그것만 보면 거의 무의미해 보이죠. 하지만 그대로 두고 몇 년이 지나면, 작고 꾸준한 쪽이 크고 이따금인 쪽을 조용히 앞질러요 — 마법이 아니라, 당신이 보지 않는 사이에도 시간이 계속 일하기 때문이에요.',
          understanding: '꾸준함은 우리 생각보다 자주 크기를 이겨요. 금액보다, 그게 계속된다는 사실이 더 중요하죠.',
        },
        notice: '“이건 너무 작아서”라고 부를 그 소비가, 반복되면 대개 가장 크게 작용해요.',
      },
      {
        id: 'debt-shame', door: 'question', shape: 'myth',
        open: '빚은 그냥 부끄러워해야 할 것 아닌가요?',
        content: {
          truth: '빚은 당신의 인격에 대한 판정이 아니라, 값이 매겨진 도구예요. 어떤 빚은 삶을 조용히 지어요 — 집, 배움처럼요. 어떤 빚은 삶을 조용히 갉아먹고요. 쓸모 있는 질문은 “부끄러워해야 할까?”가 아니라 “이건 어느 쪽이고, 나에게 무엇을 치르게 하고 있나?”예요.',
        },
        more: '부끄러움은 빚에서 눈을 돌리게 만드는데, 바로 그때 빚이 자라요. 그저 그 크기를 있는 그대로 보는 담담한 관심이, 빚을 줄이기 시작하는 힘이에요.',
      },
      {
        id: 'people-okay', door: 'question', shape: 'story',
        open: '내가 사랑하는 사람들은 괜찮을까요?',
        content: {
          story: '가족에게 무슨 일이 생겼을 때, 가장 힘든 부분은 남긴 것의 크기인 경우가 드물어요. 훨씬 자주, 그 사이에 대신 나서서 결정할 사람이 분명히 정해져 있지 않다는 점이죠 — 그래서 가장 나쁜 순간에 사랑이 온갖 절차에 뒤엉켜 버려요.',
          understanding: '사람을 지키는 일은 대개 금액이 아니라 준비예요. 몇 가지 분명한 준비 — 누가 결정하는지, 누구에게 알리는지, 어디에 무엇이 있는지 — 가 혼란 속에 남겨진 큰 금액보다 더 많은 걸 감당해요.',
        },
      },
      {
        id: 'why-avoid', door: 'question', shape: 'reflection',
        open: '나는 왜 내 돈을 들여다보길 피할까요?',
        content: {
          prompt: '확인하려다 조용히 미뤘던 마지막 순간을 떠올려 보세요. 만약 들여다봤다면, 무엇을 느낄 것 같았나요?',
          line: '회피는 대개 게으름이 아니라, 무언가를 느끼지 않으려는 방식이에요. 하지만 들여다보지 않은 돈이 저절로 나아지는 일은 드물고, 막상 보는 일은 각오하는 것보다 거의 언제나 가벼워요.',
        },
      },
      {
        id: 'remember-in-not-out', door: 'discovery', shape: 'discovery',
        open: '들어오는 돈은, 빠져나가는 돈보다 훨씬 또렷하게 떠올릴 수 있어요.',
        content: {
          understanding: '수입은 크고 기억에 남는 몇 개의 숫자예요. 지출은 작고 잊기 쉬운 백 개의 숫자고요. “나가는” 쪽이 흐릿하게 느껴지는 건 당신이 부주의해서가 아니라, 정말로 머리에 담기 어렵기 때문이에요. 며칠만 적어 보면, 안개가 실제로 볼 수 있는 무언가로 바뀌어요.',
        },
      },
      {
        id: 'check-how-often', door: 'question', shape: 'experiment',
        open: '돈을 자주 확인하는 게 정말 도움이 될까요?',
        content: {
          guess: { choices: ['스트레스만 늘 것 같아요', '가만히 도움이 돼요'] },
          reveal: '가만히, 어느 정도까지는 도움이 돼요. 차분하고 규칙적인 한 번의 눈길이 작은 일을 놀람으로 키우지 않게 하고, 모른다는 데서 오는 불안을 서서히 녹여요. 하지만 끊임없이 확인하는 건 반대로 작용하죠. 알맞은 지점은, 방향이 잡힐 만큼 자주이되, 불안할 만큼은 아니에요.',
        },
        notice: '한 번 들여다본 뒤 더 차분해지면 알맞은 양이에요. 오히려 곤두서면 너무 잦은 거고요.',
      },
      {
        id: 'one-small-thing', door: 'question', shape: 'reflection',
        open: '가장 많은 것을 바꾸는 작은 하나는 무엇일까요?',
        content: {
          prompt: '돈으로 할 수 있는 모든 것 중에, 어떤 작은 한 걸음이 — 조용히 습관이 된다면 — 나머지를 더 수월하게 만들까요?',
          line: '거창한 해결책은 드물어요. 대개는 주변의 모든 걸 안정시키는, 소박하고 반복 가능한 하나가 있죠 — 그리고 당신이 가장 먼저 떠올린 그것이, 대개 시작하기 좋은 자리예요.',
        },
      },
    ],
  },
}
