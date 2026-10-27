import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  DownloadSimple,
  CheckCircle,
  RocketLaunch,
  WarningCircle,
  Sparkle,
  Quotes,
} from '@phosphor-icons/react';
import {
  EksplorasiMeetingData,
  EksplorasiVisualCategory,
  NormalizedEksplorasiSlide,
  ambilMateriEksplorasiKonsep,
  muatPosisiEksplorasi,
  simpanPosisiEksplorasi,
  unduhSlideEksplorasiPdf,
} from '../utils/komponen_eksplorasi_konsep.js';

interface EksplorasiKonsepViewProps {
  meetingId: string;
  userKey: string;
  judulBab: string;
  judulPertemuan: string;
  isCompleted: boolean;
  onMarkCompleted: () => void;
  onContinueNext: () => void;
}

function renderTopicIllustration(
  category: EksplorasiVisualCategory,
  slideIndex: number,
  tagline: string
) {
  const accentVariant = slideIndex % 3;
  const headerTone =
    accentVariant === 0
      ? 'bg-[#1E3A5F] text-[#88D4AB]'
      : accentVariant === 1
        ? 'bg-[#243B53] text-[#D8BD7B]'
        : 'bg-[#527DA8] text-white';

  return (
    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#F4F8FC] via-[#EDF4FB] to-[#E8F5EE] border border-[#527DA8]/25 p-4 sm:p-5 flex flex-col justify-between gap-4">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`px-3 py-1 rounded-lg text-[11px] font-bold tracking-wide font-[var(--font-nav)] ${headerTone}`}
        >
          Ilustrasi Konsep
        </span>
        <span className="text-xs font-semibold text-[#527DA8] tabular-nums">
          Visual #{slideIndex + 1}
        </span>
      </div>

      <div className="flex-1 flex items-center justify-center py-2">
        {category === 'data_tabel' && (
          <svg
            viewBox="0 0 260 170"
            className="w-full max-w-[250px] h-auto drop-shadow-sm"
            role="img"
            aria-label="Visualisasi struktur data baris dan kolom tabel"
          >
            <rect
              x="14"
              y="14"
              width="232"
              height="142"
              rx="12"
              fill="#FFFFFF"
              stroke="#527DA8"
              strokeWidth="2"
            />
            <path
              d="M14 26C14 19.3726 19.3726 14 26 14H234C240.627 14 246 19.3726 246 26V46H14V26Z"
              fill="#1E3A5F"
            />
            <text x="42" y="34" fill="#88D4AB" fontSize="10" fontWeight="700" textAnchor="middle">
              No
            </text>
            <text x="112" y="34" fill="#FFFFFF" fontSize="10" fontWeight="700" textAnchor="middle">
              Atribut Data
            </text>
            <text x="200" y="34" fill="#D8BD7B" fontSize="10" fontWeight="700" textAnchor="middle">
              Nilai
            </text>
            <line x1="68" y1="14" x2="68" y2="156" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="162" y1="14" x2="162" y2="156" stroke="#CBD5E1" strokeWidth="1.5" />
            {[74, 102, 130].map((yPos, idx) => (
              <g key={yPos}>
                <line x1="14" y1={yPos} x2="246" y2={yPos} stroke="#E2E8F0" strokeWidth="1.5" />
                <text x="41" y={yPos - 9} fill="#1E3A5F" fontSize="10" fontWeight="700" textAnchor="middle">
                  0{idx + 1}
                </text>
                <rect x="80" y={yPos - 18} width={idx === 1 ? 66 : 54} height="10" rx="5" fill="#DCEAF5" />
                <rect
                  x="176"
                  y={yPos - 18}
                  width="52"
                  height="10"
                  rx="5"
                  fill={idx === slideIndex % 3 ? '#88D4AB' : '#E1EFE5'}
                />
              </g>
            ))}
            <text x="130" y="148" fill="#527DA8" fontSize="9.5" fontWeight="600" textAnchor="middle">
              Baris (Row) × Kolom (Column)
            </text>
          </svg>
        )}

        {category === 'spreadsheet_formula' && (
          <svg
            viewBox="0 0 260 170"
            className="w-full max-w-[250px] h-auto drop-shadow-sm"
            role="img"
            aria-label="Visualisasi lembar kerja spreadsheet rumus dan grafik"
          >
            <rect x="12" y="12" width="236" height="146" rx="12" fill="#FFFFFF" stroke="#527DA8" strokeWidth="2" />
            <rect x="22" y="22" width="216" height="24" rx="6" fill="#F1F5F9" stroke="#CBD5E1" />
            <text x="34" y="38" fill="#1E3A5F" fontSize="10.5" fontFamily="monospace" fontWeight="700">
              fx =SUM(B2:B5)
            </text>
            <rect x="22" y="56" width="112" height="90" rx="8" fill="#F8FAFC" stroke="#DCEAF5" />
            {[0, 1, 2].map((r) => (
              <g key={r}>
                <rect x="30" y={65 + r * 25} width="42" height="16" rx="4" fill="#DCEAF5" />
                <rect x="78" y={65 + r * 25} width="46" height="16" rx="4" fill={r === 2 ? '#88D4AB' : '#E2E8F0'} />
              </g>
            ))}
            <rect x="144" y="56" width="94" height="90" rx="8" fill="#1E3A5F" />
            <rect x="158" y="106" width="14" height="28" rx="3" fill="#88D4AB" />
            <rect x="183" y="84" width="14" height="50" rx="3" fill="#D8BD7B" />
            <rect x="208" y="70" width="14" height="64" rx="3" fill="#527DA8" />
            <text x="191" y="142" fill="#DCEAF5" fontSize="8.5" fontWeight="600" textAnchor="middle">
              Visual Chart
            </text>
          </svg>
        )}

        {category === 'mesin_pencari' && (
          <svg
            viewBox="0 0 260 170"
            className="w-full max-w-[250px] h-auto drop-shadow-sm"
            role="img"
            aria-label="Visualisasi tahapan mesin pencari crawling indexing ranking"
          >
            <rect x="18" y="16" width="224" height="32" rx="16" fill="#FFFFFF" stroke="#1E3A5F" strokeWidth="2" />
            <circle cx="38" cy="32" r="7" fill="none" stroke="#527DA8" strokeWidth="2.2" />
            <line x1="43" y1="37" x2="48" y2="42" stroke="#527DA8" strokeWidth="2.2" strokeLinecap="round" />
            <text x="58" y="36" fill="#1E3A5F" fontSize="9.5" fontFamily="monospace" fontWeight="700">
              &quot;informatika&quot; site:go.id
            </text>
            {[
              { x: 20, title: '1. Crawling', sub: 'Telusur Web', fill: '#1E3A5F', txt: '#FFFFFF' },
              { x: 98, title: '2. Indexing', sub: 'Katalog Data', fill: '#527DA8', txt: '#FFFFFF' },
              { x: 176, title: '3. Ranking', sub: 'Urut Relevan', fill: '#88D4AB', txt: '#1E3A5F' },
            ].map((step, i) => (
              <g key={step.title}>
                <rect x={step.x} y="72" width="66" height="74" rx="10" fill={step.fill} />
                <text x={step.x + 33} y="103" fill={step.txt} fontSize="9.5" fontWeight="700" textAnchor="middle">
                  {step.title}
                </text>
                <text x={step.x + 33} y="121" fill={step.txt} fontSize="8" opacity="0.9" textAnchor="middle">
                  {step.sub}
                </text>
                {i < 2 && (
                  <path
                    d={`M${step.x + 68} 109 L${step.x + 76} 109`}
                    stroke="#1E3A5F"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                )}
              </g>
            ))}
          </svg>
        )}

        {category === 'literasi_fakta' && (
          <svg
            viewBox="0 0 260 170"
            className="w-full max-w-[250px] h-auto drop-shadow-sm"
            role="img"
            aria-label="Visualisasi verifikasi fakta vs opini dan kredibilitas sumber"
          >
            <rect x="18" y="20" width="104" height="128" rx="12" fill="#FFFFFF" stroke="#88D4AB" strokeWidth="2.5" />
            <circle cx="70" cy="54" r="18" fill="#E1EFE5" />
            <path d="M62 54L68 60L79 48" fill="none" stroke="#1E3A5F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <text x="70" y="92" fill="#1E3A5F" fontSize="11" fontWeight="700" textAnchor="middle">
              FAKTA VALID
            </text>
            <text x="70" y="110" fill="#527DA8" fontSize="8.5" fontWeight="600" textAnchor="middle">
              .go.id • .ac.id
            </text>
            <text x="70" y="126" fill="#64748B" fontSize="8" textAnchor="middle">
              Bukti &amp; Data Teruji
            </text>

            <rect x="138" y="20" width="104" height="128" rx="12" fill="#FFFBEB" stroke="#D8BD7B" strokeWidth="2" />
            <circle cx="190" cy="54" r="18" fill="#FAF3E1" />
            <text x="190" y="60" fill="#926B16" fontSize="18" fontWeight="800" textAnchor="middle">
              ?
            </text>
            <text x="190" y="92" fill="#1E3A5F" fontSize="11" fontWeight="700" textAnchor="middle">
              CEK ULANG
            </text>
            <text x="190" y="110" fill="#926B16" fontSize="8.5" fontWeight="600" textAnchor="middle">
              Opini / Clickbait
            </text>
            <text x="190" y="126" fill="#64748B" fontSize="8" textAnchor="middle">
              Saring Sebelum Sharing
            </text>
          </svg>
        )}

        {category === 'dokumen_presentasi' && (
          <svg
            viewBox="0 0 260 170"
            className="w-full max-w-[250px] h-auto drop-shadow-sm"
            role="img"
            aria-label="Visualisasi tata letak dokumen pengolah kata dan slide presentasi"
          >
            <rect x="20" y="16" width="102" height="138" rx="8" fill="#FFFFFF" stroke="#527DA8" strokeWidth="2" />
            <rect x="32" y="28" width="78" height="10" rx="3" fill="#1E3A5F" />
            <rect x="32" y="46" width="78" height="6" rx="3" fill="#CBD5E1" />
            <rect x="32" y="57" width="78" height="6" rx="3" fill="#CBD5E1" />
            <rect x="32" y="72" width="38" height="36" rx="5" fill="#88D4AB" />
            <rect x="76" y="74" width="34" height="6" rx="3" fill="#94A3B8" />
            <rect x="76" y="85" width="34" height="6" rx="3" fill="#94A3B8" />
            <rect x="76" y="96" width="34" height="6" rx="3" fill="#94A3B8" />
            <text x="71" y="138" fill="#527DA8" fontSize="8.5" fontWeight="700" textAnchor="middle">
              Dokumen A4
            </text>

            <path d="M126 85 H142" stroke="#1E3A5F" strokeWidth="2.5" strokeDasharray="3 3" />

            <rect x="146" y="34" width="96" height="68" rx="8" fill="#1E3A5F" />
            <rect x="156" y="46" width="52" height="8" rx="3" fill="#88D4AB" />
            <rect x="156" y="60" width="74" height="6" rx="3" fill="#DCEAF5" />
            <rect x="156" y="72" width="60" height="6" rx="3" fill="#D8BD7B" />
            <text x="194" y="122" fill="#1E3A5F" fontSize="9" fontWeight="700" textAnchor="middle">
              Slide &amp; Integrasi OLE
            </text>
          </svg>
        )}

        {category === 'berpikir_komputasional' && (
          <svg
            viewBox="0 0 260 170"
            className="w-full max-w-[250px] h-auto drop-shadow-sm"
            role="img"
            aria-label="Visualisasi empat pilar berpikir komputasional"
          >
            {[
              { x: 18, y: 18, label: 'Dekomposisi', sub: 'Pecah Masalah', fill: '#1E3A5F', txt: '#88D4AB' },
              { x: 138, y: 18, label: 'Pola Data', sub: 'Cari Kesamaan', fill: '#527DA8', txt: '#FFFFFF' },
              { x: 18, y: 94, label: 'Abstraksi', sub: 'Fokus Inti', fill: '#D8BD7B', txt: '#1E3A5F' },
              { x: 138, y: 94, label: 'Algoritma', sub: 'Langkah Urut', fill: '#88D4AB', txt: '#1E3A5F' },
            ].map((item) => (
              <g key={item.label}>
                <rect x={item.x} y={item.y} width="104" height="58" rx="11" fill={item.fill} />
                <text x={item.x + 52} y={item.y + 27} fill={item.txt} fontSize="10.5" fontWeight="700" textAnchor="middle">
                  {item.label}
                </text>
                <text x={item.x + 52} y={item.y + 43} fill={item.txt} fontSize="8.5" opacity="0.92" textAnchor="middle">
                  {item.sub}
                </text>
              </g>
            ))}
          </svg>
        )}

        {category === 'algoritma_pseudocode' && (
          <svg
            viewBox="0 0 260 170"
            className="w-full max-w-[250px] h-auto drop-shadow-sm"
            role="img"
            aria-label="Diagram alur logika algoritma percabangan dan perulangan"
          >
            <rect x="85" y="10" width="90" height="26" rx="13" fill="#1E3A5F" />
            <text x="130" y="27" fill="#88D4AB" fontSize="9.5" fontWeight="700" textAnchor="middle">
              READ Input
            </text>
            <line x1="130" y1="36" x2="130" y2="52" stroke="#1E3A5F" strokeWidth="2" />
            <polygon points="130,52 182,82 130,112 78,82" fill="#D8BD7B" stroke="#1E3A5F" strokeWidth="1.8" />
            <text x="130" y="85" fill="#1E3A5F" fontSize="9.5" fontWeight="800" textAnchor="middle">
              IF Kondisi?
            </text>
            <path d="M78 82 H38 V126" fill="none" stroke="#1E3A5F" strokeWidth="2" />
            <path d="M182 82 H222 V126" fill="none" stroke="#1E3A5F" strokeWidth="2" />
            <rect x="12" y="126" width="68" height="28" rx="7" fill="#88D4AB" />
            <text x="46" y="144" fill="#1E3A5F" fontSize="9" fontWeight="700" textAnchor="middle">
              TRUE: Aksi A
            </text>
            <rect x="180" y="126" width="68" height="28" rx="7" fill="#527DA8" />
            <text x="214" y="144" fill="#FFFFFF" fontSize="9" fontWeight="700" textAnchor="middle">
              ELSE: Aksi B
            </text>
          </svg>
        )}

        {category === 'scratch_visual' && (
          <svg
            viewBox="0 0 260 170"
            className="w-full max-w-[250px] h-auto drop-shadow-sm"
            role="img"
            aria-label="Susunan blok pemrograman visual Scratch"
          >
            <rect x="24" y="16" width="168" height="28" rx="8" fill="#EAB308" />
            <text x="36" y="34" fill="#1E3A5F" fontSize="9.5" fontWeight="800">
              When Green Flag Clicked
            </text>
            <rect x="24" y="46" width="188" height="96" rx="8" fill="#F97316" />
            <text x="36" y="64" fill="#FFFFFF" fontSize="9.5" fontWeight="800">
              forever / repeat (10)
            </text>
            <rect x="42" y="72" width="158" height="26" rx="6" fill="#2563EB" />
            <text x="54" y="89" fill="#FFFFFF" fontSize="9" fontWeight="700">
              move (10) steps • x:0 y:0
            </text>
            <rect x="42" y="102" width="158" height="26" rx="6" fill="#7C3AED" />
            <text x="54" y="119" fill="#FFFFFF" fontSize="9" fontWeight="700">
              say &quot;Halo!&quot; • Skor + 1
            </text>
            <circle cx="228" cy="40" r="18" fill="#1E3A5F" />
            <text x="228" y="44" fill="#88D4AB" fontSize="9" fontWeight="800" textAnchor="middle">
              X,Y
            </text>
          </svg>
        )}

        {category === 'perangkat_keras' && (
          <svg
            viewBox="0 0 260 170"
            className="w-full max-w-[250px] h-auto drop-shadow-sm"
            role="img"
            aria-label="Arsitektur sistem komputer input CPU RAM dan output"
          >
            <rect x="14" y="62" width="54" height="44" rx="8" fill="#527DA8" />
            <text x="41" y="87" fill="#FFFFFF" fontSize="9.5" fontWeight="700" textAnchor="middle">
              INPUT
            </text>
            <line x1="68" y1="84" x2="88" y2="84" stroke="#1E3A5F" strokeWidth="2.5" />

            <rect x="88" y="24" width="84" height="76" rx="10" fill="#1E3A5F" stroke="#88D4AB" strokeWidth="2" />
            <text x="130" y="46" fill="#88D4AB" fontSize="10.5" fontWeight="800" textAnchor="middle">
              PROSESOR
            </text>
            <rect x="98" y="55" width="64" height="16" rx="4" fill="#243B53" />
            <text x="130" y="66" fill="#FFFFFF" fontSize="8" fontWeight="700" textAnchor="middle">
              CU + ALU
            </text>
            <text x="130" y="88" fill="#D8BD7B" fontSize="7.5" fontWeight="600" textAnchor="middle">
              Fetch•Decode•Exec
            </text>

            <line x1="130" y1="100" x2="130" y2="118" stroke="#1E3A5F" strokeWidth="2.5" />
            <rect x="88" y="118" width="84" height="34" rx="8" fill="#D8BD7B" />
            <text x="130" y="139" fill="#1E3A5F" fontSize="9.5" fontWeight="800" textAnchor="middle">
              RAM &amp; Storage
            </text>

            <line x1="172" y1="84" x2="192" y2="84" stroke="#1E3A5F" strokeWidth="2.5" />
            <rect x="192" y="62" width="54" height="44" rx="8" fill="#88D4AB" />
            <text x="219" y="87" fill="#1E3A5F" fontSize="9.5" fontWeight="800" textAnchor="middle">
              OUTPUT
            </text>
          </svg>
        )}

        {category === 'jaringan_internet' && (
          <svg
            viewBox="0 0 260 170"
            className="w-full max-w-[250px] h-auto drop-shadow-sm"
            role="img"
            aria-label="Topologi jaringan komputer router switch Wi-Fi dan IP DNS"
          >
            <line x1="130" y1="85" x2="52" y2="38" stroke="#527DA8" strokeWidth="2.2" />
            <line x1="130" y1="85" x2="208" y2="38" stroke="#527DA8" strokeWidth="2.2" />
            <line x1="130" y1="85" x2="52" y2="134" stroke="#527DA8" strokeWidth="2.2" />
            <line x1="130" y1="85" x2="208" y2="134" stroke="#527DA8" strokeWidth="2.2" />

            <circle cx="130" cy="85" r="28" fill="#1E3A5F" stroke="#88D4AB" strokeWidth="2.5" />
            <text x="130" y="82" fill="#88D4AB" fontSize="9" fontWeight="800" textAnchor="middle">
              ROUTER
            </text>
            <text x="130" y="95" fill="#FFFFFF" fontSize="7.5" textAnchor="middle">
              Switch / LAN
            </text>

            {[
              { x: 16, y: 20, t: 'PC Klien', s: '192.168.1.2' },
              { x: 172, y: 20, t: 'DNS Server', s: 'Domain → IP' },
              { x: 16, y: 118, t: 'Wi-Fi / 5G', s: 'Nirkabel' },
              { x: 172, y: 118, t: 'Fiber / UTP', s: 'RJ-45 & Laser' },
            ].map((n) => (
              <g key={n.t}>
                <rect x={n.x} y={n.y} width="72" height="36" rx="8" fill="#FFFFFF" stroke="#527DA8" strokeWidth="1.6" />
                <text x={n.x + 36} y={n.y + 16} fill="#1E3A5F" fontSize="8.5" fontWeight="700" textAnchor="middle">
                  {n.t}
                </text>
                <text x={n.x + 36} y={n.y + 28} fill="#527DA8" fontSize="7.5" textAnchor="middle">
                  {n.s}
                </text>
              </g>
            ))}
          </svg>
        )}

        {category === 'keamanan_siber' && (
          <svg
            viewBox="0 0 260 170"
            className="w-full max-w-[250px] h-auto drop-shadow-sm"
            role="img"
            aria-label="Ilustrasi perisai keamanan siber enkripsi HTTPS dan autentikasi dua faktor"
          >
            <path
              d="M130 16 L194 40 V86 C194 122 166 146 130 158 C94 146 66 122 66 86 V40 Z"
              fill="#1E3A5F"
              stroke="#88D4AB"
              strokeWidth="3"
            />
            <rect x="108" y="76" width="44" height="34" rx="7" fill="#88D4AB" />
            <path
              d="M118 76 V64 C118 57 123 52 130 52 C137 52 142 57 142 64 V76"
              fill="none"
              stroke="#D8BD7B"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="130" cy="91" r="4" fill="#1E3A5F" />
            <line x1="130" y1="95" x2="130" y2="103" stroke="#1E3A5F" strokeWidth="3" strokeLinecap="round" />
            <text x="130" y="132" fill="#FFFFFF" fontSize="9.5" fontWeight="700" textAnchor="middle">
              HTTPS • 2FA • Firewall
            </text>
          </svg>
        )}

        {category === 'kewargaan_digital' && (
          <svg
            viewBox="0 0 260 170"
            className="w-full max-w-[250px] h-auto drop-shadow-sm"
            role="img"
            aria-label="Ilustrasi kewargaan digital sehat etika komunikasi dan rekam jejak positif"
          >
            <rect x="22" y="22" width="134" height="72" rx="14" fill="#1E3A5F" />
            <text x="89" y="50" fill="#88D4AB" fontSize="10" fontWeight="800" textAnchor="middle">
              WARGA DIGITAL BIJAK
            </text>
            <text x="89" y="68" fill="#DCEAF5" fontSize="8.5" textAnchor="middle">
              Netiquette • Privasi • Empati
            </text>
            <text x="89" y="82" fill="#D8BD7B" fontSize="8" fontWeight="700" textAnchor="middle">
              Jejak Digital Positif
            </text>

            <rect x="104" y="84" width="134" height="64" rx="14" fill="#FFFFFF" stroke="#88D4AB" strokeWidth="2.2" />
            <text x="171" y="109" fill="#1E3A5F" fontSize="9.5" fontWeight="800" textAnchor="middle">
              Karya &amp; Hak Cipta (CC)
            </text>
            <text x="171" y="126" fill="#527DA8" fontSize="8.5" fontWeight="600" textAnchor="middle">
              Reach • Engagement Sehat
            </text>
          </svg>
        )}
      </div>

      <p className="text-xs font-medium text-[#243B53] text-center leading-relaxed border-t border-[#527DA8]/15 pt-2.5">
        {tagline}
      </p>
    </div>
  );
}

export const EksplorasiKonsepView: React.FC<EksplorasiKonsepViewProps> = ({
  meetingId,
  userKey,
  judulBab,
  judulPertemuan,
  isCompleted,
  onMarkCompleted,
  onContinueNext,
}) => {
  const [meetingData, setMeetingData] = useState<EksplorasiMeetingData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [visitedIndices, setVisitedIndices] = useState<number[]>([0]);
  const [animDirection, setAnimDirection] = useState<'next' | 'prev' | 'idle'>(
    'idle'
  );

  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pdfFeedback, setPdfFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Muat materi eksplorasi_konsep.json sesuai pertemuan aktif
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setPdfFeedback(null);

    ambilMateriEksplorasiKonsep(meetingId)
      .then((res) => {
        if (cancelled) return;
        setMeetingData(res);
        if (res && res.slides.length > 0) {
          const saved = muatPosisiEksplorasi(
            userKey,
            meetingId,
            res.slides.length - 1
          );
          setCurrentIndex(saved.currentIndex);
          setVisitedIndices(saved.visitedIndices);
        } else {
          setCurrentIndex(0);
          setVisitedIndices([0]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat materi Eksplorasi Konsep.'
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meetingId, userKey]);

  const totalSlides = meetingData?.slides.length || 0;

  const navigateToIndex = useCallback(
    (targetIdx: number, direction: 'next' | 'prev') => {
      if (!meetingData || totalSlides === 0) return;
      if (targetIdx < 0 || targetIdx >= totalSlides) return;

      setAnimDirection(direction);
      setPdfFeedback(null);
      setCurrentIndex(targetIdx);

      setVisitedIndices((prev) => {
        const updated = prev.includes(targetIdx) ? prev : [...prev, targetIdx];
        simpanPosisiEksplorasi(userKey, meetingId, targetIdx, updated);
        return updated;
      });

      // Tandai selesai otomatis saat siswa mencapai bagian akhir presentasi
      if (targetIdx === totalSlides - 1 && !isCompleted) {
        onMarkCompleted();
      }
    },
    [meetingData, totalSlides, userKey, meetingId, isCompleted, onMarkCompleted]
  );

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      navigateToIndex(currentIndex - 1, 'prev');
    }
  }, [currentIndex, navigateToIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalSlides - 1) {
      navigateToIndex(currentIndex + 1, 'next');
    }
  }, [currentIndex, totalSlides, navigateToIndex]);

  // Reset arah transisi setelah animasi kamera Prezi selesai
  useEffect(() => {
    if (animDirection === 'idle') return;
    const timer = window.setTimeout(() => {
      setAnimDirection('idle');
    }, 220);
    return () => window.clearTimeout(timer);
  }, [animDirection, currentIndex]);

  // Dukungan tombol panah kiri dan kanan keyboard tanpa event listener ganda
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handlePrev, handleNext]);

  const activeSlide: NormalizedEksplorasiSlide | null =
    meetingData && meetingData.slides[currentIndex]
      ? meetingData.slides[currentIndex]
      : null;

  const handleDownloadPdf = async () => {
    if (!activeSlide || !meetingData || isDownloadingPdf) return;
    setIsDownloadingPdf(true);
    setPdfFeedback(null);

    try {
      await unduhSlideEksplorasiPdf({
        slide: activeSlide,
        posisiSekarang: currentIndex + 1,
        totalMateri: totalSlides,
        judulBab,
        judulPertemuan,
        meetingId,
      });
      setPdfFeedback({
        type: 'success',
        message: 'PDF bagian materi ini berhasil diunduh.',
      });
    } catch (err) {
      setPdfFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Gagal membuat file PDF. Silakan coba kembali.',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl p-8 text-center text-[#1E3A5F] font-[var(--font-nav)] shadow-sm">
        Memuat ruang presentasi Eksplorasi Konsep...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white border-2 border-[#E57373] rounded-2xl p-6 text-center text-[#243447] shadow-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#E57373] mb-2">
          <WarningCircle size={28} weight="fill" />
        </div>
        <h3 className="text-base font-bold text-[#991B1B] mb-1">
          Gagal Memuat Materi Eksplorasi Konsep
        </h3>
        <p className="text-sm text-[#607286]">{loadError}</p>
      </div>
    );
  }

  if (!meetingData || !activeSlide) {
    return (
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl p-8 text-center text-[#243447] shadow-sm">
        <p className="text-sm text-[#607286]">
          Materi Eksplorasi Konsep belum tersedia untuk pertemuan ini.
        </p>
      </div>
    );
  }

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalSlides - 1;
  const hasReachedEnd = isCompleted || isLast || visitedIndices.includes(totalSlides - 1);

  const stageTransitionClass =
    animDirection === 'next'
      ? 'opacity-90 translate-x-2 scale-[0.985]'
      : animDirection === 'prev'
        ? 'opacity-90 -translate-x-2 scale-[0.985]'
        : 'opacity-100 translate-x-0 scale-100';

  return (
    <div className="flex flex-col gap-5 text-[#243447]">
      {/* Kontainer Utama Putih Selaras Tema Informatika Fun */}
      <div className="bg-white border-2 border-[#88D4AB]/55 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-[0_14px_34px_rgba(21,44,91,0.16)] flex flex-col gap-5">
        {/* Bar Kontrol Atas: Indikator Posisi & Unduh PDF Materi Aktif */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#527DA8] font-[var(--font-nav)] font-semibold">
            <span className="text-[#1E3A5F] font-bold">Eksplorasi Materi</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums text-[#1E3A5F] font-bold">
              {currentIndex + 1} dari {totalSlides}
            </span>
          </div>

          <button
            type="button"
            id="btn-unduh-pdf-eksplorasi"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="inline-flex items-center gap-2 bg-[#1E3A5F] hover:bg-[#152C5B] disabled:opacity-60 text-white px-4 py-2 rounded-xl font-[var(--font-nav)] font-bold text-xs sm:text-sm cursor-pointer transition duration-150 whitespace-nowrap shrink-0 shadow-sm active:scale-[0.98]"
          >
            <DownloadSimple size={17} weight="bold" className="text-[#88D4AB]" />
            <span>{isDownloadingPdf ? 'Menyiapkan PDF...' : '↓ Unduh PDF'}</span>
          </button>
        </div>

        {pdfFeedback && (
          <div
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 ${
              pdfFeedback.type === 'success'
                ? 'bg-[#E8F8EE] border border-[#88D4AB] text-[#065F46]'
                : 'bg-[#FEE2E2] border border-[#E57373] text-[#991B1B]'
            }`}
          >
            {pdfFeedback.type === 'success' ? (
              <CheckCircle size={17} weight="fill" className="shrink-0" />
            ) : (
              <WarningCircle size={17} weight="fill" className="shrink-0" />
            )}
            <span>{pdfFeedback.message}</span>
          </div>
        )}

        {/* Kanvas Presentasi Interaktif Bergaya Prezi */}
        <div
          className={`rounded-2xl bg-[#F8FAFC] border border-[#527DA8]/20 p-5 sm:p-7 min-h-[340px] flex flex-col justify-between transition-all duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none ${stageTransitionClass}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
            {/* Zona Kiri (7 kolom): Judul & Struktur Materi Tanpa Kata SLIDE */}
            <div className="lg:col-span-7 flex flex-col justify-center gap-4">
              {activeSlide.kind === 'pembuka' ? (
                <div className="flex flex-col gap-3 py-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#527DA8] font-[var(--font-nav)]">
                    <Sparkle size={16} weight="fill" className="text-[#D8BD7B]" />
                    <span>{activeSlide.subjudul || 'INFORMATIKA SMP'}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] leading-snug text-balance">
                    {activeSlide.judul}
                  </h2>
                  <div className="w-16 h-1.5 rounded-full bg-[#88D4AB] my-1" />
                  <p className="text-sm sm:text-base text-[#527DA8] font-medium leading-relaxed">
                    Gunakan tombol panah di bawah atau pada papan ketik untuk menjelajahi setiap konsep secara berurutan.
                  </p>
                </div>
              ) : activeSlide.kind === 'penutup' ? (
                <div className="flex flex-col gap-3.5 py-2">
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-[#3BA776] font-[var(--font-nav)]">
                    <Quotes size={18} weight="fill" />
                    <span>{activeSlide.subjudul}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] leading-tight">
                    {activeSlide.judul}
                  </h2>
                  <div className="bg-white rounded-xl border border-[#88D4AB]/60 p-4 sm:p-5 shadow-xs">
                    <p className="text-base sm:text-lg font-semibold text-[#1E3A5F] leading-relaxed">
                      &ldquo;{activeSlide.isiMentahBersih}&rdquo;
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A5F] leading-snug text-balance">
                    {activeSlide.judul}
                  </h2>
                  <div className="w-12 h-1 rounded-full bg-[#527DA8]" />

                  <div className="flex flex-col gap-3">
                    {activeSlide.blocks.map((block, bIdx) => {
                      if (block.type === 'paragraph') {
                        return (
                          <p
                            key={bIdx}
                            className="text-[0.95rem] sm:text-base text-[#243447] leading-relaxed"
                          >
                            {block.text}
                          </p>
                        );
                      }

                      if (block.type === 'list') {
                        return (
                          <div key={bIdx} className="flex flex-col gap-2.5 mt-0.5">
                            {block.items.map((item, itemIdx) => (
                              <div
                                key={itemIdx}
                                className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-start gap-3 transition duration-150 hover:border-[#527DA8]/50"
                              >
                                <span className="w-6 h-6 rounded-lg bg-[#1E3A5F] text-[#88D4AB] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                                  {block.ordered ? itemIdx + 1 : '•'}
                                </span>
                                <span className="text-sm sm:text-[0.95rem] text-[#243447] leading-relaxed">
                                  {item}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      if (block.type === 'table') {
                        return (
                          <div
                            key={bIdx}
                            className="overflow-x-auto rounded-xl border border-[#527DA8]/30 bg-white"
                          >
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="bg-[#1E3A5F] text-white">
                                  {block.headers.map((h, hIdx) => (
                                    <th
                                      key={hIdx}
                                      className="px-3.5 py-2.5 font-bold text-xs sm:text-sm"
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {block.rows.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className="border-t border-slate-200 odd:bg-white even:bg-[#F8FAFC]"
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td
                                        key={cIdx}
                                        className="px-3.5 py-2 text-[#243447] tabular-nums"
                                      >
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={bIdx}
                          className="bg-[#1E3A5F] text-[#E8F8EE] rounded-xl p-4 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto border border-[#88D4AB]/40"
                        >
                          {block.lines.map((line, lIdx) => (
                            <div key={lIdx} className="whitespace-pre-wrap">
                              {line}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Zona Kanan (5 kolom): Ilustrasi Visual Kontekstual */}
            <div className="lg:col-span-5 flex items-stretch">
              {renderTopicIllustration(
                activeSlide.visualKategori,
                currentIndex,
                activeSlide.visualTagline
              )}
            </div>
          </div>
        </div>

        {/* Navigasi Panah ← dan → beserta Peta Titik Posisi */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            id="btn-eksplorasi-prev"
            onClick={handlePrev}
            disabled={isFirst}
            aria-label="Materi sebelumnya"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#527DA8]/40 bg-[#F8FAFC] hover:bg-[#EDF4FB] disabled:opacity-40 disabled:cursor-not-allowed text-[#1E3A5F] font-[var(--font-nav)] font-bold text-sm cursor-pointer transition duration-150 whitespace-nowrap shrink-0 active:scale-[0.98]"
          >
            <ArrowLeft size={18} weight="bold" />
            <span>← Sebelumnya</span>
          </button>

          {/* Indikator Titik Jejak Presentasi & Angka Posisi */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {meetingData.slides.map((s) => {
                const active = s.index === currentIndex;
                const visited = visitedIndices.includes(s.index);
                return (
                  <button
                    key={s.index}
                    type="button"
                    onClick={() =>
                      navigateToIndex(
                        s.index,
                        s.index >= currentIndex ? 'next' : 'prev'
                      )
                    }
                    aria-label={`Buka bagian ${s.index + 1} dari ${totalSlides}`}
                    className={`h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                      active
                        ? 'w-7 bg-[#1E3A5F]'
                        : visited
                          ? 'w-2.5 bg-[#88D4AB]'
                          : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-xs font-bold text-[#527DA8] font-[var(--font-nav)] tabular-nums">
              {currentIndex + 1} dari {totalSlides}
            </span>
          </div>

          <button
            type="button"
            id="btn-eksplorasi-next"
            onClick={handleNext}
            disabled={isLast}
            aria-label="Materi selanjutnya"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#527DA8] hover:bg-[#1E3A5F] disabled:opacity-40 disabled:cursor-not-allowed text-white font-[var(--font-nav)] font-bold text-sm cursor-pointer transition duration-150 whitespace-nowrap shrink-0 active:scale-[0.98]"
          >
            <span>Selanjutnya →</span>
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>
      </div>

      {/* Bar Bawah Lanjut ke Menu Berikutnya (For Learning) */}
      <div className="max-w-3xl mx-auto w-full bg-[#1E3A5F] border-2 border-[#88D4AB] rounded-xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#88D4AB]/20 border border-[#88D4AB] flex items-center justify-center text-[#88D4AB] shrink-0">
            {hasReachedEnd ? (
              <CheckCircle size={18} weight="fill" />
            ) : (
              <RocketLaunch size={18} weight="duotone" />
            )}
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-white leading-tight">
              {hasReachedEnd
                ? 'Eksplorasi Konsep Selesai Dipelajari!'
                : 'Pelajari Seluruh Bagian Konsep Inti'}
            </h4>
            <p className="text-[11px] sm:text-xs text-[#DCEAF5]">
              {hasReachedEnd
                ? 'Kamu siap menguji pemahaman pada menu For Learning.'
                : `Jelajahi hingga bagian terakhir (${totalSlides} bagian) untuk membuka tahap berikutnya.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={!hasReachedEnd}
          onClick={onContinueNext}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-[var(--font-nav)] font-bold text-xs sm:text-sm transition shrink-0 whitespace-nowrap ${
            hasReachedEnd
              ? 'bg-[#88D4AB] hover:bg-[#74c69a] text-[#1E3A5F] cursor-pointer shadow-sm'
              : 'bg-white/10 text-white/50 cursor-not-allowed'
          }`}
        >
          <span>Lanjut ke For Learning</span>
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
};
