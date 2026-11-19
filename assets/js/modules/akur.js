/**
 * Askrindo SATU - AKUR Module (Analisis Kredit Usaha Rakyat)
 * Tanya-Tanya Permenko KUR — Asisten AI Regulasi Permenko KUR (2015–2026)
 * Layout 1-view ringkas bergaya Gemini dengan riwayat percakapan tersimpan & jawaban ketat tanpa opini.
 */

window.AkurModule = {
  MANIFEST_URL: 'assets/data/permenko/index.json',
  DATA_BASE_URL: 'assets/data/permenko',
  AVAILABLE_YEARS: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],

  PARENT_YEAR_MAP: {
    '2016': '2015',
    '2018': '2017',
    '2020': '2019',
    '2021': '2019',
    '2023': '2022',
    '2024': '2022',
    '2025': '2022'
  },

  STOPWORDS: new Set([
    'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'atau', 'dalam',
    'adalah', 'ini', 'itu', 'tidak', 'ada', 'bisa', 'dapat', 'apa', 'berapa', 'bagaimana',
    'kapan', 'siapa', 'dimana', 'apakah', 'jika', 'bila', 'kalau', 'tentang', 'terkait',
    'mengenai', 'tahun', 'permenko', 'kur', 'kredit', 'usaha', 'rakyat', 'tolong', 'jelaskan',
    'sebutkan', 'ketentuan', 'aturan', 'peraturan', 'sesuai', 'berdasarkan', 'oleh', 'sebagai',
    'atas', 'para', 'bagi', 'agar', 'karena', 'juga', 'serta', 'maupun', 'secara', 'harus',
    'wajib', 'boleh', 'sudah', 'belum', 'saat', 'masih', 'akan', 'telah', 'lebih', 'kurang',
    'paling', 'saya', 'kami', 'kita', 'anda', 'nya', 'tersebut'
  ]),

  manifest: null,
  yearCache: {},
  threads: [],
  activeThreadId: null,
  historySearchQuery: '',
  selectedYear: null,
  pendingQuestion: '',
  isThinking: false,
  messages: [],
  hasInitialized: false,

  getHistoryStorageKey() {
    const u = window.authService?.getCurrentUser?.();
    const uid = u?.id || u?.nip || 'guest';
    return `askrindo_akur_threads_v1_${uid}`;
  },

  loadThreads() {
    try {
      const raw = localStorage.getItem(this.getHistoryStorageKey());
      const parsed = raw ? JSON.parse(raw) : [];
      this.threads = Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      this.threads = [];
    }
  },

  saveThreads() {
    try {
      // Keep max 40 threads to stay well within localStorage quota
      const trimmed = this.threads.slice(0, 40);
      localStorage.setItem(this.getHistoryStorageKey(), JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[AKUR] Gagal menyimpan riwayat percakapan:', e);
    }
  },

  persistActiveThread() {
    const hasUserMsg = this.messages.some(m => m.role === 'user');
    if (!hasUserMsg) return;

    const firstUserMsg = this.messages.find(m => m.role === 'user');
    const title = firstUserMsg ? firstUserMsg.text.slice(0, 80) : 'Percakapan Permenko KUR';
    const nowIso = new Date().toISOString();

    if (!this.activeThreadId) {
      this.activeThreadId = `thr_${Date.now()}`;
    }

    const threadObj = {
      id: this.activeThreadId,
      title,
      year: this.selectedYear,
      updatedAt: nowIso,
      messages: this.messages.map(m => ({
        ...m,
        // Keep compact sources in storage
        sources: Array.isArray(m.sources) ? m.sources.slice(0, 4) : undefined
      }))
    };

    const idx = this.threads.findIndex(t => t.id === this.activeThreadId);
    if (idx !== -1) {
      this.threads.splice(idx, 1);
    }
    this.threads.unshift(threadObj);
    this.saveThreads();
    this.updateHistorySidebar();
  },

  init() {
    this.loadThreads();
    if (!this.hasInitialized) {
      this.hasInitialized = true;
      this.startNewChat(false);
      this.loadManifest();
    }
    this.updateHeaderMeta();
    this.updateHistorySidebar();
    this.updateChatUI();
  },

  async loadManifest() {
    try {
      const resp = await fetch(`${this.MANIFEST_URL}?v=20261119e`);
      if (resp.ok) {
        this.manifest = await resp.json();
        this.updateHeaderMeta();
      }
    } catch (e) {
      console.warn('[AKUR] Gagal memuat manifest Permenko:', e);
    }
  },

  async loadYearData(year) {
    const yr = String(year || '').trim();
    if (!yr) return null;
    if (this.yearCache[yr]) return this.yearCache[yr];
    const resp = await fetch(`${this.DATA_BASE_URL}/${yr}.json?v=20261119e`);
    if (!resp.ok) throw new Error(`Data Permenko tahun ${yr} tidak tersedia (HTTP ${resp.status})`);
    const data = await resp.json();
    this.yearCache[yr] = data;
    return data;
  },

  getDocsForYear(year) {
    if (!this.manifest || !Array.isArray(this.manifest.years)) return [];
    const found = this.manifest.years.find(y => String(y.year) === String(year));
    return found && Array.isArray(found.docs) ? found.docs : [];
  },

  getActiveGeminiApiKey() {
    if (window.LaporModule && typeof window.LaporModule.getActiveGeminiApiKey === 'function') {
      return window.LaporModule.getActiveGeminiApiKey();
    }
    return (localStorage.getItem('gemini_api_key') || '').trim();
  },

  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  formatInlineMarkdown(escapedLine) {
    let s = escapedLine;
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em class="italic text-slate-600">$1</em>');
    s = s.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-blue-800 font-mono text-xs">$1</code>');
    return s;
  },

  formatMarkdownSafe(text) {
    const rawLines = String(text || '').replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let inNumberedBlock = false;

    for (let i = 0; i < rawLines.length; i++) {
      const rawLine = rawLines[i];
      const trimmed = rawLine.trim();

      if (!trimmed) {
        if (out.length && !out[out.length - 1].includes('akur-spacer')) {
          out.push('<div class="akur-spacer h-2"></div>');
        }
        continue;
      }

      // Markdown heading (### / ##)
      const headMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
      if (headMatch) {
        inNumberedBlock = false;
        out.push(`<div class="font-bold text-slate-900 mt-2 mb-1">${this.formatInlineMarkdown(this.escapeHtml(headMatch[1]))}</div>`);
        continue;
      }

      // Numbered list item: "1. Text" or "1.  **Title**"
      const numMatch = rawLine.match(/^[ \t]*(\d+\.)[ \t]+(.+)$/);
      if (numMatch) {
        inNumberedBlock = true;
        const num = this.escapeHtml(numMatch[1]);
        const content = this.formatInlineMarkdown(this.escapeHtml(numMatch[2].trim()));
        out.push(`<div class="flex items-start gap-2 mt-2 mb-1"><span class="text-blue-700 font-bold shrink-0 min-w-[1.5rem]">${num}</span><div class="flex-1 min-w-0">${content}</div></div>`);
        continue;
      }

      // Bullet list item: "- Text" or "* Text" or "• Text"
      const bulletMatch = rawLine.match(/^([ \t]*)[-•*][ \t]+(.+)$/);
      if (bulletMatch) {
        const isIndented = bulletMatch[1].length >= 2 || inNumberedBlock;
        const content = this.formatInlineMarkdown(this.escapeHtml(bulletMatch[2].trim()));
        out.push(`<div class="flex items-start gap-2 my-1 ${isIndented ? 'pl-6' : 'pl-2'}"><span class="text-blue-600 font-bold shrink-0">&bull;</span><div class="flex-1 min-w-0">${content}</div></div>`);
        continue;
      }

      // Regular paragraph line (indent softly if continuing a numbered item)
      const content = this.formatInlineMarkdown(this.escapeHtml(trimmed));
      const isIndentedText = /^[ \t]{2,}/.test(rawLine) && inNumberedBlock;
      out.push(`<div class="my-0.5 ${isIndentedText ? 'pl-8' : ''}">${content}</div>`);
    }

    return out.join('');
  },

  startNewChat(rerender = true) {
    this.activeThreadId = null;
    this.selectedYear = null;
    this.pendingQuestion = '';
    this.isThinking = false;
    this.messages = [
      {
        id: 'welcome',
        role: 'assistant',
        type: 'welcome',
        text: 'Halo! Selamat datang di **Tanya-Tanya Permenko KUR**. Jawaban saya **hanya mengacu pada teks resmi Permenko Perekonomian tentang KUR**.\n\nPilih **Tahun Permenko KUR** pada bar di atas lalu ketik pertanyaan Anda.',
        timestamp: new Date().toISOString()
      }
    ];
    if (rerender) {
      this.updateHeaderMeta();
      this.updateHistorySidebar();
      this.updateChatUI();
      const inp = document.getElementById('akur-chat-input');
      if (inp) inp.focus();
    }
  },

  resetConversation(rerender = true) {
    this.startNewChat(rerender);
  },

  openThread(threadId) {
    const found = this.threads.find(t => t.id === threadId);
    if (!found) return;
    this.activeThreadId = found.id;
    this.selectedYear = found.year || null;
    this.pendingQuestion = '';
    this.isThinking = false;
    this.messages = Array.isArray(found.messages) ? JSON.parse(JSON.stringify(found.messages)) : [];
    this.updateHeaderMeta();
    this.updateHistorySidebar();
    this.updateChatUI();
  },

  deleteThread(threadId, e) {
    if (e) e.stopPropagation();
    this.threads = this.threads.filter(t => t.id !== threadId);
    this.saveThreads();
    if (this.activeThreadId === threadId) {
      this.startNewChat(true);
    } else {
      this.updateHistorySidebar();
    }
  },

  selectYear(year, triggerPending = true) {
    const yr = String(year || '').trim();
    if (!this.AVAILABLE_YEARS.includes(yr)) return;
    this.selectedYear = yr;
    this.updateHeaderMeta();

    const docs = this.getDocsForYear(yr);
    const docListText = docs.length
      ? docs.map(d => `• **${d.title}** (${d.numPages} hlm)`).join('\n')
      : `• Permenko Perekonomian KUR Tahun **${yr}**`;

    if (triggerPending && this.pendingQuestion) {
      const q = this.pendingQuestion;
      this.pendingQuestion = '';
      this.messages.push({
        id: `usr_yr_${Date.now()}`,
        role: 'user',
        text: `Gunakan acuan Permenko KUR Tahun ${yr}`,
        timestamp: new Date().toISOString()
      });
      this.answerQuestion(q, yr);
      return;
    }

    this.messages.push({
      id: `sys_yr_${Date.now()}`,
      role: 'assistant',
      type: 'year_selected',
      year: yr,
      text: `Acuan diatur ke **Permenko KUR Tahun ${yr}**:\n${docListText}\n\nSilakan ketik pertanyaan Anda seputar ketentuan KUR tahun **${yr}** pada kotak di atas.`,
      timestamp: new Date().toISOString()
    });
    this.updateChatUI();
    const inp = document.getElementById('akur-chat-input');
    if (inp) inp.focus();
  },

  detectYearInText(text) {
    const matches = String(text || '').match(/\b(201[5-9]|202[0-6])\b/g);
    if (!matches || !matches.length) return null;
    return matches[matches.length - 1];
  },

  askQuickQuestion(q) {
    const inp = document.getElementById('akur-chat-input');
    if (inp) inp.value = q;
    this.handleChatSubmit();
  },

  handleChatSubmit(e) {
    if (e) e.preventDefault();
    if (this.isThinking) return;

    const inp = document.getElementById('akur-chat-input');
    if (!inp) return;
    const raw = inp.value.trim();
    if (!raw) return;
    inp.value = '';

    this.messages.push({
      id: `u_${Date.now()}`,
      role: 'user',
      text: raw,
      timestamp: new Date().toISOString()
    });

    const detectedYear = this.detectYearInText(raw);

    if (detectedYear && this.pendingQuestion && raw.replace(/\b(tahun|permenko|kur|yang|untuk|acuan|pakai)\b/gi, '').replace(detectedYear, '').trim().length <= 3) {
      const q = this.pendingQuestion;
      this.pendingQuestion = '';
      this.selectedYear = detectedYear;
      this.updateHeaderMeta();
      this.answerQuestion(q, detectedYear);
      return;
    }

    if (detectedYear) {
      this.selectedYear = detectedYear;
      this.pendingQuestion = '';
      this.updateHeaderMeta();
      this.answerQuestion(raw, detectedYear);
      return;
    }

    if (!this.selectedYear) {
      this.pendingQuestion = raw;
      this.messages.push({
        id: `askyr_${Date.now()}`,
        role: 'assistant',
        type: 'ask_year',
        text: `Karena setiap tahun ketentuan Permenko KUR dapat berbeda, **Permenko KUR tahun berapa** yang ingin Anda jadikan acuan untuk pertanyaan:\n\n*"${raw}"*\n\nSilakan pilih tahun di bar atas atau klik tombol tahun di bawah ini:`,
        timestamp: new Date().toISOString()
      });
      this.persistActiveThread();
      this.updateChatUI();
      return;
    }

    this.answerQuestion(raw, this.selectedYear);
  },

  tokenize(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !this.STOPWORDS.has(w));
  },

  retrieveRelevantChunks(question, primaryData, parentData) {
    const qLower = question.toLowerCase();
    const tokens = this.tokenize(question);

    const pasalMatch = qLower.match(/pasal\s+(\d+[a-z]?)/i);
    const targetPasal = pasalMatch ? `pasal ${pasalMatch[1].toLowerCase()}` : null;

    const synonymMap = {
      bunga: ['suku', 'bunga', 'marjin', 'margin', 'persen', '%'],
      marjin: ['suku', 'bunga', 'marjin', 'margin', 'persen'],
      plafon: ['plafon', 'plafond', 'akumulasi', 'maksimal', 'paling', 'banyak', 'rupiah', 'juta'],
      agunan: ['agunan', 'jaminan', 'tambahan', 'pokok'],
      jaminan: ['penjaminan', 'imbal', 'jasa', 'ijp', 'agunan', 'perusahaan'],
      ijp: ['imbal', 'jasa', 'penjaminan', 'ijp', 'tarif'],
      tenor: ['jangka', 'waktu', 'tahun', 'modal', 'kerja', 'investasi'],
      restrukturisasi: ['restrukturisasi', 'perpanjangan', 'penjadwalan', 'suplesi', 'relaksasi'],
      syarat: ['persyaratan', 'calon', 'penerima', 'kriteria', 'wajib'],
      sektor: ['produksi', 'pertanian', 'perkebunan', 'perikanan', 'peternakan', 'industri', 'perdagangan'],
      mikro: ['mikro', 'super', 'kecil', 'khusus', 'pmi', 'tki'],
      pmi: ['pekerja', 'migran', 'indonesia', 'pmi', 'penempatan'],
      subsidi: ['subsidi', 'bunga', 'marjin', 'apbn', 'pembayaran'],
      klaim: ['klaim', 'penjaminan', 'gagal', 'bayar', 'subrogasi']
    };

    const expandedTokens = new Set(tokens);
    tokens.forEach(t => {
      if (synonymMap[t]) synonymMap[t].forEach(s => expandedTokens.add(s));
    });
    const searchTerms = Array.from(expandedTokens);

    const scoreChunk = (chunk, isPrimary) => {
      const textLower = (chunk.text || '').toLowerCase();
      const secLower = (chunk.section || '').toLowerCase();
      let score = 0;

      if (targetPasal && (secLower.includes(targetPasal) || textLower.includes(targetPasal))) {
        score += 50;
      }

      const keyBigrams = ['super mikro', 'kur mikro', 'kur kecil', 'kur khusus', 'kur pmi', 'penempatan pmi', 'suku bunga', 'agunan tambahan', 'imbal jasa', 'jangka waktu'];
      for (const bg of keyBigrams) {
        if (qLower.includes(bg) && textLower.includes(bg)) score += 28;
      }
      if (tokens.length >= 2) {
        const phrase = tokens.slice(0, 3).join(' ');
        if (textLower.includes(phrase)) score += 15;
      }

      for (const term of searchTerms) {
        if (!term) continue;
        const isOrig = tokens.includes(term);
        const weight = isOrig ? 4 : 1.5;
        if (secLower.includes(term)) score += weight * 2;
        if (textLower.includes(term)) {
          const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const count = (textLower.match(new RegExp(escaped, 'g')) || []).length;
          score += weight * Math.min(count, 4);
        }
      }

      if (isPrimary) score *= 1.35;
      return score;
    };

    const primaryScored = (primaryData?.chunks || []).map(c => ({
      ...c,
      sourceType: 'Utama',
      _score: scoreChunk(c, true)
    })).sort((a, b) => b._score - a._score);

    const topPrimary = primaryScored.slice(0, 14);

    let topParent = [];
    if (parentData && Array.isArray(parentData.chunks)) {
      const parentScored = parentData.chunks.map(c => ({
        ...c,
        sourceType: 'Induk',
        _score: scoreChunk(c, false)
      })).filter(c => c._score > 0).sort((a, b) => b._score - a._score);
      topParent = parentScored.slice(0, 6);
    }

    const combined = [...topPrimary, ...topParent].filter(c => c._score > 0);
    return combined.length ? combined : (primaryData?.chunks || []).slice(0, 8).map(c => ({ ...c, sourceType: 'Utama', _score: 1 }));
  },

  async answerQuestion(question, year) {
    this.isThinking = true;
    this.persistActiveThread();
    this.updateChatUI();

    try {
      const primaryData = await this.loadYearData(year);
      const parentYear = this.PARENT_YEAR_MAP[year] || null;
      let parentData = null;
      if (parentYear) {
        try {
          parentData = await this.loadYearData(parentYear);
        } catch (_) {}
      }

      const relevantChunks = this.retrieveRelevantChunks(question, primaryData, parentData);
      const docsInYear = (primaryData?.docs || []).map(d => d.title).join(', ');
      const parentDocs = parentData ? (parentData.docs || []).map(d => d.title).join(', ') : '';

      const fullPrimaryChunks = (primaryData?.chunks || []).map(c => ({ ...c, sourceType: 'Utama' }));
      const topParentChunks = relevantChunks.filter(c => c.sourceType === 'Induk').slice(0, 12);
      const promptChunks = [...fullPrimaryChunks, ...topParentChunks];

      const contextText = promptChunks.map((c, idx) => (
        `[SUMBER ${idx + 1} | ${c.sourceType === 'Induk' ? 'PERATURAN INDUK' : 'PERATURAN TAHUN ' + year} | ${c.doc} | ${c.section}]\n${c.text}`
      )).join('\n\n---\n\n');

      const apiKey = this.getActiveGeminiApiKey();
      let answerText = '';
      let usedModel = '';

      if (apiKey) {
        const prompt = `Anda adalah Asisten Regulasi Resmi **Permenko KUR Askrindo (AKUR)**.

ATURAN MUTLAK (WAJIB DIPATUHI):
1. Anda HANYA BOLEH menjawab berdasarkan teks kutipan resmi Permenko KUR yang disediakan di bawah ini.
2. DILARANG KERAS memberikan opini, asumsi pribadi, saran di luar aturan, atau pengetahuan umum yang tidak tertulis dalam kutipan Permenko di bawah.
3. WAJIB menyebutkan secara spesifik **Nomor Permenko, Tahun, dan Pasal/Ayat** rujukan pada setiap poin jawaban Anda.
4. Prioritaskan ketentuan terbaru pada **Tahun ${year}** (${docsInYear}).${parentYear ? ` Jika suatu ketentuan tidak diubah pada Tahun ${year} dan terdapat pada kutipan Peraturan Induk Tahun ${parentYear} (${parentDocs}), Anda boleh merujuknya dengan menyatakan secara eksplisit bahwa ketentuan tersebut mengacu pada Peraturan Induk Tahun ${parentYear}.` : ''}
5. Jika jawaban atas pertanyaan pengguna TIDAK DITEMUKAN dalam kutipan teks Permenko di bawah, JANGAN mengarang! Jawab secara tegas: "Berdasarkan dokumen Permenko KUR Tahun ${year} yang tersedia, ketentuan mengenai hal tersebut tidak ditemukan / tidak diatur secara eksplisit."
6. Jawab dalam Bahasa Indonesia yang formal, ringkas, terstruktur (gunakan poin-poin jika perlu), dan mudah dibaca petugas Askrindo.

TAHUN ACUAN DIPILIH: ${year}
PERTANYAAN PENGGUNA:
${question}

KUTIPAN TEKS RESMI PERMENKO KUR:
${contextText}`;

        const candidateModels = [
          'gemini-3-flash-preview',
          'gemini-flash-lite-latest',
          'gemini-2.5-flash',
          'gemini-2.0-flash'
        ];

        for (const m of candidateModels) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 35000);
          try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0,
                  topP: 0.8,
                  maxOutputTokens: 8192
                }
              })
            });
            clearTimeout(timeoutId);
            if (res.ok) {
              const json = await res.json();
              const textPart = json?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
              if (textPart) {
                answerText = textPart;
                usedModel = m;
                break;
              }
            }
          } catch (err) {
            clearTimeout(timeoutId);
            console.warn(`[AKUR] Model ${m} gagal:`, err);
          }
        }
      }

      if (!answerText) {
        const top3 = relevantChunks.slice(0, 3);
        answerText = `Koneksi AI sedang tidak tersedia, berikut **kutipan langsung** paling relevan dari **Permenko KUR Tahun ${year}**:\n\n` +
          top3.map((c, i) => `**${i + 1}. ${c.doc} — ${c.section}**\n${c.text.slice(0, 450)}${c.text.length > 450 ? '...' : ''}`).join('\n\n');
      }

      this.messages.push({
        id: `a_${Date.now()}`,
        role: 'assistant',
        type: 'answer',
        year,
        model: usedModel,
        text: answerText,
        sources: relevantChunks.slice(0, 5),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      this.messages.push({
        id: `err_${Date.now()}`,
        role: 'assistant',
        type: 'error',
        text: `Maaf, terjadi kendala saat membaca data Permenko KUR Tahun ${year}: ${err.message}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      this.isThinking = false;
      this.persistActiveThread();
      this.updateChatUI();
    }
  },

  toggleSourceDetail(msgId, idx) {
    const el = document.getElementById(`src-${msgId}-${idx}`);
    if (el) el.classList.toggle('hidden');
  },

  openCatalogModal() {
    const existing = document.getElementById('akur-catalog-modal');
    if (existing) existing.remove();

    const years = (this.manifest && Array.isArray(this.manifest.years))
      ? [...this.manifest.years].reverse()
      : this.AVAILABLE_YEARS.slice().reverse().map(y => ({ year: y, docs: [] }));

    const modal = document.createElement('div');
    modal.id = 'akur-catalog-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
        <div class="bg-gradient-to-r from-[#002B49] to-blue-900 text-white p-5 flex items-center justify-between">
          <div>
            <h3 class="text-base font-black">Daftar Dokumen Permenko KUR Terindeks (2015–2026)</h3>
            <p class="text-xs text-blue-200 mt-0.5">Seluruh jawaban AI AKUR mengacu ketat pada naskah resmi berikut.</p>
          </div>
          <button onclick="document.getElementById('akur-catalog-modal').remove()" class="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="p-5 overflow-y-auto space-y-3 text-xs">
          ${years.map(y => `
            <div class="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70">
              <div class="flex items-center justify-between mb-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white">Tahun ${this.escapeHtml(y.year)}</span>
                <button onclick="document.getElementById('akur-catalog-modal').remove(); window.AkurModule.selectYear('${this.escapeHtml(y.year)}');" class="text-xs font-bold text-blue-700 hover:underline">
                  Gunakan Tahun Ini &rarr;
                </button>
              </div>
              <ul class="space-y-1 text-slate-700">
                ${(y.docs || []).map(d => `
                  <li class="flex items-center justify-between gap-2">
                    <span class="font-semibold">&bull; ${this.escapeHtml(d.title)}</span>
                    <span class="text-xs text-slate-400 shrink-0">${d.numPages} hlm</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  updateHeaderMeta() {
    const yearBar = document.getElementById('akur-year-selector');
    if (yearBar) yearBar.innerHTML = this.renderYearSelectorButtons();

    const activeDocEl = document.getElementById('akur-active-year-docs');
    if (activeDocEl) activeDocEl.innerHTML = this.renderActiveYearDocs();

    const inputEl = document.getElementById('akur-chat-input');
    if (inputEl) {
      inputEl.placeholder = this.selectedYear
        ? `Tanya ketentuan Permenko KUR Tahun ${this.selectedYear} (free text)...`
        : 'Ketik pertanyaan seputar KUR (pilih tahun di atas terlebih dahulu)...';
    }
  },

  updateHistorySidebar() {
    const el = document.getElementById('akur-history-list');
    if (!el) return;
    el.innerHTML = this.renderHistoryItems();
    if (window.lucide) window.lucide.createIcons();
  },

  updateChatUI() {
    const feed = document.getElementById('akur-chat-feed');
    if (!feed) return;
    feed.innerHTML = this.renderChatMessages();
    if (window.lucide) window.lucide.createIcons();
    feed.scrollTop = feed.scrollHeight;
  },

  renderYearSelectorButtons() {
    return this.AVAILABLE_YEARS.map(yr => {
      const isActive = this.selectedYear === yr;
      return `
        <button
          type="button"
          onclick="window.AkurModule.selectYear('${yr}')"
          class="px-2.5 py-1 rounded-lg text-xs font-bold border transition ${isActive
            ? 'bg-orange-500 text-white border-orange-400 shadow-sm'
            : 'bg-white/10 hover:bg-white/20 text-blue-100 border-white/15'}"
        >
          ${yr}
        </button>
      `;
    }).join('');
  },

  renderActiveYearDocs() {
    if (!this.selectedYear) {
      return `<span class="text-xs text-amber-200 font-medium">Pilih tahun Permenko KUR terlebih dahulu agar jawaban sesuai aturan tahun tersebut.</span>`;
    }
    const docs = this.getDocsForYear(this.selectedYear);
    const parentYr = this.PARENT_YEAR_MAP[this.selectedYear];
    return `
      <div class="flex items-center gap-1.5 flex-wrap">
        <span class="text-xs font-bold text-blue-200">Acuan ${this.selectedYear}:</span>
        ${docs.map(d => `
          <span class="px-2 py-0.5 rounded-md text-xs font-semibold bg-white/15 text-white border border-white/20">
            ${this.escapeHtml(d.title.replace('Permenko Perekonomian ', 'Permenko '))}
          </span>
        `).join('')}
        ${parentYr ? `<span class="text-xs text-blue-200/90 italic">(+ Induk ${parentYr})</span>` : ''}
      </div>
    `;
  },

  setHistorySearch(val) {
    this.historySearchQuery = String(val || '');
    this.updateHistorySidebar();
    const clearBtn = document.getElementById('akur-history-search-clear');
    if (clearBtn) {
      clearBtn.classList.toggle('hidden', !this.historySearchQuery.trim());
    }
  },

  clearHistorySearch() {
    this.historySearchQuery = '';
    const inp = document.getElementById('akur-history-search');
    if (inp) {
      inp.value = '';
      inp.focus();
    }
    const clearBtn = document.getElementById('akur-history-search-clear');
    if (clearBtn) clearBtn.classList.add('hidden');
    this.updateHistorySidebar();
  },

  renderHistoryItems() {
    if (!this.threads.length) {
      return `
        <div class="text-center py-8 px-3 text-slate-400 space-y-1.5">
          <i data-lucide="history" class="w-6 h-6 mx-auto opacity-50"></i>
          <p class="text-xs font-semibold text-slate-500">Belum ada riwayat</p>
          <p class="text-xs text-slate-400">Pertanyaan Anda akan tersimpan otomatis di sini seperti Gemini.</p>
        </div>
      `;
    }

    const q = this.historySearchQuery.trim().toLowerCase();
    const filteredThreads = q
      ? this.threads.filter(t => {
          const inTitle = String(t.title || '').toLowerCase().includes(q);
          const inYear = String(t.year || '').toLowerCase().includes(q);
          const inMsgs = Array.isArray(t.messages) && t.messages.some(m => String(m.text || '').toLowerCase().includes(q));
          return inTitle || inYear || inMsgs;
        })
      : this.threads;

    if (!filteredThreads.length) {
      return `
        <div class="text-center py-8 px-3 text-slate-400 space-y-1.5">
          <i data-lucide="search-x" class="w-6 h-6 mx-auto opacity-50"></i>
          <p class="text-xs font-semibold text-slate-500">Riwayat tidak ditemukan</p>
          <p class="text-xs text-slate-400">Tidak ada percakapan yang cocok dengan "${this.escapeHtml(this.historySearchQuery.trim())}".</p>
        </div>
      `;
    }

    return filteredThreads.map(t => {
      const isActive = t.id === this.activeThreadId;
      const timeStr = t.updatedAt
        ? new Date(t.updatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : '';
      return `
        <div
          onclick="window.AkurModule.openThread('${t.id}')"
          class="group p-2.5 rounded-xl border cursor-pointer transition flex items-start justify-between gap-2 ${isActive
            ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-sm'
            : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200 text-slate-700'}"
        >
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5 mb-0.5">
              <i data-lucide="message-square" class="w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}"></i>
              <p class="text-xs font-semibold truncate">${this.escapeHtml(t.title)}</p>
            </div>
            <div class="flex items-center gap-1.5 pl-5 text-[11px] text-slate-400">
              ${t.year ? `<span class="px-1.5 py-0.2 rounded bg-blue-100/80 text-blue-700 font-bold">${this.escapeHtml(t.year)}</span>` : ''}
              <span class="truncate">${timeStr}</span>
            </div>
          </div>
          <button
            type="button"
            onclick="window.AkurModule.deleteThread('${t.id}', event)"
            title="Hapus riwayat"
            class="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;
    }).join('');
  },

  renderChatMessages() {
    const quickPrompts = [
      'Berapa suku bunga / marjin KUR Super Mikro, KUR Mikro, dan KUR Kecil?',
      'Bagaimana ketentuan agunan pokok dan agunan tambahan pada KUR?',
      'Berapa batas plafon dan akumulasi plafon KUR sektor produksi dan non-produksi?',
      'Bagaimana aturan perpanjangan, suplesi, dan restrukturisasi KUR?'
    ];

    const hasUserMsg = this.messages.some(m => m.role === 'user');

    const bubbles = this.messages.map(msg => {
      if (msg.role === 'user') {
        return `
          <div class="flex justify-end">
            <div class="max-w-[82%] bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm shadow-sm text-sm leading-relaxed">
              ${this.escapeHtml(msg.text)}
            </div>
          </div>
        `;
      }

      return `
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#002B49] to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <i data-lucide="book-open-check" class="w-4 h-4"></i>
          </div>
          <div class="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-2xl rounded-tl-sm p-4 shadow-sm space-y-2.5 text-sm text-slate-700 leading-relaxed">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <span class="font-bold text-[#002B49] text-xs flex items-center gap-1.5">
                <span>Asisten Permenko KUR</span>
                ${msg.year ? `<span class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs">Tahun ${this.escapeHtml(msg.year)}</span>` : ''}
              </span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                Berbasis Permenko Resmi
              </span>
            </div>

            <div>${this.formatMarkdownSafe(msg.text)}</div>

            ${msg.type === 'welcome' && !hasUserMsg ? `
              <div class="pt-2 border-t border-slate-100">
                <p class="text-xs font-bold text-slate-500 mb-2">Contoh Pertanyaan Cepat:</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  ${quickPrompts.map(q => `
                    <button
                      type="button"
                      onclick="window.AkurModule.askQuickQuestion('${this.escapeHtml(q)}')"
                      class="p-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 hover:border-blue-200 text-left transition"
                    >
                      ${this.escapeHtml(q)}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${msg.type === 'ask_year' && !this.selectedYear ? `
              <div class="pt-2 border-t border-slate-100">
                <p class="text-xs font-bold text-slate-500 mb-2">Pilih Tahun Permenko KUR:</p>
                <div class="flex flex-wrap gap-1.5">
                  ${this.AVAILABLE_YEARS.map(yr => `
                    <button
                      type="button"
                      onclick="window.AkurModule.selectYear('${yr}')"
                      class="px-3 py-1.5 rounded-xl text-xs font-bold border transition bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border-blue-200"
                    >
                      Tahun ${yr}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${Array.isArray(msg.sources) && msg.sources.length ? `
              <div class="pt-2.5 border-t border-slate-100 space-y-1.5">
                <p class="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                  <span>Rujukan Pasal Permenko (klik untuk lihat teks asli)</span>
                </p>
                <div class="space-y-1.5">
                  ${msg.sources.map((src, idx) => `
                    <div class="rounded-xl border border-slate-200/80 bg-slate-50/70 overflow-hidden">
                      <button
                        type="button"
                        onclick="window.AkurModule.toggleSourceDetail('${msg.id}', ${idx})"
                        class="w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-blue-50/60 transition text-xs"
                      >
                        <span class="font-bold text-slate-700">
                          ${this.escapeHtml(src.doc)} — <span class="text-blue-700">${this.escapeHtml(src.section)}</span>
                        </span>
                        <span class="text-xs font-semibold text-slate-400 shrink-0">Lihat Kutipan &#9662;</span>
                      </button>
                      <div id="src-${msg.id}-${idx}" class="hidden px-3 py-2.5 bg-white border-t border-slate-200/70 text-xs text-slate-600 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                        ${this.escapeHtml(src.text)}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    const thinkingHtml = this.isThinking ? `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#002B49] to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
        </div>
        <div class="bg-white border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-sm text-blue-800 font-semibold flex items-center gap-2">
          <span>Membaca pasal-pasal Permenko KUR Tahun ${this.escapeHtml(this.selectedYear || '')}...</span>
        </div>
      </div>
    ` : '';

    return bubbles + thinkingHtml;
  },

  render() {
    const user = window.authService.getCurrentUser();
    if (!user || !window.authService.hasAccess('akur')) {
      return window.askrindoApp.renderUnauthorized('AKUR');
    }

    setTimeout(() => this.init(), 0);

    return `
      <div class="flex flex-col gap-3 animate-fadeIn h-[calc(100vh-118px)] min-h-[540px]">
        <!-- Compact Single-Row Module Header -->
        <div class="bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 border-l-4 border-l-blue-600 shrink-0">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#002B49] to-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <i data-lucide="book-open-check" class="w-5 h-5"></i>
            </div>
            <div class="flex items-center gap-2 flex-wrap min-w-0">
              <h1 class="text-lg font-black text-slate-900 tracking-tight">AKUR</h1>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                Tanya-Tanya Permenko KUR
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-flex">
                20 Permenko (2015–2026)
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button type="button" onclick="window.AkurModule.openCatalogModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition">
              <i data-lucide="library" class="w-3.5 h-3.5 text-blue-600"></i>
              <span>Daftar Permenko</span>
            </button>
            <button type="button" onclick="window.AkurModule.startNewChat(true)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Chat Baru</span>
            </button>
          </div>
        </div>

        <!-- 1-View Main Workspace: Riwayat (Kiri) + Tanya & Jawaban (Kanan) -->
        <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
          <!-- Left Sidebar: Riwayat Pertanyaan ala Gemini -->
          <aside class="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <div class="p-3 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
              <span class="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <i data-lucide="history" class="w-4 h-4 text-blue-600"></i>
                <span>Riwayat Pertanyaan</span>
              </span>
              <button
                type="button"
                onclick="window.AkurModule.startNewChat(true)"
                title="Percakapan Baru"
                class="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
              >
                <i data-lucide="square-pen" class="w-3.5 h-3.5"></i>
              </button>
            </div>
            <div class="px-2.5 pt-2.5 pb-1 shrink-0">
              <div class="relative">
                <i data-lucide="search" class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                <input
                  id="akur-history-search"
                  type="text"
                  value="${this.escapeHtml(this.historySearchQuery)}"
                  oninput="window.AkurModule.setHistorySearch(this.value)"
                  placeholder="Cari riwayat / tahun..."
                  class="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  id="akur-history-search-clear"
                  type="button"
                  onclick="window.AkurModule.clearHistorySearch()"
                  title="Hapus pencarian"
                  class="${this.historySearchQuery ? '' : 'hidden'} absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
              </div>
            </div>
            <div id="akur-history-list" class="flex-1 overflow-y-auto p-2 space-y-1">
              ${this.renderHistoryItems()}
            </div>
          </aside>

          <!-- Right Panel: Tanya (Atas) + Jawaban (Bawah) dalam 1 View -->
          <section class="lg:col-span-9 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <!-- Compact Top Ask + Year Bar -->
            <div class="bg-gradient-to-r from-[#002B49] via-[#0A3D62] to-[#1E3A8A] p-3.5 text-white space-y-2.5 shrink-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-extrabold text-amber-300 shrink-0">Tahun Permenko:</span>
                <div id="akur-year-selector" class="flex flex-wrap gap-1.5">
                  ${this.renderYearSelectorButtons()}
                </div>
              </div>

              <div id="akur-active-year-docs">
                ${this.renderActiveYearDocs()}
              </div>

              <form onsubmit="window.AkurModule.handleChatSubmit(event)" class="flex items-center gap-2">
                <div class="relative flex-1">
                  <i data-lucide="message-square-text" class="w-4 h-4 text-blue-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                  <input
                    id="akur-chat-input"
                    type="text"
                    autocomplete="off"
                    placeholder="${this.selectedYear ? `Tanya ketentuan Permenko KUR Tahun ${this.selectedYear} (free text)...` : 'Ketik pertanyaan seputar KUR (pilih tahun di atas terlebih dahulu)...'}"
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium shadow focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
                  />
                </div>
                <button
                  type="submit"
                  class="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md transition shrink-0"
                >
                  <span>Tanya AI</span>
                  <i data-lucide="send" class="w-4 h-4"></i>
                </button>
              </form>
            </div>

            <!-- Scrollable Q&A Feed inside 1-View -->
            <div id="akur-chat-feed" class="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
              ${this.renderChatMessages()}
            </div>
          </section>
        </div>
      </div>
    `;
  }
};
