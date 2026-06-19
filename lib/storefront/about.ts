import type { Locale } from "./i18n";

export const aboutImages = {
  founder: "image/品牌介绍图/NURA-brand-01-soft-gold-lifestyle.jpg",
  craft: "image/品牌介绍图/NURA-brand-02-jewelry-vanity-editorial.jpg",
  impact: "image/品牌介绍图/NURA-brand-03-evening-gift-scene.jpg"
};

export function aboutCopy(locale: Locale) {
  return locale === "ar" ? arabic : english;
}

const english = {
  eyebrow: "The NURA Story",
  title: "Jewelry shaped for women building life on their own terms.",
  intro:
    "NURA is an emerging jewelry concept created for women in the UAE and inspired by Dubai's energy, Fujairah's grounded landscape, and a belief that transparency should feel as considered as design.",
  founder: {
    kicker: "A digital brand character",
    title: "Meet Mariam Al Noor",
    disclosure:
      "Mariam is a fictional digital brand character created to express NURA's values. She is not a real founder or public figure.",
    text:
      "In the NURA story, Mariam grows up in Fujairah in a working family: one parent taking industrial shifts, the other balancing paid work with the household. She learns early that independence is built through skill, consistency, and the confidence to ask how things are made. Years spent close to jewelry sourcing inspire a simpler model: direct manufacturing relationships, clear product information, and pieces designed for women whose ambition does not need to be loud."
  },
  uae: {
    title: "Designed for life in the UAE",
    text:
      "NURA is not presented as an already registered Dubai local company. It is a brand being built for women in the UAE, with a visual language informed by warm architecture, modest elegance, gifting traditions, and Dubai's contemporary pace."
  },
  manufacturing: {
    title: "From crystal growth to final setting",
    text:
      "Our model works with direct manufacturing partners to reduce unnecessary layers. Depending on the product specification, laboratory-grown diamond crystals may be produced by CVD or HPHT, then planned, cut, polished, graded, set, and quality checked.",
    steps: ["CVD or HPHT crystal growth", "Planning and precision cutting", "Faceting and polishing", "Setting and final quality control"],
    priceTitle: "Why the price can be more considered",
    priceText:
      "Digital-first selling, direct manufacturing relationships, focused collections, and restrained packaging can reduce overhead. Simple packaging is a deliberate efficiency choice, not a claim that every margin is returned to the customer."
  },
  stones: {
    title: "Laboratory-grown diamond and moissanite are not the same",
    labTitle: "Laboratory-grown diamond",
    labText:
      "Laboratory-grown diamonds have essentially the same chemical, physical, and optical properties as natural diamonds. One is not automatically brighter than the other: brilliance depends strongly on cut proportions, symmetry, polish, and lighting.",
    moissaniteTitle: "Moissanite",
    moissaniteText:
      "Moissanite is a distinct gemstone and a diamond simulant, not a diamond. Its higher dispersion can produce more visible rainbow fire. NURA identifies it separately so customers can choose based on appearance, material, and budget.",
    coloredTitle: "Laboratory-grown colored gemstones",
    coloredText:
      "Colored laboratory-grown gemstones are identified by their actual material and treatment information when confirmed. Color is a design attribute, not proof that a stone is diamond."
  },
  certificate: {
    title: "Certification without shortcuts",
    text:
      "IGI issues reports for eligible laboratory-grown diamonds. NURA only labels an individual product “IGI Certified” after a report number and official verification link have been recorded for that product.",
    sample: "EDUCATIONAL SAMPLE — NOT AN IGI REPORT",
    verify: "Visit IGI report information",
    note:
      "The sample below explains the fields customers may see on a grading report. It is not a certificate, does not use an IGI report number, and does not certify any current NURA product."
  },
  impact: {
    title: "A future commitment to women and children",
    text:
      "NURA intends to support licensed UAE programs serving women and children. No charity partnership, donation amount, or completed donation is claimed today. Any future program will name the licensed organization, publish the contribution method, and report outcomes transparently after the required approvals are in place.",
    status: "Commitment status: partner selection and compliance review"
  },
  sources: "Gemology references",
  sourceNote: "Educational claims are linked to recognized gemological sources. Product-specific claims depend on the information recorded for each item."
};

const arabic = {
  eyebrow: "قصة NURA",
  title: "مجوهرات للمرأة التي تبني حياتها بطريقتها الخاصة.",
  intro:
    "NURA مفهوم ناشئ للمجوهرات صُمم للمرأة في دولة الإمارات، مستلهماً طاقة دبي وطبيعة الفجيرة الراسخة، وإيماناً بأن الشفافية يجب أن تكون مدروسة بقدر التصميم.",
  founder: {
    kicker: "شخصية رقمية للعلامة",
    title: "تعرّفي إلى مريم النور",
    disclosure:
      "مريم شخصية رقمية خيالية صُممت للتعبير عن قيم NURA، وليست مؤسسة حقيقية أو شخصية عامة.",
    text:
      "في حكاية NURA، نشأت مريم في الفجيرة ضمن أسرة عاملة؛ أحد الوالدين يعمل بنظام المناوبات الصناعية والآخر يوازن بين العمل ومسؤوليات المنزل. تعلّمت مبكراً أن الاستقلال يُبنى بالمهارة والاستمرارية والجرأة على السؤال عن طريقة صنع الأشياء. ألهمتها سنوات قريبة من توريد المجوهرات نموذجاً أبسط: علاقات تصنيع مباشرة، معلومات واضحة، وقطع للمرأة التي لا تحتاج طموحاتها إلى ضجيج."
  },
  uae: {
    title: "مصممة للحياة في الإمارات",
    text:
      "لا تقدم NURA نفسها كشركة محلية مسجلة حالياً في دبي. إنها علامة قيد البناء للمرأة في الإمارات، بلغة بصرية تستلهم العمارة الدافئة والأناقة المحتشمة وثقافة الهدايا وإيقاع دبي المعاصر."
  },
  manufacturing: {
    title: "من نمو البلورة إلى الترصيع النهائي",
    text:
      "نعمل مع شركاء تصنيع مباشرين لتقليل الحلقات غير الضرورية. وفق مواصفات المنتج، يمكن إنتاج بلورات الألماس المصنع مخبرياً بتقنية CVD أو HPHT، ثم تخطيطها وقصها وصقلها وتصنيفها وترصيعها وفحصها.",
    steps: ["نمو البلورة بتقنية CVD أو HPHT", "التخطيط والقص الدقيق", "تشكيل الأوجه والصقل", "الترصيع وفحص الجودة النهائي"],
    priceTitle: "لماذا يمكن أن يكون السعر أكثر توازناً",
    priceText:
      "يساعد البيع الرقمي والعلاقات المباشرة مع المصنعين والمجموعات المركزة والتغليف البسيط على خفض النفقات. التغليف البسيط خيار للكفاءة، وليس ادعاءً بأن كامل هامش الربح يعود إلى العميل."
  },
  stones: {
    title: "الألماس المصنع مخبرياً والمويسانايت مادتان مختلفتان",
    labTitle: "الألماس المصنع مخبرياً",
    labText:
      "يمتلك الألماس المصنع مخبرياً خصائص كيميائية وفيزيائية وبصرية مماثلة أساساً للألماس الطبيعي. لا يعني ذلك أن أحدهما أكثر لمعاناً تلقائياً؛ فاللمعان يعتمد بدرجة كبيرة على نسب القص والتماثل والصقل والإضاءة.",
    moissaniteTitle: "المويسانايت",
    moissaniteText:
      "المويسانايت حجر كريم مستقل ومحاكٍ للألماس، وليس ألماساً. قد يمنحه التشتت الأعلى ألواناً قوسية أكثر وضوحاً. تحدده NURA بصورة منفصلة ليختار العميل حسب المظهر والمادة والميزانية.",
    coloredTitle: "الأحجار الملونة المصنعة مخبرياً",
    coloredText:
      "تُعرّف الأحجار الملونة المصنعة مخبرياً وفق مادتها الفعلية ومعلومات المعالجة عند تأكيدها. اللون صفة تصميمية ولا يثبت أن الحجر ألماس."
  },
  certificate: {
    title: "شهادات بلا اختصارات",
    text:
      "يصدر IGI تقارير للألماس المصنع مخبرياً المؤهل. لا تعرض NURA عبارة «معتمد من IGI» على منتج إلا بعد تسجيل رقم التقرير ورابط التحقق الرسمي لذلك المنتج.",
    sample: "نموذج تعليمي — ليس تقريراً من IGI",
    verify: "معلومات تقارير IGI",
    note:
      "يوضح النموذج أدناه الحقول التي قد تظهر في تقرير تصنيف. وهو ليس شهادة ولا يستخدم رقم تقرير IGI ولا يعتمد أي منتج حالي من NURA."
  },
  impact: {
    title: "التزام مستقبلي تجاه النساء والأطفال",
    text:
      "تعتزم NURA دعم برامج مرخصة في الإمارات تخدم النساء والأطفال. لا ندعي حالياً وجود شراكة خيرية أو مبلغ تبرع أو تبرعات منجزة. سيذكر أي برنامج مستقبلي الجهة المرخصة وطريقة المساهمة والنتائج بشفافية بعد استكمال الموافقات المطلوبة.",
    status: "حالة الالتزام: اختيار الشريك ومراجعة الامتثال"
  },
  sources: "مراجع علم الأحجار",
  sourceNote: "ترتبط المعلومات التعليمية بمصادر معترف بها، بينما تعتمد ادعاءات كل منتج على المعلومات المسجلة له."
};
