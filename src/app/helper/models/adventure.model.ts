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
    title: '그냥 줏음',
  },
  {
    id: 2,
    title: '엘프 전쟁군주의 보물고',
  },
  {
    id: 3,
    title: '침몰한 밀수품 선박 조사',
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
  {
    id: 'mazzia',
    name: '마지아의 몫',
    value: 15,
  },
  {
    id: 'kalasta',
    name: '칼라스타의 몫',
    value: 20,
  },
  {
    id: 'mallora',
    name: '말로라의 몫',
    value: 4,
  },
];

export const NPCs = [
  {
    id: 'elaydren',
    name: '엘라이드렌 드 캐니스',
    desc: '비행선을 띄우고, 손에 넣은 유물들을 연구한 뒤 경매장에 처분합니다.',
    file: 'npc_elaydren.png',
    value: 15,
  },
  {
    id: 'mazzia',
    name: '마지아 드 리란다',
    desc: '해상, 공중 탈것을 조종할 수 있습니다. 비행선에서 착지하는 첫 전투의 배치 가능 지역이 맵 전체가 됩니다.',
    file: 'npc_mazzia.png',
    value: 15,
  },
  {
    id: 'mallora',
    name: '말로라 제클린',
    desc: '낮은 수준의 전투력을 제공합니다. 체력이 0이 된 아군과 적군이 자동으로 안정화 상태가 됩니다.',
    file: 'npc_mallora.png',
    value: 4,
  },
];
