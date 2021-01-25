export interface Campaign {
  title: string;
  label: string;
  logs: Log[];
}

export interface Log {
  index: string;
  name: string;
  images?: Image[];
}

export interface Image {
  y: number;
  file: string;
}

export const Campaigns = [
  {
    title: 'testing',
    label: '로그저장소 뉴메타 테스트',
    logs: [
      {
        index: '28',
        name: '모그레이브 28화 전투 씬',
        images: [
          {
            y: 0,
            file: '0.png',
          },
          {
            y: 3400,
            file: '1.png',
          },
          {
            y: 4600,
            file: '2.png',
          },
          {
            y: 5200,
            file: '3.png',
          },
          {
            y: 6250,
            file: '4.png',
          },
          {
            y: 6600,
            file: '5.png',
          },
          {
            y: 6950,
            file: '6.png',
          },
          {
            y: 7150,
            file: '7.png',
          },
          {
            y: 7410,
            file: '8.png',
          },
          {
            y: 7950,
            file: '9.png',
          },
          {
            y: 8260,
            file: '10.png',
          },
          {
            y: 8350,
            file: '11.png',
          },
          {
            y: 8480,
            file: '12.png',
          },
          {
            y: 8770,
            file: '13.png',
          },
          {
            y: 8950,
            file: '14.png',
          },
          {
            y: 9050,
            file: '15.png',
          },
          {
            y: 9430,
            file: '16.png',
          },
          {
            y: 10180,
            file: '17.png',
          },
          {
            y: 10440,
            file: '18.png',
          },
          {
            y: 10750,
            file: '19.png',
          },
          {
            y: 11050,
            file: '20.png',
          },
          {
            y: 11150,
            file: '21.png',
          },
          {
            y: 11350,
            file: '22.png',
          },
          {
            y: 12050,
            file: '23.png',
          },
          {
            y: 12650,
            file: '24.png',
          },
          {
            y: 13100,
            file: '25.png',
          },
          {
            y: 14580,
            file: '26.png',
          },
          {
            y: 15150,
            file: '27.png',
          },
          {
            y: 15650,
            file: '28.png',
          },
          {
            y: 16000,
            file: '29.png',
          },
          {
            y: 16450,
            file: '30.png',
          },
          {
            y: 17030,
            file: '31.png',
          },
          {
            y: 18920,
            file: '32.png',
          },
          {
            y: 20450,
            file: '33.png',
          },
          {
            y: 22200,
            file: '34.png',
          },
          {
            y: 22760,
            file: '35.png',
          },
          {
            y: 23080,
            file: '36.png',
          },
          {
            y: 24250,
            file: '37.png',
          },
          {
            y: 24900,
            file: '38.png',
          },
          {
            y: 25300,
            file: '39.png',
          },
          {
            y: 26900,
            file: '40.png',
          },
          {
            y: 27450,
            file: '41.png',
          },
          {
            y: 28100,
            file: '42.png',
          },
          {
            y: 28190,
            file: '43.png',
          },
          {
            y: 29450,
            file: '44.png',
          },
          {
            y: 29700,
            file: '45.png',
          },
        ],
      },
    ],
  },
  {
    title: 'morgrave',
    label: '모그레이브 대학의 학생들',
    logs: [
      {
        index: '25',
        name: '25화',
      },
      {
        index: '26',
        name: '26화',
      },
    ],
  },
];