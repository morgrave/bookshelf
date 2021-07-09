export interface Adventure {
  id: number;
  title: string;
}

export interface Outcome {
  id: string;
  name: string;
  file?: string;
  value: number;
  special?: boolean;
}

export interface NPC {
  id: string;
  name: string;
  desc: string;
  file?: string;
  value?: number;
}

export const Adventures = [
  {
    id: 0,
    title: '고대 문명의 유물 발굴',
  },
  {
    id: 1,
    title: '테스트 중인 모험',
  },
];

export const Outcomes = [
  {
    id: 'basicfee',
    name: '경매장 수수료',
    value: 10,
  },
  {
    id: 'luka',
    name: '루카의 몫',
    value: 0,
    special: true,
  },
  {
    id: 'sasha',
    name: '사샤의 몫',
    value: 0,
    special: true,
  },
  {
    id: 'ariel',
    name: '에리알의 몫',
    value: 0,
    special: true,
  },
  {
    id: 'devin',
    name: '데빈의 몫',
    value: 0,
    special: true,
  },
  {
    id: 'orgrim',
    name: '오그림의 몫',
    value: 0,
    special: true,
  },
  {
    id: 'elaydren',
    name: '엘라이드렌의 몫',
    value: 15,
  },
];

export const NPCs = [
  {
    id: 'elaydren',
    name: '엘라이드렌',
    desc: '비행선을 띄우고, 손에 넣은 유물들을 연구한 뒤 경매장에 처분합니다.',
    file: 'npc_elaydren.png',
    value: 15,
  },
];