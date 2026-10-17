import { BRAND } from '@/lib/brand'

import { authEn } from './auth'

/** English copy for the public side. `ne.ts` must have exactly the same shape. */
export const en = {
  nav: {
    howItWorks: 'How it works',
    pricing: 'Pricing',
    logIn: 'Log in',
    startHiring: 'Start hiring',
    openApp: `Open ${BRAND.name}`,
    menu: 'Open menu',
    myApplications: 'My applications',
    signOut: 'Sign out',
    account: 'Account',
    language: 'Language',
    privacy: 'Privacy',
    terms: 'Terms',
    cookies: 'Cookies',
  },

  common: {
    example: 'Example',
    verified: 'Verified',
    share: 'Share',
    poster: 'Poster',
    print: 'Print',
    apply: 'Apply',
    tryAgain: 'Try again',
    error: 'Something went wrong. Try again.',
    offline: 'Could not reach the server. Check your connection.',
    linkCopied: 'Link copied',
    copyFailed: "Couldn't copy. Select the link and copy it instead.",
    optional: 'optional',
  },

  cookie: { line: 'We only use cookies that keep you signed in.', details: 'Details', ok: 'OK' },

  stage: {
    new: 'New',
    shortlisted: 'Shortlisted',
    interview: 'Interview',
    offer: 'Offer',
    hired: 'Hired',
    not_selected: 'Not selected this time',
    withdrawn: 'Withdrawn',
  },

  nextStep: {
    new: 'The business is looking at applications.',
    shortlisted: 'They will contact you to set an interview.',
    interview: 'Be on time, with your CV if you have one.',
    interviewDone: 'Interview done. They will get back to you.',
    offer: 'You have an offer. Reply to the business by phone or email.',
    hired: 'Congratulations on the job.',
    not_selected: 'Thank you for applying. Keep an eye out for their next job.',
    withdrawn: 'You withdrew this application.',
  },

  job: {
    remote: 'Remote',
    hybrid: 'Hybrid',
    onsite: 'On-site',
    from: (amount: string) => `From ${amount}`,
    upTo: (amount: string) => `Up to ${amount}`,
    npr: 'NPR',
    perMonth: '/ month',
    closesToday: 'Closes today',
    closesTomorrow: 'Closes tomorrow',
    closesIn: (days: number) => `Closes in ${days} days`,
    closed: 'Closed',
    about: 'About the job',
    whatYouDo: 'What you will do',
    whatYouNeed: 'What you need',
    niceToHave: 'Nice to have',
    benefits: 'Benefits',
    knowSomeone: 'Know someone good for this job?',
    suggest: 'Suggest someone you know',
    moreJobs: (company: string) => `More jobs at ${company}`,
  },

  apply: {
    title: 'Apply',
    time: 'Takes about a minute',
    name: 'Your name',
    phone: 'Mobile number',
    email: 'Email',
    cv: 'CV',
    addCv: 'Add CV or photo of CV',
    cvTypes: (mb: number) => `PDF or photo, up to ${mb} MB`,
    reading: 'Reading your CV…',
    photoAdded: 'Photo added',
    replace: 'Replace',
    remove: 'Remove',
    nameRequired: 'Enter your name.',
    phoneRequired: 'Enter your mobile number.',
    phoneInvalid: 'Enter a 10-digit mobile number, like 98XXXXXXXX.',
    emailInvalid: 'Check the email, or leave it empty.',
    answerRequired: 'Answer this question.',
    cvWrongType: 'Upload a PDF or a photo (JPG or PNG).',
    cvHeic:
      'iPhone HEIC photos can’t be read. Take a screenshot of the photo and upload that, or send a PDF.',
    cvTooBig: (mb: number) => `Use a file under ${mb} MB.`,
    consent: (business: string) =>
      `We'll share your application with ${business.replace(/\.+$/, '')}. AI assists, they decide.`,
    privacy: 'Privacy',
    submit: 'Send application',
    sentTitle: 'Application sent',
    alreadyTitle: 'You already applied',
    sentSms: (phone: string) => `We'll send updates by SMS to ${phone}.`,
    sentEmail: (email: string) => `We also emailed a status link to ${email}.`,
    replyEither: (business: string) => `${business} will reply either way.`,
    seeAll: 'See all my applications',
  },

  suggest: {
    title: 'Suggest someone you know',
    forJob: (job: string, company: string) => `${job} · ${company}`,
    yourName: 'Your name',
    yourPhone: 'Your mobile number',
    theirName: 'Their name',
    theirPhone: 'Their mobile number',
    note: 'Why are they good? (optional)',
    notePlaceholder: 'Worked with me for 2 years, very honest.',
    submit: 'Send suggestion',
    sameNumber: 'Their number must be different from yours.',
    doneTitle: 'Thank you!',
    doneLine: (name: string, company: string) =>
      `We'll send ${name} the job link by SMS. ${company} decides who to hire.`,
    another: 'Suggest another person',
    seeJob: 'See the job',
  },

  poster: {
    print: 'Print poster',
    back: 'Back to the job',
    requirements: 'You need',
    salary: 'Salary',
    call: 'Call',
    // The poster always shows both languages, whatever the page language.
    scanNe: 'स्क्यान गरेर आवेदन दिनुहोस्',
    noAccountNe: 'खाता चाहिँदैन',
    scanEn: 'Scan to apply',
    noAccountEn: 'No account needed',
    orVisit: 'Or open',
  },

  careers: {
    openJobs: (n: number) => (n === 1 ? '1 open job' : `${n} open jobs`),
    noJobs: 'No open jobs right now.',
    website: 'Visit website',
    shareText: (job: string, company: string) => `${company} is hiring: ${job}. Apply here:`,
  },

  status: {
    title: 'Your application',
    applied: (date: string) => `Applied ${date}`,
    interview: 'Interview',
    join: 'Join',
    addToCalendar: 'Add to calendar',
    withdraw: 'Withdraw application',
    withdrawConfirm: 'Withdraw and delete your data?',
    withdrawYes: 'Withdraw',
    cancel: 'Keep it',
    withdrawnTitle: 'Application withdrawn',
    withdrawnLine: 'Your CV and details for this job were deleted.',
    invalidTitle: 'Link not valid',
    incomplete: 'This link is incomplete.',
    getLink: 'Get a sign-in link',
    seeAll: 'See all my applications',
  },

  me: {
    title: 'My applications',
    count: (n: number) => (n === 1 ? '1 application' : `${n} applications`),
    upcoming: (n: number) => (n === 1 ? '1 interview coming up' : `${n} interviews coming up`),
    needsYou: 'Needs you',
    inProgress: 'In progress',
    closed: 'Closed',
    empty: 'No applications yet.',
  },

  landing: {
    metaTitle: `${BRAND.name} — hire through one link`,
    metaDescription:
      'Post a job on Facebook or Viber with one apply link. People apply from their phone, with or without a CV. You choose.',
    headline: 'Post on Facebook or Viber. We handle the rest — you choose.',
    sub: 'Share one link. People apply from their phone in a minute, CV or no CV. You see who fits, and everyone hears back.',
    cta: 'Post your first job free',
    ctaSecondary: 'See how it works',
    preview: {
      title: 'New applicants',
      facts: '3 jobs · 26 applicants',
      shortlist: 'Shortlist',
      notNow: 'Not now',
      shortlisted: 'Shortlisted',
      suggestedBy: 'Suggested by Ram dai',
      noCv: 'No CV',
      rows: [
        {
          name: 'Sita Gurung',
          job: 'Staff nurse · Pokhara',
          reason: '3 yrs ward nurse · NNC licence',
        },
        {
          name: 'Bikash Thapa',
          job: 'Hotel receptionist · Thamel',
          reason: 'Front desk 2 yrs · English, Hindi',
        },
        {
          name: 'Anita Shrestha',
          job: 'Accountant · Butwal',
          reason: 'Tally and VAT returns · 4 yrs',
        },
        {
          name: 'Kamal Magar',
          job: 'Hotel receptionist · Thamel',
          reason: 'Answered all 3 questions',
        },
      ],
    },
    how: {
      title: 'How it works',
      steps: [
        {
          title: 'Post your job',
          line: 'Type a few words. We write the job post and give you one apply link.',
        },
        {
          title: 'Share it anywhere',
          line: 'Facebook, Viber, WhatsApp or a QR poster on your door. Your staff can suggest people they know.',
        },
        {
          title: 'Choose who to meet',
          line: 'Every application is read and sorted with the reason. You decide, and everyone hears back by SMS.',
        },
      ],
    },
    trust: [
      'AI assists. You decide.',
      'Every applicant hears back.',
      'No account needed to apply.',
      'Built for Nepal.',
    ],
    pricing: {
      title: 'Pricing',
      note: 'Prices + 13% VAT. Job seekers never pay.',
      perJob: '/ job',
      perMonth: '/ month',
      talk: 'Talk to us',
      start: 'Start free',
      choose: 'Choose',
      popular: 'Most popular',
      payment: 'Pay by bank transfer today — eSewa and Khalti coming soon. VAT bill provided.',
      plans: [
        {
          id: 'first',
          name: 'First job',
          price: 'Free',
          period: '',
          line: 'Your first job, open 45 days, up to 100 applications read for you.',
        },
        {
          id: 'pass',
          name: 'Job Pass',
          price: 'NPR 999',
          period: 'job',
          line: 'One job for 45 days. 100 applications read, SMS updates to applicants.',
        },
        {
          id: 'plus',
          name: 'Job Pass Plus',
          price: 'NPR 2,499',
          period: 'job',
          line: 'One busy job for 60 days. 300 applications read, invite many at once.',
        },
        {
          id: 'team',
          name: 'Team',
          price: 'NPR 3,499',
          period: 'month',
          line: 'Up to 5 open jobs and 5 team members. 400 applications read a month.',
        },
        {
          id: 'business',
          name: 'Business',
          price: 'NPR 9,999',
          period: 'month',
          line: 'Unlimited jobs, 15 team members and branches. 1,200 applications a month.',
        },
        {
          id: 'volume',
          name: 'Volume hiring',
          price: 'Talk to us',
          period: '',
          line: 'Banks, factories and hiring drives. Priced per application.',
        },
      ],
    },
    faq: {
      title: 'Questions',
      items: [
        {
          q: "I don't have a website or Facebook page — can I use this?",
          a: 'Yes. You get a job page and a careers page with your business name. Share the link on Viber or print the QR poster.',
        },
        {
          q: 'Do applicants need to make an account?',
          a: 'No. They type their name and phone number, add a CV or a photo of it if they have one, and apply in about a minute.',
        },
        {
          q: 'Does the AI reject people?',
          a: 'No. AI reads every application and shows you who fits and why. A person in your team makes every decision.',
        },
        {
          q: 'Can my staff suggest people they know?',
          a: 'Yes. Every job has a "Suggest someone you know" link. You see who suggested each person.',
        },
        {
          q: 'How do I pay?',
          a: 'By bank transfer today; eSewa and Khalti are coming soon. You get a VAT bill. Your first job is free.',
        },
        {
          q: 'Is it only for IT jobs?',
          a: 'No — any job. Nurses, cooks, drivers, receptionists, teachers, accountants, shop and factory staff.',
        },
      ],
    },
    closing: 'Post your first job today. It’s free.',
  },

  auth: authEn,
}

export type Dict = typeof en
