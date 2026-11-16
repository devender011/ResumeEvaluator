# Resume Lens

Resume Lens is an AI-assisted resume review app. A user provides criteria for a role, uploads a resume, and receives an overall fit score with written feedback. The review is based on the resume content and the criteria entered for that review.

## What it does

- Accepts PDF and plain-text (`.txt`) resumes.
- Previews the selected document and displays extracted resume text.
- Collects a role, required skills, and experience scope. A scoring rubric can optionally be added.
- Keeps the criteria in the browser's session storage so they remain available during the current tab session, including after a refresh.
- Returns an AI-generated score out of 100 and an evaluation describing strengths, gaps, and next steps.

## Review flow

1. Enter role criteria and select or drop a resume into the upload area.
2. Review the PDF preview or text file content.
3. Submit the resume for text extraction and analysis.
4. Read the score and evaluation alongside the extracted text.

The interface is built with React and Vite. The API is built with FastAPI and extracts selectable text from PDFs with PyMuPDF. It sends the extracted resume text and user criteria to Groq for analysis. Redis provides a shared rate limit of 20 analysis attempts per source IP in a rolling 24-hour window.

## Input and service limits

- Accepted formats: PDF and UTF-8 plain text.
- Maximum file size: 2 MB.
- Maximum PDF length: 10 pages.
- Maximum extracted resume text: 50,000 characters.
- Role, skills, and experience criteria are required; scoring guidance is optional.
- Custom criteria are limited to 5,000 characters.

Scanned image-only PDFs do not contain selectable text and are not analyzed; OCR is not currently included.

## Data handling

Uploaded files and extracted resume text are not persisted by the app. Resume text and evaluation criteria are sent to Groq to generate the analysis. Criteria are stored in the browser's session storage for the current tab session. Redis stores hashed IP-based rate-limit keys and their request timestamps; it does not store resume content.

Resume Lens provides an AI-generated assessment, which may be incomplete or inaccurate. It is intended to support review, not replace human judgment in hiring decisions.

## Technology

- **Frontend:** React, Vite
- **API:** FastAPI, Python
- **PDF text extraction:** PyMuPDF
- **AI analysis:** Groq
- **Rate limiting:** Redis
