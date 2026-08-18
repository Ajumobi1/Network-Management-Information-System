import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  HeartHandshake,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { publicPortalService, PublicComplaintStatus, PublicProvider, PublicPortalSnapshot } from '../../services/public/publicPortalService';

const emptySnapshot: PublicPortalSnapshot = {
  kpis: { registeredEnrollees: 0, accreditedProviders: 0, lgasCovered: 0, capitationRate: 0, hospitals: 0, pharmacies: 0, diagnosticCentres: 0, populationPeriod: null, populationPeriodLabel: null },
  transparency: { byLga: [], byCategory: [] },
  featuredProviders: [],
  lastUpdated: null,
};

const categoryLabels: Record<string, string> = {
  HOSPITAL: 'Hospital',
  PHARMACY: 'Pharmacy',
  DIAGNOSTIC_CENTRE: 'Diagnostic Centre',
  OPTICAL_CENTRE: 'Optical Centre',
  DENTAL_CENTRE: 'Dental Centre',
};

const newsItems = [
  ['2026 Enrolment Registration Drive', 'Learn how to register and access contributory health services across Ondo State.'],
  ['Provider Network Updates', 'Accredited facilities continue to expand access to quality care across all three senatorial districts.'],
  ['Know Your Health Cover', 'Understand your benefits, how to access care, and what to do when you need help.'],
];

const educationItems = [
  ['How do I register?', 'Start your journey with ODCHC and receive guidance on enrolment, provider selection, and care access.'],
  ['What does the scheme cover?', 'Learn how contributory health insurance supports preventive, primary, specialist, and referral care.'],
  ['What is capitation?', 'Capitation is the approved monthly payment that supports care delivery for eligible enrollees at their provider.'],
];

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-NG').format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
}

function humanizeCategory(category: string) {
  return categoryLabels[category] ?? category.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter: string) => letter.toUpperCase());
}

export default function PublicHomePage() {
  const [snapshot, setSnapshot] = useState<PublicPortalSnapshot>(emptySnapshot);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [lga, setLga] = useState('');
  const [category, setCategory] = useState('');
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [complaintForm, setComplaintForm] = useState({ category: 'service-delivery', name: '', phone: '', email: '', lga: '', providerId: '', description: '', incidentDate: '', preferredContactMethod: 'Phone' });
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintResult, setComplaintResult] = useState<string | null>(null);
  const [complaintError, setComplaintError] = useState<string | null>(null);
  const [trackingReference, setTrackingReference] = useState('');
  const [tracking, setTracking] = useState<PublicComplaintStatus | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    publicPortalService.getSnapshot().then(data => {
      if (active) setSnapshot(data);
    }).catch(error => {
      if (active) setSnapshotError(error instanceof Error ? error.message : 'Live public statistics are temporarily unavailable.');
    }).finally(() => {
      if (active) setSnapshotLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setProviderLoading(true);
    publicPortalService.findProviders({ search, lga, category }).then(data => {
      if (active) setProviders(data);
    }).catch(error => {
      if (active) setProviderError(error instanceof Error ? error.message : 'The public provider directory is temporarily unavailable.');
    }).finally(() => {
      if (active) setProviderLoading(false);
    });
    return () => { active = false; };
  }, [search, lga, category]);

  const lgaOptions = useMemo(() => snapshot.transparency.byLga.map(item => item.name), [snapshot.transparency.byLga]);
  const updatedAt = snapshot.lastUpdated ? new Date(snapshot.lastUpdated).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : 'Awaiting live update';

  const submitComplaint = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setComplaintSubmitting(true);
    setComplaintError(null);
    setComplaintResult(null);
    try {
      const result = await publicPortalService.submitComplaint({
        category: complaintForm.category,
        complainantName: complaintForm.name,
        contactPhone: complaintForm.phone,
        contactEmail: complaintForm.email,
        lga: complaintForm.lga,
        providerId: complaintForm.providerId || undefined,
        description: complaintForm.description,
        incidentDate: complaintForm.incidentDate || undefined,
        preferredContactMethod: complaintForm.preferredContactMethod,
      });
      setComplaintResult(result.referenceNumber);
      setComplaintForm(previous => ({ ...previous, description: '' }));
    } catch (error) {
      setComplaintError(error instanceof Error ? error.message : 'The complaint could not be submitted.');
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const trackComplaint = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTrackingError(null);
    setTracking(null);
    try {
      const result = await publicPortalService.trackComplaint(trackingReference);
      if (!result) setTrackingError('No complaint was found with that reference number.');
      else setTracking(result);
    } catch (error) {
      setTrackingError(error instanceof Error ? error.message : 'Complaint tracking is temporarily unavailable.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-brand-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-navy/95 text-white shadow-lg backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <img src="/assets/odchc-seal.png" alt="ODCHC seal" className="h-11 w-11 shrink-0 object-contain" />
            <span className="min-w-0"><strong className="block truncate text-sm tracking-wide">ODCHC</strong><span className="block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-white/65">Public Health Portal</span></span>
          </a>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-white/80 lg:flex">
            {['network', 'services', 'complaints', 'transparency', 'about'].map(item => <a key={item} href={`#${item}`} className="transition hover:text-white">{item[0].toUpperCase() + item.slice(1)}</a>)}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden rounded-control bg-white px-4 py-2 text-sm font-bold text-brand-navy transition hover:bg-brand-soft sm:inline-flex">Login to NMIS</Link>
            <button type="button" onClick={() => setMobileMenuOpen(value => !value)} className="rounded-control p-2 text-white hover:bg-white/10 lg:hidden" aria-label="Toggle menu">{mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
        {mobileMenuOpen && <div className="border-t border-white/10 px-4 py-4 lg:hidden"><div className="grid gap-3 text-sm font-semibold text-white/80">{['network', 'services', 'complaints', 'transparency', 'about'].map(item => <a key={item} href={`#${item}`} onClick={() => setMobileMenuOpen(false)}>{item[0].toUpperCase() + item.slice(1)}</a>)}<Link to="/login" className="mt-2 inline-flex justify-center rounded-control bg-white px-4 py-3 text-brand-navy">Login to NMIS</Link></div></div>}
      </header>

      <main id="top">
        <section className="overflow-hidden bg-brand-navy text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-300" /> NMIS Operational</div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200">Ondo State Contributory Health Commission</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl"><span className="block text-amber-200">ODCHC NMIS</span>Transparent data. Better healthcare. Stronger accountability.</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">The official public information and engagement portal for provider access, enrollee support, health insurance education, and trusted network transparency across Ondo State.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><a href="#complaints" className="inline-flex items-center justify-center gap-2 rounded-control bg-emerald-500 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-400">Report a Complaint <ArrowRight size={16} /></a><a href="#network" className="inline-flex items-center justify-center gap-2 rounded-control border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Find a Provider <MapPin size={16} /></a><Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-control border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">Login to NMIS <ShieldCheck size={16} /></Link></div>
              <p className="mt-6 text-xs text-white/50">Live data update: {updatedAt}</p>
            </div>
            <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur sm:p-6"><div className="rounded-[1.5rem] bg-gradient-to-br from-brand-blue/80 to-brand-navy p-6"><div className="flex items-center gap-4"><img src="/assets/odchc-seal.png" alt="ODCHC seal" className="h-20 w-20 shrink-0 object-contain" /><p className="max-w-xs text-xl font-black uppercase leading-tight tracking-wide text-amber-200 sm:text-2xl">Ondo State<br />Contributory<br />Health Commission</p></div><div className="mt-12 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white/10 p-4"><Users size={20} className="text-emerald-200" /><p className="mt-3 text-2xl font-black">{snapshotLoading ? '—' : formatNumber(snapshot.kpis.registeredEnrollees)}</p><p className="mt-1 text-xs text-white/60">Registered enrollees</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200">{snapshot.kpis.populationPeriodLabel ? `Current list · ${snapshot.kpis.populationPeriodLabel}` : 'Awaiting current list'}</p></div><div className="rounded-2xl bg-white/10 p-4"><Building2 size={20} className="text-amber-200" /><p className="mt-3 text-2xl font-black">{snapshotLoading ? '—' : formatNumber(snapshot.kpis.accreditedProviders)}</p><p className="mt-1 text-xs text-white/60">Accredited providers</p></div></div></div></div>
          </div>
        </section>

        <section className="border-b border-brand-border bg-white"><div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8"><PublicKpi icon={<Users size={20} />} label="Registered Enrollees" value={snapshotLoading ? 'Loading' : `${formatNumber(snapshot.kpis.registeredEnrollees)}+`} /><PublicKpi icon={<Building2 size={20} />} label="Accredited Providers" value={snapshotLoading ? 'Loading' : formatNumber(snapshot.kpis.accreditedProviders)} /><PublicKpi icon={<MapPin size={20} />} label="LGAs Covered" value={snapshotLoading ? 'Loading' : formatNumber(snapshot.kpis.lgasCovered)} /><PublicKpi icon={<HeartHandshake size={20} />} label="Monthly Capitation" value={snapshotLoading ? 'Loading' : formatCurrency(snapshot.kpis.capitationRate)} /></div></section>

        {snapshotError && <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"><div className="rounded-control border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Live public statistics are temporarily unavailable. No private records are displayed.</div></div>}

        <section id="network" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8"><SectionIntro eyebrow="Our Network" title="Find a healthcare provider" description="Search the authoritative public provider directory by facility name, location, and category. Only approved public-safe fields are shown." /><div className="mt-8 grid gap-3 rounded-2xl border border-brand-border bg-white p-4 shadow-sm md:grid-cols-[1fr_0.55fr_0.55fr]"><label className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtle" size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Provider name, code, or location" className="nmis-control pl-10" /></label><select className="nmis-control" value={lga} onChange={event => setLga(event.target.value)}><option value="">All LGAs</option>{lgaOptions.map(option => <option key={option}>{option}</option>)}</select><select className="nmis-control" value={category} onChange={event => setCategory(event.target.value)}><option value="">All facility categories</option>{Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div><div className="mt-6">{providerError ? <div className="rounded-control border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{providerError}</div> : providerLoading ? <div className="rounded-control border border-brand-border bg-white p-8 text-center text-sm text-brand-muted">Searching the public provider directory...</div> : providers.length === 0 ? <div className="rounded-control border border-dashed border-brand-border bg-white p-8 text-center text-sm text-brand-muted">No public providers matched your search.</div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{providers.map(provider => <ProviderCard key={provider.id} provider={provider} />)}</div>}</div></section>

        <section id="services" className="scroll-mt-24 bg-brand-surface"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionIntro eyebrow="Member Services" title="Help for every step of your healthcare journey" description="Use NMIS to find care, understand your cover, connect with support, and raise a concern when service delivery falls short." /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><ServiceCard icon={<Users />} title="Enrollee support" text="Get guidance on registration, provider selection, and accessing care." /><ServiceCard icon={<MapPin />} title="Find your provider" text="Discover accredited facilities near your LGA and understand their service profile." /><ServiceCard icon={<FileText />} title="Understand your cover" text="Read clear explanations of benefits, capitation, referrals, and care access." /><ServiceCard icon={<HeartHandshake />} title="Your voice matters" text="Report a problem and receive a reference you can use to track progress." /></div></div></section>

        <section id="complaints" className="scroll-mt-24 bg-white"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.72fr] lg:px-8"><div><SectionIntro eyebrow="Citizen Support" title="Report a complaint" description="Experiencing a problem with a healthcare provider, enrolment, authorization, claims, or service delivery? Tell the Commission what happened." /><form onSubmit={submitComplaint} className="mt-8 grid gap-4 rounded-2xl border border-brand-border bg-brand-surface p-5 sm:grid-cols-2 sm:p-6"><select className="nmis-control" value={complaintForm.category} onChange={event => setComplaintForm({ ...complaintForm, category: event.target.value })}><option value="service-delivery">Service delivery</option><option value="enrolment">Enrolment</option><option value="provider">Provider experience</option><option value="claims">Claims or authorization</option><option value="other">Other</option></select><input className="nmis-control" placeholder="LGA" value={complaintForm.lga} onChange={event => setComplaintForm({ ...complaintForm, lga: event.target.value })} /><input className="nmis-control" placeholder="Name (optional)" value={complaintForm.name} onChange={event => setComplaintForm({ ...complaintForm, name: event.target.value })} /><input className="nmis-control" placeholder="Phone number" value={complaintForm.phone} onChange={event => setComplaintForm({ ...complaintForm, phone: event.target.value })} /><input className="nmis-control" type="email" placeholder="Email address" value={complaintForm.email} onChange={event => setComplaintForm({ ...complaintForm, email: event.target.value })} /><input className="nmis-control" type="date" value={complaintForm.incidentDate} onChange={event => setComplaintForm({ ...complaintForm, incidentDate: event.target.value })} /><textarea required minLength={10} className="nmis-control min-h-32 sm:col-span-2" placeholder="Describe what happened (at least 10 characters)" value={complaintForm.description} onChange={event => setComplaintForm({ ...complaintForm, description: event.target.value })} /><div className="sm:col-span-2"><button disabled={complaintSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-brand-navy px-5 py-3 text-sm font-bold text-white hover:bg-brand-blue sm:w-auto">{complaintSubmitting ? 'Submitting...' : 'Submit Complaint'} <ArrowRight size={16} /></button></div>{complaintResult && <div className="sm:col-span-2 rounded-control border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Complaint submitted. Your reference is <strong>{complaintResult}</strong>.</div>}{complaintError && <div className="sm:col-span-2 rounded-control border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{complaintError}</div>}</form></div><div className="rounded-[2rem] bg-brand-navy p-6 text-white sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Track your complaint</p><h3 className="mt-3 text-2xl font-black">Stay informed after you submit.</h3><p className="mt-3 text-sm leading-7 text-white/65">Enter the reference number sent after submission to see the latest public-safe status.</p><form onSubmit={trackComplaint} className="mt-8 space-y-3"><input className="w-full rounded-control border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/50" placeholder="ODCHC-2026-XXXXX" value={trackingReference} onChange={event => setTrackingReference(event.target.value)} required /><button className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-white px-4 py-3 text-sm font-bold text-brand-navy hover:bg-brand-soft">Check Status <Search size={16} /></button></form>{tracking && <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm"><p className="font-bold">{tracking.referenceNumber}</p><p className="mt-2 text-white/70">Status: <span className="font-bold text-emerald-200">{tracking.status}</span></p></div>}{trackingError && <p className="mt-4 text-sm text-amber-200">{trackingError}</p>}</div></div></section>

        <section id="transparency" className="scroll-mt-24 bg-brand-surface"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><SectionIntro eyebrow="Transparency" title="Open, aggregated, privacy-safe intelligence" description="NMIS shares public-safe network information without exposing names, phone numbers, policy numbers, or individual financial records." /><div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold">Enrollees by LGA</h3><span className="text-xs text-brand-muted">Valid records only</span></div><div className="mt-5 space-y-3">{snapshot.transparency.byLga.slice(0, 8).map(item => <div key={item.name}><div className="flex justify-between gap-3 text-sm"><span>{item.name}</span><strong>{formatNumber(item.value)}</strong></div><div className="mt-1 h-2 rounded-full bg-brand-soft"><div className="h-2 rounded-full bg-brand-blue" style={{ width: `${Math.min(100, (item.value / Math.max(1, snapshot.transparency.byLga[0]?.value || 1)) * 100)}%` }} /></div></div>)}{snapshot.transparency.byLga.length === 0 && <p className="text-sm text-brand-muted">Aggregated LGA data will appear after the public data contract is enabled.</p>}</div></div><div className="rounded-2xl border border-brand-border bg-white p-5 sm:p-6"><h3 className="text-lg font-bold">Provider distribution</h3><div className="mt-5 space-y-3">{snapshot.transparency.byCategory.map(item => <div key={item.name} className="flex items-center justify-between rounded-xl bg-brand-surface p-3 text-sm"><span>{humanizeCategory(item.name)}</span><strong>{formatNumber(item.value)}</strong></div>)}{snapshot.transparency.byCategory.length === 0 && <p className="text-sm text-brand-muted">Category summaries will appear after the public data contract is enabled.</p>}</div></div></div></div></section>

        <section className="bg-white"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8"><div><SectionIntro eyebrow="Latest Updates" title="News and announcements" description="Follow important Commission programmes, awareness campaigns, and network updates." /><div className="mt-7 space-y-3">{newsItems.map(([title, text]) => <div key={title} className="flex gap-4 rounded-2xl border border-brand-border p-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue"><CalendarDays size={19} /></div><div><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-brand-muted">{text}</p></div></div>)}</div></div><div><SectionIntro eyebrow="Health Insurance Education" title="Understand your cover" description="Clear, practical answers for members and communities." /><div className="mt-7 space-y-3">{educationItems.map(([title, text]) => <div key={title} className="rounded-2xl bg-brand-surface p-4"><h3 className="font-bold">{title}</h3><p className="mt-1 text-sm leading-6 text-brand-muted">{text}</p></div>)}</div></div></div></section>

        <section id="about" className="scroll-mt-24 bg-brand-navy text-white"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.7fr] lg:px-8"><div><SectionIntro dark eyebrow="About ODCHC" title="A stronger health system through accountable care" description="The Ondo State Contributory Health Commission works to expand access to quality, affordable, and sustainable healthcare for residents of Ondo State." /><div className="mt-7 grid gap-4 sm:grid-cols-3"><DarkFact title="Vision" text="A healthy population with equitable access to care." /><DarkFact title="Mission" text="Protect households through coordinated health financing." /><DarkFact title="Commitment" text="Transparent service, responsible stewardship, and citizen voice." /></div></div><div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue">Need help?</p><h3 className="mt-3 text-2xl font-black">Connect with the Commission</h3><div className="mt-6 space-y-4 text-sm text-white/70"><p className="flex gap-3"><Phone size={17} className="shrink-0 text-emerald-200" /> Customer service support</p><p className="flex gap-3"><Mail size={17} className="shrink-0 text-emerald-200" /> Official Commission correspondence</p><p className="flex gap-3"><MapPin size={17} className="shrink-0 text-emerald-200" /> Ondo State, Nigeria</p><p className="flex gap-3"><Clock3 size={17} className="shrink-0 text-emerald-200" /> Monday–Friday, 8:00 AM–4:00 PM</p></div></div></div></section>
      </main>

      <footer className="bg-[#07102f] text-white/65"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8"><div><div className="flex items-center gap-3"><img src="/assets/odchc-seal.png" alt="ODCHC seal" className="h-10 w-10 object-contain" /><div><p className="font-bold text-white">Ondo State Contributory Health Commission</p><p className="text-xs">Network Management Information System (NMIS)</p></div></div><p className="mt-4 max-w-xl text-sm leading-6">Official public information portal for healthcare network access, citizen engagement, and privacy-safe transparency.</p></div><div className="flex flex-wrap items-start gap-x-6 gap-y-3 text-sm"><a href="#about" className="hover:text-white">About</a><a href="#network" className="hover:text-white">Providers</a><a href="#services" className="hover:text-white">Enrolment</a><a href="#complaints" className="hover:text-white">Complaints</a><Link to="/login" className="hover:text-white">Secure login</Link></div></div><div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>© {new Date().getFullYear()} Ondo State Contributory Health Commission. All rights reserved.</span><span className="inline-flex items-center gap-1.5"><BadgeCheck size={14} /> Public data is aggregated and privacy-safe.</span></div></div></footer>
    </div>
  );
}

function PublicKpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-brand-border bg-white p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">{icon}</span><div className="min-w-0"><p className="truncate text-xs font-semibold uppercase tracking-wide text-brand-muted">{label}</p><p className="mt-1 truncate text-xl font-black text-brand-foreground">{value}</p></div></div>;
}

function SectionIntro({ eyebrow, title, description, dark = false }: { eyebrow: string; title: string; description: string; dark?: boolean }) {
  return <div><p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? 'text-brand-blue' : 'text-brand-blue'}`}>{eyebrow}</p><h2 className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${dark ? 'text-white' : 'text-brand-foreground'}`}>{title}</h2><p className={`mt-3 max-w-2xl text-base leading-7 ${dark ? 'text-white/65' : 'text-brand-muted'}`}>{description}</p></div>;
}

function ProviderCard({ provider }: { provider: PublicProvider }) {
  return <article className="flex min-h-56 flex-col rounded-2xl border border-brand-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-brand-soft px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-blue">{humanizeCategory(provider.category)}</span><BadgeCheck size={18} className="shrink-0 text-emerald-500" /></div><h3 className="mt-4 text-lg font-bold leading-snug">{provider.providerName}</h3><p className="mt-1 text-sm text-brand-muted">{provider.lga} LGA · {provider.ownership || 'Accredited facility'}</p><div className="mt-auto flex flex-wrap gap-2 pt-5">{provider.services.slice(0, 3).map(service => <span key={service} className="rounded-full bg-brand-surface px-2.5 py-1 text-xs text-brand-secondary">✓ {service.replace(' Services', '')}</span>)}{provider.services.length === 0 && <span className="text-xs text-brand-muted">Public service profile available</span>}</div></article>;
}

function ServiceCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-2xl border border-brand-border bg-white p-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">{icon}</div><h3 className="mt-4 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-brand-muted">{text}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand-blue">Learn more <ChevronRight size={14} /></span></div>;
}

function DarkFact({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald-200">{title}</p><p className="mt-2 text-sm leading-6 text-white/65">{text}</p></div>;
}
