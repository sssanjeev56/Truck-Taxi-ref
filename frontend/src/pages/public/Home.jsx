import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

function TruckLogoSVG({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="7" width="14" height="11" rx="2" fill="#4a90e2"/>
      <rect x="15" y="10" width="8" height="8" rx="1.5" fill="#2d6cdf"/>
      <polygon points="15,10 20,10 22,14 15,14" fill="#2557b0"/>
      <circle cx="5" cy="19" r="2.2" fill="#1a3a6e"/>
      <circle cx="5" cy="19" r="0.9" fill="#dbeafe"/>
      <circle cx="19" cy="19" r="2.2" fill="#1a3a6e"/>
      <circle cx="19" cy="19" r="0.9" fill="#dbeafe"/>
      <rect x="3" y="11" width="5" height="3" rx="0.5" fill="#93c5fd"/>
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDashboard = () => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'admin') navigate('/admin/dashboard');
    else if (user.role === 'driver') navigate('/driver/dashboard');
    else navigate('/customer/dashboard');
  };

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="home-nav">
        <div className="home-nav-logo" onClick={() => navigate('/')}>
          <TruckLogoSVG size={26} />
          <span className="home-nav-brand">TRUCK TAXI</span>
        </div>
        <div className="home-nav-links">
          <a href="#how-it-works">How It Works</a>
          <a href="#features">Features</a>
          <a href="#for-drivers">For Drivers</a>
        </div>
        <div className="home-nav-actions">
          {user ? (
            <button className="btn btn-primary btn-sm" onClick={handleDashboard}>
              Go to Dashboard →
            </button>
          ) : (
            <>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Sign In</button>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>Get Started</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">🤖 AI-Powered Logistics Platform</div>
          <h1>Find the Right Truck<br />for Your Journey</h1>
          <p>
            Book suitable trucks, track availability, and discover intelligent return-load
            opportunities in one platform. Our AI matching engine connects customers with
            the most compatible available trucks in real time.
          </p>
          <div className="home-hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate(user ? '/customer/find-truck' : '/register')}>
              🔍 Find a Truck
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/register/driver')}>
              🚛 Become a Driver
            </button>
          </div>
          <div className="home-hero-stats">
            <div className="hero-stat"><span>100%</span><p>AI-Matched</p></div>
            <div className="hero-stat"><span>5</span><p>Demo Trucks</p></div>
            <div className="hero-stat"><span>7</span><p>Match Criteria</p></div>
          </div>
        </div>
        <div className="home-hero-visual">
          {/* Journey Flow Visualization */}
          <div className="journey-flow">
            {[
              { icon: '📍', label: 'Location A', sub: 'Pickup Point' },
              { icon: '🚛', label: 'Truck with Load', sub: 'In Transit' },
              { icon: '📦', label: 'Delivery', sub: 'At Destination' },
              { icon: '📍', label: 'Location B', sub: 'Drop Point' },
              { icon: '✅', label: 'Truck Available', sub: 'Free for Next Job' },
              { icon: '🤖', label: 'Smart Match', sub: 'AI Engine Active' },
              { icon: '🔄', label: 'Next Journey', sub: 'Return Load' },
            ].map((step, i) => (
              <div key={i} className="journey-step">
                <div className="journey-icon">{step.icon}</div>
                <div className="journey-label">{step.label}</div>
                <div className="journey-sub">{step.sub}</div>
                {i < 6 && <div className="journey-arrow">↓</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="home-section" id="how-it-works">
        <div className="home-section-inner">
          <div className="section-header">
            <h2>How Truck Taxi Works</h2>
            <p>From requirement to delivery in 8 simple steps</p>
          </div>
          <div className="how-grid">
            {[
              { n: '01', icon: '📝', title: 'Enter Requirements', desc: 'Specify pickup, destination, goods type, weight, and vehicle type' },
              { n: '02', icon: '🔍', title: 'Find Available Trucks', desc: 'System fetches all available trucks in real time' },
              { n: '03', icon: '🤖', title: 'AI Matches Trucks', desc: 'Our engine scores trucks on 7 criteria — route, capacity, distance, timing and more' },
              { n: '04', icon: '📊', title: 'Compare Recommendations', desc: 'Get ranked trucks with compatibility scores out of 100' },
              { n: '05', icon: '📋', title: 'Book Truck', desc: 'One click booking — driver gets instant notification' },
              { n: '06', icon: '📍', title: 'Track Journey', desc: 'Follow your shipment on the live tracking map' },
              { n: '07', icon: '✅', title: 'Complete Delivery', desc: 'Driver confirms delivery. Truck status auto-updates to Available' },
              { n: '08', icon: '🔄', title: 'Find Return Load', desc: 'System automatically finds return-load opportunities for the driver' },
            ].map(step => (
              <div key={step.n} className="how-card">
                <div className="how-number">{step.n}</div>
                <div className="how-icon">{step.icon}</div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="home-section home-section-alt" id="features">
        <div className="home-section-inner">
          <div className="section-header">
            <h2>Platform Features</h2>
            <p>Everything you need for intelligent logistics</p>
          </div>
          <div className="features-grid">
            {[
              { icon: '🤖', title: 'AI Matching Engine', desc: 'Deterministic scoring on 7 criteria. Route compatibility, capacity, vehicle type, goods, availability, distance, and timing.', badge: 'Core Feature' },
              { icon: '🔄', title: 'Return-Load Matching', desc: 'Automatically finds new jobs for drivers after delivery — eliminating empty return trips and maximizing efficiency.', badge: 'Smart Feature' },
              { icon: '📍', title: 'Live Truck Tracking', desc: 'Drivers update their GPS location. Customers see trucks on OpenStreetMap. Fully upgradeable to real GPS.' },
              { icon: '📊', title: 'Compatibility Scores', desc: 'Every truck gets a precise score out of 100. No guesswork — all calculations based on actual route and capacity data.' },
              { icon: '🔔', title: 'Real-time Notifications', desc: 'Instant alerts for booking requests, confirmations, trip updates, and return-load opportunities.' },
              { icon: '🔐', title: 'Secure Authentication', desc: 'JWT-based auth with bcrypt password hashing. Role-based access control for Customers, Drivers, and Admin.' },
              { icon: '📱', title: 'Responsive Design', desc: 'Works seamlessly on desktop, tablet, and mobile devices.' },
              { icon: '⚙️', title: 'Admin Control Panel', desc: 'Complete platform management — users, drivers, trucks, bookings, trips, and analytics.' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <h4 style={{ margin: 0 }}>{f.title}</h4>
                  {f.badge && <span style={{ fontSize: 10, background: '#dbeafe', color: '#1e40af', borderRadius: 10, padding: '2px 8px', fontWeight: 700 }}>{f.badge}</span>}
                </div>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Drivers */}
      <section className="home-section" id="for-drivers">
        <div className="home-section-inner">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2d6cdf', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>For Drivers</div>
              <h2 style={{ marginBottom: 16 }}>Stop Driving Back Empty</h2>
              <p style={{ marginBottom: 20, lineHeight: 1.8 }}>
                Every empty return trip is wasted fuel and lost income. Truck Taxi analyzes customer demand near your delivery location and shows you return-load opportunities automatically — so you can find your next job before you even finish the current one.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {[
                  '✅ Register your truck and set your preferred routes',
                  '✅ Receive instant booking notifications',
                  '✅ Accept or reject requests in one click',
                  '✅ Update your location and availability status',
                  '✅ Find AI-recommended return loads automatically',
                ].map(item => (
                  <div key={item} style={{ fontSize: 14, color: '#475569' }}>{item}</div>
                ))}
              </div>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/register/driver')}>
                🚛 Register as Driver →
              </button>
            </div>
            <div className="driver-benefits">
              {[
                { icon: '💰', title: 'Maximize Revenue', desc: 'No more empty return trips. Find paying cargo on the way back.' },
                { icon: '📲', title: 'Instant Alerts', desc: 'Get notified the moment a customer needs a truck on your route.' },
                { icon: '🗺️', title: 'Smart Routing', desc: 'AI considers your current location and preferred routes for every match.' },
                { icon: '⭐', title: 'Build Your Rating', desc: 'Earn ratings from completed trips and build your reputation.' },
              ].map(b => (
                <div key={b.title} className="driver-benefit-card">
                  <span style={{ fontSize: 28 }}>{b.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{b.title}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <h2>Ready to Move Smarter?</h2>
        <p>Join Truck Taxi today — for customers who need trucks and drivers who want better loads.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
          <button className="btn btn-accent btn-lg" onClick={() => navigate('/register')}>
            🔍 Find a Truck Now
          </button>
          <button className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }} onClick={() => navigate('/register/driver')}>
            🚛 Register as Driver
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-nav-logo" style={{ justifyContent: 'center', marginBottom: 8 }}>
          <TruckLogoSVG size={22} />
          <span className="home-nav-brand">TRUCK TAXI</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>
          "Find the Right Truck. Track the Journey. Move Smarter."
        </p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', marginTop: 16 }}>
          © 2026 Truck Taxi · AI-Powered Truck Booking & Return-Load Matching · College Project
        </p>
      </footer>
    </div>
  );
}
