export default interface ILevel {
  name: string;
  difficulty: number;
  author?: string;
  new?: boolean;
  words: string[];
}
