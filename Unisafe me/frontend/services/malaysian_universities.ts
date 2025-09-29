// Minimal curated list first; extendable to full Malaysia set.
export interface UniversityRecord {
  id: string;
  name: string;
  center: { latitude: number; longitude: number };
  campusBoundary: Array<{ latitude: number; longitude: number }>;
  coverageRadius: number; // km
  state?: string;
  city?: string;
  aliases?: string[];
}

export const MALAYSIAN_UNIVERSITIES: UniversityRecord[] = [
  {
    id: 'um',
    name: 'University of Malaya (UM)',
    center: { latitude: 3.1201, longitude: 101.6544 },
    campusBoundary: [
      { latitude: 3.1250, longitude: 101.6600 },
      { latitude: 3.1250, longitude: 101.6480 },
      { latitude: 3.1150, longitude: 101.6480 },
      { latitude: 3.1150, longitude: 101.6600 },
    ],
    coverageRadius: 10,
    state: 'Kuala Lumpur',
    city: 'Kuala Lumpur',
    aliases: ['UM', 'Universiti Malaya']
  },
  {
    id: 'mmu-cyberjaya',
    name: 'Multimedia University (MMU) - Cyberjaya',
    center: { latitude: 2.9189, longitude: 101.6565 },
    campusBoundary: [
      { latitude: 2.9230, longitude: 101.6620 },
      { latitude: 2.9230, longitude: 101.6510 },
      { latitude: 2.9140, longitude: 101.6510 },
      { latitude: 2.9140, longitude: 101.6620 },
    ],
    coverageRadius: 10,
    state: 'Selangor',
    city: 'Cyberjaya',
    aliases: ['MMU', 'MMU Cyberjaya']
  },
  {
    id: 'mmu-melaka',
    name: 'Multimedia University (MMU) - Melaka',
    center: { latitude: 2.2189, longitude: 102.2730 },
    campusBoundary: [
      { latitude: 2.2210, longitude: 102.2770 },
      { latitude: 2.2210, longitude: 102.2690 },
      { latitude: 2.2170, longitude: 102.2690 },
      { latitude: 2.2170, longitude: 102.2770 },
    ],
    coverageRadius: 10,
    state: 'Melaka',
    city: 'Ayer Keroh',
    aliases: ['MMU Melaka']
  },
  {
    id: 'ukm',
    name: 'Universiti Kebangsaan Malaysia (UKM)',
    center: { latitude: 2.9300, longitude: 101.7770 },
    campusBoundary: [
      { latitude: 2.9350, longitude: 101.7820 },
      { latitude: 2.9350, longitude: 101.7720 },
      { latitude: 2.9250, longitude: 101.7720 },
      { latitude: 2.9250, longitude: 101.7820 },
    ],
    coverageRadius: 10,
    state: 'Selangor',
    city: 'Bangi',
    aliases: ['UKM', 'National University of Malaysia']
  },
  {
    id: 'upm',
    name: 'Universiti Putra Malaysia (UPM)',
    center: { latitude: 3.0086, longitude: 101.7050 },
    campusBoundary: [
      { latitude: 3.0130, longitude: 101.7110 },
      { latitude: 3.0130, longitude: 101.6990 },
      { latitude: 3.0040, longitude: 101.6990 },
      { latitude: 3.0040, longitude: 101.7110 },
    ],
    coverageRadius: 10,
    state: 'Selangor',
    city: 'Serdang',
    aliases: ['UPM']
  },
  {
    id: 'usm',
    name: 'Universiti Sains Malaysia (USM)',
    center: { latitude: 5.3561, longitude: 100.3017 },
    campusBoundary: [
      { latitude: 5.3610, longitude: 100.3070 },
      { latitude: 5.3610, longitude: 100.2960 },
      { latitude: 5.3510, longitude: 100.2960 },
      { latitude: 5.3510, longitude: 100.3070 },
    ],
    coverageRadius: 10,
    state: 'Pulau Pinang',
    city: 'Gelugor',
    aliases: ['USM']
  },
  {
    id: 'utm',
    name: 'Universiti Teknologi Malaysia (UTM)',
    center: { latitude: 1.5587, longitude: 103.6388 },
    campusBoundary: [
      { latitude: 1.5630, longitude: 103.6440 },
      { latitude: 1.5630, longitude: 103.6330 },
      { latitude: 1.5530, longitude: 103.6330 },
      { latitude: 1.5530, longitude: 103.6440 },
    ],
    coverageRadius: 10,
    state: 'Johor',
    city: 'Skudai',
    aliases: ['UTM']
  },
  {
    id: 'umk',
    name: 'Universiti Malaysia Kelantan (UMK)',
    center: { latitude: 5.7410, longitude: 102.1150 },
    campusBoundary: [
      { latitude: 5.7430, longitude: 102.1190 },
      { latitude: 5.7430, longitude: 102.1110 },
      { latitude: 5.7390, longitude: 102.1110 },
      { latitude: 5.7390, longitude: 102.1190 },
    ],
    coverageRadius: 10,
    state: 'Kelantan',
    city: 'Bachok',
    aliases: ['UMK']
  },
  {
    id: 'uitm-shah-alam',
    name: 'Universiti Teknologi MARA (UiTM) - Shah Alam',
    center: { latitude: 3.0738, longitude: 101.4996 },
    campusBoundary: [
      { latitude: 3.0780, longitude: 101.5050 },
      { latitude: 3.0780, longitude: 101.4940 },
      { latitude: 3.0690, longitude: 101.4940 },
      { latitude: 3.0690, longitude: 101.5050 },
    ],
    coverageRadius: 10,
    state: 'Selangor',
    city: 'Shah Alam',
    aliases: ['UiTM']
  },
  {
    id: 'iium-gombak',
    name: 'International Islamic University Malaysia (IIUM) - Gombak',
    center: { latitude: 3.2515, longitude: 101.7350 },
    campusBoundary: [
      { latitude: 3.2550, longitude: 101.7400 },
      { latitude: 3.2550, longitude: 101.7300 },
      { latitude: 3.2480, longitude: 101.7300 },
      { latitude: 3.2480, longitude: 101.7400 },
    ],
    coverageRadius: 10,
    state: 'Selangor',
    city: 'Gombak',
    aliases: ['IIUM', 'UIAM']
  },
  {
    id: 'uum-sintok',
    name: 'Universiti Utara Malaysia (UUM)',
    center: { latitude: 6.4604, longitude: 100.5030 },
    campusBoundary: [
      { latitude: 6.4650, longitude: 100.5080 },
      { latitude: 6.4650, longitude: 100.4980 },
      { latitude: 6.4560, longitude: 100.4980 },
      { latitude: 6.4560, longitude: 100.5080 },
    ],
    coverageRadius: 10,
    state: 'Kedah',
    city: 'Sintok',
    aliases: ['UUM']
  },
  {
    id: 'upsi-tanjung-malim',
    name: 'Universiti Pendidikan Sultan Idris (UPSI)',
    center: { latitude: 3.6915, longitude: 101.5243 },
    campusBoundary: [
      { latitude: 3.6950, longitude: 101.5290 },
      { latitude: 3.6950, longitude: 101.5200 },
      { latitude: 3.6880, longitude: 101.5200 },
      { latitude: 3.6880, longitude: 101.5290 },
    ],
    coverageRadius: 10,
    state: 'Perak',
    city: 'Tanjung Malim',
    aliases: ['UPSI']
  },
  {
    id: 'utar-kampar',
    name: 'Universiti Tunku Abdul Rahman (UTAR) - Kampar',
    center: { latitude: 4.3339, longitude: 101.1426 },
    campusBoundary: [
      { latitude: 4.3365, longitude: 101.1470 },
      { latitude: 4.3365, longitude: 101.1380 },
      { latitude: 4.3315, longitude: 101.1380 },
      { latitude: 4.3315, longitude: 101.1470 },
    ],
    coverageRadius: 10,
    state: 'Perak',
    city: 'Kampar',
    aliases: ['UTAR']
  },
  {
    id: 'unimas-kota-samarahan',
    name: 'Universiti Malaysia Sarawak (UNIMAS)',
    center: { latitude: 1.4637, longitude: 110.4283 },
    campusBoundary: [
      { latitude: 1.4670, longitude: 110.4330 },
      { latitude: 1.4670, longitude: 110.4240 },
      { latitude: 1.4600, longitude: 110.4240 },
      { latitude: 1.4600, longitude: 110.4330 },
    ],
    coverageRadius: 10,
    state: 'Sarawak',
    city: 'Kota Samarahan',
    aliases: ['UNIMAS']
  },
  {
    id: 'ums-kota-kinabalu',
    name: 'Universiti Malaysia Sabah (UMS)',
    center: { latitude: 6.0367, longitude: 116.1186 },
    campusBoundary: [
      { latitude: 6.0400, longitude: 116.1230 },
      { latitude: 6.0400, longitude: 116.1140 },
      { latitude: 6.0330, longitude: 116.1140 },
      { latitude: 6.0330, longitude: 116.1230 },
    ],
    coverageRadius: 10,
    state: 'Sabah',
    city: 'Kota Kinabalu',
    aliases: ['UMS']
  },
  {
    id: 'umt-kuala-terengganu',
    name: 'Universiti Malaysia Terengganu (UMT)',
    center: { latitude: 5.4112, longitude: 103.0856 },
    campusBoundary: [
      { latitude: 5.4140, longitude: 103.0900 },
      { latitude: 5.4140, longitude: 103.0820 },
      { latitude: 5.4080, longitude: 103.0820 },
      { latitude: 5.4080, longitude: 103.0900 },
    ],
    coverageRadius: 10,
    state: 'Terengganu',
    city: 'Kuala Terengganu',
    aliases: ['UMT']
  },
  {
    id: 'umpsa-gambang',
    name: 'Universiti Malaysia Pahang Al-Sultan Abdullah (UMPSA) - Gambang',
    center: { latitude: 3.7229, longitude: 103.0910 },
    campusBoundary: [
      { latitude: 3.7260, longitude: 103.0960 },
      { latitude: 3.7260, longitude: 103.0860 },
      { latitude: 3.7200, longitude: 103.0860 },
      { latitude: 3.7200, longitude: 103.0960 },
    ],
    coverageRadius: 10,
    state: 'Pahang',
    city: 'Gambang',
    aliases: ['UMP', 'UMPSA']
  },
  {
    id: 'usim-nilai',
    name: 'Universiti Sains Islam Malaysia (USIM)',
    center: { latitude: 2.8403, longitude: 101.7788 },
    campusBoundary: [
      { latitude: 2.8430, longitude: 101.7830 },
      { latitude: 2.8430, longitude: 101.7750 },
      { latitude: 2.8380, longitude: 101.7750 },
      { latitude: 2.8380, longitude: 101.7830 },
    ],
    coverageRadius: 10,
    state: 'Negeri Sembilan',
    city: 'Nilai',
    aliases: ['USIM']
  },
  {
    id: 'uniten-putrajaya',
    name: 'Universiti Tenaga Nasional (UNITEN) - Putrajaya',
    center: { latitude: 2.9705, longitude: 101.7153 },
    campusBoundary: [
      { latitude: 2.9730, longitude: 101.7200 },
      { latitude: 2.9730, longitude: 101.7120 },
      { latitude: 2.9680, longitude: 101.7120 },
      { latitude: 2.9680, longitude: 101.7200 },
    ],
    coverageRadius: 10,
    state: 'Selangor',
    city: 'Kajang/Putrajaya',
    aliases: ['UNITEN']
  },
  {
    id: 'taylor-lakeside',
    name: "Taylor's University - Lakeside Campus",
    center: { latitude: 3.0602, longitude: 101.6167 },
    campusBoundary: [
      { latitude: 3.0630, longitude: 101.6200 },
      { latitude: 3.0630, longitude: 101.6140 },
      { latitude: 3.0580, longitude: 101.6140 },
      { latitude: 3.0580, longitude: 101.6200 },
    ],
    coverageRadius: 10,
    state: 'Selangor',
    city: 'Subang Jaya',
    aliases: ["Taylor's"]
  },
  {
    id: 'monash-malaysia',
    name: 'Monash University Malaysia',
    center: { latitude: 3.0649, longitude: 101.5940 },
    campusBoundary: [
      { latitude: 3.0670, longitude: 101.5980 },
      { latitude: 3.0670, longitude: 101.5900 },
      { latitude: 3.0630, longitude: 101.5900 },
      { latitude: 3.0630, longitude: 101.5980 },
    ],
    coverageRadius: 10,
    state: 'Selangor',
    city: 'Bandar Sunway',
    aliases: ['Monash']
  },
  {
    id: 'sunway-university',
    name: 'Sunway University',
    center: { latitude: 3.0686, longitude: 101.6070 },
    campusBoundary: [
      { latitude: 3.0710, longitude: 101.6100 },
      { latitude: 3.0710, longitude: 101.6040 },
      { latitude: 3.0660, longitude: 101.6040 },
      { latitude: 3.0660, longitude: 101.6100 },
    ],
    coverageRadius: 10,
    state: 'Selangor',
    city: 'Bandar Sunway',
    aliases: ['Sunway']
  },
  {
    id: 'ucsi-cheras',
    name: 'UCSI University - Cheras',
    center: { latitude: 3.0854, longitude: 101.7359 },
    campusBoundary: [
      { latitude: 3.0875, longitude: 101.7385 },
      { latitude: 3.0875, longitude: 101.7335 },
      { latitude: 3.0835, longitude: 101.7335 },
      { latitude: 3.0835, longitude: 101.7385 },
    ],
    coverageRadius: 10,
    state: 'Kuala Lumpur',
    city: 'Cheras',
    aliases: ['UCSI']
  },
  {
    id: 'apu-technology-park',
    name: 'Asia Pacific University of Technology & Innovation (APU)',
    center: { latitude: 3.0553, longitude: 101.7009 },
    campusBoundary: [
      { latitude: 3.0575, longitude: 101.7040 },
      { latitude: 3.0575, longitude: 101.6980 },
      { latitude: 3.0535, longitude: 101.6980 },
      { latitude: 3.0535, longitude: 101.7040 },
    ],
    coverageRadius: 10,
    state: 'Kuala Lumpur',
    city: 'Bukit Jalil',
    aliases: ['APU']
  },
  // TAR UMT (formerly TAR UC) — multiple branches
  {
    id: 'tarumt-setapak',
    name: 'TAR UMT – Kuala Lumpur (Setapak)',
    center: { latitude: 3.2157, longitude: 101.7279 },
    campusBoundary: [
      { latitude: 3.2180, longitude: 101.7310 },
      { latitude: 3.2180, longitude: 101.7250 },
      { latitude: 3.2135, longitude: 101.7250 },
      { latitude: 3.2135, longitude: 101.7310 },
    ],
    coverageRadius: 10,
    state: 'Kuala Lumpur',
    city: 'Setapak',
    aliases: ['TAR UMT', 'TARUC Setapak', 'TAR College Setapak']
  },
  {
    id: 'tarumt-segamat',
    name: 'TAR UMT – Johor (Segamat)',
    center: { latitude: 2.5140, longitude: 102.8150 },
    campusBoundary: [
      { latitude: 2.5165, longitude: 102.8185 },
      { latitude: 2.5165, longitude: 102.8120 },
      { latitude: 2.5115, longitude: 102.8120 },
      { latitude: 2.5115, longitude: 102.8185 },
    ],
    coverageRadius: 10,
    state: 'Johor',
    city: 'Segamat',
    aliases: ['TAR UMT Segamat', 'TARUC Segamat']
  },
  {
    id: 'tarumt-penang',
    name: 'TAR UMT – Penang Branch',
    center: { latitude: 5.4707, longitude: 100.2881 },
    campusBoundary: [
      { latitude: 5.4730, longitude: 100.2915 },
      { latitude: 5.4730, longitude: 100.2850 },
      { latitude: 5.4685, longitude: 100.2850 },
      { latitude: 5.4685, longitude: 100.2915 },
    ],
    coverageRadius: 10,
    state: 'Pulau Pinang',
    city: 'Tanjung Bungah',
    aliases: ['TAR UMT Penang', 'TARUC Penang']
  },
  {
    id: 'tarumt-perak',
    name: 'TAR UMT – Perak Branch (Kampar)',
    center: { latitude: 4.3163, longitude: 101.1420 },
    campusBoundary: [
      { latitude: 4.3185, longitude: 101.1455 },
      { latitude: 4.3185, longitude: 101.1385 },
      { latitude: 4.3140, longitude: 101.1385 },
      { latitude: 4.3140, longitude: 101.1455 },
    ],
    coverageRadius: 10,
    state: 'Perak',
    city: 'Kampar',
    aliases: ['TAR UMT Perak', 'TARUC Kampar']
  },
  {
    id: 'tarumt-johor-bahru',
    name: 'TAR UMT – Johor Bahru Branch',
    center: { latitude: 1.4927, longitude: 103.7414 },
    campusBoundary: [
      { latitude: 1.4950, longitude: 103.7445 },
      { latitude: 1.4950, longitude: 103.7390 },
      { latitude: 1.4905, longitude: 103.7390 },
      { latitude: 1.4905, longitude: 103.7445 },
    ],
    coverageRadius: 10,
    state: 'Johor',
    city: 'Johor Bahru',
    aliases: ['TAR UMT JB', 'TARUC JB']
  },
  {
    id: 'tarumt-kuantan',
    name: 'TAR UMT – Pahang Branch (Kuantan)',
    center: { latitude: 3.8220, longitude: 103.3317 },
    campusBoundary: [
      { latitude: 3.8245, longitude: 103.3350 },
      { latitude: 3.8245, longitude: 103.3285 },
      { latitude: 3.8195, longitude: 103.3285 },
      { latitude: 3.8195, longitude: 103.3350 },
    ],
    coverageRadius: 10,
    state: 'Pahang',
    city: 'Kuantan',
    aliases: ['TAR UMT Kuantan', 'TARUC Kuantan']
  },
  {
    id: 'tarumt-kota-kinabalu',
    name: 'TAR UMT – Sabah Branch (Kota Kinabalu)',
    center: { latitude: 5.9671, longitude: 116.0936 },
    campusBoundary: [
      { latitude: 5.9695, longitude: 116.0970 },
      { latitude: 5.9695, longitude: 116.0900 },
      { latitude: 5.9645, longitude: 116.0900 },
      { latitude: 5.9645, longitude: 116.0970 },
    ],
    coverageRadius: 10,
    state: 'Sabah',
    city: 'Kota Kinabalu',
    aliases: ['TAR UMT Sabah', 'TARUC Sabah']
  },
  {
    id: 'tarumt-kuching',
    name: 'TAR UMT – Sarawak Branch (Kuching)',
    center: { latitude: 1.5205, longitude: 110.3541 },
    campusBoundary: [
      { latitude: 1.5230, longitude: 110.3575 },
      { latitude: 1.5230, longitude: 110.3510 },
      { latitude: 1.5185, longitude: 110.3510 },
      { latitude: 1.5185, longitude: 110.3575 },
    ],
    coverageRadius: 10,
    state: 'Sarawak',
    city: 'Kuching',
    aliases: ['TAR UMT Sarawak', 'TARUC Kuching']
  }
];

// Note: You can extend this list incrementally; downstream UI/search will scale.


