// src/data/about.ts
import { SITE } from "@/config";
import type { Lang } from "@/i18n/config";

export interface SkillGroup {
  title: string;
  items: string[];
}

export interface Job {
  role: string;
  company: string;
  period: string;
  location: string;
  points: { title: string; text: string }[];
}

export interface Edu {
  degree: string;
  school: string;
  period: string;
  detail?: string;
}

export interface Cert {
  name: string;
  desc: string;
  href: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface AboutContent {
  title: string;
  description: string;
  pageTitle: string;
  eyebrow: string;
  name: string;
  role: string;
  location: string;
  email: string;
  phone: string;
  summaryTitle: string;
  summary: string;
  statsLabel: string;
  stats: Stat[];
  skillsTitle: string;
  skillsSub: string;
  skillGroups: SkillGroup[];
  expTitle: string;
  expSub: string;
  jobs: Job[];
  eduTitle: string;
  education: Edu[];
  certsTitle: string;
  certsSub: string;
  certs: Cert[];
  awardTitle: string;
  awardOrg: string;
  awardPoints: { title: string; text: string }[];
  contactLabels: { email: string; linkedin: string; github: string };
}

export const aboutData: Record<Lang, AboutContent> = {
  en: {
    title: `About | ${SITE.title}`,
    description:
      "Nika Natsvlishvili — .NET Software Engineer / Backend Engineer. Microservices, Clean Architecture, DDD, and AI integration.",
    pageTitle: "About",
    eyebrow: "Tbilisi, Georgia · Open to interesting work",
    name: "Nika Natsvlishvili",
    role: ".NET Software Engineer | Backend Engineer",
    location: "Tbilisi, Georgia",
    email: "nika.nacvlishvili1@gmail.com",
    phone: "+995 591 110 928",
    summaryTitle: "Professional Summary",
    summary:
      "Software Engineer with 3+ years of experience migrating legacy monoliths to high-performance .NET microservices. I cut processing time by 40% and resource usage by 20% in fintech, and now build AI-assisted government systems serving 20K+ users — with Clean Architecture, DDD, and event-driven design.",
    statsLabel: "Impact highlights",
    stats: [
      { value: "3+", label: "Years experience" },
      { value: "40%", label: "Faster processing" },
      { value: "−20%", label: "Resource usage" },
      { value: "20K+", label: "Users served" },
    ],
    skillsTitle: "Technical Skills",
    skillsSub: "What I reach for in production.",
    skillGroups: [
      {
        title: "Backend",
        items: [
          "C#",
          ".NET",
          "ASP.NET Core",
          "Web API",
          "REST",
          "MVC",
          "LINQ",
          "Python",
          "EF Core",
          "Dapper",
        ],
      },
      {
        title: "Architecture",
        items: ["Microservices", "Clean Architecture", "DDD", "CQRS", "gRPC"],
      },
      {
        title: "Quality",
        items: ["xUnit", "TDD", "Integration Testing", "Testcontainers"],
      },
      {
        title: "Data",
        items: [
          "PostgreSQL",
          "MS SQL Server",
          "Redis",
          "Modeling",
          "Query Tuning",
        ],
      },
      {
        title: "DevOps",
        items: [
          "Docker",
          "Compose",
          "RabbitMQ",
          "Consul",
          "OpenTelemetry",
          "Grafana",
          "Prometheus",
          "Seq",
        ],
      },
      {
        title: "AI / ML",
        items: ["LangChain", "RAG", "FAISS", "scikit-learn", "LLM Integration"],
      },
    ],
    expTitle: "Experience",
    expSub: "Where I've delivered impact.",
    jobs: [
      {
        role: ".NET Software Engineer",
        company: "LEPL Information Technology Agency — Government of Georgia",
        period: "Jan 2026 — Present",
        location: "Tbilisi, Georgia",
        points: [
          {
            title: "AI matching",
            text: "Co-architected candidate-to-job matching for the national employment portal — 20K+ seekers and vacancies.",
          },
          {
            title: "Governance & security",
            text: "IT Modernization Task Force rep; enforced OWASP baselines, shipped enterprise boilerplates, cut onboarding time by 50%.",
          },
          {
            title: "Modernization",
            text: "Leading .NET 6 → .NET 10 migration; refactoring monolith logic into DDD.",
          },
          {
            title: "Observability",
            text: "Ended a year-long logging blackout; restored 100% production visibility with Graylog.",
          },
          {
            title: "Reliability",
            text: "Recovered 100% of corrupted user data in a critical incident; hardened transactional boundaries.",
          },
        ],
      },
      {
        role: ".NET Software Engineer",
        company: "Credo Bank",
        period: "May 2023 — Jan 2026",
        location: "Tbilisi, Georgia",
        points: [
          {
            title: "Monolith → microservices",
            text: "One of two engineers on a 7-person agile team; migrated Creditinfo reporting — 40% faster processing.",
          },
          {
            title: "Performance",
            text: "gRPC services for high-throughput communication — 20% lower resource usage.",
          },
          {
            title: "Delivery",
            text: "Partnered with PMs, QA, and stakeholders to turn business needs into shippable specs.",
          },
          {
            title: "Reporting",
            text: "Built an Excel generation service in C#/.NET — 25% fewer data errors, faster reports.",
          },
        ],
      },
    ],
    eduTitle: "Education",
    education: [
      {
        degree: "MSc in Data Science",
        school: "Georgian National University",
        period: "2023 — 2026",
        detail:
          "GPA 3.55/4.0 · Thesis: Multi-Label Classification of Chest Radiographs (LISA + PaQ, Conformal Guarantees)",
      },
      {
        degree: "BSc in Physics",
        school: "I. Javakhishvili Tbilisi State University",
        period: "2019 — 2023",
      },
    ],
    certsTitle: "Certifications",
    certsSub: "Verified credentials.",
    certs: [
      {
        name: "Google Associate Cloud Engineer",
        desc: "Cloud Infrastructure & DevOps",
        href: "https://drive.google.com/file/d/1ItffdbtsQRxqLlXlhgK41pXNMLXuHsiB/view",
      },
      {
        name: "Microsoft Azure AI Fundamentals",
        desc: "AI & Machine Learning",
        href: "https://drive.google.com/file/d/10iqOtgp3erm3CAtQut5M3YKHdc1K2VDw/view",
      },
      {
        name: "Stanford Machine Learning Specialization",
        desc: "Advanced ML Algorithms",
        href: "https://www.coursera.org/account/accomplishments/verify/HDXYAG3NMSTH",
      },
      {
        name: "Forset Data Science Professional",
        desc: "Analytics & Statistical Modeling",
        href: "https://drive.google.com/file/d/19QI_TyLMu0WTfD4o2ElL-8PfdZMFI555/view",
      },
    ],
    awardTitle: "Jury's Favorite — GAIA Hackathon",
    awardOrg: "Georgian AI National Hackathon",
    awardPoints: [
      {
        title: "Led 4-person team",
        text: "Built a Georgian-language AI assistant — won for practicality and scalability.",
      },
      {
        title: "RAG pipeline",
        text: "LLM backend with LangChain + FAISS + Gemini API — 80% product-matching accuracy.",
      },
    ],
    contactLabels: { email: "Email", linkedin: "LinkedIn", github: "GitHub" },
  },
  ka: {
    title: `შესახებ | ${SITE.title}`,
    description:
      "ნიკა ნაცვლიშვილი — .NET პროგრამული ინჟინერი / ბექენდ დეველოპერი. მიკროსერვისები, Clean Architecture, DDD და AI ინტეგრაცია.",
    pageTitle: "ჩემ შესახებ",
    eyebrow: "თბილისი, საქართველო · ღია ვარ საინტერესო პროექტებისთვის",
    name: "ნიკა ნაცვლიშვილი",
    role: ".NET პროგრამული ინჟინერი | ბექენდ დეველოპერი",
    location: "თბილისი, საქართველო",
    email: "nika.nacvlishvili1@gmail.com",
    phone: "+995 591 110 928",
    summaryTitle: "პროფესიული შეჯამება",
    summary:
      "პროგრამული ინჟინერი 3+ წლიანი გამოცდილებით — მოძველებული მონოლითების მაღალწარმადობიან .NET მიკროსერვისებზე გადაყვანა. ფინტექში დავამცირე დამუშავების დრო 40%-ით და რესურსების მოხმარება 20%-ით; დღეს ვაშენებ AI-ზე დაფუძნებულ სახელმწიფო სისტემებს 20K+ მომხმარებლისთვის — Clean Architecture-ით, DDD-ით და event-driven დიზაინით.",
    statsLabel: "მთავარი შედეგები",
    stats: [
      { value: "3+", label: "წლიანი გამოცდილება" },
      { value: "40%", label: "უფრო სწრაფი დამუშავება" },
      { value: "−20%", label: "რესურსების მოხმარება" },
      { value: "20K+", label: "მომხმარებელი" },
    ],
    skillsTitle: "ტექნიკური უნარები",
    skillsSub: "რას ვიყენებ წარმოებაში.",
    skillGroups: [
      {
        title: "ბექენდი",
        items: [
          "C#",
          ".NET",
          "ASP.NET Core",
          "Web API",
          "REST",
          "MVC",
          "LINQ",
          "Python",
          "EF Core",
          "Dapper",
        ],
      },
      {
        title: "არქიტექტურა",
        items: ["Microservices", "Clean Architecture", "DDD", "CQRS", "gRPC"],
      },
      {
        title: "ხარისხი",
        items: ["xUnit", "TDD", "ინტეგრაციული ტესტები", "Testcontainers"],
      },
      {
        title: "მონაცემები",
        items: [
          "PostgreSQL",
          "MS SQL Server",
          "Redis",
          "მოდელირება",
          "Query Tuning",
        ],
      },
      {
        title: "DevOps",
        items: [
          "Docker",
          "Compose",
          "RabbitMQ",
          "Consul",
          "OpenTelemetry",
          "Grafana",
          "Prometheus",
          "Seq",
        ],
      },
      {
        title: "AI / ML",
        items: ["LangChain", "RAG", "FAISS", "scikit-learn", "LLM ინტეგრაცია"],
      },
    ],
    expTitle: "გამოცდილება",
    expSub: "სად შევქმენი რეალური შედეგი.",
    jobs: [
      {
        role: ".NET პროგრამული ინჟინერი",
        company:
          "სსიპ ინფორმაციული ტექნოლოგიების სააგენტო — საქართველოს მთავრობა",
        period: "იან 2026 — დღემდე",
        location: "თბილისი, საქართველო",
        points: [
          {
            title: "AI შესაბამისობა",
            text: "ეროვნული დასაქმების პორტალისთვის კანდიდატი-ვაკანსიის შესაბამისობა — 20K+ მაძიებელი და ვაკანსია.",
          },
          {
            title: "მმართველობა და უსაფრთხოება",
            text: "IT მოდერნიზაციის ჯგუფის ტექწარმომადგენელი; OWASP სტანდარტები, საწარმოო შაბლონები, ადაპტაცია −50%.",
          },
          {
            title: "მოდერნიზაცია",
            text: ".NET 6 → .NET 10 მიგრაცია; მონოლითის DDD-არქიტექტურაში რეფაქტორინგი.",
          },
          {
            title: "დაკვირვებადობა",
            text: "წლიანი ლოგირების წყვეტის დასასრული; 100% ხილვადობა Graylog-ით.",
          },
          {
            title: "საიმედოობა",
            text: "დაზიანებული მონაცემების 100%-ის აღდგენა კრიტიკული ინციდენტის დროს.",
          },
        ],
      },
      {
        role: ".NET პროგრამული ინჟინერი",
        company: "კრედო ბანკი",
        period: "მაი 2023 — იან 2026",
        location: "თბილისი, საქართველო",
        points: [
          {
            title: "მონოლითი → მიკროსერვისები",
            text: "7-კაციან გუნდში ერთ-ერთი ორი ინჟინრიდან; Creditinfo რეპორტინგი — 40%-ით სწრაფად.",
          },
          {
            title: "წარმადობა",
            text: "gRPC სერვისები — რესურსების მოხმარება −20%.",
          },
          {
            title: "მიწოდება",
            text: "PM-ებთან, QA-სთან და სტეიკჰოლდერებთან ბიზნეს-მოთხოვნების სპეციფიკაციებად ქცევა.",
          },
          {
            title: "რეპორტინგი",
            text: "Excel სერვისი C#/.NET-ით — შეცდომები −25%, უფრო სწრაფი რეპორტები.",
          },
        ],
      },
    ],
    eduTitle: "განათლება",
    education: [
      {
        degree: "მაგისტრი მონაცემთა მეცნიერებაში",
        school: "საქართველოს ეროვნული უნივერსიტეტი",
        period: "2023 — 2026",
        detail:
          "GPA 3.55/4.0 · თეზისი: Multi-Label Classification of Chest Radiographs (LISA + PaQ)",
      },
      {
        degree: "ბაკალავრი ფიზიკაში",
        school: "თბილისის სახელმწიფო უნივერსიტეტი",
        period: "2019 — 2023",
      },
    ],
    certsTitle: "სერტიფიკატები",
    certsSub: "ვერიფიცირებული კრედენშალები.",
    certs: [
      {
        name: "Google Associate Cloud Engineer",
        desc: "Cloud ინფრასტრუქტურა და DevOps",
        href: "https://drive.google.com/file/d/1ItffdbtsQRxqLlXlhgK41pXNMLXuHsiB/view",
      },
      {
        name: "Microsoft Azure AI Fundamentals",
        desc: "AI და მანქანური სწავლება",
        href: "https://drive.google.com/file/d/10iqOtgp3erm3CAtQut5M3YKHdc1K2VDw/view",
      },
      {
        name: "Stanford Machine Learning Specialization",
        desc: "ML ალგორითმები",
        href: "https://www.coursera.org/account/accomplishments/verify/HDXYAG3NMSTH",
      },
      {
        name: "Forset Data Science Professional",
        desc: "ანალიტიკა და სტატისტიკური მოდელირება",
        href: "https://drive.google.com/file/d/19QI_TyLMu0WTfD4o2ElL-8PfdZMFI555/view",
      },
    ],
    awardTitle: "ჟიურის ფავორიტი — GAIA ჰაკათონი",
    awardOrg: "საქართველოს AI ეროვნული ჰაკათონი",
    awardPoints: [
      {
        title: "4-კაციანი გუნდის ლიდერობა",
        text: "ქართულენოვანი AI ასისტენტი — გამარჯვება პრაქტიკულობისა და მასშტაბირებადობისთვის.",
      },
      {
        title: "RAG პაიპლაინი",
        text: "LangChain + FAISS + Gemini API — 80% პროდუქტის შესაბამისობა.",
      },
    ],
    contactLabels: { email: "ელფოსტა", linkedin: "LinkedIn", github: "GitHub" },
  },
};
