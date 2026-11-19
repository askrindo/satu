/**
 * Askrindo SATU - AKUR Module (Analisis Kredit Usaha Rakyat)
 * Tanya-Tanya Permenko KUR — Asisten AI Regulasi Permenko KUR (2015–2026)
 * Jawaban ketat berbasis teks resmi Permenko KUR per tahun tanpa opini.
 */

window.AkurModule = {
  MANIFEST_URL: 'assets/data/permenko/index.json',
  DATA_BASE_URL: 'assets/data/permenko',
  AVAILABLE_YEARS: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'],

  // Relasi Peraturan Perubahan -> Peraturan Induk (hanya sebagai rujukan tambahan jika pasal tidak diubah)
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
  selectedYear: null,
  pendingQuestion: '',
  isThinking: false,
  messages: [],
  hasInitialized: false,

  init() {
    if (!this.hasInitialized) {
      this.hasInitialized = true;
      this.resetConversation(false);
      this.loadManifest();
    } else {
      this.updateChatUI();
    }
  },

  async loadManifest() {
    try {
      const resp = await fetch(`${this.MANIFEST_URL}?v=20261119a`);
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
    const resp = await fetch(`${this.DATA_BASE_URL}/${yr}.json?v=20261119a`);
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

  formatMarkdownSafe(text) {
    let html = this.escapeHtml(text || '');
    // Bold **text** & italic *text*
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em class="italic text-slate-600">$1</em>');
    // Inline code `text`
    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-blue-800 font-mono text-[11px]">$1</code>');
    // Bullet lines
    html = html.replace(/^(?:\s*[-•*]\s+)(.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-blue-600 font-bold mt-0.5">&bull;</span><span>$1</span></div>');
    // Numbered lines
    html = html.replace(/^(\s*\d+\.\s+)(.+)$/gm, '<div class="flex items-start gap-2 my-1"><span class="text-blue-700 font-bold shrink-0">$1</span><span>$2</span></div>');
    // Line breaks
    html = html.replace(/\n\n/g, '<div class="h-2"></div>');
    html = html.replace(/\n/g, '<br/>');
    return html;
  },

  resetConversation(rerender = true) {
    this.selectedYear = null;
    this.pendingQuestion = '';
    this.isThinking = false;
    this.messages = [
      {
        id: 'welcome',
        role: 'assistant',
        type: 'ask_year',
        text: 'Halo! Selamat datang di **Tanya-Tanya Permenko KUR**. Saya akan menjawab pertanyaan Anda **hanya berdasarkan teks resmi Permenko Perekonomian tentang KUR** (tanpa opini).\n\nKarena ketentuan KUR berbeda-beda di setiap tahun, **Permenko KUR tahun berapa** yang ingin Anda tanyakan?',
        timestamp: new Date().toISOString()
      }
    ];
    if (rerender) {
      this.updateChatUI();
      this.updateHeaderMeta();
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
      text: `Acuan diatur ke **Permenko KUR Tahun ${yr}**:\n${docListText}\n\nSilakan ketik pertanyaan Anda seputar ketentuan KUR tahun **${yr}** di bawah ini.`,
      timestamp: new Date().toISOString()
    });
    this.updateChatUI();
    const inp = document.getElementById('akur-chat-input');
    if (inp) inp.focus();
  },

  detectYearInText(text) {
    const matches = String(text || '').match(/\b(201[5-9]|202[0-6])\b/g);
    if (!matches || !matches.length) return null;
    // Ambil tahun terakhir yang disebut jika ada lebih dari satu
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

    // Push user message
    this.messages.push({
      id: `u_${Date.now()}`,
      role: 'user',
      text: raw,
      timestamp: new Date().toISOString()
    });

    const detectedYear = this.detectYearInText(raw);

    // Kasus 1: User hanya mengetik tahun (misal "2025" atau "tahun 2026") saat ada pendingQuestion
    if (detectedYear && this.pendingQuestion && raw.replace(/\b(tahun|permenko|kur|yang|untuk|acuan|pakai)\b/gi, '').replace(detectedYear, '').trim().length <= 3) {
      const q = this.pendingQuestion;
      this.pendingQuestion = '';
      this.selectedYear = detectedYear;
      this.updateHeaderMeta();
      this.answerQuestion(q, detectedYear);
      return;
    }

    // Kasus 2: Tahun disebut langsung di pertanyaan (misal "Berapa suku bunga KUR 2026?")
    if (detectedYear) {
      this.selectedYear = detectedYear;
      this.pendingQuestion = '';
      this.updateHeaderMeta();
      this.answerQuestion(raw, detectedYear);
      return;
    }

    // Kasus 3: Belum memilih tahun sama sekali -> WAJIB tanya tahun dulu!
    if (!this.selectedYear) {
      this.pendingQuestion = raw;
      this.messages.push({
        id: `askyr_${Date.now()}`,
        role: 'assistant',
        type: 'ask_year',
        text: `Karena setiap tahun ketentuan Permenko KUR dapat berbeda, **Permenko KUR tahun berapa** yang ingin Anda jadikan acuan untuk pertanyaan:\n\n*"${raw}"*\n\nSilakan pilih tahun di bawah ini (atau ketik angkanya, misal **2025** atau **2026**):`,
        timestamp: new Date().toISOString()
      });
      this.updateChatUI();
      return;
    }

    // Kasus 4: Tahun sudah dipilih -> langsung jawab berdasarkan tahun terpilih
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

    // Deteksi jika user menyebut nomor Pasal tertentu (misal "Pasal 12")
    const pasalMatch = qLower.match(/pasal\s+(\d+[a-z]?)/i);
    const targetPasal = pasalMatch ? `pasal ${pasalMatch[1].toLowerCase()}` : null;

    // Sinonim umum istilah KUR agar pencarian pasal makin akurat
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
      if (synonymMap[t]) {
        synonymMap[t].forEach(s => expandedTokens.add(s));
      }
    });
    const searchTerms = Array.from(expandedTokens);

    const scoreChunk = (chunk, isPrimary) => {
      const textLower = (chunk.text || '').toLowerCase();
      const secLower = (chunk.section || '').toLowerCase();
      let score = 0;

      if (targetPasal && (secLower.includes(targetPasal) || textLower.includes(targetPasal))) {
        score += 50;
      }

      // Exact phrase & compound KUR scheme bonus
      const keyBigrams = ['super mikro', 'kur mikro', 'kur kecil', 'kur khusus', 'kur pmi', 'penempatan pmi', 'suku bunga', 'agunan tambahan', 'imbal jasa', 'jangka waktu'];
      for (const bg of keyBigrams) {
        if (qLower.includes(bg) && textLower.includes(bg)) {
          score += 28;
        }
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
          // Hitung frekuensi terbatas agar tidak bias ke chunk super panjang
          const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const count = (textLower.match(new RegExp(escaped, 'g')) || []).length;
          score += weight * Math.min(count, 4);
        }
      }

      // Prioritaskan Permenko tahun yang dipilih dibanding Peraturan Induknya
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
    // Jika semua skor 0 (pertanyaan terlalu umum), kirim 8 chunk pertama dari tahun utama
    return combined.length ? combined : (primaryData?.chunks || []).slice(0, 8).map(c => ({ ...c, sourceType: 'Utama', _score: 1 }));
  },

  async answerQuestion(question, year) {
    this.isThinking = true;
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

      // Kirim SELURUH teks Permenko tahun terpilih (100% recall, tidak ada pasal yang terlewat)
      // plus top 12 pasal relevan dari Peraturan Induk jika tahun tersebut adalah Permenko Perubahan
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

      // Fallback deterministik tanpa opini jika AI API sedang tidak dapat dijangkau
      if (!answerText) {
        const top3 = relevantChunks.slice(0, 3);
        answerText = `Koneksi AI sedang tidak tersedia, berikut **kutipan langsung** paling relevan dari **Permenko KUR Tahun ${year}** (tanpa opini):\n\n` +
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
            <p class="text-[11px] text-blue-200 mt-0.5">Seluruh jawaban AI AKUR mengacu ketat pada naskah resmi berikut.</p>
          </div>
          <button onclick="document.getElementById('akur-catalog-modal').remove()" class="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="p-5 overflow-y-auto space-y-3 text-xs">
          ${years.map(y => `
            <div class="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70">
              <div class="flex items-center justify-between mb-2">
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-600 text-white">Tahun ${this.escapeHtml(y.year)}</span>
                <button onclick="document.getElementById('akur-catalog-modal').remove(); window.AkurModule.selectYear('${this.escapeHtml(y.year)}');" class="text-[11px] font-bold text-blue-700 hover:underline">
                  Gunakan Tahun Ini &rarr;
                </button>
              </div>
              <ul class="space-y-1 text-slate-700">
                ${(y.docs || []).map(d => `
                  <li class="flex items-center justify-between gap-2">
                    <span class="font-semibold">&bull; ${this.escapeHtml(d.title)}</span>
                    <span class="text-[10px] text-slate-400 shrink-0">${d.numPages} halaman</span>
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
    if (yearBar) {
      yearBar.innerHTML = this.renderYearSelectorButtons();
    }
    const activeDocEl = document.getElementById('akur-active-year-docs');
    if (activeDocEl) {
      activeDocEl.innerHTML = this.renderActiveYearDocs();
    }
    const inputEl = document.getElementById('akur-chat-input');
    if (inputEl) {
      inputEl.placeholder = this.selectedYear
        ? `Ketik pertanyaan terkait Permenko KUR Tahun ${this.selectedYear} (bebas / free text)...`
        : 'Ketik pertanyaan seputar KUR (AI akan menanyakan tahun Permenko jika belum dipilih)...';
    }
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
          class="px-3 py-1.5 rounded-xl text-xs font-bold border transition ${isActive
            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25'
            : 'bg-white/10 hover:bg-white/20 text-blue-100 border-white/20'}"
        >
          ${yr}
        </button>
      `;
    }).join('');
  },

  renderActiveYearDocs() {
    if (!this.selectedYear) {
      return `
        <span class="inline-flex items-center gap-1.5 text-[11px] text-amber-200 font-semibold">
          <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i>
          Belum ada tahun dipilih — pilih tahun di atas agar jawaban akurat sesuai Permenko tahun tersebut.
        </span>
      `;
    }
    const docs = this.getDocsForYear(this.selectedYear);
    const parentYr = this.PARENT_YEAR_MAP[this.selectedYear];
    return `
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[11px] font-bold text-blue-200">Acuan Aktif (${this.selectedYear}):</span>
        ${docs.map(d => `
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white border border-white/20">
            ${this.escapeHtml(d.title)}
          </span>
        `).join('')}
        ${parentYr ? `<span class="text-[10px] text-blue-200/90 italic">(+ Induk ${parentYr} jika pasal tidak diubah)</span>` : ''}
      </div>
    `;
  },

  renderChatMessages() {
    const bubbles = this.messages.map(msg => {
      if (msg.role === 'user') {
        return `
          <div class="flex justify-end">
            <div class="max-w-[82%] bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 rounded-2xl rounded-br-sm shadow-sm text-xs leading-relaxed">
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
          <div class="max-w-[88%] bg-white border border-slate-200/90 rounded-2xl rounded-tl-sm p-4 shadow-sm space-y-3 text-xs text-slate-700 leading-relaxed">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <span class="font-extrabold text-[#002B49] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <span>Asisten Permenko KUR</span>
                ${msg.year ? `<span class="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] normal-case">Acuan Tahun ${this.escapeHtml(msg.year)}</span>` : ''}
              </span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                Berbasis Permenko · Tanpa Opini
              </span>
            </div>

            <div>${this.formatMarkdownSafe(msg.text)}</div>

            ${msg.type === 'ask_year' ? `
              <div class="pt-2 border-t border-slate-100">
                <p class="text-[11px] font-bold text-slate-500 mb-2">Pilih Tahun Permenko KUR:</p>
                <div class="flex flex-wrap gap-1.5">
                  ${this.AVAILABLE_YEARS.map(yr => `
                    <button
                      type="button"
                      onclick="window.AkurModule.selectYear('${yr}')"
                      class="px-3 py-1.5 rounded-xl text-xs font-bold border transition ${this.selectedYear === yr
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border-blue-200'}"
                    >
                      Tahun ${yr}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${Array.isArray(msg.sources) && msg.sources.length ? `
              <div class="pt-2.5 border-t border-slate-100 space-y-2">
                <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <i data-lucide="file-text" class="w-3 h-3"></i>
                  <span>Rujukan Pasal Permenko (klik untuk lihat teks asli)</span>
                </p>
                <div class="space-y-1.5">
                  ${msg.sources.map((src, idx) => `
                    <div class="rounded-xl border border-slate-200/80 bg-slate-50/70 overflow-hidden">
                      <button
                        type="button"
                        onclick="window.AkurModule.toggleSourceDetail('${msg.id}', ${idx})"
                        class="w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-blue-50/60 transition text-[11px]"
                      >
                        <span class="font-bold text-slate-700">
                          ${this.escapeHtml(src.doc)} — <span class="text-blue-700">${this.escapeHtml(src.section)}</span>
                        </span>
                        <span class="text-[10px] font-semibold text-slate-400 shrink-0">Lihat Kutipan &#9662;</span>
                      </button>
                      <div id="src-${msg.id}-${idx}" class="hidden px-3 py-2.5 bg-white border-t border-slate-200/70 text-[11px] text-slate-600 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
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
        <div class="bg-white border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm text-xs text-blue-800 font-semibold flex items-center gap-2">
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

    const quickPrompts = [
      'Berapa suku bunga / marjin KUR Super Mikro, KUR Mikro, dan KUR Kecil?',
      'Bagaimana ketentuan agunan pokok dan agunan tambahan pada KUR?',
      'Berapa batas plafon dan akumulasi plafon KUR sektor produksi dan non-produksi?',
      'Bagaimana aturan perpanjangan, suplesi, dan restrukturisasi KUR?'
    ];

    return `
      <div class="space-y-5 animate-fadeIn pb-6">
        <!-- Module Header -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-l-4 border-l-blue-600">
          <div class="flex items-start sm:items-center gap-3.5 min-w-0">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#002B49] to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              <i data-lucide="book-open-check" class="w-6 h-6"></i>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h1 class="text-xl font-black text-slate-900 tracking-tight">AKUR</h1>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  Tanya-Tanya Permenko KUR
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  20 Permenko (2015–2026) · Tanpa Opini
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                Asisten AI khusus regulasi Kredit Usaha Rakyat (KUR). Ajukan pertanyaan bebas dan dapatkan jawaban faktual yang mengacu ketat pada pasal resmi Permenko KUR sesuai tahunnya.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0 flex-wrap">
            <button type="button" onclick="window.AkurModule.openCatalogModal()" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition">
              <i data-lucide="library" class="w-3.5 h-3.5 text-blue-600"></i>
              <span>Daftar Permenko</span>
            </button>
            <button type="button" onclick="window.AkurModule.resetConversation(true)" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
              <span>Reset Tanya</span>
            </button>
          </div>
        </div>

        <!-- Hero Panel: Pilih Tahun + Fitur Tanya AI di Atas -->
        <div class="rounded-3xl bg-gradient-to-br from-[#002B49] via-[#0A3D62] to-[#1E3A8A] p-5 sm:p-6 text-white shadow-xl space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span class="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                <i data-lucide="calendar-check" class="w-3.5 h-3.5"></i> Langkah 1: Pilih Tahun · Langkah 2: Ajukan Pertanyaan
              </span>
              <h2 class="text-base sm:text-lg font-black tracking-tight mt-0.5">Tanya-Tanya Permenko KUR</h2>
            </div>
            <span class="text-[11px] text-blue-200 font-medium">Tiap tahun memiliki ketentuan berbeda</span>
          </div>

          <div id="akur-year-selector" class="flex flex-wrap gap-2">
            ${this.renderYearSelectorButtons()}
          </div>

          <div id="akur-active-year-docs" class="pt-2 border-t border-white/15">
            ${this.renderActiveYearDocs()}
          </div>

          <!-- Chat Input Form (Di Atas) -->
          <form onsubmit="window.AkurModule.handleChatSubmit(event)" class="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div class="relative flex-1">
              <i data-lucide="message-square-text" class="w-4 h-4 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              <input
                id="akur-chat-input"
                type="text"
                autocomplete="off"
                placeholder="${this.selectedYear ? `Ketik pertanyaan terkait Permenko KUR Tahun ${this.selectedYear} (bebas / free text)...` : 'Ketik pertanyaan seputar KUR (AI akan menanyakan tahun Permenko jika belum dipilih)...'}"
                class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-400/40 transition"
              />
            </div>
            <button
              type="submit"
              class="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 transition shrink-0"
            >
              <span>Tanya AI</span>
              <i data-lucide="send" class="w-4 h-4"></i>
            </button>
          </form>

          <!-- Suggested Quick Questions -->
          <div class="flex items-center gap-2 overflow-x-auto pb-0.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-blue-200 shrink-0">Contoh:</span>
            ${quickPrompts.map(q => `
              <button
                type="button"
                onclick="window.AkurModule.askQuickQuestion('${this.escapeHtml(q)}')"
                class="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-white/10 hover:bg-white/20 text-blue-50 border border-white/15 whitespace-nowrap transition shrink-0"
              >
                ${this.escapeHtml(q)}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Chat Answers Feed -->
        <div class="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
          <div class="px-5 py-3 bg-slate-50 border-b border-slate-200/70 flex items-center justify-between text-xs">
            <span class="font-extrabold text-slate-700 flex items-center gap-1.5">
              <i data-lucide="messages-square" class="w-4 h-4 text-blue-600"></i>
              <span>Hasil Jawaban &amp; Rujukan Pasal Permenko</span>
            </span>
            <span class="text-[11px] text-slate-400 font-medium">Jawaban faktual tanpa opini</span>
          </div>
          <div id="akur-chat-feed" class="p-5 sm:p-6 space-y-4 bg-slate-50/50 min-h-[280px] max-h-[540px] overflow-y-auto">
            ${this.renderChatMessages()}
          </div>
        </div>
      </div>
    `;
  }
};
