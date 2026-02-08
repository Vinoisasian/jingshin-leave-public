import React, { useState, useEffect } from 'react';
import { translations, Language } from '../locales';
import './LeaveForm.css';

interface LeaveFormProps {
  lang: Language;
  onBack: () => void;
}

const LeaveForm: React.FC<LeaveFormProps> = ({ lang, onBack }) => {
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
    honeyPot: ''
  });

  const [ip, setIp] = useState('0.0.0.0');
  const [loading, setLoading] = useState(false);
  const [fetchingName, setFetchingName] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

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
      setError('');
    }
  }, [formData.workerId]);

  const verifyWorker = async (id: string) => {
    setFetchingName(true);
    setError('');
    try {
      const baseUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycby06HeOx1uFB8gM1tMvok2mchvjLgNajKnSkGTRGFvNQXg0ZTQVpIo-EiTuUnlMg1xK/exec';
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
      } else {
        setError(t.error_id_not_found);
      }
    } catch (e) {
      setError(t.error_network);
    } finally {
      setFetchingName(false);
    }
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
      return `${totalHours} Hours`; // We can translate this too if needed later
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

      const baseUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycby06HeOx1uFB8gM1tMvok2mchvjLgNajKnSkGTRGFvNQXg0ZTQVpIo-EiTuUnlMg1xK/exec';
      await fetch(baseUrl, {
        method: 'POST',
        mode: 'no-cors', // Google Scripts require no-cors for simple POST
        headers: { 'Content-Type': 'application/json' },
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
      <div className="success-container">
        <div className="success-card">
          <div className="check-icon">✓</div>
          <h2>{t.success_title}</h2>
          <p>{t.success_desc}</p>
          <button onClick={() => window.location.reload()}>{t.back}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-form-container">
      <div className="form-card">
        <button className="back-link" onClick={onBack}>← {t.back}</button>
        
        <div className="form-header">
          <h1>Jingshin</h1>
          <p>{t.welcome}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Bot Trap */}
          <input 
            type="text" 
            style={{ display: 'none' }} 
            value={formData.honeyPot} 
            onChange={e => setFormData({...formData, honeyPot: e.target.value})} 
          />

          <div className="form-section">
            <label>{t.worker_id} *</label>
            <input
              type="text"
              className={`input-main ${error ? 'error' : ''}`}
              placeholder={t.id_placeholder}
              value={formData.workerId}
              onChange={e => setFormData({...formData, workerId: e.target.value.replace(/\D/g, '').slice(0, 5)})}
              required
            />
            {fetchingName && <small>{t.verifying}</small>}
            
            {formData.workerName && (
              <div className="worker-info-box">
                <div className="info-name">{t.hello}, {formData.workerName}</div>
                <div className="info-details">
                  {formData.dept && <span className="info-badge">{formData.dept}</span>}
                  {formData.role && <span className="info-badge outline">{formData.role}</span>}
                </div>
              </div>
            )}
            
            {error && <div className="error-msg">{error}</div>}
          </div>

          <div className="form-row">
            <div className="form-section">
              <label>{t.leave_type} *</label>
              <select 
                value={formData.leaveType}
                onChange={e => setFormData({...formData, leaveType: e.target.value})}
              >
                <option value="personal">{t.personal}</option>
                <option value="sick">{t.sick}</option>
                <option value="annual">{t.annual}</option>
                <option value="menstrual">{t.menstrual}</option>
                <option value="bereavement">{t.bereavement}</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-section">
              <label>{t.start_date} *</label>
              <input 
                type="date" 
                required 
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="form-section">
              <label>{t.time}</label>
              <input 
                type="time" 
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-section">
              <label>{t.end_date} *</label>
              <input 
                type="date" 
                required 
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
            <div className="form-section">
              <label>{t.time}</label>
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
            <label>{t.reason} *</label>
            <textarea
              placeholder={t.reason_placeholder}
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              required
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || !formData.workerName || !!error}
          >
            {loading ? t.submitting : t.submit}
          </button>

          <div className="footer-info">
            IP: {ip}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveForm;
