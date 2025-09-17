export interface ReleaseNote {
  version: string;
  title: string;
  date: string;
  summary: string;
  sections: ReleaseSection[];
}

export interface ReleaseSection {
  title: string;
  items: string[];
}
