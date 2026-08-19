import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Heart,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  Users,
  X,
  Navigation,
  Info,
} from 'lucide-react';
import { publicPortalService, PublicComplaintStatus, PublicComplaintThread, PublicProvider, PublicPortalSnapshot } from '../../services/public/publicPortalService';

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

function humanizeCategory(category: string) {
  return categoryLabels[category] ?? category.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (letter: string) => letter.toUpperCase());
}

function providerLocationQuery(provider: PublicProvider): string | null {
  // Prefer an exact verified coordinate pair. When one is not yet available,
  // use the complete facility + physical address + LGA + state query so the
  // card can still focus the live map without falling back to a broad name/LGA search.
  if (Number.isFinite(provider.latitude) && Number.isFinite(provider.longitude)) {
    return `${provider.latitude},${provider.longitude}`;
  }

  if (provider.address?.trim()) {
    return [provider.providerName, provider.address, provider.lga, 'Ondo State, Nigeria']
      .filter(Boolean)
      .join(', ');
  }

  return null;
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
  const [locating, setLocating] = useState(false);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [mapTarget, setMapTarget] = useState({
    name: 'ODCHC Headquarters',
    query: 'Ministry of Health Complex, Alagbaka, Akure, Ondo State, Nigeria',
  });

  const odchcOffice = { 
    name: 'ODCHC Headquarters', 
    lga: 'Akure South', 
    type: 'office', 
    address: 'Ministry of Health Complex, Alagbaka, Akure, Ondo State',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Ministry+of+Health+Complex+Alagbaka+Akure+Ondo+State'
  };

  const [complaintForm, setComplaintForm] = useState({ category: 'service-delivery', name: '', phone: '', email: '', lga: '', providerId: '', description: '', incidentDate: '', preferredContactMethod: 'Phone' });
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintResult, setComplaintResult] = useState<string | null>(null);
  const [complaintError, setComplaintError] = useState<string | null>(null);
  const [complaintStatusRef, setComplaintStatusRef] = useState('');
  const [complaintStatusContact, setComplaintStatusContact] = useState('');
  const [complaintStatusResult, setComplaintStatusResult] = useState<PublicComplaintStatus | null>(null);
  const [complaintThread, setComplaintThread] = useState<PublicComplaintThread | null>(null);
  const [complaintStatusLoading, setComplaintStatusLoading] = useState(false);
  const [complaintStatusError, setComplaintStatusError] = useState<string | null>(null);
  const [complaintReply, setComplaintReply] = useState('');
  const [complaintReplyLoading, setComplaintReplyLoading] = useState(false);

  useEffect(() => {
    publicPortalService.getSnapshot().then(setSnapshot).catch(err => setSnapshotError(err.message)).finally(() => setSnapshotLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    setProviderLoading(true);
    publicPortalService.findProviders({ search, lga, category }).then(data => {
      if (active) setProviders(data);
    }).catch(err => {
      if (active) setProviderError(err.message);
    }).finally(() => {
      if (active) setProviderLoading(false);
    });
    return () => { active = false; };
  }, [search, lga, category]);

  const lgaOptions = useMemo(() => snapshot.transparency.byLga.map(item => item.name), [snapshot.transparency.byLga]);
  const updatedAt = snapshot.lastUpdated ? new Date(snapshot.lastUpdated).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : 'Awaiting live update';
  const activeProvider = activeMarker ? providers.find(provider => provider.id === activeMarker) : null;
  const activeProviderTarget = activeProvider ? providerLocationQuery(activeProvider) : null;

  const findNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapTarget({ name: 'Your current location', query: `${latitude},${longitude}` });
        setActiveMarker(null);
        setLocating(false);
      },
      () => {
        alert('Unable to retrieve your location. Please allow location access and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const submitComplaint = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setComplaintSubmitting(true);
    setComplaintError(null);
    try {
      const result = await publicPortalService.submitComplaint({
        category: complaintForm.category,
        complainantName: complaintForm.name,
        contactPhone: complaintForm.phone,
        contactEmail: complaintForm.email,
        lga: complaintForm.lga,
        providerId: complaintForm.providerId,
        description: complaintForm.description,
        incidentDate: complaintForm.incidentDate,
        preferredContactMethod: complaintForm.preferredContactMethod,
      });
      setComplaintResult(result.referenceNumber);
      setComplaintForm({ category: 'service-delivery', name: '', phone: '', email: '', lga: '', providerId: '', description: '', incidentDate: '', preferredContactMethod: 'Phone' });
    } catch (err: any) {
      setComplaintError(err.message);
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const checkComplaintStatus = async () => {
    if (!complaintStatusRef.trim() || !complaintStatusContact.trim()) {
      setComplaintStatusError('Enter both your reference number and the phone number or email used when you submitted the complaint.');
      return;
    }
    setComplaintStatusLoading(true);
    setComplaintStatusError(null);
    try {
      const thread = await publicPortalService.getComplaintThread(complaintStatusRef, complaintStatusContact);
      setComplaintThread(thread);
      setComplaintStatusResult(thread.complaint);
    } catch (err: any) {
      setComplaintThread(null);
      setComplaintStatusResult(null);
      setComplaintStatusError(err.message || 'We could not verify this complaint.');
    } finally {
      setComplaintStatusLoading(false);
    }
  };

  const sendComplaintReply = async () => {
    if (!complaintReply.trim() || !complaintStatusRef.trim() || !complaintStatusContact.trim()) return;
    setComplaintReplyLoading(true);
    setComplaintStatusError(null);
    try {
      await publicPortalService.sendComplaintReply(complaintStatusRef, complaintStatusContact, complaintReply.trim());
      const refreshed = await publicPortalService.getComplaintThread(complaintStatusRef, complaintStatusContact);
      setComplaintThread(refreshed);
      setComplaintStatusResult(refreshed.complaint);
      setComplaintReply('');
    } catch (err: any) {
      setComplaintStatusError(err.message || 'We could not send your reply.');
    } finally {
      setComplaintReplyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background font-sans text-brand-foreground antialiased selection:bg-brand-blue/10 selection:text-brand-blue">
      <header className="public-header sticky top-0 z-50 w-full border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <img src="/assets/odchc-seal.png" alt="ODCHC seal" className="h-10 w-10 sm:h-12 sm:w-12" />
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-white sm:text-xl">ODCHC</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">Public Health Portal</span>
            </div>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            {['Network', 'Services', 'Complaints', 'Transparency', 'About'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-xs font-bold uppercase tracking-widest text-white/70 transition hover:text-white">
                {item}
              </a>
            ))}
            <Link to="/login" className="rounded-full bg-brand-blue px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-brand-hover hover:shadow-lg hover:shadow-brand-blue/20">
              Login to NMIS
            </Link>
          </nav>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg p-2 text-white/70 hover:bg-white/5 hover:text-white md:hidden">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-white/5 bg-brand-navy p-4 md:hidden">
            <div className="flex flex-col gap-4">
              {['Network', 'Services', 'Complaints', 'Transparency', 'About'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-white/70">
                  {item}
                </a>
              ))}
              <Link to="/login" className="rounded-xl bg-brand-blue py-3 text-center text-sm font-bold text-white">Login to NMIS</Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="public-hero relative flex min-h-[90vh] flex-col justify-center overflow-hidden">
          <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="flex flex-col justify-center">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> NMIS Operational
                </div>
                <p className="mt-8 text-sm font-bold uppercase tracking-[0.3em] text-amber-200/80">Ondo State Contributory Health Commission</p>
                <h1 className="mt-4 text-5xl font-black leading-[1.1] text-white sm:text-6xl lg:text-7xl">
                  ODCHC NMIS<br />
                  <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">Transparent data.</span><br />
                  <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Better healthcare.</span>
                </h1>
                <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/60">
                  The official public information and engagement portal for provider access, enrollee support, and health insurance education across Ondo State.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <a href="#complaints" className="flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-4 font-bold text-brand-navy transition hover:bg-emerald-400 hover:shadow-xl hover:shadow-emerald-500/20">
                    Report a Complaint <ArrowRight size={18} />
                  </a>
                  <a href="#network" className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 font-bold text-white backdrop-blur-sm transition hover:bg-white/10">
                    Find a Provider <MapPin size={18} />
                  </a>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <div className="public-glass grid grid-cols-2 gap-4 rounded-[2.5rem] p-4 sm:p-6">
                  <KpiCard label="Registered Enrollees" value={snapshot.kpis.registeredEnrollees.toLocaleString()} icon={<Users size={20} />} />
                  <KpiCard label="Accredited Providers" value={snapshot.kpis.accreditedProviders.toString()} icon={<Building2 size={20} />} />
                  <KpiCard label="LGAs Covered" value={snapshot.kpis.lgasCovered.toString()} icon={<MapPin size={20} />} />
                  <div className="col-span-2 mt-2 rounded-2xl bg-white/5 p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <img src="/assets/odchc-seal.png" alt="ODCHC" className="h-10 w-10 opacity-80" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Current Reporting Period</p>
                        <p className="mt-1 font-bold text-white">{snapshot.kpis.populationPeriodLabel || 'August 2026'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-widest text-white/30">Live data update: {updatedAt}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="network" className="public-section mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
          <SectionIntro eyebrow="Our Network" title="Find a healthcare provider" description="Search the authoritative public provider directory by facility name, location, and category. Only approved public-safe fields are shown." />
          
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
            <div className="public-map-container public-live-map-shell z-0 overflow-hidden">
              <div className="public-live-map-toolbar">
                <div className="min-w-0">
                  <p className="public-live-map-kicker">Live Google map</p>
                  <p className="public-live-map-title truncate">{mapTarget.name}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapTarget.query)}`}
                  target="_self"
                  rel="noopener noreferrer"
                  className="public-live-map-direction"
                >
                  <Navigation size={14} /> Directions
                </a>
              </div>

              <iframe
                key={mapTarget.query}
                title={`Live map showing ${mapTarget.name}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(mapTarget.query)}&output=embed&z=13`}
                className="public-live-map-frame"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              <div className="public-live-map-caption">
                <MapPin size={13} /> Live map view · Select a facility to focus the map
              </div>

              {activeMarker && (
                <div className="public-live-map-popup">
                  <button onClick={() => setActiveMarker(null)} className="absolute right-3 top-3 text-brand-muted hover:text-brand-navy" aria-label="Close map details">
                    <X size={16} />
                  </button>
                  {activeMarker === 'odchc' ? (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Commission office</p>
                      <h4 className="mt-1 font-bold text-brand-navy">{odchcOffice.name}</h4>
                      <p className="mt-1 text-xs text-brand-muted">{odchcOffice.address}</p>
                      <a
                        href={odchcOffice.mapUrl}
                        target="_self"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2 text-xs font-bold text-brand-navy transition hover:bg-amber-400"
                      >
                        <Navigation size={14} /> Open directions
                      </a>
                    </div>
                  ) : activeProvider ? (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Accredited provider</p>
                      <h4 className="mt-1 font-bold text-brand-navy">{activeProvider.providerName}</h4>
                      <p className="mt-1 text-xs text-brand-muted">{activeProvider.lga} LGA · {activeProvider.ownership || 'Accredited'}</p>
                      {activeProvider.address ? <p className="mt-2 text-xs leading-relaxed text-brand-muted">{activeProvider.address}</p> : null}
                      <div className="mt-3 flex flex-col gap-2">
                        <button
                          onClick={() => activeProviderTarget && setMapTarget({ name: activeProvider.providerName, query: activeProviderTarget })}
                          disabled={!activeProviderTarget}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue py-2 text-xs font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <MapPin size={14} /> {activeProviderTarget ? 'Focus this facility' : 'Location pending verification'}
                        </button>
                        {activeProviderTarget ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeProviderTarget)}`}
                            target="_self"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-soft py-2 text-xs font-bold text-brand-navy transition hover:bg-brand-border"
                          >
                            <Navigation size={14} /> Navigate to Facility
                          </a>
                        ) : (
                          <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 py-2 text-xs font-bold text-slate-500">
                            <Navigation size={14} /> Navigation unavailable until verified
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="public-map-overlay">
                <button onClick={findNearMe} disabled={locating} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-brand-navy shadow-lg transition hover:bg-brand-soft">
                  <Navigation size={14} className={locating ? 'animate-pulse' : ''} />
                  {locating ? 'Locating...' : 'Use my location'}
                </button>
                <button
                  onClick={() => { setMapTarget({ name: odchcOffice.name, query: odchcOffice.address }); setActiveMarker('odchc'); }}
                  className="flex items-center gap-2 rounded-full bg-brand-navy px-4 py-2 text-[10px] font-bold text-white shadow-lg transition hover:bg-brand-blue"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> ODCHC Headquarters
                </button>
              </div>
            </div>

            <div>
              <div className="public-filter-panel grid gap-3 p-4">
                <label className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtle" size={17} />
                  <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Provider name, code, or location" className="nmis-control pl-10" />
                </label>
                <select className="nmis-control" value={lga} onChange={event => setLga(event.target.value)}>
                  <option value="">All LGAs</option>
                  {lgaOptions.map(option => <option key={option}>{option}</option>)}
                </select>
                <select className="nmis-control" value={category} onChange={event => setCategory(event.target.value)}>
                  <option value="">All facility categories</option>
                  {Object.entries(categoryLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </div>

              <div className="mt-6 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                {providerError ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{providerError}</div>
                ) : providerLoading ? (
                  <div className="p-8 text-center text-sm text-brand-muted">Searching the directory...</div>
                ) : providers.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-brand-border bg-white p-8 text-center text-sm text-brand-muted">No matching providers found.</div>
                ) : (
                  <div className="grid gap-3">
                    {providers.map(provider => (
                      <ProviderCard
                        key={provider.id}
                        provider={provider}
                        onLocate={() => {
                          const el = document.getElementById('network');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                          setActiveMarker(provider.id);
                          const target = providerLocationQuery(provider);
                          if (target) setMapTarget({ name: provider.providerName, query: target });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="public-section bg-brand-soft/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro eyebrow="Member Services" title="Help for every step of your healthcare journey" description="Use NMIS to find care, understand your cover, connect with support, and raise a concern when service delivery falls short." />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <ServiceCard icon={<Users size={22} />} title="Enrollee support" text="Get guidance on registration, provider selection, and accessing care." />
              <ServiceCard icon={<MapPin size={22} />} title="Find your provider" text="Discover accredited facilities near your LGA and understand their service profile." />
              <ServiceCard icon={<FileText size={22} />} title="Understand your cover" text="Read clear explanations of benefits, capitation, referrals, and care access." />
              <ServiceCard icon={<Heart size={22} />} title="Your voice matters" text="Report a problem and receive a reference you can use to track progress." />
            </div>
          </div>
        </section>

        <section id="complaints" className="public-section mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-[1fr_400px]">
            <div>
              <SectionIntro eyebrow="Citizen Support" title="Report a complaint" description="Experiencing a problem with a healthcare provider, enrolment, authorization, claims, or service delivery? Tell the Commission what happened." />
              {complaintResult ? (
                <div className="mt-10 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="mt-6 text-2xl font-black text-brand-navy">Complaint Submitted</h3>
                  <p className="mt-2 text-brand-muted">Your reference number is:</p>
                  <div className="mt-4 inline-block rounded-xl bg-white px-6 py-3 text-xl font-black tracking-wider text-brand-blue shadow-sm ring-1 ring-emerald-100">
                    {complaintResult}
                  </div>
                  <p className="mt-6 text-sm text-brand-muted">Please save this number to track your complaint status.</p>
                  <button onClick={() => setComplaintResult(null)} className="mt-8 font-bold text-brand-blue hover:underline">Submit another complaint</button>
                </div>
              ) : (
                <form onSubmit={submitComplaint} className="mt-10 grid gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <select className="nmis-control" value={complaintForm.category} onChange={e => setComplaintForm({ ...complaintForm, category: e.target.value })}>
                      <option value="service-delivery">Service delivery</option>
                      <option value="enrolment">Enrolment</option>
                      <option value="provider-experience">Provider experience</option>
                      <option value="claims">Claims or authorization</option>
                      <option value="other">Other</option>
                    </select>
                    <input className="nmis-control" placeholder="LGA" value={complaintForm.lga} onChange={e => setComplaintForm({ ...complaintForm, lga: e.target.value })} />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <input className="nmis-control" placeholder="Name (optional)" value={complaintForm.name} onChange={e => setComplaintForm({ ...complaintForm, name: e.target.value })} />
                    <input className="nmis-control" placeholder="Phone number" value={complaintForm.phone} onChange={e => setComplaintForm({ ...complaintForm, phone: e.target.value })} />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <input className="nmis-control" type="email" placeholder="Email address" value={complaintForm.email} onChange={e => setComplaintForm({ ...complaintForm, email: e.target.value })} />
                    <input className="nmis-control" type="date" value={complaintForm.incidentDate} onChange={e => setComplaintForm({ ...complaintForm, incidentDate: e.target.value })} />
                  </div>
                  <textarea className="nmis-control min-h-32" placeholder="Describe what happened (at least 10 characters)" value={complaintForm.description} onChange={e => setComplaintForm({ ...complaintForm, description: e.target.value })} required minLength={10} />
                  <button type="submit" disabled={complaintSubmitting} className="flex items-center justify-center gap-2 rounded-xl bg-brand-navy py-4 font-bold text-white transition hover:bg-brand-blue disabled:opacity-50">
                    {complaintSubmitting ? 'Submitting...' : 'Submit Complaint'} <ArrowRight size={18} />
                  </button>
                  {complaintError && <p className="text-sm font-medium text-red-600">{complaintError}</p>}
                </form>
              )}
            </div>

            <div className="flex flex-col justify-start pt-12 lg:pt-0">
              <div className="public-complaint-tracker p-7 text-white sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200">Contact support</p>
                <h3 className="mt-3 text-2xl font-black">Chat with ODCHC Support.</h3>
                <p className="mt-4 text-sm leading-relaxed text-white/60">Enter your reference number and the phone number or email used when you reported the case. Open the secure conversation to read every update and reply to the Commission.</p>
                <div className="mt-8 space-y-4">
                  <input className="public-complaint-input w-full rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40" placeholder="ODCHC-2026-XXXXX" value={complaintStatusRef} onChange={e => setComplaintStatusRef(e.target.value)} />
                  <input className="public-complaint-input w-full rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/40" placeholder="Your phone or email" value={complaintStatusContact} onChange={e => setComplaintStatusContact(e.target.value)} />
                  <button onClick={checkComplaintStatus} disabled={complaintStatusLoading} className="public-complaint-button flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition">
                    {complaintStatusLoading ? 'Checking...' : 'Open Conversation'} <Search size={16} />
                  </button>
                </div>
                {complaintStatusError && <p className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm font-medium text-red-100">{complaintStatusError}</p>}
                {complaintStatusResult && complaintThread && (
                  <div className="mt-6 space-y-4">
                    <div className="public-complaint-result rounded-xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Current status</span>
                        <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400">{complaintStatusResult.status}</span>
                      </div>
                      <p className="mt-2 text-sm font-bold">{complaintStatusResult.category}</p>
                      {complaintStatusResult.providerName && <p className="mt-1 text-xs text-white/60">Provider: {complaintStatusResult.providerName}</p>}
                      <p className="mt-1 text-[10px] text-white/40">Submitted: {new Date(complaintStatusResult.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <PublicComplaintConversation thread={complaintThread} />
                    {['resolved', 'closed'].includes(complaintStatusResult.status.toLowerCase()) ? (
                      <p className="rounded-xl bg-emerald-400/15 p-3 text-sm text-emerald-100">This complaint is closed for new replies. If you need further assistance, submit a new complaint or contact the Commission.</p>
                    ) : (
                      <div className="rounded-xl bg-white/10 p-3">
                        <textarea
                          className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none"
                          rows={3}
                          aria-label="Message ODCHC Support"
                          placeholder="Type your message to ODCHC Support..."
                          value={complaintReply}
                          onChange={e => setComplaintReply(e.target.value)}
                        />
                        <button onClick={sendComplaintReply} disabled={complaintReplyLoading || !complaintReply.trim()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 py-3 text-sm font-black text-brand-navy transition hover:bg-amber-200 disabled:opacity-50">
                          {complaintReplyLoading ? 'Sending...' : 'Send to Support'} <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="transparency" className="public-section bg-brand-soft/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro eyebrow="Transparency" title="Open, aggregated, privacy-safe intelligence" description="NMIS shares public-safe network information without exposing names, phone numbers, policy numbers, or individual financial records." />
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <div className="public-data-panel p-6 sm:p-8">
                <div className="public-data-header flex items-center justify-between pb-5">
                  <div>
                    <p className="public-data-kicker">Population distribution</p>
                    <h3 className="mt-1 text-xl font-extrabold text-brand-navy">Enrollees by LGA</h3>
                  </div>
                  <span className="public-data-badge">Valid records only</span>
                </div>
                <div className="mt-6 space-y-5">
                  {snapshot.transparency.byLga.slice(0, 8).map(item => (
                    <div key={item.name} className="public-lga-row group">
                      <div className="flex items-center justify-between gap-3 text-sm font-bold text-brand-navy">
                        <span className="truncate">{item.name}</span>
                        <span className="public-lga-value">{item.value.toLocaleString()}</span>
                      </div>
                      <div className="public-bar-track mt-3">
                        <div className="public-bar-fill" style={{ width: `${Math.min(100, (item.value / (snapshot.transparency.byLga[0]?.value || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="public-data-panel p-6 sm:p-8">
                <div className="public-data-header pb-5">
                  <p className="public-data-kicker">Accredited network</p>
                  <h3 className="mt-1 text-xl font-extrabold text-brand-navy">Provider distribution</h3>
                </div>
                <div className="mt-6 space-y-4">
                  {snapshot.transparency.byCategory.map(item => (
                    <div key={item.name} className="public-category-row">
                      <div className="public-category-icon"><Building2 size={16} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-bold text-brand-navy">{humanizeCategory(item.name)}</span>
                          <span className="public-category-value">{item.value}</span>
                        </div>
                        <div className="public-bar-track mt-2">
                          <div className="public-category-fill" style={{ width: `${Math.min(100, (item.value / (snapshot.transparency.byCategory[0]?.value || 1)) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="public-section mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <SectionIntro eyebrow="Latest Updates" title="News and announcements" description="Follow important Commission programmes, awareness campaigns, and network updates." />
              <div className="mt-10 space-y-4">
                {newsItems.map(([title, text]) => (
                  <article key={title} className="public-content-card flex items-start gap-5 p-6 transition-all hover:border-brand-blue/30">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-blue">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-navy">{title}</h4>
                      <p className="mt-1 text-sm text-brand-muted">{text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div>
              <SectionIntro eyebrow="Health Insurance Education" title="Understand your cover" description="Clear, practical answers for members and communities." />
              <div className="mt-10 space-y-4">
                {educationItems.map(([title, text]) => (
                  <article key={title} className="public-content-card p-6 transition-all hover:border-brand-blue/30">
                    <h4 className="font-bold text-brand-navy">{title}</h4>
                    <p className="mt-2 text-sm text-brand-muted">{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 bg-brand-navy text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.7fr] lg:px-8">
            <div>
              <SectionIntro dark eyebrow="About ODCHC" title="A stronger health system through accountable care" description="The Ondo State Contributory Health Commission works to expand access to quality, affordable, and sustainable healthcare for residents of Ondo State." />
              <div className="mt-7 grid gap-4 sm:grid-cols-3">
                <DarkFact title="Vision" text="A healthy population with equitable access to care." />
                <DarkFact title="Mission" text="Protect households through coordinated health financing." />
                <DarkFact title="Commitment" text="Transparent service, responsible stewardship, and citizen voice." />
              </div>
            </div>
            <div className="public-glass rounded-[2rem] p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Need help?</p>
              <h3 className="mt-3 text-2xl font-black">Connect with the Commission</h3>
              <div className="mt-6 space-y-4 text-sm text-white/70">
                <a href="tel:+2348065484738" className="flex gap-3 transition hover:text-white"><Phone size={17} className="shrink-0 text-emerald-200" /> +234 806 5484 738 · 02017004601 · 02017004602</a>
                <a href="mailto:info@odchc.on.gov.ng" className="flex gap-3 transition hover:text-white"><Mail size={17} className="shrink-0 text-emerald-200" /> info@odchc.on.gov.ng</a>
                <div className="flex flex-col gap-3">
                  <p className="flex gap-3"><MapPin size={17} className="shrink-0 text-emerald-200" /> Ministry of Health Complex, Alagbaka, Akure, Ondo State</p>
                  <a
                    href={odchcOffice.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-7 flex w-fit items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-amber-200 transition hover:bg-white/20"
                  >
                    <Navigation size={12} /> Locate on Map
                  </a>
                </div>
                <p className="flex gap-3"><Clock size={17} className="shrink-0 text-emerald-200" /> Monday–Friday, 8:00 AM–4:00 PM</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-brand-border bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <img src="/assets/odchc-seal.png" alt="ODCHC seal" className="h-10 w-10" />
                <div>
                  <p className="font-extrabold tracking-tight text-brand-navy">Ondo State Contributory Health Commission</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Network Management Information System (NMIS)</p>
                </div>
              </div>
              <p className="mt-6 max-w-sm text-sm text-brand-muted">
                Official public information portal for healthcare network access, citizen engagement, and privacy-safe transparency.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-brand-navy">Quick Links</h4>
              <nav className="mt-6 flex flex-col gap-3">
                {['About', 'Providers', 'Enrolment', 'Complaints'].map(link => (
                  <a key={link} href={`#${link === 'Providers' ? 'network' : link === 'Enrolment' ? 'services' : link.toLowerCase()}`} className="text-sm font-bold text-brand-muted transition hover:text-brand-blue">
                    {link}
                  </a>
                ))}
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-brand-navy">Access</h4>
              <nav className="mt-6 flex flex-col gap-3">
                <Link to="/login" className="text-sm font-bold text-brand-muted transition hover:text-brand-blue">Secure login</Link>
              </nav>
            </div>
          </div>
          <div className="mt-16 flex flex-col items-center justify-between gap-6 border-t border-brand-border pt-8 text-[10px] font-bold uppercase tracking-widest text-brand-subtle sm:flex-row">
            <p>© 2026 Ondo State Contributory Health Commission. All rights reserved.</p>
            <p className="flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-500" /> Public data is aggregated and privacy-safe.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionIntro({ eyebrow, title, description, dark }: { eyebrow: string; title: string; description: string; dark?: boolean }) {
  return (
    <div className="max-w-3xl">
      <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? 'text-amber-200' : 'text-brand-blue'}`}>{eyebrow}</p>
      <h2 className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${dark ? 'text-white' : 'text-brand-navy'}`}>{title}</h2>
      <p className={`mt-4 text-lg leading-relaxed ${dark ? 'text-white/60' : 'text-brand-muted'}`}>{description}</p>
    </div>
  );
}

function KpiCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 backdrop-blur-sm transition hover:bg-white/10">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-200">
        {icon}
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function PublicComplaintConversation({ thread }: { thread: PublicComplaintThread }) {
  const entries = [
    ...thread.updates.map(update => ({ kind: 'update' as const, id: `update-${update.id}`, createdAt: update.createdAt, update })),
    ...thread.messages.map(message => ({ kind: 'message' as const, id: `message-${message.id}`, createdAt: message.createdAt, message })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-white">Chat with ODCHC Support</p>
          <p className="mt-1 text-[11px] text-white/50">Your messages and Commission replies stay in this conversation.</p>
        </div>
        <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-200">Secure thread</span>
      </div>

      <div className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-xl bg-black/15 p-3">
        {thread.complaint.description && (
          <div className="rounded-xl border border-amber-300/10 bg-amber-300/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200">Your original report</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">{thread.complaint.description}</p>
          </div>
        )}
        {entries.map(entry => entry.kind === 'update' ? (
          <div key={entry.id} className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
              <span>Commission update</span>
              <span>{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-1 text-xs font-semibold text-amber-200">{entry.update.statusFrom || 'Submitted'} → {entry.update.statusTo}</p>
            {entry.update.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">{entry.update.notes}</p>}
          </div>
        ) : (
          <div key={entry.id} className={`flex ${entry.message.senderType === 'complainant' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl p-3 ${entry.message.senderType === 'complainant' ? 'bg-amber-300 text-brand-navy' : 'bg-brand-blue/70 text-white'}`}>
              <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider opacity-70">
                <span>{entry.message.senderType === 'complainant' ? 'You' : entry.message.senderName || 'ODCHC Support'}</span>
                <span>{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{entry.message.message}</p>
            </div>
          </div>
        ))}
        {entries.length === 0 && <p className="rounded-xl bg-white/5 p-3 text-xs text-white/50">No updates yet. The Commission will reply here when the case is reviewed.</p>}
      </div>
    </div>
  );
}

function ProviderCard({ provider, onLocate }: { provider: PublicProvider; onLocate?: () => void }) {
  const locationQuery = providerLocationQuery(provider);
  const hasLocation = locationQuery !== null;
  const hasExactCoordinates = Number.isFinite(provider.latitude) && Number.isFinite(provider.longitude);
  return (
    <article className="public-provider-card group relative flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-blue ring-1 ring-blue-100">
          {humanizeCategory(provider.category)}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={hasLocation ? onLocate : undefined}
            disabled={!hasLocation}
            aria-label={hasLocation ? `Locate ${provider.providerName} on the map` : `Location unavailable for ${provider.providerName}`}
            className="rounded-full bg-brand-soft p-1 text-brand-blue transition hover:bg-brand-blue hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            title={hasLocation ? (hasExactCoordinates ? 'Locate exact facility pin on map' : 'Search this verified facility address on map') : 'Physical address pending verification'}
          >
            <MapPin size={12} />
          </button>
          <BadgeCheck size={16} className="shrink-0 text-emerald-500" />
        </div>
      </div>
      <h3 className="mt-3 text-sm font-extrabold leading-snug text-brand-navy group-hover:text-brand-blue transition-colors line-clamp-2">
        {provider.providerName}
      </h3>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-brand-muted">
        <span className="flex items-center gap-1"><MapPin size={10} /> {provider.lga}</span>
        {provider.address ? <span className="w-full truncate text-[10px] text-brand-subtle" title={provider.address}>{provider.address}</span> : <span className="w-full text-[10px] text-amber-600">Physical location pending verification</span>}
        <span className="h-1 w-1 rounded-full bg-brand-border" />
        <span className="flex items-center gap-1"><Building2 size={10} /> {provider.ownership || 'Accredited'}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-brand-border/50 pt-3">
        {provider.services.slice(0, 2).map(service => (
          <span key={service} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-700 ring-1 ring-emerald-100">
            {service.replace(' Services', '')}
          </span>
        ))}
        {provider.services.length > 2 && (
          <span className="text-[9px] font-medium text-brand-muted">+{provider.services.length - 2} more</span>
        )}
        {provider.services.length === 0 && (
          <span className="flex items-center gap-1 text-[9px] font-medium text-brand-subtle">
            <Info size={10} /> Verified facility
          </span>
        )}
      </div>
    </article>
  );
}

function ServiceCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="public-service-card flex flex-col p-8">
      <div className="public-icon-tile flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-blue">
        {icon}
      </div>
      <h4 className="mt-6 text-lg font-extrabold text-brand-navy">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-brand-muted">{text}</p>
      <a href="#" className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-blue transition hover:gap-3">
        Learn more <ChevronRight size={14} />
      </a>
    </article>
  );
}

function DarkFact({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200">{title}</p>
      <p className="mt-2 text-xs leading-relaxed text-white/60">{text}</p>
    </div>
  );
}
