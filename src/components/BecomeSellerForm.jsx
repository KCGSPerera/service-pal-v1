'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, Phone, CheckCircle } from 'lucide-react';

export default function BecomeSellerForm({ onBack, showToast }) {
  const { token, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingExisting, setFetchingExisting] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [rejectedReason, setRejectedReason] = useState('');

  // STEP 1 Form State
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [serviceType, setServiceType] = useState('Individual'); // Individual or Corporate

  // Links
  const [websiteLink, setWebsiteLink] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');

  // STEP 2 Form State
  const [logo, setLogo] = useState('');
  const [billingProof, setBillingProof] = useState('');
  const [workingHours, setWorkingHours] = useState('9:00 AM - 5:00 PM');
  const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  // Individual Specific
  const [nicNumber, setNicNumber] = useState('');
  const [nicFront, setNicFront] = useState('');
  const [nicBack, setNicBack] = useState('');
  const [policeReport, setPoliceReport] = useState('');

  // Corporate Specific
  const [regNumber, setRegNumber] = useState('');
  const [regDocument, setRegDocument] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerNic, setOwnerNic] = useState('');
  const [ownerNicFront, setOwnerNicFront] = useState('');
  const [ownerNicBack, setOwnerNicBack] = useState('');
  const [brDocument, setBrDocument] = useState('');
  const [taxId, setTaxId] = useState('');

  // New Fields (Common)
  const [profilePhoto, setProfilePhoto] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [serviceExpertise, setServiceExpertise] = useState('');
  const [warranty, setWarranty] = useState('');
  const [workingCities, setWorkingCities] = useState('');

  // New Fields (Individual)
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [businessCard, setBusinessCard] = useState('');

  // New Fields (Corporate)
  const [businessType, setBusinessType] = useState('');
  const [yearsInIndustry, setYearsInIndustry] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchExistingRequest();
  }, []);

  const fetchExistingRequest = async () => {
    try {
      const response = await fetch('/api/providers/upgrade-request/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      if (response.ok && res.data) {
        const req = res.data;
        if (req.status === 'pending') {
          setIsPending(true);
        } else if (req.status === 'rejected') {
          setRejectedReason(req.rejection_reason || req.admin_remarks || 'Your request was rejected.');
          
          // Pre-fill states
          setServiceType(req.service_type || 'Individual');
          setCategoryId(req.category_id || '');
          setSubCategoryId(req.sub_category_id || '');
          setProfilePhoto(req.profile_photo || req.logo || '');
          setWhatsappNumber(req.whatsapp_number || '');
          setWebsiteLink(req.website_link || '');
          setFacebookLink(req.facebook_link || '');
          setInstagramLink(req.instagram_link || '');
          setLinkedinLink(req.linkedin_link || '');
          setServiceExpertise(Array.isArray(req.service_expertise) ? req.service_expertise.join(', ') : (req.service_expertise || ''));
          setWarranty(req.warranty || '');
          setWorkingCities(Array.isArray(req.working_cities) ? req.working_cities.join(', ') : (req.working_cities || ''));
          
          // Legacy base
          setBusinessName(req.business_name || '');
          setBusinessEmail(req.business_email || '');
          setBusinessPhone(req.business_phone || '');
          setDescription(req.description || '');
          setAddress(req.address || '');
          setCity(req.city || '');
          setPostalCode(req.postal_code || '');
          setWorkingHours(req.working_hours || '9:00 AM - 5:00 PM');
          setWorkingDays(Array.isArray(req.working_days) && req.working_days.length > 0 ? req.working_days : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
          setBillingProof(req.billing_proof_image || '');

          if (req.service_type === 'Individual') {
            setYearsOfExperience(req.years_of_experience || '');
            setNicNumber(req.nic_number || '');
            setBusinessCard(req.business_card || '');
            setNicFront(req.nic_front_image || '');
            setNicBack(req.nic_back_image || '');
            setPoliceReport(req.police_report_image || '');
          } else {
            setBusinessType(req.business_type || '');
            setYearsInIndustry(req.years_in_industry || '');
            setRegNumber(req.business_registration_number || req.registration_number || '');
            setRegDocument(req.business_document || req.registration_document || '');
            setOwnerName(req.owner_name || '');
            setOwnerNic(req.owner_nic || '');
            setOwnerNicFront(req.owner_nic_front || '');
            setOwnerNicBack(req.owner_nic_back || '');
            setBrDocument(req.br_document || '');
            setTaxId(req.tax_id || '');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching existing request', error);
    } finally {
      setFetchingExisting(false);
    }
  };

  useEffect(() => {
    if (categoryId) {
      fetchSubcategories(categoryId);
    } else {
      setSubcategories([]);
    }
  }, [categoryId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  };

  const fetchSubcategories = async (catId) => {
    try {
      const response = await fetch(`/api/subcategories?categoryId=${catId}`);
      const data = await response.json();
      if (response.ok) {
        setSubcategories(data.subcategories);
      }
    } catch (err) {
      console.error('Fetch subcategories error:', err);
    }
  };

  // Base64 helper
  const handleFileConvert = (e, setFileString) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setFileString(reader.result);
    };
    reader.onerror = (error) => {
      console.error('File parsing error:', error);
      showToast('File read failed', 'error');
    };
  };

  const toggleWorkingDay = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const validateStep1 = () => {
    if (!profilePhoto || !categoryId || !subCategoryId || !serviceType) {
      showToast('Please fill out all mandatory common fields (Profile Photo, Category, Service Type)', 'error');
      return false;
    }
    // Check type-specific fields that are in step 1 or might be validated early
    if (serviceType === 'Corporate' && !businessName) {
      showToast('Business Name is required for Corporate Service Providers', 'error');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (serviceType === 'Individual') {
      if (!nicNumber || !yearsOfExperience) {
        showToast('Please fill NIC number and Years of Experience', 'error');
        return false;
      }
    } else {
      if (!regNumber || !yearsInIndustry || !businessType) {
        showToast('Please fill BR details, Years in Industry, and Business Type', 'error');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {
        // Legacy Mappings
        business_name: businessName,
        business_email: businessEmail,
        business_phone: businessPhone,
        description,
        category_id: categoryId,
        sub_category_id: subCategoryId,
        address,
        city,
        postal_code: postalCode,
        facebook_link: facebookLink,
        instagram_link: instagramLink,
        linkedin_link: linkedinLink,
        website_link: websiteLink,
        logo: profilePhoto, // fallback for legacy code
        service_type: serviceType,
        billing_proof_image: billingProof,
        working_hours: workingHours,
        working_days: workingDays,

        // New Common Fields
        profile_photo: profilePhoto,
        whatsapp_number: whatsappNumber,
        website: websiteLink,
        service_expertise: serviceExpertise,
        warranty,
        working_cities: workingCities,
      };

      if (serviceType === 'Individual') {
        // Individual Fields
        payload.years_of_experience = yearsOfExperience;
        payload.nic_number = nicNumber;
        payload.business_card = businessCard;
        
        // Legacy individual fields
        payload.nic_front_image = nicFront;
        payload.nic_back_image = nicBack;
        payload.police_report_image = policeReport;
      } else {
        // Corporate Fields
        payload.business_type = businessType;
        payload.years_in_industry = yearsInIndustry;
        payload.business_registration_number = regNumber;
        payload.business_document = regDocument;
        
        // Legacy corporate fields
        payload.registration_number = regNumber;
        payload.registration_document = regDocument;
        payload.owner_name = ownerName;
        payload.owner_nic = ownerNic;
        payload.owner_nic_front = ownerNicFront;
        payload.owner_nic_back = ownerNicBack;
        payload.br_document = brDocument;
        payload.tax_id = taxId;
      }

      const response = await fetch('/api/providers/upgrade-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Upgrade request submitted successfully! Admin will review shortly.', 'success');
        refreshUser();
        onBack();
      } else {
        showToast(data.message || 'Submission failed', 'error');
      }
    } catch (error) {
      showToast('Server connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (fetchingExisting) {
    return <div className="glass-panel p-4" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>Loading application data...</div>;
  }

  if (isPending) {
    return (
      <div className="glass-panel p-4" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>Application Pending</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          You have already submitted an upgrade request. Please wait for an administrator to review it.
        </p>
        <button className="btn btn-secondary" onClick={onBack}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="glass-panel p-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>{rejectedReason ? 'Resubmit Upgrade Request' : 'Upgrade to Service Provider'}</h2>
        <button className="btn btn-secondary" onClick={onBack}>Cancel</button>
      </div>

      {rejectedReason && (
        <div style={{ padding: '1rem', backgroundColor: 'var(--danger-glass)', color: 'white', border: '1px solid var(--danger)', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          <strong>Your previous application was rejected.</strong>
          <p style={{ marginTop: '0.5rem', opacity: 0.9 }}>Reason: {rejectedReason}</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>Please correct the issues in your application below and resubmit.</p>
        </div>
      )}

      {/* Steps Tracker */}
      <div className="steps-tracker">
        <div className={`step-node ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
          <div className="step-circle">1</div>
          <span className="step-label">General Info</span>
        </div>
        <div className={`step-node ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
          <div className="step-circle">2</div>
          <span className="step-label">Verification Docs</span>
        </div>
        <div className={`step-node ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
          <div className="step-circle">3</div>
          <span className="step-label">Confirm</span>
        </div>
      </div>

      {/* Step 1: General Business Information */}
      {step === 1 && (
        <div>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>General Business Profile</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Service Type *</label>
              <select className="form-input" value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                <option value="Individual">Individual Service Provider</option>
                <option value="Corporate">Corporate / Agency Service Provider</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Profile Photo *</label>
              <div className="file-upload-box">
                <input type="file" accept="image/*" style={{ display: 'none' }} id="profile-photo-file" onChange={(e) => handleFileConvert(e, setProfilePhoto)} />
                <label htmlFor="profile-photo-file" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  {profilePhoto ? <><CheckCircle size={16} color="var(--accent-primary)" /> Photo Selected (Click to change)</> : 'Upload Profile Photo'}
                </label>
              </div>
              {profilePhoto && <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}><img src={profilePhoto} alt="profile" style={{ height: '40px', width: '40px', objectFit: 'cover', borderRadius: '50%' }} /></div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }} className="grid-cols-2">
            {serviceType === 'Corporate' && (
              <div className="form-group">
                <label className="form-label">Business Name *</label>
                <input type="text" className="form-input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Pro Plumbing Handymen" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Business Email (Optional)</label>
              <input type="email" className="form-input" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} placeholder="e.g. contact@proplumbing.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Business Phone (Legacy)</label>
              <input type="text" className="form-input" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} placeholder="e.g. 0771122334" />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Number (Optional)</label>
              <input type="text" className="form-input" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="e.g. 0771122334" />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Business Description *</label>
            <textarea className="form-input" rows="3" required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detail your service background, expertise, and what makes you standout..." style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }} className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Primary Service Category *</label>
              <select className="form-input" required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">-- Select Category --</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.category_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Primary Subcategory *</label>
              <select className="form-input" required value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} disabled={!categoryId}>
                <option value="">-- Select Subcategory --</option>
                {subcategories.map((sub) => (
                  <option key={sub._id} value={sub._id}>{sub.sub_category_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Service Expertise (comma separated) *</label>
              <input type="text" className="form-input" value={serviceExpertise} onChange={(e) => setServiceExpertise(e.target.value)} placeholder="e.g. Pipe fixing, Drain cleaning" />
            </div>
            <div className="form-group">
              <label className="form-label">Warranty Details (Optional)</label>
              <input type="text" className="form-input" value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="e.g. 6 months parts warranty" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: '1rem', marginTop: '1rem' }} className="grid-cols-4">
            <div className="form-group">
              <label className="form-label">Address *</label>
              <input type="text" className="form-input" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 45 Galle Road" />
            </div>
            <div className="form-group">
              <label className="form-label">City *</label>
              <input type="text" className="form-input" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Colombo" />
            </div>
            <div className="form-group">
              <label className="form-label">Postal Code *</label>
              <input type="text" className="form-input" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="e.g. 00300" />
            </div>
            <div className="form-group">
              <label className="form-label">Working Cities (comma separated) (Optional)</label>
              <input type="text" className="form-input" value={workingCities} onChange={(e) => setWorkingCities(e.target.value)} placeholder="e.g. Colombo, Kandy" />
            </div>
          </div>

          <h4 style={{ margin: '1.5rem 0 0.75rem 0', color: 'var(--text-secondary)' }}>Social Links (Optional)</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
            <div className="form-group">
              <label className="form-label">Website</label>
              <input type="text" className="form-input" value={websiteLink} onChange={(e) => setWebsiteLink(e.target.value)} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label className="form-label">Facebook Page</label>
              <input type="text" className="form-input" value={facebookLink} onChange={(e) => setFacebookLink(e.target.value)} placeholder="https://facebook.com/..." />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button className="btn btn-primary" onClick={() => validateStep1() && setStep(2)}>
              Next Step: Upload Documents →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Documents Upload */}
      {step === 2 && (
        <div>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>Verification Documents & Schedule ({serviceType})</h3>

          {/* Schedule */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Working Hours (e.g. 9 AM - 6 PM)</label>
              <input type="text" className="form-input" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} />
            </div>
          </div>

          {/* Working Days */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Working Days</label>
            <div className="days-grid">
              {allDays.map((day) => (
                <div key={day} className="day-checkbox" onClick={() => toggleWorkingDay(day)} style={{ borderColor: workingDays.includes(day) ? 'var(--accent-primary)' : 'var(--border-glass)' }}>
                  <input type="checkbox" checked={workingDays.includes(day)} onChange={() => {}} />
                  <span>{day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Utility billing proof (Common) */}
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Utility Bill / Bank Statement (Proof of Billing Address) (Optional)</label>
            <div className="file-upload-box">
              <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} id="billing-file" onChange={(e) => handleFileConvert(e, setBillingProof)} />
              <label htmlFor="billing-file" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                {billingProof ? <><CheckCircle size={16} color="var(--accent-primary)" /> File Uploaded (Click to change)</> : 'Upload PDF or Image Document'}
              </label>
              {billingProof && <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Proof Loaded successfully.</div>}
            </div>
          </div>

          {/* Individual Specific Form Fields */}
          {serviceType === 'Individual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">NIC Number *</label>
                  <input type="text" className="form-input" value={nicNumber} onChange={(e) => setNicNumber(e.target.value)} placeholder="e.g. 199504506245" />
                </div>
                <div className="form-group">
                  <label className="form-label">Years of Experience *</label>
                  <input type="number" className="form-input" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} placeholder="e.g. 5" min="0" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Business Card (Optional)</label>
                  <div className="file-upload-box">
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} id="business-card-file" onChange={(e) => handleFileConvert(e, setBusinessCard)} />
                    <label htmlFor="business-card-file" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      {businessCard ? <><CheckCircle size={16} color="var(--accent-primary)" /> Card Selected (Click to change)</> : 'Upload PDF or Image'}
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Police Clearance Certificate / Police Report (Optional)</label>
                  <div className="file-upload-box">
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} id="police-report-file" onChange={(e) => handleFileConvert(e, setPoliceReport)} />
                    <label htmlFor="police-report-file" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      {policeReport ? <><CheckCircle size={16} color="var(--accent-primary)" /> Report Selected (Click to change)</> : 'Upload PDF or Image'}
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">NIC Front Photo (Optional)</label>
                  <div className="file-upload-box">
                    <input type="file" accept="image/*" style={{ display: 'none' }} id="nic-front-file" onChange={(e) => handleFileConvert(e, setNicFront)} />
                    <label htmlFor="nic-front-file" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      {nicFront ? <><CheckCircle size={16} color="var(--accent-primary)" /> Image Selected</> : 'Upload Image'}
                    </label>
                  </div>
                  {nicFront && <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}><img src={nicFront} alt="NIC front preview" style={{ maxHeight: '100px', objectFit: 'contain' }} /></div>}
                </div>
                <div className="form-group">
                  <label className="form-label">NIC Back Photo (Optional)</label>
                  <div className="file-upload-box">
                    <input type="file" accept="image/*" style={{ display: 'none' }} id="nic-back-file" onChange={(e) => handleFileConvert(e, setNicBack)} />
                    <label htmlFor="nic-back-file" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      {nicBack ? <><CheckCircle size={16} color="var(--accent-primary)" /> Image Selected</> : 'Upload Image'}
                    </label>
                  </div>
                  {nicBack && <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}><img src={nicBack} alt="NIC back preview" style={{ maxHeight: '100px', objectFit: 'contain' }} /></div>}
                </div>
              </div>

            </div>
          )}

          {/* Corporate Specific Form Fields */}
          {serviceType === 'Corporate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Text Fields Group 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Business Type *</label>
                  <input type="text" className="form-input" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. LLC, Sole Proprietorship" />
                </div>
                <div className="form-group">
                  <label className="form-label">Years in Industry *</label>
                  <input type="number" className="form-input" value={yearsInIndustry} onChange={(e) => setYearsInIndustry(e.target.value)} placeholder="e.g. 10" min="0" />
                </div>
              </div>

              {/* Text Fields Group 2 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Business Registration (BR) Number *</label>
                  <input type="text" className="form-input" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="e.g. PV-123456" />
                </div>
                <div className="form-group">
                  <label className="form-label">Corporate Tax ID / TIN (Optional)</label>
                  <input type="text" className="form-input" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="e.g. TIN-998877" />
                </div>
              </div>

              {/* File Uploads Group 1 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label">BR Document PDF/Image (Optional)</label>
                  <div className="file-upload-box">
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} id="br-doc-file" onChange={(e) => handleFileConvert(e, setRegDocument)} />
                    <label htmlFor="br-doc-file" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      {regDocument ? <><CheckCircle size={16} color="var(--accent-primary)" /> Document Selected</> : 'Upload PDF or Image'}
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Articles of Association / BR Form 1 (Optional)</label>
                  <div className="file-upload-box">
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} id="br-form1-file" onChange={(e) => handleFileConvert(e, setBrDocument)} />
                    <label htmlFor="br-form1-file" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      {brDocument ? <><CheckCircle size={16} color="var(--accent-primary)" /> Document Selected</> : 'Upload PDF or Image'}
                    </label>
                  </div>
                </div>
              </div>

            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              ← Back to Details
            </button>
            <button className="btn btn-primary" onClick={() => validateStep2() && setStep(3)}>
              Next Step: Review & Confirm →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review and Confirm */}
      {step === 3 && (
        <div>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-secondary)' }}>Review & Confirm Application</h3>

          <div className="glass-panel p-4" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <strong style={{ color: 'var(--text-secondary)' }}>Business Profile:</strong>
              <div style={{ fontSize: '1.15rem', fontWeight: '700', marginTop: '0.25rem' }}>
                {serviceType === 'Corporate' ? businessName : 'Individual Professional'} ({serviceType})
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={14} color="var(--accent-primary)" /> {businessEmail || 'N/A'} | <Phone size={14} color="var(--accent-primary)" /> {whatsappNumber || businessPhone}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Operating Address & Cities:</strong>
              <div style={{ marginTop: '0.25rem' }}>{address}, {city}, {postalCode}</div>
              {workingCities && <div style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>Working Cities: {workingCities}</div>}
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Service Expertise & Schedule:</strong>
              <div style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>
                Expertise: {serviceExpertise || 'N/A'}
              </div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.9rem' }}>
                {workingDays.join(', ')} | {workingHours}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Description:</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{description}</p>
            </div>

            {serviceType === 'Individual' ? (
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Personal Information & Documents:</strong>
                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <li>Years of Experience: {yearsOfExperience}</li>
                  <li>NIC Number: {nicNumber}</li>
                  {businessCard && <li>Business Card Loaded</li>}
                  {nicFront && <li>NIC Front Scan Loaded</li>}
                  {nicBack && <li>NIC Back Scan Loaded</li>}
                  {policeReport && <li>Police Clearance Certificate Loaded</li>}
                </ul>
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Corporate Information & Documents:</strong>
                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <li>Business Type: {businessType}</li>
                  <li>Years in Industry: {yearsInIndustry}</li>
                  <li>BR Registration: {regNumber}</li>
                  {regDocument && <li>BR Document loaded</li>}
                  {brDocument && <li>BR Form 1 / Articles of Association loaded</li>}
                  {taxId && <li>Corporate Tax ID: {taxId}</li>}
                </ul>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : (rejectedReason ? 'Resubmit Application' : 'Submit Application')}
          </button>
        </div>
        </div>
      )}
    </div>
  );
}
