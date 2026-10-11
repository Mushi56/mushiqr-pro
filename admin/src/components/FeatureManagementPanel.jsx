import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard, QrCode, ScanLine, Palette, Layers,
  Download, Package, Heart, ClipboardList, Cloud, Settings, User,
  Search, ChevronRight, ChevronLeft,
  ToggleLeft, ToggleRight, Check, X, AlertTriangle, Save,
  Lock, Info, CheckSquare, Square, MinusSquare,
  Cpu, Grid3x3, Barcode,
  CheckCircle, XCircle, Loader, AlertCircle, Crown,
  Type, Image, Sliders, Shield, Zap, Sparkles, Folder, FileSpreadsheet,
  Camera, Eye, Tag, FileText, Bookmark, Clock, RefreshCw, Smartphone
} from 'lucide-react';
import { FEATURE_REGISTRY, CATEGORY_SUBCATEGORIES, CANONICAL_PLANS, DEFAULT_FREE_FEATURES, DEFAULT_PAID_FEATURES } from '../services/FeatureAccessManager';
import { setFeatureFlagCloud, setPlanFeaturesCloud } from '../services/adminDataService';
import { db } from '../services/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';

const C={bg:'#09090f',bgEl:'#10101a',bgCard:'#14141e',sidebar:'#0c0c15',border:'rgba(255,255,255,0.06)',accent:'#EF1E34',purple:'#8b5cf6',green:'#10b981',orange:'#f59e0b',blue:'#3b82f6',red:'#ef4444',text:'#f0f0f8',textSec:'#8b8fa8',textMut:'#44465a'};

const CAT_META={
  QR_GENERATOR:      {icon:QrCode,color:'#EF1E34',name:'QR Code Generator'},
  BARCODE_GENERATOR: {icon:Barcode,color:'#3b82f6',name:'Barcode Generator'},
  BULK_GENERATOR:    {icon:Package,color:'#8b5cf6',name:'Bulk Generation'},
  SCANNER:           {icon:ScanLine,color:'#10b981',name:'Scanner'},
  HOME:              {icon:LayoutDashboard,color:'#f59e0b',name:'Home Screen'},
  SAVED:             {icon:Heart,color:'#ec4899',name:'Saved'},
  HISTORY:           {icon:ClipboardList,color:'#06b6d4',name:'History'},
  SETTINGS:          {icon:Settings,color:'#64748b',name:'Settings'},
};

const SUBCAT_META = {
  // QR Generator
  'Content':               { icon: Type, color: '#EF1E34' },
  'Color':                 { icon: Palette, color: '#8b5cf6' },
  'Style':                 { icon: Grid3x3, color: '#ec4899' },
  'Logo':                  { icon: Image, color: '#f59e0b' },
  'Template':              { icon: Sparkles, color: '#3b82f6' },
  'Text':                  { icon: Type, color: '#10b981' },
  'Save & Export':         { icon: Download, color: '#06b6d4' },
  'QR Engine':             { icon: Cpu, color: '#64748b' },

  // Barcode Generator
  '1D Standards':          { icon: Barcode, color: '#3b82f6' },
  '2D Standards':          { icon: Grid3x3, color: '#8b5cf6' },
  'Barcode Appearance':    { icon: Sliders, color: '#f59e0b' },
  'Export':                { icon: Download, color: '#06b6d4' },

  // Bulk Generator
  'Batch Screen':          { icon: Layers, color: '#8b5cf6' },
  'Input & Spreadsheet':   { icon: FileSpreadsheet, color: '#10b981' },
  'Batch Styling':         { icon: Palette, color: '#ec4899' },
  'Bulk Export':           { icon: Download, color: '#06b6d4' },

  // Scanner
  'Camera Lens':           { icon: Camera, color: '#10b981' },
  'Detection':             { icon: ScanLine, color: '#3b82f6' },
  'Scan Results':          { icon: CheckCircle, color: '#f59e0b' },

  // Home
  'Dashboard':             { icon: LayoutDashboard, color: '#f59e0b' },
  'Quick Actions':         { icon: Zap, color: '#EF1E34' },

  // Saved
  'Collection':            { icon: Bookmark, color: '#ec4899' },
  'Save / Remove':         { icon: Heart, color: '#EF1E34' },
  'Search & Filter':       { icon: Search, color: '#3b82f6' },

  // History
  'History View':          { icon: History, color: '#06b6d4' },
  'Automatic History':     { icon: RefreshCw, color: '#10b981' },
  'History Management':    { icon: Clock, color: '#8b5cf6' },

  // Settings
  'General & Theme':       { icon: Palette, color: '#8b5cf6' },
  'Storage':               { icon: Folder, color: '#ec4899' },
  'Cloud & Sync':          { icon: Cloud, color: '#3b82f6' },
  'Account & Security':    { icon: Shield, color: '#10b981' }
};

const PLAN_COLORS={free:'#8b8fa8',weekly:'#8b5cf6',monthly:'#f59e0b',yearly:'#EF1E34'};
const PLAN_LABELS={free:'Free',weekly:'Weekly',monthly:'Monthly',yearly:'Yearly'};

function PlanToggle({planId,checked,onChange,disabled}){
  const color=PLAN_COLORS[planId]||'#8b8fa8';
  return(
    <button onClick={()=>!disabled&&onChange(!checked)}
      title={disabled?'Security control':(checked?`Remove from ${PLAN_LABELS[planId]}`:`Add to ${PLAN_LABELS[planId]}`)}
      style={{display:'flex',alignItems:'center',gap:4,padding:'3px 9px',borderRadius:20,border:`1px solid ${checked?color+'66':C.border}`,background:checked?color+'18':'transparent',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.45:1,transition:'all 0.18s',fontSize:11,fontWeight:600,color:checked?color:C.textMut,fontFamily:'Outfit,sans-serif',flexShrink:0}}>
      {checked?<Check size={10}/>:<X size={10}/>}{PLAN_LABELS[planId]}
    </button>
  );
}

function GlobalToggle({enabled,onChange,disabled}){
  return(
    <button onClick={()=>!disabled&&onChange(!enabled)}
      title={disabled?'Security control':(enabled?'Disable globally':'Enable globally')}
      style={{display:'flex',alignItems:'center',gap:5,padding:'4px 12px',borderRadius:20,border:`1px solid ${enabled?C.green+'55':C.red+'44'}`,background:enabled?C.green+'15':C.red+'12',cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,transition:'all 0.2s',fontSize:12,fontWeight:700,color:enabled?C.green:C.red,fontFamily:'Outfit,sans-serif',whiteSpace:'nowrap'}}>
      {enabled?<><ToggleRight size={14}/>&nbsp;ON</>:<><ToggleLeft size={14}/>&nbsp;OFF</>}
    </button>
  );
}

export default function FeatureManagementPanel({initialPlanFilter=null}){
  const [selectedCat,setSelectedCat]=useState(null);
  const [selectedSubcat,setSelectedSubcat]=useState(null);
  const [mobileNav,setMobileNav]=useState('categories');
  const [search,setSearch]=useState('');
  const [planFilt,setPlanFilt]=useState(initialPlanFilter||'all');
  const [statFilt,setStatFilt]=useState('all');
  const [liveFlags,setLiveFlags]=useState({});
  const [livePlans,setLivePlans]=useState({});
  const [loading,setLoading]=useState(true);
  const [pendingFlags,setPendingFlags]=useState({});
  const [pendingPlans,setPendingPlans]=useState({});
  const [isSaving,setIsSaving]=useState(false);
  const [saveResult,setSaveResult]=useState(null);
  const [drawerFeature,setDrawerFeature]=useState(null);
  const [bulkSelected,setBulkSelected]=useState(new Set());
  const [bulkConfirm,setBulkConfirm]=useState(null);
  const [isMobile,setIsMobile]=useState(window.innerWidth<900);

  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<900);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[]);

  useEffect(()=>{
    let u1,u2;
    try{u1=onSnapshot(doc(db,'global_config','featureFlags'),s=>{setLiveFlags(s.exists()?s.data():{});setLoading(false);},()=>setLoading(false));}catch{setLoading(false);}
    try{u2=onSnapshot(collection(db,'subscription_plans'),col=>{const p={};col.forEach(d=>{p[d.id]=d.data();});setLivePlans(p);},()=>{});}catch{}
    return()=>{u1?.();u2?.();};
  },[]);

  const effectiveFlags=useMemo(()=>({...liveFlags,...pendingFlags}),[liveFlags,pendingFlags]);
  const effectivePlans=useMemo(()=>{
    const m={};
    CANONICAL_PLANS.forEach(p=>{
      if(pendingPlans[p]!==undefined)m[p]=pendingPlans[p];
      else if(livePlans[p]?.features)m[p]=livePlans[p].features;
      else m[p]=p==='free'?[...DEFAULT_FREE_FEATURES]:[...DEFAULT_PAID_FEATURES];
    });
    return m;
  },[livePlans,pendingPlans]);
  const hasUnsaved=useMemo(()=>Object.keys(pendingFlags).length>0||Object.keys(pendingPlans).length>0,[pendingFlags,pendingPlans]);
  const getGlobalEnabled=useCallback((fId,def)=>{const v=effectiveFlags[fId];return v!==undefined?Boolean(v):(def!==false);},[effectiveFlags]);
  const getPlanEnabled=useCallback((pId,fId)=>effectivePlans[pId]?.includes(fId)??false,[effectivePlans]);
  const toggleGlobal=useCallback((feat,value)=>{
    setPendingFlags(p=>({...p,[feat.featureId]:value}));
    setSaveResult(null);
    if(typeof FeatureAccessManager?.setLocalFlagOverride==='function'){
      FeatureAccessManager.setLocalFlagOverride(feat.featureId,value);
    }
  },[]);
  const togglePlan=useCallback((pId,feat,value)=>{
    setPendingPlans(p=>{
      const cur=p[pId]!==undefined?[...p[pId]]:(livePlans[pId]?.features?[...livePlans[pId].features]:pId==='free'?[...DEFAULT_FREE_FEATURES]:[...DEFAULT_PAID_FEATURES]);
      return{...p,[pId]:value?[...new Set([...cur,feat.featureId])]:cur.filter(id=>id!==feat.featureId)};
    });setSaveResult(null);
  },[livePlans]);

  const handleSave=useCallback(async()=>{
    setIsSaving(true);setSaveResult(null);
    try{
      let hadError = false;
      let errorMsg = '';
      for(const[fId,val]of Object.entries(pendingFlags)){
        const res = await setFeatureFlagCloud(fId,val);
        if(!res.ok){ hadError = true; errorMsg = res.error; }
      }
      for(const[pId,feats]of Object.entries(pendingPlans)){
        const res = await setPlanFeaturesCloud(pId,feats);
        if(!res.ok){ hadError = true; errorMsg = res.error; }
      }
      if(hadError){
        setSaveResult({ok:false,msg:errorMsg||'Failed to save some features to Firebase'});
      } else {
        setPendingFlags({});setPendingPlans({});
        setSaveResult({ok:true,msg:'Changes saved to Firebase successfully'});
        setTimeout(()=>setSaveResult(null),4000);
      }
    }catch(e){setSaveResult({ok:false,msg:e?.message||'Failed to save changes'});}
    setIsSaving(false);
  },[pendingFlags,pendingPlans]);
  const handleDiscard=useCallback(()=>{setPendingFlags({});setPendingPlans({});setSaveResult(null);},[]);

  const filteredFeatures=useMemo(()=>{
    let list=FEATURE_REGISTRY;
    if(selectedCat&&!search){list=list.filter(f=>f.category===selectedCat);if(selectedSubcat)list=list.filter(f=>(f.subcategory||'General')===selectedSubcat);}
    if(search.trim()){const q=search.toLowerCase();list=list.filter(f=>f.displayName.toLowerCase().includes(q)||f.featureId.toLowerCase().includes(q)||(f.description||'').toLowerCase().includes(q)||(CAT_META[f.category]?.name||'').toLowerCase().includes(q)||(f.subcategory||'').toLowerCase().includes(q));}
    if(statFilt!=='all')list=list.filter(f=>{const en=getGlobalEnabled(f.featureId,f.defaultEnabled);return statFilt==='enabled'?en:!en;});
    if(planFilt!=='all')list=list.filter(f=>getPlanEnabled(planFilt,f.featureId));
    return list;
  },[selectedCat,selectedSubcat,search,statFilt,planFilt,getGlobalEnabled,getPlanEnabled]);

  const catStats=useMemo(()=>{
    const s={};
    Object.keys(CAT_META).forEach(c=>{const feats=FEATURE_REGISTRY.filter(f=>f.category===c);s[c]={total:feats.length,enabled:feats.filter(f=>getGlobalEnabled(f.featureId,f.defaultEnabled)).length};});
    return s;
  },[getGlobalEnabled]);

  const subcatStats=useMemo(()=>{
    if(!selectedCat)return{};
    const s={};
    (CATEGORY_SUBCATEGORIES[selectedCat]||[]).forEach(sc=>{const feats=FEATURE_REGISTRY.filter(f=>f.category===selectedCat&&(f.subcategory||'General')===sc);s[sc]={total:feats.length,enabled:feats.filter(f=>getGlobalEnabled(f.featureId,f.defaultEnabled)).length};});
    return s;
  },[selectedCat,getGlobalEnabled]);

  const visibleIds=filteredFeatures.map(f=>f.featureId);
  const allSelected=visibleIds.length>0&&visibleIds.every(id=>bulkSelected.has(id));
  const someSelected=visibleIds.some(id=>bulkSelected.has(id));
  const toggleSelectAll=()=>{if(allSelected)setBulkSelected(s=>{const ns=new Set(s);visibleIds.forEach(id=>ns.delete(id));return ns;});else setBulkSelected(s=>{const ns=new Set(s);visibleIds.forEach(id=>ns.add(id));return ns;});};

  const executeBulkAction=useCallback((action)=>{
    [...bulkSelected].forEach(fId=>{
      const feat=FEATURE_REGISTRY.find(f=>f.featureId===fId);if(!feat)return;
      if(action==='enable')toggleGlobal(feat,true);
      else if(action==='disable')toggleGlobal(feat,false);
      else if(action.startsWith('add_'))togglePlan(action.replace('add_',''),feat,true);
      else if(action.startsWith('rem_'))togglePlan(action.replace('rem_',''),feat,false);
    });
    setBulkSelected(new Set());setBulkConfirm(null);
  },[bulkSelected,toggleGlobal,togglePlan]);

  const selectCategory=(cId)=>{
    setSelectedCat(cId);
    setSelectedSubcat(null); // Default to showing all features of the selected category
    setSearch('');
    setBulkSelected(new Set());
    setMobileNav('features');
  };
  const selectSubcat=(sc)=>{
    setSelectedSubcat(sc);
    setBulkSelected(new Set());
    setMobileNav('features');
  };
  const showCats=true;
  const showSubcats=!!selectedCat&&!search;
  const showFeats=true;

  return(
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:C.bg,fontFamily:'Outfit,sans-serif',position:'relative'}}>
      <style>{`
        @keyframes fmpSlideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fmpDrawerIn{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fmp-cat:hover{background:rgba(255,255,255,0.04)!important}
        .fmp-sub:hover{background:rgba(255,255,255,0.04)!important}
        .fmp-card:hover{border-color:rgba(255,255,255,0.12)!important;background:#1a1a2a!important}
        .fmp-sc::-webkit-scrollbar{width:4px}
        .fmp-sc::-webkit-scrollbar-track{background:transparent}
        .fmp-sc::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
      `}</style>

      {hasUnsaved&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'10px 20px',background:'rgba(245,158,11,0.1)',borderBottom:'1px solid rgba(245,158,11,0.2)',animation:'fmpSlideIn 0.2s ease',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <AlertTriangle size={14} color={C.orange}/>
            <span style={{fontSize:13,fontWeight:600,color:C.orange}}>You have unsaved changes</span>
            <span style={{fontSize:12,color:C.textSec}}>({Object.keys(pendingFlags).length} flag{Object.keys(pendingFlags).length!==1?'s':''}, {Object.keys(pendingPlans).length} plan{Object.keys(pendingPlans).length!==1?'s':''})</span>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={handleDiscard} disabled={isSaving} style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.textSec,fontSize:12,fontWeight:600,cursor:'pointer'}}>Discard</button>
            <button onClick={handleSave} disabled={isSaving} style={{padding:'6px 16px',borderRadius:8,border:'none',background:isSaving?'#666':C.orange,color:'#fff',fontSize:12,fontWeight:700,cursor:isSaving?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:6}}>
              {isSaving?<><Loader size={12} style={{animation:'spin 1s linear infinite'}}/>&nbsp;Saving...</>:<><Save size={12}/>&nbsp;Save Changes</>}
            </button>
          </div>
        </div>
      )}

      {saveResult&&!hasUnsaved&&(
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 20px',background:saveResult.ok?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)',borderBottom:`1px solid ${saveResult.ok?'rgba(16,185,129,0.2)':'rgba(239,68,68,0.2)'}`,animation:'fmpSlideIn 0.2s ease'}}>
          {saveResult.ok?<CheckCircle size={14} color={C.green}/>:<XCircle size={14} color={C.red}/>}
          <span style={{fontSize:13,fontWeight:600,color:saveResult.ok?C.green:C.red}}>{saveResult.ok?String.fromCharCode(10003)+' ':String.fromCharCode(10005)+' '}{saveResult.msg}</span>
        </div>
      )}

      {/* Decluttered Top Toolbar: Search + Dropdown Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        borderBottom: `1px solid ${C.border}`,
        background: C.bgEl,
        flexWrap: 'wrap'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 160 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMut }} />
          <input
            type="text"
            placeholder="Search features by name, ID or keyword..."
            value={search}
            onChange={e => { setSearch(e.target.value); }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '7px 12px 7px 32px',
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              color: C.text,
              fontSize: 12,
              fontFamily: 'Outfit,sans-serif',
              outline: 'none'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMut, padding: 0 }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Clean Compact Filter: Status */}
        <div style={{ display: 'flex', alignItems: 'center', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: '2px', gap: 2 }}>
          {[['all', 'All Status'], ['enabled', 'Enabled'], ['disabled', 'Disabled']].map(([v, l]) => {
            const isSel = statFilt === v;
            return (
              <button
                key={v}
                onClick={() => setStatFilt(v)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: isSel ? 700 : 500,
                  border: 'none',
                  background: isSel ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: isSel ? C.text : C.textSec,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {l}
              </button>
            );
          })}
        </div>

        {/* Clean Compact Filter: Plan Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select
            value={planFilt}
            onChange={e => setPlanFilt(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              color: planFilt === 'all' ? C.textSec : (PLAN_COLORS[planFilt] || C.text),
              fontSize: 11,
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Plans (Access)</option>
            {CANONICAL_PLANS.map(p => (
              <option key={p} value={p}>{PLAN_LABELS[p]} Plan Only</option>
            ))}
          </select>
        </div>
      </div>

      {/* â”€â”€â”€ Horizontal Row Categories Bar â”€â”€â”€ */}
      {!search && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          borderBottom: `1px solid ${C.border}`,
          background: C.sidebar,
          padding: '10px 16px',
          gap: 10
        }}>
          {/* Top Row Header & Quick Stats */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.textMut, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              Categories (Row View)
            </span>
            {selectedCat && (
              <button
                onClick={() => { setSelectedCat(null); setSelectedSubcat(null); }}
                style={{ background: 'none', border: 'none', color: C.accent, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                View All Categories ({FEATURE_REGISTRY.length} features)
              </button>
            )}
          </div>

          {/* Row of Category Buttons/Cards (Horizontal scroll / wrapping flex) */}
          <div className="fmp-sc" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            overflowX: 'auto',
            paddingBottom: 4,
            WebkitOverflowScrolling: 'touch'
          }}>
            {/* "All" Category Pill */}
            <button
              onClick={() => { setSelectedCat(null); setSelectedSubcat(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 12,
                border: `1.5px solid ${selectedCat === null ? C.accent : C.border}`,
                background: selectedCat === null ? 'rgba(239, 30, 52,0.14)' : C.bgCard,
                color: selectedCat === null ? C.text : C.textSec,
                fontSize: 13,
                fontWeight: selectedCat === null ? 800 : 600,
                cursor: 'pointer',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s'
              }}
            >
              <Layers size={16} color={selectedCat === null ? C.accent : C.textMut} />
              <span>All Categories</span>
              <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', color: C.textSec }}>
                {FEATURE_REGISTRY.length}
              </span>
            </button>

            {/* Individual 8 Categories as Horizontal Row Items */}
            {Object.keys(CAT_META).map(cId => {
              const m = CAT_META[cId];
              const Icon = m.icon;
              const st = catStats[cId] || { total: 0, enabled: 0 };
              const act = selectedCat === cId;
              return (
                <button
                  key={cId}
                  className="fmp-cat"
                  onClick={() => selectCategory(cId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 16px',
                    borderRadius: 12,
                    border: `1.5px solid ${act ? m.color : C.border}`,
                    background: act ? `${m.color}20` : C.bgCard,
                    cursor: 'pointer',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: act ? m.color + '30' : 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                    <Icon size={15} color={act ? m.color : C.textMut} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: act ? 800 : 600, color: act ? C.text : C.textSec }}>
                    {m.name}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 8,
                    background: st.enabled === st.total ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                    color: st.enabled === st.total ? C.green : C.orange
                  }}>
                    {st.enabled}/{st.total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* If a category is selected, show its subcategories as a secondary sub-row */}
          {selectedCat && (CATEGORY_SUBCATEGORIES[selectedCat] || []).length > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              overflowX: 'auto',
              paddingTop: 8,
              paddingBottom: 4,
              borderTop: `1px dashed ${C.border}`,
              WebkitOverflowScrolling: 'touch'
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: C.textMut, marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Subcategories:
              </span>
              <button
                onClick={() => setSelectedSubcat(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 10,
                  border: `1px solid ${selectedSubcat === null ? (CAT_META[selectedCat]?.color || C.accent) + '88' : C.border}`,
                  background: selectedSubcat === null ? (CAT_META[selectedCat]?.color || C.accent) + '22' : 'rgba(255,255,255,0.03)',
                  color: selectedSubcat === null ? C.text : C.textSec,
                  fontSize: 12,
                  fontWeight: selectedSubcat === null ? 800 : 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s'
                }}
              >
                <Grid3x3 size={13} color={selectedSubcat === null ? (CAT_META[selectedCat]?.color || C.accent) : C.textMut} />
                <span>All {CAT_META[selectedCat]?.name}</span>
              </button>
              {(CATEGORY_SUBCATEGORIES[selectedCat] || []).map(sc => {
                const isSubAct = selectedSubcat === sc;
                const meta = SUBCAT_META[sc] || { icon: Tag, color: CAT_META[selectedCat]?.color || C.accent };
                const SubIcon = meta.icon;
                const subColor = meta.color || CAT_META[selectedCat]?.color || C.accent;
                return (
                  <button
                    key={sc}
                    onClick={() => selectSubcat(sc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 10,
                      border: `1px solid ${isSubAct ? subColor + '88' : C.border}`,
                      background: isSubAct ? subColor + '22' : 'rgba(255,255,255,0.03)',
                      color: isSubAct ? C.text : C.textSec,
                      fontSize: 12,
                      fontWeight: isSubAct ? 800 : 600,
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.15s'
                    }}
                  >
                    <SubIcon size={13} color={isSubAct ? subColor : C.textMut} />
                    <span>{sc}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€â”€ Main Content Area â”€â”€â”€ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {showFeats && (
          <div className="fmp-sc" style={{flex:1,overflowY:'auto',padding:'14px 14px 120px 14px',minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,gap:8,flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                {isMobile&&!search&&<button onClick={()=>setMobileNav('subcategories')} style={{background:'none',border:'none',cursor:'pointer',color:C.textSec,padding:'3px 0',display:'flex',alignItems:'center',gap:4,fontSize:12}}><ChevronLeft size={13}/>Back</button>}
                {search?<span style={{fontSize:13,color:C.textSec}}>Results for <strong style={{color:C.text}}>"{search}"</strong></span>
                  :selectedCat?<><span style={{fontSize:13,color:C.textSec}}>{CAT_META[selectedCat]?.name}</span>{selectedSubcat&&<><ChevronRight size={11} color={C.textMut}/><span style={{fontSize:13,color:C.text,fontWeight:600}}>{selectedSubcat}</span></>}</>
                  :<span style={{fontSize:13,color:C.textSec}}>All Features</span>}
              </div>
              <span style={{fontSize:11,color:C.textMut}}>
                {filteredFeatures.length} feature{filteredFeatures.length!==1?'s':''} &middot; <span style={{color:C.green}}>{filteredFeatures.filter(f=>getGlobalEnabled(f.featureId,f.defaultEnabled)).length} enabled</span>
                {' '}&middot;{' '}<span style={{color:C.red}}>{filteredFeatures.filter(f=>!getGlobalEnabled(f.featureId,f.defaultEnabled)).length} restricted</span>
              </span>
            </div>

            {bulkSelected.size>0&&(
              <div style={{display:'flex',alignItems:'center',gap:7,padding:'9px 13px',background:C.purple+'15',border:`1px solid ${C.purple}33`,borderRadius:10,marginBottom:12,flexWrap:'wrap',animation:'fmpSlideIn 0.2s ease'}}>
                <span style={{fontSize:12,fontWeight:700,color:C.purple,marginRight:3}}>{bulkSelected.size} selected</span>
                {[['enable','Enable Globally',C.green],['disable','Disable Globally',C.red],...CANONICAL_PLANS.map(p=>[`add_${p}`,`+ ${PLAN_LABELS[p]}`,PLAN_COLORS[p]]),...CANONICAL_PLANS.map(p=>[`rem_${p}`,`- ${PLAN_LABELS[p]}`,PLAN_COLORS[p]])].map(([action,label,color])=>(
                  <button key={action} onClick={()=>setBulkConfirm({action,label})} style={{padding:'3px 9px',borderRadius:6,border:`1px solid ${color}44`,background:color+'15',color,fontSize:11,fontWeight:600,cursor:'pointer'}}>{label}</button>
                ))}
                <button onClick={()=>setBulkSelected(new Set())} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:C.textMut}}><X size={13}/></button>
              </div>
            )}

            {filteredFeatures.length>1&&(
              <div style={{marginBottom:10}}>
                <button onClick={toggleSelectAll} style={{background:'none',border:'none',cursor:'pointer',color:C.textMut,display:'flex',alignItems:'center',gap:6,fontSize:11}}>
                  {allSelected?<CheckSquare size={13} color={C.purple}/>:someSelected?<MinusSquare size={13} color={C.purple}/>:<Square size={13}/>}
                  <span>{allSelected?'Deselect all':'Select all visible'}</span>
                </button>
              </div>
            )}

            {loading&&[1,2,3].map(i=>(
              <div key={i} style={{padding:14,borderRadius:12,border:`1px solid ${C.border}`,background:C.bgCard,marginBottom:10}}>
                <div style={{height:13,borderRadius:5,background:'linear-gradient(90deg,#14141e 25%,#1c1c2a 50%,#14141e 75%)',width:'60%',marginBottom:8}}/>
                <div style={{height:10,borderRadius:5,background:'linear-gradient(90deg,#14141e 25%,#1c1c2a 50%,#14141e 75%)',width:'40%'}}/>
              </div>
            ))}

            {!loading&&filteredFeatures.length===0&&(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px',color:C.textMut}}>
                <Search size={38} style={{marginBottom:10,opacity:0.3}}/>
                <div style={{fontSize:14,fontWeight:600}}>No features found</div>
                <div style={{fontSize:12,marginTop:4}}>Adjust search or filters</div>
              </div>
            )}

            {!loading&&filteredFeatures.length>0&&(
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))',gap:10}}>
                {filteredFeatures.map(feat=>{
                  const gOn=getGlobalEnabled(feat.featureId,feat.defaultEnabled);
                  const cm=CAT_META[feat.category]||{};
                  const locked=!feat.allowSuperAdminOverride;
                  const sel=bulkSelected.has(feat.featureId);
                  const hasFlagChange=pendingFlags[feat.featureId]!==undefined;
                  const hasPlanChange=CANONICAL_PLANS.some(p=>pendingPlans[p]!==undefined);
                  const changed=hasFlagChange||hasPlanChange;
                  return(
                    <div key={feat.featureId} className="fmp-card" style={{background:sel?C.purple+'10':C.bgCard,border:`1px solid ${sel?C.purple+'44':changed?C.orange+'33':C.border}`,borderRadius:12,padding:13,transition:'all 0.18s',position:'relative'}}>
                      {changed&&<div style={{position:'absolute',top:10,right:10,width:6,height:6,borderRadius:'50%',background:C.orange}} title="Unsaved"/>}
                      <div style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:7}}>
                        <button onClick={()=>setBulkSelected(s=>{const ns=new Set(s);sel?ns.delete(feat.featureId):ns.add(feat.featureId);return ns;})}
                          style={{background:'none',border:'none',cursor:'pointer',color:sel?C.purple:C.textMut,padding:'2px 0',flexShrink:0,marginTop:2}}>
                          {sel?<CheckSquare size={13}/>:<Square size={13}/>}
                        </button>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                            <span style={{fontSize:13,fontWeight:700,color:C.text}}>{feat.displayName}</span>
                            {!getPlanEnabled('free', feat.featureId) && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                color: '#000',
                                padding: '1px 5px',
                                borderRadius: 6,
                                fontSize: 9,
                                fontWeight: 800,
                                boxShadow: '0 2px 6px rgba(255,170,0,0.35)',
                                border: '1px solid rgba(255,255,255,0.4)'
                              }}>
                                <Crown size={9} fill="#000" color="#000" strokeWidth={2.5}/> PAID
                              </span>
                            )}
                            {locked&&<Lock size={9} color={C.orange} title="Security control"/>}
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:5,marginTop:2,flexWrap:'wrap'}}>
                            <code style={{fontSize:10,color:C.textMut,background:'rgba(255,255,255,0.05)',padding:'1px 5px',borderRadius:4}}>{feat.featureId}</code>
                            {cm.color&&<span style={{fontSize:10,color:cm.color,fontWeight:600}}>{cm.name}</span>}
                            {feat.subcategory&&<><span style={{fontSize:10,color:C.textMut}}>â€º</span><span style={{fontSize:10,color:C.textMut}}>{feat.subcategory}</span></>}
                          </div>
                        </div>
                        <GlobalToggle enabled={gOn} onChange={v=>toggleGlobal(feat,v)} disabled={locked}/>
                      </div>
                      {feat.description&&<p style={{fontSize:11,color:C.textSec,margin:'0 0 9px 21px',lineHeight:1.5}}>{feat.description}</p>}
                      <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap',marginLeft:21}}>
                        <span style={{fontSize:10,color:C.textMut,fontWeight:600}}>Plans:</span>
                        {CANONICAL_PLANS.map(pId=>(
                          <PlanToggle key={pId} planId={pId} checked={getPlanEnabled(pId,feat.featureId)} onChange={v=>togglePlan(pId,feat,v)} disabled={locked||!gOn}/>
                        ))}
                        <button onClick={()=>setDrawerFeature(feat)} style={{marginLeft:'auto',background:'none',border:`1px solid ${C.border}`,borderRadius:6,padding:'2px 7px',cursor:'pointer',fontSize:10,color:C.textMut,transition:'all 0.15s'}}>Details</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {drawerFeature&&(
          <FeatureDrawer feat={drawerFeature} globalEnabled={getGlobalEnabled(drawerFeature.featureId,drawerFeature.defaultEnabled)} planEnabled={pId=>getPlanEnabled(pId,drawerFeature.featureId)} onGlobalToggle={v=>toggleGlobal(drawerFeature,v)} onPlanToggle={(pId,v)=>togglePlan(pId,drawerFeature,v)} onClose={()=>setDrawerFeature(null)}/>
        )}
      </div>

      {bulkConfirm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setBulkConfirm(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#1a1a2e',border:`1px solid ${C.border}`,borderRadius:16,padding:28,maxWidth:380,width:'90%',animation:'fmpSlideIn 0.2s ease'}}>
            <AlertTriangle size={26} color={C.orange} style={{marginBottom:10}}/>
            <h3 style={{color:C.text,margin:'0 0 8px',fontSize:15}}>Confirm Bulk Action</h3>
            <p style={{color:C.textSec,fontSize:13,margin:'0 0 20px'}}>Apply "<strong>{bulkConfirm.label}</strong>" to <strong>{bulkSelected.size}</strong> feature{bulkSelected.size!==1?'s':''}?</p>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={()=>setBulkConfirm(null)} style={{padding:'8px 18px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.textSec,cursor:'pointer',fontSize:13}}>Cancel</button>
              <button onClick={()=>executeBulkAction(bulkConfirm.action)} style={{padding:'8px 18px',borderRadius:8,border:'none',background:C.accent,color:'#fff',cursor:'pointer',fontSize:13,fontWeight:700}}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureDrawer({feat,globalEnabled,planEnabled,onGlobalToggle,onPlanToggle,onClose}){
  const cm=CAT_META[feat.category]||{};
  const locked=!feat.allowSuperAdminOverride;
  const Icon=cm.icon;
  return(
    <div style={{position:'fixed',top:0,right:0,bottom:0,width:340,maxWidth:'90vw',background:'#0f0f1a',borderLeft:'1px solid rgba(255,255,255,0.08)',boxShadow:'-20px 0 60px rgba(0,0,0,0.5)',zIndex:1000,overflowY:'auto',animation:'fmpDrawerIn 0.25s ease',fontFamily:'Outfit,sans-serif'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',position:'sticky',top:0,background:'#0f0f1a',zIndex:10}}>
        <div style={{fontSize:13,fontWeight:700,color:'#f0f0f8'}}>Feature Details</div>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'#44465a'}}><X size={17}/></button>
      </div>
      <div style={{padding:18}}>
        <h2 style={{margin:'0 0 5px',fontSize:15,color:'#f0f0f8',fontWeight:700}}>{feat.displayName}</h2>
        <code style={{fontSize:10,color:'#44465a',background:'rgba(255,255,255,0.06)',padding:'2px 7px',borderRadius:4}}>{feat.featureId}</code>
        <div style={{display:'flex',alignItems:'center',gap:6,margin:'14px 0',padding:'7px 11px',background:cm.color+'10',borderRadius:8,border:`1px solid ${cm.color}22`}}>
          {Icon&&<div style={{width:20,height:20,borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',background:cm.color+'20'}}><Icon size={11} color={cm.color}/></div>}
          <span style={{fontSize:12,color:cm.color,fontWeight:600}}>{cm.name}</span>
          {feat.subcategory&&<><ChevronRight size={10} color={'#44465a'}/><span style={{fontSize:12,color:'#8b8fa8'}}>{feat.subcategory}</span></>}
        </div>
        {feat.description&&<p style={{fontSize:12,color:'#8b8fa8',margin:'0 0 16px',lineHeight:1.6}}>{feat.description}</p>}
        <div style={{display:'flex',flexDirection:'column',gap:7,marginBottom:18}}>
          {[['Default Plan',feat.defaultPlan?(feat.defaultPlan.charAt(0).toUpperCase()+feat.defaultPlan.slice(1)):'â€”'],['Requires Auth',feat.requiresAuthentication?'Yes':'No'],['Super Admin Override',feat.allowSuperAdminOverride?'Allowed':'Locked (Security)']].map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <span style={{fontSize:11,color:'#44465a'}}>{k}</span>
              <span style={{fontSize:11,color:'#8b8fa8',fontWeight:600}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{marginBottom:16,padding:13,borderRadius:10,background:'#14141e',border:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div><div style={{fontSize:12,fontWeight:700,color:'#f0f0f8'}}>Global Status</div><div style={{fontSize:10,color:'#44465a'}}>Overrides all plan access</div></div>
            <GlobalToggle enabled={globalEnabled} onChange={onGlobalToggle} disabled={locked}/>
          </div>
          {!globalEnabled&&<div style={{display:'flex',alignItems:'center',gap:5,padding:'5px 9px',background:'rgba(239,68,68,0.12)',borderRadius:6,border:'1px solid rgba(239,68,68,0.22)'}}><AlertCircle size={10} color={'#ef4444'}/><span style={{fontSize:10,color:'#ef4444'}}>OFF for ALL users globally</span></div>}
          {locked&&<div style={{display:'flex',alignItems:'center',gap:5,padding:'5px 9px',background:'rgba(245,158,11,0.12)',borderRadius:6,border:'1px solid rgba(245,158,11,0.22)',marginTop:5}}><Lock size={10} color={'#f59e0b'}/><span style={{fontSize:10,color:'#f59e0b'}}>Security control â€” cannot be remotely disabled</span></div>}
        </div>
        <div style={{padding:13,borderRadius:10,background:'#14141e',border:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{fontSize:12,fontWeight:700,color:'#f0f0f8',marginBottom:10}}>Plan Access</div>
          {CANONICAL_PLANS.map(pId=>{
            const on=planEnabled(pId);const pc=PLAN_COLORS[pId];
            return(
              <div key={pId} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                <div style={{display:'flex',alignItems:'center',gap:7}}><div style={{width:7,height:7,borderRadius:'50%',background:pc}}/><span style={{fontSize:12,color:'#8b8fa8',fontWeight:600}}>{PLAN_LABELS[pId]}</span></div>
                <PlanToggle planId={pId} checked={on} onChange={v=>onPlanToggle(pId,v)} disabled={locked||!globalEnabled}/>
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:5,marginTop:14,padding:'7px 11px',background:'rgba(59,130,246,0.08)',borderRadius:7,border:'1px solid rgba(59,130,246,0.15)'}}>
          <Info size={11} color={'#3b82f6'}/>
          <span style={{fontSize:11,color:'#8b8fa8'}}>Changes show in the unsaved banner. Click Save Changes to apply.</span>
        </div>
      </div>
    </div>
  );
}
