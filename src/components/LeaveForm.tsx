// jingshin-leave-public/src/components/LeaveForm.tsx
import React, { useState, useEffect } from 'react';
import './LeaveForm.css';

const LeaveForm: React.FC = () => {
  const [formData, setFormData] = useState({
    workerId: '',
    workerName: '',
    leaveType: 'personal',
    startDate: '',
    startTime: '08:00',
    endDate: '',
    endTime: '17:00',
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
      setFormData(prev => ({ ...prev, workerName: '' }));
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
        setFormData(prev => ({ ...prev, workerName: data.name }));
      } else {
        setError('找不到員工工號 / Worker ID not found');
      }
    } catch (e) {
      setError('網路連線錯誤 / Connection error');
    } finally {
      setFetchingName(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.workerName) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
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

      // Since no-cors doesn't return success state, we assume it sent 
      // or you can use a more advanced fetch setup.
      setSubmitted(true);
    } catch (e) {
      alert('提交失敗，請檢查網路 / Submit failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="success-container">
        <div className="success-card">
          <div className="check-icon">✓</div>
          <h2>提交成功！</h2>
          <p>您的請假申請已送到後台審核。</p>
          <p className="en-sub">Application submitted for approval.</p>
          <button onClick={() => window.location.reload()}>返回 / Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-form-container">
      <div className="form-card">
        <div className="form-header">
          <h1>晶欣股份有限公司</h1>
          <p>員工請假申請單 (Public)</p>
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
            <label>工號 (Worker ID) *</label>
            <input
              type="text"
              className={`input-main ${error ? 'error' : ''}`}
              placeholder="例如: 14070"
              value={formData.workerId}
              onChange={e => setFormData({...formData, workerId: e.target.value.replace(/\D/g, '').slice(0, 5)})}
              required
            />
            {fetchingName && <small>驗證中...</small>}
            {formData.workerName && <div className="welcome-msg">您好, {formData.workerName}</div>}
            {error && <div className="error-msg">{error}</div>}
          </div>

          <div className="form-row">
            <div className="form-section">
              <label>假別 (Type) *</label>
              <select 
                value={formData.leaveType}
                onChange={e => setFormData({...formData, leaveType: e.target.value})}
              >
                <option value="personal">事假 (Personal)</option>
                <option value="sick">病假 (Sick)</option>
                <option value="annual">特休 (Annual)</option>
                <option value="menstrual">生理假 (Menstrual)</option>
                <option value="bereavement">喪假 (Bereavement)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-section">
              <label>開始日期 (Start Date) *</label>
              <input 
                type="date" 
                required 
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div className="form-section">
              <label>時間 (Time)</label>
              <input 
                type="time" 
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-section">
              <label>結束日期 (End Date) *</label>
              <input 
                type="date" 
                required 
                value={formData.endDate}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
            <div className="form-section">
              <label>時間 (Time)</label>
              <input 
                type="time" 
                value={formData.endTime}
                onChange={e => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
          </div>

          <div className="form-section">
            <label>請假原因 (Reason) *</label>
            <textarea
              placeholder="請簡述原因..."
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
            {loading ? '提交中...' : '確認送出 (Submit)'}
          </button>

          <div className="footer-info">
            IP: {ip} | Device: {navigator.platform}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveForm;