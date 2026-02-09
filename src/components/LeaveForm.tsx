import { useState, useEffect } from 'react';
import { translations, Language } from '../locales';
import heic2any from 'heic2any';
import './LeaveForm.css';

interface LeaveFormProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LeaveForm: React.FC<LeaveFormProps> = ({ lang, setLang }) => {
  const t = translations[lang];
  
  const [formData, setFormData] = useState({
    workerId: '',
    workerName: '',
    role: '',
    dept: '',
    leaveType: 'personal',
    startDate: '',
    startTime: '08:00',
    endDate: '',
    endTime: '17:10',
    reason: '',
    honeyPot: '',
    attachment: null as string | null,
    attachmentName: ''
  });

  const [ip, setIp] = useState('0.0.0.0');
  const [loading, setLoading] = useState(false);
  const [fetchingName, setFetchingName] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Get IP Metadata on load
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIp(data.ip))
      .catch(() => console.log('IP fetch failed'));
  }, []);

  // Auto-verify Worker ID
  useEffect(() => {
    if (formData.workerId.length === 5) {
      verifyWorker(formData.workerId);
    } else {
      setFormData(prev => ({ ...prev, workerName: '', role: '', dept: '' }));
      setBalance(null);
      setError('');
      setShowForm(false);
    }
  }, [formData.workerId]);

  const verifyWorker = async (id: string) => {
    setFetchingName(true);
    setError('');
    try {
      const baseUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxyK7ai_mdEa34IWPOVr-0l5IpCVuU1LlWuPbFNlZlncM9BxhNrPuUlwuPB5JO1Xsg9/exec';
      const url = `${baseUrl}?workerId=${id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({ 
          ...prev, 
          workerName: data.name,
          dept: data.dept,
          role: data.role
        }));
        setBalance(data.balance !== undefined ? data.balance : null);
        // Add a tiny delay for smooth transition
        setTimeout(() => setShowForm(true), 300);
      } else {
        setError(t.error_id_not_found);
        setBalance(null);
        setShowForm(false);
      }
    } catch (e) {
      setError(t.error_network);
    } finally {
      setFetchingName(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 10MB for HEIC as they can be large before conversion)
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large (Max 10MB)");
      return;
    }

    setLoading(true); // Show loading during conversion
    let fileName = file.name;

    try {
      // Check if it's HEIC/HEIF
      const lowerName = fileName.toLowerCase();
      if (lowerName.endsWith('.heic') || lowerName.endsWith('.heif')) {
        console.log("[HEIC] Converting to JPG...");
        const blob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.7
        });
        
        // Convert Blob to File object
        const convertedBlob = Array.isArray(blob) ? blob[0] : blob;
        file = new File([convertedBlob], fileName.replace(/\.[^/.]+$/, ".jpg"), {
          type: 'image/jpeg',
          lastModified: new Date().getTime()
        });
        fileName = file.name;
        console.log("[HEIC] Conversion complete:", fileName);
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          attachment: base64,
          attachmentName: fileName
        }));
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("[HEIC] Conversion failed:", err);
      alert("Failed to process image format. Please try a standard JPG/PNG.");
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, attachment: null, attachmentName: '' }));
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime) {
      return '0';
    }

    const start = new Date(`${formData.startDate}T${formData.startTime}`);
    const end = new Date(`${formData.endDate}T${formData.endTime}`);

    if (end <= start) return '0';

    const getWorkHoursInDay = (dayStart: Date, dayEnd: Date) => {
      let dayTotalMs = 0;
      const blocks = [
        { startH: 8, startM: 0, endH: 12, endM: 0 },
        { startH: 13, startM: 0, endH: 17, endM: 0 }
      ];

      for (const b of blocks) {
        const bStart = new Date(dayStart);
        bStart.setHours(b.startH, b.startM, 0, 0);
        const bEnd = new Date(dayStart);
        bEnd.setHours(b.endH, b.endM, 0, 0);

        const overlapStart = dayStart < bStart ? bStart : dayStart;
        const overlapEnd = dayEnd > bEnd ? bEnd : dayEnd;

        if (overlapEnd > overlapStart) {
          dayTotalMs += (overlapEnd.getTime() - overlapStart.getTime());
        }
      }
      return dayTotalMs / (1000 * 60 * 60);
    };

    let totalHours = 0;
    const sDate = new Date(formData.startDate);
    sDate.setHours(0,0,0,0);
    const eDate = new Date(formData.endDate);
    eDate.setHours(0,0,0,0);
    
    const diffDays = Math.round((eDate.getTime() - sDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= diffDays; i++) {
      const loopDate = new Date(sDate);
      loopDate.setDate(loopDate.getDate() + i);
      
      let intervalStart = new Date(loopDate);
      intervalStart.setHours(8, 0, 0, 0);
      let intervalEnd = new Date(loopDate);
      intervalEnd.setHours(17, 10, 0, 0);

      if (i === 0) intervalStart = start;
      if (i === diffDays) intervalEnd = end;

      totalHours += getWorkHoursInDay(intervalStart, intervalEnd);
    }

    totalHours = Math.round(totalHours * 10) / 10;
    if (totalHours < 8) {
      return `${totalHours} Hours`;
    } else {
      const days = totalHours / 8;
      const formattedDays = days % 1 === 0 ? days : days.toFixed(1);
      return `${formattedDays} Days`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workerName) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        startTime: formData.startTime || '08:00',
        endTime: formData.endTime || '17:10',
        ipAddress: ip,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      const baseUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxyK7ai_mdEa34IWPOVr-0l5IpCVuU1LlWuPbFNlZlncM9BxhNrPuUlwuPB5JO1Xsg9/exec';
      
      // Sending as text/plain string to avoid CORS preflight issues with large payloads
      await fetch(baseUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSubmitted(true);
    } catch (e) {
      alert(t.error_network);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="success-card fade-in">
        <div className="check-icon">✓</div>
        <h2>{t.success_title}</h2>
        <p>{t.success_desc}</p>
        <button onClick={() => window.location.reload()}>{t.back}</button>
      </div>
    );
  }

  // --- RENDERING LANDING VIEW ---
  if (!showForm) {
    return (
      <div className="form-card landing-card fade-in">
        <div className="form-header">
          <p>{t.welcome}</p>
          <h1>{t.company_name}</h1>
          <p>{t.portal_title}</p>
        </div>

        <div className="form-section">
          <input
            type="text"
            className={`id-input-large ${error ? 'error' : ''}`}
            placeholder={t.id_placeholder}
            value={formData.workerId}
            onChange={e => setFormData({...formData, workerId: e.target.value.replace(/\D/g, '').slice(0, 5)})}
            autoFocus
          />
          {fetchingName && <small className="verifying-text">{t.verifying}</small>}
          {error && <div className="error-msg">{error}</div>}
        </div>

        <div className="lang-mini-grid">
          <button className={`lang-btn ${lang === 'zh' ? 'active' : ''}`} onClick={() => setLang('zh')}>繁</button>
          <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
          <button className={`lang-btn ${lang === 'vi' ? 'active' : ''}`} onClick={() => setLang('vi')}>VI</button>
        </div>

        <div className="version-footer">{t.version_footer}</div>
      </div>
    );
  }

  // --- RENDERING ACTUAL FORM ---
  return (
    <div className="form-card fade-in">
      <button className="back-link" onClick={() => setShowForm(false)}>
        ← {t.back}
      </button>
      
      <div className="form-header">
        <h1>{t.company_name}</h1>
        <p className="portal-subtitle">{t.portal_title}</p>
        
        <div className="formal-worker-card">
          <div className="formal-row main">
            <div className="formal-group">
              <label className="formal-label">{t.worker_id}</label>
              <div className="formal-value highlight">#{formData.workerId}</div>
            </div>
            <div className="formal-group">
              <label className="formal-label">{t.hello}</label>
              <div className="formal-value name">{formData.workerName}</div>
            </div>
          </div>
          
          <div className="formal-divider"></div>
          
          <div className="formal-row">
            <div className="formal-group">
              <label className="formal-label">{t.dept || 'Department'}</label>
              <div className="formal-value">{formData.dept || '-'}</div>
            </div>
            <div className="formal-group">
              <label className="formal-label">{t.role || 'Role'}</label>
              <div className="formal-value">{formData.role || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          style={{ display: 'none' }} 
          value={formData.honeyPot} 
          onChange={e => setFormData({...formData, honeyPot: e.target.value})} 
        />

        <div className="form-row">
          <div className="form-section">
            <label>📄 {t.leave_type} *</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select 
                style={{ flex: 1 }}
                value={formData.leaveType}
                onChange={e => setFormData({...formData, leaveType: e.target.value})}
              >
                <option value="personal">{t.personal}</option>
                <option value="sick">{t.sick}</option>
                <option value="annual">{t.annual}</option>
                <option value="menstrual">{t.menstrual}</option>
                <option value="bereavement">{t.bereavement}</option>
              </select>
              
              {formData.leaveType === 'annual' && balance !== null && (
                <div className="public-balance-badge" title="Remaining Annual Leave">
                  💎 <strong>{balance}</strong> <small>d</small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-section">
            <label>📅 {t.start_date} *</label>
            <input 
              type="date" 
              required 
              value={formData.startDate}
              onChange={e => setFormData({...formData, startDate: e.target.value})}
            />
          </div>
          <div className="form-section">
            <label>⏰ {t.time}</label>
            <input 
              type="time" 
              value={formData.startTime}
              onChange={e => setFormData({...formData, startTime: e.target.value})}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-section">
            <label>📅 {t.end_date} *</label>
            <input 
              type="date" 
              required 
              value={formData.endDate}
              onChange={e => setFormData({...formData, endDate: e.target.value})}
            />
          </div>
          <div className="form-section">
            <label>⏰ {t.time}</label>
            <input 
              type="time" 
              value={formData.endTime}
              onChange={e => setFormData({...formData, endTime: e.target.value})}
            />
          </div>
        </div>

        {formData.startDate && formData.endDate && (
          <div className="est-days-box">
            {t.est_days}: <strong>{calculateDays()}</strong>
          </div>
        )}

        <div className="form-section">
          <label>💬 {t.reason} *</label>
          <textarea
            placeholder={t.reason_placeholder}
            value={formData.reason}
            onChange={e => setFormData({...formData, reason: e.target.value})}
            required
          ></textarea>
        </div>

        <div className="form-section">
          <label>📎 {t.attachment}</label>
          {!formData.attachment ? (
            <div className="file-upload-container">
              <input 
                type="file" 
                className="file-input-hidden" 
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
              <div className="file-upload-icon">📁</div>
              <div className="file-upload-text">{t.attachment_hint}</div>
            </div>
          ) : (
            <div className="file-selected-badge">
              <div className="file-info">
                <span>📎</span>
                <span>{formData.attachmentName}</span>
              </div>
              <button type="button" className="remove-file" onClick={removeFile}>×</button>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading}
        >
          {loading ? t.submitting : t.submit}
        </button>

        <div className="version-footer">{t.version_footer}</div>
      </form>
    </div>
  );
};

export default LeaveForm;
