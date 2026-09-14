import { useState } from 'react';
import { 
  Settings, Globe, Palette, Shield, Database, 
  Save, RotateCcw, CheckCircle2, AlertTriangle,
  Layout, Bell, Lock, Server
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { SectionHeader } from '../../components/ui/LayoutComponents';

export default function SystemConfigPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'branding' | 'security' | 'integrations'>('general');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('System configuration updated successfully.');
    }, 1500);
  };

  return (
    <main className="nmis-page">
      <PageHeader
        eyebrow="Administration"
        title="System Configuration"
        subtitle="Manage global application parameters, portal branding, and core infrastructure settings."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" className="gap-2"><RotateCcw size={16} /> Reset to Defaults</Button>
            <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Applying Changes...' : <><Save size={16} /> Save Configuration</>}
            </Button>
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Navigation Sidebar */}
        <aside className="space-y-2">
          {[
            { id: 'general', label: 'General Settings', icon: Globe },
            { id: 'branding', label: 'Portal Branding', icon: Palette },
            { id: 'security', label: 'Security & Access', icon: Shield },
            { id: 'integrations', label: 'External Services', icon: Server },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'text-brand-muted hover:bg-brand-soft hover:text-brand-foreground'}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Configuration Forms */}
        <div className="space-y-8 animate-in fade-in duration-300">
          {activeTab === 'general' && (
            <Card className="space-y-6">
              <SectionHeader title="Global Parameters" subtitle="Core identification and regional settings for the portal." />
              <div className="grid gap-6 md:grid-cols-2">
                <Input label="Portal Authority Name" defaultValue="Ondo State Contributory Health Commission" />
                <Input label="System Short Name" defaultValue="ODCHC NMIS" />
                <Input label="Primary Contact Email" defaultValue="info@odchc.on.gov.ng" />
                <Input label="Support Hotline" defaultValue="0700 0240 240" />
              </div>
              <div className="space-y-4 pt-4 border-t border-brand-divider">
                <label className="text-xs font-black uppercase tracking-widest text-brand-muted">System Operational Mode</label>
                <div className="grid gap-4 sm:grid-cols-3">
                  {['Production', 'Maintenance', 'Staging'].map(mode => (
                    <button key={mode} className={`rounded-2xl border-2 p-4 text-center transition-all ${mode === 'Production' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-brand-divider hover:border-brand-subtle'}`}>
                      <p className="font-black text-sm">{mode}</p>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'branding' && (
            <Card className="space-y-6">
              <SectionHeader title="Visual Identity" subtitle="Configure the portal's high-contrast professional branding." />
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Primary Brand Color</label>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#0b3d91] shadow-inner" />
                    <Input defaultValue="#0b3d91" className="font-mono" />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Accent Color</label>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#f7931e] shadow-inner" />
                    <Input defaultValue="#f7931e" className="font-mono" />
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-brand-divider">
                <label className="text-xs font-black uppercase tracking-widest text-brand-muted">Official Logos</label>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border-2 border-dashed border-brand-divider p-8 text-center hover:border-brand-blue transition-colors group cursor-pointer">
                    <Layout className="mx-auto mb-2 text-brand-muted group-hover:text-brand-blue" />
                    <p className="text-xs font-bold text-brand-muted">Upload Header Logo</p>
                  </div>
                  <div className="rounded-2xl border-2 border-dashed border-brand-divider p-8 text-center hover:border-brand-blue transition-colors group cursor-pointer">
                    <Layout className="mx-auto mb-2 text-brand-muted group-hover:text-brand-blue" />
                    <p className="text-xs font-bold text-brand-muted">Upload Favicon</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="space-y-6">
              <SectionHeader title="Security Governance" subtitle="Manage authentication protocols and access control policies." />
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-soft border border-brand-divider">
                  <div>
                    <p className="font-bold text-brand-foreground">Multi-Factor Authentication (MFA)</p>
                    <p className="text-xs text-brand-muted">Require second-step verification for all Super Admins.</p>
                  </div>
                  <div className="h-6 w-12 rounded-full bg-brand-blue relative cursor-pointer">
                    <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-soft border border-brand-divider">
                  <div>
                    <p className="font-bold text-brand-foreground">Session Timeout</p>
                    <p className="text-xs text-brand-muted">Automatically log out inactive users after 30 minutes.</p>
                  </div>
                  <div className="h-6 w-12 rounded-full bg-brand-blue relative cursor-pointer">
                    <div className="absolute right-1 top-1 h-4 w-4 rounded-full bg-white" />
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-brand-divider">
                <label className="text-xs font-black uppercase tracking-widest text-brand-muted">IP Whitelisting</label>
                <textarea className="nmis-control mt-2 min-h-[100px] font-mono text-xs" placeholder="Enter authorized IP addresses (one per line)..." />
              </div>
            </Card>
          )}

          {activeTab === 'integrations' && (
            <Card className="space-y-6">
              <SectionHeader title="External Services" subtitle="Configure connections to SMS gateways, Email servers, and GIS providers." />
              <div className="space-y-4">
                {[
                  { name: 'SMS Gateway (Infobip)', status: 'Connected', icon: <Bell size={18} /> },
                  { name: 'Email Server (SMTP)', status: 'Connected', icon: <Globe size={18} /> },
                  { name: 'Google Maps API', status: 'Active', icon: <Globe size={18} /> },
                  { name: 'Supabase Database', status: 'Operational', icon: <Database size={18} /> },
                ].map(service => (
                  <div key={service.name} className="flex items-center justify-between p-4 rounded-2xl border border-brand-divider hover:border-brand-blue/30 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-xl bg-brand-soft text-brand-blue">{service.icon}</div>
                      <div>
                        <p className="font-bold text-brand-foreground">{service.name}</p>
                        <p className="text-[10px] font-black uppercase text-status-success">{service.status}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">Configure</Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
