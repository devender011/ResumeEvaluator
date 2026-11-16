import { useEffect, useRef, useState } from 'react';
import { Check, FileText, FileUp, LoaderCircle, RotateCcw, Sparkles, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const EMPTY_CRITERIA = { role: '', skills: '', experience: '', scoring: '' };

function getSavedCriteria() {
  try {
    const saved = sessionStorage.getItem('resumeLensCriteria');
    if (!saved) return EMPTY_CRITERIA;
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' ? { ...EMPTY_CRITERIA, ...parsed } : EMPTY_CRITERIA;
  } catch {
    return EMPTY_CRITERIA;
  }
}

function formatCriteria(fields) {
  return [
    `Role: ${fields.role.trim()}`,
    `Skills and requirements: ${fields.skills.trim()}`,
    `Experience scope: ${fields.experience.trim()}`,
    fields.scoring.trim()
      ? `Scoring rubric: ${fields.scoring.trim()}`
      : 'Score overall fit out of 100 based on the role, skills, and experience criteria above.',
  ].join('\n');
}

function App() {
  const [file, setFile] = useState(null);
  const [criteriaFields, setCriteriaFields] = useState(getSavedCriteria);
  const [textPreview, setTextPreview] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const criteriaText = formatCriteria(criteriaFields);
  const criteriaReady = Boolean(criteriaFields.role.trim() && criteriaFields.skills.trim() && criteriaFields.experience.trim() && criteriaText.length <= 5000);

  useEffect(() => {
    try {
      sessionStorage.setItem('resumeLensCriteria', JSON.stringify(criteriaFields));
    } catch {}
  }, [criteriaFields]);

  useEffect(() => {
    if (!file || (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf'))) {
      setPdfUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function selectFile(nextFile) {
    setError('');
    setAnalysis(null);
    setTextPreview('');
    if (!nextFile) return;
    const extension = nextFile.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'txt'].includes(extension)) {
      setFile(null);
      setError('Choose a PDF or plain text file.');
      return;
    }
    if (nextFile.size > 2 * 1024 * 1024) {
      setFile(null);
      setError('This file is larger than 2 MB.');
      return;
    }
    setFile(nextFile);
    if (extension === 'txt') setTextPreview(await nextFile.text());
  }

  function dropFile(event) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  async function analyze() {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setAnalysis(null);
    try {
      const body = new FormData();
      body.append('file', file);
      body.append('criteria', criteriaText);
      const response = await fetch(`${API_URL}/api/analyze`, { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Analysis could not be completed.');
      setTextPreview(data.extracted_text);
      setAnalysis(data.analysis);
    } catch (reason) {
      setError(reason.message || 'Could not reach the analyzer. Check that the backend is running.');
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null);
    setTextPreview('');
    setAnalysis(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <main className="main-area">
      <header className="topbar">
        <a className="header-brand" href="#top"><span><Sparkles size={16} /></span> Resume Lens</a>
      </header>

      <div className="content-wrap">
        <section className="intro">
          <div className="eyebrow"><span /> SMARTER SCREENING, STARTS HERE</div>
          <h1>Find the signal<br />in every <em>resume.</em></h1>
          <p className="intro-copy">Add your evaluation criteria, then upload a resume for a focused review.</p>
        </section>

        <section className="workspace-grid">
          <div className="left-column">
            <div className="panel upload-panel">
              <div className="panel-heading"><div><span className="step-tag">01</span><h2>Role criteria &amp; resume</h2></div><span className="file-types">PDF or TXT · up to 2 MB</span></div>
              <div className="criteria-fields">
                <div className="criteria-field"><label htmlFor="role">Role <span>REQUIRED</span></label><input id="role" value={criteriaFields.role} maxLength={300} placeholder="e.g. Junior AI Engineer" onChange={(event) => setCriteriaFields({ ...criteriaFields, role: event.target.value })} /></div>
                <div className="criteria-field"><label htmlFor="skills">Skills and requirements <span>REQUIRED</span></label><textarea id="skills" value={criteriaFields.skills} maxLength={3000} placeholder="e.g. Python, RAG, vector databases, LLM APIs" onChange={(event) => setCriteriaFields({ ...criteriaFields, skills: event.target.value })} /></div>
                <div className="criteria-field"><label htmlFor="experience">Experience scope <span>REQUIRED</span></label><input id="experience" value={criteriaFields.experience} maxLength={300} placeholder="e.g. 0–2 years; internships welcome" onChange={(event) => setCriteriaFields({ ...criteriaFields, experience: event.target.value })} /></div>
                <div className="criteria-field"><label htmlFor="scoring">Scoring weights <span>OPTIONAL</span></label><input id="scoring" value={criteriaFields.scoring} maxLength={1000} placeholder="e.g. Technical skills 70, experience 20, projects 10" onChange={(event) => setCriteriaFields({ ...criteriaFields, scoring: event.target.value })} /></div>
              </div>
              <div className="criteria-hint"><span>Criteria are saved for this tab session. Add weights totaling 100 if you have a rubric.</span><span>{criteriaText.length}/5000</span></div>
              <div className={`dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }} onDrop={dropFile} onClick={() => !file && inputRef.current?.click()} role={!file ? 'button' : undefined} tabIndex={!file ? 0 : undefined} onKeyDown={(event) => event.key === 'Enter' && !file && inputRef.current?.click()}>
                <input ref={inputRef} type="file" accept=".pdf,.txt,application/pdf,text/plain" onChange={(event) => selectFile(event.target.files[0])} hidden />
                {!file ? <><span className="upload-icon"><FileUp size={20} /></span><strong>Drop your file here, or <span>browse</span></strong><small>PDF and TXT files are supported</small></> : <div className="selected-file" onClick={(event) => event.stopPropagation()}><span className="file-icon"><FileText size={18} /></span><div className="file-details"><strong title={file.name}>{file.name}</strong><span>{file.name.split('.').pop()?.toUpperCase()} · {(file.size / 1024).toFixed(0)} KB</span></div><button className="icon-button" onClick={reset} aria-label="Remove file"><X size={16} /></button></div>}
              </div>
              {error && <div className="error-message" role="alert">{error}</div>}
              <button className="analyze-button" disabled={!file || !criteriaReady || busy} onClick={analyze}>{busy ? <><LoaderCircle className="spin" size={16} /> Parsing resume…</> : <><Sparkles size={16} /> Parse resume <span>→</span></>}</button>
              <div className="criteria-note"><Check size={14} /> Fill in role, skills, and experience to continue</div>
            </div>

            <div className="panel preview-panel">
              <div className="panel-heading"><div><span className="step-tag">02</span><h2>Resume preview</h2></div>{file && <span className="preview-type">{file.name.split('.').pop()?.toUpperCase()}</span>}</div>
              {!file ? <div className="empty-preview"><FileText size={22} /><span>Your document preview will appear here</span></div> : pdfUrl ? <iframe className="pdf-frame" title="Resume PDF preview" src={pdfUrl} /> : <pre className="text-preview">{textPreview || 'Loading text…'}</pre>}
            </div>
          </div>

          <section className={`panel results-panel ${analysis ? 'has-results' : ''}`} aria-live="polite">
            <div className="panel-heading"><div><span className="step-tag">03</span><h2>Analysis</h2></div>{analysis && <button className="reset-button" onClick={reset}><RotateCcw size={13} /> New review</button>}</div>
            {!analysis ? <div className="analysis-empty"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="empty-spark"><Sparkles size={23} /></div><h3>Your insights<br />will live here.</h3><p>We’ll review the resume against your criteria and share a score with clear feedback.</p><div className="result-checks"><span><Check size={13} /> Overall score</span><span><Check size={13} /> Strengths &amp; gaps</span><span><Check size={13} /> Actionable feedback</span></div></div> : <div className="result-content"><div className="score-card"><div><span className="result-kicker">OVERALL SCORE</span><div className="score-line"><strong>{analysis.score}</strong><span>/ 100</span></div></div><div className="score-ring" style={{ '--score': `${analysis.score}%` }}><div><strong>{analysis.score}</strong><small>POINTS</small></div></div></div><div className="evaluation-title"><span className="result-kicker">EVALUATION</span><span className="ai-pill"><Sparkles size={12} /> AI REVIEW</span></div><div className="evaluation-text">{analysis.evaluation}</div><div className="result-footer"><Check size={14} /> Based on the resume content and criteria provided</div></div>}
          </section>
        </section>
        <footer className="page-footer"><span>Resume Lens <span className="footer-sep">·</span> AI-assisted evaluation</span><span>Resume text is sent to Groq; uploaded files are not stored by this app.</span></footer>
      </div>
    </main>
  );
}

export default App;
