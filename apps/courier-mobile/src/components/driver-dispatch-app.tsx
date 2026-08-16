'use client';

import {
  AlertTriangle,
  Aperture,
  ArrowLeft,
  Bell,
  Bike,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  Globe2,
  Headphones,
  Home,
  Info,
  Layers3,
  LockKeyhole,
  LogOut,
  MapPin,
  MessageCircle,
  Moon,
  Navigation,
  Package,
  Phone,
  ScanLine,
  Settings,
  Shield,
  Smartphone,
  Star,
  TrendingUp,
  User,
  UserRoundX,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState, type ReactNode } from 'react';

type Screen =
  | 'splash'
  | 'register'
  | 'otpVerify'
  | 'profilePhoto'
  | 'connectKitchen'
  | 'waitingApproval'
  | 'home'
  | 'available'
  | 'assigned'
  | 'batchDetail'
  | 'route'
  | 'stopDetail'
  | 'cashCollection'
  | 'otpConfirm'
  | 'history'
  | 'support'
  | 'profile'
  | 'settings';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'muted';

const orders = [
  { id: 'YP-1021', pizzas: 2, district: '1030 Wien', address: 'Landstraße, 1030 Wien', distance: 2.4, eta: 16, payment: 'paid', otp: '4821', note: 'Ring bell 12' },
  { id: 'YP-1022', pizzas: 1, district: '1040 Wien', address: 'Favoritenstraße, 1040 Wien', distance: 3.1, eta: 19, payment: 'cash', cash: 22.4, otp: '7391', note: 'Leave at door' },
  { id: 'YP-1025', pizzas: 3, district: '1050 Wien', address: 'Reinprechtsdorfer Str., 1050 Wien', distance: 4.2, eta: 24, payment: 'paid', otp: '6154', note: undefined },
] as const;

const deliveries = [
  { id: 'YP-1014', date: 'Today 14:30', km: 2.1, pizzas: 2, payment: 'Paid', rating: 5, earned: 5.7 },
  { id: 'YP-1013', date: 'Today 13:05', km: 3.4, pizzas: 1, payment: 'Cash €18.50', rating: 4, earned: 4.8 },
  { id: 'YP-1009', date: 'Today 11:40', km: 1.8, pizzas: 3, payment: 'Paid', rating: 5, earned: 5.9 },
  { id: 'YP-1001', date: 'Yesterday 19:22', km: 4.2, pizzas: 2, payment: 'Paid', rating: 5, earned: 8.4 },
];

function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return <Tag className={`glass-card ${className}`} onClick={onClick}>{children}</Tag>;
}

function Pill({ children, tone = 'muted' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function AppButton({
  children,
  onClick,
  secondary = false,
  danger = false,
  disabled = false,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      className={`app-button ${secondary ? 'button-secondary' : ''} ${danger ? 'button-danger' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function TopBar({ title, subtitle, back }: { title: string; subtitle?: string; back: () => void }) {
  return (
    <header className="top-bar">
      <button className="icon-button" onClick={back} aria-label="Go back"><ArrowLeft size={21} /></button>
      <div><strong>{title}</strong>{subtitle ? <span>{subtitle}</span> : null}</div>
      <span className="top-spacer" />
    </header>
  );
}

function Metric({ icon: Icon, value, unit, label, tone = 'accent' }: { icon: LucideIcon; value: string; unit: string; label: string; tone?: Tone }) {
  return (
    <Card className="metric-card">
      <Icon size={17} className={`text-${tone}`} />
      <strong>{value}</strong>
      <span>{unit}</span>
      <small>{label}</small>
    </Card>
  );
}

function Detail({ icon: Icon, children, tone = 'muted' }: { icon: LucideIcon; children: ReactNode; tone?: Tone }) {
  return <span className={`detail text-${tone}`}><Icon size={14} />{children}</span>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button className={`switch ${checked ? 'switch-on' : ''}`} onClick={() => onChange(!checked)} aria-label={label} aria-pressed={checked}>
      <span />
    </button>
  );
}

function BottomNav({ current, go }: { current: Screen; go: (screen: Screen) => void }) {
  const items: { screen: Screen; label: string; icon: LucideIcon }[] = [
    { screen: 'home', label: 'Home', icon: Home },
    { screen: 'available', label: 'Deliveries', icon: Package },
    { screen: 'history', label: 'History', icon: Clock3 },
    { screen: 'profile', label: 'Profile', icon: User },
  ];
  const active = current === 'assigned' || current === 'batchDetail' ? 'available' : current === 'settings' ? 'profile' : current;
  return (
    <nav className="bottom-nav">
      {items.map(({ screen, label, icon: Icon }) => (
        <button key={screen} className={active === screen ? 'active' : ''} onClick={() => go(screen)}>
          <Icon size={21} /><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function Ambient() {
  return <div className="ambient" aria-hidden="true"><span /><span /><span /></div>;
}

export default function DriverDispatchApp() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme !== 'light';
  const setDark = (value: boolean) => setTheme(value ? 'dark' : 'light');
  const [screen, setScreen] = useState<Screen>('splash');
  const [, setStack] = useState<Screen[]>([]);
  const [online, setOnline] = useState(true);
  const [photo, setPhoto] = useState(false);
  const [kitchenFound, setKitchenFound] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [pickedUp, setPickedUp] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [cashCollected, setCashCollected] = useState(false);
  const [stopIndex, setStopIndex] = useState(0);
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(true);
  const [language, setLanguage] = useState<'en' | 'de'>('en');

  const go = (next: Screen) => {
    setStack((items) => [...items, screen]);
    setScreen(next);
  };
  const back = () => {
    setStack((items) => {
      const next = [...items];
      setScreen(next.pop() ?? 'home');
      return next;
    });
  };
  const resetTo = (next: Screen) => {
    setStack([]);
    setScreen(next);
  };

  useEffect(() => {
    if (screen !== 'splash') return;
    const timer = window.setTimeout(() => go('register'), 2600);
    return () => window.clearTimeout(timer);
    // The splash transition intentionally only depends on the current screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const shared = { go, back, resetTo };
  const screenNode = (() => {
    switch (screen) {
      case 'splash': return <Splash onContinue={() => go('register')} />;
      case 'register': return <Register go={go} />;
      case 'otpVerify': return <PhoneOtp go={go} back={back} />;
      case 'profilePhoto': return <ProfilePhoto photo={photo} setPhoto={setPhoto} go={go} back={back} />;
      case 'connectKitchen': return <ConnectKitchen found={kitchenFound} setFound={setKitchenFound} scanning={scanning} setScanning={setScanning} go={go} back={back} />;
      case 'waitingApproval': return <WaitingApproval go={go} />;
      case 'home': return <HomeScreen online={online} setOnline={setOnline} {...shared} />;
      case 'available': return <AvailableScreen {...shared} />;
      case 'assigned': return <AssignedScreen stopIndex={stopIndex} {...shared} />;
      case 'batchDetail': return <BatchScreen {...shared} />;
      case 'route': return <RouteScreen pickedUp={pickedUp} setPickedUp={setPickedUp} stopIndex={stopIndex} {...shared} />;
      case 'stopDetail': return <StopScreen stopIndex={stopIndex} arrived={arrived} setArrived={setArrived} cashCollected={cashCollected} {...shared} />;
      case 'cashCollection': return <CashScreen setCashCollected={setCashCollected} {...shared} />;
      case 'otpConfirm': return <DeliveryOtp stopIndex={stopIndex} setStopIndex={setStopIndex} setArrived={setArrived} {...shared} />;
      case 'history': return <HistoryScreen {...shared} />;
      case 'support': return <SupportScreen {...shared} />;
      case 'profile': return <ProfileScreen {...shared} />;
      case 'settings': return <SettingsScreen dark={dark} setDark={setDark} notifications={notifications} setNotifications={setNotifications} location={location} setLocation={setLocation} language={language} setLanguage={setLanguage} {...shared} />;
    }
  })();

  return (
    <main className="dispatch-stage">
      <section className="phone-shell">
        <Ambient />
        {screenNode}
      </section>
    </main>
  );
}

function Splash({ onContinue }: { onContinue: () => void }) {
  return (
    <button className="splash-screen" onClick={onContinue}>
      <div className="splash-logo">
        <i />
        <strong>YES</strong>
        <strong>PIZ</strong>
        <span>DRIVER</span>
      </div>
      <div className="splash-meta">
        <i />
        <span>Partner Kitchen Delivery</span>
        <small>v1.0</small>
      </div>
      <div className="flex gap-2" aria-hidden="true">
        <span className="size-2 rounded-full bg-[var(--accent)]" />
        <span className="size-2 rounded-full bg-[var(--border)]" />
        <span className="size-2 rounded-full bg-[var(--border)]" />
      </div>
    </button>
  );
}

function Register({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="screen scroll-screen onboarding">
      <div className="brand-mini">YESPIZ <span>DRIVER</span></div>
      <h1>Create Driver Account</h1>
      <p>Your driver profile belongs to YesPiz. Connect it to a partner kitchen after registration.</p>
      <div className="form-stack">
        <label>First Name<input defaultValue="Ali" /></label>
        <label>Last Name<input defaultValue="Rezaei" /></label>
        <label>Phone Number<input defaultValue="+43 660 1234567" inputMode="tel" /></label>
      </div>
      <AppButton onClick={() => go('otpVerify')}>Continue</AppButton>
      <p className="secure-note"><Shield size={15} /> Your data is securely stored by YesPiz</p>
    </div>
  );
}

function PhoneOtp({ go, back }: { go: (s: Screen) => void; back: () => void }) {
  const [code, setCode] = useState('');
  return (
    <div className="screen centered-screen">
      <button className="text-back" onClick={back}><ArrowLeft size={17} /> Back</button>
      <div className="center-content">
        <div className="hero-icon"><Smartphone size={40} /></div>
        <h1>Verify Phone Number</h1>
        <p>We sent a 4-digit code to<br /><strong>+43 660 1234567</strong></p>
        <Pill tone="accent">Mock OTP: 1234</Pill>
        <OtpBoxes code={code} setCode={setCode} />
        <AppButton disabled={code.length < 4} onClick={() => go('profilePhoto')}>Verify</AppButton>
        <p>Didn&apos;t receive a code? <b className="text-accent">Resend</b></p>
      </div>
    </div>
  );
}

function OtpBoxes({ code, setCode }: { code: string; setCode: (v: string) => void }) {
  return (
    <div className="otp-wrap">
      <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" aria-label="Four digit code" />
      {[0, 1, 2, 3].map((i) => <span key={i} className={code[i] ? 'filled' : ''}>{code[i]}</span>)}
    </div>
  );
}

function ProfilePhoto({ photo, setPhoto, go, back }: { photo: boolean; setPhoto: (v: boolean) => void; go: (s: Screen) => void; back: () => void }) {
  return (
    <div className="screen onboarding">
      <button className="text-back" onClick={back}><ArrowLeft size={17} /> Back</button>
      <h1>Add Profile Photo</h1>
      <p>Your kitchen manager will see this photo before approving your profile.</p>
      <button className={`photo-picker ${photo ? 'has-photo' : ''}`} onClick={() => setPhoto(true)}>
        {photo ? <strong>AR</strong> : <User size={52} />}
        <i><Camera size={16} /></i>
      </button>
      {photo ? <p className="success-note"><CheckCircle2 size={16} /> Photo added</p> : null}
      <AppButton secondary onClick={() => setPhoto(true)}>{photo ? 'Change Photo' : 'Upload Photo'}</AppButton>
      <Card className="info-card"><Info size={16} /><p>For this visual demo, a placeholder avatar is used.</p></Card>
      <div className="push-bottom"><AppButton onClick={() => go('connectKitchen')}>Continue</AppButton></div>
    </div>
  );
}

function ConnectKitchen({ found, setFound, scanning, setScanning, go, back }: { found: boolean; setFound: (v: boolean) => void; scanning: boolean; setScanning: (v: boolean) => void; go: (s: Screen) => void; back: () => void }) {
  const [tab, setTab] = useState<'qr' | 'code'>('qr');
  const scan = () => {
    setScanning(true);
    window.setTimeout(() => { setScanning(false); setFound(true); }, 900);
  };
  return (
    <div className="screen scroll-screen onboarding">
      <button className="text-back" onClick={back}><ArrowLeft size={17} /> Back</button>
      <Pill>Unassigned</Pill>
      <h1>Connect to Partner Kitchen</h1>
      <p>You need approval from the kitchen manager before receiving deliveries.</p>
      <div className="segments">
        <button className={tab === 'qr' ? 'active' : ''} onClick={() => setTab('qr')}><Aperture size={16} />Scan QR</button>
        <button className={tab === 'code' ? 'active' : ''} onClick={() => setTab('code')}># Enter Code</button>
      </div>
      {tab === 'qr' ? (
        <>
          <button className="qr-box" onClick={scan}>
            <i /><i /><i /><i />
            {scanning ? <><span className="spinner" /><b>Scanning...</b></> : found ? <><CheckCircle2 size={38} className="text-success" /><b>Kitchen QR detected</b></> : <><ScanLine size={48} /><span>Tap to Scan QR Code</span></>}
          </button>
          {!found ? <AppButton onClick={scan}>Scan QR Code</AppButton> : null}
        </>
      ) : (
        <div className="form-stack">
          <label>Kitchen Code<input placeholder="YP-KITCHEN-1030" defaultValue="YP-KITCHEN-1030" /></label>
          <AppButton secondary onClick={() => setFound(true)}>Find Kitchen</AppButton>
        </div>
      )}
      {found ? <KitchenCard /> : null}
      <AppButton disabled={!found} onClick={() => go('waitingApproval')}>Send Join Request</AppButton>
    </div>
  );
}

function KitchenCard() {
  return (
    <Card className="kitchen-card">
      <div className="round-icon"><Home size={20} /></div>
      <div><small className="text-success">Kitchen Found</small><strong>Partner Kitchen Vienna 1030</strong><span>K-1030-001</span></div>
      <CheckCircle2 size={20} className="text-success" />
    </Card>
  );
}

function WaitingApproval({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="screen approval-screen">
      <div className="pulse-icon"><Clock3 size={32} /></div>
      <h1>Waiting for Approval</h1>
      <p>Your join request was sent to the kitchen manager. You&apos;ll be notified once approved.</p>
      <KitchenCard />
      <Card className="steps-card">
        <Step n={1} label="Request sent" done />
        <Step n={2} label="Awaiting kitchen manager review" active />
        <Step n={3} label="Approval & activation" />
      </Card>
      <Pill tone="info"><Info size={13} /> Average approval time: 5–15 minutes</Pill>
      <div className="push-bottom button-stack">
        <AppButton onClick={() => go('home')}>Simulate Approval</AppButton>
        <AppButton secondary onClick={() => go('connectKitchen')}>Cancel Request</AppButton>
      </div>
    </div>
  );
}

function Step({ n, label, done, active }: { n: number; label: string; done?: boolean; active?: boolean }) {
  return <div className={`step ${done ? 'done' : ''} ${active ? 'active' : ''}`}><i>{done ? <Check size={13} /> : n}</i><span>{label}</span></div>;
}

function HomeScreen({ online, setOnline, go }: { online: boolean; setOnline: (v: boolean) => void; go: (s: Screen) => void }) {
  return (
    <div className="screen screen-with-nav scroll-screen">
      <div className="home-head">
        <div><div className="brand-mini">YESPIZ <span>DRIVER</span></div><small><Home size={11} /> Partner Kitchen Vienna 1030</small></div>
        <button className="avatar" onClick={() => go('profile')}>AR</button>
      </div>
      <div className={`status-card ${online ? 'online' : ''}`}>
        <i /><div><strong>{online ? 'Online' : 'Offline'}</strong><span>{online ? 'You can receive deliveries' : 'Go online to receive deliveries'}</span></div>
        <Toggle checked={online} onChange={setOnline} label="Online status" />
      </div>
      <div className="warning-banner"><AlertTriangle size={14} /> Park safely before updating delivery status</div>
      {online ? (
        <>
          <div className="metric-grid">
            <Metric icon={Package} value="3" unit="deliveries" label="Today" />
            <Metric icon={Layers3} value="3" unit="orders" label="Active Batch" tone="info" />
            <Metric icon={CircleDollarSign} value="€19" unit="collected" label="Cash" tone="success" />
            <Metric icon={Clock3} value="20" unit="min" label="Avg ETA" tone="warning" />
          </div>
          <button className="batch-alert" onClick={() => go('batchDetail')}><i /><span><b>Batch #B-204 — Ready</b><small>3 orders · 5.8 km</small></span><ChevronRight size={19} /></button>
        </>
      ) : null}
      <h2>Quick Access</h2>
      <div className="action-grid">
        <Action icon={Package} label="Available" sub="3 orders ready" tone="accent" onClick={() => go('available')} />
        <Action icon={Layers3} label="Assigned" sub="Batch active" tone="info" onClick={() => go('assigned')} />
        <Action icon={Clock3} label="History" sub="3 today" tone="success" onClick={() => go('history')} />
        <Action icon={Headphones} label="Support" sub="Get help" tone="warning" onClick={() => go('support')} />
      </div>
      <Card className="driver-card"><span className="avatar">AR</span><div><strong>Ali Rezaei</strong><small>+43 660 1234567</small></div><Pill tone="success">{online ? 'Online' : 'Offline'}</Pill></Card>
      <BottomNav current="home" go={go} />
    </div>
  );
}

function Action({ icon: Icon, label, sub, tone, onClick }: { icon: LucideIcon; label: string; sub: string; tone: Tone; onClick: () => void }) {
  return <Card className="action-tile" onClick={onClick}><i className={`text-${tone}`}><Icon size={23} /></i><strong>{label}</strong><small>{sub}</small></Card>;
}

function AvailableScreen({ go, back }: { go: (s: Screen) => void; back: () => void }) {
  return (
    <div className="screen screen-with-nav">
      <TopBar title="Available Deliveries" back={back} />
      <div className="screen-body scroll-body">
        <div className="section-row"><b>3 orders ready</b><Pill tone="success">Live</Pill></div>
        {orders.map((order) => (
          <Card className="order-card" key={order.id}>
            <div className="section-row"><div><strong>Order #{order.id}</strong><span>{order.pizzas} {order.pizzas === 1 ? 'pizza' : 'pizzas'}</span></div><Pill tone="success">Ready Now</Pill></div>
            <hr />
            <div className="details-wrap">
              <Detail icon={MapPin}>{order.district}</Detail><Detail icon={Navigation}>{order.distance} km</Detail>
              <Detail icon={Clock3}>ETA {order.eta} min</Detail><Detail icon={CreditCard} tone={order.payment === 'cash' ? 'warning' : 'muted'}>{order.payment === 'cash' ? `Cash €${order.cash?.toFixed(2)}` : 'Paid'}</Detail>
            </div>
            <div className="hidden-notice"><UserRoundX size={13} />Customer details shown after accepting</div>
            <div className="button-row"><AppButton onClick={() => go('batchDetail')}>Accept</AppButton><AppButton secondary onClick={() => go('batchDetail')}>Details</AppButton></div>
          </Card>
        ))}
        <div className="info-banner"><Info size={14} />Customer details are shown after accepting. Maximum 3 orders per batch.</div>
      </div>
      <BottomNav current="available" go={go} />
    </div>
  );
}

function AssignedScreen({ stopIndex, go, back }: { stopIndex: number; go: (s: Screen) => void; back: () => void }) {
  return (
    <div className="screen screen-with-nav">
      <TopBar title="Assigned Deliveries" back={back} />
      <div className="screen-body scroll-body">
        <h2>Batch Delivery</h2>
        <Card className="batch-card">
          <div className="section-row"><div><strong>Batch #B-204</strong><span>3 orders · 5.8 km · 26 min</span></div><Pill tone="accent">Accepted</Pill></div>
          <hr />
          {orders.map((order, i) => <StopRow key={order.id} order={order} index={i} done={i < stopIndex} />)}
          <AppButton onClick={() => go('route')}>{stopIndex ? 'Continue Route' : 'Start Route'}</AppButton>
        </Card>
        <h2>Single Delivery</h2>
        <Card className="empty-card"><Package size={30} /><span>No single deliveries assigned</span></Card>
      </div>
      <BottomNav current="assigned" go={go} />
    </div>
  );
}

function StopRow({ order, index, done }: { order: (typeof orders)[number]; index: number; done?: boolean }) {
  return (
    <div className={`stop-row ${done ? 'is-done' : ''}`}>
      <i>{done ? <Check size={14} /> : index + 1}</i>
      <div><b>#{order.id}</b><span>{order.district}</span></div>
      <div>{order.payment === 'cash' ? <Pill tone="warning">€{order.cash?.toFixed(2)}</Pill> : <CheckCircle2 size={15} className="text-success" />}<Pill tone="info">OTP</Pill></div>
    </div>
  );
}

function BatchScreen({ go, back }: { go: (s: Screen) => void; back: () => void }) {
  return (
    <div className="screen">
      <TopBar title="Batch #B-204" subtitle="Batch Delivery" back={back} />
      <div className="screen-body scroll-body footer-space">
        <Card className="summary-card">
          <Summary icon={Package} value="3" label="Orders" /><Summary icon={Navigation} value="5.8 km" label="Distance" /><Summary icon={Clock3} value="26 min" label="Route Time" />
        </Card>
        <div className="pickup-row"><i><Home size={18} /></i><div><small>PICKUP</small><b>Partner Kitchen Vienna 1030</b></div><Pill tone="accent">Kitchen</Pill></div>
        <h2>Delivery Stops</h2>
        {orders.map((order, i) => (
          <Card className="stop-card" key={order.id}>
            <div className="section-row"><Pill>Stop {i + 1}</Pill><b>#{order.id}</b></div>
            <div className="details-wrap"><Detail icon={MapPin}>{order.district}</Detail><Detail icon={CreditCard} tone={order.payment === 'cash' ? 'warning' : 'muted'}>{order.payment === 'cash' ? `Cash €${order.cash?.toFixed(2)}` : 'Paid'}</Detail><Detail icon={Package}>{order.pizzas} pizzas</Detail><Detail icon={Navigation}>{order.distance} km · ETA {order.eta} min</Detail></div>
            <Pill tone="accent"><LockKeyhole size={12} /> OTP Required for delivery</Pill>
          </Card>
        ))}
        <Card className="rules-card"><b><AlertTriangle size={15} /> Dispatch Rules</b><span>• Maximum 3 orders per batch</span><span>• Protect pizza freshness — deliver in order</span><span>• Do not use the app while driving</span></Card>
      </div>
      <div className="sticky-footer"><AppButton onClick={() => go('route')}>Accept Batch & Start Route</AppButton><AppButton secondary onClick={back}>Reject</AppButton></div>
    </div>
  );
}

function Summary({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return <div><Icon size={17} /><b>{value}</b><span>{label}</span></div>;
}

function RouteScreen({ pickedUp, setPickedUp, stopIndex, go, back }: { pickedUp: boolean; setPickedUp: (v: boolean) => void; stopIndex: number; go: (s: Screen) => void; back: () => void }) {
  const current = orders[Math.min(stopIndex, orders.length - 1)];
  return (
    <div className="screen active-route">
      <TopBar title="Active Delivery" subtitle="Batch #B-204" back={back} />
      <div className="screen-body scroll-body">
        <div className="route-stats">
          <div className="progress-ring" style={{ '--progress': `${(stopIndex / 3) * 360}deg` } as React.CSSProperties}><span><b>{stopIndex}<small>/3</small></b><em>STOPS</em></span></div>
          <div><RouteStat icon={Navigation} label="Remaining" value={`${Math.max(0, 5.8 - stopIndex * 1.8).toFixed(1)} km`} /><RouteStat icon={Clock3} label="Time left" value={`${Math.max(5, 26 - stopIndex * 8)} min`} /></div>
        </div>
        <MapMock stopIndex={stopIndex} />
        <Card className="focus-card">
          {!pickedUp ? (
            <>
              <div className="focus-head"><i><Home size={21} /></i><div><b>Partner Kitchen Vienna 1030</b><span>Pickup point</span></div></div>
              <p>Collect the batch, then start your deliveries.</p>
              <AppButton secondary><Navigation size={17} /> Navigate</AppButton>
              <AppButton onClick={() => setPickedUp(true)}><Check size={18} /> Picked Up From Kitchen</AppButton>
            </>
          ) : (
            <>
              <div className="focus-head"><i>{stopIndex + 1}</i><div><b>Stop {stopIndex + 1} · #{current.id}</b><span>{current.pizzas} pizza{current.pizzas > 1 ? 's' : ''}</span></div>{current.payment === 'cash' ? <Pill tone="warning">€{current.cash?.toFixed(2)}</Pill> : null}</div>
              <p className="address"><MapPin size={19} /> <b>{current.address}<small>{current.district} · {current.distance} km · ~{current.eta} min</small></b></p>
              <div className="button-row"><AppButton secondary onClick={() => go('support')}><Phone size={17} /> Help</AppButton><AppButton secondary><Navigation size={17} /> Navigate</AppButton></div>
              <AppButton onClick={() => go('stopDetail')}><Check size={18} /> I&apos;ve Arrived</AppButton>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function RouteStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <Card className="route-stat"><span><Icon size={14} />{label}</span><b>{value}</b><i><em /></i></Card>;
}

function MapMock({ stopIndex }: { stopIndex: number }) {
  return (
    <div className="map-mock">
      <svg viewBox="0 0 380 220" preserveAspectRatio="none" aria-hidden="true">
        <path className="road" d="M-20 180 C80 125,70 50,170 80 S270 190,400 40" />
        <path className="route-line" d="M20 170 C80 125,75 75,150 84 S260 180,360 60" />
      </svg>
      <i className="map-home"><Home size={15} /></i>
      {[0, 1, 2].map((n) => <i key={n} className={`map-pin pin-${n} ${n < stopIndex ? 'done' : n === stopIndex ? 'current' : ''}`}>{n < stopIndex ? <Check size={13} /> : n + 1}</i>)}
    </div>
  );
}

function StopScreen({ stopIndex, arrived, setArrived, cashCollected, go, back }: { stopIndex: number; arrived: boolean; setArrived: (v: boolean) => void; cashCollected: boolean; go: (s: Screen) => void; back: () => void }) {
  const order = orders[Math.min(stopIndex, 2)];
  return (
    <div className="screen">
      <TopBar title={`Stop ${stopIndex + 1} / 3`} subtitle={`Order #${order.id}`} back={back} />
      <div className="screen-body scroll-body footer-space">
        <div className="stop-progress">{[0, 1, 2].map((i) => <i key={i} className={i < stopIndex ? 'done' : i === stopIndex ? 'current' : ''} />)}</div>
        <Card className="order-card"><div className="section-row"><div><strong>#{order.id}</strong><span>{order.pizzas} pizzas</span></div><Pill tone={arrived ? 'success' : 'accent'}>{arrived ? 'Arrived' : 'On The Way'}</Pill></div></Card>
        <Card className="info-list"><InfoRow icon={MapPin} label="Address" value={order.address} />{order.note ? <InfoRow icon={MessageCircle} label="Customer Note" value={order.note} tone="warning" /> : null}</Card>
        <Card className="payment-row"><i className={order.payment === 'cash' ? 'warning' : ''}>{order.payment === 'cash' ? <CircleDollarSign /> : <CheckCircle2 />}</i><div><small>Payment</small><b>{order.payment === 'cash' ? `Cash €${order.cash?.toFixed(2)}` : 'Paid Online'}</b></div><Pill tone={order.payment === 'cash' && !cashCollected ? 'warning' : 'success'}>{order.payment === 'cash' && !cashCollected ? 'Collect Cash' : 'Paid'}</Pill></Card>
        <div className="accent-banner"><LockKeyhole size={15} /> Delivery code required — ask the customer</div>
        <div className="warning-banner"><AlertTriangle size={14} /> Park safely before confirming delivery</div>
      </div>
      <div className="sticky-footer">
        <div className="mini-actions"><button className={arrived ? 'done' : ''} onClick={() => setArrived(true)}><MapPin />{arrived ? 'Arrived ✓' : 'Arrived'}</button><button><Phone />Call</button><button onClick={() => go('support')}><AlertTriangle />Problem</button></div>
        <AppButton onClick={() => go(order.payment === 'cash' && !cashCollected ? 'cashCollection' : 'otpConfirm')}>Confirm Delivery</AppButton>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, tone = 'muted' }: { icon: LucideIcon; label: string; value: string; tone?: Tone }) {
  return <div className={`info-row text-${tone}`}><Icon size={17} /><div><small>{label}</small><b>{value}</b></div></div>;
}

function CashScreen({ setCashCollected, go, back }: { setCashCollected: (v: boolean) => void; go: (s: Screen) => void; back: () => void }) {
  return (
    <div className="screen">
      <TopBar title="Cash Collection" back={back} />
      <div className="screen-body cash-screen">
        <Card className="cash-card"><i><CircleDollarSign size={34} /></i><span>Cash to Collect</span><strong>€22.40</strong><hr /><div><b>Order <span>#YP-1022</span></b><b>Stop <span>2 / 3</span></b><b>Pizzas <span>1 pizza</span></b></div></Card>
        <div className="info-banner"><Info size={15} />Count the cash carefully. You&apos;ll need the customer&apos;s delivery code next.</div>
        <div className="instruction-list"><Step n={1} label="Ask the customer for exact change if needed" /><Step n={2} label="Collect €22.40 from the customer" /><Step n={3} label="Confirm collection below" /></div>
        <div className="push-bottom"><AppButton onClick={() => { setCashCollected(true); go('otpConfirm'); }}>Cash Collected — €22.40</AppButton><button className="danger-link" onClick={() => go('support')}><AlertTriangle size={16} /> Customer Cannot Pay</button></div>
      </div>
    </div>
  );
}

function DeliveryOtp({ stopIndex, setStopIndex, setArrived, go, back }: { stopIndex: number; setStopIndex: (v: number) => void; setArrived: (v: boolean) => void; go: (s: Screen) => void; back: () => void }) {
  const [code, setCode] = useState('');
  const [done, setDone] = useState(false);
  const order = orders[Math.min(stopIndex, 2)];
  const complete = () => {
    setDone(true);
    window.setTimeout(() => {
      if (stopIndex >= 2) go('assigned');
      else { setStopIndex(stopIndex + 1); setArrived(false); go('route'); }
    }, 850);
  };
  return (
    <div className="screen">
      <TopBar title="Confirm Delivery" back={back} />
      <div className="screen-body center-content">
        {done ? <><div className="success-circle"><Check size={38} /></div><h1>{stopIndex === 2 ? 'Batch Completed!' : 'Delivered!'}</h1><p>{stopIndex === 2 ? 'All stops completed. Great work!' : 'Delivery confirmed. Moving to the next stop.'}</p></> : <>
          <div className="lock-hero"><LockKeyhole size={29} /></div><h1>Confirm Delivery</h1><p>Ask the customer for the 4-digit delivery code</p>
          <Pill><Package size={13} /> Order #{order.id} · Stop {stopIndex + 1}/3</Pill>
          <Pill tone="accent">Mock OTP: {order.otp}</Pill>
          <OtpBoxes code={code} setCode={setCode} />
          <AppButton disabled={code.length < 4} onClick={complete}>Complete Delivery</AppButton>
        </>}
      </div>
    </div>
  );
}

function HistoryScreen({ go, back }: { go: (s: Screen) => void; back: () => void }) {
  const [period, setPeriod] = useState('Week');
  return (
    <div className="screen screen-with-nav">
      <TopBar title="Delivery History" back={back} />
      <div className="screen-body scroll-body">
        <div className="segments">{['Today', 'Week', 'Month'].map((item) => <button key={item} className={period === item ? 'active' : ''} onClick={() => setPeriod(item)}>{item}</button>)}</div>
        <div className="history-summary"><Metric icon={Package} value="14" unit="" label="Deliveries" /><Metric icon={CircleDollarSign} value="€71" unit="" label="Earnings" tone="success" /><Metric icon={Star} value="4.7" unit="" label="Rating" tone="warning" /></div>
        <Card className="chart-card"><div className="section-row"><b>This Week</b><span className="text-accent">14 deliveries</span></div><div className="bars">{[2, 1, 3, 1, 2, 2, 3].map((n, i) => <i key={i}><b style={{ height: `${n * 25}%` }} /><span>{'SMTWTFS'[i]}</span></i>)}</div></Card>
        {deliveries.map((item) => <Card className="delivery-card" key={item.id}><div className="section-row"><div><strong>#{item.id}</strong><span>{item.date}</span></div><div className="rating">{'★'.repeat(item.rating)}</div></div><hr /><div className="details-wrap"><Detail icon={Navigation}>{item.km} km</Detail><Detail icon={Package}>{item.pizzas} pizzas</Detail><Detail icon={CreditCard}>{item.payment}</Detail></div><div className="earning-row"><span>You earned</span><b>€{item.earned.toFixed(2)}</b></div></Card>)}
      </div>
      <BottomNav current="history" go={go} />
    </div>
  );
}

function SupportScreen({ go, back }: { go: (s: Screen) => void; back: () => void }) {
  return (
    <div className="screen screen-with-nav">
      <TopBar title="Support" back={back} />
      <div className="screen-body scroll-body">
        <h2>Emergency Contacts</h2>
        <Card className="support-big"><i className="text-success"><Phone /></i><div><b className="text-success">Call Kitchen</b><span>+43 1 234 5678</span></div><ChevronRight /></Card>
        <Card className="support-big"><i className="text-accent"><Headphones /></i><div><b className="text-accent">Call YesPiz Support</b><span>24/7 Driver Hotline</span></div><ChevronRight /></Card>
        <h2>Report an Issue</h2>
        <div className="issue-grid"><Issue icon={MapPin} label="Wrong Address" /><Issue icon={UserRoundX} label="Customer N/A" /><Issue icon={AlertTriangle} label="Damaged Order" danger /><Issue icon={Clock3} label="Accident / Delay" danger /></div>
        <Card className="support-big"><i className="text-info"><FileText /></i><div><b>Report Problem</b><span>Describe any issue with the delivery</span></div><ChevronRight /></Card>
        <Card className="rules-card"><b><Shield size={16} /> Safety Reminders</b><span>• Do not use the app while driving</span><span>• Park safely before updating status</span><span>• Protect pizza freshness at all times</span></Card>
      </div>
      <BottomNav current="support" go={go} />
    </div>
  );
}

function Issue({ icon: Icon, label, danger }: { icon: LucideIcon; label: string; danger?: boolean }) {
  return <Card className={`issue ${danger ? 'text-danger' : 'text-warning'}`}><Icon size={23} /><b>{label}</b></Card>;
}

function ProfileScreen({ go, back, resetTo }: { go: (s: Screen) => void; back: () => void; resetTo: (s: Screen) => void }) {
  const [vehicleOpen, setVehicleOpen] = useState(false);
  return (
    <div className="screen screen-with-nav">
      <TopBar title="Profile" back={back} />
      <div className="screen-body scroll-body">
        <Card className="profile-card"><div className="profile-avatar">AR<i><Camera size={13} /></i></div><h2>Ali Rezaei</h2><span>+43 660 1234567</span><div><Pill tone="success">Online</Pill><Pill tone="info">3 today</Pill></div><p className="rating">★★★★★ <span>4.7 · 14 deliveries</span></p></Card>
        <h2>Earnings</h2>
        <div className="earnings-grid"><Card><b>€18.60</b><span>Today</span></Card><Card className="highlight"><b>€71.40</b><span>This Week</span></Card><Card><b>€284.20</b><span>This Month</span></Card></div>
        <Card className="earnings-list"><div><TrendingUp className="text-warning" /><span>Tips this week</span><b>€15.50</b></div><hr /><div><CircleDollarSign className="text-success" /><span>Cash collected</span><b>€56.30</b></div></Card>
        <KitchenCard />
        <h2>Account</h2>
        <Card className="menu-card"><Menu icon={Camera} label="Change Photo" /><Menu icon={Bike} label="Vehicle Type" value="Scooter" onClick={() => setVehicleOpen(true)} /><Menu icon={FileText} label="Documents" value="Up to date" /><Menu icon={Settings} label="Settings" onClick={() => go('settings')} /></Card>
        <button className="danger-link" onClick={() => resetTo('register')}><LogOut size={17} /> Log Out</button>
      </div>
      <BottomNav current="profile" go={go} />
      {vehicleOpen ? <div className="modal-overlay" onClick={() => setVehicleOpen(false)}><div className="bottom-sheet" onClick={(e) => e.stopPropagation()}><i /><h2>Vehicle Type</h2>{[[Bike, 'Bike'], [Zap, 'E-Bike'], [Wind, 'Scooter'], [Navigation, 'Car']].map(([Icon, label]) => { const VehicleIcon = Icon as LucideIcon; return <button key={label as string} className={label === 'Scooter' ? 'active' : ''} onClick={() => setVehicleOpen(false)}><VehicleIcon size={19} />{label as string}{label === 'Scooter' ? <Check size={17} /> : null}</button>; })}</div></div> : null}
    </div>
  );
}

function Menu({ icon: Icon, label, value, onClick }: { icon: LucideIcon; label: string; value?: string; onClick?: () => void }) {
  return <button onClick={onClick}><Icon size={18} /><span>{label}</span>{value ? <small>{value}</small> : null}<ChevronRight size={17} /></button>;
}

function SettingsScreen({
  dark, setDark, notifications, setNotifications, location, setLocation, language, setLanguage, back,
}: {
  dark: boolean; setDark: (v: boolean) => void; notifications: boolean; setNotifications: (v: boolean) => void;
  location: boolean; setLocation: (v: boolean) => void; language: 'en' | 'de'; setLanguage: (v: 'en' | 'de') => void; back: () => void;
}) {
  return (
    <div className="screen">
      <TopBar title="Settings" back={back} />
      <div className="screen-body scroll-body settings-screen">
        <h3>APPEARANCE</h3>
        <Card className="settings-card"><SettingToggle icon={Moon} label="Dark Mode" sub="Switch between dark & light" value={dark} setValue={setDark} /><hr /><div className="language-row"><Globe2 /><b>Language</b><div><button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>English</button><button className={language === 'de' ? 'active' : ''} onClick={() => setLanguage('de')}>Deutsch</button></div></div></Card>
        <h3>NOTIFICATIONS</h3>
        <Card className="settings-card"><SettingToggle icon={Bell} label="Push Notifications" sub="New orders, status updates" value={notifications} setValue={setNotifications} /></Card>
        <h3>PERMISSIONS</h3>
        <Card className="settings-card"><SettingToggle icon={MapPin} label="Location" sub="Required for deliveries" value={location} setValue={setLocation} /></Card>
        <h3>LEGAL</h3>
        <Card className="menu-card"><Menu icon={Shield} label="Privacy Policy" /><Menu icon={FileText} label="Terms of Service" /><Menu icon={Info} label="About YesPiz Driver" /></Card>
        <div className="app-version"><b>YesPiz Driver v1.0.0</b><span>Build 2024.1 · Made for partner kitchens</span></div>
      </div>
    </div>
  );
}

function SettingToggle({ icon: Icon, label, sub, value, setValue }: { icon: LucideIcon; label: string; sub: string; value: boolean; setValue: (v: boolean) => void }) {
  return <div className="setting-row"><Icon size={18} /><div><b>{label}</b><span>{sub}</span></div><Toggle checked={value} onChange={setValue} label={label} /></div>;
}
